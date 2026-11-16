"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPage } from "@/lib/auth/session";
import {
  createMedia,
  deleteMedia,
  isMediaType,
  updateMedia,
  type MediaInput,
} from "@/server/media/admin-media";
import { AppError, isAppError } from "@/server/errors";

const idSchema = z.coerce.number().int().positive();

const mediaSchema = z.object({
  type: z.string(),
  url: z.string().trim().min(1, "Thiếu đường dẫn").max(1000, "Đường dẫn quá dài"),
  title: z.string().trim().max(255, "Tiêu đề quá dài").optional(),
  alt: z.string().trim().max(255, "Alt quá dài").optional(),
  tags: z.string().trim().max(500, "Tags quá dài").optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

function message(error: unknown): string {
  if (isAppError(error)) return error.message;
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
  return "Không lưu được, vui lòng thử lại";
}

function toInput(data: z.infer<typeof mediaSchema>, isActive: boolean): MediaInput {
  if (!isMediaType(data.type)) {
    throw new AppError("MEDIA_INVALID_TYPE", "Loại media không hợp lệ", 400);
  }

  return {
    type: data.type,
    url: data.url,
    title: data.title?.trim() ? data.title.trim() : null,
    alt: data.alt?.trim() ? data.alt.trim() : null,
    tags: (data.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    sortOrder: data.sortOrder,
    isActive,
  };
}

export async function createMediaAction(formData: FormData) {
  const admin = await requireAdminPage("/admin/media");

  let target: string;
  try {
    const parsed = mediaSchema.parse(Object.fromEntries(formData));
    await createMedia(toInput(parsed, formData.get("isActive") === "on"), admin.id);
    target = "/admin/media?ok=created";
  } catch (error) {
    target = `/admin/media?error=${encodeURIComponent(message(error))}`;
  }

  redirect(target);
}

export async function updateMediaAction(formData: FormData) {
  const admin = await requireAdminPage("/admin/media");

  let target: string;
  try {
    const id = idSchema.parse(formData.get("mediaId"));
    const parsed = mediaSchema.parse(Object.fromEntries(formData));
    await updateMedia(id, toInput(parsed, formData.get("isActive") === "on"), admin.id);
    target = "/admin/media?ok=updated";
  } catch (error) {
    target = `/admin/media?error=${encodeURIComponent(message(error))}`;
  }

  redirect(target);
}

export async function deleteMediaAction(formData: FormData) {
  const admin = await requireAdminPage("/admin/media");

  let target: string;
  try {
    const id = idSchema.parse(formData.get("mediaId"));
    await deleteMedia(id, admin.id);
    target = "/admin/media?ok=deleted";
  } catch (error) {
    target = `/admin/media?error=${encodeURIComponent(message(error))}`;
  }

  redirect(target);
}
