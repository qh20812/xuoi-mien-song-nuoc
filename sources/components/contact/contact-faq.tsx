import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { FaqRecord } from "@/lib/fixtures/faqs";

type ContactFaqProps = {
  faqs: FaqRecord[];
};

export function ContactFaq({ faqs }: ContactFaqProps) {
  return (
    <section aria-labelledby="contact-faq" className="border-t border-line pt-10">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
            Giải đáp nhanh
          </span>
          <h2
            id="contact-faq"
            className="mt-2 font-display text-[clamp(1.8rem,3.6vw,2.75rem)] leading-tight font-semibold text-ink"
          >
            Câu hỏi thường gặp
          </h2>
        </div>
        <Link
          href="/tra-cuu-don"
          className="text-sm font-semibold text-clay transition-colors hover:text-clay-hover"
        >
          Tra cứu đơn giữ chỗ
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-x-8 md:grid-cols-2">
        {faqs.map((faq, index) => (
          <details
            key={faq.question}
            open={index === 0}
            className="group border-t border-line py-1"
          >
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 py-4 [&::-webkit-details-marker]:hidden">
              <span className="font-display text-lg leading-snug font-semibold text-ink md:text-xl">
                {faq.question}
              </span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 shrink-0 text-sage transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="max-w-[65ch] pb-5 text-sm leading-7 text-sage">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
