"use client";

import { useMemo, useState } from "react";
import { Check, SearchX } from "lucide-react";
import { TourListingCard } from "@/components/tours/tour-listing-card";
import { durationKey } from "@/lib/tours/listing";
import type { TourListingData } from "@/lib/contracts/tour";
import { cn } from "@/lib/utils";

type TourCatalogProps = {
  tours: TourListingData[];
};

type DurationFilter = {
  value: string;
  label: string;
  count: number;
};

export function TourCatalog({ tours }: TourCatalogProps) {
  const filters = useMemo<DurationFilter[]>(() => {
    const durations = new Map<string, { label: string; count: number }>();

    for (const tour of tours) {
      const value = durationKey(tour);
      const current = durations.get(value);
      durations.set(value, {
        label: `${tour.durationDays} ngày ${tour.durationNights} đêm`,
        count: (current?.count ?? 0) + 1,
      });
    }

    return [
      { value: "all", label: "Tất cả", count: tours.length },
      ...Array.from(durations.entries()).map(([value, item]) => ({
        value,
        label: item.label,
        count: item.count,
      })),
    ];
  }, [tours]);

  const [activeFilter, setActiveFilter] = useState("all");
  const visibleTours = useMemo(
    () =>
      activeFilter === "all"
        ? tours
        : tours.filter((tour) => durationKey(tour) === activeFilter),
    [activeFilter, tours],
  );

  const [lead, ...rest] = visibleTours;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-4 rounded-[16px] border border-line bg-surface p-4 lg:flex-row lg:items-center">
        <div
          role="group"
          aria-label="Lọc tour theo thời lượng"
          className="flex flex-wrap gap-2"
        >
          {filters.map((filter) => {
            const active = filter.value === activeFilter;

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-[8px] px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none",
                  active
                    ? "bg-ink text-contrast-on-accent"
                    : "bg-canvas text-ink hover:bg-surface-warm",
                )}
              >
                {filter.label}
                <span
                  className={cn(
                    "text-[0.68rem] font-medium",
                    active ? "text-surface/60" : "text-sage",
                  )}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>

        <p className="flex items-center gap-2 text-xs text-sage">
          <Check aria-hidden="true" className="size-3.5 text-success" />
          Mọi khoản phụ thu được thông báo trước khi xác nhận
        </p>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {visibleTours.length} tour phù hợp.
      </p>

      {visibleTours.length === 0 ? (
        <section className="mx-auto flex max-w-xl flex-col items-center rounded-[20px] border border-dashed border-line bg-surface-warm/35 p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface text-sage">
            <SearchX aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-ink">
            Không có tour phù hợp
          </h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Hiện có {tours.length} hành trình. Chọn lại thời lượng khác hoặc xem
            toàn bộ danh sách.
          </p>
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[8px] bg-clay px-5 text-sm font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover"
          >
            Xem tất cả {tours.length} tour
          </button>
        </section>
      ) : null}

      {lead ? (
        visibleTours.length === 1 ? (
          <TourListingCard tour={lead} variant="lead" />
        ) : (
          <div className="flex flex-col gap-8">
            <TourListingCard tour={lead} variant="lead" />

            <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
              {rest.map((tour, index) => (
                <div
                  key={tour.code}
                  className={cn(
                    index === 0 ? "lg:col-span-7" : "lg:col-span-5",
                  )}
                >
                  <TourListingCard
                    tour={tour}
                    variant={index === 0 ? "wide" : "compact"}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
