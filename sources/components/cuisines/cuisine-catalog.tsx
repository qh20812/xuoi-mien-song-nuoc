"use client";

import { useMemo, useState } from "react";
import { SearchX, Utensils } from "lucide-react";
import { CuisineCard } from "@/components/cuisines/cuisine-card";
import type { CuisineListingData } from "@/lib/contracts/cuisine";
import { cn } from "@/lib/utils";

type CuisineCatalogProps = {
  cuisines: CuisineListingData[];
};

const CURATED = {
  lead: "lau-mam-u-minh",
  rows: [
    { slug: "cua-ca-mau", span: "lg:col-span-7", variant: "wide" },
    { slug: "ba-khia-muoi", span: "lg:col-span-5", variant: "compact" },
    { slug: "vop-nuong", span: "lg:col-span-5", variant: "compact" },
    { slug: "banh-xeo-mien-tay", span: "lg:col-span-7", variant: "wide" },
    { slug: "bun-nuoc-leo-soc-trang", span: "lg:col-span-7", variant: "wide" },
    { slug: "banh-pia-soc-trang", span: "lg:col-span-5", variant: "compact" },
    { slug: "duong-cha-la", span: "lg:col-span-12", variant: "wide" },
  ],
} as const;

export function CuisineCatalog({ cuisines }: CuisineCatalogProps) {
  const [activeRegion, setActiveRegion] = useState("all");

  const regionOptions = useMemo(() => {
    const regions = new Map<string, { label: string; count: number }>();
    for (const cuisine of cuisines) {
      const current = regions.get(cuisine.provinceSlug);
      regions.set(cuisine.provinceSlug, {
        label: cuisine.province,
        count: (current?.count ?? 0) + 1,
      });
    }

    return [
      { value: "all", label: "Tất cả", count: cuisines.length },
      ...Array.from(regions.entries()).map(([value, item]) => ({
        value,
        label: item.label,
        count: item.count,
      })),
    ];
  }, [cuisines]);

  const visibleCuisines = useMemo(
    () =>
      activeRegion === "all"
        ? cuisines
        : cuisines.filter((cuisine) => cuisine.provinceSlug === activeRegion),
    [activeRegion, cuisines],
  );

  const bySlug = useMemo(
    () => new Map(cuisines.map((cuisine) => [cuisine.slug, cuisine])),
    [cuisines],
  );

  const isDefault = activeRegion === "all";
  const lead = bySlug.get(CURATED.lead);

  function resetFilter() {
    setActiveRegion("all");
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-4 rounded-[16px] border border-line bg-surface p-4 lg:flex-row lg:items-center">
        <div
          role="group"
          aria-label="Lọc món ăn theo vùng"
          className="flex flex-wrap gap-2"
        >
          {regionOptions.map((option) => {
            const active = option.value === activeRegion;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveRegion(option.value)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none",
                  active
                    ? "bg-ink text-contrast-on-accent"
                    : "bg-canvas text-ink hover:bg-surface-warm",
                )}
              >
                {option.label}
                <span
                  className={cn(
                    "text-[0.68rem]",
                    active ? "text-surface/60" : "text-sage",
                  )}
                >
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>

        <p className="flex items-center gap-2 text-xs text-sage">
          <Utensils aria-hidden="true" className="size-3.5 text-clay" />
          Thực đơn có thể thay đổi theo mùa và nguyên liệu địa phương
        </p>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {visibleCuisines.length} món ăn phù hợp.
      </p>

      {visibleCuisines.length === 0 ? (
        <section className="mx-auto flex max-w-xl flex-col items-center rounded-[20px] border border-dashed border-line bg-surface-warm/35 p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface text-sage">
            <SearchX aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-ink">
            Không có món ăn theo vùng đã chọn
          </h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Hiện có {cuisines.length} món trong tuyển tập. Chọn lại khu vực khác
            hoặc xem tất cả.
          </p>
          <button
            type="button"
            onClick={resetFilter}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[8px] bg-clay px-5 text-sm font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover"
          >
            Xem tất cả {cuisines.length} món
          </button>
        </section>
      ) : null}

      {isDefault && lead ? (
        <div className="flex flex-col gap-8">
          <CuisineCard cuisine={lead} total={cuisines.length} variant="lead" />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {CURATED.rows.map((item) => {
              const cuisine = bySlug.get(item.slug);
              return cuisine ? (
                <div key={item.slug} className={item.span}>
                  <CuisineCard
                    cuisine={cuisine}
                    total={cuisines.length}
                    variant={item.variant}
                  />
                </div>
              ) : null;
            })}
          </div>
        </div>
      ) : null}

      {!isDefault && visibleCuisines.length > 0 ? (
        visibleCuisines.length === 1 ? (
          <CuisineCard
            cuisine={visibleCuisines[0]!}
            total={cuisines.length}
            variant="lead"
          />
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-6",
              visibleCuisines.length === 3
                ? "md:grid-cols-3"
                : "md:grid-cols-2",
            )}
          >
            {visibleCuisines.map((cuisine) => (
              <CuisineCard
                key={cuisine.slug}
                cuisine={cuisine}
                total={cuisines.length}
                variant={visibleCuisines.length === 3 ? "compact" : "wide"}
              />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
