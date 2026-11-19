import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderActions } from "@/components/admin/order-actions";
import { HoldExpiredLabel, StatusBadge } from "@/components/admin/status-badge";
import { requireCapabilityPage } from "@/lib/auth/session";
import { statusLabel } from "@/lib/booking/status-labels";
import { formatDateVN, formatDateTimeVN, formatVndDisplay } from "@/lib/format";
import { can } from "@/server/auth/permissions";
import { listAssignableAdmins } from "@/server/booking/admin-order-notes";
import { getAdminOrderById } from "@/server/booking/admin-update-order";
import { BookingError } from "@/server/booking/errors";
import {
  assignOrderAction,
  saveAdminNoteAction,
  updateOrderAction,
} from "./actions";

export const metadata = {
  title: "Chi tiết đơn | Quản trị Xuôi Miền Sông Nước",
};

const SOURCE_LABELS: Record<string, string> = {
  web: "Website",
  zalo: "Zalo",
  phone: "Điện thoại",
  facebook: "Facebook",
};

function SectionCard({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[12px] font-semibold text-sage">{label}</dt>
      <dd className="mt-1 text-[14px] leading-relaxed text-ink">{children || "—"}</dd>
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
  const admin = await requireCapabilityPage("orders:read", "/admin/orders");
  if (!admin) return <AccessDenied />;

  const canWrite = can(admin.role, "orders:write");
  const assignees = canWrite ? await listAssignableAdmins() : [];

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

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[
          { label: "Quản trị", href: "/admin" },
          { label: "Đơn hàng", href: "/admin/orders" },
          { label: order.code },
        ]}
        title={order.code}
        titleClassName="font-mono text-[24px] tracking-[-0.01em] sm:text-[26px]"
        description={
          order.status === "new" && order.holdExpiresAt
            ? `Giữ chỗ đến ${formatDateTimeVN(order.holdExpiresAt)}`
            : undefined
        }
        actions={
          <>
            <StatusBadge status={order.status} />
            {order.holdExpired ? <HoldExpiredLabel /> : null}
          </>
        }
      />

      {error ? (
        <p
          role="alert"
          className="rounded-[8px] border border-danger/20 bg-danger/10 px-3 py-2.5 text-[13px] font-medium text-danger"
        >
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <SectionCard title="Khách đặt">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Người đặt">{order.contactName}</Field>
              <Field label="Điện thoại">
                <a
                  href={`tel:${order.phone.replace(/\s/g, "")}`}
                  className="font-medium text-ink underline-offset-4 hover:text-clay hover:underline focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
                >
                  {order.phone}
                </a>
              </Field>
              <Field label="Email">{order.email}</Field>
              <Field label="Điểm đón">{order.pickupPoint}</Field>
              <Field label="Tạo lúc">{formatDateTimeVN(order.createdAt)}</Field>
              <Field label="Nguồn">{SOURCE_LABELS[order.source] ?? order.source}</Field>
              <Field label="Ghi chú của khách" className="sm:col-span-2">
                {order.customerNote}
              </Field>
            </dl>
          </SectionCard>

          <SectionCard title="Chuyến đi">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Tour" className="sm:col-span-2">
                <span className="font-mono text-[13px] text-clay">{order.tour.code}</span>
                <span className="mt-0.5 block font-medium">{order.tour.name}</span>
              </Field>
              <Field label="Khởi hành">{formatDateVN(order.departure.date)}</Field>
              <Field label="Kết thúc">{formatDateVN(order.departure.returnDate)}</Field>
              <Field label="Điểm hẹn" className="sm:col-span-2">
                {order.departure.meetingPoint}
              </Field>
              <Field label="Người lớn">{order.guests.adults}</Field>
              <Field label="Trẻ em">{order.guests.children}</Field>
              <Field label="Em bé">
                {order.guests.infants}
                <span className="mt-0.5 block text-[12px] text-sage">
                  Em bé vẫn chiếm chỗ, miễn phí.
                </span>
              </Field>
              <Field label="Tổng chỗ">{order.guests.seats}</Field>
            </dl>
          </SectionCard>

          <SectionCard
            title="Hành khách"
            aside={<span className="text-[12px] text-sage">{order.passengers.length} hành khách</span>}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="py-2 pr-3 text-[12px] font-semibold text-sage">
                      #
                    </th>
                    <th scope="col" className="py-2 pr-3 text-[12px] font-semibold text-sage">
                      Họ tên
                    </th>
                    <th scope="col" className="py-2 pr-3 text-[12px] font-semibold text-sage">
                      Loại
                    </th>
                    <th scope="col" className="py-2 pr-3 text-[12px] font-semibold text-sage">
                      Năm sinh
                    </th>
                    <th scope="col" className="py-2 text-[12px] font-semibold text-sage">
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {order.passengers.map((passenger, index) => (
                    <tr key={`${passenger.fullName ?? "khach"}-${index}`}>
                      <td className="py-2.5 pr-3 tabular-nums text-sage">{index + 1}</td>
                      <td className="py-2.5 pr-3 font-medium text-ink">
                        {passenger.fullName ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-ink">{passenger.typeLabel}</td>
                      <td className="py-2.5 pr-3 tabular-nums text-ink">
                        {passenger.birthYear ?? "—"}
                      </td>
                      <td className="py-2.5 text-sage">{passenger.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:col-span-4">
          <SectionCard title="Chi phí">
            <dl className="flex flex-col gap-3 text-[13px]">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sage">Người lớn</dt>
                <dd className="whitespace-nowrap tabular-nums text-ink">
                  {formatVndDisplay(order.pricing.unitPriceAdult)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sage">Trẻ em</dt>
                <dd className="whitespace-nowrap tabular-nums text-ink">
                  {formatVndDisplay(order.pricing.unitPriceChild)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sage">Phụ thu</dt>
                <dd className="whitespace-nowrap tabular-nums text-ink">
                  {formatVndDisplay(order.pricing.surcharge)}
                </dd>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line pt-3">
                <dt className="text-[14px] font-semibold text-ink">Tổng cộng</dt>
                <dd className="whitespace-nowrap font-mono text-[20px] font-semibold tabular-nums text-ink">
                  {formatVndDisplay(order.pricing.totalAmount)}
                </dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Hành động">
            {canWrite ? (
              <OrderActions
                orderId={order.id}
                status={order.status}
                updateOrder={updateOrderAction}
              />
            ) : (
              <p className="text-[13px] leading-6 text-sage">
                Tài khoản của bạn chỉ có quyền xem đơn, không đổi được trạng thái.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Nội bộ">
            {canWrite ? (
              <div className="flex flex-col gap-4">
                <form action={assignOrderAction} className="flex flex-col gap-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <label
                    htmlFor="assignee"
                    className="text-[12px] font-semibold text-sage"
                  >
                    Người phụ trách
                  </label>
                  <select
                    id="assignee"
                    name="assigneeId"
                    defaultValue={order.assignedAdmin?.id ?? ""}
                    className="h-10 rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
                  >
                    <option value="">Chưa giao</option>
                    {assignees.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="h-9 self-start rounded-[10px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
                  >
                    Lưu phân công
                  </button>
                </form>

                <form
                  action={saveAdminNoteAction}
                  className="flex flex-col gap-2 border-t border-line pt-3"
                >
                  <input type="hidden" name="orderId" value={order.id} />
                  <label
                    htmlFor="adminNote"
                    className="text-[12px] font-semibold text-sage"
                  >
                    Ghi chú nội bộ
                  </label>
                  <textarea
                    id="adminNote"
                    name="adminNote"
                    rows={4}
                    maxLength={2000}
                    defaultValue={order.adminNote ?? ""}
                    placeholder="Khách hẹn gọi lại, cần xe 7 chỗ…"
                    className="w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] leading-6 text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-9 self-start rounded-[10px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
                  >
                    Lưu ghi chú
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-2 text-[13px] leading-6 text-sage">
                <p>
                  Phụ trách:{" "}
                  <span className="font-medium text-ink">
                    {order.assignedAdmin?.name ?? "chưa giao"}
                  </span>
                </p>
                <p className="whitespace-pre-line">
                  {order.adminNote || "Chưa có ghi chú nội bộ."}
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Chính sách huỷ">
            <p className="text-[12px] leading-relaxed text-sage">
              {order.cancellation.policy || "—"}
            </p>
            <p className="mt-2 text-[12px] text-sage">
              Hạn tự huỷ của khách:{" "}
              <span className="font-medium whitespace-nowrap tabular-nums text-ink">
                {formatDateVN(order.cancellation.deadline)}
              </span>
            </p>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Lịch sử trạng thái"
        aside={
          <span className="text-[12px] text-sage">{order.statusHistory.length} ghi nhận</span>
        }
      >
        {order.statusHistory.length === 0 ? (
          <p className="text-[13px] text-sage">Chưa có ghi nhận nào.</p>
        ) : (
          <ol className="relative flex flex-col gap-5 border-l border-line pl-6">
            {order.statusHistory.map((row, index) => (
              <li key={`${row.createdAt}-${index}`} className="relative">
                <span
                  aria-hidden="true"
                  className={`absolute top-1.5 -left-[29px] size-2 rounded-full ring-4 ring-surface ${
                    index === 0 ? "bg-clay" : "bg-ink/30"
                  }`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <time className="text-[12px] tabular-nums text-sage">
                    {formatDateTimeVN(row.createdAt)}
                  </time>
                  <StatusBadge status={row.toStatus} />
                  {row.fromStatus ? (
                    <span className="text-[12px] text-sage">
                      {statusLabel(row.fromStatus)} →
                    </span>
                  ) : null}
                </div>
                {row.note ? (
                  <p className="mt-1 text-[13px] leading-relaxed text-ink">{row.note}</p>
                ) : null}
                <p className="mt-0.5 text-[12px] text-sage">
                  {row.changedBy ? `bởi quản trị viên #${row.changedBy}` : "Hệ thống tự động"}
                </p>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <p className="text-[12px] text-sage">
        <Link
          href="/admin/orders"
          className="font-medium underline-offset-4 hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
        >
          ← Về danh sách đơn
        </Link>
      </p>
    </div>
  );
}
