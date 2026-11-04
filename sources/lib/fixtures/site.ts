import type { SiteSettings } from "@/lib/contracts/site";

export const siteSettings: SiteSettings = {
  name: "Xuôi Miền Sông Nước",
  tagline: "Hành trình Nam Bộ",
  description:
    "Tour miền Tây từ Sài Gòn: chợ nổi Cái Răng, rừng tràm U Minh Hạ, mốc tọa độ Đất Mũi. Đặt giữ chỗ online, xác nhận qua điện thoại/Zalo.",
  hotline: "0903 123 456",
  hotlineHref: "tel:+84903123456",
  zaloHref: "https://zalo.me/0903123456",
  email: "thu@xuoimiensongnuoc.vn",
  emailHref: "mailto:thu@xuoimiensongnuoc.vn",
  address: "Bến Ninh Kiều, Cần Thơ & Bến Tàu Châu Đốc, An Giang",
  supportHours: "24/7",
  booking: {
    holdHours: 24,
    cancelCutoffDays: 3,
    maxGuestsPerOrder: 20,
  },
};
