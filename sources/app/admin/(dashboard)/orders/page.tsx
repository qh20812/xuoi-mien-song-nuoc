import Link from "next/link";
import { Search } from "lucide-react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HoldExpiredLabel, StatusBadge } from "@/components/admin/status-badge";
import { requireCapabilityPage } from "@/lib/auth/session";
import { can } from "@/server/auth/permissions";
import { statusLabel } from "@/lib/booking/status-labels";
import { formatDateVN, formatDateTimeVN, formatVndDisplay } from "@/lib/format";
import {
  ADMIN_ORDER_STATUSES,
  isAdminOrderAssignee,
  isAdminOrderStatus,
  listAdminOrders,
} from "@/server/booking/admin-queries";

export const instant = false;

export const metadata = {
  title: "Đơn hàng | Quản trị Xuôi Miền Sông Nước",
};

function buildHref(
  filters: { status?: string; q?: string; assignee?: string },
  page: number,
): string {
  const search = new URLSearchParams();
  if (filters.status) search.set("status", filters.status);
  if (filters.q) search.set("q", filters.q);
  if (filters.assignee) search.set("assignee", filters.assignee);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

const fieldClass =
  "h-10 rounded-[10px] border border-line bg-surface text-[13px] text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; assignee?: string }>;
}) {
  const admin = await requireCapabilityPage("orders:read", "/admin/orders");
  if (!admin) return <AccessDenied />;

  const canExport = can(admin.role, "orders:export");

  const params = await searchParams;
  const status = isAdminOrderStatus(params.status) ? params.status : undefined;
  const q = typeof params.q === "string" ? params.q.trim() : undefined;
  const assignee = isAdminOrderAssignee(params.assignee) ? params.assignee : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const result = await listAdminOrders({
    status,
    q,
    page,
    assignee,
    viewerId: admin.id,
  });
  const filters = { status, q, assignee };
  const hasFilter = Boolean(status || q || assignee);

  const exportQuery = new URLSearchParams({
    ...(status ? { status } : {}),
    ...(q ? { q } : {}),
    ...(assignee ? { assignee } : {}),
  }).toString();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Quản trị", href: "/admin" }, { label: "Đơn hàng" }]}
        title="Đơn đặt chỗ"
        actions={
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-sage">{result.pagination.total} đơn</span>
            {canExport ? (
              <a
                href={`/api/admin/orders/export${exportQuery ? `?${exportQuery}` : ""}`}
                className="inline-flex h-10 items-center rounded-[10px] border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
              >
                Xuất CSV
              </a>
            ) : null}
          </div>
        }
      />

      <form
        method="get"
        className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 md:flex-row md:items-end"
      >
        <div className="flex w-full flex-col gap-1.5 md:w-[200px] md:shrink-0">
          <label htmlFor="filter-status" className="text-[12px] font-semibold text-sage">
            Trạng thái
          </label>
          <select
            id="filter-status"
            name="status"
            defaultValue={status ?? ""}
            className={`${fieldClass} px-3`}
          >
            <option value="">Tất cả</option>
            {ADMIN_ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full flex-col gap-1.5 md:w-[280px] md:shrink-0">
          <label htmlFor="filter-q" className="text-[12px] font-semibold text-sage">
            Tìm kiếm
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sage"
            />
            <input
              id="filter-q"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Mã đơn / SĐT / tên khách"
              className={`${fieldClass} w-full pr-3 pl-9`}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-1.5 md:w-[190px] md:shrink-0">
          <label htmlFor="filter-assignee" className="text-[12px] font-semibold text-sage">
            Phân công
          </label>
          <select
            id="filter-assignee"
            name="assignee"
            defaultValue={assignee ?? ""}
            className={`${fieldClass} px-3`}
          >
            <option value="">Tất cả</option>
            <option value="me">Của tôi</option>
            <option value="unassigned">Chưa giao</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="h-10 rounded-[10px] bg-clay px-4 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
          >
            Lọc
          </button>
          <Link
            href="/admin/orders"
            className="text-[13px] font-medium text-sage transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
          >
            Xoá lọc
          </Link>
        </div>
      </form>

      {result.orders.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface py-12 text-center">
          {hasFilter ? (
            <>
              <p className="text-[13px] text-sage">Không có đơn phù hợp.</p>
              <Link
                href="/admin/orders"
                className="mt-2 inline-block text-[13px] font-medium text-clay underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
              >
                Xoá bộ lọc
              </Link>
            </>
          ) : (
            <p className="text-[13px] text-sage">Chưa có đơn nào.</p>
          )}
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface xl:block">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line bg-surface-warm">
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                    Mã đơn
                  </th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                    Khách
                  </th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                    Tour
                  </th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                    Khởi hành
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-[12px] font-semibold text-sage"
                  >
                    Số khách
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-[12px] font-semibold text-sage"
                  >
                    Tiền
                  </th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                    Tạo lúc
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.orders.map((order) => (
                  <tr key={order.id} className="h-[52px] transition-colors hover:bg-surface-warm/50">
                    <td className="px-4 py-2.5 align-middle">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-[13px] text-ink hover:underline focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
                      >
                        {order.code}
                      </Link>
                      {order.holdExpired ? <HoldExpiredLabel className="mt-1 block" /> : null}
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className="block font-medium text-ink">{order.contactName}</span>
                      <span className="mt-0.5 block text-[12px] text-sage tabular-nums">
                        {order.phone}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-middle font-mono text-[13px] text-ink">
                      {order.tour.code}
                    </td>
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap tabular-nums text-ink">
                      {formatDateVN(order.departure.date)}
                    </td>
                    <td className="px-4 py-2.5 text-right align-middle tabular-nums text-ink">
                      {order.guests.seats}
                    </td>
                    <td className="px-4 py-2.5 text-right align-middle font-medium whitespace-nowrap tabular-nums text-ink">
                      {formatVndDisplay(order.totalAmount)}
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap text-[12px] text-sage tabular-nums">
                      {formatDateTimeVN(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 xl:hidden">
            {result.orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[13px] text-ink">{order.code}</span>
                  <StatusBadge status={order.status} />
                </span>
                {order.holdExpired ? <HoldExpiredLabel className="mt-1 block" /> : null}
                <span className="mt-2 block text-[13px] font-medium text-ink">
                  {order.contactName}
                  <span className="ml-2 text-[12px] font-normal text-sage tabular-nums">
                    {order.phone}
                  </span>
                </span>
                <span className="mt-1 flex items-center justify-between gap-2 text-[12px] text-sage">
                  <span>
                    {order.tour.code} · {formatDateVN(order.departure.date)} ·{" "}
                    {order.guests.seats} khách
                  </span>
                  <span className="font-medium whitespace-nowrap tabular-nums text-ink">
                    {formatVndDisplay(order.totalAmount)}
                  </span>
                </span>
                <span className="mt-1 block text-[12px] text-sage tabular-nums">
                  Tạo lúc {formatDateTimeVN(order.createdAt)}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {result.pagination.totalPages > 1 ? (
        <nav
          aria-label="Phân trang đơn hàng"
          className="flex items-center justify-between text-[13px]"
        >
          {page > 1 ? (
            <Link
              href={buildHref(filters, page - 1)}
              className="font-medium text-ink transition-colors hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
            >
              ← Trang trước
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          <span className="text-sage tabular-nums">
            Trang {page}/{result.pagination.totalPages}
          </span>
          {page < result.pagination.totalPages ? (
            <Link
              href={buildHref(filters, page + 1)}
              className="font-medium text-ink transition-colors hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
            >
              Trang sau →
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
        </nav>
      ) : null}
    </div>
  );
}
