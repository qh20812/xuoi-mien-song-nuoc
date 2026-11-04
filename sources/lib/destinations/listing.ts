import type {
  DestinationListingData,
  DestinationCategory,
} from "@/lib/contracts/destination";
import { destinations } from "@/lib/fixtures/destinations";
import { tourDetails } from "@/lib/fixtures/tour-details";
import { toSlug } from "@/lib/slug";

export const CATEGORY_GROUPS = [
  {
    value: "kien-truc",
    label: "Kiến trúc & di sản",
    categories: ["kien-truc"] as DestinationCategory[],
  },
  {
    value: "song-nuoc",
    label: "Sông nước & chợ nổi",
    categories: ["song-nuoc", "cho-noi"] as DestinationCategory[],
  },
  {
    value: "rung",
    label: "Rừng ngập nước",
    categories: ["rung"] as DestinationCategory[],
  },
  {
    value: "bien",
    label: "Vùng biển & bãi bồi",
    categories: ["bien"] as DestinationCategory[],
  },
] as const;

const CATEGORY_LABELS: Record<DestinationCategory, string> = {
  "kien-truc": "Kiến trúc & di sản",
  "song-nuoc": "Sông nước",
  "cho-noi": "Chợ nổi",
  rung: "Rừng ngập nước",
  bien: "Vùng biển & bãi bồi",
};

function groupFor(category: DestinationCategory) {
  return CATEGORY_GROUPS.find((group) =>
    (group.categories as readonly DestinationCategory[]).includes(category),
  )!;
}

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
