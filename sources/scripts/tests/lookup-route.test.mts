/**
 * T2 · Feature test cho tra cứu và huỷ đơn (route handler thật, DB test).
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";

const {
  cleanupTour,
  createTestDeparture,
  createTestOrder,
  createTestTour,
} = await import("@/scripts/tests/helpers/factories");

const { default: prisma } = await import("@/lib/prisma");
const { POST: createOrderRoute } = await import("@/app/api/orders/route");
const { POST: lookupRoute } = await import("@/app/api/orders/lookup/route");
const { POST: cancelRoute } = await import("@/app/api/orders/cancel/route");
const { resetRateLimit } = await import("@/lib/rate-limit");

const PHONE = "0907654321";
const NOT_FOUND_MESSAGE =
  "Không tìm thấy đơn phù hợp với mã đơn và số điện thoại đã nhập";

let tourId = 0;
let departureId = 0;
let earlyDepartureId = 0;
let codeSequence = 0;

function post(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function uniqueOrderCode() {
  codeSequence += 1;
  return `XMSN-2099-${String(9_000 + codeSequence).padStart(4, "0")}`;
}

async function createRealOrder(): Promise<string> {
  const response = await createOrderRoute(
    post("/api/orders", {
      departureId,
      contactName: "Khách kiểm thử",
      phone: PHONE,
      email: null,
      pickupPoint: null,
      customerNote: null,
      adults: 2,
      children: 0,
      infants: 1,
      clientRequestId: randomUUID(),
    }),
  );

  assert.equal(response.status, 201);
  const body = (await response.json()) as { order: { code: string } };
  return body.order.code;
}

async function seatsTaken(id: number): Promise<number> {
  const row = await prisma.tourDeparture.findUniqueOrThrow({
    where: { id },
    select: { seatsTaken: true },
  });
  return row.seatsTaken;
}

before(async () => {
  const tour = await createTestTour(prisma);
  tourId = tour.id;

  const departure = await createTestDeparture(prisma, tourId, {
    daysFromToday: 10,
    capacityTotal: 24,
  });
  departureId = departure.id;

  // Chuyến chỉ còn 1 ngày → quá hạn tự huỷ
  const early = await createTestDeparture(prisma, tourId, {
    daysFromToday: 1,
    capacityTotal: 24,
  });
  earlyDepartureId = early.id;
});

beforeEach(async () => {
  await prisma.order.deleteMany({ where: { tourId } });
  await prisma.tourDeparture.updateMany({
    where: { tourId },
    data: { seatsTaken: 0 },
  });
  resetRateLimit();
});

after(async () => {
  await cleanupTour(prisma, tourId);
  await prisma.$disconnect();
});

test("tra cứu đúng mã + SĐT trả đơn đầy đủ", async () => {
  const code = await createRealOrder();

  const response = await lookupRoute(post("/api/orders/lookup", { code, phone: PHONE }));

  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    ok: boolean;
    order: { code: string; status: string; guests: { seats: number } };
  };

  assert.equal(body.ok, true);
  assert.equal(body.order.code, code);
  assert.equal(body.order.status, "new");
  assert.equal(body.order.guests.seats, 3);
});

test("sai SĐT và mã không tồn tại trả cùng một message", async () => {
  const code = await createRealOrder();

  const wrongPhone = await lookupRoute(
    post("/api/orders/lookup", { code, phone: "0909999999" }),
  );
  const unknownCode = await lookupRoute(
    post("/api/orders/lookup", { code: "XMSN-2026-9999", phone: PHONE }),
  );

  assert.equal(wrongPhone.status, 404);
  assert.equal(unknownCode.status, 404);

  const wrongPhoneBody = (await wrongPhone.json()) as {
    error: { code: string; message: string };
  };
  const unknownCodeBody = (await unknownCode.json()) as {
    error: { code: string; message: string };
  };

  assert.equal(wrongPhoneBody.error.code, "ORDER_NOT_FOUND");
  assert.equal(unknownCodeBody.error.code, "ORDER_NOT_FOUND");
  assert.equal(wrongPhoneBody.error.message, NOT_FOUND_MESSAGE);
  assert.equal(unknownCodeBody.error.message, NOT_FOUND_MESSAGE);
});

test("huỷ đơn nhả chỗ; huỷ lần 2 trả alreadyCancelled và không nhả thêm", async () => {
  const code = await createRealOrder();
  assert.equal(await seatsTaken(departureId), 3);

  const first = await cancelRoute(
    post("/api/orders/cancel", { code, phone: PHONE, reason: "Đổi lịch" }),
  );

  assert.equal(first.status, 200);
  const firstBody = (await first.json()) as {
    order: { status: string; cancelReason: string | null };
  };
  assert.equal(firstBody.order.status, "cancelled");
  assert.equal(firstBody.order.cancelReason, "Đổi lịch");
  assert.equal(await seatsTaken(departureId), 0);

  const second = await cancelRoute(
    post("/api/orders/cancel", { code, phone: PHONE }),
  );

  assert.equal(second.status, 200);
  const secondBody = (await second.json()) as {
    order: { alreadyCancelled?: boolean };
  };
  assert.equal(secondBody.order.alreadyCancelled, true);
  assert.equal(await seatsTaken(departureId), 0, "không được nhả chỗ lần 2");
});

test("huỷ quá hạn tự huỷ trả 409 CANCEL_TOO_LATE", async () => {
  const created = await createTestOrder(prisma, {
    departureId: earlyDepartureId,
    phone: PHONE,
    adults: 1,
  });
  const code = uniqueOrderCode();
  await prisma.order.update({ where: { id: created.id }, data: { code } });

  const response = await cancelRoute(
    post("/api/orders/cancel", { code, phone: PHONE }),
  );

  assert.equal(response.status, 409);
  const body = (await response.json()) as { error: { code: string } };
  assert.equal(body.error.code, "CANCEL_TOO_LATE");
});
