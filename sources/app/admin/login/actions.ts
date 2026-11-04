"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ADMIN_COOKIE, adminCookieOptions, signAdminToken } from "@/lib/auth/token";
import { sanitizeNextPath } from "@/lib/auth/next-path";
import { rateLimit } from "@/lib/rate-limit";
import { authenticateAdmin } from "@/server/auth/authenticate";

const loginSchema = z.object({
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200),
});

export type LoginState = { error?: string };

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  const limited = rateLimit(`admin-login:action:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.allowed) {
    return { error: "Bạn đăng nhập sai quá nhiều lần, vui lòng thử lại sau ít phút." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Vui lòng nhập email và mật khẩu hợp lệ." };
  }

  const admin = await authenticateAdmin(parsed.data.email, parsed.data.password);
  if (!admin) {
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  const token = await signAdminToken({
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });
  (await cookies()).set(ADMIN_COOKIE, token, adminCookieOptions());

  redirect(sanitizeNextPath(String(formData.get("next") ?? "")));
}
