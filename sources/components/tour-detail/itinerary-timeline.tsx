import { SectionHeading } from "@/components/ui/section-heading";
import type { TourDetailData, TourItineraryItem } from "@/lib/contracts/tour";

type ItineraryTimelineProps = {
  tour: TourDetailData;
};

const SLOT_LABELS: Record<TourItineraryItem["slot"], string> = {
  morning: "Buổi sáng",
  afternoon: "Buổi chiều",
  evening: "Buổi tối",
};

export function ItineraryTimeline({ tour }: ItineraryTimelineProps) {
  return (
    <section
      id="tour-itinerary"
      aria-labelledby="tour-itinerary"
      className="scroll-mt-28 border-t border-line pt-8"
    >
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <SectionHeading
          eyebrow="Mạch thời gian"
          title={`Lịch trình ${tour.durationDays} ngày ${tour.durationNights} đêm`}
          titleClassName="text-[clamp(1.75rem,3.4vw,2.5rem)]"
        />
        <p className="text-sm text-sage">
          {tour.itineraryDays.length} ngày · Lịch trình có thể điều chỉnh theo con nước.
        </p>
      </div>

      <ol className="mt-8 ml-2 border-l border-line">
        {tour.itineraryDays.map((day) => (
          <li
            key={day.dayNumber}
            className="relative pb-10 pl-7 last:pb-0 md:pl-9"
          >
            <span
              aria-hidden="true"
              className="absolute top-1.5 -left-[7px] size-3.5 rounded-full border-[3px] border-clay bg-canvas"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs font-semibold tracking-[0.08em] text-clay uppercase">
                Ngày {String(day.dayNumber).padStart(2, "0")}
              </span>
              <span className="rounded-[8px] border border-line bg-surface px-3 py-1.5 text-xs text-sage">
                Ăn: {day.meals.breakfast} · {day.meals.lunch} · {day.meals.dinner}
              </span>
            </div>

            <h3 className="mt-2 font-display text-xl font-semibold text-ink md:text-2xl">
              {day.title}
            </h3>

            <div className="mt-4 flex flex-col gap-4">
              {day.items.map((item) => (
                <div
                  key={`${day.dayNumber}-${item.slot}-${item.title}`}
                  className="grid grid-cols-1 gap-1.5 sm:grid-cols-[7rem_1fr] sm:gap-4"
                >
                  <span className="text-xs font-semibold tracking-[0.08em] text-sage uppercase">
                    {SLOT_LABELS[item.slot]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-sage">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {day.hotel ? (
              <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-sage">
                <span className="font-semibold text-ink">Lưu trú:</span> {day.hotel}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
