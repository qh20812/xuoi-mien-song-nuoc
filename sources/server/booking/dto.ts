/**
 * Chuyển dữ liệu Prisma thành DTO công khai cho khách.
 *
 * Không trả về lookupToken, ipHash, id nội bộ, adminNote hay ghi chú vận hành.
 */
import type { Prisma } from "@prisma/client";
import type { BookingSettings } from "@/lib/settings";
import { cancelDeadline, dateOnly, daysUntilDeparture, isoOrNull } from "@/lib/time";

export type OrderForDto = Prisma.OrderGetPayload<{
  include: { tour: true; departure: true; passengers: true };
}>;

const STATUS_LABELS: Record<string, string> = {
  new: "Chờ xác nhận",
  pending: "Đang liên hệ",
  confirmed: "Đã xác nhận",
  completed: "Đã hoàn thành",
  cancelled: "Đã huỷ",
  expired: "Hết hạn giữ chỗ",
};

const PASSENGER_LABELS: Record<string, string> = {
  adult: "Người lớn",
  child: "Trẻ em",
  infant: "Em bé",
};

export function maskPhone(phone: string): string {
  if (phone.length < 8) return "***";
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

export function orderSeats(order: {
  adults: number;
  children: number;
  infants: number;
}): number {
  return order.adults + order.children + order.infants;
}

export function canCustomerCancel(
  order: { status: string; departure: { departureDate: Date } },
  cutoffDays: number,
  now: Date = new Date(),
): boolean {
  if (!["new", "pending", "confirmed"].includes(order.status)) return false;
  return daysUntilDeparture(order.departure.departureDate, now) >= cutoffDays;
}

export function toOrderDto(
  order: OrderForDto,
  settings: BookingSettings,
  options: { alreadyCancelled?: boolean } = {},
) {
  const seats = orderSeats(order);
  const cutoffDays = settings.cancelCutoffDays;

  return {
    code: order.code,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status] ?? order.status,
    contactName: order.contactName,
    phoneMasked: maskPhone(order.phone),
    email: order.email,
    pickupPoint: order.pickupPoint,
    customerNote: order.customerNote,
    guests: {
      adults: order.adults,
      children: order.children,
      infants: order.infants,
      seats,
    },
    pricing: {
      currency: "VND",
      unitPriceAdult: order.unitPriceAdult,
      unitPriceChild: order.unitPriceChild,
      surcharge: order.surcharge,
      totalAmount: order.totalAmount,
    },
    tour: {
      code: order.tour.code,
      name: order.tour.name,
      slug: order.tour.slug,
      durationDays: order.tour.durationDays,
      durationNights: order.tour.durationNights,
      coverImageUrl: order.tour.coverImageUrl,
    },
    departure: {
      date: dateOnly(order.departure.departureDate),
      returnDate: order.departure.returnDate ? dateOnly(order.departure.returnDate) : null,
      meetingPoint: order.departure.meetingPoint,
    },
    passengers: order.passengers
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((passenger) => ({
        fullName: passenger.fullName,
        type: passenger.type,
        typeLabel: PASSENGER_LABELS[passenger.type] ?? passenger.type,
        birthYear: passenger.birthYear,
        note: passenger.note,
      })),
    cancellation: {
      cutoffDays,
      deadline: cancelDeadline(order.departure.departureDate, cutoffDays),
      canCancel: canCustomerCancel(order, cutoffDays),
      policy: order.tour.cancellationPolicy,
      note:
        order.status === "cancelled"
          ? "Đơn đã được huỷ."
          : order.status === "expired"
            ? "Đơn đã hết hạn giữ chỗ."
            : canCustomerCancel(order, cutoffDays)
              ? `Có thể tự huỷ đến hết ngày ${cancelDeadline(order.departure.departureDate, cutoffDays)}.`
              : "Đã quá hạn tự huỷ, vui lòng liên hệ hotline.",
    },
    holdExpiresAt: isoOrNull(order.holdExpiresAt),
    createdAt: order.createdAt.toISOString(),
    confirmedAt: isoOrNull(order.confirmedAt),
    cancelledAt: isoOrNull(order.cancelledAt),
    cancelReason: order.cancelReason,
    ...(options.alreadyCancelled ? { alreadyCancelled: true } : {}),
  };
}

export const ORDER_INCLUDE = {
  tour: true,
  departure: true,
  passengers: true,
} satisfies Prisma.OrderInclude;

export type OrderDto = ReturnType<typeof toOrderDto>;
