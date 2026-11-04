import { TourCard } from "@/components/tours/tour-card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import type { TourCardData } from "@/lib/contracts/home";

type FeaturedToursSectionProps = {
  tours: TourCardData[];
};

export function FeaturedToursSection({ tours }: FeaturedToursSectionProps) {
  if (tours.length === 0) return null;

  const [lead, ...secondary] = tours;

  return (
    <section id="tours-noi-bat" className="scroll-mt-24 bg-canvas py-16 md:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-6 border-b border-line pb-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Lịch trình chọn lọc"
            title="Những chuyến đi lắng đọng"
          />
          <p className="max-w-md text-sm leading-6 text-sage md:text-right">
            Chọn lịch trình phù hợp với quỹ thời gian và chiều sâu trải nghiệm bạn
            đang tìm kiếm.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <TourCard tour={lead} variant="featured" />
          </div>
          {secondary.length > 0 ? (
            <div className="flex flex-col gap-6 lg:col-span-5">
              {secondary.map((tour) => (
                <TourCard key={tour.code} tour={tour} variant="compact" />
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
