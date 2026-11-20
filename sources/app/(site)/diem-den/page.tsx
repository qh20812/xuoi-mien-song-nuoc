import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Route } from "lucide-react";
import { DestinationCatalog } from "@/components/destinations/destination-catalog";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteSettings } from "@/lib/fixtures/site";
import { cn } from "@/lib/utils";
import { listPublicDestinations } from "@/server/content/public-destinations";

export const metadata: Metadata = {
  title: "Điểm đến miền Tây",
  description:
    "Khám phá các điểm đến ở Đồng Tháp, Cần Thơ và Cà Mau: chợ nổi, rừng tràm, kiến trúc cổ và vùng biển Đất Mũi.",
};

export default async function DestinationListingPage() {
  const destinations = await listPublicDestinations();
  const provinceCount = new Set(
    destinations.map((destination) => destination.provinceSlug),
  ).size;
  const connectedCount = destinations.filter(
    (destination) => destination.tourRefs.length > 0,
  ).length;
  const tourCount = new Set(
    destinations.flatMap((destination) =>
      destination.tourRefs.map((tour) => tour.code),
    ),
  ).size;

  return (
    <>
      <Container className="pt-10 pb-16 md:pt-14 md:pb-24">
        <section className="grid grid-cols-1 items-end gap-8 border-b border-line pb-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
              Dấu ấn vùng miệt vườn & rừng nước
            </span>
            <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[1.03] font-medium tracking-[-0.03em] text-ink">
              Những miền đất còn giữ nét nguyên sơ
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-sage md:text-lg">
              Tuyển tập {destinations.length} điểm đến trải dài từ Đồng Tháp qua
              Cần Thơ đến Cà Mau. Mỗi nơi là một mảnh ghép của chợ nổi, rừng tràm,
              kiến trúc cổ và vùng cửa sông Nam Bộ.
            </p>
          </div>

          <div className="lg:col-span-4 lg:flex lg:justify-end">
            <div className="flex flex-col gap-3 rounded-[16px] bg-surface-warm p-5">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                <MapPin aria-hidden="true" className="size-4 text-clay" />
                {destinations.length} điểm đến
              </div>
              <div className="flex items-center gap-2.5 text-sm text-sage">
                <Route aria-hidden="true" className="size-4 text-sage" />
                {connectedCount} điểm thuộc {tourCount} tuyến tour
              </div>
              <p className="border-t border-line pt-3 text-xs leading-5 text-sage">
                Trải trên {provinceCount} tỉnh/thành đang có trong dữ liệu.
              </p>
            </div>
          </div>
        </section>

        {destinations.length === 0 ? (
          <section className="mx-auto mt-8 flex max-w-xl flex-col items-center rounded-[20px] border border-dashed border-line bg-surface-warm/35 p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-surface text-clay">
              <MapPin aria-hidden="true" className="size-5" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-ink">
              Chưa có điểm đến nào
            </h2>
            <p className="mt-2 text-sm leading-6 text-sage">
              Nội dung sẽ xuất hiện khi được thêm trong trang quản trị.
            </p>
          </section>
        ) : (
          <div className="mt-8">
            <DestinationCatalog destinations={destinations} />
          </div>
        )}
      </Container>

      <section className="bg-ink py-16 text-contrast-on-accent lg:py-20">
        <Container className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <span className="text-xs font-semibold tracking-[0.14em] text-clay-soft uppercase">
              Hành trình đã thiết kế sẵn
            </span>
            <h2 className="mt-3 max-w-[24ch] font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] font-medium text-surface">
              Bạn muốn xuôi dòng ghé thăm những điểm đến này?
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-surface/70 md:text-base">
              Các hành trình hiện có đưa bạn qua những điểm đến tiêu biểu bằng xe
              du lịch và đường thủy. Lịch khởi hành, giá và số chỗ được cập nhật
              theo từng chuyến.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 lg:col-span-4 lg:items-end">
            <Link
              href="/tour"
              className={cn(
                buttonVariants({ variant: "site", size: "site" }),
                "w-full sm:w-auto",
              )}
            >
              Xem các tuyến tour
            </Link>
            <a
              href={siteSettings.hotlineHref}
              className="text-sm font-medium text-surface/80 transition-colors hover:text-surface"
            >
              Hotline tư vấn: {siteSettings.hotline}
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
