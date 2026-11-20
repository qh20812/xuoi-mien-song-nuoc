import type { CuisineListingData } from "@/lib/contracts/cuisine";
import type { TourDetailData } from "@/lib/contracts/tour";

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

/** Lọc lịch trình tour theo mã tour mà món ăn đang liên kết. */
export function getToursForCuisine(
  cuisine: CuisineListingData,
  tours: TourDetailData[],
) {
  return tours.filter((tour) =>
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
