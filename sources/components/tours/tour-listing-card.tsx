import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Check, Clock3 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { TourListingData } from "@/lib/contracts/tour";
import { formatLongDateVN, formatVndDisplay } from "@/lib/format";
import { cn } from "@/lib/utils";

type TourListingCardProps = {
  tour: TourListingData;
  variant: "lead" | "wide" | "compact";
};

function seatsLabel(seats: number) {
  if (seats <= 0) return "Hết chỗ";
  return `Còn ${seats} chỗ`;
}

function seatsTone(seats: number) {
  if (seats <= 0) return "bg-danger/10 text-danger";
  if (seats <= 5) return "bg-warning/10 text-warning";
  return "bg-success/10 text-success";
}

export function TourListingCard({ tour, variant }: TourListingCardProps) {
  const seats = tour.nextDeparture?.seatsRemaining ?? 0;
  const isLead = variant === "lead";
  const isWide = variant === "wide";

  const visual = (
    <div className={cn("relative overflow-hidden rounded-[14px] bg-surface-warm", isLead ? "aspect-[16/10]" : isWide ? "aspect-[16/9]" : "aspect-[4/3]")}>
      <Image
        src={tour.image.src}
        alt={tour.image.alt}
        fill
        sizes={
          isLead
            ? "(min-width: 1024px) 55vw, 100vw"
            : "(min-width: 1024px) 38vw, 100vw"
        }
        className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
      />
    </div>
  );

  const meta = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-line bg-surface-warm px-2.5 py-1 font-mono text-[0.7rem] text-clay">
          {tour.code}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-sage">
          <Clock3 aria-hidden="true" className="size-3.5" />
          {tour.durationDays} ngày {tour.durationNights} đêm
        </span>
      </div>
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-[0.7rem] font-semibold",
          seatsTone(tour.nextDeparture ? seats : 0),
        )}
      >
        {tour.nextDeparture ? seatsLabel(seats) : "Đang cập nhật lịch"}
      </span>
    </div>
  );

  const footer = (
    <div
      className={cn(
        "mt-5 flex flex-col justify-between gap-4 border-t border-line bg-surface-warm/50 px-4 py-4 sm:flex-row sm:items-end",
        isLead ? "rounded-[12px] px-5" : "rounded-[12px]",
      )}
    >
      <div>
        <span className="block text-[0.7rem] text-sage">
          {tour.nextDeparture ? "Khởi hành gần nhất" : "Giá tour"}
        </span>
        {tour.nextDeparture ? (
          <span className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
            <CalendarDays aria-hidden="true" className="size-3.5 text-clay" />
            {formatLongDateVN(tour.nextDeparture.date)}
          </span>
        ) : null}
        <span className="mt-2 block font-display text-xl font-semibold text-ink tabular-nums">
          {formatVndDisplay(tour.priceFrom)}
          <span className="ml-1 font-sans text-xs font-normal text-sage">/ khách</span>
        </span>
      </div>

      <Link
        href={`/tour/${tour.slug}`}
        className={cn(
          buttonVariants({ variant: "site", size: isLead ? "site" : "site-sm" }),
          "shrink-0",
        )}
      >
        Xem chi tiết
      </Link>
    </div>
  );

  if (isLead) {
    return (
      <article className="group rounded-[22px] border border-line bg-surface p-5 shadow-[0_18px_48px_-24px_rgba(23,51,43,0.14)] transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-ink/35 md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            {meta}
            <div className="mt-4">{visual}</div>
          </div>

          <div className="flex flex-col lg:col-span-5">
            <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-clay uppercase">
              Hành trình chủ lực
            </span>
            <h2 className="mt-2 font-display text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[1.07] font-semibold text-ink">
              <Link href={`/tour/${tour.slug}`} className="transition-colors hover:text-clay">
                {tour.name}
              </Link>
            </h2>
            <p className="mt-3 font-display text-base leading-snug text-clay">
              {tour.tagline}
            </p>
            <p className="mt-3 text-sm leading-6 text-sage md:text-base">
              {tour.summary}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-2.5 border-t border-line pt-4 sm:grid-cols-2">
              {tour.highlights.map((highlight) => (
                <span key={highlight} className="flex items-start gap-2 text-sm text-ink">
                  <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-clay" />
                  {highlight}
                </span>
              ))}
            </div>

            <div className="mt-auto">
              {footer}
              <div className="mt-3 flex justify-end">
                <Link
                  href={`/tour/${tour.slug}#tour-itinerary`}
                  className="text-xs font-semibold text-sage underline underline-offset-4 transition-colors hover:text-ink"
                >
                  Xem lịch trình chi tiết
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col rounded-[20px] border border-line bg-surface p-5 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-ink/35 md:p-6">
      {meta}
      <div className="mt-4">{visual}</div>

      <div className="mt-4 flex flex-1 flex-col">
        <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-clay uppercase">
          Hành trình chọn lọc
        </span>
        <h3 className="mt-1 font-display text-xl leading-tight font-semibold text-ink md:text-2xl">
          <Link href={`/tour/${tour.slug}`} className="transition-colors hover:text-clay">
            {tour.name}
          </Link>
        </h3>
        <p className="mt-2 font-display text-sm leading-snug text-clay">
          {tour.tagline}
        </p>
        <p className="mt-2 text-sm leading-6 text-sage">{tour.summary}</p>
      </div>

      {footer}
    </article>
  );
}
