/**
 * T1 · `calculateBookingPreview` — bất biến giá của luồng đặt chỗ.
 *
 * Em bé miễn phí nhưng **vẫn chiếm chỗ**; phụ thu lễ chỉ áp cho người lớn + trẻ em.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateBookingPreview, totalSeats } from "@/lib/booking/preview";
import type { TourDepartureOption } from "@/lib/contracts/tour";

const tour = { priceAdult: 4_000_000, priceChild: 2_800_000 };

function departure(
  overrides: Partial<TourDepartureOption> = {},
): TourDepartureOption {
  return {
    id: 1,
    date: "2026-12-20",
    seatsRemaining: 10,
    priceAdult: 4_500_000,
    priceChild: 3_000_000,
    holidaySurcharge: 0,
    meetingPoint: "Trung tâm Quận 1",
    ...overrides,
  };
}

test("totalSeats: em bé vẫn tính là một chỗ", () => {
  assert.equal(totalSeats({ adults: 2, children: 1, infants: 3 }), 6);
  assert.equal(totalSeats({ adults: 1, children: 0, infants: 0 }), 1);
});

test("em bé miễn phí nhưng vẫn chiếm chỗ", () => {
  const preview = calculateBookingPreview(tour, null, {
    adults: 2,
    children: 1,
    infants: 2,
  });

  assert.equal(preview.seats, 5);
  assert.equal(preview.billedGuests, 3);
  assert.equal(preview.total, 2 * 4_000_000 + 1 * 2_800_000);
});

test("dùng giá của chuyến khởi hành khi có, không có thì rơi về giá tour", () => {
  const withDeparture = calculateBookingPreview(tour, departure(), {
    adults: 1,
    children: 0,
    infants: 0,
  });
  assert.equal(withDeparture.priceAdult, 4_500_000);
  assert.equal(withDeparture.priceChild, 3_000_000);

  const withoutDeparture = calculateBookingPreview(tour, null, {
    adults: 1,
    children: 0,
    infants: 0,
  });
  assert.equal(withoutDeparture.priceAdult, 4_000_000);
  assert.equal(withoutDeparture.priceChild, 2_800_000);
  assert.equal(withoutDeparture.surchargePerPerson, 0);
});

test("phụ thu lễ chỉ áp cho người lớn + trẻ em, không áp cho em bé", () => {
  const preview = calculateBookingPreview(
    tour,
    departure({ holidaySurcharge: 500_000 }),
    { adults: 2, children: 1, infants: 3 },
  );

  assert.equal(preview.surchargePerPerson, 500_000);
  assert.equal(preview.billedGuests, 3);
  assert.equal(preview.total, 2 * 4_500_000 + 1 * 3_000_000 + 3 * 500_000);
});
