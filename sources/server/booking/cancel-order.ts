/**
 * Huỷ đơn giữ chỗ.
 *
 * - Khách tự huỷ được khi còn ít nhất `cancelCutoffDays` ngày (mặc định 3).
 * - Admin có thể huỷ sát ngày (overrideCutoff).
 * - Transaction có điều kiện status để bấm huỷ 2 lần / 2 tab không nhả chỗ 2 lần.
 */
import { timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getBookingSettings, type BookingSettings } from "@/lib/settings";
import { cancelDeadline, daysUntilDeparture } from "@/lib/time";
import { cancelOrderSchema } from "@/lib/validation/order";
import {
  ORDER_INCLUDE,
  orderSeats,
  toOrderDto,
  type OrderDto,
  type OrderForDto,
} from "@/server/booking/dto";
import { BookingError } from "@/server/booking/errors";

const NOT_FOUND_MESSAGE =
  "Không tìm thấy đơn phù hợp với mã đơn và số điện thoại đã nhập";

const CANCELLABLE = ["new", "pending", "confirmed"] as const;

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function reloadOrder(orderId: number): Promise<OrderForDto> {
  return prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: ORDER_INCLUDE,
  });
}

function assertCancellable(order: OrderForDto) {
  if (order.status === "expired") {
    throw new BookingError(
      "ORDER_EXPIRED",
      "Đơn đã hết hạn giữ chỗ và chỗ đã được nhả. Vui lòng đặt lại đơn mới.",
      409,
    );
  }
  if (order.status === "completed") {
    throw new BookingError("ORDER_COMPLETED", "Đơn đã hoàn thành, không thể huỷ.", 409);
  }
  if (!CANCELLABLE.includes(order.status as (typeof CANCELLABLE)[number])) {
    throw new BookingError(
      "ORDER_NOT_CANCELLABLE",
      "Đơn ở trạng thái này không thể huỷ.",
      409,
    );
  }
}

async function cancelRecord(
  order: OrderForDto,
  settings: BookingSettings,
  options: {
    adminId?: number | null;
    overrideCutoff?: boolean;
    reason?: string | null;
  },
): Promise<OrderDto> {
  const adminId = options.adminId ?? null;
  const reason = (options.reason?.trim() || (adminId ? "Admin huỷ đơn" : "Khách tự huỷ")).slice(
    0,
    500,
  );

  if (!options.overrideCutoff) {
    const daysLeft = daysUntilDeparture(order.departure.departureDate);
    if (daysLeft < settings.cancelCutoffDays) {
      throw new BookingError(
        "CANCEL_TOO_LATE",
        `Đã quá hạn tự huỷ (phải huỷ trước ${settings.cancelCutoffDays} ngày khởi hành). Vui lòng liên hệ hotline để được hỗ trợ.`,
        409,
        {
          cutoffDays: settings.cancelCutoffDays,
          deadline: cancelDeadline(order.departure.departureDate, settings.cancelCutoffDays),
        },
      );
    }
  }

  const seats = orderSeats(order);

  const updated = await prisma.$transaction(
    async (tx) => {
      const changed = await tx.$executeRaw`
        UPDATE orders
           SET status = 'cancelled',
               cancelled_at = NOW(3),
               cancel_reason = ${reason},
               cancelled_by = ${adminId},
               updated_at = NOW(3)
         WHERE id = ${order.id}
           AND status IN ('new', 'pending', 'confirmed')`;

      if (changed === 0) return null;

      await tx.$executeRaw`
        UPDATE tour_departures
           SET seats_taken = GREATEST(CAST(seats_taken AS SIGNED) - ${seats}, 0)
         WHERE id = ${order.departureId}`;

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: "cancelled",
          note: reason,
          changedBy: adminId,
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: ORDER_INCLUDE,
      });
    },
    {
      timeout: 15_000,
      maxWait: 10_000,
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );

  if (!updated) {
    // Một request khác vừa đổi trạng thái.
    const current = await reloadOrder(order.id);
    if (current.status === "cancelled") {
      return toOrderDto(current, settings, { alreadyCancelled: true });
    }
    assertCancellable(current);
    throw new BookingError(
      "CONFLICT",
      "Đơn vừa được cập nhật, vui lòng tải lại trang",
      409,
    );
  }

  return toOrderDto(updated, settings);
}

/** Khách tự huỷ bằng mã đơn + số điện thoại. */
export async function cancelOrder(rawInput: unknown): Promise<OrderDto> {
  const input = cancelOrderSchema.parse(rawInput);
  const settings = await getBookingSettings();

  const order = await prisma.order.findUnique({
    where: { code: input.code },
    include: ORDER_INCLUDE,
  });

  if (!order || !safeEqual(order.phone, input.phone)) {
    throw new BookingError("ORDER_NOT_FOUND", NOT_FOUND_MESSAGE, 404);
  }

  if (order.status === "cancelled") {
    return toOrderDto(order, settings, { alreadyCancelled: true });
  }

  assertCancellable(order);

  return cancelRecord(order, settings, {
    adminId: null,
    overrideCutoff: false,
    reason: input.reason,
  });
}

/** Admin huỷ theo id đơn, được phép sát ngày. */
export async function cancelOrderAsAdmin(
  orderId: number,
  adminId: number,
  reason?: string | null,
): Promise<OrderDto> {
  const settings = await getBookingSettings();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_INCLUDE,
  });

  if (!order) {
    throw new BookingError("ORDER_NOT_FOUND", "Không tìm thấy đơn", 404);
  }

  if (order.status === "cancelled") {
    return toOrderDto(order, settings, { alreadyCancelled: true });
  }

  assertCancellable(order);

  return cancelRecord(order, settings, {
    adminId,
    overrideCutoff: true,
    reason: reason ?? "Admin huỷ đơn",
  });
}
