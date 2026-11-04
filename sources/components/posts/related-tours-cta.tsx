import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { TourDetailData } from "@/lib/contracts/tour";
import { formatLongDateVN, formatVndDisplay } from "@/lib/format";

type RelatedToursCtaProps = {
  tours: TourDetailData[];
};

export function RelatedToursCta({ tours }: RelatedToursCtaProps) {
  return (
    <div className="flex flex-col gap-3">
      {tours.map((tour) => {
        const departure = tour.departures[0] ?? null;
        const price = departure?.priceAdult ?? tour.priceAdult;

        return (
          <article
            key={tour.code}
            className="flex flex-col gap-4 rounded-[16px] border border-line bg-surface p-4 md:flex-row md:items-center md:justify-between md:p-5"
          >
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-[10px] bg-surface-warm">
                <Image
                  src={tour.coverImage.src}
                  alt={tour.coverImage.alt}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[0.68rem] text-clay">
                    {tour.code}
                  </span>
                  <span className="rounded-full bg-surface-warm px-2 py-0.5 text-[0.65rem] text-ink">
                    {tour.durationDays} ngày {tour.durationNights} đêm
                  </span>
                </div>
                <h3 className="mt-1 font-display text-lg leading-snug font-semibold text-ink">
                  <Link
                    href={`/tour/${tour.slug}`}
                    className="transition-colors hover:text-clay"
                  >
                    {tour.name}
                  </Link>
                </h3>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-sage">
                  {departure ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays aria-hidden="true" className="size-3.5" />
                      {formatLongDateVN(departure.date)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-1 text-xs leading-5 text-sage">
                  {tour.summary}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-4 border-t border-line pt-3 md:justify-end md:border-t-0 md:pt-0">
              <div>
                <span className="block text-[0.68rem] text-sage">Giá từ</span>
                <span className="font-display text-lg font-semibold text-ink tabular-nums">
                  {formatVndDisplay(price)}
                </span>
              </div>
              <Link
                href={`/tour/${tour.slug}`}
                className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-clay px-4 text-sm font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover"
              >
                Xem tour
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
