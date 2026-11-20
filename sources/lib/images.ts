import type { ImageAsset } from "@/lib/contracts/home";
import { isManagedImageUrl } from "@/lib/media/image-url";

/**
 * Ảnh được phép đưa vào `next/image`: nội bộ trong `public/images` hoặc Cloudinary.
 *
 * Dữ liệu DB có thể là row cũ hoặc do người dùng nhập, nên mọi chỗ đọc ảnh phải đi
 * qua hàm này để rơi về `null` thay vì làm sập trang.
 */
export function toImageAsset(
  src: string | null | undefined,
  alt: string,
): ImageAsset | null {
  if (!src || !isManagedImageUrl(src)) return null;

  return { src, alt };
}
