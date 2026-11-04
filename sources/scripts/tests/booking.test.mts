/**
 * Test tích hợp booking core trên database test.
 *
 *   node --import tsx --test scripts/tests/booking.test.ts
 *
 * Yêu cầu: TEST_DATABASE_URL trong .env, đã migrate + seed DB test.
 */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import type { DepartureStatus } from "@prisma/client";

process.loadEnvFile(".env");
if (!process.env.TEST_DATABASE_URL) throw new Error("Thiếu TEST_DATABASE_URL trong .env");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.AUTH_SECRET ??= "test-auth-secret-at-least-32-characters-long";
process.env.IP_HASH_SALT ??= "test-ip-salt";

const { default: prisma } = await import("@/lib/prisma");
const { createOrder } = await import("@/server/booking/create-order");
const { lookupOrder } = await import("@/server/booking/lookup-order");
const { cancelOrder, cancelOrderAsAdmin } = await import("@/server/booking/cancel-order");
const { BookingError } = await import("@/server/booking/errors");
const { todayVN, addDaysToDateString, parseDateOnly } = await import("@/lib/time");

const PHONE = "0901234567";
let departureId = 0;
let tourId = 0;
let original: { capacityTotal: number; seatsTaken: number; status: DepartureStatus };

function input(overrides: Record<string, unknown> = {}) {
  return {
    departureId,
    contactName: "Nguyễn Văn A",
    phone: PHONE,
    adults: 2,
    children: 1,
    infants: 1,
    clientRequestId: randomUUID(),
    ...overrides,
  };
}

async function seatsTaken(): Promise<number> {
  const row = await prisma.tourDeparture.findUniqueOrThrow({
    where: { id: departureId },
    select: { seatsTaken: true },
  });
  return row.seatsTaken;
}

async function findNearDeparture() {
  return prisma.tourDeparture.findFirst({
    where: {
      status: "open",
      departureDate: { lt: parseDateOnly(addDaysToDateString(todayVN(), 3)) },
    },
    orderBy: { departureDate: "asc" },
    select: { id: true, tourId: true, departureDate: true },
  });
}

before(async () => {
  const tour = await prisma.tour.findFirstOrThrow({
    where: { code: "XMSN-4N3D" },
    select: { id: true },
  });
  tourId = tour.id;

  const departure = await prisma.tourDeparture.findFirstOrThrow({
    where: {
      tourId,
      status: "open",
      departureDate: { gte: parseDateOnly(addDaysToDateString(todayVN(), 7)) },
    },
    orderBy: { departureDate: "asc" },
    select: { id: true, capacityTotal: true, seatsTaken: true, status: true },
  });

  departureId = departure.id;
  original = {
    capacityTotal: departure.capacityTotal,
    seatsTaken: departure.seatsTaken,
    status: departure.status,
  };
});

beforeEach(async () => {
  await prisma.order.deleteMany({ where: { departureId } });
  await prisma.tourDeparture.update({
    where: { id: departureId },
    data: {
      seatsTaken: 0,
      capacityTotal: Math.max(original.capacityTotal, 20),
      status: "open" as const,
    },
  });
});

after(async () => {
  await prisma.order.deleteMany({ where: { departureId } });
  await prisma.tourDeparture.update({
    where: { id: departureId },
    data: {
      seatsTaken: original.seatsTaken,
      capacityTotal: original.capacityTotal,
      status: original.status,
    },
  });
  await prisma.$disconnect();
});

test("tạo đơn: giữ đúng số chỗ, tính giá server, em bé miễn phí", async () => {
  const order = await createOrder(input(), { ip: "127.0.0.1", userAgent: "test" });

  assert.match(order.code, /^XMSN-\d{4}-\d{4,}$/);
  assert.equal(order.status, "new");
  assert.equal(order.guests.seats, 4);
  assert.equal(order.guests.infants, 1);
  assert.equal(order.guests.adults, 2);
  assert.equal(order.guests.children, 1);
  assert.equal(await seatsTaken(), 4);

  const departure = await prisma.tourDeparture.findUniqueOrThrow({
    where: { id: departureId },
    include: { tour: true },
  });
  const unitAdult = departure.priceAdult ?? departure.tour.basePriceAdult;
  const unitChild = departure.priceChild ?? departure.tour.basePriceChild;
  const surcharge = departure.holidaySurcharge * 3;
  assert.equal(order.pricing.unitPriceAdult, unitAdult);
  assert.equal(order.pricing.unitPriceChild, unitChild);
  assert.equal(order.pricing.surcharge, surcharge);
  assert.equal(order.pricing.totalAmount, 2 * unitAdult + unitChild + surcharge);

  const holdHours = (new Date(order.holdExpiresAt!).getTime() - Date.now()) / 3_600_000;
  assert.ok(holdHours > 23.5 && holdHours <= 24.1, `holdExpiresAt lệch: ${holdHours}h`);

  const passengers = await prisma.orderPassenger.count({
    where: { order: { code: order.code } },
  });
  assert.equal(passengers, 4);
  assert.equal("lookupToken" in order, false);
  assert.equal(order.phoneMasked, "0901***567");
});

test("clientRequestId idempotent: gửi lại không tạo thêm đơn/chỗ", async () => {
  const clientRequestId = randomUUID();
  const first = await createOrder(input({ clientRequestId }));
  const second = await createOrder(input({ clientRequestId }));

  assert.equal(second.code, first.code);
  assert.equal(await seatsTaken(), 4);

  await assert.rejects(
    () => createOrder(input({ clientRequestId, phone: "0912345678" })),
    (error: unknown) =>
      error instanceof BookingError && error.code === "IDEMPOTENCY_MISMATCH",
  );
});

