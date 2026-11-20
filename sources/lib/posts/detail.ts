import type { PostListingData } from "@/lib/contracts/post";
import { parseArticleContent } from "@/lib/posts/content";

export function getPostArticle(post: PostListingData) {
  return parseArticleContent(post.content);
}

export function getRelatedPosts(
  post: PostListingData,
  posts: PostListingData[],
) {
  return posts.filter((item) => item.slug !== post.slug).slice(0, 2);
}
