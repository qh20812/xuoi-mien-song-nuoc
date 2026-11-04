import Image from "next/image";
import { CalendarDays, MapPin, MessageCircle, Phone, Users } from "lucide-react";
import { calculateBookingPreview } from "@/lib/booking/preview";
import type {
  BookingGuestCounts,
  BookingTourOption,
} from "@/lib/contracts/booking";
import type { SiteSettings } from "@/lib/contracts/site";
import type { TourDepartureOption } from "@/lib/contracts/tour";
import { formatLongDateVN, formatVndDisplay } from "@/lib/format";

type BookingSummaryProps = {
  tour: BookingTourOption;
  departure: TourDepartureOption | null;
  guests: BookingGuestCounts;
  pickupPoint: string;
  settings: SiteSettings;
  embedded?: boolean;
};

function guestSummary(guests: BookingGuestCounts) {
  const parts = [`${guests.adults} người lớn`];
  if (guests.children > 0) parts.push(`${guests.children} trẻ em`);
  if (guests.infants > 0) parts.push(`${guests.infants} em bé`);
  return parts.join(", ");
}

export function BookingSummary({
  tour,
  departure,
  guests,
  pickupPoint,
  settings,
  embedded = false,
}: BookingSummaryProps) {
  const preview = calculateBookingPreview(tour, departure, guests);

  return (
    <div
      className={
        embedded
          ? "bg-surface"
          : "rounded-[20px] border border-line bg-surface p-5 shadow-[0_18px_48px_-24px_rgba(23,51,43,0.22)]"
      }
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[14px] bg-surface-warm">
        <Image
          src={tour.coverImage.src}
          alt={tour.coverImage.alt}
          fill
          sizes="(min-width: 1024px) 30vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded border border-line bg-surface-warm px-2.5 py-1 font-mono text-[0.7rem] text-clay">
          {tour.code}
        </span>
        <span className="text-xs text-sage">
          {tour.durationDays} ngày {tour.durationNights} đêm
        </span>
      </div>
      <h2 className="mt-2 font-display text-xl leading-tight font-semibold text-ink">
        {tour.name}
      </h2>

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
        <div className="flex items-start gap-2.5">
          <CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage" />
          <div>
            <span className="block text-[0.7rem] text-sage">Ngày khởi hành</span>
            <span className="block text-sm font-semibold text-ink">
              {departure ? formatLongDateVN(departure.date) : "Chưa chọn"}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage" />
          <div>
            <span className="block text-[0.7rem] text-sage">Điểm đón</span>
            <span className="block text-sm font-medium text-ink">
              {pickupPoint || "Chưa chọn"}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage" />
          <div>
            <span className="block text-[0.7rem] text-sage">Đoàn của bạn</span>
            <span className="block text-sm font-medium text-ink">
              {guestSummary(guests)} · {preview.seats} chỗ
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[12px] border border-line bg-canvas p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-sage">
            {guests.adults} × Người lớn
          </span>
          <span className="font-mono text-xs text-ink tabular-nums">
            {formatVndDisplay(guests.adults * preview.priceAdult)}
          </span>
        </div>
        {guests.children > 0 ? (
          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-sage">
              {guests.children} × Trẻ em
            </span>
            <span className="font-mono text-xs text-ink tabular-nums">
              {formatVndDisplay(guests.children * preview.priceChild)}
            </span>
          </div>
        ) : null}
        {guests.infants > 0 ? (
          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-sage">
              {guests.infants} × Em bé
            </span>
            <span className="font-mono text-xs text-success">Miễn phí</span>
          </div>
        ) : null}
        {preview.surchargePerPerson > 0 ? (
          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-sage">Phụ thu ngày lễ</span>
            <span className="font-mono text-xs text-ink tabular-nums">
              {formatVndDisplay(preview.billedGuests * preview.surchargePerPerson)}
            </span>
          </div>
        ) : null}
        <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-3">
          <span className="text-sm font-semibold text-ink">Tạm tính</span>
          <span className="font-display text-xl font-semibold text-clay tabular-nums">
            {formatVndDisplay(preview.total)}
          </span>
        </div>
        <p className="mt-1 text-right text-[0.68rem] text-sage">
          Giá cuối cùng do nhân viên xác nhận
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
        <a
          href={settings.hotlineHref}
          className="inline-flex min-h-10 items-center gap-2 font-medium text-ink transition-colors hover:text-clay"
        >
          <Phone aria-hidden="true" className="size-4 text-sage" />
          {settings.hotline}
        </a>
        <a
          href={settings.zaloHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center gap-2 font-medium text-ink transition-colors hover:text-clay"
        >
          <MessageCircle aria-hidden="true" className="size-4 text-sage" />
          Zalo · {settings.supportHours}
        </a>
      </div>
    </div>
  );
}
