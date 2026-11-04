/**
 * Truy vấn danh sách đơn cho admin (dùng chung API route và trang dashboard).
 */
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { toAdminOrderSummary } from "@/server/booking/admin-dto";

export const ADMIN_ORDER_STATUSES = [
  "new",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "expired",
] as const;

export type AdminOrderStatus = (typeof ADMIN_ORDER_STATUSES)[number];

export function isAdminOrderStatus(value: unknown): value is AdminOrderStatus {
  return typeof value === "string" && ADMIN_ORDER_STATUSES.includes(value as AdminOrderStatus);
}

export type ListAdminOrdersInput = {
  status?: AdminOrderStatus;
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listAdminOrders(input: ListAdminOrdersInput = {}) {
  const page = Math.max(1, Math.trunc(input.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(input.pageSize ?? 20)));
  const q = input.q?.trim();

  const where: Prisma.OrderWhereInput = {};
  if (input.status) where.status = input.status;
  if (q) {
    where.OR = [
      { code: { contains: q } },
      { phone: { contains: q } },
      { contactName: { contains: q } },
    ];
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        tour: { select: { code: true, name: true } },
        departure: { select: { departureDate: true, returnDate: true } },
      },
    }),
  ]);

  return {
    orders: orders.map(toAdminOrderSummary),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function countOrdersByStatus(): Promise<Record<string, number>> {
  const rows = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}
