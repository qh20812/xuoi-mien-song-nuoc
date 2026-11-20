/**
 * CRUD điểm đến cho admin (D9.2).
 *
 * Mọi mutation ghi `admin_audit_log` trong cùng transaction. Slug bất biến sau
 * khi tạo: form sửa chỉ đọc slug, service vẫn kiểm tra trùng nếu có thay đổi.
 */
import { Prisma } from "@prisma/client";
import type { DestinationCategory } from "@/lib/contracts/destination";
import {
  CATEGORY_LABELS,
  normalizeDestinationCategory,
} from "@/lib/destinations/categories";
import prisma from "@/lib/prisma";
import { isManagedImageUrl } from "@/lib/media/image-url";
import { AppError } from "@/server/errors";

export const ADMIN_DESTINATION_STATUSES = ["draft", "published"] as const;

export type AdminDestinationStatus = (typeof ADMIN_DESTINATION_STATUSES)[number];

export function isAdminDestinationStatus(
  value: unknown,
): value is AdminDestinationStatus {
  return (
    typeof value === "string" &&
    (ADMIN_DESTINATION_STATUSES as readonly string[]).includes(value)
  );
}

export const DESTINATION_STATUS_LABEL: Record<AdminDestinationStatus, string> = {
  draft: "Nháp",
  published: "Đang hiển thị",
};

export type AdminDestinationRow = {
  id: number;
  slug: string;
  name: string;
  province: string;
  category: DestinationCategory;
  shortDesc: string | null;
  description: string | null;
  bestSeason: string | null;
  travelNote: string | null;
  coverImageUrl: string | null;
  lat: number | null;
  lng: number | null;
  status: AdminDestinationStatus;
  sortOrder: number;
  tourIds: number[];
};

export type DestinationInput = {
  slug: string;
  name: string;
  province: string;
  category: DestinationCategory;
  shortDesc: string | null;
  description: string | null;
  bestSeason: string | null;
  travelNote: string | null;
  coverImageUrl: string | null;
  lat: number | null;
  lng: number | null;
  status: AdminDestinationStatus;
  sortOrder: number;
  tourIds: number[];
};

export type TourOption = {
  id: number;
  code: string;
  name: string;
  status: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as DestinationCategory[];

const ADMIN_DESTINATION_SELECT = {
  id: true,
  slug: true,
  name: true,
  province: true,
  category: true,
  shortDesc: true,
  description: true,
  bestSeason: true,
  travelNote: true,
  coverImageUrl: true,
  lat: true,
  lng: true,
  status: true,
  sortOrder: true,
  tours: { select: { tourId: true } },
} satisfies Prisma.DestinationSelect;

type DestinationRecord = Prisma.DestinationGetPayload<{
  select: typeof ADMIN_DESTINATION_SELECT;
}>;

function toRow(row: DestinationRecord): AdminDestinationRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    province: row.province,
    category: normalizeDestinationCategory(row.category),
    shortDesc: row.shortDesc,
    description: row.description,
    bestSeason: row.bestSeason,
    travelNote: row.travelNote,
    coverImageUrl: row.coverImageUrl,
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
    status: row.status === "published" ? "published" : "draft",
    sortOrder: row.sortOrder,
    tourIds: row.tours.map((tour) => tour.tourId),
  };
}

function text(value: string | null, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function coordinate(
  value: number | null,
  min: number,
  max: number,
  label: string,
): number | null {
  if (value === null) return null;
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new AppError(
      "INVALID_DESTINATION",
      `${label} phải trong khoảng ${min}–${max}`,
      400,
    );
  }
  return value;
}

function normalize(input: DestinationInput) {
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG.test(slug) || slug.length > 160) {
    throw new AppError(
      "INVALID_DESTINATION",
      "Slug chỉ gồm chữ thường, số và dấu gạch nối",
      400,
    );
  }

  const name = input.name.trim();
  if (name.length < 2 || name.length > 200) {
    throw new AppError("INVALID_DESTINATION", "Tên phải 2–200 ký tự", 400);
  }

  const province = input.province.trim();
  if (province.length < 2 || province.length > 120) {
    throw new AppError("INVALID_DESTINATION", "Tỉnh/thành phải 2–120 ký tự", 400);
  }

  if (!CATEGORY_VALUES.includes(input.category)) {
    throw new AppError("INVALID_DESTINATION", "Nhóm điểm đến không hợp lệ", 400);
  }

  if (!isAdminDestinationStatus(input.status)) {
    throw new AppError("INVALID_DESTINATION", "Trạng thái không hợp lệ", 400);
  }

  const coverImageUrl = input.coverImageUrl?.trim()
    ? input.coverImageUrl.trim()
    : null;
  if (coverImageUrl && !isManagedImageUrl(coverImageUrl)) {
    throw new AppError(
      "INVALID_DESTINATION",
      "Ảnh bìa phải là đường dẫn /images/… hoặc URL Cloudinary",
      400,
    );
  }

  if (
    !Number.isInteger(input.sortOrder) ||
    input.sortOrder < 0 ||
    input.sortOrder > 999
  ) {
    throw new AppError("INVALID_DESTINATION", "Thứ tự phải trong khoảng 0–999", 400);
  }

  const tourIds = Array.from(new Set(input.tourIds));
  if (tourIds.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new AppError("INVALID_DESTINATION", "Tour liên kết không hợp lệ", 400);
  }

  return {
    slug,
    name,
    province,
    category: input.category,
    shortDesc: text(input.shortDesc, 500),
    description: text(input.description, 60_000),
    bestSeason: text(input.bestSeason, 200),
    travelNote: text(input.travelNote, 500),
    coverImageUrl,
    lat: coordinate(input.lat, -90, 90, "Vĩ độ"),
    lng: coordinate(input.lng, -180, 180, "Kinh độ"),
    status: input.status,
    sortOrder: input.sortOrder,
    tourIds,
  };
}

