/**
 * Chuẩn hoá tham số `next` sau khi đăng nhập để tránh open redirect.
 * Chỉ chấp nhận đường dẫn nội bộ bắt đầu bằng /admin.
 */
export function sanitizeNextPath(
  value: string | null | undefined,
  fallback = "/admin",
): string {
  if (!value) return fallback;
  if (!/^\/admin(\/|$|\?)/.test(value)) return fallback;
  if (value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return fallback;
  }
  return value;
}
