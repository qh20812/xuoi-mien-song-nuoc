import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, getClientIp, handleApiError, readJsonLimited } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { ADMIN_COOKIE, adminCookieOptions, signAdminToken } from "@/lib/auth/token";
import { authenticateAdmin } from "@/server/auth/authenticate";


const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Email không hợp lệ")
      .max(160)
      .transform((value) => value.toLowerCase()),
    password: z.string().min(1, "Vui lòng nhập mật khẩu").max(200),
  })
  .strict();

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const windowMs = 15 * 60 * 1000;

  const ipLimit = rateLimit(`admin-login:ip:${ip}`, 8, windowMs);
  if (!ipLimit.allowed) {
    return apiError(
      429,
      "Bạn đăng nhập sai quá nhiều lần, vui lòng thử lại sau",
      "RATE_LIMITED",
      { retryAfter: ipLimit.retryAfter },
      { "retry-after": String(ipLimit.retryAfter) },
    );
  }

  try {
    const body = loginSchema.parse(await readJsonLimited(request));

    const emailLimit = rateLimit(`admin-login:email:${body.email}`, 8, windowMs);
    if (!emailLimit.allowed) {
      return apiError(
        429,
        "Bạn đăng nhập sai quá nhiều lần, vui lòng thử lại sau",
        "RATE_LIMITED",
        { retryAfter: emailLimit.retryAfter },
        { "retry-after": String(emailLimit.retryAfter) },
      );
    }

    const admin = await authenticateAdmin(body.email, body.password);
    if (!admin) {
      return apiError(401, "Email hoặc mật khẩu không đúng", "UNAUTHORIZED");
    }

    const token = await signAdminToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    const response = NextResponse.json(
      {
        ok: true,
        admin: { email: admin.email, name: admin.name, role: admin.role },
      },
      { headers: { "cache-control": "no-store" } },
    );
    response.cookies.set({
      name: ADMIN_COOKIE,
      value: token,
      ...adminCookieOptions(),
    });
    return response;
  } catch (error) {
    return handleApiError(error, "POST /api/admin/login");
  }
}
