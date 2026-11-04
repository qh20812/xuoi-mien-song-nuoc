"use client";

import { useMemo, useState } from "react";
import { Filter, RotateCcw, SearchX } from "lucide-react";
import { DestinationCard } from "@/components/destinations/destination-card";
import { CATEGORY_GROUPS } from "@/lib/destinations/listing";
import type { DestinationListingData } from "@/lib/contracts/destination";
import { cn } from "@/lib/utils";

type DestinationCatalogProps = {
  destinations: DestinationListingData[];
};

type FilterOption = {
  value: string;
  label: string;
  count: number;
};

const CURATED = {
  featured: "cho-noi-cai-rang",
  pair: ["vuon-quoc-gia-u-minh-ha", "mui-ca-mau"],
  heritage: ["chua-vinh-trang", "cu-lao-thoi-son"],
  trio: ["nha-co-binh-thuy", "chua-doi", "nha-cong-tu-bac-lieu"],
  coastal: ["canh-dong-dien-gio-bac-lieu", "cot-co-ha-noi-mui-ca-mau", "nha-tho-tac-say"],
};

function FilterGroup({
  label,
  options,
  activeValue,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  activeValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <span className="min-w-28 text-[0.7rem] font-semibold tracking-[0.12em] text-sage uppercase">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className="flex flex-wrap items-center gap-2"
      >
        {options.map((option) => {
          const active = option.value === activeValue;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-[8px] px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none",
                active
                  ? "bg-ink text-contrast-on-accent"
                  : "bg-canvas text-ink hover:bg-surface-warm",
              )}
            >
              {option.label}
              <span
                className={cn(
                  "text-[0.65rem]",
                  active ? "text-surface/60" : "text-sage",
                )}
              >
                {option.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DestinationCatalog({ destinations }: DestinationCatalogProps) {
  const [activeProvince, setActiveProvince] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");

  const provinceOptions = useMemo<FilterOption[]>(() => {
    const provinces = new Map<string, { label: string; count: number }>();
    for (const destination of destinations) {
      const current = provinces.get(destination.provinceSlug);
      provinces.set(destination.provinceSlug, {
        label: destination.province,
        count: (current?.count ?? 0) + 1,
      });
    }

    return [
      { value: "all", label: "Tất cả tỉnh thành", count: destinations.length },
      ...Array.from(provinces.entries()).map(([value, item]) => ({
        value,
        label: item.label,
        count: item.count,
      })),
    ];
  }, [destinations]);

  const categoryOptions = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: "Tất cả thể loại", count: destinations.length },
      ...CATEGORY_GROUPS.map((group) => ({
        value: group.value,
        label: group.label,
        count: destinations.filter(
          (destination) => destination.categoryGroup === group.value,
        ).length,
      })),
    ],
    [destinations],
  );

  const visibleDestinations = useMemo(
    () =>
      destinations.filter((destination) => {
        const matchProvince =
          activeProvince === "all" ||
          destination.provinceSlug === activeProvince;
        const matchCategory =
          activeCategory === "all" ||
          destination.categoryGroup === activeCategory;
        return matchProvince && matchCategory;
      }),
    [activeCategory, activeProvince, destinations],
  );

  const bySlug = useMemo(
    () => new Map(destinations.map((destination) => [destination.slug, destination])),
    [destinations],
  );
  const isDefault = activeProvince === "all" && activeCategory === "all";
  const hasFilters = !isDefault;

  function resetFilters() {
    setActiveProvince("all");
    setActiveCategory("all");
  }

  function getCurated(slug: string) {
    return bySlug.get(slug);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-[16px] border border-line bg-surface p-4 md:p-5">
        <div className="flex flex-col gap-4">
          <FilterGroup
            label="Tỉnh thành"
            options={provinceOptions}
            activeValue={activeProvince}
            onChange={setActiveProvince}
          />

          <div className="border-t border-line pt-4">
            <FilterGroup
              label="Phân loại"
              options={categoryOptions}
              activeValue={activeCategory}
              onChange={setActiveCategory}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <p className="flex items-center gap-2 text-xs text-sage">
            <Filter aria-hidden="true" className="size-3.5" />
            Có thể kết hợp bộ lọc tỉnh/thành và thể loại.
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-clay transition-colors hover:text-clay-hover"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              Xóa bộ lọc
            </button>
          ) : null}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {visibleDestinations.length} điểm đến phù hợp.
      </p>

      {visibleDestinations.length === 0 ? (
        <section className="mx-auto flex max-w-xl flex-col items-center rounded-[20px] border border-dashed border-line bg-surface-warm/35 p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface text-sage">
            <SearchX aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-ink">
            Không tìm thấy điểm đến theo bộ lọc
          </h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Hiện không có điểm đến nào phù hợp với cả tỉnh/thành và thể loại đã
            chọn.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[8px] bg-clay px-5 text-sm font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover"
          >
            Xóa bộ lọc để xem tất cả {destinations.length} điểm
          </button>
        </section>
      ) : null}

      {visibleDestinations.length > 0 && !isDefault ? (
        visibleDestinations.length === 1 ? (
          <DestinationCard
            destination={visibleDestinations[0]!}
            variant="lead"
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleDestinations.map((destination) => (
              <DestinationCard
                key={destination.slug}
                destination={destination}
                variant="compact"
              />
            ))}
          </div>
        )
      ) : null}

      {isDefault && visibleDestinations.length > 0 ? (
        <div className="flex flex-col gap-8">
          {(() => {
            const lead = getCurated(CURATED.featured);
            return lead ? <DestinationCard destination={lead} variant="lead" /> : null;
          })()}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {CURATED.pair.map((slug) => {
              const destination = getCurated(slug);
              return destination ? (
                <DestinationCard
                  key={slug}
                  destination={destination}
                  variant="wide"
                />
              ) : null;
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {CURATED.heritage.map((slug, index) => {
              const destination = getCurated(slug);
              return destination ? (
                <div
                  key={slug}
                  className={index === 0 ? "lg:col-span-7" : "lg:col-span-5"}
                >
                  <DestinationCard
                    destination={destination}
                    variant={index === 0 ? "wide" : "compact"}
                  />
                </div>
              ) : null;
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CURATED.trio.map((slug) => {
              const destination = getCurated(slug);
              return destination ? (
                <DestinationCard
                  key={slug}
                  destination={destination}
                  variant="compact"
                />
              ) : null;
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {CURATED.coastal.slice(0, 2).map((slug, index) => {
              const destination = getCurated(slug);
              return destination ? (
                <div
                  key={slug}
                  className={index === 0 ? "lg:col-span-7" : "lg:col-span-5"}
                >
                  <DestinationCard
                    destination={destination}
                    variant={index === 0 ? "wide" : "compact"}
                  />
                </div>
              ) : null;
            })}
          </div>

          {(() => {
            const destination = getCurated(CURATED.coastal[2]!);
            return destination ? (
              <DestinationCard destination={destination} variant="lead" />
            ) : null;
          })()}
        </div>
      ) : null}

    </div>
  );
}
