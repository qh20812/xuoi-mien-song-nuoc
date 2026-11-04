/**
 * Rate limit trong bộ nhớ (fixed window).
 *
 * Phù hợp với website chạy 1 process Next.js trên VPS. Nếu scale nhiều
 * instance, thay bằng Redis/Upstash cùng interface.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let operationsSinceCleanup = 0;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Số giây phải chờ trước khi thử lại (khi bị chặn). */
  retryAfter: number;
};

function cleanup(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  operationsSinceCleanup += 1;
  if (operationsSinceCleanup >= 500) {
    operationsSinceCleanup = 0;
    cleanup(now);
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count, retryAfter: 0 };
}

/** Chỉ dùng trong test. */
export function resetRateLimit() {
  buckets.clear();
  operationsSinceCleanup = 0;
}
