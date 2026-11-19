import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HoldExpiredLabel, StatusBadge } from "@/components/admin/status-badge";
import { requireCapabilityPage } from "@/lib/auth/session";
import { formatDateVN, formatVndDisplay } from "@/lib/format";
import { countOrdersByStatus, listAdminOrders } from "@/server/booking/admin-queries";
import { getSiteSettings } from "@/server/settings/get-site-settings";

export const instant = false;

export const metadata = {
  title: "Tổng quan | Quản trị Xuôi Miền Sông Nước",
};

const KPI_CARDS = [
  { status: "new", label: "Chờ xác nhận" },
  { status: "pending", label: "Đang liên hệ" },
  { status: "confirmed", label: "Đã xác nhận" },
  { status: "cancelled", label: "Đã huỷ" },
] as const;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const admin = await requireCapabilityPage("orders:read", "/admin");
  if (!admin) return <AccessDenied />;

  const { denied } = await searchParams;

  const [counts, recent, settings] = await Promise.all([
    countOrdersByStatus(),
    listAdminOrders({ page: 1, pageSize: 8 }),
    getSiteSettings(),
  ]);

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const orders = recent.orders;

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        breadcrumb={[{ label: "Quản trị" }, { label: "Tổng quan" }]}
        title="Tổng quan đơn đặt chỗ"
        description={`Tổng ${total} đơn. Đơn giữ chỗ tự hết hạn sau ${settings.booking.holdHours} giờ nếu chưa xác nhận.`}
      />

      {denied ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger"
        >
          Tài khoản của bạn không có quyền thực hiện thao tác vừa rồi.
        </p>
      ) : null}

      <section aria-label="Số liệu theo trạng thái" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPI_CARDS.map((card) => {
          const count = counts[card.status] ?? 0;

          return (
            <Link
              key={card.status}
              href={`/admin/orders?status=${card.status}`}
              className="group rounded-xl border border-line bg-surface p-5 transition-colors hover:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="text-[13px] font-medium text-sage">{card.label}</span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-sage transition-colors group-hover:text-clay"
                />
              </span>
              <span
                className={`mt-3 block font-display text-[32px] leading-none font-medium tabular-nums ${
                  count === 0 ? "text-sage" : "text-ink"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-ink">Đơn mới nhất</h2>
          <Link
            href="/admin/orders"
            className="text-[13px] font-medium text-sage transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
          >
            Xem tất cả →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface py-12 text-center">
            <p className="text-[13px] text-sage">Chưa có đơn nào.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface md:block">
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
                      Tiền
                    </th>
                    <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders.map((order) => (
                    <tr key={order.id} className="h-[52px] transition-colors hover:bg-surface-warm/50">
                      <td className="px-4 py-2.5 align-middle">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-[13px] text-ink hover:underline focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
                        >
                          {order.code}
                        </Link>
                        {order.holdExpired ? (
                          <HoldExpiredLabel className="mt-1 block" />
                        ) : null}
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
                      <td className="px-4 py-2.5 text-right align-middle font-medium whitespace-nowrap tabular-nums text-ink">
                        {formatVndDisplay(order.totalAmount)}
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[13px] text-ink">{order.code}</span>
                    <StatusBadge status={order.status} />
                  </span>
                  {order.holdExpired ? (
                    <HoldExpiredLabel className="mt-1 block" />
                  ) : null}
                  <span className="mt-2 block text-[13px] font-medium text-ink">
                    {order.contactName}
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-[12px] text-sage">
                    <span>
                      {order.tour.code} · {formatDateVN(order.departure.date)}
                    </span>
                    <span className="font-medium whitespace-nowrap tabular-nums text-ink">
                      {formatVndDisplay(order.totalAmount)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
