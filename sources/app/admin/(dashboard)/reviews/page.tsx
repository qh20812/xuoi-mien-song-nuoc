import Link from "next/link";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireCapabilityPage } from "@/lib/auth/session";
import { formatDateVN } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ADMIN_REVIEW_STATUSES,
  REVIEW_STATUS_LABEL,
  countReviewsByStatus,
  isAdminReviewStatus,
  listAdminReviews,
} from "@/server/reviews/admin-reviews";
import {
  deleteReviewAction,
  setReviewReplyAction,
  setReviewStatusAction,
  toggleReviewFeaturedAction,
} from "./actions";

export const metadata = {
  title: "Kiểm duyệt đánh giá | Quản trị Xuôi Miền Sông Nước",
};

const OK_MESSAGE: Record<string, string> = {
  status: "Đã đổi trạng thái đánh giá.",
  featured: "Đã đổi trạng thái nổi bật.",
  reply: "Đã lưu phản hồi.",
  deleted: "Đã xoá đánh giá.",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-danger/10 text-danger",
  hidden: "bg-surface-warm text-sage",
};

const textareaClass =
  "w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] leading-6 text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const ghostButtonClass =
  "h-9 rounded-[10px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; ok?: string; error?: string }>;
}) {
  const admin = await requireCapabilityPage("content:write", "/admin/reviews");
  if (!admin) return <AccessDenied title="Không có quyền kiểm duyệt đánh giá" />;

  const params = await searchParams;
  const status = isAdminReviewStatus(params.status) ? params.status : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [result, counts] = await Promise.all([
    listAdminReviews({ status, page }),
    countReviewsByStatus(),
  ]);

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const okMessage = params.ok ? OK_MESSAGE[params.ok] : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Quản trị", href: "/admin" }, { label: "Đánh giá" }]}
        title="Kiểm duyệt đánh giá"
        description="Duyệt, ẩn hoặc phản hồi đánh giá của khách. Đánh giá đến từ trang tra cứu đơn (đơn đã hoàn thành, có huy hiệu “đã đi tour”) hoặc đánh giá chung; mọi đánh giá đều phải duyệt trước khi hiển thị."
        actions={<span className="text-[13px] text-sage">{total} đánh giá</span>}
      />

      {okMessage ? (
        <p
          role="status"
          className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-[13px] text-success"
        >
          {okMessage}
        </p>
      ) : null}

      {params.error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger"
        >
          {params.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Chip href="/admin/reviews" active={!status} label="Tất cả" count={total} />
        {ADMIN_REVIEW_STATUSES.map((value) => (
          <Chip
            key={value}
            href={`/admin/reviews?status=${value}`}
            active={status === value}
            label={REVIEW_STATUS_LABEL[value]}
            count={counts[value] ?? 0}
          />
        ))}
      </div>

      {result.reviews.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface py-12 text-center">
          <p className="text-[13px] text-sage">
            {status ? "Không có đánh giá ở trạng thái này." : "Chưa có đánh giá nào."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                    {review.authorName}
                    {review.isVerified ? (
                      <span className="rounded bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success">
                        đã đi tour
                      </span>
                    ) : null}
                    {review.isFeatured ? (
                      <span className="rounded bg-clay/15 px-1.5 py-0.5 text-[11px] font-medium text-clay">
                        nổi bật
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-sage">
                    <span aria-label={`${review.rating} trên 5 sao`}>
                      {"★".repeat(review.rating)}
                      {"☆".repeat(Math.max(0, 5 - review.rating))}
                    </span>
                    {review.tourName ? <span>{review.tourName}</span> : <span>Đánh giá chung</span>}
                    <span>{formatDateVN(review.createdAt.slice(0, 10))}</span>
                  </p>
                </div>

                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium",
                    STATUS_BADGE[review.status],
                  )}
                >
                  {REVIEW_STATUS_LABEL[review.status]}
                </span>
              </div>

              {review.comment ? (
                <p className="mt-3 text-[13px] leading-6 whitespace-pre-line text-sage">
                  {review.comment}
                </p>
              ) : (
                <p className="mt-3 text-[13px] text-sage italic">Không có nội dung.</p>
              )}

              {review.adminReply ? (
                <div className="mt-3 rounded-[10px] border border-line bg-surface-warm/60 p-3">
                  <p className="text-[11px] font-semibold tracking-[0.1em] text-sage uppercase">
                    Phản hồi của bạn
                  </p>
                  <p className="mt-1 text-[13px] leading-6 whitespace-pre-line text-ink">
                    {review.adminReply}
                  </p>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                {review.status !== "approved" ? (
                  <form action={setReviewStatusAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit" className={ghostButtonClass}>
                      Duyệt
                    </button>
                  </form>
                ) : null}

                {review.status !== "rejected" ? (
                  <form action={setReviewStatusAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button type="submit" className={ghostButtonClass}>
                      Từ chối
                    </button>
                  </form>
                ) : null}

                {review.status !== "hidden" ? (
                  <form action={setReviewStatusAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="status" value="hidden" />
                    <button type="submit" className={ghostButtonClass}>
                      Ẩn
                    </button>
                  </form>
                ) : null}

                <form action={toggleReviewFeaturedAction}>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <input type="hidden" name="isFeatured" value={review.isFeatured ? "false" : "true"} />
                  <button type="submit" className={ghostButtonClass}>
                    {review.isFeatured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
                  </button>
                </form>

                <details className="w-full rounded-[10px] border border-line bg-surface-warm/60">
                  <summary className="cursor-pointer px-3 py-2 text-[12px] font-semibold text-ink">
                    {review.adminReply ? "Sửa phản hồi" : "Trả lời"}
                  </summary>
                  <form action={setReviewReplyAction} className="flex flex-col gap-2 p-3">
                    <input type="hidden" name="reviewId" value={review.id} />
                    <label
                      htmlFor={`reply-${review.id}`}
                      className="text-[11px] font-semibold text-sage"
                    >
                      Nội dung phản hồi (để trống để xoá)
                    </label>
                    <textarea
                      id={`reply-${review.id}`}
                      name="adminReply"
                      rows={3}
                      maxLength={2000}
                      defaultValue={review.adminReply ?? ""}
                      className={textareaClass}
                    />
                    <button type="submit" className={ghostButtonClass}>
                      Lưu phản hồi
                    </button>
                  </form>
                </details>

                <form action={deleteReviewAction} className="ml-auto">
                  <input type="hidden" name="reviewId" value={review.id} />
                  <button
                    type="submit"
                    className="h-9 rounded-[10px] border border-danger/30 px-3 text-[12px] font-semibold text-danger transition-colors hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:outline-none"
                  >
                    Xoá
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {result.pagination.totalPages > 1 ? (
        <nav aria-label="Phân trang" className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-sage">
            Trang {result.pagination.page} / {result.pagination.totalPages}
          </span>
          <div className="flex gap-2">
            {result.pagination.page > 1 ? (
              <Link
                href={`/admin/reviews?${new URLSearchParams({
                  ...(status ? { status } : {}),
                  page: String(result.pagination.page - 1),
                }).toString()}`}
                className={ghostButtonClass}
              >
                Trước
              </Link>
            ) : null}
            {result.pagination.page < result.pagination.totalPages ? (
              <Link
                href={`/admin/reviews?${new URLSearchParams({
                  ...(status ? { status } : {}),
                  page: String(result.pagination.page + 1),
                }).toString()}`}
                className={ghostButtonClass}
              >
                Sau
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}

function Chip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-[12px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none",
        active
          ? "border-clay bg-clay/10 text-clay"
          : "border-line bg-surface text-sage hover:border-clay hover:text-ink",
      )}
    >
      {label}
      <span className="rounded-full bg-surface-warm px-1.5 text-[11px] text-sage">{count}</span>
    </Link>
  );
}
