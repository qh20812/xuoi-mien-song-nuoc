import { Utensils } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import type { TourDetailData } from "@/lib/contracts/tour";

type TourCuisinesProps = {
  tour: TourDetailData;
};

export function TourCuisines({ tour }: TourCuisinesProps) {
  if (tour.cuisines.length === 0) return null;

  return (
    <section aria-labelledby="tour-cuisines" className="border-t border-line pt-8">
      <SectionHeading
        eyebrow="Hương vị đồng bằng"
        title="Ẩm thực theo suốt chuyến đi"
        titleClassName="text-[clamp(1.75rem,3.4vw,2.5rem)]"
        description="Các món ăn địa phương xuất hiện trong chương trình, tùy theo mùa và nguyên liệu tại điểm dừng."
      />

      <div className="mt-7 grid grid-cols-1 gap-x-8 md:grid-cols-2">
        {tour.cuisines.map((cuisine, index) => (
          <article key={cuisine.slug} className="border-t border-line py-5">
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="w-8 shrink-0 font-display text-xl text-clay/60 tabular-nums"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-ink">
                    {cuisine.name}
                  </h3>
                  {cuisine.province ? (
                    <span className="text-[0.68rem] font-semibold tracking-[0.08em] text-sage uppercase">
                      {cuisine.province}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm leading-6 text-sage">
                  {cuisine.description}
                </p>
                {cuisine.whereToEat ? (
                  <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-sage/85">
                    <Utensils
                      aria-hidden="true"
                      className="mt-0.5 size-3.5 shrink-0 text-clay"
                    />
                    {cuisine.whereToEat}
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
