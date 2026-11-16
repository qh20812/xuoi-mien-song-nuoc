/**
 * Adapter gọi API đặt chỗ thật.
 *
 * Trước đây hàm này trả mã đơn giả sau 800ms. Nay gọi `POST /api/orders` và
 * trả nguyên `PublicOrder` do server tạo: client không tự sinh mã, không tự
 * tính hạn giữ chỗ hay tổng tiền.
 */
import { apiRequest, isApiError } from "@/lib/api/client";
import type { BookingRequestInput } from "@/lib/contracts/booking";
import type { PublicOrder } from "@/lib/contracts/order";

type CreateOrderResponse = { ok: true; order: PublicOrder };

export async function submitBookingRequest(
  input: BookingRequestInput,
): Promise<PublicOrder> {
  const payload = await apiRequest<CreateOrderResponse>("/api/orders", {
    method: "POST",
    body: input,
  });

  return payload.order;
}

const ERROR_MESSAGES: Record<string, string> = {
  DEPARTURE_NOT_FOUND:
    "Ngày khởi hành không còn tồn tại. Vui lòng chọn lại chuyến khác.",
  DEPARTURE_CLOSED:
    "Chuyến này đã đóng nhận khách. Vui lòng chọn chuyến khác.",
  DEPARTURE_FULL: "Chuyến này vừa hết chỗ. Vui lòng chọn chuyến khác.",
  DEPARTURE_TOO_SOON:
    "Chuyến khởi hành quá gần ngày đặt. Vui lòng chọn chuyến khác.",
  TOO_MANY_GUESTS: "Số khách vượt quá giới hạn cho phép của một đơn.",
  RATE_LIMITED: "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.",
  INVALID_INPUT:
    "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường được đánh dấu.",
  NETWORK_ERROR:
    "Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng và thử lại.",
};

const FALLBACK_MESSAGE =
  "Không thể gửi yêu cầu giữ chỗ. Vui lòng kiểm tra kết nối và thử lại.";

function firstFieldMessage(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;

  const fields = (details as { fields?: unknown }).fields;
  if (!Array.isArray(fields) || fields.length === 0) return null;

  const first = fields[0] as { message?: unknown } | undefined;
  return typeof first?.message === "string" && first.message.length > 0
    ? first.message
    : null;
}

/**
 * Chuyển lỗi API thành câu tiếng Việt hiển thị được cho khách.
 * `INVALID_INPUT` ưu tiên thông báo của trường sai đầu tiên.
 */
export function bookingErrorMessage(error: unknown): string {
  if (!isApiError(error)) return FALLBACK_MESSAGE;

  if (error.code === "INVALID_INPUT") {
    const fieldMessage = firstFieldMessage(error.details);
    if (fieldMessage) return fieldMessage;
  }

  return ERROR_MESSAGES[error.code] ?? error.message ?? FALLBACK_MESSAGE;
}
