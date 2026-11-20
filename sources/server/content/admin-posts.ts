/**
 * CRUD bài viết cho admin (D9.3).
 *
 * Slug bất biến sau khi tạo. Mọi mutation ghi audit trong cùng transaction.
 */
import { Prisma, type PostStatus } from "@prisma/client";
import type { PostTopic } from "@/lib/contracts/post";
import {
  POST_TOPIC_VALUES,
  normalizePostTopic,
  toStringArray,
} from "@/lib/content/mappers";
import prisma from "@/lib/prisma";
import { isManagedImageUrl } from "@/lib/media/image-url";
import { AppError } from "@/server/errors";

export const ADMIN_POST_STATUSES = ["draft", "published"] as const satisfies
  readonly PostStatus[];

export type AdminPostStatus = (typeof ADMIN_POST_STATUSES)[number];

export function isAdminPostStatus(value: unknown): value is AdminPostStatus {
  return (
    typeof value === "string" &&
    (ADMIN_POST_STATUSES as readonly string[]).includes(value)
  );
}

export const POST_STATUS_LABEL: Record<AdminPostStatus, string> = {
  draft: "Nháp",
  published: "Đã đăng",
};

export type AdminPostRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  coverImageUrl: string | null;
  tags: string[];
  topic: PostTopic;
  relatedTourCodes: string[];
  checklist: string[];
  status: AdminPostStatus;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isFeatured: boolean;
  createdAt: string;
};

export type PostInput = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  coverImageUrl: string | null;
  tags: string[];
  topic: PostTopic;
  relatedTourCodes: string[];
  checklist: string[];
  status: AdminPostStatus;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isFeatured: boolean;
};

export type PostTourCode = {
  code: string;
  name: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ADMIN_POST_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  coverImageUrl: true,
  tags: true,
  topic: true,
  relatedTourCodes: true,
  checklist: true,
  status: true,
  publishedAt: true,
  seoTitle: true,
  seoDescription: true,
  isFeatured: true,
  createdAt: true,
} satisfies Prisma.PostSelect;

type PostRecord = Prisma.PostGetPayload<{ select: typeof ADMIN_POST_SELECT }>;

function toRow(row: PostRecord): AdminPostRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.coverImageUrl,
    tags: toStringArray(row.tags),
    topic: normalizePostTopic(row.topic),
    relatedTourCodes: toStringArray(row.relatedTourCodes),
    checklist: toStringArray(row.checklist),
    status: row.status === "published" ? "published" : "draft",
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    isFeatured: row.isFeatured,
    createdAt: row.createdAt.toISOString(),
  };
}

function text(value: string | null, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function list(
  values: string[],
  maxItems: number,
  maxLength: number,
  uppercase = false,
): string[] {
  const result: string[] = [];

  for (const value of values) {
    const item = value.trim();
    if (!item) continue;
    const normalized = uppercase ? item.toUpperCase() : item;
    if (normalized.length > maxLength) {
      throw new AppError(
        "INVALID_POST",
        `Mỗi mục tối đa ${maxLength} ký tự`,
        400,
      );
    }
    if (!result.includes(normalized)) result.push(normalized);
    if (result.length >= maxItems) break;
  }

  return result;
}

function parsePublishedAt(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError("INVALID_POST", "Ngày đăng không hợp lệ", 400);
  }
  return date;
}

function normalize(input: PostInput) {
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG.test(slug) || slug.length > 200) {
    throw new AppError(
      "INVALID_POST",
      "Slug chỉ gồm chữ thường, số và dấu gạch nối",
      400,
    );
  }

  const title = input.title.trim();
  if (title.length < 2 || title.length > 255) {
    throw new AppError("INVALID_POST", "Tiêu đề phải 2–255 ký tự", 400);
  }

  if (!isAdminPostStatus(input.status)) {
    throw new AppError("INVALID_POST", "Trạng thái không hợp lệ", 400);
  }

  if (!(POST_TOPIC_VALUES as readonly string[]).includes(input.topic)) {
    throw new AppError("INVALID_POST", "Chủ đề không hợp lệ", 400);
  }

  const coverImageUrl = input.coverImageUrl?.trim()
    ? input.coverImageUrl.trim()
    : null;
  if (coverImageUrl && !isManagedImageUrl(coverImageUrl)) {
    throw new AppError(
      "INVALID_POST",
      "Ảnh bìa phải là đường dẫn /images/… hoặc URL Cloudinary",
      400,
    );
  }

  const publishedAt =
    parsePublishedAt(input.publishedAt) ??
    (input.status === "published" ? new Date() : null);

  return {
    slug,
    title,
    excerpt: text(input.excerpt, 500),
    content: text(input.content, 60_000),
    coverImageUrl,
    tags: list(input.tags, 20, 40),
    topic: input.topic,
    relatedTourCodes: list(input.relatedTourCodes, 20, 24, true),
    checklist: list(input.checklist, 50, 200),
    status: input.status,
    publishedAt,
    seoTitle: text(input.seoTitle, 200),
    seoDescription: text(input.seoDescription, 320),
    isFeatured: input.isFeatured,
  };
}

