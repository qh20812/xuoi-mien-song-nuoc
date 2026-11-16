"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPage } from "@/lib/auth/session";
import {
  deleteContactMessage,
  isAdminContactStatus,
  setContactMessageStatus,
} from "@/server/contact/admin-messages";
import { isAppError } from "@/server/errors";

const idSchema = z.coerce.number().int().positive();

/** Chỉ cho phép quay lại đúng trang hộp thư (chặn open redirect). */
function safeReturnTo(formData: FormData): string {
  const raw = String(formData.get("returnTo") ?? "");
  return raw.startsWith("/admin/messages") ? raw : "/admin/messages";
}

export async function setContactStatusAction(formData: FormData) {
  const admin = await requireAdminPage("/admin/messages");
  const returnTo = safeReturnTo(formData);

  const id = idSchema.safeParse(formData.get("messageId"));
  const status = formData.get("status");

  if (!id.success) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Lời nhắn không hợp lệ")}`);
  if (!isAdminContactStatus(status)) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Trạng thái không hợp lệ")}`);
  }

  let target: string;
  try {
    await setContactMessageStatus(id.data, status, admin.id);
    target = returnTo;
  } catch (error) {
    const message = isAppError(error) ? error.message : "Không cập nhật được";
    const separator = returnTo.includes("?") ? "&" : "?";
    target = `${returnTo}${separator}error=${encodeURIComponent(message)}`;
  }

  redirect(target);
}

export async function deleteContactMessageAction(formData: FormData) {
  const admin = await requireAdminPage("/admin/messages");
  const returnTo = safeReturnTo(formData);

  const id = idSchema.safeParse(formData.get("messageId"));
  if (!id.success) redirect(returnTo);

  let target: string;
  try {
    await deleteContactMessage(id.data, admin.id);
    target = returnTo;
  } catch (error) {
    const message = isAppError(error) ? error.message : "Không xoá được";
    const separator = returnTo.includes("?") ? "&" : "?";
    target = `${returnTo}${separator}error=${encodeURIComponent(message)}`;
  }

  redirect(target);
}
