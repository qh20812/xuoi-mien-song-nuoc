/**
 * Sửa nội dung tour + bật/tắt bán (P4).
 *
 * Đây là phần CRUD nội dung **có tác dụng thật**: `/dat-tour` và phần lịch khởi
 * hành của `/tour/[slug]` đọc trực tiếp bảng `tours`, nên đổi tên/giá/thời lượng
 * hay ảnh bìa ở đây là khách thấy ngay.
 *
 * Lịch trình chi tiết, gallery và các quan hệ (điểm đến/món ăn) vẫn do seed quản
 * lý — sửa ở đó cần form phức tạp hơn nên để phase sau.
 */
import type { TourStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isManagedImageUrl } from "@/lib/media/image-url";
import { AppError } from "@/server/errors";

export const ADMIN_TOUR_STATUSES = ["draft", "published", "archived"] as const;

export type AdminTourStatus = (typeof ADMIN_TOUR_STATUSES)[number];

export function isAdminTourStatus(value: unknown): value is AdminTourStatus {
  return (
    typeof value === "string" &&
    (ADMIN_TOUR_STATUSES as readonly string[]).includes(value)
  );
}

export const TOUR_STATUS_LABEL: Record<AdminTourStatus, string> = {
  draft: "Nháp",
  published: "Đang bán",
  archived: "Lưu trữ",
};

export type AdminTourDetail = {
  id: number;
  slug: string;
  code: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  description: string | null;
  durationDays: number;
  durationNights: number;
  basePriceAdult: number;
  basePriceChild: number;
  childAgeNote: string | null;
  cancellationPolicy: string | null;
  packingNotes: string | null;
  coverImageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: AdminTourStatus;
  isFeatured: boolean;
  sortOrder: number;
  departureCount: number;
};

export type TourContentInput = {
  name: string;
  tagline: string | null;
  summary: string | null;
  description: string | null;
  durationDays: number;
  durationNights: number;
  basePriceAdult: number;
  basePriceChild: number;
  childAgeNote: string | null;
  cancellationPolicy: string | null;
  packingNotes: string | null;
  coverImageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isFeatured: boolean;
  sortOrder: number;
};

function text(value: string | null, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function assertInt(value: number, min: number, max: number, label: string): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new AppError("INVALID_TOUR", `${label} phải trong khoảng ${min}–${max}`, 400);
  }
  return value;
}

function normalize(input: TourContentInput) {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 200) {
    throw new AppError("INVALID_TOUR", "Tên tour phải 2–200 ký tự", 400);
  }

  const coverImageUrl = input.coverImageUrl?.trim() ? input.coverImageUrl.trim() : null;
  if (coverImageUrl && !isManagedImageUrl(coverImageUrl)) {
    throw new AppError(
      "INVALID_TOUR",
      "Ảnh bìa phải là đường dẫn /images/… hoặc URL Cloudinary",
      400,
    );
  }

  return {
    name,
    tagline: text(input.tagline, 255),
    summary: text(input.summary, 2000),
    description: text(input.description, 60_000),
    durationDays: assertInt(input.durationDays, 1, 30, "Số ngày"),
    durationNights: assertInt(input.durationNights, 0, 29, "Số đêm"),
    basePriceAdult: assertInt(input.basePriceAdult, 0, 1_000_000_000, "Giá người lớn"),
    basePriceChild: assertInt(input.basePriceChild, 0, 1_000_000_000, "Giá trẻ em"),
    childAgeNote: text(input.childAgeNote, 255),
    cancellationPolicy: text(input.cancellationPolicy, 5000),
    packingNotes: text(input.packingNotes, 5000),
    coverImageUrl,
    seoTitle: text(input.seoTitle, 200),
    seoDescription: text(input.seoDescription, 320),
    isFeatured: input.isFeatured,
    sortOrder: assertInt(input.sortOrder, 0, 999, "Thứ tự"),
  };
}

const TOUR_SELECT = {
  id: true,
  slug: true,
  code: true,
  name: true,
  tagline: true,
  summary: true,
  description: true,
  durationDays: true,
  durationNights: true,
  basePriceAdult: true,
  basePriceChild: true,
  childAgeNote: true,
  cancellationPolicy: true,
  packingNotes: true,
  coverImageUrl: true,
  seoTitle: true,
  seoDescription: true,
  status: true,
  isFeatured: true,
  sortOrder: true,
} as const;

export async function getAdminTour(slug: string): Promise<AdminTourDetail> {
  const tour = await prisma.tour.findUnique({
    where: { slug },
    select: { ...TOUR_SELECT, _count: { select: { departures: true } } },
  });

  if (!tour) {
    throw new AppError("TOUR_NOT_FOUND", "Không tìm thấy tour", 404);
  }

  const { _count, ...rest } = tour;
  return { ...rest, departureCount: _count.departures };
}

export async function updateAdminTour(
  slug: string,
  input: TourContentInput,
  adminId: number,
): Promise<AdminTourDetail> {
  const data = normalize(input);

  const existing = await prisma.tour.findUnique({
    where: { slug },
    select: { id: true, slug: true, status: true },
  });
  if (!existing) {
    throw new AppError("TOUR_NOT_FOUND", "Không tìm thấy tour", 404);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const tour = await tx.tour.update({
      where: { id: existing.id },
      data,
      select: { ...TOUR_SELECT, _count: { select: { departures: true } } },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "tour.update",
        entity: "tour",
        entityId: existing.id,
        meta: {
          slug,
          name: data.name,
          basePriceAdult: data.basePriceAdult,
          coverImageUrl: data.coverImageUrl,
        },
      },
    });

    return tour;
  });

  const { _count, ...rest } = updated;
  return { ...rest, departureCount: _count.departures };
}

export async function setTourStatus(
  slug: string,
  status: AdminTourStatus,
  adminId: number,
): Promise<AdminTourDetail> {
  const existing = await prisma.tour.findUnique({
    where: { slug },
    select: { id: true, status: true },
  });
  if (!existing) {
    throw new AppError("TOUR_NOT_FOUND", "Không tìm thấy tour", 404);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const tour = await tx.tour.update({
      where: { id: existing.id },
      data: { status: status satisfies TourStatus },
      select: { ...TOUR_SELECT, _count: { select: { departures: true } } },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "tour.status",
        entity: "tour",
        entityId: existing.id,
        meta: { slug, from: existing.status, to: status },
      },
    });

    return tour;
  });

  const { _count, ...rest } = updated;
  return { ...rest, departureCount: _count.departures };
}
