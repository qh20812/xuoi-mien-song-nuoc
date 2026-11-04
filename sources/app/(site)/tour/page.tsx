import type { Metadata } from "next";
import { BusFront, Route } from "lucide-react";
import { PromiseStrip } from "@/components/home/promise-strip";
import { TourCatalog } from "@/components/tours/tour-catalog";
import { Container } from "@/components/ui/container";
import { siteSettings } from "@/lib/fixtures/site";
import { tourListingData } from "@/lib/tours/listing";

export const metadata: Metadata = {
  title: "Tour miền Tây",
  description:
    "Ba hành trình miền Tây từ Sài Gòn: Cần Thơ, U Minh Hạ và Đất Mũi Cà Mau. Xem lịch khởi hành, giá và giữ chỗ trực tuyến.",
};

export default function TourListingPage() {
  return (
    <>
      <Container className="pt-10 pb-16 md:pt-14 md:pb-24">
        <section className="grid grid-cols-1 items-end gap-8 border-b border-line pb-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-0.5 w-8 bg-clay" />
              <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
                {siteSettings.tagline}
              </span>
            </div>
            <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[1.03] font-medium tracking-[-0.03em] text-ink">
              Những chuyến xuôi dòng Nam Bộ
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-sage md:text-lg">
              Hành trình qua miệt vườn, rừng tràm ngập nước và điểm cực Nam Tổ
              quốc. Mỗi chuyến đi có lịch trình rõ ràng, giá trọn gói và đội ngũ
              điều phối trực tiếp.
            </p>
          </div>

          <div className="lg:col-span-4 lg:flex lg:justify-end">
            <div className="flex items-stretch gap-5 rounded-[16px] border border-line bg-surface p-5">
              <div>
                <Route aria-hidden="true" className="size-5 text-clay" />
                <span className="mt-2 block text-[0.7rem] text-sage">
                  Hành trình
                </span>
                <span className="block text-sm font-semibold text-ink">
                  {tourListingData.length} tour
                </span>
              </div>
              <div aria-hidden="true" className="w-px bg-line" />
              <div>
                <BusFront aria-hidden="true" className="size-5 text-clay" />
                <span className="mt-2 block text-[0.7rem] text-sage">
                  Khởi hành
                </span>
                <span className="block text-sm font-semibold text-ink">
                  Từ TP.HCM
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8">
          <TourCatalog tours={tourListingData} />
        </div>
      </Container>

      <PromiseStrip />
    </>
  );
}
