import type {
  DestinationListingData,
} from "@/lib/contracts/destination";
import { destinations } from "@/lib/fixtures/destinations";
import { tourDetails } from "@/lib/fixtures/tour-details";
import { toSlug } from "@/lib/slug";
import { CATEGORY_LABELS, groupFor } from "./categories";

export { CATEGORY_GROUPS } from "./categories";

export const destinationListingData: DestinationListingData[] =
  destinations.map((destination) => {
    const group = groupFor(destination.category);
    const tourRefs = tourDetails
      .filter((tour) =>
        tour.destinations.some((item) => item.slug === destination.slug),
      )
      .map((tour) => ({
        code: tour.code,
        slug: tour.slug,
        name: tour.name,
      }));

    return {
      ...destination,
      provinceSlug: toSlug(destination.province),
      categoryLabel: CATEGORY_LABELS[destination.category],
      categoryGroup: group.value,
      categoryGroupLabel: group.label,
      tourRefs,
    };
  });

export const destinationListingBySlug = new Map(
  destinationListingData.map((destination) => [destination.slug, destination]),
);

export const featuredDestinationSlug = "cho-noi-cai-rang";
