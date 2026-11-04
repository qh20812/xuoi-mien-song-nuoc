import type { BookingGuestCounts } from "@/lib/contracts/booking";
import type { TourDepartureOption } from "@/lib/contracts/tour";

type TourPricing = {
  priceAdult: number;
  priceChild: number;
};

export function totalSeats(guests: BookingGuestCounts): number {
  return guests.adults + guests.children + guests.infants;
}

export function calculateBookingPreview(
  tour: TourPricing,
  departure: TourDepartureOption | null,
  guests: BookingGuestCounts,
) {
  const priceAdult = departure?.priceAdult ?? tour.priceAdult;
  const priceChild = departure?.priceChild ?? tour.priceChild;
  const surchargePerPerson = departure?.holidaySurcharge ?? 0;
  const billedGuests = guests.adults + guests.children;
  const total =
    guests.adults * priceAdult +
    guests.children * priceChild +
    billedGuests * surchargePerPerson;

  return {
    priceAdult,
    priceChild,
    surchargePerPerson,
    billedGuests,
    seats: totalSeats(guests),
    total,
  };
}
