"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCapabilityAction } from "@/lib/auth/session";
import {
  createDeparture,
  deleteDeparture,
  isAdminDepartureStatus,
  setDepartureStatus,
  updateDeparture,
  type DepartureInput,
} from "@/server/catalog/admin-departures";
import { isAppError } from "@/server/errors";

const slugSchema = z.string().trim().min(1).max(160);
const idSchema = z.coerce.number().int().positive();

const optionalDate = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ")
    .nullable(),
);

const optionalMoney = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : Number(value)),
  z
    .number()
    .int("Giá phải là số nguyên")
    .min(0, "Giá không được âm")
    .max(1_000_000_000, "Giá quá lớn")
    .nullable(),
);

const departureSchema = z.object({
  departureDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày khởi hành không hợp lệ"),
  returnDate: optionalDate,
  capacityTotal: z.coerce
    .number()
    .int("Số chỗ phải là số nguyên")
    .min(1, "Số chỗ tối thiểu là 1")
    .max(200, "Số chỗ tối đa là 200"),
  priceAdult: optionalMoney,
  priceChild: optionalMoney,
  holidaySurcharge: z.coerce
    .number()
    .int("Phụ thu phải là số nguyên")
    .min(0, "Phụ thu không được âm")
    .max(1_000_000_000, "Phụ thu quá lớn"),
  meetingPoint: z.string().trim().max(255, "Điểm đón quá dài").optional(),
  note: z.string().trim().max(500, "Ghi chú quá dài").optional(),
});

function toInput(data: z.infer<typeof departureSchema>): DepartureInput {
  return {
    departureDate: data.departureDate,
    returnDate: data.returnDate,
    capacityTotal: data.capacityTotal,
    priceAdult: data.priceAdult,
    priceChild: data.priceChild,
    holidaySurcharge: data.holidaySurcharge,
    meetingPoint: data.meetingPoint?.trim() ? data.meetingPoint.trim() : null,
    note: data.note?.trim() ? data.note.trim() : null,
  };
}

function departuresPath(slug: string, query: Record<string, string>): string {
  const qs = new URLSearchParams(query).toString();
  return `/admin/tours/${encodeURIComponent(slug)}/departures${qs ? `?${qs}` : ""}`;
}

function errorMessage(error: unknown): string {
  if (isAppError(error)) return error.message;
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
  }
  return "Không lưu được, vui lòng thử lại";
}

export async function createDepartureAction(formData: FormData) {
  const admin = await requireCapabilityAction("catalog:write", "/admin/tours");

  const slug = slugSchema.safeParse(formData.get("tourSlug"));
  if (!slug.success) redirect("/admin/tours");

  let target: string;
  try {
    const input = toInput(departureSchema.parse(Object.fromEntries(formData)));
    await createDeparture(slug.data, input, admin.id);
    target = departuresPath(slug.data, { ok: "created" });
  } catch (error) {
    target = departuresPath(slug.data, { error: errorMessage(error) });
  }

  redirect(target);
}

export async function updateDepartureAction(formData: FormData) {
  const admin = await requireCapabilityAction("catalog:write", "/admin/tours");

  const slug = slugSchema.safeParse(formData.get("tourSlug"));
  const id = idSchema.safeParse(formData.get("departureId"));
  if (!slug.success) redirect("/admin/tours");
  if (!id.success) redirect(departuresPath(slug.data, { error: "Chuyến không hợp lệ" }));

  let target: string;
  try {
    const input = toInput(departureSchema.parse(Object.fromEntries(formData)));
    await updateDeparture(id.data, input, admin.id);
    target = departuresPath(slug.data, { ok: "updated" });
  } catch (error) {
    target = departuresPath(slug.data, { error: errorMessage(error) });
  }

  redirect(target);
}

export async function setDepartureStatusAction(formData: FormData) {
  const admin = await requireCapabilityAction("catalog:write", "/admin/tours");

  const slug = slugSchema.safeParse(formData.get("tourSlug"));
  const id = idSchema.safeParse(formData.get("departureId"));
  const status = formData.get("status");
  if (!slug.success) redirect("/admin/tours");
  if (!id.success) redirect(departuresPath(slug.data, { error: "Chuyến không hợp lệ" }));
  if (!isAdminDepartureStatus(status)) {
    redirect(departuresPath(slug.data, { error: "Trạng thái không hợp lệ" }));
  }

  let target: string;
  try {
    await setDepartureStatus(id.data, status, admin.id);
    target = departuresPath(slug.data, { ok: "status" });
  } catch (error) {
    target = departuresPath(slug.data, { error: errorMessage(error) });
  }

  redirect(target);
}

export async function deleteDepartureAction(formData: FormData) {
  const admin = await requireCapabilityAction("catalog:write", "/admin/tours");

  const slug = slugSchema.safeParse(formData.get("tourSlug"));
  const id = idSchema.safeParse(formData.get("departureId"));
  if (!slug.success) redirect("/admin/tours");
  if (!id.success) redirect(departuresPath(slug.data, { error: "Chuyến không hợp lệ" }));

  let target: string;
  try {
    await deleteDeparture(id.data, admin.id);
    target = departuresPath(slug.data, { ok: "deleted" });
  } catch (error) {
    target = departuresPath(slug.data, { error: errorMessage(error) });
  }

  redirect(target);
}
