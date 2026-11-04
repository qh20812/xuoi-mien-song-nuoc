import type { TourListingData } from "@/lib/contracts/tour";
import { tourDetails } from "@/lib/fixtures/tour-details";

export function toTourListingData(
  tour: (typeof tourDetails)[number],
): TourListingData {
  const nextDeparture = tour.departures[0] ?? null;

  return {
    code: tour.code,
    slug: tour.slug,
    name: tour.name,
    tagline: tour.tagline,
    summary: tour.summary,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    priceFrom: nextDeparture?.priceAdult ?? tour.priceAdult,
    image: tour.coverImage,
    nextDeparture: nextDeparture
      ? {
          date: nextDeparture.date,
          seatsRemaining: nextDeparture.seatsRemaining,
        }
      : null,
    highlights: tour.highlights,
  };
}

export const tourListingData = tourDetails.map(toTourListingData);

export function durationKey(tour: Pick<TourListingData, "durationDays" | "durationNights">) {
  return `${tour.durationDays}n${tour.durationNights}d`;
}
