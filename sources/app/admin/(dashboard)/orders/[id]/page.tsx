import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdminPage } from "@/lib/auth/session";
import { formatDateVN, formatDateTimeVN, formatVnd } from "@/lib/format";
import { getAdminOrderById } from "@/server/booking/admin-update-order";
import { BookingError } from "@/server/booking/errors";
import { updateOrderAction } from "./actions";

export const metadata = {
  title: "Chi tiết đơn | Quản trị Xuôi Miền Sông Nước",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminPage("/admin/orders");

  const { id } = await params;
  const { error } = await searchParams;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();

  let order;
  try {
    order = await getAdminOrderById(orderId);
  } catch (caught) {
    if (caught instanceof BookingError && caught.status === 404) notFound();
    throw caught;
  }

  const canCancel = ["new", "pending", "confirmed"].includes(order.status);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
          ← Danh sách đơn
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{order.code}</h1>
          <StatusBadge status={order.status} />
          {order.holdExpired ? (
            <span className="text-sm font-medium text-rose-600">Quá hạn giữ chỗ</span>
          ) : null}
        </div>
        {order.holdExpiresAt && order.status === "new" ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Giữ chỗ đến {formatDateTimeVN(order.holdExpiresAt)}
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-6 rounded-lg border border-border bg-card p-4 md:grid-cols-2">
        <dl className="grid grid-cols-2 gap-4">
          <Field label="Người đặt">{order.contactName}</Field>
          <Field label="Điện thoại">{order.phone}</Field>
          <Field label="Email">{order.email ?? "—"}</Field>
          <Field label="Điểm đón">{order.pickupPoint ?? "—"}</Field>
          <Field label="Tạo lúc">{formatDateTimeVN(order.createdAt)}</Field>
          <Field label="Nguồn">{order.source}</Field>
          <div className="col-span-2">
            <Field label="Ghi chú của khách">{order.customerNote ?? "—"}</Field>
          </div>
        </dl>

        <dl className="grid grid-cols-2 gap-4">
          <Field label="Tour">
            {order.tour.code} — {order.tour.name}
          </Field>
          <Field label="Khởi hành">{formatDateVN(order.departure.date)}</Field>
          <Field label="Kết thúc">{formatDateVN(order.departure.returnDate)}</Field>
          <Field label="Điểm hẹn">{order.departure.meetingPoint ?? "—"}</Field>
          <Field label="Người lớn">{order.guests.adults}</Field>
          <Field label="Trẻ em">{order.guests.children}</Field>
          <Field label="Em bé">{order.guests.infants}</Field>
          <Field label="Tổng chỗ">{order.guests.seats}</Field>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Chi phí</h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Người lớn">{formatVnd(order.pricing.unitPriceAdult)}</Field>
          <Field label="Trẻ em">{formatVnd(order.pricing.unitPriceChild)}</Field>
          <Field label="Phụ thu">{formatVnd(order.pricing.surcharge)}</Field>
          <Field label="Tổng cộng">
            <span className="font-semibold">{formatVnd(order.pricing.totalAmount)}</span>
          </Field>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Hành khách</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 font-medium">#</th>
                <th className="py-1 font-medium">Họ tên</th>
                <th className="py-1 font-medium">Loại</th>
                <th className="py-1 font-medium">Năm sinh</th>
                <th className="py-1 font-medium">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {order.passengers.map((passenger, index) => (
                <tr key={index} className="border-t border-border/60">
                  <td className="py-1.5">{index + 1}</td>
                  <td className="py-1.5">{passenger.fullName ?? "—"}</td>
                  <td className="py-1.5">{passenger.typeLabel}</td>
                  <td className="py-1.5">{passenger.birthYear ?? "—"}</td>
                  <td className="py-1.5">{passenger.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Hành động</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          {order.status === "new" ? (
            <form action={updateOrderAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="action" value="pending" />
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Đã liên hệ khách
              </button>
            </form>
          ) : null}

          {order.status === "new" || order.status === "pending" ? (
            <form action={updateOrderAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="action" value="confirm" />
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                Xác nhận đơn
              </button>
            </form>
          ) : null}

          {order.status === "confirmed" ? (
            <form action={updateOrderAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="action" value="complete" />
              <button
                type="submit"
                className="rounded-md bg-zinc-700 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                Đánh dấu hoàn thành
              </button>
            </form>
          ) : null}

          {canCancel ? (
            <form action={updateOrderAction} className="flex items-end gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="action" value="cancel" />
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Lý do huỷ
                <input
                  name="reason"
                  placeholder="Khách báo huỷ…"
                  className="w-56 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                />
              </label>
              <button
                type="submit"
                className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
              >
                Huỷ đơn
              </button>
            </form>
          ) : null}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Chính sách: {order.cancellation.policy ?? "—"} Hạn tự huỷ của khách là{" "}
          {formatDateVN(order.cancellation.deadline)}.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Lịch sử trạng thái</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {order.statusHistory.map((row, index) => (
            <li key={index} className="flex gap-3 text-sm">
              <span className="w-36 shrink-0 text-muted-foreground">
                {formatDateTimeVN(row.createdAt)}
              </span>
              <span>
                {row.fromStatus ? `${row.fromStatus} → ` : ""}
                <strong>{row.toStatus}</strong>
                {row.note ? ` — ${row.note}` : ""}
                {row.changedBy ? (
                  <span className="text-muted-foreground"> (admin #{row.changedBy})</span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
