/**
 * T1 · `isBookableDeparture` — điều kiện một chuyến được phép đặt.
 *
 * Đây là hàm chặn tái phát blocker B1: UI lọc sai → `POST /api/orders` trả 404/409.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { DepartureStatus, TourStatus } from "@prisma/client";
import { addDaysToDateString, parseDateOnly, todayVN } from "@/lib/time";
import { bookableFrom, isBookableDeparture } from "@/server/catalog/is-bookable";

/** 10:00 sáng 2026-11-06 theo giờ Việt Nam. */
const NOW = new Date("2026-11-06T03:00:00.000Z");
const TODAY = todayVN(NOW);

type Overrides = Partial<{
  tourStatus: TourStatus;
  status: DepartureStatus;
  departureDate: Date;
  seatsTaken: number;
  capacityTotal: number;
}>;

function departure(daysFromToday: number, overrides: Overrides = {}) {
  return {
    tourStatus: "published" as TourStatus,
    status: "open" as DepartureStatus,
    departureDate: parseDateOnly(
      addDaysToDateString(TODAY, daysFromToday),
    ),
    seatsTaken: 0,
    capacityTotal: 24,
    ...overrides,
  };
}

test("biên minDaysAhead: đúng bằng thì nhận, thiếu 1 ngày thì loại", () => {
  const window = { minDaysAhead: 3, now: NOW };

  assert.equal(isBookableDeparture(departure(3), window), true);
  assert.equal(isBookableDeparture(departure(2), window), false);
  assert.equal(isBookableDeparture(departure(0), window), false);
  assert.equal(isBookableDeparture(departure(-1), window), false);
});

test("minDaysAhead = 0 vẫn loại chuyến đã qua", () => {
  const window = { minDaysAhead: 0, now: NOW };

  assert.equal(isBookableDeparture(departure(0), window), true);
  assert.equal(isBookableDeparture(departure(-1), window), false);
});

test("loại tour chưa publish", () => {
  const window = { minDaysAhead: 3, now: NOW };

  assert.equal(
    isBookableDeparture(departure(7, { tourStatus: "draft" }), window),
    false,
  );
  assert.equal(
    isBookableDeparture(departure(7, { tourStatus: "archived" }), window),
    false,
  );
});

test("loại chuyến đóng hoặc đã huỷ", () => {
  const window = { minDaysAhead: 3, now: NOW };

  assert.equal(
    isBookableDeparture(departure(7, { status: "closed" }), window),
    false,
  );
  assert.equal(
    isBookableDeparture(departure(7, { status: "cancelled" }), window),
    false,
  );
});

test("loại chuyến đã đầy, giữ chuyến còn đúng 1 chỗ", () => {
  const window = { minDaysAhead: 3, now: NOW };

  assert.equal(
    isBookableDeparture(
      departure(7, { seatsTaken: 24, capacityTotal: 24 }),
      window,
    ),
    false,
  );
  assert.equal(
    isBookableDeparture(
      departure(7, { seatsTaken: 23, capacityTotal: 24 }),
      window,
    ),
    true,
  );
});

test("bookableFrom trả ngày sớm nhất còn đặt được", () => {
  const from = bookableFrom({ minDaysAhead: 3, now: NOW });

  assert.equal(
    from.toISOString().slice(0, 10),
    addDaysToDateString(TODAY, 3),
  );
});
