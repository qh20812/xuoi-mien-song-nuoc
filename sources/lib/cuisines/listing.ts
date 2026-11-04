import type { CuisineListingData } from "@/lib/contracts/cuisine";
import { cuisines } from "@/lib/fixtures/cuisines";
import { tourDetails } from "@/lib/fixtures/tour-details";
import { toSlug } from "@/lib/slug";

export const cuisineListingData: CuisineListingData[] = cuisines.map(
  (cuisine) => ({
    ...cuisine,
    provinceSlug: toSlug(cuisine.province),
    tourRefs: tourDetails
      .filter((tour) =>
        tour.cuisines.some((item) => item.slug === cuisine.slug),
      )
      .map((tour) => ({
        code: tour.code,
        slug: tour.slug,
        name: tour.name,
      })),
  }),
);

export const cuisineListingBySlug = new Map(
  cuisineListingData.map((cuisine) => [cuisine.slug, cuisine]),
);
