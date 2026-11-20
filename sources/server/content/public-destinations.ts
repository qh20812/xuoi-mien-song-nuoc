import { cacheLife, cacheTag } from "next/cache";
import type { DestinationData } from "@/lib/contracts/home";
import type { DestinationListingData } from "@/lib/contracts/destination";
import { CONTENT_CACHE_TAGS } from "@/lib/content/cache-tags";
import {
  queryDestinationsForTour,
  queryHomeDestinations,
  queryPublicDestinationBySlug,
  queryPublicDestinations,
} from "./destinations-query";

export async function listPublicDestinations(): Promise<
  DestinationListingData[]
> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.destinations);

  return queryPublicDestinations();
}

export async function getPublicDestinationBySlug(
  slug: string,
): Promise<DestinationListingData | null> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.destinations);

  return queryPublicDestinationBySlug(slug);
}

export async function listDestinationsForTour(
  tourSlug: string,
): Promise<DestinationData[]> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.destinations);

  return queryDestinationsForTour(tourSlug);
}

export async function listHomeDestinations(limit = 4): Promise<DestinationData[]> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.destinations);

  return queryHomeDestinations(limit);
}
