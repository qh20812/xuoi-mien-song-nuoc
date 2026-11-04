import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdminPage } from "@/lib/auth/session";
import { formatDateVN, formatVnd } from "@/lib/format";
import { countOrdersByStatus, listAdminOrders } from "@/server/booking/admin-queries";

export const metadata = {
  title: "Tổng quan | Quản trị Xuôi Miền Sông Nước",
};

const CARDS: Array<{ status: string; label: string; href: string }> = [
  { status: "new", label: "Chờ xác nhận", href: "/admin/orders?status=new" },
  { status: "pending", label: "Đang liên hệ", href: "/admin/orders?status=pending" },
  { status: "confirmed", label: "Đã xác nhận", href: "/admin/orders?status=confirmed" },
  { status: "cancelled", label: "Đã huỷ", href: "/admin/orders?status=cancelled" },
];

export default async function AdminDashboardPage() {
  await requireAdminPage("/admin");

  const [counts, recent] = await Promise.all([
    countOrdersByStatus(),
    listAdminOrders({ page: 1, pageSize: 8 }),
  ]);

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-xl font-semibold">Tổng quan đơn đặt chỗ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tổng {total} đơn. Đơn giữ chỗ tự hết hạn sau 24 giờ nếu chưa xác nhận.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CARDS.map((card) => (
            <Link
              key={card.status}
              href={card.href}
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-ring"
            >
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold">{counts[card.status] ?? 0}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Đơn mới nhất</h2>
          <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
            Xem tất cả →
          </Link>
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Mã đơn</th>
                <th className="px-3 py-2 font-medium">Khách</th>
                <th className="px-3 py-2 font-medium">Tour</th>
                <th className="px-3 py-2 font-medium">Khởi hành</th>
                <th className="px-3 py-2 font-medium">Tiền</th>
                <th className="px-3 py-2 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recent.orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    Chưa có đơn nào.
                  </td>
                </tr>
              ) : (
                recent.orders.map((order) => (
                  <tr key={order.id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {order.code}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {order.contactName}
                      <span className="block text-xs text-muted-foreground">{order.phone}</span>
                    </td>
                    <td className="px-3 py-2">{order.tour.code}</td>
                    <td className="px-3 py-2">{formatDateVN(order.departure.date)}</td>
                    <td className="px-3 py-2">{formatVnd(order.totalAmount)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
