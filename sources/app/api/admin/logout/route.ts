import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions } from "@/lib/auth/token";


export async function POST() {
  const response = NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: "",
    ...adminCookieOptions(0),
  });
  return response;
}
