/**
 * Danh sách tour + chuyến khởi hành **thật** cho trang đặt giữ chỗ.
 *
 * Nguồn dữ liệu duy nhất là MySQL — không dùng fixture. Nhờ vậy `departureId`
 * gửi lên `POST /api/orders` luôn tồn tại, tránh lỗi `DEPARTURE_NOT_FOUND`.
 */
import type { BookingTourOption } from "@/lib/contracts/booking";
import { toImageAsset } from "@/lib/images";
import prisma from "@/lib/prisma";
import { getBookingSettings } from "@/server/settings/get-booking-settings";
import { DEPARTURE_SELECT, toDepartureOption } from "@/server/catalog/dto";
import { bookableFrom, isBookableDeparture } from "@/server/catalog/is-bookable";

export async function listBookableTours(): Promise<BookingTourOption[]> {
  const settings = await getBookingSettings();
  const now = new Date();
  const window = { minDaysAhead: settings.minDaysAhead, now };

  const tours = await prisma.tour.findMany({
    where: { status: "published" },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
    select: {
      code: true,
      slug: true,
      name: true,
      durationDays: true,
      durationNights: true,
      basePriceAdult: true,
      basePriceChild: true,
      coverImageUrl: true,
      status: true,
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

  const options = tours.map((tour): BookingTourOption => {
    const departures = tour.departures
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

    return {
      code: tour.code,
      slug: tour.slug,
      name: tour.name,
      durationDays: tour.durationDays,
      durationNights: tour.durationNights,
      priceAdult: tour.basePriceAdult,
      priceChild: tour.basePriceChild,
      coverImage: toImageAsset(tour.coverImageUrl, tour.name),
      departures,
    };
  });

  // Tour còn chỗ đứng trước để wizard mặc định vào tour đặt được ngay.
  const withDepartures = options.filter((tour) => tour.departures.length > 0);
  const withoutDepartures = options.filter(
    (tour) => tour.departures.length === 0,
  );

  return [...withDepartures, ...withoutDepartures];
}
