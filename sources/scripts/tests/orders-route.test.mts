/**
 * T2 · Feature test cho `POST /api/orders` (route handler thật, DB test).
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";

const {
  cleanupTour,
  createTestDeparture,
  createTestTour,
} = await import("@/scripts/tests/helpers/factories");

const { default: prisma } = await import("@/lib/prisma");
const { POST } = await import("@/app/api/orders/route");
const { resetRateLimit } = await import("@/lib/rate-limit");

let tourId = 0;
let departureId = 0;

function request(body: unknown) {
  return new Request("http://localhost/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function orderInput(overrides: Record<string, unknown> = {}) {
  return {
    departureId,
    contactName: "Khách kiểm thử",
    phone: "0901234567",
    email: null,
    pickupPoint: "Quận 1",
    customerNote: null,
    adults: 2,
    children: 1,
    infants: 1,
    clientRequestId: randomUUID(),
    ...overrides,
  };
}

before(async () => {
  const tour = await createTestTour(prisma);
  tourId = tour.id;
  const departure = await createTestDeparture(prisma, tourId, {
    daysFromToday: 10,
    capacityTotal: 24,
  });
  departureId = departure.id;
});

beforeEach(async () => {
  await prisma.order.deleteMany({ where: { tourId } });
  await prisma.tourDeparture.update({
    where: { id: departureId },
    data: { seatsTaken: 0 },
  });
  resetRateLimit();
});

after(async () => {
  await cleanupTour(prisma, tourId);
  await prisma.$disconnect();
});

test("tạo đơn hợp lệ trả 201 + envelope { ok, order }", async () => {
  const response = await POST(request(orderInput()));

  assert.equal(response.status, 201);

  const body = (await response.json()) as {
    ok: boolean;
    order: {
      code: string;
      status: string;
      guests: { seats: number };
      pricing: { unitPriceAdult: number; totalAmount: number };
    };
  };

  assert.equal(body.ok, true);
  assert.match(body.order.code, /^XMSN-\d{4}-\d{4,8}$/);
  assert.equal(body.order.status, "new");
  assert.equal(body.order.guests.seats, 4);
  assert.equal(body.order.pricing.unitPriceAdult, 4_190_000);
  // 2 người lớn + 1 trẻ em; em bé miễn phí
  assert.equal(body.order.pricing.totalAmount, 2 * 4_190_000 + 1 * 2_930_000);
});

test("không rò field nội bộ ra response", async () => {
  const response = await POST(request(orderInput()));
  const body = (await response.json()) as { order: Record<string, unknown> };

  for (const key of ["lookupToken", "ipHash", "adminNote", "id", "tourId"]) {
    assert.equal(key in body.order, false, `${key} không được có trong DTO`);
  }
});

test("số điện thoại sai trả 400 kèm details.fields[].path", async () => {
  const response = await POST(request(orderInput({ phone: "123" })));

  assert.equal(response.status, 400);

  const body = (await response.json()) as {
    ok: boolean;
    error: { code: string; details?: { fields?: Array<{ path: string }> } };
  };

  assert.equal(body.ok, false);
  assert.equal(body.error.code, "INVALID_INPUT");
  assert.ok(
    body.error.details?.fields?.some((field) => field.path === "phone"),
    "phải chỉ ra trường phone",
  );
});

test("request thứ 6 trong 10 phút bị chặn 429 + retry-after", async () => {
  for (let index = 0; index < 5; index += 1) {
    const response = await POST(request(orderInput()));
    assert.equal(response.status, 201, `request ${index + 1} phải thành công`);
  }

  const blocked = await POST(request(orderInput()));

  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
});
