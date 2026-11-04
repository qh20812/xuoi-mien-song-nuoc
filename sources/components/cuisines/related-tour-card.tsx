import Link from "next/link";
import { CalendarDays, Clock3, Utensils } from "lucide-react";
import type { CuisineListingData } from "@/lib/contracts/cuisine";
import type { TourDetailData } from "@/lib/contracts/tour";
import type { CuisineMealMatch } from "@/lib/cuisines/detail";
import { formatLongDateVN, formatVndDisplay } from "@/lib/format";
import { cn } from "@/lib/utils";

type RelatedTourCardProps = {
  tour: TourDetailData;
  cuisine: CuisineListingData;
  meal: CuisineMealMatch | null;
};

function seatsLabel(seats: number) {
  if (seats <= 0) return "Hết chỗ";
  if (seats <= 5) return `Còn ${seats} chỗ`;
  return `Còn ${seats} chỗ`;
}

export function RelatedTourCard({
  tour,
  cuisine,
  meal,
}: RelatedTourCardProps) {
  const departure = tour.departures[0] ?? null;
  const seats = departure?.seatsRemaining ?? 0;
  const price = departure?.priceAdult ?? tour.priceAdult;

  return (
    <article className="flex h-full flex-col rounded-[18px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded border border-line bg-surface-warm px-2.5 py-1 font-mono text-[0.68rem] text-clay">
          {tour.code}
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[0.68rem] font-semibold",
            seats === 0
              ? "bg-danger/10 text-danger"
              : seats <= 5
                ? "bg-warning/10 text-warning"
                : "bg-success/10 text-success",
          )}
        >
          {departure ? seatsLabel(seats) : "Đang cập nhật lịch"}
        </span>
      </div>

      <h3 className="mt-3 font-display text-xl leading-snug font-semibold text-ink">
        <Link
          href={`/tour/${tour.slug}`}
          className="transition-colors hover:text-clay"
        >
          {tour.name}
        </Link>
      </h3>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-sage">
        {departure ? (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            {formatLongDateVN(departure.date)}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <Clock3 aria-hidden="true" className="size-3.5" />
          {tour.durationDays} ngày {tour.durationNights} đêm
        </span>
      </div>

      <div className="mt-4 rounded-[10px] bg-canvas p-3 text-xs leading-5 text-sage">
        <span className="flex items-start gap-2">
          <Utensils aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-clay" />
          <span>
            {meal
              ? `${meal.label} ngày ${meal.dayNumber}: ${meal.meal}`
              : `Món ${cuisine.name} nằm trong chương trình ăn uống của tour.`}
          </span>
        </span>
      </div>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
        <div>
          <span className="block text-[0.68rem] text-sage">Giá từ</span>
          <span className="font-display text-lg font-semibold text-ink tabular-nums">
            {formatVndDisplay(price)}
          </span>
        </div>
        <Link
          href={`/tour/${tour.slug}`}
          className="text-sm font-semibold text-clay transition-colors hover:text-clay-hover"
        >
          Xem tour
        </Link>
      </div>
    </article>
  );
}
