import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Images, Sun } from "lucide-react";
import type { DestinationListingData } from "@/lib/contracts/destination";
import { cn } from "@/lib/utils";

type DestinationCardProps = {
  destination: DestinationListingData;
  variant: "lead" | "wide" | "compact";
};

function visualClass(variant: DestinationCardProps["variant"]) {
  if (variant === "lead") return "aspect-[4/3] lg:aspect-auto lg:min-h-[440px]";
  if (variant === "wide") return "aspect-[16/9]";
  return "aspect-[4/3]";
}

function imageSizes(variant: DestinationCardProps["variant"]) {
  if (variant === "lead") return "(min-width: 1024px) 56vw, 100vw";
  if (variant === "wide") return "(min-width: 1024px) 45vw, 100vw";
  return "(min-width: 1024px) 28vw, 100vw";
}

function DestinationVisual({
  destination,
  variant,
}: {
  destination: DestinationListingData;
  variant: DestinationCardProps["variant"];
}) {
  return (
    <div
      className={cn(
        "relative h-full overflow-hidden bg-surface-warm",
        visualClass(variant),
      )}
    >
      {destination.image ? (
        <Image
          src={destination.image.src}
          alt={destination.image.alt}
          fill
          priority={variant === "lead"}
          sizes={imageSizes(variant)}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
          <Images aria-hidden="true" className="size-7 text-sage" />
          <span className="font-mono text-[0.68rem] tracking-[0.1em] text-sage uppercase">
            Chưa có ảnh thực địa
          </span>
          <span className="max-w-56 text-sm leading-6 text-sage">
            {destination.name}
          </span>
        </div>
      )}
    </div>
  );
}

function RelatedTours({ destination }: { destination: DestinationListingData }) {
  if (destination.tourRefs.length === 0) {
    return <span className="text-xs text-sage">Ngoài tuyến tour hiện tại</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[0.68rem] text-sage">Có trong:</span>
      {destination.tourRefs.map((tour) => (
        <Link
          key={tour.code}
          href={`/tour/${tour.slug}`}
          className="rounded border border-line bg-surface-warm px-2 py-0.5 font-mono text-[0.65rem] text-clay transition-colors hover:border-clay/40 hover:bg-clay-soft/40"
          title={tour.name}
        >
          {tour.code}
        </Link>
      ))}
    </div>
  );
}

function DestinationTags({ destination }: { destination: DestinationListingData }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="rounded-full bg-surface-warm px-2.5 py-1 text-[0.68rem] font-medium text-ink">
        {destination.province}
      </span>
      <span className="rounded-full bg-clay-soft/45 px-2.5 py-1 text-[0.68rem] font-medium text-ink">
        {destination.categoryGroupLabel}
      </span>
    </div>
  );
}

function DetailLink({
  destination,
  className,
}: {
  destination: DestinationListingData;
  className?: string;
}) {
  return (
    <Link
      href={`/diem-den/${destination.slug}`}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-clay transition-colors hover:text-clay-hover",
        className,
      )}
    >
      Xem điểm đến
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
}

export function DestinationCard({
  destination,
  variant,
}: DestinationCardProps) {
  const isLead = variant === "lead";

  if (isLead) {
    return (
      <article className="group overflow-hidden rounded-[22px] border border-line bg-surface shadow-[0_18px_48px_-24px_rgba(23,51,43,0.14)] transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-ink/35">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {destination.image ? (
            <Link
              href={`/diem-den/${destination.slug}`}
              className="block lg:col-span-7"
              aria-label={`Xem ${destination.name}`}
            >
              <DestinationVisual destination={destination} variant={variant} />
            </Link>
          ) : null}

          <div
            className={cn(
              "flex flex-col justify-between p-6 lg:p-9",
              destination.image ? "lg:col-span-5" : "lg:col-span-12",
            )}
          >
            <div>
              <DestinationTags destination={destination} />
              <h2 className="mt-4 font-display text-[clamp(1.9rem,3.4vw,2.65rem)] leading-[1.08] font-semibold text-ink">
                <Link
                  href={`/diem-den/${destination.slug}`}
                  className="transition-colors hover:text-clay"
                >
                  {destination.name}
                </Link>
              </h2>
              <p className="mt-4 text-sm leading-7 text-sage md:text-base">
                {destination.shortDescription}
              </p>

              <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-ink">
                <Sun
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-clay"
                />
                <span>
                  <span className="font-semibold">Mùa đẹp:</span>{" "}
                  {destination.bestSeason}
                </span>
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
              <RelatedTours destination={destination} />
              <DetailLink destination={destination} />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-surface transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-ink/35">
      <div className="p-4 pb-0">
        <DestinationTags destination={destination} />
      </div>

      <Link
        href={`/diem-den/${destination.slug}`}
        className="mx-4 mt-3 block overflow-hidden rounded-[14px]"
        aria-label={`Xem ${destination.name}`}
      >
        <DestinationVisual destination={destination} variant={variant} />
      </Link>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        <h3
          className={cn(
            "font-display leading-snug font-semibold text-ink",
            variant === "wide" ? "text-xl md:text-2xl" : "text-lg",
          )}
        >
          <Link
            href={`/diem-den/${destination.slug}`}
            className="transition-colors hover:text-clay"
          >
            {destination.name}
          </Link>
        </h3>
        <p
          className={cn(
            "mt-2 text-sm leading-6 text-sage",
            variant === "compact" && "line-clamp-3",
          )}
        >
          {destination.shortDescription}
        </p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
          <RelatedTours destination={destination} />
          <DetailLink destination={destination} className="ml-auto" />
        </div>
      </div>
    </article>
  );
}
