import type {
  PostListingData,
  PostRecord,
  PostTopic,
} from "@/lib/contracts/post";

export const POST_TOPICS: Array<{ value: PostTopic; label: string }> = [
  { value: "hanh-ly", label: "Hành lý & an toàn" },
  { value: "thoi-tiet", label: "Thời tiết & mùa nước" },
  { value: "dat-mui", label: "Đất Mũi & thực địa" },
];

const TOPIC_LABELS = Object.fromEntries(
  POST_TOPICS.map((topic) => [topic.value, topic.label]),
) as Record<PostTopic, string>;

export function readingMinutes(content: string): number {
  const plain = content.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  const words = plain ? plain.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

export function toPostListingData(post: PostRecord): PostListingData {
  return {
    ...post,
    readingMinutes: readingMinutes(post.content),
    topicLabel: TOPIC_LABELS[post.topic],
    publishedDate: post.publishedAt.slice(0, 10),
  };
}
