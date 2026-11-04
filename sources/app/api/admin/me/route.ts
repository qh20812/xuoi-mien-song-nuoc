import { connection } from "next/server";
import { handleApiError, jsonResponse } from "@/lib/http";
import { requireAdminApi } from "@/lib/auth/session";

export async function GET() {
  await connection();
  try {
    const admin = await requireAdminApi();
    return jsonResponse({ ok: true, admin });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/me");
  }
}
