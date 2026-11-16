/**
 * Lỗi nghiệp vụ của domain booking.
 *
 * Kế thừa `AppError` để `lib/http.ts` xử lý thống nhất với các domain khác,
 * đồng thời giữ `code` là union hẹp để nơi gọi switch an toàn.
 */
import { AppError } from "@/server/errors";

export type BookingErrorCode =
  | "INVALID_INPUT"
  | "INVALID_JSON"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "DEPARTURE_NOT_FOUND"
  | "DEPARTURE_CLOSED"
  | "DEPARTURE_FULL"
  | "DEPARTURE_TOO_SOON"
  | "TOO_MANY_GUESTS"
  | "ORDER_NOT_FOUND"
  | "ORDER_EXPIRED"
  | "ORDER_COMPLETED"
  | "ORDER_NOT_CANCELLABLE"
  | "INVALID_TRANSITION"
  | "CANCEL_TOO_LATE"
  | "IDEMPOTENCY_MISMATCH"
  | "CONFLICT"
  | "INTERNAL";

export class BookingError extends AppError {
  declare readonly code: BookingErrorCode;

  constructor(code: BookingErrorCode, message: string, status = 400, details?: unknown) {
    super(code, message, status, details);
  }
}

export function isBookingError(error: unknown): error is BookingError {
  return error instanceof BookingError;
}
