/**
 * Tiện ích ngày giờ cho nghiệp vụ đặt tour.
 *
 * Toàn bộ "hôm nay" của khách được tính theo múi giờ Việt Nam
 * (Asia/Ho_Chi_Minh), không theo múi giờ server. Các cột DATE trong MySQL
 * được Prisma trả về dạng Date tại 00:00 UTC nên chỉ dùng phần YYYY-MM-DD.
 */

export const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

const vnDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: VN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const vnYearFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: VN_TIME_ZONE,
  year: "numeric",
});

/** Ngày hôm nay theo lịch Việt Nam, dạng YYYY-MM-DD. */
export function todayVN(now: Date = new Date()): string {
  return vnDateFormatter.format(now);
}

/** Năm hiện tại theo múi giờ Việt Nam. */
export function currentYearVN(now: Date = new Date()): number {
  return Number(vnYearFormatter.format(now));
}

/** Chuyển Date lấy từ cột DATE (00:00 UTC) thành YYYY-MM-DD. */
export function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** YYYY-MM-DD -> Date tại 00:00 UTC. */
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Cộng/trừ ngày trên chuỗi YYYY-MM-DD. */
export function addDaysToDateString(value: string, days: number): string {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Số ngày từ `from` đến `to` (to - from), dùng cho chuỗi YYYY-MM-DD. */
export function daysBetweenDateStrings(from: string, to: string): number {
  const diff = parseDateOnly(to).getTime() - parseDateOnly(from).getTime();
  return Math.round(diff / 86_400_000);
}

/**
 * Số ngày còn lại đến ngày khởi hành, tính theo lịch VN.
 * Khởi hành hôm nay = 0; ngày mai = 1; đã qua = số âm.
 */
export function daysUntilDeparture(departureDate: Date, now: Date = new Date()): number {
  return daysBetweenDateStrings(todayVN(now), dateOnly(departureDate));
}

/** Ngày khởi hành có còn cách hôm nay ít nhất `days` ngày không. */
export function isAtLeastDaysAhead(
  departureDate: Date,
  days: number,
  now: Date = new Date(),
): boolean {
  return daysUntilDeparture(departureDate, now) >= days;
}

/**
 * Hạn cuối được tự huỷ: ngày khởi hành trừ số ngày chặn.
 * Ví dụ khởi hành 2026-11-10, chặn 3 ngày -> 2026-11-07.
 */
export function cancelDeadline(departureDate: Date | string, cutoffDays: number): string {
  const departure = typeof departureDate === "string" ? departureDate : dateOnly(departureDate);
  return addDaysToDateString(departure, -cutoffDays);
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000);
}

export function isPast(date: Date, now: Date = new Date()): boolean {
  return date.getTime() < now.getTime();
}

/** ISO string an toàn cho DTO; null nếu không có giá trị. */
export function isoOrNull(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}
