/**
 * Lỗi nghiệp vụ có mã và HTTP status để route handler trả về thống nhất.
 */
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

export class BookingError extends Error {
  readonly code: BookingErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: BookingErrorCode, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "BookingError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isBookingError(error: unknown): error is BookingError {
  return error instanceof BookingError;
}
