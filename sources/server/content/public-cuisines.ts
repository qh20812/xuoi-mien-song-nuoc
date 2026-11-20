import { cacheLife, cacheTag } from "next/cache";
import type { CuisineListingData } from "@/lib/contracts/cuisine";
import type { CuisineData } from "@/lib/contracts/home";
import { CONTENT_CACHE_TAGS } from "@/lib/content/cache-tags";
import {
  queryCuisinesForTour,
  queryHomeCuisines,
  queryPublicCuisineBySlug,
  queryPublicCuisines,
} from "./cuisines-query";

export async function listPublicCuisines(): Promise<CuisineListingData[]> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.cuisines);

  return queryPublicCuisines();
}

export async function getPublicCuisineBySlug(
  slug: string,
): Promise<CuisineListingData | null> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.cuisines);

  return queryPublicCuisineBySlug(slug);
}

export async function listCuisinesForTour(
  tourSlug: string,
): Promise<CuisineData[]> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.cuisines);

  return queryCuisinesForTour(tourSlug);
}

export async function listHomeCuisines(limit = 6): Promise<CuisineData[]> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.cuisines);

  return queryHomeCuisines(limit);
}
