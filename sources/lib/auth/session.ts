/**
 * Phiên admin phía server: đọc cookie, xác thực JWT, kiểm tra tài khoản còn
 * hoạt động trong database.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth/token";
import { AppError } from "@/server/errors";
import { can, type Capability } from "@/server/auth/permissions";

export type AdminSession = {
  id: number;
  email: string;
  name: string;
  role: string;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifyAdminToken(token);
  if (!claims) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { id: claims.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      tokenVersion: true,
    },
  });

  if (!admin?.isActive) return null;

  // Đổi mật khẩu / khoá tài khoản sẽ tăng tokenVersion ⇒ phiên cũ bị loại.
  if (admin.tokenVersion !== claims.tokenVersion) return null;

  // Lấy `role` từ DB, không từ JWT: hạ quyền có hiệu lực ngay, không phải chờ hết phiên.
  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

/** Dùng trong route handler admin; ném lỗi 401 để handleApiError xử lý. */
export async function requireAdminApi(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new AppError("UNAUTHORIZED", "Phiên đăng nhập đã hết hạn", 401);
  }
  return session;
}

/** Dùng trong server component admin; chuyển hướng về trang đăng nhập. */
export async function requireAdminPage(nextPath?: string): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    const query = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/admin/login${query}`);
  }
  return session;
}

/**
 * Trang cần quyền cụ thể.
 *
 * Trả `null` khi thiếu quyền để page tự render `<AccessDenied />` — không redirect
 * ngầm, vì người dùng cần biết vì sao không vào được. Page luôn phải kiểm tra `null`.
 */
export async function requireCapabilityPage(
  capability: Capability,
  nextPath?: string,
): Promise<AdminSession | null> {
  const session = await requireAdminPage(nextPath);
  return can(session.role, capability) ? session : null;
}

/**
 * Server action cần quyền cụ thể.
 *
 * Action không render được UI nên chặn cứng bằng redirect kèm cờ `denied=1`;
 * dashboard hiện băng cảnh báo tương ứng.
 */
export async function requireCapabilityAction(
  capability: Capability,
  nextPath = "/admin",
): Promise<AdminSession> {
  const session = await requireAdminPage(nextPath);

  if (!can(session.role, capability)) {
    redirect("/admin?denied=1");
  }

  return session;
}

/** Route handler admin cần quyền cụ thể: trả 403 thay vì redirect. */
export async function requireCapabilityApi(
  capability: Capability,
): Promise<AdminSession> {
  const session = await requireAdminApi();

  if (!can(session.role, capability)) {
    throw new AppError(
      "FORBIDDEN",
      "Tài khoản không có quyền thực hiện thao tác này",
      403,
    );
  }

  return session;
}
