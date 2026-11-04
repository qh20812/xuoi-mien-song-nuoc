import { ChevronDown, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import type { FaqData } from "@/lib/contracts/home";
import type { SiteSettings } from "@/lib/contracts/site";

type FaqSectionProps = {
  faqs: FaqData[];
  settings: SiteSettings;
};

export function FaqSection({ faqs, settings }: FaqSectionProps) {
  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="scroll-mt-24 bg-canvas py-16 md:py-24">
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <SectionHeading
            eyebrow="Minh bạch & thực tế"
            title="Giải đáp trước ngày khởi hành"
            titleClassName="text-[2rem] md:text-[2.25rem]"
            description="Thông tin rõ ràng về giữ chỗ, trẻ em, hủy dời và điểm đón để bạn chuẩn bị chuyến đi."
          />

          <div className="mt-6 rounded-[12px] border border-line bg-surface p-5">
            <span className="block text-sm font-semibold text-ink">
              Cần hỗ trợ riêng?
            </span>
            <p className="mt-1 text-sm leading-6 text-sage">
              Nhân viên điều phối hỗ trợ qua điện thoại và Zalo.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={settings.hotlineHref}
                className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-clay transition-colors hover:text-clay-hover"
              >
                <Phone aria-hidden="true" className="size-4" />
                Gọi {settings.hotline}
              </a>
              <a
                href={settings.zaloHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-clay transition-colors hover:text-clay-hover"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                Nhắn Zalo
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              open={index === 0}
              className="group border-b border-line py-1 first:border-t"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="font-display text-lg leading-snug font-semibold text-ink md:text-xl">
                  {faq.question}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-5 shrink-0 text-sage transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="pb-5 pr-8">
                <p className="max-w-[65ch] text-sm leading-7 text-sage">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
