"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCapabilityAction } from "@/lib/auth/session";
import { CONTENT_CACHE_TAGS } from "@/lib/content/cache-tags";
import type { DestinationCategory } from "@/lib/contracts/destination";
import { CATEGORY_LABELS } from "@/lib/destinations/categories";
import {
  createDestination,
  deleteDestination,
  updateDestination,
  type DestinationInput,
} from "@/server/content/admin-destinations";
import { isAppError } from "@/server/errors";

const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as [
  DestinationCategory,
  ...DestinationCategory[],
];

const nullableText = (max: number) =>
  z.preprocess(
    (value) =>
      value === null || (typeof value === "string" && value.trim() === "")
        ? null
        : value,
    z.string().trim().max(max).nullable(),
  );

const coordinate = (min: number, max: number, label: string) =>
  z.preprocess(
    (value) => (value === null || value === "" ? null : Number(value)),
    z
      .number()
      .min(min, `${label} quá nhỏ`)
      .max(max, `${label} quá lớn`)
      .nullable(),
  );

const destinationSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Vui lòng nhập slug")
    .max(160, "Slug quá dài")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch nối"),
  name: z.string().trim().min(2, "Tên phải ít nhất 2 ký tự").max(200, "Tên quá dài"),
  province: z
    .string()
    .trim()
    .min(2, "Vui lòng nhập tỉnh/thành")
    .max(120, "Tỉnh/thành quá dài"),
  category: z.enum(CATEGORY_VALUES),
  shortDesc: nullableText(500),
  description: nullableText(60_000),
  bestSeason: nullableText(200),
  travelNote: nullableText(500),
  coverImageUrl: nullableText(500),
  lat: coordinate(-90, 90, "Vĩ độ"),
  lng: coordinate(-180, 180, "Kinh độ"),
  status: z.enum(["draft", "published"]),
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
  data: z.infer<typeof destinationSchema>,
  selectedTourIds: number[],
): DestinationInput {
  return {
    slug: data.slug,
    name: data.name,
    province: data.province,
    category: data.category,
    shortDesc: data.shortDesc,
    description: data.description,
    bestSeason: data.bestSeason,
    travelNote: data.travelNote,
    coverImageUrl: data.coverImageUrl,
    lat: data.lat,
    lng: data.lng,
    status: data.status,
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
  return `/admin/destinations${qs ? `?${qs}` : ""}`;
}

function editPath(id: number, query: Record<string, string> = {}): string {
  const qs = new URLSearchParams(query).toString();
  return `/admin/destinations/${id}${qs ? `?${qs}` : ""}`;
}

export async function createDestinationAction(formData: FormData) {
  const admin = await requireCapabilityAction("content:write", "/admin/destinations");

  let target: string;
  try {
    const parsed = destinationSchema.parse(Object.fromEntries(formData));
    await createDestination(toInput(parsed, tourIds(formData)), admin.id);
    updateTag(CONTENT_CACHE_TAGS.destinations);
    target = listPath({ ok: "created" });
  } catch (error) {
    target = listPath({ error: message(error) });
  }

  redirect(target);
}

export async function updateDestinationAction(formData: FormData) {
  const admin = await requireCapabilityAction("content:write", "/admin/destinations");

  const parsedId = idSchema.safeParse(formData.get("id"));
  if (!parsedId.success) redirect("/admin/destinations");

  let target: string;
  try {
    const parsed = destinationSchema.parse(Object.fromEntries(formData));
    await updateDestination(
      parsedId.data,
      toInput(parsed, tourIds(formData)),
      admin.id,
    );
    updateTag(CONTENT_CACHE_TAGS.destinations);
    target = editPath(parsedId.data, { ok: "updated" });
  } catch (error) {
    target = editPath(parsedId.data, { error: message(error) });
  }

  redirect(target);
}

export async function deleteDestinationAction(formData: FormData) {
  const admin = await requireCapabilityAction("content:write", "/admin/destinations");

  const parsedId = idSchema.safeParse(formData.get("id"));
  if (!parsedId.success) redirect("/admin/destinations");

  let target: string;
  try {
    await deleteDestination(parsedId.data, admin.id);
    updateTag(CONTENT_CACHE_TAGS.destinations);
    target = listPath({ ok: "deleted" });
  } catch (error) {
    target = listPath({ error: message(error) });
  }

  redirect(target);
}
