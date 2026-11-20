/**
 * Upload ảnh thật lên Cloudinary + ghi bảng `media` (D10.4).
 *
 * Pipeline: validate MIME/size → sharp xoay + resize ≤1920 + WebP q78 → upload
 * → tạo row + audit trong transaction. Nếu DB lỗi sau khi upload thì xoá asset
 * vừa tạo để không để lại ảnh mồ côi.
 */
import sharp from "sharp";
import prisma from "@/lib/prisma";
import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  UPLOAD_MAX_EDGE,
  UPLOAD_WEBP_QUALITY,
} from "@/lib/media/limits";
import { AppError, isAppError } from "@/server/errors";
import {
  cloudinaryStorage,
  type MediaStorage,
} from "@/server/media/cloudinary";

export { MAX_UPLOAD_BYTES };
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

const MAX_INPUT_PIXELS = 40_000_000;
const FOLDER = "xmsn/media";

export type UploadMediaInput = {
  buffer: Buffer;
  mimeType: string;
  size: number;
  title?: string | null;
  alt?: string | null;
  tags?: string[];
  sortOrder?: number;
  isActive?: boolean;
};

export type UploadedMedia = {
  id: number;
  type: "image";
  url: string;
  thumbnailUrl: string | null;
  publicId: string | null;
  title: string | null;
  alt: string | null;
  tags: string[];
  width: number | null;
  height: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

export type UploadMediaDeps = {
  storage?: MediaStorage;
};

function isAllowedMime(mime: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}

function normalizeText(value: string | null | undefined, max: number): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  return [
    ...new Set(
      tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ].slice(0, 20);
}

export async function uploadMedia(
  input: UploadMediaInput,
  adminId: number,
  deps: UploadMediaDeps = {},
): Promise<UploadedMedia> {
  const storage = deps.storage ?? cloudinaryStorage;

  if (!isAllowedMime(input.mimeType)) {
    throw new AppError(
      "MEDIA_INVALID_TYPE",
      "Chỉ nhận ảnh JPEG, PNG, WebP hoặc AVIF",
      400,
    );
  }

  if (!Number.isFinite(input.size) || input.size <= 0) {
    throw new AppError("MEDIA_INVALID_FILE", "Tệp ảnh rỗng hoặc không đọc được", 400);
  }

  if (input.size > MAX_UPLOAD_BYTES) {
    throw new AppError("MEDIA_TOO_LARGE", `Ảnh tối đa ${MAX_UPLOAD_LABEL}`, 400);
  }

  let processed: { data: Buffer; width: number; height: number };
  try {
    const result = await sharp(input.buffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .rotate()
      .resize({
        width: UPLOAD_MAX_EDGE,
        height: UPLOAD_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: UPLOAD_WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });

    processed = {
      data: result.data,
      width: result.info.width,
      height: result.info.height,
    };
  } catch {
    throw new AppError(
      "MEDIA_INVALID_FILE",
      "Không đọc được ảnh (tệp hỏng hoặc không phải ảnh)",
      400,
    );
  }

  let uploaded: { publicId: string; url: string; width: number; height: number } | null =
    null;
  let created = false;

  try {
    uploaded = await storage.upload(processed.data, { folder: FOLDER });
    const thumbnailUrl = storage.thumbnailUrl(uploaded.publicId);

    const row = await prisma.$transaction(async (tx) => {
      const media = await tx.media.create({
        data: {
          type: "image",
          url: uploaded!.url,
          publicId: uploaded!.publicId,
          thumbnailUrl,
          width: processed.width,
          height: processed.height,
          title: normalizeText(input.title, 255),
          alt: normalizeText(input.alt, 255),
          tags: normalizeTags(input.tags),
          sortOrder: Math.max(0, Math.min(9999, Math.trunc(input.sortOrder ?? 0))),
          isActive: input.isActive ?? true,
        },
        select: {
          id: true,
          url: true,
          thumbnailUrl: true,
          publicId: true,
          title: true,
          alt: true,
          tags: true,
          width: true,
          height: true,
          sortOrder: true,
          isActive: true,
          createdAt: true,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "media.upload",
          entity: "media",
          entityId: media.id,
          meta: {
            url: uploaded!.url,
            publicId: uploaded!.publicId,
            width: processed.width,
            height: processed.height,
          },
        },
      });

      return media;
    });
    created = true;

    return {
      id: row.id,
      type: "image",
      url: row.url,
      thumbnailUrl: row.thumbnailUrl,
      publicId: row.publicId,
      title: row.title,
      alt: row.alt,
      tags: normalizeTags(Array.isArray(row.tags) ? (row.tags as string[]) : []),
      width: row.width,
      height: row.height,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
    };
  } catch (error) {
    // DB lỗi sau khi upload ⇒ xoá asset vừa tạo (best-effort), không để row dở.
    if (uploaded && !created) {
      await storage.destroy(uploaded.publicId).catch(() => undefined);
    }

    if (isAppError(error)) throw error;
    throw new AppError(
      "MEDIA_UPLOAD_FAILED",
      "Tải ảnh lên Cloudinary thất bại, vui lòng thử lại",
      502,
    );
  }
}
