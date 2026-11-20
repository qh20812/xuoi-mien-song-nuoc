/**
 * Thư viện ảnh/media cho admin (P4 + D10.4).
 *
 * Ảnh `type = image` chỉ nhận `/images/...` hoặc Cloudinary (xem
 * `lib/media/image-url.ts`). Media `type = youtube` vẫn nhận URL https.
 * Row có `publicId` là asset do hệ thống tải lên Cloudinary.
 */
import type { MediaType, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isManagedImageUrl } from "@/lib/media/image-url";
import { AppError, isAppError } from "@/server/errors";
import { cloudinaryStorage, type MediaStorage } from "@/server/media/cloudinary";

export const MEDIA_TYPES = ["image", "youtube"] as const;

export type MediaTypeValue = (typeof MEDIA_TYPES)[number];

export function isMediaType(value: unknown): value is MediaTypeValue {
  return typeof value === "string" && (MEDIA_TYPES as readonly string[]).includes(value);
}

export const MEDIA_TYPE_LABEL: Record<MediaTypeValue, string> = {
  image: "Ảnh",
  youtube: "Video YouTube",
};

const HTTP_URL = /^https?:\/\/\S+$/i;

export type AdminMediaRow = {
  id: number;
  type: MediaTypeValue;
  url: string;
  publicId: string | null;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  title: string | null;
  alt: string | null;
  tags: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

export type MediaInput = {
  type: MediaTypeValue;
  url: string;
  title: string | null;
  alt: string | null;
  tags: string[];
  sortOrder: number;
  isActive: boolean;
};

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function toRow(row: {
  id: number;
  type: MediaType;
  url: string;
  publicId: string | null;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  title: string | null;
  alt: string | null;
  tags: Prisma.JsonValue;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}): AdminMediaRow {
  return {
    id: row.id,
    type: row.type,
    url: row.url,
    publicId: row.publicId,
    thumbnailUrl: row.thumbnailUrl,
    width: row.width,
    height: row.height,
    title: row.title,
    alt: row.alt,
    tags: normalizeTags(row.tags),
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

function validateUrl(type: MediaTypeValue, url: string): string {
  const trimmed = url.trim();

  if (type === "image") {
    if (!isManagedImageUrl(trimmed)) {
      throw new AppError(
        "MEDIA_INVALID_URL",
        "Ảnh phải là đường dẫn /images/… hoặc URL Cloudinary",
        400,
      );
    }
    return trimmed;
  }

  if (!HTTP_URL.test(trimmed)) {
    throw new AppError("MEDIA_INVALID_URL", "Link video phải bắt đầu bằng http(s)", 400);
  }
  return trimmed;
}

export async function listAdminMedia(input: { type?: MediaTypeValue } = {}) {
  const rows = await prisma.media.findMany({
    where: input.type ? { type: input.type } : {},
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  return rows.map(toRow);
}

export async function createMedia(
  input: MediaInput,
  adminId: number,
): Promise<AdminMediaRow> {
  const url = validateUrl(input.type, input.url);

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.media.create({
      data: {
        type: input.type,
        url,
        title: input.title?.trim() ? input.title.trim().slice(0, 255) : null,
        alt: input.alt?.trim() ? input.alt.trim().slice(0, 255) : null,
        tags: input.tags,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "media.create",
        entity: "media",
        entityId: row.id,
        meta: { url, type: input.type },
      },
    });

    return row;
  });

  return toRow(created);
}

export async function updateMedia(
  id: number,
  input: MediaInput,
  adminId: number,
): Promise<AdminMediaRow> {
  const url = validateUrl(input.type, input.url);

  const existing = await prisma.media.findUnique({
    where: { id },
    select: { id: true, url: true, type: true, publicId: true },
  });
  if (!existing) {
    throw new AppError("MEDIA_NOT_FOUND", "Không tìm thấy media", 404);
  }

  if (existing.publicId && (existing.url !== url || existing.type !== input.type)) {
    throw new AppError(
      "MEDIA_MANAGED_URL",
      "Ảnh tải lên Cloudinary không sửa được URL/loại — hãy xoá và tải lại",
      409,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.media.update({
      where: { id },
      data: {
        type: input.type,
        url,
        title: input.title?.trim() ? input.title.trim().slice(0, 255) : null,
        alt: input.alt?.trim() ? input.alt.trim().slice(0, 255) : null,
        tags: input.tags,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "media.update",
        entity: "media",
        entityId: id,
        meta: { url },
      },
    });

    return row;
  });

  return toRow(updated);
}

export async function deleteMedia(
  id: number,
  adminId: number,
  deps: { storage?: MediaStorage } = {},
): Promise<void> {
  const existing = await prisma.media.findUnique({
    where: { id },
    select: { id: true, url: true, publicId: true },
  });
  if (!existing) {
    throw new AppError("MEDIA_NOT_FOUND", "Không tìm thấy media", 404);
  }

  const [tours, destinations, posts, cuisines] = await Promise.all([
    prisma.tour.count({ where: { coverImageUrl: existing.url } }),
    prisma.destination.count({ where: { coverImageUrl: existing.url } }),
    prisma.post.count({ where: { coverImageUrl: existing.url } }),
    prisma.cuisine.count({ where: { imageUrl: existing.url } }),
  ]);

  if (tours + destinations + posts + cuisines > 0) {
    throw new AppError(
      "MEDIA_IN_USE",
      "Ảnh đang được dùng làm ảnh bìa nội dung nên không xoá được",
      409,
      { tours, destinations, posts, cuisines },
    );
  }

  if (existing.publicId) {
    const storage = deps.storage ?? cloudinaryStorage;
    try {
      await storage.destroy(existing.publicId);
    } catch (error) {
      if (isAppError(error)) throw error;
      throw new AppError(
        "MEDIA_DELETE_FAILED",
        "Không xoá được ảnh trên Cloudinary, vui lòng thử lại",
        502,
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.media.delete({ where: { id } });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "media.delete",
        entity: "media",
        entityId: id,
        meta: { url: existing.url, publicId: existing.publicId },
      },
    });
  });
}

/** Danh sách đường dẫn ảnh đang có trong thư viện — dùng cho datalist chọn ảnh bìa. */
export async function listMediaImageUrls(): Promise<string[]> {
  const rows = await prisma.media.findMany({
    where: { type: "image", isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { url: true },
  });

  return [...new Set(rows.map((row) => row.url))];
}