function isUniqueError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function listAdminPosts(): Promise<AdminPostRow[]> {
  const rows = await prisma.post.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: ADMIN_POST_SELECT,
  });

  return rows.map(toRow);
}

export async function getAdminPost(id: number): Promise<AdminPostRow> {
  const row = await prisma.post.findUnique({
    where: { id },
    select: ADMIN_POST_SELECT,
  });

  if (!row) {
    throw new AppError("POST_NOT_FOUND", "Không tìm thấy bài viết", 404);
  }

  return toRow(row);
}

export async function listPostTourCodes(): Promise<PostTourCode[]> {
  return prisma.tour.findMany({
    where: { status: "published" },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { code: true, name: true },
  });
}

export async function createPost(
  input: PostInput,
  adminId: number,
): Promise<AdminPostRow> {
  const data = normalize(input);

  const existing = await prisma.post.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (existing) {
    throw new AppError("POST_SLUG_TAKEN", "Slug bài viết đã tồn tại", 409);
  }

  try {
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          coverImageUrl: data.coverImageUrl,
          category: "kinh-nghiem",
          tags: data.tags,
          topic: data.topic,
          relatedTourCodes: data.relatedTourCodes,
          checklist: data.checklist,
          status: data.status,
          publishedAt: data.publishedAt,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          isFeatured: data.isFeatured,
          authorId: adminId,
        },
        select: ADMIN_POST_SELECT,
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "post.create",
          entity: "post",
          entityId: created.id,
          meta: { slug: data.slug, title: data.title, status: data.status },
        },
      });

      return created;
    });

    return toRow(row);
  } catch (error) {
    if (isUniqueError(error)) {
      throw new AppError("POST_SLUG_TAKEN", "Slug bài viết đã tồn tại", 409);
    }
    throw error;
  }
}

export async function updatePost(
  id: number,
  input: PostInput,
  adminId: number,
): Promise<AdminPostRow> {
  const data = normalize(input);

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!existing) {
    throw new AppError("POST_NOT_FOUND", "Không tìm thấy bài viết", 404);
  }

  if (data.slug !== existing.slug) {
    const clash = await prisma.post.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (clash) {
      throw new AppError("POST_SLUG_TAKEN", "Slug bài viết đã tồn tại", 409);
    }
  }

  try {
    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.post.update({
        where: { id },
        data: {
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          coverImageUrl: data.coverImageUrl,
          category: "kinh-nghiem",
          tags: data.tags,
          topic: data.topic,
          relatedTourCodes: data.relatedTourCodes,
          checklist: data.checklist,
          status: data.status,
          publishedAt: data.publishedAt,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          isFeatured: data.isFeatured,
        },
        select: ADMIN_POST_SELECT,
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "post.update",
          entity: "post",
          entityId: id,
          meta: { slug: data.slug, title: data.title, status: data.status },
        },
      });

      return updated;
    });

    return toRow(row);
  } catch (error) {
    if (isUniqueError(error)) {
      throw new AppError("POST_SLUG_TAKEN", "Slug bài viết đã tồn tại", 409);
    }
    throw error;
  }
}

export async function deletePost(
  id: number,
  adminId: number,
): Promise<void> {
  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true, slug: true, title: true },
  });
  if (!existing) {
    throw new AppError("POST_NOT_FOUND", "Không tìm thấy bài viết", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.post.delete({ where: { id } });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "post.delete",
        entity: "post",
        entityId: id,
        meta: { slug: existing.slug, title: existing.title },
      },
    });
  });
}
