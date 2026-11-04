import { formatLongDateVN } from "@/lib/format";
import type { TourDepartureOption } from "@/lib/contracts/tour";
import { cn } from "@/lib/utils";

type DeparturePickerProps = {
  departures: TourDepartureOption[];
  selectedId: number | null;
  onSelect: (departure: TourDepartureOption) => void;
};

export function DeparturePicker({
  departures,
  selectedId,
  onSelect,
}: DeparturePickerProps) {
  if (departures.length === 0) {
    return (
      <p className="rounded-[10px] border border-line bg-surface-warm/60 p-4 text-sm text-sage">
        Tour này đang cập nhật lịch khởi hành. Vui lòng liên hệ hotline để được hỗ trợ.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {departures.map((departure) => {
        const selected = departure.id === selectedId;
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
            <span className="flex min-w-0 items-center gap-2.5">
              <input
                type="radio"
                name="booking-departure"
                value={departure.id}
                checked={selected}
                disabled={soldOut}
                onChange={() => onSelect(departure)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 rounded-full border-2",
                  selected && !soldOut
                    ? "border-clay bg-clay ring-2 ring-clay/20 ring-inset"
                    : "border-sage/50 bg-surface",
                )}
              />
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-sm font-semibold text-ink",
                    soldOut && "line-through",
                  )}
                >
                  {formatLongDateVN(departure.date)}
                </span>
                <span className="block truncate text-[0.7rem] text-sage">
                  {departure.meetingPoint}
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
              {soldOut ? "Hết chỗ" : `Còn ${departure.seatsRemaining} chỗ`}
            </span>
          </label>
        );
      })}
    </div>
  );
}
