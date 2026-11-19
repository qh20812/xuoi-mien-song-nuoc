/**
 * Ghi chú nội bộ + phân công đơn (D7).
 *
 * Cố ý **không** ghi `order_status_history`: đó là lịch sử nghiệp vụ của đơn.
 * Hoạt động nội bộ chỉ vào `admin_audit_log`.
 */
import prisma from "@/lib/prisma";
import { AppError } from "@/server/errors";

export const MAX_ADMIN_NOTE_LENGTH = 2000;

export type AssignableAdmin = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export async function listAssignableAdmins(): Promise<AssignableAdmin[]> {
  return prisma.adminUser.findMany({
    where: { isActive: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function updateOrderAdminNote(
  orderId: number,
  note: string | null,
  adminId: number,
): Promise<void> {
  const value = note?.trim() ? note.trim().slice(0, MAX_ADMIN_NOTE_LENGTH) : null;

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError("ORDER_NOT_FOUND", "Không tìm thấy đơn", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { adminNote: value } });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "order.note",
        entity: "order",
        entityId: orderId,
        meta: { hasNote: value !== null, length: value?.length ?? 0 },
      },
    });
  });
}

export async function assignOrder(
  orderId: number,
  assigneeId: number | null,
  adminId: number,
): Promise<void> {
  if (assigneeId !== null) {
    const assignee = await prisma.adminUser.findUnique({
      where: { id: assigneeId },
      select: { id: true, isActive: true },
    });

    if (!assignee) {
      throw new AppError("ADMIN_NOT_FOUND", "Không tìm thấy tài khoản được giao", 404);
    }
    if (!assignee.isActive) {
      throw new AppError(
        "ADMIN_INACTIVE",
        "Tài khoản này đã bị khoá, không giao đơn được",
        409,
      );
    }
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, assignedAdminId: true },
  });
  if (!existing) {
    throw new AppError("ORDER_NOT_FOUND", "Không tìm thấy đơn", 404);
  }

  if (existing.assignedAdminId === assigneeId) return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { assignedAdminId: assigneeId },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "order.assign",
        entity: "order",
        entityId: orderId,
        meta: { from: existing.assignedAdminId, to: assigneeId },
      },
    });
  });
}
