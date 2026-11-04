import type { ImageAsset } from "@/lib/contracts/home";

export type PostTopic = "hanh-ly" | "thoi-tiet" | "dat-mui";

export type PostRecord = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: "kinh-nghiem";
  tags: string[];
  topic: PostTopic;
  coverImage: ImageAsset;
  publishedAt: string;
  relatedTourCodes: string[];
  checklist?: string[];
};

export type PostListingData = PostRecord & {
  readingMinutes: number;
  topicLabel: string;
  publishedDate: string;
};
