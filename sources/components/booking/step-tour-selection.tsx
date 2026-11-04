import Image from "next/image";
import { Check, Info } from "lucide-react";
import { DeparturePicker } from "@/components/booking/departure-picker";
import { GuestCounter } from "@/components/booking/guest-counter";
import { calculateBookingPreview, totalSeats } from "@/lib/booking/preview";
import type {
  BookingGuestCounts,
  BookingTourOption,
} from "@/lib/contracts/booking";
import type { TourDepartureOption } from "@/lib/contracts/tour";
import { formatVndDisplay } from "@/lib/format";
import { cn } from "@/lib/utils";

type StepTourSelectionProps = {
  tours: BookingTourOption[];
  selectedTour: BookingTourOption;
  selectedDeparture: TourDepartureOption | null;
  guests: BookingGuestCounts;
  maxSeats: number;
  error?: string;
  onSelectTour: (tour: BookingTourOption) => void;
  onSelectDeparture: (departure: TourDepartureOption) => void;
  onChangeGuests: (
    key: keyof BookingGuestCounts,
    delta: number,
  ) => void;
};

export function StepTourSelection({
  tours,
  selectedTour,
  selectedDeparture,
  guests,
  maxSeats,
  error,
  onSelectTour,
  onSelectDeparture,
  onChangeGuests,
}: StepTourSelectionProps) {
  const seats = totalSeats(guests);
  const preview = calculateBookingPreview(selectedTour, selectedDeparture, guests);

  return (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="text-sm font-semibold tracking-[0.08em] text-ink uppercase">
          1. Chọn tour
        </legend>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {tours.map((tour) => {
            const selected = tour.slug === selectedTour.slug;

            return (
              <label
                key={tour.slug}
                className={cn(
                  "group relative flex cursor-pointer flex-col overflow-hidden rounded-[16px] border bg-surface transition-[border-color,transform]",
                  selected
                    ? "border-2 border-clay"
                    : "border-line hover:-translate-y-0.5 hover:border-ink/40",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-clay/50",
                )}
              >
                <input
                  type="radio"
                  name="booking-tour"
                  value={tour.slug}
                  checked={selected}
                  onChange={() => onSelectTour(tour)}
                  className="sr-only"
                />
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-warm">
                  <Image
                    src={tour.coverImage.src}
                    alt={tour.coverImage.alt}
                    fill
                    sizes="(min-width: 768px) 30vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[0.7rem] text-clay">{tour.code}</span>
                    {selected ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-clay text-contrast-on-accent">
                        <Check aria-hidden="true" className="size-3" />
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="size-4 rounded-full border border-line"
                      />
                    )}
                  </div>
                  <h3 className="mt-2 line-clamp-2 font-display text-lg leading-snug font-semibold text-ink">
                    {tour.name}
                  </h3>
                  <span className="mt-1 text-xs text-sage">
                    {tour.durationDays} ngày {tour.durationNights} đêm
                  </span>
                  <span className="mt-3 border-t border-line pt-3 font-display text-lg font-semibold text-ink tabular-nums">
                    {formatVndDisplay(tour.priceAdult)}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-[0.08em] text-ink uppercase">
            2. Chọn ngày khởi hành
          </h2>
          <span className="text-xs text-sage">Lịch khởi hành định kỳ</span>
        </div>
        <div className="mt-4">
          <DeparturePicker
            departures={selectedTour.departures}
            selectedId={selectedDeparture?.id ?? null}
            onSelect={onSelectDeparture}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold tracking-[0.08em] text-ink uppercase">
          3. Số lượng khách
        </h2>
        <div className="mt-4 rounded-[16px] border border-line bg-surface p-4 md:p-5">
          <GuestCounter
            label="Người lớn"
            note="Từ 11 tuổi trở lên"
            priceLabel={`${formatVndDisplay(preview.priceAdult)} / khách`}
            value={guests.adults}
            canDecrease={guests.adults > 1}
            canIncrease={seats < maxSeats}
            onChange={(delta) => onChangeGuests("adults", delta)}
          />
          <GuestCounter
            label="Trẻ em"
            note="Từ 5 đến 10 tuổi · 70% giá người lớn"
            priceLabel={`${formatVndDisplay(preview.priceChild)} / khách`}
            value={guests.children}
            canDecrease={guests.children > 0}
            canIncrease={seats < maxSeats}
            onChange={(delta) => onChangeGuests("children", delta)}
          />
          <GuestCounter
            label="Em bé"
            note="Dưới 5 tuổi · vẫn có 1 chỗ ngồi riêng"
            priceLabel="Miễn phí"
            value={guests.infants}
            canDecrease={guests.infants > 0}
            canIncrease={seats < maxSeats}
            onChange={(delta) => onChangeGuests("infants", delta)}
          />

          <div className="mt-4 flex flex-col justify-between gap-2 rounded-[10px] bg-canvas p-3 text-xs text-sage sm:flex-row sm:items-center">
            <span className="font-medium text-ink">
              Tổng số ghế: <strong className="text-clay">{seats} chỗ</strong>
            </span>
            <span>
              {selectedDeparture
                ? `Chuyến còn ${selectedDeparture.seatsRemaining} chỗ`
                : "Chưa chọn ngày khởi hành"}
            </span>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-sage">
          <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-clay" />
          Em bé miễn phí nhưng vẫn chiếm một chỗ ngồi. Mỗi đơn tối đa 20 khách.
        </p>
      </section>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
