/** Định dạng hiển thị dùng chung. */

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

/** Định dạng tiền dùng cho giao diện public. */
export function formatVndDisplay(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

/** Che số điện thoại trước khi hiển thị lại cho khách. */
export function maskPhone(phone: string): string {
  if (phone.length < 8) return "***";
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

/** YYYY-MM-DD -> DD/MM/YYYY. */
export function formatDateVN(value: string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

/** YYYY-MM-DD -> "Thứ Bảy, 07/11/2026". */
export function formatLongDateVN(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 5)));
}

export function formatDateTimeVN(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** ISO -> "Thứ Tư, 05/11/2026 lúc 22:16". */
export function formatDateTimeLongVN(iso: string | null | undefined): string {
  if (!iso) return "—";
  const time = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
  const date = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));

  return `${date} lúc ${time}`;
}
