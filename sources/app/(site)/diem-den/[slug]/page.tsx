import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  MapPin,
  Route,
  Sun,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import {
  getPublicDestinationBySlug,
  listPublicDestinations,
} from "@/server/content/public-destinations";

type DestinationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

// Trang chi tiết đọc slug và được prerender cho toàn bộ danh sách hiện có.
export const instant = false;

export async function generateStaticParams() {
  const destinations = await listPublicDestinations();
  return destinations.map((destination) => ({ slug: destination.slug }));
}

export async function generateMetadata({
  params,
}: DestinationDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getPublicDestinationBySlug(slug);

  if (!destination) {
    return { title: "Không tìm thấy điểm đến" };
  }

  const description =
    destination.shortDescription || destination.description || destination.name;

  return {
    title: `${destination.name} – ${destination.province}`,
    description,
    openGraph: {
      title: destination.name,
      description,
      ...(destination.image
        ? { images: [{ url: destination.image.src, alt: destination.image.alt }] }
        : {}),
      locale: "vi_VN",
      type: "article",
    },
  };
}

export default async function DestinationDetailPage({
  params,
}: DestinationDetailPageProps) {
  const { slug } = await params;
  const destination = await getPublicDestinationBySlug(slug);

  if (!destination) notFound();

  return (
    <Container className="pt-6 pb-16 md:pb-24">
      <nav
        aria-label="Đường dẫn trang"
        className="flex flex-wrap items-center gap-1.5 text-xs text-sage"
      >
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/diem-den" className="transition-colors hover:text-ink">
          Điểm đến
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate font-medium text-ink">{destination.name}</span>
      </nav>

      <article className="mt-6 overflow-hidden rounded-[24px] border border-line bg-surface">
        <div className="relative aspect-[16/9] bg-surface-warm md:aspect-[21/9]">
          {destination.image ? (
            <Image
              src={destination.image.src}
              alt={destination.image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 1200px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <MapPin aria-hidden="true" className="size-7 text-sage" />
              <span className="font-mono text-[0.68rem] tracking-[0.1em] text-sage uppercase">
                Chưa có ảnh thực địa
              </span>
              <span className="max-w-72 text-sm text-sage">{destination.name}</span>
            </div>
          )}
        </div>

        <div className="p-6 md:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface-warm px-3 py-1 text-xs font-medium text-ink">
              {destination.province}
            </span>
            <span className="rounded-full bg-clay-soft/45 px-3 py-1 text-xs font-medium text-ink">
              {destination.categoryGroupLabel}
            </span>
          </div>

          <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.03] font-medium tracking-[-0.03em] text-ink">
            {destination.name}
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-sage md:text-lg">
            {destination.description || destination.shortDescription}
          </p>

          <dl className="mt-7 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Sun aria-hidden="true" className="mt-1 size-4 shrink-0 text-clay" />
              <div>
                <dt className="text-[0.7rem] font-semibold tracking-[0.1em] text-sage uppercase">
                  Mùa đẹp
                </dt>
                <dd className="mt-1 text-sm leading-6 text-ink">
                  {destination.bestSeason || "Cả năm"}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Route aria-hidden="true" className="mt-1 size-4 shrink-0 text-clay" />
              <div>
                <dt className="text-[0.7rem] font-semibold tracking-[0.1em] text-sage uppercase">
                  Ghi chú di chuyển
                </dt>
                <dd className="mt-1 text-sm leading-6 text-ink">
                  {destination.travelNote || "Liên hệ hotline để được tư vấn lịch trình."}
                </dd>
              </div>
            </div>

            {destination.lat !== null && destination.lng !== null ? (
              <div className="flex items-start gap-2.5 sm:col-span-2">
                <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0 text-clay" />
                <div>
                  <dt className="text-[0.7rem] font-semibold tracking-[0.1em] text-sage uppercase">
                    Toạ độ
                  </dt>
                  <dd className="mt-1 font-mono text-[13px] text-ink">
                    {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                  </dd>
                </div>
              </div>
            ) : null}
          </dl>
        </div>
      </article>

      {destination.tourRefs.length > 0 ? (
        <section className="mt-10 border-t border-line pt-8">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
                Có trong hành trình
              </span>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
                Ghé thăm {destination.name} cùng chúng tôi
              </h2>
            </div>
            <p className="text-sm text-sage">
              {destination.tourRefs.length} tuyến tour đang khai thác
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {destination.tourRefs.map((tour) => (
              <Link
                key={tour.code}
                href={`/tour/${tour.slug}`}
                className="group flex items-start justify-between gap-4 rounded-[16px] border border-line bg-surface p-4 transition-colors hover:border-clay/50"
              >
                <div>
                  <span className="font-mono text-[12px] text-clay">{tour.code}</span>
                  <h3 className="mt-1 font-display text-lg font-semibold text-ink">
                    {tour.name}
                  </h3>
                </div>
                <ArrowUpRight
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-clay transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8">
        <Link
          href="/diem-den"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-clay transition-colors hover:text-clay-hover"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Xem tất cả điểm đến
        </Link>
      </div>
    </Container>
  );
}
