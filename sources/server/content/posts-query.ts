import type { Prisma } from "@prisma/client";
import type {
  PostListingData,
  PostRelatedTour,
} from "@/lib/contracts/post";
import { toPostRecord } from "@/lib/content/mappers";
import { toPostListingData } from "@/lib/posts/listing";
import { toLocalImage } from "@/lib/images";
import prisma from "@/lib/prisma";

const POST_SELECT = {
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  coverImageUrl: true,
  tags: true,
  topic: true,
  relatedTourCodes: true,
  checklist: true,
  publishedAt: true,
  createdAt: true,
  isFeatured: true,
} satisfies Prisma.PostSelect;

type PostQueryRow = Prisma.PostGetPayload<{ select: typeof POST_SELECT }>;

const TOUR_FALLBACK_IMAGE_SRC = "/images/23-xuong-may-tren-kenh-phu-sa.webp";

function toListing(row: PostQueryRow): PostListingData {
  return toPostListingData(toPostRecord(row));
}

/** Query thô, không cache — dùng trong loader `"use cache"` và test DB. */
export async function queryPublicPosts(): Promise<PostListingData[]> {
  const now = new Date();
  const rows = await prisma.post.findMany({
    where: { status: "published", publishedAt: { lte: now } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: POST_SELECT,
  });

  return rows.map(toListing);
}

/** Query thô, không cache. */
export async function queryPublicPostBySlug(
  slug: string,
): Promise<PostListingData | null> {
  const now = new Date();
  const row = await prisma.post.findFirst({
    where: { slug, status: "published", publishedAt: { lte: now } },
    select: POST_SELECT,
  });

  return row ? toListing(row) : null;
}

/** Query thô, không cache. */
export async function queryRelatedPosts(
  slug: string,
  limit = 2,
): Promise<PostListingData[]> {
  const posts = await queryPublicPosts();
  return posts.filter((post) => post.slug !== slug).slice(0, limit);
}

/** Tour đang bán tương ứng với các mã bài viết; giữ thứ tự mã. */
export async function queryToursForPost(
  tourCodes: string[],
): Promise<PostRelatedTour[]> {
  const codes = Array.from(
    new Set(
      tourCodes
        .map((code) => code.trim().toUpperCase())
        .filter((code) => code.length > 0),
    ),
  );
  if (codes.length === 0) return [];

  const rows = await prisma.tour.findMany({
    where: { code: { in: codes }, status: "published" },
    select: {
      code: true,
      slug: true,
      name: true,
      summary: true,
      durationDays: true,
      durationNights: true,
      basePriceAdult: true,
      coverImageUrl: true,
    },
  });

  const byCode = new Map(rows.map((row) => [row.code, row]));

  return codes.flatMap((code) => {
    const row = byCode.get(code);
    if (!row) return [];

    return [
      {
        code: row.code,
        slug: row.slug,
        name: row.name,
        summary: row.summary ?? "",
        durationDays: row.durationDays,
        durationNights: row.durationNights,
        priceAdult: row.basePriceAdult,
        coverImage: toLocalImage(row.coverImageUrl, row.name) ?? {
          src: TOUR_FALLBACK_IMAGE_SRC,
          alt: row.name,
        },
        departures: [],
      },
    ];
  });
}
