import Link from "next/link";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PostForm } from "@/components/admin/post-form";
import { requireCapabilityPage } from "@/lib/auth/session";
import { formatDateVN } from "@/lib/format";
import { POST_TOPICS } from "@/lib/posts/listing";
import {
  POST_STATUS_LABEL,
  listAdminPosts,
  listPostTourCodes,
} from "@/server/content/admin-posts";
import { listMediaImageUrls } from "@/server/media/admin-media";
import { createPostAction } from "./actions";

export const instant = false;

export const metadata = {
  title: "Bài viết | Quản trị Xuôi Miền Sông Nước",
};

const OK_MESSAGE: Record<string, string> = {
  created: "Đã thêm bài viết.",
  deleted: "Đã xoá bài viết.",
};

const linkClass =
  "inline-flex min-h-9 items-center rounded-[8px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";

function topicLabel(value: string) {
  return POST_TOPICS.find((topic) => topic.value === value)?.label ?? value;
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const admin = await requireCapabilityPage("content:write", "/admin/posts");
  if (!admin) return <AccessDenied title="Không có quyền quản lý bài viết" />;

  const query = await searchParams;
  const [posts, tourCodes, mediaUrls] = await Promise.all([
    listAdminPosts(),
    listPostTourCodes(),
    listMediaImageUrls(),
  ]);
  const okMessage = query.ok ? OK_MESSAGE[query.ok] : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Quản trị", href: "/admin" }, { label: "Bài viết" }]}
        title="Bài viết"
        description="Thêm, sửa, ẩn hoặc xoá bài viết. Thay đổi áp dụng ngay cho /kinh-nghiem và trang chi tiết."
        actions={<span className="text-[13px] text-sage">{posts.length} bài viết</span>}
      />

      {okMessage ? (
        <p
          role="status"
          className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-[13px] text-success"
        >
          {okMessage}
        </p>
      ) : null}

      {query.error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger"
        >
          {query.error}
        </p>
      ) : null}

      <details className="rounded-xl border border-line bg-surface p-4 md:p-5">
        <summary className="cursor-pointer text-[15px] font-semibold text-ink">
          Thêm bài viết
        </summary>
        <div className="mt-4">
          <PostForm
            action={createPostAction}
            tourCodes={tourCodes}
            mediaUrls={mediaUrls}
            submitLabel="Thêm bài viết"
          />
        </div>
      </details>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface py-12 text-center">
          <p className="text-[13px] text-sage">Chưa có bài viết nào trong database.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-warm">
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Bài viết
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Chủ đề
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Trạng thái
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Ngày đăng
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Nổi bật
                </th>
                <th scope="col" className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <span className="block font-medium text-ink">{post.title}</span>
                    <span className="font-mono text-[12px] text-sage">{post.slug}</span>
                  </td>
                  <td className="px-4 py-3 text-sage">{topicLabel(post.topic)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        post.status === "published"
                          ? "inline-flex rounded-full bg-success/10 px-2.5 py-1 text-[12px] font-medium text-success"
                          : "inline-flex rounded-full bg-surface-warm px-2.5 py-1 text-[12px] font-medium text-sage"
                      }
                    >
                      {POST_STATUS_LABEL[post.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {post.publishedAt
                      ? formatDateVN(post.publishedAt.slice(0, 10))
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink">{post.isFeatured ? "Có" : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/posts/${post.id}`} className={linkClass}>
                      Sửa
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
