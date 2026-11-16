import type { ImageAsset } from "@/lib/contracts/home";

/**
 * Ảnh nội bộ trong `public/images`.
 *
 * `next.config.ts` không còn khai báo host ngoài (`images.remotePatterns`) nên
 * `next/image` sẽ **ném lỗi runtime** nếu nhận một URL http(s). Mọi chỗ đọc ảnh
 * từ DB (có thể là dữ liệu cũ hoặc do người dùng nhập) phải đi qua hàm này để
 * rơi về `null` thay vì làm sập trang.
 */
const LOCAL_IMAGE_PATH = /^\/images\/[\w./-]+\.(webp|jpe?g|png|avif)$/i;

export function toLocalImage(
  src: string | null | undefined,
  alt: string,
): ImageAsset | null {
  if (!src || !LOCAL_IMAGE_PATH.test(src)) return null;

  return { src, alt };
}
