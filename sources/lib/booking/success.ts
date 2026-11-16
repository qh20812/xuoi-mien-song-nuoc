/**
 * Chuyển đơn công khai do server trả về sang dữ liệu cho màn hình "Đã giữ chỗ".
 *
 * Mọi số liệu (tổng tiền, hạn giữ chỗ, hạn huỷ, trạng thái) lấy từ server —
 * client không tính lại, tránh lệch giữa UI và đơn thật.
 */
import type { BookingSuccessData } from "@/lib/contracts/booking";
import type { PublicOrder } from "@/lib/contracts/order";
import { toLocalImage } from "@/lib/images";

export function orderDtoToBookingSuccess(
  order: PublicOrder,
): BookingSuccessData {
  return {
    code: order.code,
    status: order.status,
    statusLabel: order.statusLabel,
    holdExpiresAt: order.holdExpiresAt,
    tourCode: order.tour.code,
    tourName: order.tour.name,
    tourSlug: order.tour.slug,
    durationDays: order.tour.durationDays,
    durationNights: order.tour.durationNights,
    coverImage: toLocalImage(order.tour.coverImageUrl, order.tour.name) ?? undefined,
    departureDate: order.departure.date,
    contactName: order.contactName,
    phoneMasked: order.phoneMasked,
    guests: {
      adults: order.guests.adults,
      children: order.guests.children,
      infants: order.guests.infants,
    },
    totalAmount: order.pricing.totalAmount,
    pickupPoint: order.pickupPoint ?? "Chưa chọn",
    cancellationDeadline: order.cancellation.deadline,
    canCancel: order.cancellation.canCancel,
  };
}
