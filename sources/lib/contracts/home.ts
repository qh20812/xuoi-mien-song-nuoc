export type ImageAsset = {
  src: string;
  alt: string;
};

export type TourCardData = {
  code: string;
  slug: string;
  name: string;
  summary: string;
  durationDays: number;
  durationNights: number;
  priceFrom: number;
  image?: ImageAsset;
  nextDeparture: {
    date: string;
    seatsRemaining: number;
  } | null;
  highlights: string[];
};

export type JourneyLegData = {
  sortOrder: number;
  fromPlace: string;
  toPlace: string;
  title: string;
  description: string;
  durationText: string | null;
  distanceKm: number | null;
  foodNote: string | null;
};

export type DestinationData = {
  slug: string;
  name: string;
  province: string;
  shortDescription: string;
  image: ImageAsset;
};

export type CuisineData = {
  slug: string;
  name: string;
  description: string;
  whereToEat: string | null;
  province: string | null;
};

export type FaqData = {
  question: string;
  answer: string;
};

export type HomePageData = {
  tours: TourCardData[];
  journey: JourneyLegData[];
  destinations: DestinationData[];
  cuisines: CuisineData[];
  faqs: FaqData[];
};
