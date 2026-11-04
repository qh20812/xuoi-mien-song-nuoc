import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import type { TourDetailData } from "@/lib/contracts/tour";

type TourDestinationsProps = {
  tour: TourDetailData;
};

export function TourDestinations({ tour }: TourDestinationsProps) {
  if (tour.destinations.length === 0) return null;

  return (
    <section aria-labelledby="tour-destinations" className="border-t border-line pt-8">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <SectionHeading
          eyebrow="Ghi chép địa danh"
          title="Điểm đến trên hành trình"
          titleClassName="text-[clamp(1.75rem,3.4vw,2.5rem)]"
        />
        <p className="text-sm text-sage">{tour.destinations.length} điểm dừng</p>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-x-8 md:grid-cols-2">
        {tour.destinations.map((destination) => (
          <Link
            key={destination.slug}
            href={`/diem-den/${destination.slug}`}
            className="group flex items-start gap-4 border-t border-line py-4"
          >
            <div className="relative size-20 shrink-0 overflow-hidden rounded-[10px] border border-line bg-surface">
              <Image
                src={destination.image.src}
                alt={destination.image.alt}
                fill
                sizes="80px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[0.68rem] font-semibold tracking-[0.1em] text-clay uppercase">
                {destination.province}
              </span>
              <h3 className="mt-0.5 flex items-center gap-1.5 font-display text-lg font-semibold text-ink">
                {destination.name}
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-3.5 text-clay opacity-0 transition-opacity group-hover:opacity-100"
                />
              </h3>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-sage">
                {destination.shortDescription}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-5 flex items-center gap-2 text-xs text-sage">
        <MapPin aria-hidden="true" className="size-4 text-clay" />
        Thứ tự tham quan có thể thay đổi theo điều kiện đường thủy và thời tiết.
      </p>
    </section>
  );
}
