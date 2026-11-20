import type { Prisma } from "@prisma/client";
import type { CuisineListingData } from "@/lib/contracts/cuisine";
import type { CuisineData } from "@/lib/contracts/home";
import {
  toCuisineData,
  toCuisineListingData,
} from "@/lib/content/mappers";
import prisma from "@/lib/prisma";

const CUISINE_BASE_SELECT = {
  slug: true,
  name: true,
  description: true,
  whereToEat: true,
  province: true,
  imageUrl: true,
  sortOrder: true,
} satisfies Prisma.CuisineSelect;

const CUISINE_SELECT = {
  ...CUISINE_BASE_SELECT,
  tours: {
    where: { tour: { status: "published" } },
    orderBy: { tourId: "asc" },
    select: {
      tour: { select: { code: true, slug: true, name: true } },
    },
  },
} satisfies Prisma.CuisineSelect;

type CuisineQueryRow = Prisma.CuisineGetPayload<{
  select: typeof CUISINE_SELECT;
}>;

function toTourRefs(row: CuisineQueryRow) {
  return row.tours.map(({ tour }) => ({
    code: tour.code,
    slug: tour.slug,
    name: tour.name,
  }));
}

/** Query thô, không cache — dùng trong loader `"use cache"` và test DB. */
export async function queryPublicCuisines(): Promise<CuisineListingData[]> {
  const rows = await prisma.cuisine.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: CUISINE_SELECT,
  });

  return rows.map((row) => toCuisineListingData(row, toTourRefs(row)));
}

/** Query thô, không cache. */
export async function queryPublicCuisineBySlug(
  slug: string,
): Promise<CuisineListingData | null> {
  const row = await prisma.cuisine.findUnique({
    where: { slug },
    select: CUISINE_SELECT,
  });

  return row ? toCuisineListingData(row, toTourRefs(row)) : null;
}

/** Món ăn gắn với một tour đang bán. */
export async function queryCuisinesForTour(
  tourSlug: string,
): Promise<CuisineData[]> {
  const rows = await prisma.tourCuisine.findMany({
    where: { tour: { slug: tourSlug, status: "published" } },
    orderBy: { cuisineId: "asc" },
    select: {
      cuisine: { select: CUISINE_BASE_SELECT },
    },
  });

  return rows.map(({ cuisine }) => toCuisineData(cuisine));
}

/** Top món ăn cho section trang chủ, theo đúng thứ tự admin đặt. */
export async function queryHomeCuisines(limit = 6): Promise<CuisineData[]> {
  const take = Math.max(0, Math.trunc(limit));

  const rows = await prisma.cuisine.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take,
    select: CUISINE_BASE_SELECT,
  });

  return rows.map(toCuisineData);
}
