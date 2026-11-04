import { Minus, Plus } from "lucide-react";

type GuestCounterProps = {
  label: string;
  note: string;
  priceLabel: string;
  value: number;
  canDecrease: boolean;
  canIncrease: boolean;
  onChange: (delta: number) => void;
};

export function GuestCounter({
  label,
  note,
  priceLabel,
  value,
  canDecrease,
  canIncrease,
  onChange,
}: GuestCounterProps) {
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-line py-4 last:border-b-0 sm:flex-row sm:items-center">
      <div>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs text-sage">{note}</span>
        <span className="mt-1 block font-mono text-xs text-clay">{priceLabel}</span>
      </div>
      <div className="flex shrink-0 items-center self-start rounded-[8px] border border-line bg-surface sm:self-auto">
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
