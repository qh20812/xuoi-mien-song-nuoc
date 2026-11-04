/**
 * Phiên admin phía server: đọc cookie, xác thực JWT, kiểm tra tài khoản còn
 * hoạt động trong database.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth/token";
import { BookingError } from "@/server/booking/errors";

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
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!admin?.isActive) return null;

  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

/** Dùng trong route handler admin; ném lỗi 401 để handleApiError xử lý. */
export async function requireAdminApi(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new BookingError("UNAUTHORIZED", "Phiên đăng nhập đã hết hạn", 401);
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
