/**
 * Chuyến khởi hành còn đặt được của một tour, đọc từ MySQL.
 *
 * Dùng cho khối chọn ngày ở trang chi tiết tour — fixture cũ hardcode ngày và
 * `id` không khớp `tour_departures.id`, khiến mọi đơn bị 404.
 */
import type { TourDepartureOption } from "@/lib/contracts/tour";
import prisma from "@/lib/prisma";
import { getBookingSettings } from "@/server/settings/get-booking-settings";
import { DEPARTURE_SELECT, toDepartureOption } from "@/server/catalog/dto";
import { bookableFrom, isBookableDeparture } from "@/server/catalog/is-bookable";

export async function getBookableDepartures(
  slug: string,
): Promise<TourDepartureOption[]> {
  const settings = await getBookingSettings();
  const now = new Date();
  const window = { minDaysAhead: settings.minDaysAhead, now };

  const tour = await prisma.tour.findFirst({
    where: { slug, status: "published" },
    select: {
      status: true,
      basePriceAdult: true,
      basePriceChild: true,
      departures: {
        where: {
          status: "open",
          departureDate: { gte: bookableFrom(window) },
        },
        orderBy: { departureDate: "asc" },
        select: DEPARTURE_SELECT,
      },
    },
  });

  if (!tour) return [];

  return tour.departures
    .filter((departure) =>
      isBookableDeparture(
        {
          tourStatus: tour.status,
          status: departure.status,
          departureDate: departure.departureDate,
          seatsTaken: departure.seatsTaken,
          capacityTotal: departure.capacityTotal,
        },
        window,
      ),
    )
    .map((departure) => toDepartureOption(departure, tour));
}
