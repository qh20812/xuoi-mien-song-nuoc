/**
 * D8 · Feature test cho `POST /api/reviews` (route handler thật, DB test).
 *
 * Kiểm 4 nhóm:
 * 1. Đơn `completed` + đúng mã/SĐT → đánh giá `pending`, gắn `orderId`/`tourId`.
 * 2. Chống dò đơn: sai mã và sai SĐT trả **cùng** message.
 * 3. Một đơn chỉ đánh giá một lần (`reviews.order_id` unique) → 409.
 * 4. Chống spam: honeypot, validate, rate limit 3/10 phút/IP.
 *
 * `reviews.phone` là dữ liệu nhạy cảm: test khoá lại việc không rò ra response
 * và không có trong DTO admin.
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

const {
  cleanupTour,
  createTestDeparture,
  createTestOrder,
  createTestTour,
} = await import("@/scripts/tests/helpers/factories");

const { default: prisma } = await import("@/lib/prisma");
const { POST } = await import("@/app/api/reviews/route");
const { resetRateLimit } = await import("@/lib/rate-limit");

const PHONE = "0909123456";
const CODE_A = "XMSN-2099-8101";
const CODE_PENDING = "XMSN-2099-8103";

let tourId = 0;
let orderAId = 0;

function request(body: unknown) {
  return new Request("http://localhost/api/reviews", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    authorName: "Khách kiểm thử",
    rating: 5,
    comment: "Chuyến đi rất đáng tiền, hướng dẫn viên chu đáo.",
    orderCode: CODE_A,
    phone: PHONE,
    ...overrides,
  };
}

async function reviewsFor(code: string) {
  return prisma.review.findMany({
    where: { order: { code } },
    select: { id: true, status: true, orderId: true, tourId: true },
  });
}

before(async () => {
  const tour = await createTestTour(prisma);
  tourId = tour.id;

  const departure = await createTestDeparture(prisma, tourId, {
    daysFromToday: 14,
    capacityTotal: 24,
  });

  const completedA = await createTestOrder(prisma, {
    departureId: departure.id,
    status: "completed",
    phone: PHONE,
    contactName: "Khách đã đi tour",
  });
  orderAId = completedA.id;
  await prisma.order.update({
    where: { id: completedA.id },
    data: { code: CODE_A },
  });

  const pending = await createTestOrder(prisma, {
    departureId: departure.id,
    status: "new",
    phone: PHONE,
  });
  await prisma.order.update({
    where: { id: pending.id },
    data: { code: CODE_PENDING },
  });
});

beforeEach(async () => {
  await prisma.review.deleteMany({ where: { phone: PHONE } });
  resetRateLimit();
});

after(async () => {
  await prisma.review.deleteMany({ where: { phone: PHONE } });
  await cleanupTour(prisma, tourId);
  await prisma.$disconnect();
});

test("đơn completed + đúng mã/SĐT → 201, review pending, gắn orderId", async () => {
  const response = await POST(request(validInput()));

  assert.equal(response.status, 201);

  const text = await response.text();
  assert.equal(JSON.parse(text).ok, true);
  assert.equal(text.includes(PHONE), false, "response không được lộ SĐT");
  assert.equal("id" in JSON.parse(text), false, "response không được lộ id");

  const rows = await reviewsFor(CODE_A);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.status, "pending");
  assert.equal(rows[0]!.orderId, orderAId);
  assert.equal(rows[0]!.tourId, tourId);

  const stored = await prisma.review.findUniqueOrThrow({
    where: { id: rows[0]!.id },
    select: { phone: true, rating: true, comment: true },
  });
  assert.equal(stored.phone, PHONE, "SĐT lưu để đối soát");
  assert.equal(stored.rating, 5);
  assert.ok(stored.comment && stored.comment.length >= 10);

  // Admin DTO thấy huy hiệu "đã đi tour" nhưng không thấy SĐT.
  const { listAdminReviews } = await import("@/server/reviews/admin-reviews");
  const admin = await listAdminReviews({ status: "pending", pageSize: 50 });
  const row = admin.reviews.find((item) => item.id === rows[0]!.id);
  assert.ok(row);
  assert.equal(row.isVerified, true);
  assert.ok(row.tourName, "review gắn tour từ đơn phải hiện tên tour");
  assert.equal(Object.hasOwn(row, "phone"), false);
});

test("sai mã và sai SĐT trả cùng status + message (chống dò đơn)", async () => {
  const wrongCode = await POST(
    request(validInput({ orderCode: "XMSN-2099-9999" })),
  );
  const wrongPhone = await POST(
    request(validInput({ orderCode: CODE_A, phone: "0900000000" })),
  );

  assert.equal(wrongCode.status, 404);
  assert.equal(wrongPhone.status, 404);

  const a = await wrongCode.json();
  const b = await wrongPhone.json();
  assert.deepEqual(a, b, "hai trường hợp phải không phân biệt được");
  assert.equal(a.error.code, "ORDER_NOT_FOUND");
});

test("đơn chưa completed bị coi như không tìm thấy", async () => {
  const response = await POST(
    request(validInput({ orderCode: CODE_PENDING })),
  );

  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error.code, "ORDER_NOT_FOUND");
  assert.equal((await reviewsFor(CODE_PENDING)).length, 0);
});

test("gửi lần 2 cho cùng đơn → 409 REVIEW_EXISTS", async () => {
  assert.equal((await POST(request(validInput()))).status, 201);

  const second = await POST(request(validInput()));
  assert.equal(second.status, 409);

  const body = await second.json();
  assert.equal(body.error.code, "REVIEW_EXISTS");
  assert.equal((await reviewsFor(CODE_A)).length, 1);
});

test("honeypot có giá trị → 400, không ghi DB", async () => {
  const response = await POST(
    request(validInput({ website: "http://spam.example" })),
  );

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error.code, "SPAM");
  assert.equal((await reviewsFor(CODE_A)).length, 0);
});

test("rating ngoài 1–5 và comment ngắn → 400 INVALID_INPUT kèm path", async () => {
  const badRating = await POST(request(validInput({ rating: 6 })));
  assert.equal(badRating.status, 400);
  const ratingBody = await badRating.json();
  assert.equal(ratingBody.error.code, "INVALID_INPUT");
  assert.ok(
    ratingBody.error.details.fields.some(
      (field: { path: string }) => field.path === "rating",
    ),
  );

  const shortComment = await POST(request(validInput({ comment: "ngắn" })));
  assert.equal(shortComment.status, 400);
  const commentBody = await shortComment.json();
  assert.ok(
    commentBody.error.details.fields.some(
      (field: { path: string }) => field.path === "comment",
    ),
  );
});

test("đánh giá chung theo tourSlug → 201, orderId null", async () => {
  const slug = await prisma.tour
    .findUniqueOrThrow({ where: { id: tourId }, select: { slug: true } })
    .then((tour) => tour.slug);

  const response = await POST(
    request({
      authorName: "Khách chưa có đơn",
      rating: 4,
      comment: "Muốn đi thử chuyến này vào tháng sau.",
      tourSlug: slug,
    }),
  );

  assert.equal(response.status, 201);

  const row = await prisma.review.findFirstOrThrow({
    where: { authorName: "Khách chưa có đơn" },
    select: { orderId: true, tourId: true, status: true },
  });
  assert.equal(row.orderId, null);
  assert.equal(row.tourId, tourId);
  assert.equal(row.status, "pending");
});

test("request thứ 4 trong 10 phút bị chặn 429 + retry-after", async () => {
  for (let index = 0; index < 3; index += 1) {
    const response = await POST(
      request(validInput({ website: "http://spam.example" })),
    );
    assert.equal(response.status, 400, `request ${index + 1} phải bị loại`);
  }

  const blocked = await POST(request(validInput()));
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);

  const body = await blocked.json();
  assert.equal(body.error.code, "RATE_LIMITED");
});
