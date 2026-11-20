/**
 * Chính sách URL ảnh dùng chung cho nội dung (tour, điểm đến, bài viết, món ăn, media).
 *
 * Chỉ chấp nhận:
 * - ảnh nội bộ trong `public/images` (đường dẫn bắt đầu `/images/`);
 * - ảnh Cloudinary `https://res.cloudinary.com/<cloud_name>/image/upload/...`.
 *
 * Mọi host khác bị chặn để `next/image` không ném lỗi runtime (xem D0/D10.4).
 */

export const LOCAL_IMAGE_PATH = /^\/images\/[\w./-]+\.(webp|jpe?g|png|avif)$/i;

export const CLOUDINARY_HOST = "res.cloudinary.com";

/**
 * Cloud name của hệ thống (nếu có `CLOUDINARY_URL`). Trên client env này không có
 * nên hàm trả `null` và validator chỉ kiểm tra host/path; phía server vẫn chặn
 * đúng cloud của mình trước khi ghi DB.
 */
function ownCloudName(): string | null {
  const raw = process.env.CLOUDINARY_URL;
  if (!raw) return null;

  try {
    return new URL(raw).hostname || null;
  } catch {
    return null;
  }
}

export function isLocalImageUrl(value: unknown): value is string {
  return typeof value === "string" && LOCAL_IMAGE_PATH.test(value.trim());
}

export function isCloudinaryImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;
    if (url.hostname !== CLOUDINARY_HOST) return false;

    // /<cloud_name>/image/upload/<public_id>
    const parts = url.pathname.split("/");
    if (parts[2] !== "image" || parts[3] !== "upload" || !parts[4]) return false;

    const own = ownCloudName();
    if (own && parts[1] !== own) return false;

    return true;
  } catch {
    return false;
  }
}

export function isManagedImageUrl(value: unknown): value is string {
  return isLocalImageUrl(value) || isCloudinaryImageUrl(value);
}
