import type { ImageAsset } from "@/lib/contracts/home";

export type DestinationCategory =
  | "kien-truc"
  | "song-nuoc"
  | "cho-noi"
  | "rung"
  | "bien";

export type DestinationRecord = {
  slug: string;
  name: string;
  province: string;
  category: DestinationCategory;
  shortDescription: string;
  description: string;
  bestSeason: string;
  travelNote: string;
  image: ImageAsset | null;
  lat: number | null;
  lng: number | null;
  sortOrder: number;
};

export type DestinationTourRef = {
  code: string;
  slug: string;
  name: string;
};

export type DestinationListingData = DestinationRecord & {
  provinceSlug: string;
  categoryLabel: string;
  categoryGroup: string;
  categoryGroupLabel: string;
  tourRefs: DestinationTourRef[];
};
