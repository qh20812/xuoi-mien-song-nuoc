/**
 * Ký / xác thực JWT phiên admin. Module này chỉ phụ thuộc `jose` và env,
 * không import Prisma hay next/headers để dùng được trong proxy.
 */
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "xmsn_admin";
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

export type AdminTokenClaims = {
  id: number;
  email: string;
  role: string;
};

function secretKey(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export function assertAuthSecret(): Uint8Array {
  const key = secretKey();
  if (!key) {
    throw new Error("Thiếu AUTH_SECRET (phải dài ít nhất 32 ký tự) trong biến môi trường");
  }
  return key;
}

export async function signAdminToken(claims: AdminTokenClaims): Promise<string> {
  const key = assertAuthSecret();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ email: claims.email, role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(claims.id))
    .setIssuedAt(now)
    .setExpirationTime(now + ADMIN_SESSION_SECONDS)
    .sign(key);
}

export async function verifyAdminToken(
  token: string,
): Promise<AdminTokenClaims | null> {
  const key = secretKey();
  if (!key) return null;

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || id <= 0) return null;
    if (typeof payload.email !== "string" || typeof payload.role !== "string") return null;
    return { id, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export function adminCookieOptions(maxAge = ADMIN_SESSION_SECONDS) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
