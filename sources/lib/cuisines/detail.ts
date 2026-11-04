import type { CuisineListingData } from "@/lib/contracts/cuisine";
import type { TourDetailData } from "@/lib/contracts/tour";
import {
  cuisineListingBySlug,
  cuisineListingData,
} from "@/lib/cuisines/listing";
import { tourDetails } from "@/lib/fixtures/tour-details";

export type CuisineMealMatch = {
  dayNumber: number;
  slot: "breakfast" | "lunch" | "dinner";
  label: string;
  meal: string;
};

const SLOT_LABELS = {
  breakfast: "Bữa sáng",
  lunch: "Bữa trưa",
  dinner: "Bữa tối",
} as const;

export function getCuisineBySlug(slug: string) {
  return cuisineListingBySlug.get(slug);
}

export function getToursForCuisine(cuisine: CuisineListingData) {
  return tourDetails.filter((tour) =>
    cuisine.tourRefs.some((ref) => ref.code === tour.code),
  );
}

export function getMealForCuisine(
  tour: TourDetailData,
  cuisine: CuisineListingData,
): CuisineMealMatch | null {
  for (const day of tour.itineraryDays) {
    for (const slot of ["breakfast", "lunch", "dinner"] as const) {
      const meal = day.meals[slot];
      if (meal.toLowerCase().includes(cuisine.name.toLowerCase())) {
        return {
          dayNumber: day.dayNumber,
          slot,
          label: SLOT_LABELS[slot],
          meal,
        };
      }
    }
  }

  return null;
}

export function getRelatedCuisines(cuisine: CuisineListingData) {
  const sameProvince = cuisineListingData.filter(
    (item) =>
      item.slug !== cuisine.slug && item.province === cuisine.province,
  );
  const others = cuisineListingData.filter(
    (item) =>
      item.slug !== cuisine.slug && item.province !== cuisine.province,
  );

  return [...sameProvince, ...others].slice(0, 3);
}