function isUniqueError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isForeignKeyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}

async function assertToursPublished(tourIds: number[]): Promise<void> {
  if (tourIds.length === 0) return;

  const count = await prisma.tour.count({
    where: { id: { in: tourIds }, status: "published" },
  });

  if (count !== tourIds.length) {
    throw new AppError(
      "INVALID_DESTINATION",
      "Tour liên kết không tồn tại hoặc chưa được mở bán",
      400,
    );
  }
}

export async function listAdminDestinations(): Promise<AdminDestinationRow[]> {
  const rows = await prisma.destination.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: ADMIN_DESTINATION_SELECT,
  });

  return rows.map(toRow);
}

export async function getAdminDestination(
  id: number,
): Promise<AdminDestinationRow> {
  const row = await prisma.destination.findUnique({
    where: { id },
    select: ADMIN_DESTINATION_SELECT,
  });

  if (!row) {
    throw new AppError("DESTINATION_NOT_FOUND", "Không tìm thấy điểm đến", 404);
  }

  return toRow(row);
}

export async function listTourOptions(): Promise<TourOption[]> {
  return prisma.tour.findMany({
    where: { status: "published" },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, code: true, name: true, status: true },
  });
}

export async function createDestination(
  input: DestinationInput,
  adminId: number,
): Promise<AdminDestinationRow> {
  const data = normalize(input);

  const existing = await prisma.destination.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (existing) {
    throw new AppError(
      "DESTINATION_SLUG_TAKEN",
      "Slug điểm đến đã tồn tại",
      409,
    );
  }

  await assertToursPublished(data.tourIds);

  try {
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.destination.create({
        data: {
          slug: data.slug,
          name: data.name,
          province: data.province,
          category: data.category,
          shortDesc: data.shortDesc,
          description: data.description,
          bestSeason: data.bestSeason,
          travelNote: data.travelNote,
          coverImageUrl: data.coverImageUrl,
          lat: data.lat,
          lng: data.lng,
          status: data.status,
          sortOrder: data.sortOrder,
          tours: {
            create: data.tourIds.map((tourId) => ({ tourId })),
          },
        },
        select: ADMIN_DESTINATION_SELECT,
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "destination.create",
          entity: "destination",
          entityId: created.id,
          meta: { slug: data.slug, name: data.name, status: data.status },
        },
      });

      return created;
    });

    return toRow(row);
  } catch (error) {
    if (isUniqueError(error)) {
      throw new AppError(
        "DESTINATION_SLUG_TAKEN",
        "Slug điểm đến đã tồn tại",
        409,
      );
    }
    if (isForeignKeyError(error)) {
      throw new AppError("INVALID_DESTINATION", "Tour liên kết không tồn tại", 400);
    }
    throw error;
  }
}

export async function updateDestination(
  id: number,
  input: DestinationInput,
  adminId: number,
): Promise<AdminDestinationRow> {
  const data = normalize(input);

  const existing = await prisma.destination.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!existing) {
    throw new AppError("DESTINATION_NOT_FOUND", "Không tìm thấy điểm đến", 404);
  }

  if (data.slug !== existing.slug) {
    const clash = await prisma.destination.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (clash) {
      throw new AppError(
        "DESTINATION_SLUG_TAKEN",
        "Slug điểm đến đã tồn tại",
        409,
      );
    }
  }

  await assertToursPublished(data.tourIds);

  try {
    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.destination.update({
        where: { id },
        data: {
          slug: data.slug,
          name: data.name,
          province: data.province,
          category: data.category,
          shortDesc: data.shortDesc,
          description: data.description,
          bestSeason: data.bestSeason,
          travelNote: data.travelNote,
          coverImageUrl: data.coverImageUrl,
          lat: data.lat,
          lng: data.lng,
          status: data.status,
          sortOrder: data.sortOrder,
          tours: {
            deleteMany: {},
            create: data.tourIds.map((tourId) => ({ tourId })),
          },
        },
        select: ADMIN_DESTINATION_SELECT,
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "destination.update",
          entity: "destination",
          entityId: id,
          meta: {
            slug: data.slug,
            name: data.name,
            status: data.status,
            tourIds: data.tourIds,
          },
        },
      });

      return updated;
    });

    return toRow(row);
  } catch (error) {
    if (isUniqueError(error)) {
      throw new AppError(
        "DESTINATION_SLUG_TAKEN",
        "Slug điểm đến đã tồn tại",
        409,
      );
    }
    if (isForeignKeyError(error)) {
      throw new AppError("INVALID_DESTINATION", "Tour liên kết không tồn tại", 400);
    }
    throw error;
  }
}

export async function deleteDestination(
  id: number,
  adminId: number,
): Promise<void> {
  const existing = await prisma.destination.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true },
  });
  if (!existing) {
    throw new AppError("DESTINATION_NOT_FOUND", "Không tìm thấy điểm đến", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.destination.delete({ where: { id } });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "destination.delete",
        entity: "destination",
        entityId: id,
        meta: { slug: existing.slug, name: existing.name },
      },
    });
  });
}
