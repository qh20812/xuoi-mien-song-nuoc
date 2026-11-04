import { Backpack } from "lucide-react";
import type { TourDetailData } from "@/lib/contracts/tour";

type PackingNotesProps = {
  tour: TourDetailData;
};

export function PackingNotes({ tour }: PackingNotesProps) {
  return (
    <section aria-labelledby="tour-packing" className="border-t border-line pt-8">
      <h2
        id="tour-packing"
        className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink md:text-2xl"
      >
        <Backpack aria-hidden="true" className="size-5 text-clay" />
        Hành lý & chuẩn bị
      </h2>
      <p className="mt-3 max-w-[68ch] text-sm leading-7 text-sage">
        {tour.packingNotes}
      </p>
    </section>
  );
}
