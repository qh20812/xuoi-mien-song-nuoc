import Link from "next/link";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireCapabilityPage } from "@/lib/auth/session";
import { formatDateTimeVN } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ADMIN_CONTACT_STATUSES,
  CONTACT_STATUS_LABEL,
  countContactMessagesByStatus,
  isAdminContactStatus,
  listAdminContactMessages,
} from "@/server/contact/admin-messages";
import { deleteContactMessageAction, setContactStatusAction } from "./actions";

export const metadata = {
  title: "Hộp thư liên hệ | Quản trị Xuôi Miền Sông Nước",
};

const STATUS_BADGE: Record<string, string> = {
  new: "bg-clay/15 text-clay",
  read: "bg-surface-warm text-sage",
  replied: "bg-success/10 text-success",
  spam: "bg-danger/10 text-danger",
};

const fieldClass =
  "h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const ghostButtonClass =
  "h-9 rounded-[10px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; error?: string }>;
}) {
  const admin = await requireCapabilityPage("messages:read", "/admin/messages");
  if (!admin) return <AccessDenied title="Không có quyền xem hộp thư" />;

  const params = await searchParams;
  const status = isAdminContactStatus(params.status) ? params.status : undefined;
  const q = typeof params.q === "string" ? params.q.trim() : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [result, counts] = await Promise.all([
    listAdminContactMessages({ status, q, page }),
    countContactMessagesByStatus(),
  ]);

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const currentQuery = buildQuery({ status, q, page });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Quản trị", href: "/admin" }, { label: "Hộp thư" }]}
        title="Lời nhắn liên hệ"
        description="Tin khách gửi từ trang Liên hệ. Đánh dấu trạng thái để cả nhóm biết tin nào đã xử lý."
        actions={<span className="text-[13px] text-sage">{total} lời nhắn</span>}
      />

      {params.error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger"
        >
          {params.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <StatusChip href="/admin/messages" active={!status} label="Tất cả" count={total} />
        {ADMIN_CONTACT_STATUSES.map((value) => (
          <StatusChip
            key={value}
            href={buildQuery({ status: value, q })}
            active={status === value}
            label={CONTACT_STATUS_LABEL[value]}
            count={counts[value] ?? 0}
          />
        ))}
      </div>

      <form
        method="get"
        className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-end"
      >
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div className="flex w-full flex-col gap-1.5 sm:max-w-[320px]">
          <label htmlFor="messages-q" className="text-[12px] font-semibold text-sage">
            Tìm kiếm
          </label>
          <input
            id="messages-q"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Tên / SĐT / email / nội dung"
            className={fieldClass}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="h-10 rounded-[10px] bg-clay px-4 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
          >
            Tìm
          </button>
          <Link
            href="/admin/messages"
            className="text-[13px] font-medium text-sage transition-colors hover:text-ink"
          >
            Xoá lọc
          </Link>
        </div>
      </form>

      {result.messages.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface py-12 text-center">
          <p className="text-[13px] text-sage">
            {status || q ? "Không có lời nhắn phù hợp." : "Chưa có lời nhắn nào."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.messages.map((message) => (
            <li key={message.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink">{message.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-sage">
                    <a
                      href={`tel:${message.phone}`}
                      className="font-medium text-ink underline-offset-4 hover:underline"
                    >
                      {message.phone}
                    </a>
                    {message.email ? <span>{message.email}</span> : null}
                    <span>{formatDateTimeVN(message.createdAt)}</span>
                  </p>
                </div>

                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium",
                    STATUS_BADGE[message.status],
                  )}
                >
                  {CONTACT_STATUS_LABEL[message.status]}
                </span>
              </div>

              {message.subject ? (
                <p className="mt-3 text-[13px] font-semibold text-ink">{message.subject}</p>
              ) : null}

              <p className="mt-1 text-[13px] leading-6 whitespace-pre-line text-sage">
                {message.message}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                {message.status !== "read" ? (
                  <form action={setContactStatusAction}>
                    <input type="hidden" name="messageId" value={message.id} />
                    <input type="hidden" name="status" value="read" />
                    <input type="hidden" name="returnTo" value={currentQuery} />
                    <button type="submit" className={ghostButtonClass}>
                      Đánh dấu đã đọc
                    </button>
                  </form>
                ) : null}

                {message.status !== "replied" ? (
                  <form action={setContactStatusAction}>
                    <input type="hidden" name="messageId" value={message.id} />
                    <input type="hidden" name="status" value="replied" />
                    <input type="hidden" name="returnTo" value={currentQuery} />
                    <button type="submit" className={ghostButtonClass}>
                      Đã phản hồi
                    </button>
                  </form>
                ) : null}

                {message.status !== "new" ? (
                  <form action={setContactStatusAction}>
                    <input type="hidden" name="messageId" value={message.id} />
                    <input type="hidden" name="status" value="new" />
                    <input type="hidden" name="returnTo" value={currentQuery} />
                    <button type="submit" className={ghostButtonClass}>
                      Đánh dấu mới
                    </button>
                  </form>
                ) : null}

                {message.status !== "spam" ? (
                  <form action={setContactStatusAction}>
                    <input type="hidden" name="messageId" value={message.id} />
                    <input type="hidden" name="status" value="spam" />
                    <input type="hidden" name="returnTo" value={currentQuery} />
                    <button type="submit" className={ghostButtonClass}>
                      Spam
                    </button>
                  </form>
                ) : null}

                <form action={deleteContactMessageAction} className="ml-auto">
                  <input type="hidden" name="messageId" value={message.id} />
                  <input type="hidden" name="returnTo" value={currentQuery} />
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

      <Pagination
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        status={status}
        q={q}
      />
    </div>
  );
}

function buildQuery(params: {
  status?: string;
  q?: string;
  page?: number;
}): string {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));

  const qs = search.toString();
  return `/admin/messages${qs ? `?${qs}` : ""}`;
}

function StatusChip({
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
      <span className="rounded-full bg-surface-warm px-1.5 text-[11px] text-sage">
        {count}
      </span>
    </Link>
  );
}

function Pagination({
  page,
  totalPages,
  status,
  q,
}: {
  page: number;
  totalPages: number;
  status?: string;
  q?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-sage">
        Trang {page} / {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={buildQuery({ status, q, page: page - 1 })}
            className={ghostButtonClass}
          >
            Trước
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={buildQuery({ status, q, page: page + 1 })}
            className={ghostButtonClass}
          >
            Sau
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
