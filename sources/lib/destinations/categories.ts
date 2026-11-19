import type { DestinationCategory } from "@/lib/contracts/destination";

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

export const CATEGORY_LABELS: Record<DestinationCategory, string> = {
  "kien-truc": "Kiến trúc & di sản",
  "song-nuoc": "Sông nước",
  "cho-noi": "Chợ nổi",
  rung: "Rừng ngập nước",
  bien: "Vùng biển & bãi bồi",
};

const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as DestinationCategory[];

export function normalizeDestinationCategory(
  value: string | null | undefined,
): DestinationCategory {
  return CATEGORY_VALUES.includes(value as DestinationCategory)
    ? (value as DestinationCategory)
    : "song-nuoc";
}

export function groupFor(category: DestinationCategory) {
  return CATEGORY_GROUPS.find((group) =>
    (group.categories as readonly DestinationCategory[]).includes(category),
  )!;
}
