/**
 * Xác thực request cron/job bằng `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Vercel Cron tự gửi header này khi project có biến `CRON_SECRET`; scheduler
 * ngoài (GitHub Actions, cron-job.org) phải gửi thủ công. Thiếu biến trên server
 * trả `503` thay vì chạy job không bảo vệ.
 */
import { timingSafeEqual } from "node:crypto";
import { AppError } from "@/server/errors";

export function extractBearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

/**
 * So sánh chuỗi không rò rỉ độ dài/thời gian. Khi độ dài khác nhau vẫn chạy một
 * phép so sánh để nhánh sai không nhanh hơn nhánh đúng một cách rõ rệt.
 */
export function safeTokenEqual(provided: string, expected: string): boolean {
  const left = Buffer.from(provided, "utf8");
  const right = Buffer.from(expected, "utf8");
  if (left.length !== right.length) {
    timingSafeEqual(right, right);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function assertCronAuthorized(
  request: Request,
  secret: string | undefined = process.env.CRON_SECRET,
): void {
  if (!secret) {
    throw new AppError(
      "CRON_DISABLED",
      "Máy chủ chưa cấu hình CRON_SECRET nên không chạy job",
      503,
    );
  }

  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token || !safeTokenEqual(token, secret)) {
    throw new AppError("CRON_UNAUTHORIZED", "Không có quyền chạy job này", 401);
  }
}
