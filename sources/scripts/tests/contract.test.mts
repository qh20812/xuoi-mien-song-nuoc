/**
 * T3 · Contract test — DTO công khai ↔ contract UI.
 *
 * Đây là tầng duy nhất bắt được lỗi âm thầm khi đổi shape API mà `tsc` không thấy,
 * vì `OrderDto` là `ReturnType<typeof toOrderDto>` chứ không phải type tường minh.
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import type { PublicOrder } from "@/lib/contracts/order";

const {
  cleanupTour,
  createTestDeparture,
  createTestTour,
} = await import("@/scripts/tests/helpers/factories");
const { default: prisma } = await import("@/lib/prisma");
const { createOrder } = await import("@/server/booking/create-order");
const { cancelOrder } = await import("@/server/booking/cancel-order");
const { orderDtoToBookingSuccess } = await import("@/lib/booking/success");

/**
 * Danh sách key bắt buộc của `PublicOrder`.
 *
 * Kiểu `Record<Exclude<keyof PublicOrder, "alreadyCancelled">, true>` khiến `tsc`
 * báo lỗi nếu contract thêm field mà test chưa cập nhật.
 */
type RequiredOrderKey = Exclude<keyof PublicOrder, "alreadyCancelled">;

const REQUIRED_ORDER_KEYS: Record<RequiredOrderKey, true> = {
  code: true,
  status: true,
  statusLabel: true,
  contactName: true,
  phoneMasked: true,
  email: true,
  pickupPoint: true,
  customerNote: true,
  guests: true,
  pricing: true,
  tour: true,
  departure: true,
  passengers: true,
  cancellation: true,
  holdExpiresAt: true,
  createdAt: true,
  confirmedAt: true,
  cancelledAt: true,
  cancelReason: true,
};

/** Field nội bộ / vận hành không bao giờ được ra khỏi server. */
const FORBIDDEN_KEYS = [
  "id",
  "tourId",
  "departureId",
  "lookupToken",
  "ipHash",
  "adminNote",
  "userAgent",
  "cancelledBy",
  "confirmedBy",
  "clientRequestId",
];

const PHONE = "0901234567";
const SURCHARGE = 500_000;

let tourId = 0;
let departureId = 0;

function orderInput(overrides: Record<string, unknown> = {}) {
  return {
    departureId,
    contactName: "Khách hợp đồng",
    phone: PHONE,
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
    holidaySurcharge: SURCHARGE,
  });
  departureId = departure.id;
});

beforeEach(async () => {
  await prisma.order.deleteMany({ where: { tourId } });
  await prisma.tourDeparture.update({
    where: { id: departureId },
    data: { seatsTaken: 0 },
  });
});

after(async () => {
  await cleanupTour(prisma, tourId);
  await prisma.$disconnect();
});

test("toOrderDto trả đúng bộ key của PublicOrder, không thừa không thiếu", async () => {
  const dto = await createOrder(orderInput());

  assert.deepEqual(
    Object.keys(dto).sort(),
    Object.keys(REQUIRED_ORDER_KEYS).sort(),
  );
});

test("không rò field nội bộ ra DTO công khai", async () => {
  const dto = await createOrder(orderInput());
  const record = dto as unknown as Record<string, unknown>;

  for (const key of FORBIDDEN_KEYS) {
    assert.equal(key in record, false, `${key} không được có trong DTO`);
  }
});

test("email null đi qua schema và ra DTO là null", async () => {
  const dto = await createOrder(orderInput({ email: null }));

  assert.equal(dto.email, null);
});

test("orderDtoToBookingSuccess lấy số liệu từ server, không tự tính lại", async () => {
  const dto = await createOrder(orderInput());

  // 2 người lớn + 1 trẻ em + phụ thu lễ cho 3 khách (em bé miễn phí)
  const serverTotal =
    2 * 4_190_000 + 1 * 2_930_000 + 3 * SURCHARGE;
  const naiveClientTotal = 2 * 4_190_000 + 1 * 2_930_000;

  assert.equal(dto.pricing.totalAmount, serverTotal);

  const success = orderDtoToBookingSuccess(dto);

  assert.equal(success.totalAmount, dto.pricing.totalAmount);
  assert.equal(success.totalAmount, serverTotal);
  assert.notEqual(
    success.totalAmount,
    naiveClientTotal,
    "mapper phải dùng tổng của server, không bỏ phụ thu",
  );

  assert.equal(success.code, dto.code);
  assert.equal(success.status, dto.status);
  assert.equal(success.statusLabel, dto.statusLabel);
  assert.equal(success.holdExpiresAt, dto.holdExpiresAt);
  assert.equal(success.tourCode, dto.tour.code);
  assert.equal(success.tourSlug, dto.tour.slug);
  assert.equal(success.departureDate, dto.departure.date);
  assert.equal(success.phoneMasked, dto.phoneMasked);
  assert.equal(success.cancellationDeadline, dto.cancellation.deadline);
  assert.equal(success.canCancel, dto.cancellation.canCancel);
  assert.deepEqual(success.guests, {
    adults: dto.guests.adults,
    children: dto.guests.children,
    infants: dto.guests.infants,
  });
});

test("đơn đã huỷ thêm alreadyCancelled nhưng vẫn không rò field nội bộ", async () => {
  const created = await createOrder(orderInput());

  await cancelOrder({ code: created.code, phone: PHONE, reason: "Kiểm thử" });
  const cancelledAgain = await cancelOrder({
    code: created.code,
    phone: PHONE,
  });

  assert.equal(cancelledAgain.status, "cancelled");
  assert.equal(cancelledAgain.alreadyCancelled, true);

  const record = cancelledAgain as unknown as Record<string, unknown>;
  for (const key of FORBIDDEN_KEYS) {
    assert.equal(key in record, false, `${key} không được có trong DTO`);
  }
});
