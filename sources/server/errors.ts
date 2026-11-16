/**
 * Lỗi nghiệp vụ dùng chung cho mọi domain (booking, catalog, contact…).
 *
 * `lib/http.ts#handleApiError` bắt `AppError` nên route handler chỉ cần ném lỗi
 * và để tầng transport map ra response `{ ok: false, error }`.
 */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
