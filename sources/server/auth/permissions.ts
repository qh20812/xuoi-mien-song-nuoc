/**
 * Ma trận phân quyền khu quản trị.
 *
 * Hàm thuần — không Prisma, không React — nên dùng được ở server component, server
 * action, route handler và unit test.
 *
 * Nguyên tắc: page/action **không** so sánh `role` trực tiếp, luôn hỏi
 * `can(role, capability)`. Thêm vai trò mới chỉ phải sửa bảng dưới đây.
 */

export const CAPABILITIES = [
  "orders:read",
  "orders:write",
  "orders:export",
  "catalog:write",
  "settings:write",
  "content:write",
  "messages:read",
  "messages:write",
  "users:manage",
  "audit:read",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const ADMIN_ROLE_VALUES = ["owner", "admin", "editor"] as const;

export type AdminRoleValue = (typeof ADMIN_ROLE_VALUES)[number];

/**
 * `editor` chỉ làm nội dung (media/ảnh, kiểm duyệt đánh giá) và đọc đơn/hộp thư.
 * Mọi thứ đụng tiền hoặc cấu hình hệ thống đều thuộc `admin`/`owner`.
 */
const ROLE_MATRIX: Record<AdminRoleValue, readonly Capability[]> = {
  owner: CAPABILITIES,
  admin: [
    "orders:read",
    "orders:write",
    "orders:export",
    "catalog:write",
    "settings:write",
    "content:write",
    "messages:read",
    "messages:write",
  ],
  editor: ["orders:read", "content:write", "messages:read", "messages:write"],
};

export function isAdminRoleValue(value: unknown): value is AdminRoleValue {
  return (
    typeof value === "string" &&
    (ADMIN_ROLE_VALUES as readonly string[]).includes(value)
  );
}

export function isCapability(value: unknown): value is Capability {
  return (
    typeof value === "string" &&
    (CAPABILITIES as readonly string[]).includes(value)
  );
}

/** `role` lạ (null, chuỗi rỗng, vai trò chưa khai báo) ⇒ không có quyền gì. */
export function can(
  role: string | null | undefined,
  capability: Capability,
): boolean {
  if (!role) return false;

  const allowed = ROLE_MATRIX[role as AdminRoleValue];
  return allowed ? allowed.includes(capability) : false;
}

/** Danh sách quyền của một vai trò — dùng để lọc menu ở client. */
export function capabilitiesFor(role: string | null | undefined): Capability[] {
  if (!role) return [];

  const allowed = ROLE_MATRIX[role as AdminRoleValue];
  return allowed ? [...allowed] : [];
}
