import type {
  CuisineData,
  DestinationData,
  ImageAsset,
} from "@/lib/contracts/home";

export type TourListingData = {
  code: string;
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  durationDays: number;
  durationNights: number;
  priceFrom: number;
  image: ImageAsset;
  nextDeparture: {
    date: string;
    seatsRemaining: number;
  } | null;
  highlights: string[];
};

export type TourDepartureOption = {
  /** ID số tương thích với departureId của API đặt chỗ. */
  id: number;
  date: string;
  seatsRemaining: number;
  priceAdult: number;
  priceChild: number;
  holidaySurcharge: number;
  meetingPoint: string;
};

export type ItinerarySlot = "morning" | "afternoon" | "evening";

export type TourItineraryItem = {
  slot: ItinerarySlot;
  title: string;
  content: string;
};

export type TourItineraryDay = {
  dayNumber: number;
  title: string;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  hotel: string | null;
  items: TourItineraryItem[];
};

export type TourDetailData = {
  code: string;
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  description: string;
  durationDays: number;
  durationNights: number;
  priceAdult: number;
  priceChild: number;
  childAgeNote: string;
  highlights: string[];
  includes: string[];
  excludes: string[];
  cancellationPolicy: string;
  packingNotes: string;
  coverImage: ImageAsset;
  gallery: ImageAsset[];
  itineraryDays: TourItineraryDay[];
  destinations: DestinationData[];
  cuisines: CuisineData[];
  departures: TourDepartureOption[];
};
