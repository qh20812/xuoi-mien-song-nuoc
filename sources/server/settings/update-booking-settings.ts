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

  /**
   * `settings.booking` trong DB có thể chứa field ngoài `BookingSettings`
   * (hiện tại: `cancellationPolicy` do seed ghi). Ghi đè nguyên object sẽ làm
   * mất các field đó, nên phải merge: giữ key lạ, chỉ thay 4 key đã biết.
   */
  const raw = current?.value;
  const base =
    raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const value = { ...base, ...next };

  await prisma.$transaction(async (tx) => {
    await tx.setting.upsert({
      where: { key: BOOKING_SETTING_KEY },
      update: { value },
      create: { key: BOOKING_SETTING_KEY, value },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "settings.booking.update",
        entity: "setting",
        entityId: null,
        meta: { from: previous, to: next, preservedKeys: Object.keys(base).filter((key) => !(key in next)) },
      },
    });
  });

  return next;
}
