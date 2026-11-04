import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import type { DestinationData } from "@/lib/contracts/home";
import { cn } from "@/lib/utils";

type DestinationsSectionProps = {
  destinations: DestinationData[];
};

const columnClasses = [
  "md:col-span-7",
  "md:col-span-5 md:mt-12",
  "md:col-span-5 md:-mt-8",
  "md:col-span-7 md:mt-4",
];

const ratioClasses = [
  "aspect-[16/11]",
  "aspect-[4/5]",
  "aspect-[4/3]",
  "aspect-[16/10]",
];

const sizeClasses = [
  "(min-width: 768px) 55vw, 100vw",
  "(min-width: 768px) 40vw, 100vw",
  "(min-width: 768px) 40vw, 100vw",
  "(min-width: 768px) 55vw, 100vw",
];

export function DestinationsSection({ destinations }: DestinationsSectionProps) {
  if (destinations.length === 0) return null;

  return (
    <section id="diem-den" className="scroll-mt-24 bg-canvas py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Ghi chép địa danh"
          title="Những miền đất còn giữ nét nguyên sơ"
          description="Từ chợ nổi họp lúc bình minh đến rừng tràm và bãi bồi nơi cuối trời phương Nam."
        />

        <div className="mt-10 grid grid-cols-1 items-start gap-6 md:grid-cols-12">
          {destinations.slice(0, 4).map((destination, index) => (
            <Link
              key={destination.slug}
              href={`/diem-den/${destination.slug}`}
              className={cn("group flex flex-col", columnClasses[index])}
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-[16px] border border-line bg-surface",
                  ratioClasses[index],
                )}
              >
                <Image
                  src={destination.image.src}
                  alt={destination.image.alt}
                  fill
                  sizes={sizeClasses[index]}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div className="mt-4">
                <span className="text-[0.7rem] font-semibold tracking-[0.13em] text-clay uppercase">
                  {destination.province}
                </span>
                <h3 className="mt-1 flex items-center gap-2 font-display text-xl font-semibold text-ink md:text-2xl">
                  {destination.name}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-clay opacity-0 transition-[opacity,transform] group-hover:translate-x-1 group-hover:opacity-100"
                  />
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-sage">
                  {destination.shortDescription}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
