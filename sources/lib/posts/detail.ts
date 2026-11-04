import type { PostListingData } from "@/lib/contracts/post";
import type { TourDetailData } from "@/lib/contracts/tour";
import { tourDetails } from "@/lib/fixtures/tour-details";
import {
  postListingBySlug,
  postListingData,
} from "@/lib/posts/listing";
import { parseArticleContent } from "@/lib/posts/content";

export function getPostBySlug(slug: string) {
  return postListingBySlug.get(slug);
}

export function getPostArticle(post: PostListingData) {
  return parseArticleContent(post.content);
}

export function getToursForPost(post: PostListingData): TourDetailData[] {
  return post.relatedTourCodes
    .map((code) => tourDetails.find((tour) => tour.code === code))
    .filter((tour): tour is TourDetailData => Boolean(tour));
}

export function getRelatedPosts(post: PostListingData) {
  return postListingData.filter((item) => item.slug !== post.slug).slice(0, 2);
}
