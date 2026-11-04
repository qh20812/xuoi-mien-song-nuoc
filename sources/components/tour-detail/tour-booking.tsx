"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { calculateBookingPreview } from "@/lib/booking/preview";
import type { SiteSettings } from "@/lib/contracts/site";
import type { TourDetailData } from "@/lib/contracts/tour";
import {
  formatLongDateVN,
  formatVndDisplay,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type GuestCounts = {
  adults: number;
  children: number;
  infants: number;
};

type TourBookingProps = {
  tour: TourDetailData;
  settings: SiteSettings;
  children: ReactNode;
};

type GuestRowProps = {
  label: string;
  note: string;
  priceLabel: string;
  value: number;
  canDecrease: boolean;
  canIncrease: boolean;
  onChange: (delta: number) => void;
};

function clampGuestsToSeats(
  current: GuestCounts,
  seatsRemaining: number,
): GuestCounts {
  const adults = Math.max(1, Math.min(current.adults, seatsRemaining));
  const children = Math.min(
    current.children,
    Math.max(0, seatsRemaining - adults),
  );
  const infants = Math.min(
    current.infants,
    Math.max(0, seatsRemaining - adults - children),
  );

  return { adults, children, infants };
}

function GuestRow({
  label,
  note,
  priceLabel,
  value,
  canDecrease,
  canIncrease,
  onChange,
}: GuestRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs text-sage">{note}</span>
        <span className="mt-0.5 block font-mono text-[0.72rem] text-sage">
          {priceLabel}
        </span>
      </div>
      <div className="flex shrink-0 items-center rounded-[8px] border border-line bg-surface">
        <button
          type="button"
          aria-label={`Giảm ${label}`}
          disabled={!canDecrease}
          onClick={() => onChange(-1)}
          className="flex size-11 items-center justify-center rounded-l-[8px] text-ink transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <span className="w-10 text-center font-mono text-sm font-semibold text-ink tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Tăng ${label}`}
          disabled={!canIncrease}
          onClick={() => onChange(1)}
          className="flex size-11 items-center justify-center rounded-r-[8px] text-ink transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function TourBooking({ tour, settings, children }: TourBookingProps) {
  const [selectedDepartureId, setSelectedDepartureId] = useState(
    tour.departures[0]?.id ?? 0,
  );
  const [guestCounts, setGuestCounts] = useState<GuestCounts>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [footerVisible, setFooterVisible] = useState(false);

  const selectedDeparture = useMemo(
    () =>
      tour.departures.find(
        (departure) => departure.id === selectedDepartureId,
      ) ?? null,
    [selectedDepartureId, tour.departures],
  );

  const seatsRemaining = selectedDeparture?.seatsRemaining ?? 0;
  const maxGuests = Math.min(
    settings.booking.maxGuestsPerOrder,
    seatsRemaining,
  );

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const preview = calculateBookingPreview(
    tour,
    selectedDeparture,
    guestCounts,
  );
  const { priceAdult, priceChild } = preview;
  const totalGuests = preview.seats;
  const total = preview.total;
  const canBook =
    selectedDeparture !== null &&
    selectedDeparture.seatsRemaining > 0 &&
    guestCounts.adults >= 1;

  const bookingHref = selectedDeparture
    ? `/dat-tour?${new URLSearchParams({
        tour: tour.slug,
        departureId: String(selectedDeparture.id),
        adults: String(guestCounts.adults),
        children: String(guestCounts.children),
        infants: String(guestCounts.infants),
      }).toString()}`
    : "/dat-tour";

  function changeDeparture(departureId: number, availableSeats: number) {
    setSelectedDepartureId(departureId);
    setGuestCounts((current) => clampGuestsToSeats(current, availableSeats));
  }

  function changeGuests(key: keyof GuestCounts, delta: number) {
    setGuestCounts((current) => {
      const next = { ...current, [key]: current[key] + delta };
      if (
        next.adults < 1 ||
        next.children < 0 ||
        next.infants < 0
      ) {
        return current;
      }

      const nextTotal = next.adults + next.children + next.infants;
      if (nextTotal > maxGuests) return current;

      return next;
    });
  }

  const panel = (
    <div className="rounded-[20px] border border-line bg-surface p-5 shadow-[0_18px_48px_-24px_rgba(23,51,43,0.22)] md:p-6">
      <div className="border-b border-line pb-4">
        <span className="text-[0.68rem] font-semibold tracking-[0.13em] text-sage uppercase">
          Giá tour trọn gói từ
        </span>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="font-display text-3xl font-semibold tracking-tight text-clay tabular-nums">
            {formatVndDisplay(priceAdult)}
          </span>
          <span className="text-sm text-sage">/ người lớn</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-sage">
          Chưa bao gồm các khoản không có trong mục “Dịch vụ bao gồm”.
        </p>
      </div>

      <div className="space-y-2 border-b border-line py-4 text-sm">
        <div className="flex items-center justify-between gap-3 text-ink">
          <span>Người lớn (từ 11 tuổi)</span>
          <span className="font-mono text-xs text-clay">
            {formatVndDisplay(priceAdult)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-ink">
          <span>Trẻ em (5–10 tuổi)</span>
          <span className="font-mono text-xs text-clay">
            {formatVndDisplay(priceChild)}
          </span>
        </div>
        <div className="flex items-start justify-between gap-3 text-ink">
          <span>
            Em bé (dưới 5 tuổi)
            <span className="mt-0.5 block text-xs text-sage">
              Miễn phí · vẫn có 1 chỗ ngồi riêng
            </span>
          </span>
          <span className="font-mono text-xs text-success">Miễn phí</span>
        </div>
      </div>

      <fieldset className="border-b border-line py-4">
        <legend className="mb-3 text-sm font-semibold text-ink">
          Chọn ngày khởi hành
        </legend>
        <div className="flex flex-col gap-2">
          {tour.departures.map((departure) => {
            const selected = departure.id === selectedDepartureId;
            const soldOut = departure.seatsRemaining <= 0;

            return (
              <label
                key={departure.id}
                className={cn(
                  "flex min-h-14 items-center justify-between gap-3 rounded-[10px] border p-3 transition-colors",
                  soldOut
                    ? "cursor-not-allowed border-line bg-canvas/60 opacity-60"
                    : "cursor-pointer border-line bg-surface hover:bg-canvas",
                  selected &&
                    !soldOut &&
                    "border-2 border-clay bg-clay-soft/35 hover:bg-clay-soft/35",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-clay/50",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="departure"
                    value={departure.id}
                    checked={selected}
                    disabled={soldOut}
                    onChange={() =>
                      changeDeparture(departure.id, departure.seatsRemaining)
                    }
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-4 rounded-full border-2",
                      selected && !soldOut
                        ? "border-clay bg-clay ring-2 ring-clay/20 ring-inset"
                        : "border-sage/50 bg-surface",
                    )}
                  />
                  <span>
                    <span
                      className={cn(
                        "block text-sm font-semibold text-ink",
                        soldOut && "line-through",
                      )}
                    >
                      {formatLongDateVN(departure.date)}
                    </span>
                    <span className="block text-[0.7rem] text-sage">
                      Đón tại Quận 1 / Bến xe Miền Tây
                    </span>
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold",
                    soldOut
                      ? "bg-danger/10 text-danger"
                      : departure.seatsRemaining <= 5
                        ? "bg-warning/10 text-warning"
                        : "bg-success/10 text-success",
                  )}
                >
                  {soldOut
                    ? "Hết chỗ"
                    : `Còn ${departure.seatsRemaining} chỗ`}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="border-b border-line py-4">
        <legend className="mb-3 text-sm font-semibold text-ink">
          Số lượng khách
        </legend>
        <div className="flex flex-col gap-3">
          <GuestRow
            label="Người lớn"
            note="Từ 11 tuổi"
            priceLabel={formatVndDisplay(priceAdult)}
            value={guestCounts.adults}
            canDecrease={guestCounts.adults > 1}
            canIncrease={totalGuests < maxGuests}
            onChange={(delta) => changeGuests("adults", delta)}
          />
          <GuestRow
            label="Trẻ em"
            note="5–10 tuổi"
            priceLabel={formatVndDisplay(priceChild)}
            value={guestCounts.children}
            canDecrease={guestCounts.children > 0}
            canIncrease={totalGuests < maxGuests}
            onChange={(delta) => changeGuests("children", delta)}
          />
          <GuestRow
            label="Em bé"
            note="Dưới 5 tuổi · có ghế riêng"
            priceLabel="Miễn phí"
            value={guestCounts.infants}
            canDecrease={guestCounts.infants > 0}
            canIncrease={totalGuests < maxGuests}
            onChange={(delta) => changeGuests("infants", delta)}
          />
        </div>
      </fieldset>

      <div className="pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-ink">Tạm tính</span>
          <span
            aria-live="polite"
            className="font-display text-xl font-semibold text-clay tabular-nums"
          >
            {formatVndDisplay(total)}
          </span>
        </div>
        <p className="mt-1 text-right text-[0.7rem] text-sage">
          {totalGuests} khách · giá cuối cùng do nhân viên xác nhận
        </p>

        <div className="mt-4 rounded-[10px] border border-line bg-canvas p-3">
          <p className="flex items-start gap-2 text-[0.72rem] leading-5 text-sage">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-clay"
            />
            Giữ chỗ tối đa {settings.booking.holdHours} giờ, không thu tiền trực
            tuyến. Nhân viên liên hệ hướng dẫn đặt cọc để xác nhận.
          </p>
        </div>

        <Link
          href={bookingHref}
          aria-disabled={!canBook}
          className={cn(
            buttonVariants({ variant: "site", size: "site" }),
            "mt-4 w-full",
            !canBook && "pointer-events-none opacity-50",
          )}
        >
          Tiến hành đặt giữ chỗ
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        <p className="mt-2 text-center text-[0.68rem] leading-4 text-sage">
          Hủy miễn phí trước {settings.booking.cancelCutoffDays} ngày khởi hành.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="order-2 min-w-0 lg:order-1 lg:col-span-8">{children}</div>

        <aside className="order-1 self-start lg:sticky lg:top-28 lg:order-2 lg:col-span-4">
          {panel}

          <div className="mt-5 rounded-[20px] border border-line bg-surface p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-clay-soft text-clay">
                <Phone aria-hidden="true" className="size-4" />
              </span>
              <div>
                <span className="block text-sm font-semibold text-ink">
                  Cần tư vấn thêm?
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-sage">
                  Điều phối viên hỗ trợ qua điện thoại và Zalo.
                </span>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
              <a
                href={settings.hotlineHref}
                className="inline-flex min-h-10 items-center gap-2 font-semibold text-ink transition-colors hover:text-clay"
              >
                <Phone aria-hidden="true" className="size-4 text-sage" />
                {settings.hotline}
              </a>
              <a
                href={settings.zaloHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 font-semibold text-ink transition-colors hover:text-clay"
              >
                <MessageCircle aria-hidden="true" className="size-4 text-sage" />
                Zalo · {settings.supportHours}
              </a>
            </div>
          </div>
        </aside>
      </div>

      <div className="h-20 lg:hidden" aria-hidden="true" />

      {!footerVisible && selectedDeparture ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_32px_-24px_rgba(23,51,43,0.5)] lg:hidden">
          <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <span className="block truncate text-[0.68rem] text-sage">
                {formatLongDateVN(selectedDeparture.date)}
              </span>
              <span className="font-display text-lg font-semibold text-clay tabular-nums">
                {formatVndDisplay(total)}
              </span>
            </div>
            <Link
              href={bookingHref}
              aria-disabled={!canBook}
              className={cn(
                buttonVariants({ variant: "site", size: "site-sm" }),
                "shrink-0",
                !canBook && "pointer-events-none opacity-50",
              )}
            >
              Giữ chỗ
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
