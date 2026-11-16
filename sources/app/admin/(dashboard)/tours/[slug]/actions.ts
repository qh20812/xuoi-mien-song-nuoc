"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPage } from "@/lib/auth/session";
import {
  isAdminTourStatus,
  setTourStatus,
  updateAdminTour,
  type TourContentInput,
} from "@/server/catalog/admin-tours";
import { isAppError } from "@/server/errors";

const money = (label: string) =>
  z.coerce
    .number()
    .int(`${label} phải là số nguyên`)
    .min(0, `${label} không được âm`)
    .max(1_000_000_000, `${label} quá lớn`);

const tourSchema = z.object({
  name: z.string().trim().min(2, "Tên tour phải ít nhất 2 ký tự").max(200, "Tên tour quá dài"),
  tagline: z.string().trim().max(255, "Tagline quá dài").optional(),
  summary: z.string().trim().max(2000, "Tóm tắt quá dài").optional(),
  description: z.string().trim().max(60_000, "Mô tả quá dài").optional(),
  durationDays: z.coerce.number().int().min(1, "Số ngày tối thiểu 1").max(30, "Số ngày tối đa 30"),
  durationNights: z.coerce.number().int().min(0).max(29, "Số đêm tối đa 29"),
  basePriceAdult: money("Giá người lớn"),
  basePriceChild: money("Giá trẻ em"),
  childAgeNote: z.string().trim().max(255).optional(),
  cancellationPolicy: z.string().trim().max(5000).optional(),
  packingNotes: z.string().trim().max(5000).optional(),
  coverImageUrl: z.string().trim().max(500).optional(),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

function nullable(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function message(error: unknown): string {
  if (isAppError(error)) return error.message;
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
  return "Không lưu được, vui lòng thử lại";
}

function path(slug: string, query?: Record<string, string>): string {
  const qs = new URLSearchParams(query ?? {}).toString();
  return `/admin/tours/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`;
}

export async function updateTourContentAction(formData: FormData) {
  const admin = await requireAdminPage("/admin/tours");
  const slug = String(formData.get("slug") ?? "");
  if (!slug) redirect("/admin/tours");

  let target: string;
  try {
    const parsed = tourSchema.parse(Object.fromEntries(formData));

    const input: TourContentInput = {
      name: parsed.name,
      tagline: nullable(parsed.tagline),
      summary: nullable(parsed.summary),
      description: nullable(parsed.description),
      durationDays: parsed.durationDays,
      durationNights: parsed.durationNights,
      basePriceAdult: parsed.basePriceAdult,
      basePriceChild: parsed.basePriceChild,
      childAgeNote: nullable(parsed.childAgeNote),
      cancellationPolicy: nullable(parsed.cancellationPolicy),
      packingNotes: nullable(parsed.packingNotes),
      coverImageUrl: nullable(parsed.coverImageUrl),
      seoTitle: nullable(parsed.seoTitle),
      seoDescription: nullable(parsed.seoDescription),
      isFeatured: formData.get("isFeatured") === "on",
      sortOrder: parsed.sortOrder,
    };

    await updateAdminTour(slug, input, admin.id);
    target = path(slug, { ok: "saved" });
  } catch (error) {
    target = path(slug, { error: message(error) });
  }

  redirect(target);
}

export async function setTourStatusAction(formData: FormData) {
  const admin = await requireAdminPage("/admin/tours");
  const slug = String(formData.get("slug") ?? "");
  const status = formData.get("status");
  if (!slug) redirect("/admin/tours");
  if (!isAdminTourStatus(status)) redirect(path(slug, { error: "Trạng thái không hợp lệ" }));

  let target: string;
  try {
    await setTourStatus(slug, status, admin.id);
    target = path(slug, { ok: "status" });
  } catch (error) {
    target = path(slug, { error: message(error) });
  }

  redirect(target);
}
