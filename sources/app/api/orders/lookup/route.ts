import { apiError, getClientIp, handleApiError, jsonResponse, readJsonLimited } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { lookupOrder } from "@/server/booking/lookup-order";


const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 15;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`lookup:${ip}`, LIMIT, WINDOW_MS);
  if (!limited.allowed) {
    return apiError(
      429,
      "Bạn tra cứu quá nhiều lần, vui lòng thử lại sau ít phút",
      "RATE_LIMITED",
      { retryAfter: limited.retryAfter },
      { "retry-after": String(limited.retryAfter) },
    );
  }

  try {
    const body = await readJsonLimited(request);
    const order = await lookupOrder(body);
    return jsonResponse({ ok: true, order });
  } catch (error) {
    return handleApiError(error, "POST /api/orders/lookup");
  }
}
