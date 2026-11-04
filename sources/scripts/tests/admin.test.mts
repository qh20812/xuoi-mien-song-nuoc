/**
 * Test admin: đăng nhập (route handler thật), token, proxy guard và luồng
 * chuyển trạng thái đơn.
 *
 *   node --import tsx --test scripts/tests/admin.test.mts
 *
 * Yêu cầu: TEST_DATABASE_URL trong .env, đã migrate + seed DB test.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import bcrypt from "bcryptjs";

process.loadEnvFile(".env");
if (!process.env.TEST_DATABASE_URL) throw new Error("Thiếu TEST_DATABASE_URL trong .env");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.AUTH_SECRET = "test-auth-secret-at-least-32-characters-long";
process.env.IP_HASH_SALT ??= "test-ip-salt";

const { default: prisma } = await import("@/lib/prisma");
const { createOrder } = await import("@/server/booking/create-order");
const {
  getAdminOrderById,
  updateOrderByAdmin,
} = await import("@/server/booking/admin-update-order");
const { signAdminToken, verifyAdminToken, ADMIN_COOKIE } = await import(
  "@/lib/auth/token"
);
const { resetRateLimit } = await import("@/lib/rate-limit");
const { proxy } = await import("@/proxy");
const { NextRequest } = await import("next/server");

const TEST_EMAIL = "test-admin@xuoiemiensongnuoc.test";
const TEST_PASSWORD = "TestAdmin#2026";
const PHONE = "0907654321";

let adminId = 0;
let departureId = 0;
let original: { capacityTotal: number; seatsTaken: number };

function loginRequest(body: unknown) {
  return new Request("http://localhost/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function orderInput(overrides: Record<string, unknown> = {}) {
  return {
    departureId,
    contactName: "Nguyễn Thị B",
    phone: PHONE,
    adults: 2,
    children: 0,
    infants: 0,
    clientRequestId: randomUUID(),
    ...overrides,
  };
}

before(async () => {
  const tour = await prisma.tour.findFirstOrThrow({
    where: { code: "XMSN-4N3D" },
    select: { id: true },
  });
  const departure = await prisma.tourDeparture.findFirstOrThrow({
    where: {
      tourId: tour.id,
      status: "open",
      departureDate: { gte: new Date(Date.now() + 10 * 86_400_000) },
    },
    orderBy: { departureDate: "asc" },
    select: { id: true, capacityTotal: true, seatsTaken: true },
  });
  departureId = departure.id;
  original = { capacityTotal: departure.capacityTotal, seatsTaken: departure.seatsTaken };

  await prisma.tourDeparture.update({
    where: { id: departureId },
    data: { capacityTotal: Math.max(original.capacityTotal, 20), seatsTaken: 0 },
  });
  await prisma.order.deleteMany({ where: { departureId } });

  const admin = await prisma.adminUser.upsert({
    where: { email: TEST_EMAIL },
    update: {
      passwordHash: await bcrypt.hash(TEST_PASSWORD, 10),
      role: "admin",
      isActive: true,
    },
    create: {
      email: TEST_EMAIL,
      passwordHash: await bcrypt.hash(TEST_PASSWORD, 10),
      name: "Test Admin",
      role: "admin",
      isActive: true,
    },
    select: { id: true },
  });
  adminId = admin.id;
});

after(async () => {
  await prisma.order.deleteMany({ where: { departureId } });
  await prisma.tourDeparture.update({
    where: { id: departureId },
    data: { capacityTotal: original.capacityTotal, seatsTaken: original.seatsTaken },
  });
  await prisma.adminUser.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

test("token admin: ký và xác thực, chống token bị sửa", async () => {
  const token = await signAdminToken({ id: adminId, email: TEST_EMAIL, role: "admin" });
  const claims = await verifyAdminToken(token);
  assert.deepEqual(claims, { id: adminId, email: TEST_EMAIL, role: "admin" });

  const tampered = `${token.slice(0, -2)}xx`;
  assert.equal(await verifyAdminToken(tampered), null);
  assert.equal(await verifyAdminToken("not-a-token"), null);
});

test("đăng nhập: đúng thì đặt cookie, sai thì lỗi chung", async () => {
  resetRateLimit();
  const { POST } = await import("@/app/api/admin/login/route");

  const ok = await POST(loginRequest({ email: TEST_EMAIL, password: TEST_PASSWORD }));
  assert.equal(ok.status, 200);
  const cookie = ok.headers.get("set-cookie") ?? "";
  assert.match(cookie, new RegExp(`${ADMIN_COOKIE}=`));
  assert.match(cookie, /HttpOnly/i);

  const token = cookie.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`))?.[1];
  assert.ok(token);
  const claims = await verifyAdminToken(decodeURIComponent(token!));
  assert.equal(claims?.id, adminId);

  const wrong = await POST(loginRequest({ email: TEST_EMAIL, password: "sai-mat-khau" }));
  assert.equal(wrong.status, 401);

  const unknown = await POST(loginRequest({ email: "khong-ton-tai@example.com", password: "x" }));
  assert.equal(unknown.status, 401);

  const body = (await wrong.json()) as { error: { message: string } };
  assert.match(body.error.message, /không đúng/i);
});

test("đăng nhập: tài khoản bị khoá không vào được", async () => {
  resetRateLimit();
  const { POST } = await import("@/app/api/admin/login/route");

  await prisma.adminUser.update({ where: { id: adminId }, data: { isActive: false } });
  const response = await POST(loginRequest({ email: TEST_EMAIL, password: TEST_PASSWORD }));
  assert.equal(response.status, 401);
  await prisma.adminUser.update({ where: { id: adminId }, data: { isActive: true } });
});

test("proxy chặn /admin khi thiếu phiên và mở cổng /admin/login", async () => {
  const noCookie = await proxy(new NextRequest("http://localhost/admin"));
  assert.equal(noCookie.status, 307);
  assert.match(noCookie.headers.get("location") ?? "", /\/admin\/login\?next=%2Fadmin/);

  const loginPage = await proxy(new NextRequest("http://localhost/admin/login"));
  assert.equal(loginPage.status, 200);

  const token = await signAdminToken({ id: adminId, email: TEST_EMAIL, role: "admin" });
  const withCookie = await proxy(
    new NextRequest("http://localhost/admin", {
      headers: { cookie: `${ADMIN_COOKIE}=${token}` },
    }),
  );
  assert.equal(withCookie.status, 200);

  const badCookie = await proxy(
    new NextRequest("http://localhost/admin/orders", {
      headers: { cookie: `${ADMIN_COOKIE}=broken` },
    }),
  );
  assert.equal(badCookie.status, 307);
});

test("admin chuyển trạng thái: pending -> confirm -> complete, ghi lịch sử + audit", async () => {
  const created = await createOrder(orderInput());
  const order = await prisma.order.findUniqueOrThrow({ where: { code: created.code } });

  const pending = await updateOrderByAdmin(order.id, "pending", adminId, "Đã gọi khách");
  assert.equal(pending.status, "pending");

  const confirmed = await updateOrderByAdmin(order.id, "confirm", adminId);
  assert.equal(confirmed.status, "confirmed");
  const storedConfirmed = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(storedConfirmed.holdExpiresAt, null);
  assert.equal(storedConfirmed.confirmedBy, adminId);

  await assert.rejects(
    () => updateOrderByAdmin(order.id, "pending", adminId),
    (error: unknown) =>
      (error as { code?: string }).code === "INVALID_TRANSITION",
  );

  const completed = await updateOrderByAdmin(order.id, "complete", adminId);
  assert.equal(completed.status, "completed");

  const audit = await prisma.adminAuditLog.findMany({
    where: { entity: "order", entityId: order.id },
    select: { action: true },
  });
  const actions = audit.map((row) => row.action).sort();
  assert.deepEqual(actions, ["order.complete", "order.confirm", "order.pending"]);

  const history = await prisma.orderStatusHistory.count({ where: { orderId: order.id } });
  assert.equal(history, 4); // new + pending + confirm + complete

  assert.equal("lookupToken" in completed, false);
  assert.equal("ipHash" in completed, false);
  assert.equal(completed.phone, PHONE);
});

test("admin huỷ đơn: nhả chỗ và ghi audit", async () => {
  const created = await createOrder(orderInput());
  const order = await prisma.order.findUniqueOrThrow({ where: { code: created.code } });
  const before = await prisma.tourDeparture.findUniqueOrThrow({
    where: { id: departureId },
    select: { seatsTaken: true },
  });

  const cancelled = await updateOrderByAdmin(order.id, "cancel", adminId, "Khách báo huỷ");
  assert.equal(cancelled.status, "cancelled");

  const afterSeats = await prisma.tourDeparture.findUniqueOrThrow({
    where: { id: departureId },
    select: { seatsTaken: true },
  });
  assert.equal(afterSeats.seatsTaken, before.seatsTaken - 2);

  const audit = await prisma.adminAuditLog.findFirst({
    where: { entity: "order", entityId: order.id, action: "order.cancel" },
  });
  assert.ok(audit);

  const detail = await getAdminOrderById(order.id);
  assert.equal(detail.status, "cancelled");
});

test("rate limit đăng nhập: sai quá nhiều lần bị chặn 429", async () => {
  resetRateLimit();
  const { POST } = await import("@/app/api/admin/login/route");

  let last = 0;
  for (let attempt = 0; attempt < 9; attempt++) {
    const response = await POST(loginRequest({ email: TEST_EMAIL, password: "sai" }));
    last = response.status;
  }
  assert.equal(last, 429);
});
