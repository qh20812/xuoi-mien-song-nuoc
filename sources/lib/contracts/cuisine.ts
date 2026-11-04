import type { ImageAsset } from "@/lib/contracts/home";

export type CuisineRecord = {
  slug: string;
  name: string;
  description: string;
  whereToEat: string;
  province: string;
  image: ImageAsset | null;
  sortOrder: number;
};

export type CuisineTourRef = {
  code: string;
  slug: string;
  name: string;
};

export type CuisineListingData = CuisineRecord & {
  provinceSlug: string;
  tourRefs: CuisineTourRef[];
};
