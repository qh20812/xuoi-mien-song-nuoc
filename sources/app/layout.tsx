import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Be_Vietnam_Pro, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

/**
 * URL công khai dùng cho `metadataBase` (OG image, canonical). Thiếu biến này
 * Next sẽ fallback `http://localhost:3000`, làm social preview trỏ sai khi lên
 * production — nên đặt `NEXT_PUBLIC_SITE_URL` ở cả Build và Runtime.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).toString();
    } catch {
      // Env sai định dạng: rơi về localhost thay vì làm sập build.
    }
  }
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteUrl()),
  title: {
    default: "Xuôi Miền Sông Nước – Tour miền Tây, U Minh Hạ, Đất Mũi",
    template: "%s | Xuôi Miền Sông Nước",
  },
  description:
    "Tour miền Tây từ Sài Gòn: chợ nổi Cái Răng, rừng tràm U Minh Hạ, mốc tọa độ Đất Mũi. Đặt giữ chỗ online, xác nhận qua điện thoại/Zalo.",
  applicationName: "Xuôi Miền Sông Nước",
  keywords: [
    "tour miền Tây",
    "U Minh Hạ",
    "Đất Mũi Cà Mau",
    "tour Sài Gòn Cà Mau",
  ],
  openGraph: {
    title: "Xuôi Miền Sông Nước – Tour miền Tây, U Minh Hạ, Đất Mũi",
    description:
      "Hành trình Sài Gòn – Cần Thơ – U Minh Hạ – Đất Mũi. Đặt giữ chỗ online, xác nhận qua điện thoại/Zalo.",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${fraunces.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
