import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Mail, Phone, Utensils } from "lucide-react";
import { CuisineCatalog } from "@/components/cuisines/cuisine-catalog";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cuisineListingData } from "@/lib/cuisines/listing";
import { siteSettings } from "@/lib/fixtures/site";
import { tourDetails } from "@/lib/fixtures/tour-details";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ẩm thực miền Tây",
  description:
    "Tuyển tập 8 món ăn Nam Bộ: lẩu mắm U Minh, cua Cà Mau, bánh xèo, bún nước lèo Sóc Trăng và các đặc sản miền Tây.",
};

const SEASONS = [
  {
    title: "Mùa khô",
    timing: "Tháng 12 – tháng 4",
    description:
      "Thời điểm thuận tiện để đi rừng tràm và mùa ong rừng cho mật. Nắng khô, đường vào rừng dễ đi hơn.",
  },
  {
    title: "Mùa nước nổi",
    timing: "Tháng 9 – tháng 11",
    description:
      "Kênh đầy cá và cảnh quan xanh mướt. Một số tuyến xuồng có thể thay đổi lịch trình theo con nước.",
  },
  {
    title: "Mùa cua Cà Mau",
    timing: "Tháng 10 – tháng 3 âm lịch",
    description:
      "Giai đoạn cua biển Năm Căn chắc thịt và ngọt tự nhiên nhất theo dữ liệu món ăn hiện có.",
  },
];

export default function CuisineListingPage() {
  const connectedCount = cuisineListingData.filter(
    (cuisine) => cuisine.tourRefs.length > 0,
  ).length;
  const unlinked = cuisineListingData.filter(
    (cuisine) => cuisine.tourRefs.length === 0,
  );

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
          <span className="font-medium text-ink">Ẩm thực Nam Bộ</span>
        </nav>

        <section className="mt-6 grid grid-cols-1 items-end gap-8 border-b border-line pb-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
              Dư hương đồng bằng & mặn mòi sông nước
            </span>
            <h1 className="mt-4 max-w-[20ch] font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[1.03] font-medium tracking-[-0.03em] text-ink">
              Vị đất, sắc nước trên mâm cơm Nam Bộ
            </h1>
          </div>
          <div className="lg:col-span-4">
            <p className="border-l-2 border-clay pl-5 text-sm leading-7 text-sage md:text-base">
              Tuyển tập {cuisineListingData.length} món ăn bản địa dọc sông Cửu
              Long, từ lẩu mắm U Minh và cua Năm Căn đến bún nước lèo Sóc Trăng.
              Mỗi món gắn với một vùng nguyên liệu và mùa con nước.
            </p>
            <p className="mt-4 flex items-center gap-2 border-l-2 border-clay pl-5 text-xs text-sage">
              <Utensils aria-hidden="true" className="size-3.5 text-clay" />
              {connectedCount} món hiện có trong 3 tuyến tour
            </p>
          </div>
        </section>

        <div className="mt-8">
          <CuisineCatalog cuisines={cuisineListingData} />
        </div>

        <section className="mt-16 rounded-[20px] border border-line bg-surface-warm/55 p-6 md:p-9">
          <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
            Quy luật tự nhiên của phù sa
          </span>
          <h2 className="mt-2 font-display text-[clamp(1.8rem,3.6vw,2.75rem)] leading-tight font-semibold text-ink">
            Ẩm thực theo con nước
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-sage">
            Người miền Tây chọn món theo mùa và theo con nước. Lịch trình thực tế
            có thể điều chỉnh tùy nguyên liệu tại điểm dừng.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-6 border-t border-line pt-6 md:grid-cols-3">
            {SEASONS.map((season) => (
              <div key={season.title}>
                <h3 className="text-sm font-semibold text-ink">{season.title}</h3>
                <span className="mt-1 block font-mono text-[0.7rem] text-clay">
                  {season.timing}
                </span>
                <p className="mt-2 text-xs leading-5 text-sage">
                  {season.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Container>

      <section className="border-t border-line bg-surface py-16 lg:py-24">
        <Container className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
              Hành trình trải nghiệm thực tế
            </span>
            <h2 className="mt-3 max-w-[22ch] font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] font-medium text-ink">
              Muốn thưởng thức những món này trong chuyến đi?
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-sage md:text-base">
              {connectedCount}/{cuisineListingData.length} món hiện có trong ba
              hành trình.{" "}
              {unlinked.length > 0
                ? `${unlinked.map((item) => item.name).join(", ")} chưa nằm trong lịch trình hiện tại.`
                : ""}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tour"
                className={cn(
                  buttonVariants({ variant: "site", size: "site" }),
                  "w-full sm:w-auto",
                )}
              >
                Xem 3 hành trình
              </Link>
              <Link
                href="/tra-cuu-don"
                className={cn(
                  buttonVariants({ variant: "site-outline", size: "site" }),
                  "w-full sm:w-auto",
                )}
              >
                Tra cứu đơn giữ chỗ
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {tourDetails.map((tour) => (
                <Link
                  key={tour.code}
                  href={`/tour/${tour.slug}`}
                  className="rounded-[10px] border border-line bg-canvas p-3 transition-colors hover:border-clay/40"
                >
                  <span className="block font-mono text-[0.65rem] text-clay">
                    {tour.code}
                  </span>
                  <span className="mt-1 block text-xs leading-5 font-medium text-ink">
                    {tour.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-line bg-canvas p-6 lg:col-span-5 md:p-8">
            <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-sage uppercase">
              Tư vấn khẩu vị riêng
            </span>
            <h3 className="mt-2 font-display text-xl font-semibold text-ink">
              Đi cùng người lớn tuổi hoặc có nhu cầu ăn kiêng?
            </h3>
            <p className="mt-3 text-sm leading-6 text-sage">
              Bạn có thể ghi chú nhu cầu ăn chay, dị ứng hoặc hạn chế gia vị khi
              đặt tour. Nhân viên sẽ ghi nhận để trao đổi lại trước chuyến đi.
            </p>
            <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
              <a
                href={siteSettings.hotlineHref}
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-clay"
              >
                <Phone aria-hidden="true" className="size-4 text-sage" />
                {siteSettings.hotline}
              </a>
              <a
                href={siteSettings.emailHref}
                className="inline-flex items-center gap-2 text-sm text-ink transition-colors hover:text-clay"
              >
                <Mail aria-hidden="true" className="size-4 text-sage" />
                {siteSettings.email}
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
