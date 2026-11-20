import { cacheLife, cacheTag } from "next/cache";
import type {
  PostListingData,
  PostRelatedTour,
} from "@/lib/contracts/post";
import { CONTENT_CACHE_TAGS } from "@/lib/content/cache-tags";
import {
  queryPublicPostBySlug,
  queryPublicPosts,
  queryRelatedPosts,
  queryToursForPost,
} from "./posts-query";

export async function listPublicPosts(): Promise<PostListingData[]> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.posts);

  return queryPublicPosts();
}

export async function getPublicPostBySlug(
  slug: string,
): Promise<PostListingData | null> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.posts);

  return queryPublicPostBySlug(slug);
}

export async function listRelatedPosts(
  slug: string,
  limit = 2,
): Promise<PostListingData[]> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.posts);

  return queryRelatedPosts(slug, limit);
}

export async function listToursForPost(
  tourCodes: string[],
): Promise<PostRelatedTour[]> {
  "use cache";
  cacheLife("max");
  cacheTag(CONTENT_CACHE_TAGS.posts);

  return queryToursForPost(tourCodes);
}
