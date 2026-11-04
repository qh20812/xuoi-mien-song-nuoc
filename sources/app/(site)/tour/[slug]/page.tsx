import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingPolicy } from "@/components/tour-detail/booking-policy";
import { IncludedExcluded } from "@/components/tour-detail/included-excluded";
import { ItineraryTimeline } from "@/components/tour-detail/itinerary-timeline";
import { PackingNotes } from "@/components/tour-detail/packing-notes";
import { TourBooking } from "@/components/tour-detail/tour-booking";
import { TourCuisines } from "@/components/tour-detail/tour-cuisines";
import { TourDestinations } from "@/components/tour-detail/tour-destinations";
import { TourGallery } from "@/components/tour-detail/tour-gallery";
import { TourHeading } from "@/components/tour-detail/tour-heading";
import { TourOverview } from "@/components/tour-detail/tour-overview";
import { Container } from "@/components/ui/container";
import {
  getTourDetailBySlug,
  tourDetails,
} from "@/lib/fixtures/tour-details";
import { siteSettings } from "@/lib/fixtures/site";

type TourDetailPageProps = {
  params: Promise<{ slug: string }>;
};

// Trang chi tiết phụ thuộc trực tiếp vào slug và hiện được prerender đầy đủ.
export const instant = false;

export function generateStaticParams() {
  return tourDetails.map((tour) => ({ slug: tour.slug }));
}

export async function generateMetadata({
  params,
}: TourDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tour = getTourDetailBySlug(slug);

  if (!tour) {
    return { title: "Không tìm thấy tour" };
  }

  return {
    title: tour.name,
    description: tour.summary,
    openGraph: {
      title: tour.name,
      description: tour.summary,
      images: [{ url: tour.coverImage.src, alt: tour.coverImage.alt }],
      locale: "vi_VN",
      type: "website",
    },
  };
}

export default async function TourDetailPage({ params }: TourDetailPageProps) {
  const { slug } = await params;
  const tour = getTourDetailBySlug(slug);

  if (!tour) notFound();

  const galleryImages = [
    tour.coverImage,
    ...tour.gallery.filter((image) => image.src !== tour.coverImage.src),
  ];

  return (
    <Container className="pb-16 md:pb-24">
      <TourHeading tour={tour} />
      <TourGallery images={galleryImages} />

      <TourBooking tour={tour} settings={siteSettings}>
        <div className="flex flex-col gap-12 md:gap-16">
          <TourOverview tour={tour} />
          <ItineraryTimeline tour={tour} />
          <TourDestinations tour={tour} />
          <TourCuisines tour={tour} />
          <IncludedExcluded tour={tour} />
          <PackingNotes tour={tour} />
          <BookingPolicy settings={siteSettings} />
        </div>
      </TourBooking>
    </Container>
  );
}
