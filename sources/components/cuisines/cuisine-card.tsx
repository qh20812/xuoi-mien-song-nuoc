import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { CuisineListingData } from "@/lib/contracts/cuisine";
import { cn } from "@/lib/utils";

type CuisineCardProps = {
  cuisine: CuisineListingData;
  total: number;
  variant: "lead" | "wide" | "compact";
};

function RelatedTours({ cuisine }: { cuisine: CuisineListingData }) {
  if (cuisine.tourRefs.length === 0) {
    return <span className="text-xs text-sage">Ngoài lịch trình hiện tại</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[0.68rem] text-sage">Có trong:</span>
      {cuisine.tourRefs.map((tour) => (
        <Link
          key={tour.code}
          href={`/tour/${tour.slug}`}
          title={tour.name}
          className="rounded border border-line bg-surface-warm px-2 py-0.5 font-mono text-[0.65rem] text-clay transition-colors hover:border-clay/40 hover:bg-clay-soft/40"
        >
          {tour.code}
        </Link>
      ))}
    </div>
  );
}

function DetailLink({ cuisine }: { cuisine: CuisineListingData }) {
  return (
    <Link
      href={`/am-thuc/${cuisine.slug}`}
      className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-clay transition-colors hover:text-clay-hover"
    >
      Xem chi tiết món ăn
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
}

function WhereToEat({ cuisine }: { cuisine: CuisineListingData }) {
  return (
    <div>
      <span className="text-[0.68rem] font-semibold tracking-[0.1em] text-sage uppercase">
        Nơi thưởng thức
      </span>
      <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-ink">
        <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-clay" />
        {cuisine.whereToEat}
      </p>
    </div>
  );
}

export function CuisineCard({ cuisine, total, variant }: CuisineCardProps) {
  const serial = `${String(cuisine.sortOrder).padStart(2, "0")} / ${String(
    total,
  ).padStart(2, "0")}`;

  if (variant === "lead") {
    return (
      <article className="rounded-[22px] border border-line bg-surface-warm/45 p-6 md:p-9 lg:p-11">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col justify-between border-b border-line pb-6 lg:col-span-4 lg:border-r lg:border-b-0 lg:pb-0 lg:pr-8">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-2xl font-medium tracking-tight text-clay">
                  {serial}
                </span>
                <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink">
                  {cuisine.province}
                </span>
              </div>
              <h2 className="mt-4 font-display text-[clamp(2rem,3.8vw,3rem)] leading-[1.06] font-semibold text-ink">
                <Link
                  href={`/am-thuc/${cuisine.slug}`}
                  className="transition-colors hover:text-clay"
                >
                  {cuisine.name}
                </Link>
              </h2>
            </div>
            <div className="mt-6 border-t border-line pt-4">
              <WhereToEat cuisine={cuisine} />
            </div>
          </div>

          <div className="flex flex-col justify-between lg:col-span-8">
            <p className="max-w-[68ch] text-base leading-7 text-ink md:text-lg">
              {cuisine.description}
            </p>
            <div className="mt-7 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
              <RelatedTours cuisine={cuisine} />
              <DetailLink cuisine={cuisine} />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col rounded-[20px] border border-line bg-surface p-5 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-ink/35 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xl font-medium text-clay">{serial}</span>
        <span className="rounded-full bg-surface-warm px-2.5 py-1 text-[0.68rem] font-medium text-ink">
          {cuisine.province}
        </span>
      </div>

      <h3
        className={cn(
          "mt-3 font-display leading-tight font-semibold text-ink",
          variant === "wide" ? "text-2xl md:text-[1.7rem]" : "text-xl",
        )}
      >
        <Link
          href={`/am-thuc/${cuisine.slug}`}
          className="transition-colors hover:text-clay"
        >
          {cuisine.name}
        </Link>
      </h3>

      <p className="mt-3 flex-1 text-sm leading-6 text-sage">
        {cuisine.description}
      </p>

      <div className="mt-5 border-t border-line pt-4">
        <WhereToEat cuisine={cuisine} />
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
        <RelatedTours cuisine={cuisine} />
        <DetailLink cuisine={cuisine} />
      </div>
    </article>
  );
}
