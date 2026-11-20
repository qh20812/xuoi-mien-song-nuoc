/**
 * CRUD FAQ cho admin (D9.5).
 *
 * Mọi mutation ghi `admin_audit_log` trong cùng transaction. FAQ không có slug;
 * admin sửa/xoá theo id.
 */
import { Prisma } from "@prisma/client";
import type { FaqPlacement } from "@/lib/contracts/faq";
import { isFaqPlacement } from "@/lib/contracts/faq";
import {
  FAQ_CATEGORIES,
  normalizeFaqCategory,
  type FaqCategory,
} from "@/lib/content/faq-options";
import prisma from "@/lib/prisma";
import { AppError } from "@/server/errors";

export type AdminFaqRow = {
  id: number;
  question: string;
  answer: string;
  category: FaqCategory;
  placement: FaqPlacement | null;
  sortOrder: number;
  isActive: boolean;
};

export type FaqInput = {
  question: string;
  answer: string;
  category: FaqCategory;
  placement: FaqPlacement | null;
  sortOrder: number;
  isActive: boolean;
};

const ADMIN_FAQ_SELECT = {
  id: true,
  question: true,
  answer: true,
  category: true,
  placement: true,
  sortOrder: true,
  isActive: true,
} satisfies Prisma.FaqSelect;

type FaqRecord = Prisma.FaqGetPayload<{ select: typeof ADMIN_FAQ_SELECT }>;

function toRow(row: FaqRecord): AdminFaqRow {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: normalizeFaqCategory(row.category),
    placement: isFaqPlacement(row.placement) ? row.placement : null,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

function normalize(input: FaqInput) {
  const question = input.question.trim();
  if (question.length < 2 || question.length > 500) {
    throw new AppError("INVALID_FAQ", "Câu hỏi phải 2–500 ký tự", 400);
  }

  const answer = input.answer.trim();
  if (answer.length < 2 || answer.length > 60_000) {
    throw new AppError("INVALID_FAQ", "Câu trả lời phải 2–60.000 ký tự", 400);
  }

  if (!(FAQ_CATEGORIES as readonly string[]).includes(input.category)) {
    throw new AppError("INVALID_FAQ", "Chủ đề không hợp lệ", 400);
  }

  if (input.placement !== null && !isFaqPlacement(input.placement)) {
    throw new AppError("INVALID_FAQ", "Vị trí hiển thị không hợp lệ", 400);
  }

  if (
    !Number.isInteger(input.sortOrder) ||
    input.sortOrder < 0 ||
    input.sortOrder > 999
  ) {
    throw new AppError("INVALID_FAQ", "Thứ tự phải trong khoảng 0–999", 400);
  }

  if (typeof input.isActive !== "boolean") {
    throw new AppError("INVALID_FAQ", "Trạng thái hiển thị không hợp lệ", 400);
  }

  return {
    question,
    answer,
    category: input.category,
    placement: input.placement,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  };
}

export async function listAdminFaqs(): Promise<AdminFaqRow[]> {
  const rows = await prisma.faq.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: ADMIN_FAQ_SELECT,
  });

  return rows.map(toRow);
}

export async function getAdminFaq(id: number): Promise<AdminFaqRow> {
  const row = await prisma.faq.findUnique({
    where: { id },
    select: ADMIN_FAQ_SELECT,
  });

  if (!row) {
    throw new AppError("FAQ_NOT_FOUND", "Không tìm thấy câu hỏi", 404);
  }

  return toRow(row);
}

export async function createFaq(
  input: FaqInput,
  adminId: number,
): Promise<AdminFaqRow> {
  const data = normalize(input);

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.faq.create({
      data,
      select: ADMIN_FAQ_SELECT,
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "faq.create",
        entity: "faq",
        entityId: created.id,
        meta: {
          question: data.question,
          placement: data.placement,
          isActive: data.isActive,
        },
      },
    });

    return created;
  });

  return toRow(row);
}

export async function updateFaq(
  id: number,
  input: FaqInput,
  adminId: number,
): Promise<AdminFaqRow> {
  const data = normalize(input);

  const existing = await prisma.faq.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError("FAQ_NOT_FOUND", "Không tìm thấy câu hỏi", 404);
  }

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.faq.update({
      where: { id },
      data,
      select: ADMIN_FAQ_SELECT,
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "faq.update",
        entity: "faq",
        entityId: id,
        meta: {
          question: data.question,
          placement: data.placement,
          isActive: data.isActive,
        },
      },
    });

    return updated;
  });

  return toRow(row);
}

export async function deleteFaq(id: number, adminId: number): Promise<void> {
  const existing = await prisma.faq.findUnique({
    where: { id },
    select: { id: true, question: true },
  });
  if (!existing) {
    throw new AppError("FAQ_NOT_FOUND", "Không tìm thấy câu hỏi", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.faq.delete({ where: { id } });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "faq.delete",
        entity: "faq",
        entityId: id,
        meta: { question: existing.question },
      },
    });
  });
}
