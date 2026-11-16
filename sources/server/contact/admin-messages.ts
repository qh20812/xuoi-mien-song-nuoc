/**
 * Hộp thư liên hệ cho admin (P2).
 *
 * Trước phase này, `POST /api/contact` ghi vào `contact_messages` nhưng không có
 * chỗ nào đọc — dữ liệu khách gửi bị "mù". Service này là đường đọc/ghi duy nhất.
 */
import { Prisma, type ContactStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { AppError } from "@/server/errors";

export const ADMIN_CONTACT_STATUSES = [
  "new",
  "read",
  "replied",
  "spam",
] as const satisfies readonly ContactStatus[];

export type AdminContactStatus = (typeof ADMIN_CONTACT_STATUSES)[number];

export function isAdminContactStatus(value: unknown): value is AdminContactStatus {
  return (
    typeof value === "string" &&
    (ADMIN_CONTACT_STATUSES as readonly string[]).includes(value)
  );
}

export const CONTACT_STATUS_LABEL: Record<AdminContactStatus, string> = {
  new: "Mới",
  read: "Đã đọc",
  replied: "Đã phản hồi",
  spam: "Spam",
};

export type AdminContactMessage = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  subject: string | null;
  message: string;
  status: AdminContactStatus;
  createdAt: string;
};

export type ListContactMessagesInput = {
  status?: AdminContactStatus;
  q?: string;
  page?: number;
  pageSize?: number;
};

function toMessage(row: {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  subject: string | null;
  message: string;
  status: ContactStatus;
  createdAt: Date;
}): AdminContactMessage {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listAdminContactMessages(
  input: ListContactMessagesInput = {},
) {
  const page = Math.max(1, Math.trunc(input.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(input.pageSize ?? 20)));
  const q = input.q?.trim();

  const where: Prisma.ContactMessageWhereInput = {};
  if (input.status) where.status = input.status;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q } },
      { message: { contains: q } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    messages: rows.map(toMessage),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function countContactMessagesByStatus(): Promise<Record<string, number>> {
  const rows = await prisma.contactMessage.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

export async function setContactMessageStatus(
  id: number,
  status: AdminContactStatus,
  adminId: number,
): Promise<AdminContactMessage> {
  const existing = await prisma.contactMessage.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new AppError("CONTACT_NOT_FOUND", "Không tìm thấy lời nhắn", 404);
  }

  if (existing.status === status) {
    const current = await prisma.contactMessage.findUniqueOrThrow({ where: { id } });
    return toMessage(current);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.contactMessage.update({
      where: { id },
      data: { status },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "contact.status",
        entity: "contact_message",
        entityId: id,
        meta: { from: existing.status, to: status },
      },
    });

    return row;
  });

  return toMessage(updated);
}

export async function deleteContactMessage(id: number, adminId: number): Promise<void> {
  const existing = await prisma.contactMessage.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new AppError("CONTACT_NOT_FOUND", "Không tìm thấy lời nhắn", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.contactMessage.delete({ where: { id } });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "contact.delete",
        entity: "contact_message",
        entityId: id,
        meta: { status: existing.status },
      },
    });
  });
}
