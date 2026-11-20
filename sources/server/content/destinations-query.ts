import type { Prisma } from "@prisma/client";
import type { DestinationData } from "@/lib/contracts/home";
import type { DestinationListingData } from "@/lib/contracts/destination";
import {
  toDestinationListingData,
  toDestinationRecord,
} from "@/lib/content/mappers";
import prisma from "@/lib/prisma";

const DESTINATION_BASE_SELECT = {
  slug: true,
  name: true,
  province: true,
  category: true,
  shortDesc: true,
  description: true,
  bestSeason: true,
  travelNote: true,
  coverImageUrl: true,
  lat: true,
  lng: true,
  sortOrder: true,
} satisfies Prisma.DestinationSelect;

const DESTINATION_SELECT = {
  ...DESTINATION_BASE_SELECT,
  tours: {
    where: { tour: { status: "published" } },
    orderBy: { sortOrder: "asc" },
    select: {
      tour: { select: { code: true, slug: true, name: true } },
    },
  },
} satisfies Prisma.DestinationSelect;

type DestinationQueryRow = Prisma.DestinationGetPayload<{
  select: typeof DESTINATION_SELECT;
}>;

function toTourRefs(row: DestinationQueryRow) {
  return row.tours.map(({ tour }) => ({
    code: tour.code,
    slug: tour.slug,
    name: tour.name,
  }));
}

/** Query thô, không cache — dùng trong loader `"use cache"` và test DB. */
export async function queryPublicDestinations(): Promise<
  DestinationListingData[]
> {
  const rows = await prisma.destination.findMany({
    where: { status: "published" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: DESTINATION_SELECT,
  });

  return rows.map((row) => toDestinationListingData(row, toTourRefs(row)));
}

/** Query thô, không cache. */
export async function queryPublicDestinationBySlug(
  slug: string,
): Promise<DestinationListingData | null> {
  const row = await prisma.destination.findFirst({
    where: { slug, status: "published" },
    select: DESTINATION_SELECT,
  });

  return row ? toDestinationListingData(row, toTourRefs(row)) : null;
}

/** Điểm đến gắn với một tour đang bán, chỉ trả mục có ảnh hợp lệ. */
export async function queryDestinationsForTour(
  tourSlug: string,
): Promise<DestinationData[]> {
  const rows = await prisma.tourDestination.findMany({
    where: { tour: { slug: tourSlug, status: "published" } },
    orderBy: { sortOrder: "asc" },
    select: {
      destination: { select: DESTINATION_BASE_SELECT },
    },
  });

  const result: DestinationData[] = [];
  for (const { destination } of rows) {
    const record = toDestinationRecord(destination);
    if (!record.image) continue;

    result.push({
      slug: record.slug,
      name: record.name,
      province: record.province,
      shortDescription: record.shortDescription,
      image: record.image,
    });
  }

  return result;
}

/** Top điểm đến có ảnh cho section trang chủ. */
export async function queryHomeDestinations(
  limit = 4,
): Promise<DestinationData[]> {
  const rows = await queryPublicDestinations();
  const take = Math.max(0, Math.trunc(limit));
  const result: DestinationData[] = [];

  for (const row of rows) {
    if (result.length >= take) break;
    if (!row.image) continue;

    result.push({
      slug: row.slug,
      name: row.name,
      province: row.province,
      shortDescription: row.shortDescription,
      image: row.image,
    });
  }

  return result;
}
