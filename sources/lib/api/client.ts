/**
 * HTTP client dùng chung cho các adapter gọi API nội bộ
 * (`lib/booking/submit.ts`, `lib/orders/client.ts`, `lib/contact/client.ts`).
 *
 * `baseUrl` và `fetchImpl` cho phép inject trong unit test — `fetch` của Node
 * không resolve được URL tương đối.
 *
 * Quy ước response của backend:
 *   { ok: true,  ... }
 *   { ok: false, error: { code, message, details? } }
 */

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, status = 500, code = "INTERNAL", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export type ApiClientOptions = {
  /** Tiền tố URL, ví dụ "http://localhost:3000". Bỏ trống để dùng URL tương đối (browser). */
  baseUrl?: string;
  /** Thay thế `globalThis.fetch`, dùng trong test. */
  fetchImpl?: typeof fetch;
};

export type ApiRequestOptions = ApiClientOptions & {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

type ApiFailure = { ok?: boolean; error?: ApiErrorBody };

const NETWORK_ERROR_MESSAGE =
  "Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng và thử lại.";
const INVALID_RESPONSE_MESSAGE = "Phản hồi từ máy chủ không hợp lệ.";
const GENERIC_ERROR_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại sau.";

function resolveUrl(path: string, baseUrl?: string): string {
  if (!baseUrl) return path;
  const trimmed = baseUrl.replace(/\/+$/, "");
  return `${trimmed}${path.startsWith("/") ? path : `/${path}`}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toApiError(payload: unknown, status: number): ApiError {
  const failure = (payload ?? {}) as ApiFailure;
  const error = failure.error;

  if (error && typeof error.message === "string" && error.message.length > 0) {
    return new ApiError(error.message, status, error.code ?? "ERROR", error.details);
  }

  return new ApiError(GENERIC_ERROR_MESSAGE, status, "ERROR");
}

/**
 * Gọi API và trả nguyên payload JSON đã parse.
 * Ném `ApiError` khi HTTP lỗi, khi `ok === false`, hoặc khi body không phải JSON.
 */
export async function apiRequest<T extends object = Record<string, unknown>>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { baseUrl, fetchImpl, method = "GET", body, signal } = options;
  const doFetch = fetchImpl ?? globalThis.fetch;

  let response: Response;
  try {
    response = await doFetch(resolveUrl(path, baseUrl), {
      method,
      headers:
        body === undefined
          ? { accept: "application/json" }
          : { accept: "application/json", "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0, "NETWORK_ERROR");
  }

  const payload = await readPayload(response);

  if (!response.ok) throw toApiError(payload, response.status);

  if (payload === null) {
    throw new ApiError(INVALID_RESPONSE_MESSAGE, response.status, "INVALID_RESPONSE");
  }

  if (typeof payload === "object" && (payload as ApiFailure).ok === false) {
    throw toApiError(payload, response.status);
  }

  return payload as T;
}
