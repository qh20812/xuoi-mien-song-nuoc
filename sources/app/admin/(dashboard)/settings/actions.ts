"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPage } from "@/lib/auth/session";
import { isAppError } from "@/server/errors";
import { updateBookingSettings } from "@/server/settings/update-booking-settings";

const numberField = (label: string, min: number, max: number) =>
  z.coerce
    .number()
    .int(`${label} phải là số nguyên`)
    .min(min, `${label} tối thiểu ${min}`)
    .max(max, `${label} tối đa ${max}`);

const settingsSchema = z.object({
  minDaysAhead: numberField("Số ngày đặt trước", 0, 60),
  maxGuestsPerOrder: numberField("Số khách mỗi đơn", 1, 50),
  holdHours: numberField("Số giờ giữ chỗ", 1, 168),
  cancelCutoffDays: numberField("Số ngày chặn huỷ", 0, 30),
});

export async function saveBookingSettingsAction(formData: FormData) {
  const admin = await requireAdminPage("/admin/settings");

  let target: string;
  try {
    const parsed = settingsSchema.parse(Object.fromEntries(formData));
    await updateBookingSettings(parsed, admin.id);
    target = "/admin/settings?ok=1";
  } catch (error) {
    const message = isAppError(error)
      ? error.message
      : error instanceof z.ZodError
        ? (error.issues[0]?.message ?? "Dữ liệu không hợp lệ")
        : "Không lưu được, vui lòng thử lại";
    target = `/admin/settings?error=${encodeURIComponent(message)}`;
  }

  redirect(target);
}
