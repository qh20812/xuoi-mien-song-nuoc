import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdminPage } from "@/lib/auth/session";
import { formatDateVN, formatDateTimeVN, formatVnd } from "@/lib/format";
import {
  ADMIN_ORDER_STATUSES,
  isAdminOrderStatus,
  listAdminOrders,
} from "@/server/booking/admin-queries";

export const metadata = {
  title: "Đơn hàng | Quản trị Xuôi Miền Sông Nước",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Chờ xác nhận",
  pending: "Đang liên hệ",
  confirmed: "Đã xác nhận",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
  expired: "Hết hạn",
};

function buildHref(
  filters: { status?: string; q?: string },
  page: number,
): string {
  const search = new URLSearchParams();
  if (filters.status) search.set("status", filters.status);
  if (filters.q) search.set("q", filters.q);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireAdminPage("/admin/orders");

  const params = await searchParams;
  const status = isAdminOrderStatus(params.status) ? params.status : undefined;
  const q = typeof params.q === "string" ? params.q.trim() : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const result = await listAdminOrders({ status, q, page });
  const filters = { status, q };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Đơn đặt chỗ</h1>
        <span className="text-sm text-muted-foreground">{result.pagination.total} đơn</span>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Trạng thái
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="">Tất cả</option>
            {ADMIN_ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value] ?? value}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Tìm kiếm
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Mã đơn / SĐT / tên khách"
            className="w-56 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          />
        </label>

        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Lọc
        </button>
        <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
          Xoá lọc
        </Link>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Mã đơn</th>
              <th className="px-3 py-2 font-medium">Khách</th>
              <th className="px-3 py-2 font-medium">Tour</th>
              <th className="px-3 py-2 font-medium">Khởi hành</th>
              <th className="px-3 py-2 font-medium">Khách</th>
              <th className="px-3 py-2 font-medium">Tiền</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
              <th className="px-3 py-2 font-medium">Tạo lúc</th>
            </tr>
          </thead>
          <tbody>
            {result.orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                  Không có đơn phù hợp.
                </td>
              </tr>
            ) : (
              result.orders.map((order) => (
                <tr key={order.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {order.code}
                    </Link>
                    {order.holdExpired ? (
                      <span className="mt-0.5 block text-xs text-rose-600">Quá hạn giữ chỗ</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    {order.contactName}
                    <span className="block text-xs text-muted-foreground">{order.phone}</span>
                  </td>
                  <td className="px-3 py-2">{order.tour.code}</td>
                  <td className="px-3 py-2">{formatDateVN(order.departure.date)}</td>
                  <td className="px-3 py-2">{order.guests.seats}</td>
                  <td className="px-3 py-2">{formatVnd(order.totalAmount)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatDateTimeVN(order.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {result.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={buildHref(filters, page - 1)} className="hover:underline">
              ← Trang trước
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Trang {page}/{result.pagination.totalPages}
          </span>
          {page < result.pagination.totalPages ? (
            <Link href={buildHref(filters, page + 1)} className="hover:underline">
              Trang sau →
            </Link>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}
