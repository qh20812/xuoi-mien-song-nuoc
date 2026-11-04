import type { ImageAsset } from "@/lib/contracts/home";
import type { TourDepartureOption } from "@/lib/contracts/tour";

export type BookingTourOption = {
  code: string;
  slug: string;
  name: string;
  durationDays: number;
  durationNights: number;
  priceAdult: number;
  priceChild: number;
  coverImage: ImageAsset;
  departures: TourDepartureOption[];
};

export type BookingGuestCounts = {
  adults: number;
  children: number;
  infants: number;
};

export type BookingInitialSelection = {
  tourSlug?: string;
  departureId?: number | null;
  adults?: number;
  children?: number;
  infants?: number;
};

export type BookingContactValues = {
  contactName: string;
  phone: string;
  email: string;
  pickupPoint: string;
  customerNote: string;
};

export type PassengerDraft = {
  fullName: string;
  birthYear: string;
};

export type BookingRequestPassenger = {
  fullName: string | null;
  type: "adult" | "child" | "infant";
  birthYear: number | null;
  note: string | null;
};

export type BookingRequestInput = {
  departureId: number;
  contactName: string;
  phone: string;
  email: string | null;
  pickupPoint: string | null;
  customerNote: string | null;
  adults: number;
  children: number;
  infants: number;
  clientRequestId: string;
  passengers?: BookingRequestPassenger[];
};

export type BookingSuccessData = {
  code: string;
  status: string;
  statusLabel: string;
  holdExpiresAt: string;
  tourCode: string;
  tourName: string;
  tourSlug: string;
  durationDays: number;
  durationNights: number;
  coverImage?: ImageAsset;
  departureDate: string;
  contactName: string;
  phoneMasked: string;
  guests: BookingGuestCounts;
  totalAmount: number;
  pickupPoint: string;
  cancellationDeadline: string;
  canCancel: boolean;
};
