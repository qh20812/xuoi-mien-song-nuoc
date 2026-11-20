import type { CuisineListingData } from "@/lib/contracts/cuisine";

/** Món liên quan: cùng vùng trước, sau đó lấp bằng món vùng khác. */
export function getRelatedCuisines(
  cuisine: CuisineListingData,
  all: CuisineListingData[],
  limit = 3,
): CuisineListingData[] {
  const sameProvince = all.filter(
    (item) =>
      item.slug !== cuisine.slug && item.province === cuisine.province,
  );
  const others = all.filter(
    (item) =>
      item.slug !== cuisine.slug && item.province !== cuisine.province,
  );

  return [...sameProvince, ...others].slice(0, Math.max(0, Math.trunc(limit)));
}
