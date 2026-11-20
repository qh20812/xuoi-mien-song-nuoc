import { requireCapabilityApi } from "@/lib/auth/session";
import { MAX_REQUEST_BODY_BYTES, MAX_UPLOAD_LABEL } from "@/lib/media/limits";
import { AppError } from "@/server/errors";
import { apiError, handleApiError, jsonResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { uploadMedia } from "@/server/media/upload-media";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 10;

/**
 * Vercel cắt request body ở 4.5 MB trước khi vào route, nên `MAX_BODY_BYTES`
 * chỉ còn là lớp chặn sớm (kèm thông báo thân thiện) cho môi trường chạy Node.
 */
export const maxDuration = 60;

function text(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" ? value : null;
}

function tags(value: FormDataEntryValue | null): string[] {
  return typeof value === "string"
    ? value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
}

export async function POST(request: Request) {
  try {
    const admin = await requireCapabilityApi("content:write");

    const limited = rateLimit(`admin-media-upload:${admin.id}`, LIMIT, WINDOW_MS);
    if (!limited.allowed) {
      return apiError(
        429,
        "Bạn tải ảnh quá nhiều lần, vui lòng thử lại sau ít phút",
        "RATE_LIMITED",
        { retryAfter: limited.retryAfter },
        { "retry-after": String(limited.retryAfter) },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
      throw new AppError("MEDIA_TOO_LARGE", `Ảnh tối đa ${MAX_UPLOAD_LABEL}`, 413);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new AppError("INVALID_INPUT", "Dữ liệu tải lên không hợp lệ", 400);
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError("MEDIA_INVALID_FILE", "Vui lòng chọn một tệp ảnh", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const media = await uploadMedia(
      {
        buffer,
        mimeType: file.type,
        size: file.size,
        title: text(form.get("title")),
        alt: text(form.get("alt")),
        tags: tags(form.get("tags")),
      },
      admin.id,
    );

    return jsonResponse({ ok: true, media }, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/admin/media/upload");
  }
}
