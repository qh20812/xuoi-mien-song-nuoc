import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import type { TourDetailData } from "@/lib/contracts/tour";
import { formatLongDateVN } from "@/lib/format";

type TourHeadingProps = {
  tour: TourDetailData;
};

export function TourHeading({ tour }: TourHeadingProps) {
  const nextDeparture = tour.departures[0];

  return (
    <section className="pt-6 pb-8 md:pt-10 md:pb-10">
      <nav
        aria-label="Đường dẫn trang"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-sage"
      >
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <Link href="/tour" className="transition-colors hover:text-ink">
          Chuyến đi
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span className="truncate font-medium text-ink">{tour.name}</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="rounded-[6px] border border-line bg-surface px-3 py-1 font-mono text-xs tracking-[0.03em] text-ink">
          MÃ TOUR: {tour.code}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-sage">
          <Clock3 aria-hidden="true" className="size-4" />
          {tour.durationDays} ngày {tour.durationNights} đêm
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-sage">
          <MapPin aria-hidden="true" className="size-4" />
          Khởi hành từ TP. Hồ Chí Minh
        </span>
        {nextDeparture ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            Chuyến gần nhất: {formatLongDateVN(nextDeparture.date)}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
            Đang cập nhật lịch khởi hành
          </span>
        )}
      </div>

      <h1 className="max-w-[22ch] font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[1.04] font-medium tracking-[-0.03em] text-ink">
        {tour.name}
      </h1>
      <p className="mt-4 max-w-3xl font-display text-lg leading-snug text-clay md:text-xl">
        {tour.tagline}
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs text-sage">
        <CalendarDays aria-hidden="true" className="size-4" />
        Lịch khởi hành định kỳ, số chỗ cập nhật theo từng chuyến.
      </div>
    </section>
  );
}
