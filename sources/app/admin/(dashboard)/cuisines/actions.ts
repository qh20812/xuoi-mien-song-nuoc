"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCapabilityAction } from "@/lib/auth/session";
import { CONTENT_CACHE_TAGS } from "@/lib/content/cache-tags";
import {
  createCuisine,
  deleteCuisine,
  updateCuisine,
  type CuisineInput,
} from "@/server/content/admin-cuisines";
import { isAppError } from "@/server/errors";

const nullableText = (max: number) =>
  z.preprocess(
    (value) =>
      value === null || (typeof value === "string" && value.trim() === "")
        ? null
        : value,
    z.string().trim().max(max).nullable(),
  );

const cuisineSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Vui lòng nhập slug")
    .max(160, "Slug quá dài")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch nối"),
  name: z.string().trim().min(2, "Tên phải ít nhất 2 ký tự").max(200, "Tên quá dài"),
  description: nullableText(60_000),
  whereToEat: nullableText(500),
  province: nullableText(120),
  imageUrl: nullableText(500),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

const idSchema = z.coerce.number().int().positive();

function tourIds(formData: FormData): number[] {
  return formData
    .getAll("tourIds")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function toInput(
  data: z.infer<typeof cuisineSchema>,
  selectedTourIds: number[],
): CuisineInput {
  return {
    slug: data.slug,
    name: data.name,
    description: data.description,
    whereToEat: data.whereToEat,
    province: data.province,
    imageUrl: data.imageUrl,
    sortOrder: data.sortOrder,
    tourIds: selectedTourIds,
  };
}

function message(error: unknown): string {
  if (isAppError(error)) return error.message;
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
  }
  return "Không lưu được, vui lòng thử lại";
}

function listPath(query: Record<string, string> = {}): string {
  const qs = new URLSearchParams(query).toString();
  return `/admin/cuisines${qs ? `?${qs}` : ""}`;
}

function editPath(id: number, query: Record<string, string> = {}): string {
  const qs = new URLSearchParams(query).toString();
  return `/admin/cuisines/${id}${qs ? `?${qs}` : ""}`;
}

export async function createCuisineAction(formData: FormData) {
  const admin = await requireCapabilityAction("content:write", "/admin/cuisines");

  let target: string;
  try {
    const parsed = cuisineSchema.parse(Object.fromEntries(formData));
    await createCuisine(toInput(parsed, tourIds(formData)), admin.id);
    updateTag(CONTENT_CACHE_TAGS.cuisines);
    target = listPath({ ok: "created" });
  } catch (error) {
    target = listPath({ error: message(error) });
  }

  redirect(target);
}

export async function updateCuisineAction(formData: FormData) {
  const admin = await requireCapabilityAction("content:write", "/admin/cuisines");

  const parsedId = idSchema.safeParse(formData.get("id"));
  if (!parsedId.success) redirect("/admin/cuisines");

  let target: string;
  try {
    const parsed = cuisineSchema.parse(Object.fromEntries(formData));
    await updateCuisine(
      parsedId.data,
      toInput(parsed, tourIds(formData)),
      admin.id,
    );
    updateTag(CONTENT_CACHE_TAGS.cuisines);
    target = editPath(parsedId.data, { ok: "updated" });
  } catch (error) {
    target = editPath(parsedId.data, { error: message(error) });
  }

  redirect(target);
}

export async function deleteCuisineAction(formData: FormData) {
  const admin = await requireCapabilityAction("content:write", "/admin/cuisines");

  const parsedId = idSchema.safeParse(formData.get("id"));
  if (!parsedId.success) redirect("/admin/cuisines");

  let target: string;
  try {
    await deleteCuisine(parsedId.data, admin.id);
    updateTag(CONTENT_CACHE_TAGS.cuisines);
    target = listPath({ ok: "deleted" });
  } catch (error) {
    target = listPath({ error: message(error) });
  }

  redirect(target);
}
