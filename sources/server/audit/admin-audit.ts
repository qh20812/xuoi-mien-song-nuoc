/**
 * Nhật ký thao tác quản trị (D10.3) — chỉ đọc.
 *
 * Toàn bộ mutation trong hệ thống đã ghi `admin_audit_logs`; service này là đường
 * đọc duy nhất cho màn `/admin/audit`. Không có API công khai, chỉ owner dùng.
 */
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { addDaysToDateString, isDateOnly, vnDayStart } from "@/lib/time";

export type AdminAuditRow = {
  id: number;
  action: string;
  entity: string;
  entityId: number | null;
  meta: unknown;
  createdAt: string;
  admin: { id: number; name: string; email: string } | null;
};

export type AdminAuditAdminOption = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
};

export type ListAdminAuditInput = {
  /** Exact match, vd `order`, `tour_departure`, `admin_user`. */
  entity?: string;
  /** Prefix match, vd `order.` — tối đa 60 ký tự như cột `action`. */
  action?: string;
  adminId?: number;
  /** Ngày VN dạng YYYY-MM-DD; giá trị không hợp lệ bị bỏ qua. */
  from?: string;
  /** Ngày VN dạng YYYY-MM-DD, tính cả ngày này; giá trị không hợp lệ bị bỏ qua. */
  to?: string;
  page?: number;
  pageSize?: number;
};

function toRow(row: {
  id: number;
  action: string;
  entity: string;
  entityId: number | null;
  meta: Prisma.JsonValue | null;
  createdAt: Date;
  admin: { id: number; name: string; email: string } | null;
}): AdminAuditRow {
  return {
    id: row.id,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    meta: row.meta ?? null,
    createdAt: row.createdAt.toISOString(),
    admin: row.admin
      ? { id: row.admin.id, name: row.admin.name, email: row.admin.email }
      : null,
  };
}

export async function listAdminAuditLogs(input: ListAdminAuditInput = {}) {
  const page = Math.max(1, Math.trunc(input.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(input.pageSize ?? 50)));
  const action = input.action?.trim().slice(0, 60);
  const entity = input.entity?.trim();

  const where: Prisma.AdminAuditLogWhereInput = {};
  if (entity) where.entity = entity;
  if (action) where.action = { startsWith: action };
  if (
    typeof input.adminId === "number" &&
    Number.isInteger(input.adminId) &&
    input.adminId > 0
  ) {
    where.adminId = input.adminId;
  }

  const from = isDateOnly(input.from) ? input.from : undefined;
  const to = isDateOnly(input.to) ? input.to : undefined;
  if (from || to) {
    // Cột là DATETIME UTC, còn filter là ngày lịch VN (UTC+7). `to` tính cả ngày
    // nên chặn dưới mốc 00:00 VN của ngày kế tiếp.
    const createdAt: Prisma.DateTimeFilter = {};
    if (from) createdAt.gte = vnDayStart(from);
    if (to) createdAt.lt = vnDayStart(addDaysToDateString(to, 1));
    where.createdAt = createdAt;
  }

  const [total, rows] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return {
    rows: rows.map(toRow),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

/** Danh sách cho select lọc — gồm cả tài khoản đã khoá vì họ vẫn có lịch sử. */
export async function listAuditAdminOptions(): Promise<AdminAuditAdminOption[]> {
  return prisma.adminUser.findMany({
    select: { id: true, name: true, email: true, isActive: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}
