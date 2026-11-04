import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { Container } from "@/components/ui/container";
import type {
  BookingInitialSelection,
  BookingTourOption,
} from "@/lib/contracts/booking";
import { siteSettings } from "@/lib/fixtures/site";
import { tourDetails } from "@/lib/fixtures/tour-details";

export const metadata: Metadata = {
  title: "Đặt giữ chỗ tour",
  description:
    "Chọn tour, ngày khởi hành và để lại thông tin liên hệ. Website giữ chỗ 24 giờ, chưa thu tiền trực tuyến.",
};

// Route phụ thuộc searchParams để khôi phục lựa chọn từ trang chi tiết tour.
export const instant = false;

type BookingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function toBookingOption(
  tour: (typeof tourDetails)[number],
): BookingTourOption {
  return {
    code: tour.code,
    slug: tour.slug,
    name: tour.name,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    priceAdult: tour.priceAdult,
    priceChild: tour.priceChild,
    coverImage: tour.coverImage,
    departures: tour.departures,
  };
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const params = await searchParams;
  const initial: BookingInitialSelection = {
    tourSlug: firstValue(params.tour),
    departureId: positiveInteger(firstValue(params.departureId)),
    adults: positiveInteger(firstValue(params.adults)),
    children: positiveInteger(firstValue(params.children)),
    infants: positiveInteger(firstValue(params.infants)),
  };

  const tours = tourDetails.map(toBookingOption);

  return (
    <Container className="py-8 md:py-12">
      <BookingWizard tours={tours} settings={siteSettings} initial={initial} />
    </Container>
  );
}
