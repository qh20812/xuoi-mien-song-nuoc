"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCapabilityAction } from "@/lib/auth/session";
import { CONTENT_CACHE_TAGS } from "@/lib/content/cache-tags";
import { FAQ_CATEGORIES } from "@/lib/content/faq-options";
import { FAQ_PLACEMENTS } from "@/lib/contracts/faq";
import {
  createFaq,
  deleteFaq,
  updateFaq,
  type FaqInput,
} from "@/server/content/admin-faqs";
import { isAppError } from "@/server/errors";

const faqSchema = z.object({
  question: z
    .string()
    .trim()
    .min(2, "Câu hỏi phải ít nhất 2 ký tự")
    .max(500, "Câu hỏi quá dài"),
  answer: z
    .string()
    .trim()
    .min(2, "Câu trả lời phải ít nhất 2 ký tự")
    .max(60_000, "Câu trả lời quá dài"),
  category: z.enum(FAQ_CATEGORIES),
  placement: z.preprocess(
    (value) =>
      value === null || value === undefined || value === "" ? null : value,
    z.enum(FAQ_PLACEMENTS).nullable(),
  ),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.preprocess(
    (value) => value === "on" || value === "true" || value === true,
    z.boolean(),
  ),
});

const idSchema = z.coerce.number().int().positive();

function message(error: unknown): string {
  if (isAppError(error)) return error.message;
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
  }
  return "Không lưu được, vui lòng thử lại";
}

function listPath(query: Record<string, string> = {}): string {
  const qs = new URLSearchParams(query).toString();
  return `/admin/faqs${qs ? `?${qs}` : ""}`;
}

function editPath(id: number, query: Record<string, string> = {}): string {
  const qs = new URLSearchParams(query).toString();
  return `/admin/faqs/${id}${qs ? `?${qs}` : ""}`;
}

export async function createFaqAction(formData: FormData) {
  const admin = await requireCapabilityAction("content:write", "/admin/faqs");

  let target: string;
  try {
    const parsed = faqSchema.parse(Object.fromEntries(formData));
    const input: FaqInput = parsed;
    await createFaq(input, admin.id);
    updateTag(CONTENT_CACHE_TAGS.faqs);
    target = listPath({ ok: "created" });
  } catch (error) {
    target = listPath({ error: message(error) });
  }

  redirect(target);
}

export async function updateFaqAction(formData: FormData) {
  const admin = await requireCapabilityAction("content:write", "/admin/faqs");

  const parsedId = idSchema.safeParse(formData.get("id"));
  if (!parsedId.success) redirect("/admin/faqs");

  let target: string;
  try {
    const parsed = faqSchema.parse(Object.fromEntries(formData));
    const input: FaqInput = parsed;
    await updateFaq(parsedId.data, input, admin.id);
    updateTag(CONTENT_CACHE_TAGS.faqs);
    target = editPath(parsedId.data, { ok: "updated" });
  } catch (error) {
    target = editPath(parsedId.data, { error: message(error) });
  }

  redirect(target);
}

export async function deleteFaqAction(formData: FormData) {
  const admin = await requireCapabilityAction("content:write", "/admin/faqs");

  const parsedId = idSchema.safeParse(formData.get("id"));
  if (!parsedId.success) redirect("/admin/faqs");

  let target: string;
  try {
    await deleteFaq(parsedId.data, admin.id);
    updateTag(CONTENT_CACHE_TAGS.faqs);
    target = listPath({ ok: "deleted" });
  } catch (error) {
    target = listPath({ error: message(error) });
  }

  redirect(target);
}
