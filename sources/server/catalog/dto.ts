/**
 * Map dữ liệu Prisma của domain catalog sang contract dùng ở UI.
 *
 * Không trả model Prisma ra ngoài — mọi field nullable đều được quyết định
 * giá trị thay thế ở đây.
 */
import type { Prisma } from "@prisma/client";
import type { TourDepartureOption } from "@/lib/contracts/tour";
import { dateOnly } from "@/lib/time";

/** Điểm đón mặc định khi `tour_departures.meeting_point` để trống. */
export const DEFAULT_MEETING_POINT = "Trung tâm TP.HCM (Quận 1)";

export const DEPARTURE_SELECT = {
  id: true,
  departureDate: true,
  capacityTotal: true,
  seatsTaken: true,
  priceAdult: true,
  priceChild: true,
  holidaySurcharge: true,
  meetingPoint: true,
  status: true,
} satisfies Prisma.TourDepartureSelect;

export type CatalogDepartureRow = Prisma.TourDepartureGetPayload<{
  select: typeof DEPARTURE_SELECT;
}>;

export function toDepartureOption(
  departure: CatalogDepartureRow,
  tour: { basePriceAdult: number; basePriceChild: number },
): TourDepartureOption {
  return {
    id: departure.id,
    date: dateOnly(departure.departureDate),
    seatsRemaining: Math.max(0, departure.capacityTotal - departure.seatsTaken),
    priceAdult: departure.priceAdult ?? tour.basePriceAdult,
    priceChild: departure.priceChild ?? tour.basePriceChild,
    holidaySurcharge: departure.holidaySurcharge,
    meetingPoint: departure.meetingPoint ?? DEFAULT_MEETING_POINT,
  };
}
