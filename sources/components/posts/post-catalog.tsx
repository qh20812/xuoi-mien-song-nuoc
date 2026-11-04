"use client";

import { useMemo, useState } from "react";
import { RotateCcw, SearchX } from "lucide-react";
import { PostCard } from "@/components/posts/post-card";
import type { PostListingData, PostTopic } from "@/lib/contracts/post";
import { POST_TOPICS, featuredPostSlug } from "@/lib/posts/listing";
import { cn } from "@/lib/utils";

type PostCatalogProps = {
  posts: PostListingData[];
};

export function PostCatalog({ posts }: PostCatalogProps) {
  const [activeTopic, setActiveTopic] = useState<"all" | PostTopic>("all");

  const filters = useMemo(
    () => [
      { value: "all" as const, label: "Tất cả bài viết", count: posts.length },
      ...POST_TOPICS.map((topic) => ({
        value: topic.value,
        label: topic.label,
        count: posts.filter((post) => post.topic === topic.value).length,
      })),
    ],
    [posts],
  );

  const visiblePosts = useMemo(
    () =>
      activeTopic === "all"
        ? posts
        : posts.filter((post) => post.topic === activeTopic),
    [activeTopic, posts],
  );

  const bySlug = useMemo(
    () => new Map(posts.map((post) => [post.slug, post])),
    [posts],
  );
  const lead =
    bySlug.get(featuredPostSlug) ?? visiblePosts[0] ?? null;
  const secondary =
    activeTopic === "all"
      ? posts.filter((post) => post.slug !== lead?.slug)
      : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-line bg-surface p-4">
        <div
          role="group"
          aria-label="Lọc bài viết theo chủ đề"
          className="flex flex-wrap gap-2"
        >
          {filters.map((filter) => {
            const active = filter.value === activeTopic;
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveTopic(filter.value)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-[8px] px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none",
                  active
                    ? "bg-ink text-contrast-on-accent"
                    : "bg-canvas text-ink hover:bg-surface-warm",
                )}
              >
                {filter.label}
                <span
                  className={cn(
                    "text-[0.65rem]",
                    active ? "text-surface/60" : "text-sage",
                  )}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-sage">
          {visiblePosts.length} bài viết theo chủ đề đang chọn
        </p>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {visiblePosts.length} bài viết phù hợp.
      </p>

      {visiblePosts.length === 0 ? (
        <section className="mx-auto flex max-w-xl flex-col items-center rounded-[20px] border border-dashed border-line bg-surface-warm/35 p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface text-sage">
            <SearchX aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-ink">
            Không có bài viết theo chủ đề này
          </h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Hiện có {posts.length} bài viết trong cẩm nang.
          </p>
          <button
            type="button"
            onClick={() => setActiveTopic("all")}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-clay px-5 text-sm font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Xem tất cả {posts.length} bài
          </button>
        </section>
      ) : null}

      {visiblePosts.length > 0 && activeTopic === "all" && lead ? (
        <div className="flex flex-col gap-8">
          <PostCard post={lead} variant="lead" />
          {secondary.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {secondary.map((post, index) => (
                <div
                  key={post.slug}
                  className={index === 0 ? "lg:col-span-5" : "lg:col-span-7"}
                >
                  <PostCard post={post} variant="standard" />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {visiblePosts.length > 0 && activeTopic !== "all" ? (
        visiblePosts.length === 1 ? (
          <PostCard post={visiblePosts[0]!} variant="lead" />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {visiblePosts.map((post) => (
              <PostCard key={post.slug} post={post} variant="standard" />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
