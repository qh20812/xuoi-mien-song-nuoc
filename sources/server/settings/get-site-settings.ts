/**
 * Cấu hình site cho các trang public.
 *
 * Nội dung thương hiệu (tên, hotline, Zalo, địa chỉ) vẫn lấy từ fixture, còn
 * nhóm `booking` đọc từ bảng `settings` để UI và server dùng chung một nguồn —
 * admin đổi `holdHours`/`cancelCutoffDays`/`maxGuestsPerOrder` thì UI đổi theo.
 */
import type { SiteSettings } from "@/lib/contracts/site";
import { siteSettings } from "@/lib/fixtures/site";
import { getBookingSettings } from "@/server/settings/get-booking-settings";

export async function getSiteSettings(): Promise<SiteSettings> {
  const booking = await getBookingSettings();

  return {
    ...siteSettings,
    booking: {
      holdHours: booking.holdHours,
      cancelCutoffDays: booking.cancelCutoffDays,
      maxGuestsPerOrder: booking.maxGuestsPerOrder,
    },
  };
}
