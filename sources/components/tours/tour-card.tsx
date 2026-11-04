import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { TourCardData } from "@/lib/contracts/home";
import { formatLongDateVN, formatVndDisplay } from "@/lib/format";
import { cn } from "@/lib/utils";

type TourCardProps = {
  tour: TourCardData;
  variant?: "featured" | "compact";
};

function durationLabel(tour: TourCardData) {
  return `${tour.durationDays} ngày ${tour.durationNights} đêm`;
}

function seatLabel(seats: number) {
  if (seats <= 0) return "Hết chỗ";
  return `Còn ${seats} chỗ`;
}

export function TourCard({ tour, variant = "featured" }: TourCardProps) {
  const seats = tour.nextDeparture?.seatsRemaining ?? 0;
  const seatTone =
    seats === 0
      ? "bg-danger/10 text-danger"
      : seats <= 5
        ? "bg-warning/10 text-warning"
        : "bg-success/10 text-success";

  if (variant === "compact") {
    return (
      <article className="flex flex-col justify-between rounded-[20px] border border-line bg-surface p-5 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-ink/40 md:p-6">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded border border-line bg-surface-warm px-2.5 py-1 font-mono text-[0.7rem] tracking-[0.02em] text-ink">
              {tour.code}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                seatTone,
              )}
            >
              {seatLabel(seats)}
            </span>
          </div>

          <h3 className="font-display text-[1.45rem] leading-tight font-semibold text-ink">
            <Link
              href={`/tour/${tour.slug}`}
              className="transition-colors hover:text-clay"
            >
              {tour.name}
            </Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-sage">{tour.summary}</p>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-sage">
            {tour.nextDeparture ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden="true" className="size-3.5" />
                {formatLongDateVN(tour.nextDeparture.date)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Clock3 aria-hidden="true" className="size-3.5" />
              {durationLabel(tour)}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-line pt-4">
          <div>
            <span className="block text-xs text-sage">Giá từ</span>
            <span className="font-display text-xl font-semibold text-ink tabular-nums">
              {formatVndDisplay(tour.priceFrom)}
            </span>
          </div>
          <Link
            href={`/tour/${tour.slug}`}
            className={buttonVariants({ variant: "site-outline", size: "site-sm" })}
          >
            Xem chi tiết
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-surface transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-ink/40">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 pb-4 md:px-6">
        <span className="rounded border border-line bg-surface-warm px-2.5 py-1 font-mono text-xs tracking-[0.02em] text-ink">
          {tour.code}
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            seatTone,
          )}
        >
          {seatLabel(seats)}
        </span>
      </div>

      {tour.image ? (
        <div className="relative mx-5 aspect-[16/10] overflow-hidden rounded-[14px] bg-surface-warm md:mx-6">
          <Image
            src={tour.image.src}
            alt={tour.image.alt}
            fill
            sizes="(min-width: 1024px) 54vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-sage">
          {tour.nextDeparture ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              {formatLongDateVN(tour.nextDeparture.date)}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden="true" className="size-3.5" />
            {durationLabel(tour)}
          </span>
        </div>

        <h3 className="mt-3 font-display text-[1.7rem] leading-tight font-semibold text-ink">
          <Link
            href={`/tour/${tour.slug}`}
            className="transition-colors hover:text-clay"
          >
            {tour.name}
          </Link>
        </h3>
        <p className="mt-3 text-sm leading-6 text-sage md:text-base">{tour.summary}</p>

        {tour.highlights.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-2 border-t border-line pt-4 text-xs text-ink sm:grid-cols-2">
            {tour.highlights.map((highlight) => (
              <span key={highlight} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-clay"
                />
                {highlight}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-line bg-surface-warm/45 px-5 py-5 md:px-6">
        <div>
          <span className="block text-xs text-sage">Giá trọn gói từ</span>
          <span className="font-display text-2xl font-semibold text-ink tabular-nums">
            {formatVndDisplay(tour.priceFrom)}
          </span>
          <span className="ml-1 text-xs text-sage">/ khách</span>
        </div>
        <Link
          href={`/dat-tour?tour=${tour.slug}`}
          className={buttonVariants({ variant: "site", size: "site" })}
        >
          Giữ chỗ ngay
        </Link>
      </div>
    </article>
  );
}
