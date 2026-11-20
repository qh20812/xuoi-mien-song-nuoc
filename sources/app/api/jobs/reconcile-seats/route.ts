/**
 * Cron: đối soát `seats_taken` với tổng khách của các đơn còn giữ chỗ.
 *
 * Mặc định chỉ báo cáo; thêm `?fix=1` mới ghi đè (giống CLI `--fix`). `?all=1`
 * bao gồm cả ngày khởi hành đã qua. Bảo vệ bằng `CRON_SECRET`.
 */
import { connection } from "next/server";
import { handleApiError, jsonResponse } from "@/lib/http";
import { assertCronAuthorized } from "@/lib/jobs/cron-auth";
import { reconcileSeats } from "@/server/jobs/reconcile-seats";

export const maxDuration = 60;

const TRUE_FLAGS = new Set(["1", "true", "yes", "on"]);

/** `?fix=1` / `?fix=true` bật cờ; mọi giá trị khác (kể cả thiếu) là tắt. */
export function readFlag(url: URL, name: string): boolean {
  const value = url.searchParams.get(name);
  return value ? TRUE_FLAGS.has(value.trim().toLowerCase()) : false;
}

export async function handleReconcileSeatsCron(request: Request): Promise<Response> {
  try {
    assertCronAuthorized(request);

    const url = new URL(request.url);
    const result = await reconcileSeats({
      fix: readFlag(url, "fix"),
      all: readFlag(url, "all"),
    });

    return jsonResponse({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error, "GET /api/jobs/reconcile-seats");
  }
}

export async function GET(request: Request) {
  await connection();
  return handleReconcileSeatsCron(request);
}
