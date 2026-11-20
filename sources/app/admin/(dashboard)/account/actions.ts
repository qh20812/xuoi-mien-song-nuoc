"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPage } from "@/lib/auth/session";
import { ADMIN_COOKIE } from "@/lib/auth/token";
import { changeOwnPassword } from "@/server/auth/admin-users";
import { isAppError } from "@/server/errors";

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu hiện tại")
      .max(200, "Mật khẩu quá dài"),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
      .max(200, "Mật khẩu quá dài"),
    confirmPassword: z
      .string()
      .min(1, "Vui lòng xác nhận mật khẩu mới")
      .max(200, "Mật khẩu quá dài"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

export type ChangePasswordState = { error?: string };

function message(error: unknown): string {
  if (isAppError(error)) return error.message;
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
  return "Không đổi được mật khẩu, vui lòng thử lại";
}

/**
 * Tự đổi mật khẩu: mọi vai trò đều dùng được, nên chỉ cần phiên hợp lệ.
 *
 * Sau khi lưu, xoá cookie và đưa về trang đăng nhập kèm cờ `ok=password`.
 * `tokenVersion` đã tăng trong service nên kể cả cookie cũ còn sót cũng bị
 * `getAdminSession()` từ chối.
 */
export async function changePasswordAction(
  _previous: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const admin = await requireAdminPage("/admin/account");

  try {
    const parsed = changePasswordSchema.parse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });

    await changeOwnPassword(admin.id, {
      currentPassword: parsed.currentPassword,
      newPassword: parsed.newPassword,
    });
  } catch (error) {
    return { error: message(error) };
  }

  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login?ok=password");
}
