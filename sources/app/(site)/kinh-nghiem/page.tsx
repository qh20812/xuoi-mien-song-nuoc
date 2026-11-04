import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock3, ShieldCheck } from "lucide-react";
import { PostCatalog } from "@/components/posts/post-catalog";
import { RelatedToursCta } from "@/components/posts/related-tours-cta";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteSettings } from "@/lib/fixtures/site";
import { tourDetails } from "@/lib/fixtures/tour-details";
import { POST_TOPICS, postListingData } from "@/lib/posts/listing";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kinh nghiệm du lịch miền Tây",
  description:
    "Cẩm nang thực tế cho chuyến đi miền Tây: mùa nào đi U Minh Hạ, hành lý vào rừng tràm và kinh nghiệm check-in Đất Mũi trong ngày.",
};

export default function ExperienceListingPage() {
  return (
    <>
      <Container className="pt-10 pb-16 md:pt-14 md:pb-24">
        <nav
          aria-label="Đường dẫn trang"
          className="flex flex-wrap items-center gap-1.5 text-xs text-sage"
        >
          <Link href="/" className="transition-colors hover:text-ink">
            Trang chủ
          </Link>
          <ChevronRight aria-hidden="true" className="size-3.5" />
          <span className="font-medium text-ink">Cẩm nang & kinh nghiệm</span>
        </nav>

        <section className="mt-6 grid grid-cols-1 items-end gap-8 border-b border-line pb-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
              Sổ tay du khảo phương Nam
            </span>
            <h1 className="mt-4 max-w-[17ch] font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[1.03] font-medium tracking-[-0.03em] text-ink">
              Kinh nghiệm xuôi dòng & chạm đất Mũi
            </h1>
          </div>
          <div className="lg:col-span-4">
            <p className="border-l-2 border-clay pl-5 text-sm leading-7 text-sage md:text-base">
              Những ghi chú thực tế về mùa con nước, hành lý đi rừng tràm và một
              ngày ở Đất Mũi, được biên soạn từ dữ liệu cẩm nang hiện có.
            </p>
            <p className="mt-4 flex items-center gap-2 border-l-2 border-clay pl-5 text-xs text-sage">
              <Clock3 aria-hidden="true" className="size-3.5 text-clay" />
              {postListingData.length} bài viết · {POST_TOPICS.length} chủ đề
            </p>
          </div>
        </section>

        <div className="mt-8">
          <PostCatalog posts={postListingData} />
        </div>
      </Container>

      <section className="border-t border-line bg-surface py-16 lg:py-24">
        <Container>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
                Đồng hành cùng người bản địa
              </span>
              <h2 className="mt-2 max-w-[22ch] font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] font-medium text-ink">
                Bạn muốn trải nghiệm thực tế những cung đường này?
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-sage md:text-right">
              Ba hành trình hiện có đi qua các điểm đến được nhắc trong cẩm nang.
              Lịch khởi hành và giá lấy theo từng chuyến đang mở.
            </p>
          </div>

          <div className="mt-8">
            <RelatedToursCta tours={tourDetails} />
          </div>

          <div className="mt-6 flex flex-col items-start justify-between gap-5 rounded-[18px] border border-line bg-surface-warm/50 p-5 md:flex-row md:items-center md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <span className="flex items-start gap-2 text-sm text-ink">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                Giữ chỗ {siteSettings.booking.holdHours} giờ, chưa thu tiền online
              </span>
              <span className="hidden h-6 w-px bg-line sm:block" />
              <span className="text-sm text-ink">
                Hủy trước {siteSettings.booking.cancelCutoffDays} ngày, hoàn cọc
                theo chính sách
              </span>
            </div>
            <Link
              href="/tour"
              className={cn(
                buttonVariants({ variant: "site", size: "site-sm" }),
                "w-full sm:w-auto",
              )}
            >
              Xem 3 hành trình
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