test("chặn dữ liệu sai và đặt quá sát ngày", async (t) => {
  await assert.rejects(
    () => createOrder(input({ adults: 0 })),
    (error: unknown) => (error as { name?: string }).name === "ZodError",
  );
  await assert.rejects(
    () => createOrder(input({ phone: "12345" })),
    (error: unknown) => (error as { name?: string }).name === "ZodError",
  );
  await assert.rejects(
    () => createOrder({ ...input(), totalAmount: 1 }),
    (error: unknown) => (error as { name?: string }).name === "ZodError",
    "không được nhận giá từ client",
  );

  await assert.rejects(
    () => createOrder(input({ adults: 21, children: 0, infants: 0 })),
    (error: unknown) =>
      error instanceof BookingError && error.code === "TOO_MANY_GUESTS",
  );

  const near = await findNearDeparture();
  if (!near) {
    t.skip("Không có ngày khởi hành sát để test");
    return;
  }

  await assert.rejects(
    () =>
      createOrder(
        input({ departureId: near.id, adults: 1, children: 0, infants: 0 }),
      ),
    (error: unknown) =>
      error instanceof BookingError && error.code === "DEPARTURE_TOO_SOON",
  );
});

test("8 request đồng thời tranh 1 chỗ: chỉ 1 đơn thành công", async () => {
  await prisma.tourDeparture.update({
    where: { id: departureId },
    data: { capacityTotal: 1, seatsTaken: 0 },
  });

  const attempts = await Promise.allSettled(
    Array.from({ length: 8 }, () =>
      createOrder(input({ adults: 1, children: 0, infants: 0 })),
    ),
  );

  const ok = attempts.filter((result) => result.status === "fulfilled");
  const failed = attempts.filter((result) => result.status === "rejected");

  assert.equal(ok.length, 1, `thành công=${ok.length}`);
  assert.equal(failed.length, 7);
  assert.equal(await seatsTaken(), 1);

  for (const result of failed) {
    if (result.status !== "rejected") continue;
    assert.ok(result.reason instanceof BookingError);
    assert.equal(result.reason.code, "DEPARTURE_FULL");
  }
});

test("tra cứu: đúng mã + SĐT, sai SĐT trả lỗi chung", async () => {
  const created = await createOrder(input());

  const found = await lookupOrder({ code: created.code.toLowerCase(), phone: "090 123 45 67" });
  assert.equal(found.code, created.code);

  await assert.rejects(
    () => lookupOrder({ code: created.code, phone: "0912345678" }),
    (error: unknown) =>
      error instanceof BookingError &&
      error.code === "ORDER_NOT_FOUND" &&
      !error.message.includes("0912345678"),
  );

  await assert.rejects(
    () => lookupOrder({ code: "XMSN-2099-9999", phone: PHONE }),
    (error: unknown) => error instanceof BookingError && error.code === "ORDER_NOT_FOUND",
  );
});

test("khách huỷ: nhả chỗ, ghi lịch sử, huỷ lại idempotent", async () => {
  const created = await createOrder(input());
  assert.equal(await seatsTaken(), 4);

  const cancelled = await cancelOrder({ code: created.code, phone: PHONE });
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.cancellation.canCancel, false);
  assert.equal(await seatsTaken(), 0);

  const history = await prisma.orderStatusHistory.findMany({
    where: { order: { code: created.code } },
    select: { fromStatus: true, toStatus: true, changedBy: true },
  });
  assert.ok(
    history.some(
      (row) =>
        row.fromStatus === "new" && row.toStatus === "cancelled" && row.changedBy === null,
    ),
  );

  const again = await cancelOrder({ code: created.code, phone: PHONE });
  assert.equal(again.status, "cancelled");
  assert.equal(again.alreadyCancelled, true);
  assert.equal(await seatsTaken(), 0);

  const count = await prisma.orderStatusHistory.count({
    where: { order: { code: created.code }, toStatus: "cancelled" },
  });
  assert.equal(count, 1);

  const lookedUp = await lookupOrder({ code: created.code, phone: PHONE });
  assert.equal(lookedUp.status, "cancelled");
});

test("quá hạn tự huỷ: khách bị chặn, admin được override", async (t) => {
  const near = await findNearDeparture();
  if (!near) {
    t.skip("Không có ngày khởi hành sát để test");
    return;
  }

  const admin = await prisma.adminUser.findFirstOrThrow({ select: { id: true } });
  const code = `XMSN-2099-${9000 + Math.floor(Math.random() * 900)}`;
  const order = await prisma.order.create({
    data: {
      code,
      tourId: near.tourId,
      departureId: near.id,
      contactName: "Khách Sát Ngày",
      phone: PHONE,
      adults: 1,
      unitPriceAdult: 1000000,
      totalAmount: 1000000,
      status: "confirmed",
      source: "web",
      lookupToken: randomBytes(18).toString("base64url"),
      clientRequestId: randomUUID(),
    },
  });

  try {
    await assert.rejects(
      () => cancelOrder({ code, phone: PHONE }),
      (error: unknown) =>
        error instanceof BookingError && error.code === "CANCEL_TOO_LATE",
    );

    const cancelled = await cancelOrderAsAdmin(order.id, admin.id, "Test admin huỷ");
    assert.equal(cancelled.status, "cancelled");
    assert.equal(cancelled.cancelReason, "Test admin huỷ");

    const stored = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(stored.cancelledBy, admin.id);
  } finally {
    await prisma.order.delete({ where: { id: order.id } });
  }
});
