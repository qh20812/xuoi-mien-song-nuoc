import {
  apiError,
  getClientIp,
  handleApiError,
  jsonResponse,
  readJsonLimited,
} from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { createReview } from "@/server/reviews/create-review";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 3;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`reviews:${ip}`, LIMIT, WINDOW_MS);

  if (!limited.allowed) {
    return apiError(
      429,
      "Bạn gửi đánh giá quá nhiều lần, vui lòng thử lại sau ít phút",
      "RATE_LIMITED",
      { retryAfter: limited.retryAfter },
      { "retry-after": String(limited.retryAfter) },
    );
  }

  try {
    await createReview(await readJsonLimited(request));
    return jsonResponse({ ok: true }, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/reviews");
  }
}
