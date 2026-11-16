/**
 * T4 · Full flow — catalog → đặt chỗ → tra cứu → huỷ trên route handler thật.
 *
 * Trả lời trực tiếp câu "chức năng có chạy đúng không": nếu một mắt xích bị mock
 * hoặc lệch contract, test này gãy.
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";

const {
  cleanupTour,
  createTestDeparture,
  createTestSettings,
  createTestTour,
  readBookingSettings,
  restoreBookingSettings,
} = await import("@/scripts/tests/helpers/factories");
const { default: prisma } = await import("@/lib/prisma");
const { listBookableTours } = await import(
  "@/server/catalog/list-bookable-tours"
);
const { getSiteSettings } = await import(
  "@/server/settings/get-site-settings"
);
const { POST: createOrderRoute } = await import("@/app/api/orders/route");
const { POST: lookupRoute } = await import("@/app/api/orders/lookup/route");
const { POST: cancelRoute } = await import("@/app/api/orders/cancel/route");
const { resetRateLimit } = await import("@/lib/rate-limit");

const PHONE = "0901234567";
const CAPACITY = 24;

let tourId = 0;
let tourSlug = "";
let departureId = 0;
let initialSeatsTaken = 0;

function post(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function seatsTaken(): Promise<number> {
  const row = await prisma.tourDeparture.findUniqueOrThrow({
    where: { id: departureId },
    select: { seatsTaken: true },
  });
  return row.seatsTaken;
}

before(async () => {
  const tour = await createTestTour(prisma);
  tourId = tour.id;
  tourSlug = tour.slug;

  const departure = await createTestDeparture(prisma, tourId, {
    daysFromToday: 10,
    capacityTotal: CAPACITY,
  });
  departureId = departure.id;
  initialSeatsTaken = departure.seatsTaken;
});

beforeEach(async () => {
  await prisma.order.deleteMany({ where: { tourId } });
  await prisma.tourDeparture.update({
    where: { id: departureId },
    data: { seatsTaken: initialSeatsTaken },
  });
  resetRateLimit();
});

after(async () => {
  await cleanupTour(prisma, tourId);
  await prisma.$disconnect();
});

test("catalog → đặt chỗ → tra cứu → huỷ: chỗ được giữ rồi trả lại", async () => {
  // 1. Catalog trả tour + chuyến thật
  const tours = await listBookableTours();
  const tour = tours.find((item) => item.slug === tourSlug);
  assert.ok(tour, "tour phải có trong catalog");

  const departure = tour.departures.find((item) => item.id === departureId);
  assert.ok(departure, "chuyến phải có trong catalog");
  assert.equal(departure.seatsRemaining, CAPACITY);
  assert.equal(await seatsTaken(), initialSeatsTaken);

  // 2. Đặt chỗ
  const created = await createOrderRoute(
    post("/api/orders", {
      departureId: departure.id,
      contactName: "Khách luồng đầy đủ",
      phone: PHONE,
      email: null,
      pickupPoint: "Quận 1",
      customerNote: null,
      adults: 2,
      children: 0,
      infants: 1,
      clientRequestId: randomUUID(),
    }),
  );

  assert.equal(created.status, 201);
  const createdBody = (await created.json()) as {
    order: { code: string; status: string; guests: { seats: number } };
  };
  const code = createdBody.order.code;

  assert.equal(createdBody.order.status, "new");
  assert.equal(createdBody.order.guests.seats, 3);
  assert.equal(await seatsTaken(), initialSeatsTaken + 3);

  // 3. Tra cứu
  const lookedUp = await lookupRoute(
    post("/api/orders/lookup", { code, phone: PHONE }),
  );

  assert.equal(lookedUp.status, 200);
  const lookedUpBody = (await lookedUp.json()) as {
    order: { code: string; status: string; guests: { seats: number } };
  };
  assert.equal(lookedUpBody.order.code, code);
  assert.equal(lookedUpBody.order.status, "new");
  assert.equal(lookedUpBody.order.guests.seats, 3);

  // 4. Huỷ
  const cancelled = await cancelRoute(
    post("/api/orders/cancel", {
      code,
      phone: PHONE,
      reason: "Kết thúc kiểm thử",
    }),
  );

  assert.equal(cancelled.status, 200);
  const cancelledBody = (await cancelled.json()) as {
    order: { status: string; cancelReason: string | null };
  };
  assert.equal(cancelledBody.order.status, "cancelled");
  assert.equal(cancelledBody.order.cancelReason, "Kết thúc kiểm thử");
  assert.equal(await seatsTaken(), initialSeatsTaken);

  // 5. Lịch sử trạng thái: tạo (null → new) + huỷ (new → cancelled)
  const history = await prisma.orderStatusHistory.findMany({
    where: { order: { code } },
    orderBy: { id: "asc" },
    select: { fromStatus: true, toStatus: true },
  });

  assert.equal(history.length, 2);
  assert.deepEqual(history[0], { fromStatus: null, toStatus: "new" });
  assert.deepEqual(history[1], { fromStatus: "new", toStatus: "cancelled" });

  // 6. Đơn vẫn tồn tại với trạng thái cuối
  const row = await prisma.order.findUnique({
    where: { code },
    select: { status: true, cancelledAt: true },
  });
  assert.equal(row?.status, "cancelled");
  assert.ok(row?.cancelledAt instanceof Date);

  // 7. Catalog thấy chỗ đã được trả lại
  const afterTours = await listBookableTours();
  const afterDeparture = afterTours
    .find((item) => item.slug === tourSlug)
    ?.departures.find((item) => item.id === departureId);

  assert.equal(afterDeparture?.seatsRemaining, CAPACITY);
});

test("cấu hình settings trong DB chảy vào cấu hình UI (B5)", async () => {
  const before = await readBookingSettings(prisma);

  try {
    await createTestSettings(prisma, {
      minDaysAhead: 3,
      holdHours: 12,
      cancelCutoffDays: 5,
      maxGuestsPerOrder: 15,
    });

    const settings = await getSiteSettings();
    assert.equal(settings.booking.holdHours, 12);
    assert.equal(settings.booking.cancelCutoffDays, 5);
    assert.equal(settings.booking.maxGuestsPerOrder, 15);

    // Nội dung thương hiệu vẫn lấy từ fixture, không đọc DB.
    assert.ok(settings.hotline.length > 0);

    // Giá trị rác do admin nhập phải bị kẹp về khoảng an toàn.
    await createTestSettings(prisma, {
      holdHours: 9999,
      cancelCutoffDays: -5,
      maxGuestsPerOrder: 0,
    });

    const clamped = await getSiteSettings();
    assert.equal(clamped.booking.holdHours, 168);
    assert.equal(clamped.booking.cancelCutoffDays, 0);
    assert.equal(clamped.booking.maxGuestsPerOrder, 1);
  } finally {
    await restoreBookingSettings(prisma, before);
  }
});
