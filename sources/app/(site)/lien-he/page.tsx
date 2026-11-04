import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { ContactChannels } from "@/components/contact/contact-channels";
import { ContactFaq } from "@/components/contact/contact-faq";
import { ContactForm } from "@/components/contact/contact-form";
import { Container } from "@/components/ui/container";
import { faqs } from "@/lib/fixtures/faqs";
import { siteSettings } from "@/lib/fixtures/site";

export const metadata: Metadata = {
  title: "Liên hệ và hỗ trợ",
  description:
    "Liên hệ Xuôi Miền Sông Nước để được tư vấn tour, kiểm tra đơn giữ chỗ hoặc trao đổi nhu cầu riêng qua hotline và Zalo.",
};

const CONTACT_QUESTIONS = [
  "Đặt tour có cần thanh toán trước không?",
  "Có thể hủy đơn đã đặt không?",
  "Đi U Minh Hạ có nguy hiểm cho trẻ nhỏ không?",
  "Tour có bao gồm vé máy bay hoặc tàu không?",
];

export default function ContactPage() {
  const contactFaqs = CONTACT_QUESTIONS.map((question) =>
    faqs.find((faq) => faq.question === question),
  ).filter((faq): faq is (typeof faqs)[number] => Boolean(faq));

  return (
    <Container className="pt-10 pb-16 md:pt-14 md:pb-24">
      <nav
        aria-label="Đường dẫn trang"
        className="flex flex-wrap items-center gap-1.5 text-xs text-sage"
      >
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span className="font-medium text-ink">Liên hệ & hỗ trợ</span>
      </nav>

      <section className="mt-6 grid grid-cols-1 items-end gap-8 border-b border-line pb-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
            Kết nối với đội ngũ điều phối
          </span>
          <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[1.03] font-medium tracking-[-0.03em] text-ink">
            Gửi lời nhắn hoặc chuyện trò cùng người dẫn đường
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-sage md:text-lg">
            Cần hỏi về lịch trình, đơn giữ chỗ hay nhu cầu riêng của gia đình? Gửi
            lời nhắn hoặc liên hệ trực tiếp qua hotline/Zalo.
          </p>
        </div>
        <div className="lg:col-span-4 lg:flex lg:justify-end">
          <div className="inline-flex items-start gap-3 rounded-[12px] border border-line bg-surface px-4 py-3">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-clay"
            />
            <span className="text-sm leading-6 text-sage">
              Thông tin chỉ dùng để phản hồi yêu cầu tư vấn.
            </span>
          </div>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContactForm />
        </div>
        <div className="lg:col-span-5">
          <ContactChannels settings={siteSettings} />
        </div>
      </div>

      <div className="mt-14">
        <ContactFaq faqs={contactFaqs} />
      </div>
    </Container>
  );
}
