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

export const metadata: Metadata = {
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
