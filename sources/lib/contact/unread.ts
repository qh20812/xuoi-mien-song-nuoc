/**
 * Nhãn badge số tin chưa đọc.
 *
 * Trả `null` khi không có tin để component không render badge rỗng.
 * Cap 99+ để sidebar không bị phình khi có nhiều tin.
 */
export function formatUnreadCount(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  const value = Math.trunc(count);
  return value > 99 ? "99+" : String(value);
}
