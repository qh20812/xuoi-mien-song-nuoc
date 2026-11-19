/**
 * D8 · Validate payload đánh giá của khách (`POST /api/reviews`).
 *
 * Thuần zod — không cần DB, chạy trong `npm run test:unit`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { createReviewSchema } from "@/lib/validation/review";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    authorName: "Nguyễn Văn A",
    rating: 5,
    comment: "Chuyến đi rất đáng tiền, hướng dẫn viên chu đáo.",
    ...overrides,
  };
}

test("createReviewSchema: hợp lệ, chuẩn hoá phone/mã đơn và mặc định null", () => {
  const parsed = createReviewSchema.parse(
    payload({
      orderCode: " xmsn-2026-0001 ",
      phone: "+84 901 234 567",
    }),
  );

  assert.equal(parsed.authorName, "Nguyễn Văn A");
  assert.equal(parsed.rating, 5);
  assert.equal(parsed.orderCode, "XMSN-2026-0001");
  assert.equal(parsed.phone, "0901234567");
  assert.equal(parsed.tourSlug, null);
});

test("createReviewSchema: orderCode/phone/tourSlug rỗng đều thành null", () => {
  const parsed = createReviewSchema.parse(
    payload({ orderCode: "   ", phone: "", tourSlug: "" }),
  );

  assert.equal(parsed.orderCode, null);
  assert.equal(parsed.phone, null);
  assert.equal(parsed.tourSlug, null);
});

test("createReviewSchema: rating ngoài 1–5 bị chặn, chuỗi số được ép kiểu", () => {
  assert.throws(() => createReviewSchema.parse(payload({ rating: 0 })));
  assert.throws(() => createReviewSchema.parse(payload({ rating: 6 })));
  assert.equal(createReviewSchema.parse(payload({ rating: "4" })).rating, 4);
});

test("createReviewSchema: comment 10–1000 ký tự", () => {
  assert.throws(() => createReviewSchema.parse(payload({ comment: "ngắn" })));
  assert.throws(() =>
    createReviewSchema.parse(payload({ comment: "a".repeat(1001) })),
  );
  assert.equal(
    createReviewSchema.parse(payload({ comment: "a".repeat(1000) })).comment
      .length,
    1000,
  );
});

test("createReviewSchema: tên hiển thị 2–120 ký tự", () => {
  assert.throws(() => createReviewSchema.parse(payload({ authorName: "A" })));
  assert.throws(() =>
    createReviewSchema.parse(payload({ authorName: "a".repeat(121) })),
  );
});

test("createReviewSchema: phone sai và field lạ bị chặn", () => {
  assert.throws(() =>
    createReviewSchema.parse(payload({ phone: "123" })),
  );
  assert.throws(() =>
    createReviewSchema.parse(payload({ status: "approved" })),
  );
});

test("createReviewSchema: honeypot là tuỳ chọn (route tự loại nếu có giá trị)", () => {
  assert.equal(createReviewSchema.parse(payload()).website, undefined);
  assert.equal(
    createReviewSchema.parse(payload({ website: "http://spam.example" }))
      .website,
    "http://spam.example",
  );
});
