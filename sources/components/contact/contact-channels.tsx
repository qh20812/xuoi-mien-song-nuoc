import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { SiteSettings } from "@/lib/contracts/site";

type ContactChannelsProps = {
  settings: SiteSettings;
};

export function ContactChannels({ settings }: ContactChannelsProps) {
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[20px] border border-line bg-surface p-5 md:p-6">
        <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-clay uppercase">
          Kênh liên hệ trực tiếp
        </span>
        <h2 className="mt-1 font-display text-xl font-semibold text-ink">
          Hotline & Zalo
        </h2>

        <div className="mt-4 rounded-[12px] bg-surface-warm p-4">
          <span className="block text-xs text-sage">Hotline / Zalo</span>
          <a
            href={settings.hotlineHref}
            className="mt-1 block font-mono text-2xl font-semibold text-ink transition-colors hover:text-clay"
          >
            {settings.hotline}
          </a>
          <span className="mt-1 block text-xs text-sage">
            Hỗ trợ Zalo {settings.supportHours}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
          <a
            href={settings.zaloHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-clay px-4 text-sm font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Nhắn Zalo
          </a>
          <a
            href={settings.hotlineHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-warm"
          >
            <Phone aria-hidden="true" className="size-4 text-sage" />
            Gọi điện
          </a>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
          <a
            href={settings.emailHref}
            className="inline-flex items-start gap-2 break-all text-sage transition-colors hover:text-ink"
          >
            <Mail aria-hidden="true" className="mt-1 size-4 shrink-0" />
            {settings.email}
          </a>
          <p className="flex items-start gap-2 text-sage">
            <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0" />
            {settings.address}
          </p>
        </div>
      </section>

      <section className="rounded-[20px] border border-line bg-surface-warm/45 p-5 md:p-6">
        <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-clay uppercase">
          Trước khi gửi lời nhắn
        </span>
        <h2 className="mt-1 font-display text-xl font-semibold text-ink">
          Đã có mã đơn?
        </h2>
        <p className="mt-2 text-sm leading-6 text-sage">
          Với câu hỏi về một đơn đã đặt, tra cứu bằng mã đơn và số điện thoại để
          xem trạng thái trước khi liên hệ.
        </p>
        <Link
          href="/tra-cuu-don"
          className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-clay transition-colors hover:text-clay-hover"
        >
          Tra cứu đơn giữ chỗ
        </Link>
      </section>
    </div>
  );
}
