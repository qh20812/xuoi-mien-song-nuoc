import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Info,
  MapPin,
  Phone,
  Utensils,
} from "lucide-react";
import { CuisineCard } from "@/components/cuisines/cuisine-card";
import { RelatedTourCard } from "@/components/cuisines/related-tour-card";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  getCuisineBySlug,
  getMealForCuisine,
  getRelatedCuisines,
  getToursForCuisine,
} from "@/lib/cuisines/detail";
import {
  cuisineListingData,
} from "@/lib/cuisines/listing";
import { siteSettings } from "@/lib/fixtures/site";
import { cn } from "@/lib/utils";

// Trang chi tiết đọc slug và được prerender cho toàn bộ danh sách hiện có.
export const instant = false;

type CuisineDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return cuisineListingData.map((cuisine) => ({ slug: cuisine.slug }));
}

export async function generateMetadata({
  params,
}: CuisineDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cuisine = getCuisineBySlug(slug);

  if (!cuisine) {
    return { title: "Không tìm thấy món ăn" };
  }

  return {
    title: cuisine.name,
    description: cuisine.description,
  };
}

export default async function CuisineDetailPage({
  params,
}: CuisineDetailPageProps) {
  const { slug } = await params;
  const cuisine = getCuisineBySlug(slug);

  if (!cuisine) notFound();

  const tours = getToursForCuisine(cuisine);
  const related = getRelatedCuisines(cuisine);
  const total = cuisineListingData.length;
  const tourMeals = tours.map((tour) => ({
    tour,
    meal: getMealForCuisine(tour, cuisine),
  }));
  const tourGridClass =
    tours.length === 1
      ? "max-w-xl"
      : tours.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-2 lg:grid-cols-3";

  return (
    <Container className="pt-6 pb-16 md:pb-24">
      <nav
        aria-label="Đường dẫn trang"
        className="flex flex-wrap items-center gap-1.5 text-xs text-sage"
      >
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <Link href="/am-thuc" className="transition-colors hover:text-ink">
          Ẩm thực
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span>{cuisine.province}</span>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span className="font-medium text-ink">{cuisine.name}</span>
      </nav>

      <section className="mt-6 rounded-[24px] border border-line bg-surface p-6 md:p-10 lg:p-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-clay-soft/50 px-3 py-1 text-xs font-semibold tracking-[0.1em] text-ink uppercase">
            Món {String(cuisine.sortOrder).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </span>
          <span className="rounded-full bg-surface-warm px-3 py-1 text-xs font-medium text-ink">
            {cuisine.province}
          </span>
        </div>

        <h1 className="mt-5 max-w-[16ch] font-display text-[clamp(2.5rem,5.5vw,4.75rem)] leading-[1.02] font-medium tracking-[-0.03em] text-ink">
          {cuisine.name}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-sage md:text-lg">
          {cuisine.description}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-5 text-xs text-sage">
          <span className="inline-flex items-center gap-1.5">
            <Utensils aria-hidden="true" className="size-4 text-clay" />
            {tours.length > 0
              ? `Có trong ${tours.length} tuyến tour`
              : "Ngoài lịch trình tour hiện tại"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-4 text-clay" />
            {cuisine.province}
          </span>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-7 lg:col-span-7">
          <div>
            <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
              Trong hành trình
            </span>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
              Món ăn xuất hiện ở đâu?
            </h2>

            {tours.length > 0 ? (
              <ul className="mt-4 flex flex-col">
                {tours.map((tour) => {
                  const meal = getMealForCuisine(tour, cuisine);
                  return (
                    <li
                      key={tour.code}
                      className="flex flex-col justify-between gap-2 border-t border-line py-3 text-sm sm:flex-row sm:items-center"
                    >
                      <span className="font-medium text-ink">
                        <span className="mr-2 font-mono text-xs text-clay">
                          {tour.code}
                        </span>
                        {tour.name}
                      </span>
                      <span className="text-xs text-sage">
                        {meal
                          ? `${meal.label} ngày ${meal.dayNumber}`
                          : "Có trong chương trình ăn uống"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-sage">
                Món này chưa nằm trong thực đơn của ba hành trình hiện có.
              </p>
            )}
          </div>

          <div className="rounded-[14px] border border-line bg-surface-warm/45 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Info aria-hidden="true" className="size-4 text-clay" />
              Lưu ý khi thưởng thức
            </h2>
            <p className="mt-2 text-sm leading-6 text-sage">
              Bạn có thể ghi chú nhu cầu ăn chay, dị ứng hoặc hạn chế gia vị khi
              đặt tour. Nhân viên sẽ ghi nhận để trao đổi trước chuyến đi; thực đơn
              thực tế phụ thuộc nguyên liệu tại điểm dừng.
            </p>
          </div>
        </div>

        <aside className="rounded-[20px] border border-line bg-surface p-5 shadow-[0_18px_48px_-24px_rgba(23,51,43,0.16)] md:p-6 lg:col-span-5">
          <span className="text-xs font-semibold tracking-[0.14em] text-sage uppercase">
            Hồ sơ món ăn
          </span>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
            {cuisine.name}
          </h2>

          <div className="mt-5 flex flex-col gap-4 border-t border-line pt-4">
            <div>
              <span className="block text-[0.7rem] text-sage">Vùng</span>
              <span className="mt-0.5 block text-sm font-semibold text-ink">
                {cuisine.province}
              </span>
            </div>
            <div>
              <span className="block text-[0.7rem] text-sage">
                Nơi thưởng thức
              </span>
              <span className="mt-0.5 flex items-start gap-1.5 text-sm leading-6 text-ink">
                <MapPin
                  aria-hidden="true"
                  className="mt-1 size-3.5 shrink-0 text-clay"
                />
                {cuisine.whereToEat}
              </span>
            </div>
            <div>
              <span className="block text-[0.7rem] text-sage">
                Tuyến tour liên quan
              </span>
              {cuisine.tourRefs.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {cuisine.tourRefs.map((tour) => (
                    <Link
                      key={tour.code}
                      href={`/tour/${tour.slug}`}
                      className="rounded border border-line bg-surface-warm px-2 py-1 font-mono text-[0.68rem] text-clay transition-colors hover:border-clay/40"
                    >
                      {tour.code}
                    </Link>
                  ))}
                </div>
              ) : (
                <span className="mt-1 block text-sm text-sage">
                  Chưa có trong tour hiện tại
                </span>
              )}
            </div>
          </div>

          {tours.length > 0 ? (
            <a
              href="#tours-lien-quan"
              className={cn(
                buttonVariants({ variant: "site", size: "site" }),
                "mt-5 w-full",
              )}
            >
              Xem tour có món này
            </a>
          ) : (
            <Link
              href="/tour"
              className={cn(
                buttonVariants({ variant: "site", size: "site" }),
                "mt-5 w-full",
              )}
            >
              Xem các hành trình hiện có
            </Link>
          )}
        </aside>
      </section>

      {tours.length > 0 ? (
        <section
          id="tours-lien-quan"
          className="mt-16 scroll-mt-28 border-t border-line pt-10"
        >
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
                Ẩm thực đi cùng hành trình
              </span>
              <h2 className="mt-2 font-display text-[clamp(1.8rem,3.6vw,2.75rem)] leading-tight font-semibold text-ink">
                {cuisine.name} trong các tour
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-sage">
              Ngày và bữa ăn dưới đây lấy từ lịch trình tour hiện có; lịch có thể
              thay đổi theo điều kiện thực tế.
            </p>
          </div>

          <div className={cn("mt-6 grid grid-cols-1 gap-5", tourGridClass)}>
            {tourMeals.map(({ tour, meal }) => (
              <RelatedTourCard
                key={tour.code}
                tour={tour}
                cuisine={cuisine}
                meal={meal}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-16 border-t border-line pt-10">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
              Khám phá thêm
            </span>
            <h2 className="mt-2 font-display text-[clamp(1.8rem,3.6vw,2.75rem)] leading-tight font-semibold text-ink">
              Món khác của miền sông nước
            </h2>
          </div>
          <Link
            href="/am-thuc"
            className="text-sm font-semibold text-clay transition-colors hover:text-clay-hover"
          >
            Xem toàn bộ ẩm thực
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <CuisineCard key={item.slug} cuisine={item} total={total} variant="compact" />
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-[22px] border border-line bg-surface-warm/55 p-6 md:p-9">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-clay uppercase">
              <Utensils aria-hidden="true" className="size-4" />
              Giữ chỗ 24 giờ
            </span>
            <h2 className="mt-2 max-w-[24ch] font-display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-tight font-semibold text-ink">
              Muốn thưởng thức {cuisine.name} trong chuyến đi?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-sage">
              Website chưa thu tiền trực tuyến. Trong thời gian giữ chỗ, nhân viên
              liên hệ xác nhận lịch trình và hướng dẫn đặt cọc.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href={tours[0] ? `/dat-tour?tour=${tours[0].slug}` : "/tour"}
              className={buttonVariants({ variant: "site", size: "site" })}
            >
              {tours[0] ? "Đặt giữ chỗ" : "Xem các hành trình"}
            </Link>
            <a
              href={siteSettings.hotlineHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-medium text-ink transition-colors hover:text-clay"
            >
              <Phone aria-hidden="true" className="size-4 text-sage" />
              {siteSettings.hotline}
            </a>
          </div>
        </div>
      </section>
    </Container>
  );
}
