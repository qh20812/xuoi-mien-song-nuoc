"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCapabilityAction } from "@/lib/auth/session";
import { CONTENT_CACHE_TAGS } from "@/lib/content/cache-tags";
import type { PostTopic } from "@/lib/contracts/post";
import { POST_TOPICS } from "@/lib/posts/listing";
import {
  createPost,
  deletePost,
  updatePost,
  type PostInput,
} from "@/server/content/admin-posts";
import { isAppError } from "@/server/errors";

const TOPIC_VALUES = POST_TOPICS.map((topic) => topic.value) as [
  PostTopic,
  ...PostTopic[],
];

const nullableText = (max: number) =>
  z.preprocess(
    (value) =>
      value === null || (typeof value === "string" && value.trim() === "")
        ? null
        : value,
    z.string().trim().max(max).nullable(),
  );

const optionalDate = z.preprocess(
  (value) =>
    value === null || (typeof value === "string" && value.trim() === "")
      ? null
      : value,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày đăng không hợp lệ")
    .nullable(),
);

const postSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Vui lòng nhập slug")
    .max(200, "Slug quá dài")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch nối"),
  title: z.string().trim().min(2, "Tiêu đề phải ít nhất 2 ký tự").max(255, "Tiêu đề quá dài"),
  excerpt: nullableText(500),
  content: nullableText(60_000),
  coverImageUrl: nullableText(500),
  topic: z.enum(TOPIC_VALUES),
  status: z.enum(["draft", "published"]),
  publishedAt: optionalDate,
  seoTitle: nullableText(200),
  seoDescription: nullableText(320),
});

const idSchema = z.coerce.number().int().positive();

function split(value: FormDataEntryValue | null, pattern: RegExp): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(pattern)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toInput(
  data: z.infer<typeof postSchema>,
  formData: FormData,
): PostInput {
  return {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    coverImageUrl: data.coverImageUrl,
    tags: split(formData.get("tags"), /,/),
    topic: data.topic,
    relatedTourCodes: split(formData.get("relatedTourCodes"), /,/),
    checklist: split(formData.get("checklist"), /\r?\n/),
    status: data.status,
    publishedAt: data.publishedAt,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    isFeatured: formData.get("isFeatured") === "on",
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
  return `/admin/posts${qs ? `?${qs}` : ""}`;
}

function editPath(id: number, query: Record<string, string> = {}): string {
  const qs = new URLSearchParams(query).toString();
  return `/admin/posts/${id}${qs ? `?${qs}` : ""}`;
}

export async function createPostAction(formData: FormData) {
  const admin = await requireCapabilityAction("content:write", "/admin/posts");

  let target: string;
  try {
    const parsed = postSchema.parse(Object.fromEntries(formData));
    await createPost(toInput(parsed, formData), admin.id);
    updateTag(CONTENT_CACHE_TAGS.posts);
    target = listPath({ ok: "created" });
  } catch (error) {
    target = listPath({ error: message(error) });
  }

  redirect(target);
}

export async function updatePostAction(formData: FormData) {
  const admin = await requireCapabilityAction("content:write", "/admin/posts");

  const parsedId = idSchema.safeParse(formData.get("id"));
  if (!parsedId.success) redirect("/admin/posts");

  let target: string;
  try {
    const parsed = postSchema.parse(Object.fromEntries(formData));
    await updatePost(parsedId.data, toInput(parsed, formData), admin.id);
    updateTag(CONTENT_CACHE_TAGS.posts);
    target = editPath(parsedId.data, { ok: "updated" });
  } catch (error) {
    target = editPath(parsedId.data, { error: message(error) });
  }

  redirect(target);
}

export async function deletePostAction(formData: FormData) {
  const admin = await requireCapabilityAction("content:write", "/admin/posts");

  const parsedId = idSchema.safeParse(formData.get("id"));
  if (!parsedId.success) redirect("/admin/posts");

  let target: string;
  try {
    await deletePost(parsedId.data, admin.id);
    updateTag(CONTENT_CACHE_TAGS.posts);
    target = listPath({ ok: "deleted" });
  } catch (error) {
    target = listPath({ error: message(error) });
  }

  redirect(target);
}
