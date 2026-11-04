import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import type { SiteSettings } from "@/lib/contracts/site";

const exploreLinks = [
  { label: "Tất cả tour sông nước", href: "/tour" },
  { label: "Hành trình đò dọc", href: "/#hanh-trinh" },
  { label: "Điểm đến tiêu biểu", href: "/diem-den" },
  { label: "Ẩm thực miền Tây", href: "/am-thuc" },
  { label: "Kinh nghiệm con nước", href: "/kinh-nghiem" },
];

const bookingLinks = [
  { label: "Quy trình giữ chỗ & đặt cọc", href: "/#faq" },
  { label: "Hủy và dời lịch", href: "/#faq" },
  { label: "Điểm đón khách", href: "/#faq" },
  { label: "Câu hỏi thường gặp", href: "/#faq" },
];

const supportLinks = [
  { label: "Tra cứu tình trạng đơn", href: "/tra-cuu-don" },
  { label: "Liên hệ ban tiếp đón", href: "/lien-he" },
];

type SiteFooterProps = {
  settings: SiteSettings;
};

async function getCopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

export async function SiteFooter({ settings }: SiteFooterProps) {
  const copyrightYear = await getCopyrightYear();

  return (
    <footer className="bg-ink pt-16 pb-8 text-contrast-on-accent md:pt-24">
      <Container>
        <div className="grid grid-cols-1 gap-10 border-b border-white/15 pb-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4 lg:pr-10">
            <span className="font-display text-2xl font-semibold text-surface">
              {settings.name}
            </span>
            <span className="mt-2 mb-5 block text-xs font-semibold tracking-[0.14em] text-clay-soft uppercase">
              Du khảo văn hóa & sinh thái Cửu Long
            </span>
            <p className="max-w-md text-sm leading-7 text-surface/70">
              Những chuyến đi chậm qua miệt vườn, rừng tràm và vùng cửa sông Nam Bộ,
              với lịch trình rõ ràng và người điều phối trực tiếp.
            </p>
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xs font-semibold tracking-[0.14em] text-clay-soft uppercase">
              Khám phá
            </h2>
            <ul className="flex flex-col gap-3 text-sm text-surface/70">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-surface">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="mb-4 text-xs font-semibold tracking-[0.14em] text-clay-soft uppercase">
              Thông tin đặt tour
            </h2>
            <ul className="flex flex-col gap-3 text-sm text-surface/70">
              {bookingLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition-colors hover:text-surface">
                    {link.label}
                  </Link>
                </li>
              ))}
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-surface">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="mb-4 text-xs font-semibold tracking-[0.14em] text-clay-soft uppercase">
              Liên hệ
            </h2>
            <ul className="flex flex-col gap-3 text-sm text-surface/70">
              <li>
                <a
                  href={settings.hotlineHref}
                  className="inline-flex items-start gap-2.5 transition-colors hover:text-surface"
                >
                  <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-clay-soft" />
                  {settings.hotline}
                </a>
              </li>
              <li>
                <a
                  href={settings.zaloHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-start gap-2.5 transition-colors hover:text-surface"
                >
                  <MessageCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-clay-soft" />
                  Zalo · {settings.supportHours}
                </a>
              </li>
              <li>
                <a
                  href={settings.emailHref}
                  className="inline-flex items-start gap-2.5 break-all transition-colors hover:text-surface"
                >
                  <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-clay-soft" />
                  {settings.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-clay-soft" />
                <span>{settings.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-xs text-surface/50 md:flex-row md:items-center md:justify-between">
          <span>
            © {copyrightYear} {settings.name}. Bản quyền thuộc về đội ngũ du khảo
            Nam Bộ.
          </span>
          <div className="flex flex-wrap gap-5">
            <Link href="/dieu-khoan-su-dung" className="transition-colors hover:text-surface">
              Điều khoản sử dụng
            </Link>
            <Link href="/chinh-sach-bao-mat" className="transition-colors hover:text-surface">
              Bảo mật thông tin
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
