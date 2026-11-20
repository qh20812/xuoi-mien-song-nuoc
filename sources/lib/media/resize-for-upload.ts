/**
 * Nén ảnh ngay trên trình duyệt trước khi gửi lên `/api/admin/media/upload`.
 *
 * Vercel Function chỉ nhận tối đa 4.5 MB request body, nên ảnh điện thoại 5–15 MB
 * sẽ bị chặn `413` trước khi vào route. Hàm này thu ảnh về cạnh dài ≤1920px,
 * chuyển WebP (fallback JPEG) rồi trả một `File` mới. Server vẫn chạy sharp lần
 * nữa — kết quả từ client không bao giờ được tin tuyệt đối.
 *
 * Nếu trình duyệt không hỗ trợ `createImageBitmap`/canvas, trả nguyên file để
 * server báo lỗi rõ ràng thay vì im lặng gửi dữ liệu sai.
 */
import {
  CLIENT_COMPRESS_THRESHOLD_BYTES,
  MAX_UPLOAD_BYTES,
  UPLOAD_MAX_EDGE,
} from "@/lib/media/limits";

export const CLIENT_WEBP_QUALITY = 0.8;

export type PrepareImageOptions = {
  maxBytes?: number;
  maxEdge?: number;
  quality?: number;
};

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadError";
  }
}

export function shouldCompressImage(
  size: number,
  threshold = CLIENT_COMPRESS_THRESHOLD_BYTES,
): boolean {
  return Number.isFinite(size) && size > threshold;
}

/** Thu kích thước vào cạnh dài ≤ `maxEdge`, giữ tỉ lệ. Ảnh lỗi trả `{0,0}`. */
export function fitWithinEdge(
  width: number,
  height: number,
  maxEdge = UPLOAD_MAX_EDGE,
): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }

  const longest = Math.max(width, height);
  const scale = longest > maxEdge ? maxEdge / longest : 1;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** `252,3 KB` / `3,4 MB` — dùng trong thông báo lỗi. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(
      bytes / 1024,
    )} KB`;
  }
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(
    bytes / (1024 * 1024),
  )} MB`;
}

export function fileNameForType(name: string, mimeType: string): string {
  const base = name.replace(/\.[^./\\]+$/, "").trim() || "anh";
  if (mimeType === "image/jpeg") return `${base}.jpg`;
  if (mimeType === "image/webp") return `${base}.webp`;
  return base;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export async function prepareImageForUpload(
  file: File,
  options: PrepareImageOptions = {},
): Promise<File> {
  const maxBytes = options.maxBytes ?? MAX_UPLOAD_BYTES;
  const maxEdge = options.maxEdge ?? UPLOAD_MAX_EDGE;
  const quality = options.quality ?? CLIENT_WEBP_QUALITY;

  if (!shouldCompressImage(file.size, Math.min(CLIENT_COMPRESS_THRESHOLD_BYTES, maxBytes))) {
    return file;
  }
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Trình duyệt không đọc được ảnh — để server trả MEDIA_INVALID_FILE.
    return file;
  }

  try {
    const fitted = fitWithinEdge(bitmap.width, bitmap.height, maxEdge);
    if (fitted.width === 0) return file;

    const canvas = document.createElement("canvas");
    canvas.width = fitted.width;
    canvas.height = fitted.height;
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, fitted.width, fitted.height);

    let blob = await canvasToBlob(canvas, "image/webp", quality);
    if (!blob) blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (!blob || blob.size >= file.size) return file;

    if (blob.size > maxBytes) {
      const smaller = await canvasToBlob(canvas, blob.type, Math.max(0.4, quality * 0.6));
      if (smaller && smaller.size < blob.size) blob = smaller;
    }

    if (blob.size > maxBytes) {
      throw new ImageUploadError(
        `Ảnh sau khi nén vẫn còn ${formatBytes(blob.size)}, vui lòng chọn ảnh nhỏ hơn`,
      );
    }

    return new File([blob], fileNameForType(file.name, blob.type), {
      type: blob.type,
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close?.();
  }
}
