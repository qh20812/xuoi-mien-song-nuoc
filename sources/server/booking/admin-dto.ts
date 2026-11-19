/**
 * DTO dành cho admin: đầy đủ số điện thoại, ghi chú nội bộ và lịch sử trạng thái.
 * Vẫn không trả lookupToken / ipHash.
 */
import type { Prisma } from "@prisma/client";
import type { BookingSettings } from "@/lib/settings";
import { dateOnly, isoOrNull } from "@/lib/time";
import { toOrderDto } from "@/server/booking/dto";

export type AdminOrderForDto = Prisma.OrderGetPayload<{
  include: {
    tour: true;
    departure: true;
    passengers: true;
    statusHistory: true;
    assignedAdmin: { select: { id: true; name: true; email: true } };
  };
}>;

export function toAdminOrderDto(order: AdminOrderForDto, settings: BookingSettings) {
  const base = toOrderDto(order, settings);

  return {
    ...base,
    id: order.id,
    phone: order.phone,
    email: order.email,
    source: order.source,
    adminNote: order.adminNote,
    assignedAdmin: order.assignedAdmin
      ? {
          id: order.assignedAdmin.id,
          name: order.assignedAdmin.name,
          email: order.assignedAdmin.email,
        }
      : null,
    clientRequestId: order.clientRequestId,
    tourId: order.tourId,
    departureId: order.departureId,
    holdExpired:
      order.status === "new" &&
      order.holdExpiresAt !== null &&
      order.holdExpiresAt.getTime() < Date.now(),
    statusHistory: order.statusHistory
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((row) => ({
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        note: row.note,
        changedBy: row.changedBy,
        createdAt: row.createdAt.toISOString(),
      })),
  };
}

export type AdminOrderSummaryInput = Prisma.OrderGetPayload<{
  include: {
    tour: { select: { code: true; name: true } };
    departure: { select: { departureDate: true; returnDate: true } };
    assignedAdmin: { select: { id: true; name: true } };
  };
}>;

export function toAdminOrderSummary(order: AdminOrderSummaryInput) {
  const seats = order.adults + order.children + order.infants;
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    contactName: order.contactName,
    phone: order.phone,
    email: order.email,
    guests: { adults: order.adults, children: order.children, infants: order.infants, seats },
    totalAmount: order.totalAmount,
    tour: { code: order.tour.code, name: order.tour.name },
    assignee: order.assignedAdmin
      ? { id: order.assignedAdmin.id, name: order.assignedAdmin.name }
      : null,
    departure: {
      date: dateOnly(order.departure.departureDate),
      returnDate: order.departure.returnDate ? dateOnly(order.departure.returnDate) : null,
    },
    holdExpiresAt: isoOrNull(order.holdExpiresAt),
    holdExpired:
      order.status === "new" &&
      order.holdExpiresAt !== null &&
      order.holdExpiresAt.getTime() < Date.now(),
    createdAt: order.createdAt.toISOString(),
  };
}

export { ORDER_INCLUDE } from "@/server/booking/dto";
