import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth/token";

/**
 * Chặn truy cập trang /admin khi chưa đăng nhập.
 * API admin tự kiểm tra phiên trong từng route handler (xem requireAdminApi),
 * vì proxy không nên phụ thuộc database.
 */
export async function proxy(request: NextRequest) {
  const blocked = previewAdminGuard();
  if (blocked) return blocked;

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

/**
 * Preview deployment thường trỏ nhầm `DATABASE_URL` production. Chặn toàn bộ
 * /admin trên Preview để không ai thao tác thật qua bản preview; cần thử admin
 * trên Preview thì đặt `ALLOW_ADMIN_ON_PREVIEW=1` (chỉ cho Preview).
 */
function previewAdminGuard(): NextResponse | null {
  if (process.env.VERCEL_ENV !== "preview") return null;
  if (process.env.ALLOW_ADMIN_ON_PREVIEW === "1") return null;

  return new NextResponse("Trang quản trị bị tắt trên Preview.", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
