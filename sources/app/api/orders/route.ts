import { jsonResponse, getClientIp, handleApiError, readJsonLimited, apiError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { createOrder } from "@/server/booking/create-order";


const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`create:${ip}`, LIMIT, WINDOW_MS);
  if (!limited.allowed) {
    return apiError(
      429,
      "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút",
      "RATE_LIMITED",
      { retryAfter: limited.retryAfter },
      { "retry-after": String(limited.retryAfter) },
    );
  }

  try {
    const body = await readJsonLimited(request);
    const order = await createOrder(body, {
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return jsonResponse({ ok: true, order }, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/orders");
  }
}
