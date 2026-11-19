/**
 * Adapter gửi đánh giá từ trang tra cứu đơn.
 *
 * Trả `{ ok: true }` (không kèm id) để không lộ số lượng đánh giá; lỗi đi qua
 * `ApiError` giữ nguyên `code` để UI phân biệt "đã đánh giá" với lỗi mạng.
 */
import { apiRequest } from "@/lib/api/client";

export type ReviewRequest = {
  authorName: string;
  rating: number;
  comment: string;
  orderCode?: string;
  phone?: string;
  tourSlug?: string;
  /** Honeypot — luôn để rỗng. */
  website?: string;
};

export async function submitReview(input: ReviewRequest): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>("/api/reviews", {
    method: "POST",
    body: input,
  });
}
