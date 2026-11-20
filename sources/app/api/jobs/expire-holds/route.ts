/**
 * Cron: giải phóng chỗ của các đơn giữ chỗ đã quá hạn.
 *
 * Bảo vệ bằng `Authorization: Bearer ${CRON_SECRET}`. Vercel Cron tự gửi header
 * này; scheduler ngoài phải gửi thủ công. Lịch chạy nằm ở `vercel.json`.
 */
import { connection } from "next/server";
import { handleApiError, jsonResponse } from "@/lib/http";
import { assertCronAuthorized } from "@/lib/jobs/cron-auth";
import { expireHolds } from "@/server/jobs/expire-holds";

export const maxDuration = 60;

/**
 * Tách khỏi `GET` để test gọi được ngoài request context của Next
 * (`connection()` sẽ ném lỗi khi chạy bằng `node --test`).
 */
export async function handleExpireHoldsCron(request: Request): Promise<Response> {
  try {
    assertCronAuthorized(request);

    const result = await expireHolds();

    return jsonResponse({
      ok: true,
      scanned: result.scanned,
      expired: result.expired,
      skipped: result.skipped,
      seatsReleased: result.seatsReleased,
      remaining: result.remaining,
      orders: result.orders,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/jobs/expire-holds");
  }
}

export async function GET(request: Request) {
  await connection();
  return handleExpireHoldsCron(request);
}
