import type { PostListingData, PostRecord, PostTopic } from "@/lib/contracts/post";
import { posts } from "@/lib/fixtures/posts";

export const POST_TOPICS: Array<{ value: PostTopic; label: string }> = [
  { value: "hanh-ly", label: "Hành lý & an toàn" },
  { value: "thoi-tiet", label: "Thời tiết & mùa nước" },
  { value: "dat-mui", label: "Đất Mũi & thực địa" },
];

const TOPIC_LABELS = Object.fromEntries(
  POST_TOPICS.map((topic) => [topic.value, topic.label]),
) as Record<PostTopic, string>;

function readingMinutes(content: string) {
  const plain = content.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  const words = plain ? plain.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

function toListingData(post: PostRecord): PostListingData {
  return {
    ...post,
    readingMinutes: readingMinutes(post.content),
    topicLabel: TOPIC_LABELS[post.topic],
    publishedDate: post.publishedAt.slice(0, 10),
  };
}

export const postListingData = posts
  .map(toListingData)
  .sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

export const postListingBySlug = new Map(
  postListingData.map((post) => [post.slug, post]),
);

export const featuredPostSlug = "mang-gi-khi-vao-rung-tram";
