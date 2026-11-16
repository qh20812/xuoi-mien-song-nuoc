/**
 * Điều kiện một chuyến được phép đặt — tách thành hàm thuần để unit test
 * không cần database (xem T1/catalog-filter.test.ts).
 *
 * Phải khớp với kiểm tra phía server trong `server/booking/create-order.ts`,
 * nếu lệch thì UI cho chọn nhưng API trả 404/409.
 */
import type { DepartureStatus, TourStatus } from "@prisma/client";
import {
  addDaysToDateString,
  isAtLeastDaysAhead,
  parseDateOnly,
  todayVN,
} from "@/lib/time";

export type BookableDepartureInput = {
  tourStatus: TourStatus;
  status: DepartureStatus;
  departureDate: Date;
  seatsTaken: number;
  capacityTotal: number;
};

export type BookableWindow = {
  /** Số ngày tối thiểu phải đặt trước ngày khởi hành (từ `settings.booking`). */
  minDaysAhead: number;
  /** Cho phép inject "hôm nay" trong test. */
  now?: Date;
};

export function isBookableDeparture(
  departure: BookableDepartureInput,
  window: BookableWindow,
): boolean {
  if (departure.tourStatus !== "published") return false;
  if (departure.status !== "open") return false;
  if (departure.seatsTaken >= departure.capacityTotal) return false;

  return isAtLeastDaysAhead(
    departure.departureDate,
    window.minDaysAhead,
    window.now,
  );
}

/**
 * Ngày sớm nhất còn đặt được, dùng để lọc thô ở tầng Prisma.
 * `isBookableDeparture` vẫn là nguồn sự thật cuối cùng.
 */
export function bookableFrom(window: BookableWindow): Date {
  return parseDateOnly(
    addDaysToDateString(todayVN(window.now), window.minDaysAhead),
  );
}
