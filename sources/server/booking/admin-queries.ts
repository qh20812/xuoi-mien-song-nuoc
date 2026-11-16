/**
 * Truy vấn danh sách đơn cho admin (dùng chung API route và trang dashboard).
 */
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ORDER_STATUSES } from "@/lib/booking/status-labels";
import { dateOnly } from "@/lib/time";
import { toAdminOrderSummary } from "@/server/booking/admin-dto";

export const ADMIN_ORDER_STATUSES = ORDER_STATUSES;

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

function buildOrderWhere(
  status?: AdminOrderStatus,
  q?: string,
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { code: { contains: q } },
      { phone: { contains: q } },
      { contactName: { contains: q } },
    ];
  }
  return where;
}

export async function listAdminOrders(input: ListAdminOrdersInput = {}) {
  const page = Math.max(1, Math.trunc(input.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(input.pageSize ?? 20)));
  const q = input.q?.trim();

  const where = buildOrderWhere(input.status, q);

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

/** Dòng phẳng cho file CSV — không dùng DTO hiển thị để tránh phụ thuộc UI. */
export type AdminOrderExportRow = {
  code: string;
  status: string;
  tourCode: string;
  tourName: string;
  departureDate: string | null;
  contactName: string;
  phone: string;
  email: string | null;
  adults: number;
  children: number;
  infants: number;
  totalAmount: number;
  createdAt: string;
};

export async function listAdminOrdersForExport(
  input: { status?: AdminOrderStatus; q?: string; limit?: number } = {},
): Promise<AdminOrderExportRow[]> {
  const limit = Math.min(5000, Math.max(1, Math.trunc(input.limit ?? 5000)));

  const orders = await prisma.order.findMany({
    where: buildOrderWhere(input.status, input.q?.trim()),
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      tour: { select: { code: true, name: true } },
      departure: { select: { departureDate: true } },
    },
  });

  return orders.map((order) => ({
    code: order.code,
    status: order.status,
    tourCode: order.tour.code,
    tourName: order.tour.name,
    departureDate: order.departure ? dateOnly(order.departure.departureDate) : null,
    contactName: order.contactName,
    phone: order.phone,
    email: order.email,
    adults: order.adults,
    children: order.children,
    infants: order.infants,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
  }));
}

export async function countOrdersByStatus(): Promise<Record<string, number>> {  const rows = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}
