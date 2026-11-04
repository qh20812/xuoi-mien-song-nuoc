/**
 * Admin cập nhật trạng thái đơn.
 *
 * Luồng: new -> pending -> confirmed -> completed
 *        new/pending/confirmed -> cancelled (admin được override hạn huỷ)
 */
import type { OrderStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getBookingSettings } from "@/lib/settings";
import { toAdminOrderDto, type AdminOrderForDto } from "@/server/booking/admin-dto";
import { cancelOrderAsAdmin } from "@/server/booking/cancel-order";
import { BookingError } from "@/server/booking/errors";

export type AdminOrderAction = "pending" | "confirm" | "complete" | "cancel";

const ADMIN_INCLUDE = {
  tour: true,
  departure: true,
  passengers: true,
  statusHistory: true,
} satisfies Prisma.OrderInclude;

const TRANSITIONS: Record<
  Exclude<AdminOrderAction, "cancel">,
  { from: OrderStatus[]; to: OrderStatus; action: string; defaultNote: string }
> = {
  pending: {
    from: ["new"],
    to: "pending",
    action: "order.pending",
    defaultNote: "Admin đã liên hệ khách, chờ xác nhận",
  },
  confirm: {
    from: ["new", "pending"],
    to: "confirmed",
    action: "order.confirm",
    defaultNote: "Admin xác nhận đơn",
  },
  complete: {
    from: ["confirmed"],
    to: "completed",
    action: "order.complete",
    defaultNote: "Đơn đã hoàn thành",
  },
};

export async function getAdminOrderById(orderId: number) {
  const [settings, order] = await Promise.all([
    getBookingSettings(),
    prisma.order.findUnique({
      where: { id: orderId },
      include: ADMIN_INCLUDE,
    }),
  ]);

  if (!order) {
    throw new BookingError("ORDER_NOT_FOUND", "Không tìm thấy đơn", 404);
  }

  return toAdminOrderDto(order as AdminOrderForDto, settings);
}

export async function updateOrderByAdmin(
  orderId: number,
  action: AdminOrderAction,
  adminId: number,
  reason?: string | null,
) {
  const settings = await getBookingSettings();

  if (action === "cancel") {
    const cancelled = await cancelOrderAsAdmin(orderId, adminId, reason);
    if (!cancelled.alreadyCancelled) {
      await prisma.adminAuditLog.create({
        data: {
          adminId,
          action: "order.cancel",
          entity: "order",
          entityId: orderId,
          meta: { reason: cancelled.cancelReason ?? reason ?? null },
        },
      });
    }
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: ADMIN_INCLUDE,
    });
    return toAdminOrderDto(order as AdminOrderForDto, settings);
  }

  const transition = TRANSITIONS[action];
  const note = (reason?.trim() || transition.defaultNote).slice(0, 500);

  await prisma.$transaction(
    async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true },
      });

      if (!current) {
        throw new BookingError("ORDER_NOT_FOUND", "Không tìm thấy đơn", 404);
      }

      if (current.status === transition.to) return; // idempotent

      if (!transition.from.includes(current.status)) {
        throw new BookingError(
          "INVALID_TRANSITION",
          `Không thể chuyển đơn từ "${current.status}" sang "${transition.to}"`,
          409,
          { from: current.status, to: transition.to },
        );
      }

      const data: Prisma.OrderUpdateManyMutationInput = { status: transition.to };
      if (action === "confirm") {
        data.confirmedAt = new Date();
        data.confirmedBy = adminId;
        data.holdExpiresAt = null;
      }

      const changed = await tx.order.updateMany({
        where: { id: orderId, status: { in: transition.from } },
        data,
      });

      if (changed.count === 0) {
        throw new BookingError(
          "CONFLICT",
          "Đơn vừa được cập nhật bởi người khác, vui lòng tải lại",
          409,
        );
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: current.status,
          toStatus: transition.to,
          note,
          changedBy: adminId,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: transition.action,
          entity: "order",
          entityId: orderId,
          meta: { from: current.status, to: transition.to, note },
        },
      });
    },
    {
      timeout: 15_000,
      maxWait: 10_000,
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: ADMIN_INCLUDE,
  });
  return toAdminOrderDto(order as AdminOrderForDto, settings);
}
