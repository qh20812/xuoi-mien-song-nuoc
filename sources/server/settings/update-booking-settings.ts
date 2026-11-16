/**
 * Ghi cấu hình đặt tour từ admin (P1).
 *
 * Chỉ ghi nhóm `booking` trong bảng `settings` — đây là nhóm mà **cả UI public
 * lẫn server** cùng đọc (`getBookingSettings`), nên đổi ở đây là đổi thật.
 * Nội dung thương hiệu (tên, hotline, địa chỉ) vẫn nằm ở fixture, sửa DB không
 * có tác dụng.
 */
import prisma from "@/lib/prisma";
import { normalizeBookingSettings, type BookingSettings } from "@/lib/settings";

export const BOOKING_SETTING_KEY = "booking";

export async function updateBookingSettings(
  input: unknown,
  adminId: number,
): Promise<BookingSettings> {
  const next = normalizeBookingSettings(input);

  const current = await prisma.setting.findUnique({
    where: { key: BOOKING_SETTING_KEY },
    select: { value: true },
  });
  const previous = normalizeBookingSettings(current?.value);

  await prisma.$transaction(async (tx) => {
    await tx.setting.upsert({
      where: { key: BOOKING_SETTING_KEY },
      update: { value: next },
      create: { key: BOOKING_SETTING_KEY, value: next },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "settings.booking.update",
        entity: "setting",
        entityId: null,
        meta: { from: previous, to: next },
      },
    });
  });

  return next;
}
