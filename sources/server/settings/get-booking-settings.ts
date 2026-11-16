/**
 * Đọc cấu hình đặt tour từ bảng `settings` (key = "booking").
 *
 * Giá trị bất thường do admin nhập được kẹp về khoảng an toàn bởi
 * `normalizeBookingSettings` — hàm thuần nằm ở `lib/settings.ts`.
 */
import prisma from "@/lib/prisma";
import { normalizeBookingSettings, type BookingSettings } from "@/lib/settings";

export async function getBookingSettings(): Promise<BookingSettings> {
  const row = await prisma.setting.findUnique({
    where: { key: "booking" },
    select: { value: true },
  });

  return normalizeBookingSettings(row?.value);
}
