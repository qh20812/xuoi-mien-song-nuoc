import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import type { PostListingData } from "@/lib/contracts/post";
import { formatDateVN } from "@/lib/format";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: PostListingData;
  variant: "lead" | "standard";
};

export function PostCard({ post, variant }: PostCardProps) {
  const isLead = variant === "lead";
  const articleHref = `/kinh-nghiem/${post.slug}`;

  const meta = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-sage">
      <span className="rounded-full bg-surface-warm px-2.5 py-1 font-medium text-ink">
        {post.topicLabel}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays aria-hidden="true" className="size-3.5" />
        {formatDateVN(post.publishedDate)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock3 aria-hidden="true" className="size-3.5" />
        {post.readingMinutes} phút đọc
      </span>
    </div>
  );

  const image = (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-warm",
        isLead ? "aspect-[4/3] lg:h-full lg:min-h-[440px] lg:aspect-auto" : "aspect-[16/9]",
      )}
    >
      <Image
        src={post.coverImage.src}
        alt={post.coverImage.alt}
        fill
        priority={isLead}
        sizes={isLead ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 42vw, 100vw"}
        className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
      />
    </div>
  );

  if (isLead) {
    return (
      <article className="group overflow-hidden rounded-[22px] border border-line bg-surface shadow-[0_18px_48px_-24px_rgba(23,51,43,0.14)] transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-ink/35">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <Link
            href={articleHref}
            className="block lg:col-span-7"
            aria-label={`Đọc ${post.title}`}
          >
            {image}
          </Link>

          <div className="flex flex-col justify-between p-6 lg:col-span-5 lg:p-9">
            {meta}
            <div className="mt-5">
              <h2 className="font-display text-[clamp(1.9rem,3.8vw,2.8rem)] leading-[1.06] font-semibold text-ink">
                <Link href={articleHref} className="transition-colors hover:text-clay">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-4 text-sm leading-7 text-sage md:text-base">
                {post.excerpt}
              </p>
            </div>
            <Link
              href={articleHref}
              className="mt-6 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-clay transition-colors hover:text-clay-hover"
            >
              Đọc toàn bộ bài viết
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-surface transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-ink/35">
      <Link href={articleHref} aria-label={`Đọc ${post.title}`}>
        {image}
      </Link>
      <div className="flex flex-1 flex-col p-5 md:p-6">
        {meta}
        <h3 className="mt-4 font-display text-xl leading-snug font-semibold text-ink md:text-2xl">
          <Link href={articleHref} className="transition-colors hover:text-clay">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-sage">{post.excerpt}</p>
        <Link
          href={articleHref}
          className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-clay transition-colors hover:text-clay-hover"
        >
          Đọc bài viết
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </article>
  );
}
