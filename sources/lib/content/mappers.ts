/**
 * Mapper thuần: Prisma row → contract public.
 *
 * Không import Prisma/`next` để unit-test được không cần DB. Loader trong
 * `server/content/*` chỉ chọn cột rồi gọi các hàm này.
 */
import type {
  CuisineListingData,
  CuisineRecord,
  CuisineTourRef,
} from "@/lib/contracts/cuisine";
import type {
  DestinationListingData,
  DestinationRecord,
  DestinationTourRef,
} from "@/lib/contracts/destination";
import type { FaqPlacement, PublicFaqRecord } from "@/lib/contracts/faq";
import type { PostRecord, PostTopic } from "@/lib/contracts/post";
import {
  CATEGORY_LABELS,
  groupFor,
  normalizeDestinationCategory,
} from "@/lib/destinations/categories";
import { toLocalImage } from "@/lib/images";
import { toSlug } from "@/lib/slug";

type NumericValue =
  | { toNumber(): number }
  | number
  | string
  | null
  | undefined;

type DateValue = Date | string | null | undefined;

export const POST_TOPIC_VALUES = ["hanh-ly", "thoi-tiet", "dat-mui"] as const;

export const POST_FALLBACK_IMAGE_SRC = "/images/63-mui-ghe-dtc-kenh-beo.webp";

export type DestinationRow = {
  slug: string;
  name: string;
  province: string;
  category: string | null;
  shortDesc: string | null;
  description: string | null;
  bestSeason: string | null;
  travelNote: string | null;
  coverImageUrl: string | null;
  lat: NumericValue;
  lng: NumericValue;
  sortOrder: number;
};

export type PostRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  coverImageUrl: string | null;
  tags: unknown;
  topic: string | null;
  relatedTourCodes: unknown;
  checklist: unknown;
  publishedAt: DateValue;
  createdAt: DateValue;
  isFeatured: boolean;
};

export type CuisineRow = {
  slug: string;
  name: string;
  description: string | null;
  whereToEat: string | null;
  province: string | null;
  imageUrl: string | null;
  sortOrder: number;
};

export type FaqRow = {
  question: string;
  answer: string;
  category: string;
  placement: string | null;
  sortOrder: number;
  isActive: boolean;
};

function toNumberOrNull(value: NumericValue): number | null {
  if (value === null || value === undefined) return null;

  try {
    const number =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value)
          : value.toNumber();
    return Number.isFinite(number) ? number : null;
  } catch {
    return null;
  }
}

function toIsoString(value: DateValue): string | null {
  if (value === null || value === undefined) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizePostTopic(value: string | null | undefined): PostTopic {
  return (POST_TOPIC_VALUES as readonly string[]).includes(value ?? "")
    ? (value as PostTopic)
    : "hanh-ly";
}

export function normalizeFaqPlacement(
  value: string | null | undefined,
): FaqPlacement | null {
  return value === "home" || value === "contact" || value === "both"
    ? value
    : null;
}

export function toDestinationRecord(row: DestinationRow): DestinationRecord {
  return {
    slug: row.slug,
    name: row.name,
    province: row.province,
    category: normalizeDestinationCategory(row.category),
    shortDescription: row.shortDesc ?? "",
    description: row.description ?? "",
    bestSeason: row.bestSeason ?? "",
    travelNote: row.travelNote ?? "",
    image: toLocalImage(row.coverImageUrl, row.name),
    lat: toNumberOrNull(row.lat),
    lng: toNumberOrNull(row.lng),
    sortOrder: row.sortOrder,
  };
}

export function toDestinationListingData(
  row: DestinationRow,
  tourRefs: DestinationTourRef[],
): DestinationListingData {
  const record = toDestinationRecord(row);
  const group = groupFor(record.category);

  return {
    ...record,
    provinceSlug: toSlug(record.province),
    categoryLabel: CATEGORY_LABELS[record.category],
    categoryGroup: group.value,
    categoryGroupLabel: group.label,
    tourRefs,
  };
}

export function toPostRecord(row: PostRow): PostRecord {
  const checklist = toStringArray(row.checklist);

  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    category: "kinh-nghiem",
    tags: toStringArray(row.tags),
    topic: normalizePostTopic(row.topic),
    coverImage: toLocalImage(row.coverImageUrl, row.title) ?? {
      src: POST_FALLBACK_IMAGE_SRC,
      alt: row.title,
    },
    publishedAt:
      toIsoString(row.publishedAt) ??
      toIsoString(row.createdAt) ??
      new Date(0).toISOString(),
    relatedTourCodes: toStringArray(row.relatedTourCodes),
    isFeatured: row.isFeatured,
    ...(checklist.length > 0 ? { checklist } : {}),
  };
}

export function toCuisineRecord(row: CuisineRow): CuisineRecord {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    whereToEat: row.whereToEat ?? "",
    province: row.province ?? "",
    image: toLocalImage(row.imageUrl, row.name),
    sortOrder: row.sortOrder,
  };
}

export function toCuisineListingData(
  row: CuisineRow,
  tourRefs: CuisineTourRef[],
): CuisineListingData {
  const record = toCuisineRecord(row);

  return {
    ...record,
    provinceSlug: toSlug(record.province),
    tourRefs,
  };
}

export function toPublicFaqRecord(row: FaqRow): PublicFaqRecord {
  return {
    question: row.question,
    answer: row.answer,
    category: row.category.trim() || "general",
    sortOrder: row.sortOrder,
    placement: normalizeFaqPlacement(row.placement),
    isActive: row.isActive,
  };
}
