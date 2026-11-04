/**
 * Đọc cấu hình đặt tour từ bảng settings (JSON), có giá trị mặc định và
 * chặn giá trị bất thường do admin nhập.
 */
import prisma from "@/lib/prisma";

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

export async function getBookingSettings(): Promise<BookingSettings> {
  const row = await prisma.setting.findUnique({
    where: { key: "booking" },
    select: { value: true },
  });
  const value = asRecord(row?.value);

  return {
    minDaysAhead: clampInt(value.minDaysAhead, DEFAULT_BOOKING_SETTINGS.minDaysAhead, 0, 60),
    maxGuestsPerOrder: clampInt(
      value.maxGuestsPerOrder,
      DEFAULT_BOOKING_SETTINGS.maxGuestsPerOrder,
      1,
      50,
    ),
    holdHours: clampInt(value.holdHours, DEFAULT_BOOKING_SETTINGS.holdHours, 1, 168),
    cancelCutoffDays: clampInt(
      value.cancelCutoffDays,
      DEFAULT_BOOKING_SETTINGS.cancelCutoffDays,
      0,
      30,
    ),
  };
}
