import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MessageCircle,
  Phone,
} from "lucide-react";
import { ArticleBody } from "@/components/posts/article-body";
import { ArticleToc } from "@/components/posts/article-toc";
import { PackingChecklist } from "@/components/posts/packing-checklist";
import { PostCard } from "@/components/posts/post-card";
import { RelatedToursCta } from "@/components/posts/related-tours-cta";
import { ShareButton } from "@/components/posts/share-button";
import { Container } from "@/components/ui/container";
import { siteSettings } from "@/lib/fixtures/site";
import { formatDateVN } from "@/lib/format";
import {
  getPostArticle,
  getPostBySlug,
  getRelatedPosts,
  getToursForPost,
} from "@/lib/posts/detail";
import { postListingData } from "@/lib/posts/listing";

// Trang chi tiết đọc slug và được prerender cho ba bài viết hiện có.
export const instant = false;

type ExperienceDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return postListingData.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: ExperienceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Không tìm thấy bài viết" };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage.src, alt: post.coverImage.alt }],
      locale: "vi_VN",
      type: "article",
    },
  };
}

export default async function ExperienceDetailPage({
  params,
}: ExperienceDetailPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const article = getPostArticle(post);
  const tours = getToursForPost(post);
  const relatedPosts = getRelatedPosts(post);

  return (
    <Container className="pt-6 pb-16 md:pb-24">
      <nav
        aria-label="Đường dẫn trang"
        className="flex flex-wrap items-center gap-1.5 text-xs text-sage"
      >
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <Link href="/kinh-nghiem" className="transition-colors hover:text-ink">
          Kinh nghiệm
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span>{post.topicLabel}</span>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span className="truncate font-medium text-ink">{post.title}</span>
      </nav>

      <header className="mt-6 border-b border-line pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="rounded-full bg-surface-warm px-3 py-1 text-xs font-semibold tracking-[0.1em] text-ink uppercase">
            {post.topicLabel}
          </span>
          <ShareButton title={post.title} />
        </div>

        <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.03] font-medium tracking-[-0.03em] text-ink">
          {post.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-sage">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            Đăng ngày {formatDateVN(post.publishedDate)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden="true" className="size-3.5" />
            {post.readingMinutes} phút đọc
          </span>
        </div>
      </header>

      <figure className="mt-7">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[20px] bg-surface-warm md:aspect-[21/9]">
          <Image
            src={post.coverImage.src}
            alt={post.coverImage.alt}
            fill
            priority
            sizes="(min-width: 1024px) 1200px, 100vw"
            className="object-cover"
          />
        </div>
        <figcaption className="mt-3 text-xs leading-5 text-sage">
          {post.coverImage.alt} (Ảnh: Wikimedia Commons)
        </figcaption>
      </figure>

      <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-8">
        <article className="order-1 min-w-0 lg:order-2 lg:col-span-8">
          <div className="lg:hidden">
            <ArticleToc sections={article.sections} compact />
          </div>

          <div className="mt-6 lg:mt-0">
            <ArticleBody article={article} />
          </div>

          {tours.length > 0 ? (
            <section className="mt-12 border-t border-line pt-8">
              <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
                Hành trình liên quan
              </span>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
                Trải nghiệm những nơi trong bài viết
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-sage">
                Ngày khởi hành, số chỗ và giá lấy từ dữ liệu tour hiện có.
              </p>
              <div className="mt-5">
                <RelatedToursCta tours={tours} />
              </div>
              <p className="mt-4 text-xs leading-5 text-sage">
                Giữ chỗ {siteSettings.booking.holdHours} giờ, chưa thu tiền
                online. Nhân viên liên hệ hướng dẫn đặt cọc để xác nhận.
              </p>
            </section>
          ) : null}

          {relatedPosts.length > 0 ? (
            <section className="mt-12 border-t border-line pt-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
                    Cẩm nang liên quan
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
                    Đọc tiếp về miền sông nước
                  </h2>
                </div>
                <Link
                  href="/kinh-nghiem"
                  className="text-sm font-semibold text-clay transition-colors hover:text-clay-hover"
                >
                  Xem tất cả bài viết
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                {relatedPosts.map((relatedPost) => (
                  <PostCard
                    key={relatedPost.slug}
                    post={relatedPost}
                    variant="standard"
                  />
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <aside className="order-2 flex flex-col gap-5 lg:sticky lg:top-28 lg:order-1 lg:col-span-4">
          <ArticleToc sections={article.sections} />

          {post.checklist && post.checklist.length > 0 ? (
            <PackingChecklist items={post.checklist} />
          ) : null}

          <div className="rounded-[16px] border border-line bg-surface-warm/45 p-5">
            <span className="text-[0.68rem] font-semibold tracking-[0.1em] text-sage uppercase">
              Tư vấn trực tiếp
            </span>
            <p className="mt-2 text-sm leading-6 text-sage">
              Cần kiểm tra lịch khởi hành hoặc điều kiện đi rừng trước ngày khởi
              hành?
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={siteSettings.hotlineHref}
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-clay"
              >
                <Phone aria-hidden="true" className="size-4 text-sage" />
                {siteSettings.hotline}
              </a>
              <a
                href={siteSettings.zaloHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-clay"
              >
                <MessageCircle aria-hidden="true" className="size-4 text-sage" />
                Zalo · {siteSettings.supportHours}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
