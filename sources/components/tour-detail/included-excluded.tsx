import { Check, X } from "lucide-react";
import type { TourDetailData } from "@/lib/contracts/tour";

type IncludedExcludedProps = {
  tour: TourDetailData;
};

export function IncludedExcluded({ tour }: IncludedExcludedProps) {
  return (
    <section aria-labelledby="tour-inclusions" className="border-t border-line pt-8">
      <h2
        id="tour-inclusions"
        className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight font-semibold text-ink"
      >
        Bao gồm & không bao gồm
      </h2>

      <div className="mt-7 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-success uppercase">
            <Check aria-hidden="true" className="size-4" />
            Dịch vụ bao gồm
          </h3>
          <ul className="mt-4 flex flex-col">
            {tour.includes.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 border-t border-line py-3 text-sm leading-6 text-sage"
              >
                <Check
                  aria-hidden="true"
                  className="mt-1 size-3.5 shrink-0 text-success"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-warning uppercase">
            <X aria-hidden="true" className="size-4" />
            Không bao gồm & phụ phí
          </h3>
          <ul className="mt-4 flex flex-col">
            {tour.excludes.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 border-t border-line py-3 text-sm leading-6 text-sage"
              >
                <X
                  aria-hidden="true"
                  className="mt-1 size-3.5 shrink-0 text-warning"
                />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-sage">
            Mọi khoản phụ thu phát sinh sẽ được thông báo trước khi xác nhận đơn.
          </p>
        </div>
      </div>
    </section>
  );
}
