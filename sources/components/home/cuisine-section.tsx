import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import type { CuisineData } from "@/lib/contracts/home";

type CuisineSectionProps = {
  cuisines: CuisineData[];
};

export function CuisineSection({ cuisines }: CuisineSectionProps) {
  if (cuisines.length === 0) return null;

  return (
    <section
      id="am-thuc"
      className="scroll-mt-24 border-y border-line bg-surface py-16 md:py-24"
    >
      <Container>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Hương vị đồng bằng"
            title="Ẩm thực miền sông nước"
          />
          <p className="max-w-md text-sm leading-6 text-sage md:text-right">
            Những món ăn mộc mạc từ cá đồng, cua biển, rau rừng và mắm cá theo con
            nước mùa.
          </p>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-x-12 md:grid-cols-2">
          {cuisines.map((cuisine, index) => (
            <li key={cuisine.slug} className="border-b border-line py-6 first:border-t">
              <div className="flex gap-5">
                <span
                  aria-hidden="true"
                  className="w-10 shrink-0 font-display text-2xl leading-none text-clay/55 tabular-nums"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-display text-xl font-semibold text-ink">
                      <Link
                        href={`/am-thuc/${cuisine.slug}`}
                        className="inline-flex items-center gap-2 transition-colors hover:text-clay"
                      >
                        {cuisine.name}
                        <ArrowRight
                          aria-hidden="true"
                          className="size-3.5 opacity-0 transition-opacity hover:opacity-100"
                        />
                      </Link>
                    </h3>
                    {cuisine.province ? (
                      <span className="text-[0.7rem] font-medium tracking-[0.08em] text-sage uppercase">
                        {cuisine.province}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-sage">{cuisine.description}</p>
                  {cuisine.whereToEat ? (
                    <p className="mt-2 text-xs leading-5 text-sage/80">
                      <span className="font-semibold text-ink">Thử tại:</span>{" "}
                      {cuisine.whereToEat}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
