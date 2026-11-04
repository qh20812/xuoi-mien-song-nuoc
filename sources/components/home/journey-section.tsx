import { MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import type { JourneyLegData } from "@/lib/contracts/home";
import { cn } from "@/lib/utils";

type JourneySectionProps = {
  legs: JourneyLegData[];
};

export function JourneySection({ legs }: JourneySectionProps) {
  if (legs.length === 0) return null;

  return (
    <section
      id="hanh-trinh"
      className="scroll-mt-24 border-y border-line bg-surface-warm py-16 md:py-24"
    >
      <Container>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Sơ đồ dòng chảy"
            title="Dọc theo triền sông phương Nam"
          />
          <p className="max-w-md text-sm leading-6 text-sage md:text-right">
            Sáu chặng nối Sài Gòn với cực Nam Tổ quốc, đi qua miệt vườn, chợ nổi,
            rừng tràm và vùng cửa sông Cà Mau.
          </p>
        </div>

        <ol className="relative mx-auto mt-12 max-w-5xl">
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-4 w-px bg-line md:left-1/2"
          />
          {legs.map((leg, index) => {
            const isEven = index % 2 === 0;

            return (
              <li
                key={leg.sortOrder}
                className="relative py-7 pl-12 md:grid md:grid-cols-2 md:gap-12 md:py-8 md:pl-0"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-9 left-4 z-10 size-3.5 -translate-x-1/2 rounded-full border-[3px] bg-surface md:left-1/2",
                    isEven ? "border-ink" : "border-clay",
                  )}
                />
                <div
                  className={cn(
                    isEven
                      ? "md:col-start-1 md:pr-8 md:text-right"
                      : "md:col-start-2 md:pl-8",
                  )}
                >
                  <div
                    className={cn(
                      "flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.7rem] tracking-[0.04em] text-clay uppercase",
                      isEven && "md:justify-end",
                    )}
                  >
                    <span>Chặng {String(leg.sortOrder).padStart(2, "0")}</span>
                    {leg.distanceKm ? <span>· {leg.distanceKm} km</span> : null}
                    {leg.durationText ? <span>· {leg.durationText}</span> : null}
                  </div>
                  <h3 className="mt-2 font-display text-2xl leading-tight font-semibold text-ink">
                    {leg.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1.5 text-xs font-medium text-sage",
                      isEven && "md:justify-end",
                    )}
                  >
                    <MapPin aria-hidden="true" className="size-3.5 text-clay" />
                    {leg.fromPlace} → {leg.toPlace}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-sage">{leg.description}</p>
                  {leg.foodNote ? (
                    <p className="mt-3 text-xs leading-5 text-sage/85">
                      <span className="font-semibold text-ink">Dọc đường:</span>{" "}
                      {leg.foodNote}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
