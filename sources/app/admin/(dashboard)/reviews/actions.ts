"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPage } from "@/lib/auth/session";
import { isAppError } from "@/server/errors";
import {
  deleteReview,
  isAdminReviewStatus,
  setReviewFeatured,
  setReviewReply,
  setReviewStatus,
} from "@/server/reviews/admin-reviews";

const idSchema = z.coerce.number().int().positive();

function message(error: unknown): string {
  if (isAppError(error)) return error.message;
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
  return "Không lưu được, vui lòng thử lại";
}

function back(ok?: string, error?: unknown): string {
  return error !== undefined
    ? `/admin/reviews?error=${encodeURIComponent(message(error))}`
    : ok
      ? `/admin/reviews?ok=${ok}`
      : "/admin/reviews";
}

export async function setReviewStatusAction(formData: FormData) {
  const admin = await requireAdminPage("/admin/reviews");
  const status = formData.get("status");

  let target: string;
  try {
    const id = idSchema.parse(formData.get("reviewId"));
    if (!isAdminReviewStatus(status)) {
      throw new Error("Trạng thái không hợp lệ");
    }
    await setReviewStatus(id, status, admin.id);
    target = back("status");
  } catch (error) {
    target = back(undefined, error);
  }

  redirect(target);
}

export async function toggleReviewFeaturedAction(formData: FormData) {
  const admin = await requireAdminPage("/admin/reviews");

  let target: string;
  try {
    const id = idSchema.parse(formData.get("reviewId"));
    const isFeatured = formData.get("isFeatured") === "true";
    await setReviewFeatured(id, isFeatured, admin.id);
    target = back("featured");
  } catch (error) {
    target = back(undefined, error);
  }

  redirect(target);
}

export async function setReviewReplyAction(formData: FormData) {
  const admin = await requireAdminPage("/admin/reviews");

  let target: string;
  try {
    const id = idSchema.parse(formData.get("reviewId"));
    const reply = String(formData.get("adminReply") ?? "");
    await setReviewReply(id, reply, admin.id);
    target = back("reply");
  } catch (error) {
    target = back(undefined, error);
  }

  redirect(target);
}

export async function deleteReviewAction(formData: FormData) {
  const admin = await requireAdminPage("/admin/reviews");

  let target: string;
  try {
    const id = idSchema.parse(formData.get("reviewId"));
    await deleteReview(id, admin.id);
    target = back("deleted");
  } catch (error) {
    target = back(undefined, error);
  }

  redirect(target);
}
