import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth/token";

/**
 * Chặn truy cập trang /admin khi chưa đăng nhập.
 * API admin tự kiểm tra phiên trong từng route handler (xem requireAdminApi),
 * vì proxy không nên phụ thuộc database.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const claims = token ? await verifyAdminToken(token) : null;
  if (claims) return NextResponse.next();

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  const response = NextResponse.redirect(loginUrl);
  if (token) response.cookies.delete(ADMIN_COOKIE);
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
