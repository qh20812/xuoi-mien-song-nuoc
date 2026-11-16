/**
 * Kiểm duyệt đánh giá (P5).
 *
 * `reviews` có sẵn trong schema nhưng chưa từng có đường đọc/ghi — service này là
 * nơi duy nhất admin tương tác. Chưa có form khách gửi đánh giá, nên bảng sẽ
 * rỗng cho tới khi có nguồn nhập (nhập tay, API riêng hoặc job đồng bộ).
 */
import type { ReviewStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { AppError } from "@/server/errors";

export const ADMIN_REVIEW_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "hidden",
] as const satisfies readonly ReviewStatus[];

export type AdminReviewStatus = (typeof ADMIN_REVIEW_STATUSES)[number];

export function isAdminReviewStatus(value: unknown): value is AdminReviewStatus {
  return (
    typeof value === "string" &&
    (ADMIN_REVIEW_STATUSES as readonly string[]).includes(value)
  );
}

export const REVIEW_STATUS_LABEL: Record<AdminReviewStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  hidden: "Đang ẩn",
};

export type AdminReviewRow = {
  id: number;
  authorName: string;
  rating: number;
  comment: string | null;
  status: AdminReviewStatus;
  isFeatured: boolean;
  adminReply: string | null;
  isVerified: boolean;
  tourName: string | null;
  tourSlug: string | null;
  createdAt: string;
  approvedAt: string | null;
};

const REVIEW_INCLUDE = {
  tour: { select: { name: true, slug: true } },
} as const;

type ReviewRecord = {
  id: number;
  authorName: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  isFeatured: boolean;
  adminReply: string | null;
  orderId: number | null;
  createdAt: Date;
  approvedAt: Date | null;
  tour: { name: string; slug: string } | null;
};

function toRow(review: ReviewRecord): AdminReviewRow {
  return {
    id: review.id,
    authorName: review.authorName,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    isFeatured: review.isFeatured,
    adminReply: review.adminReply,
    isVerified: review.orderId !== null,
    tourName: review.tour?.name ?? null,
    tourSlug: review.tour?.slug ?? null,
    createdAt: review.createdAt.toISOString(),
    approvedAt: review.approvedAt ? review.approvedAt.toISOString() : null,
  };
}

export async function listAdminReviews(input: {
  status?: AdminReviewStatus;
  page?: number;
  pageSize?: number;
} = {}) {
  const page = Math.max(1, Math.trunc(input.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(input.pageSize ?? 20)));

  const where = input.status ? { status: input.status } : {};

  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: REVIEW_INCLUDE,
    }),
  ]);

  return {
    reviews: rows.map(toRow),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function countReviewsByStatus(): Promise<Record<string, number>> {
  const rows = await prisma.review.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

export async function setReviewStatus(
  id: number,
  status: AdminReviewStatus,
  adminId: number,
): Promise<AdminReviewRow> {
  const existing = await prisma.review.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) {
    throw new AppError("REVIEW_NOT_FOUND", "Không tìm thấy đánh giá", 404);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.review.update({
      where: { id },
      data: {
        status,
        approvedAt: status === "approved" ? new Date() : null,
      },
      include: REVIEW_INCLUDE,
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "review.status",
        entity: "review",
        entityId: id,
        meta: { from: existing.status, to: status },
      },
    });

    return row;
  });

  return toRow(updated);
}

export async function setReviewFeatured(
  id: number,
  isFeatured: boolean,
  adminId: number,
): Promise<AdminReviewRow> {
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.review.update({
      where: { id },
      data: { isFeatured },
      include: REVIEW_INCLUDE,
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "review.featured",
        entity: "review",
        entityId: id,
        meta: { isFeatured },
      },
    });

    return row;
  });

  return toRow(updated);
}

export async function setReviewReply(
  id: number,
  adminReply: string | null,
  adminId: number,
): Promise<AdminReviewRow> {
  const reply = adminReply?.trim() ? adminReply.trim().slice(0, 2000) : null;

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.review.update({
      where: { id },
      data: { adminReply: reply },
      include: REVIEW_INCLUDE,
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "review.reply",
        entity: "review",
        entityId: id,
        meta: { hasReply: reply !== null },
      },
    });

    return row;
  });

  return toRow(updated);
}

export async function deleteReview(id: number, adminId: number): Promise<void> {
  const existing = await prisma.review.findUnique({
    where: { id },
    select: { id: true, authorName: true },
  });
  if (!existing) {
    throw new AppError("REVIEW_NOT_FOUND", "Không tìm thấy đánh giá", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id } });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "review.delete",
        entity: "review",
        entityId: id,
        meta: { authorName: existing.authorName },
      },
    });
  });
}
