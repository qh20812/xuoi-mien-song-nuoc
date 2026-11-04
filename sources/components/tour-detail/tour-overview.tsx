import { Check } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import type { TourDetailData } from "@/lib/contracts/tour";

type TourOverviewProps = {
  tour: TourDetailData;
};

export function TourOverview({ tour }: TourOverviewProps) {
  return (
    <section aria-labelledby="tour-overview" className="border-t border-line pt-8">
      <SectionHeading
        eyebrow="Tóm lược chuyến đi"
        title="Hành trình trọn vẹn mạch nguồn phù sa"
        titleClassName="text-[clamp(1.75rem,3.4vw,2.5rem)]"
      />
      <p className="mt-5 max-w-[70ch] text-base leading-7 text-sage">
        {tour.description}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-line pt-6 md:grid-cols-2">
        {tour.highlights.map((highlight) => (
          <div key={highlight} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
              <Check aria-hidden="true" className="size-3.5" />
            </span>
            <p className="text-sm leading-6 font-medium text-ink">{highlight}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
