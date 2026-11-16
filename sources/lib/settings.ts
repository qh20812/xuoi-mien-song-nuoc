/**
 * Cấu hình đặt tour: type, giá trị mặc định và hàm chuẩn hoá thuần.
 *
 * Phần đọc database nằm ở `server/settings/get-booking-settings.ts` — `lib/`
 * không được phụ thuộc Prisma, để giữ ranh giới layer.
 */

export type BookingSettings = {
  /** Số ngày tối thiểu phải đặt trước ngày khởi hành. */
  minDaysAhead: number;
  /** Tổng số khách tối đa (người lớn + trẻ em + em bé) trong một đơn. */
  maxGuestsPerOrder: number;
  /** Số giờ giữ chỗ trước khi tự huỷ. */
  holdHours: number;
  /** Khách được tự huỷ khi còn ít nhất bao nhiêu ngày. */
  cancelCutoffDays: number;
};

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  minDaysAhead: 3,
  maxGuestsPerOrder: 20,
  holdHours: 24,
  cancelCutoffDays: 3,
};

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Kẹp cấu hình do admin nhập về khoảng an toàn.
 * Giá trị thiếu hoặc sai kiểu rơi về `DEFAULT_BOOKING_SETTINGS`.
 */
export function normalizeBookingSettings(value: unknown): BookingSettings {
  const raw = asRecord(value);

  return {
    minDaysAhead: clampInt(raw.minDaysAhead, DEFAULT_BOOKING_SETTINGS.minDaysAhead, 0, 60),
    maxGuestsPerOrder: clampInt(
      raw.maxGuestsPerOrder,
      DEFAULT_BOOKING_SETTINGS.maxGuestsPerOrder,
      1,
      50,
    ),
    holdHours: clampInt(raw.holdHours, DEFAULT_BOOKING_SETTINGS.holdHours, 1, 168),
    cancelCutoffDays: clampInt(
      raw.cancelCutoffDays,
      DEFAULT_BOOKING_SETTINGS.cancelCutoffDays,
      0,
      30,
    ),
  };
}
