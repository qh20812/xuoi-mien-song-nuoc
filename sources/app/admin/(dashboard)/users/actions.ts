"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCapabilityAction } from "@/lib/auth/session";
import {
  createAdminUser,
  deleteAdminUser,
  isAdminRole,
  resetAdminPassword,
  updateAdminUser,
} from "@/server/auth/admin-users";
import { isAppError } from "@/server/errors";

const idSchema = z.coerce.number().int().positive();
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "Email không hợp lệ")
  .max(160, "Email quá dài")
  .email("Email không hợp lệ");
const nameSchema = z
  .string()
  .trim()
  .min(2, "Tên phải có ít nhất 2 ký tự")
  .max(120, "Tên quá dài");
const passwordSchema = z
  .string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .max(200, "Mật khẩu quá dài");

function message(error: unknown): string {
  if (isAppError(error)) return error.message;
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
  return "Không lưu được, vui lòng thử lại";
}

function back(ok?: string, error?: unknown): string {
  if (error !== undefined) {
    return `/admin/users?error=${encodeURIComponent(message(error))}`;
  }
  return ok ? `/admin/users?ok=${ok}` : "/admin/users";
}

/** Mọi action dưới đây chỉ dành cho người có quyền quản lý tài khoản. */
async function requireOwner() {
  return requireCapabilityAction("users:manage", "/admin/users");
}

export async function createAdminUserAction(formData: FormData) {
  const actor = await requireOwner();

  let target: string;
  try {
    const email = emailSchema.parse(formData.get("email"));
    const name = nameSchema.parse(formData.get("name"));
    const password = passwordSchema.parse(formData.get("password"));
    const role = formData.get("role");
    if (!isAdminRole(role)) throw new Error("Vai trò không hợp lệ");

    await createAdminUser({ email, name, password, role }, actor.id);
    target = back("created");
  } catch (error) {
    target = back(undefined, error);
  }

  redirect(target);
}

export async function updateAdminUserAction(formData: FormData) {
  const actor = await requireOwner();

  let target: string;
  try {
    const id = idSchema.parse(formData.get("userId"));
    const name = nameSchema.parse(formData.get("name"));
    const role = formData.get("role");
    if (!isAdminRole(role)) throw new Error("Vai trò không hợp lệ");
    const isActive = formData.get("isActive") === "on";

    await updateAdminUser(id, { name, role, isActive }, actor.id);
    target = back("updated");
  } catch (error) {
    target = back(undefined, error);
  }

  redirect(target);
}

export async function resetAdminPasswordAction(formData: FormData) {
  const actor = await requireOwner();

  let target: string;
  try {
    const id = idSchema.parse(formData.get("userId"));
    const password = passwordSchema.parse(formData.get("password"));

    await resetAdminPassword(id, password, actor.id);
    target = back("password");
  } catch (error) {
    target = back(undefined, error);
  }

  redirect(target);
}

export async function deleteAdminUserAction(formData: FormData) {
  const actor = await requireOwner();

  let target: string;
  try {
    const id = idSchema.parse(formData.get("userId"));
    await deleteAdminUser(id, actor.id);
    target = back("deleted");
  } catch (error) {
    target = back(undefined, error);
  }

  redirect(target);
}
