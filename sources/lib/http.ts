/**
 * Tiện ích HTTP dùng chung cho route handlers.
 */
import { createHash } from "node:crypto";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { BookingError, isBookingError } from "@/server/booking/errors";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

export function apiError(
  status: number,
  message: string,
  code: string,
  details?: unknown,
  headers: Record<string, string> = {},
): Response {
  return jsonResponse(
    { ok: false, error: { code, message, ...(details === undefined ? {} : { details }) } },
    status,
    headers,
  );
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || process.env.AUTH_SECRET || "xmsn-dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new BookingError("INVALID_JSON", "Dữ liệu gửi lên không phải JSON hợp lệ", 400);
  }
}

export function handleApiError(error: unknown, context = "api"): Response {
  if (isBookingError(error)) {
    return apiError(error.status, error.message, error.code, error.details);
  }

  if (error instanceof ZodError) {
    return apiError(400, "Dữ liệu chưa hợp lệ", "INVALID_INPUT", {
      fields: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return apiError(409, "Dữ liệu đã tồn tại, vui lòng thử lại", "CONFLICT");
    }
    if (error.code === "P2025") {
      return apiError(404, "Không tìm thấy dữ liệu", "ORDER_NOT_FOUND");
    }
    if (error.code === "P2034") {
      return apiError(
        503,
        "Hệ thống đang bận, vui lòng thử lại sau ít giây",
        "CONFLICT",
        undefined,
        { "retry-after": "2" },
      );
    }
  }

  console.error(`[${context}]`, error);
  return apiError(500, "Có lỗi xảy ra, vui lòng thử lại sau", "INTERNAL");
}

/** Giới hạn body để tránh payload lớn bất thường. */
export async function readJsonLimited(request: Request, maxBytes = 32_768): Promise<unknown> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) {
    throw new BookingError("INVALID_INPUT", "Dữ liệu gửi lên quá lớn", 413);
  }
  return readJson(request);
}
