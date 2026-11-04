import {
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock3,
  Mail,
  MapPin,
  User,
  Users,
} from "lucide-react";
import { HoldCountdown } from "@/components/booking/hold-countdown";
import { OrderStatusBadge } from "@/components/lookup/order-status-badge";
import type { PublicOrder } from "@/lib/contracts/order";
import {
  formatDateTimeLongVN,
  formatLongDateVN,
  formatVndDisplay,
} from "@/lib/format";
import { daysUntilDeparture, parseDateOnly } from "@/lib/time";

type LookupResultProps = {
  order: PublicOrder;
  onRequestCancel: () => void;
};

export function LookupResult({ order, onRequestCancel }: LookupResultProps) {
  const daysLeft = daysUntilDeparture(parseDateOnly(order.departure.date));
  const isCancelled = order.status === "cancelled";
  const isExpired = order.status === "expired";
  const hasActiveHold =
    order.status === "new" && Boolean(order.holdExpiresAt);
  const canCancel =
    order.cancellation.canCancel &&
    ["new", "pending", "confirmed"].includes(order.status);

  return (
    <article className="overflow-hidden rounded-[20px] border border-line bg-surface">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-5 md:flex-row md:items-center md:p-7">
        <div>
          <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-sage uppercase">
            Mã đơn
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="rounded border border-line bg-surface-warm px-2.5 py-1 font-mono text-sm font-semibold text-ink">
              {order.code}
            </span>
            <span className="text-xs text-sage">
              Tạo lúc {formatDateTimeLongVN(order.createdAt)}
            </span>
          </div>
        </div>
        <OrderStatusBadge status={order.status} label={order.statusLabel} />
      </div>

      <div className="grid grid-cols-1 gap-8 border-b border-line p-5 md:p-7 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-clay uppercase">
            {order.tour.code}
          </span>
          <h2
            id="lookup-result-heading"
            tabIndex={-1}
            className="mt-1 font-display text-2xl leading-tight font-semibold text-ink outline-none"
          >
            {order.tour.name}
          </h2>
          <p className="mt-1 text-sm text-sage">
            {order.tour.durationDays} ngày {order.tour.durationNights} đêm
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <CalendarDays
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-sage"
              />
              <div>
                <span className="block text-[0.7rem] text-sage">
                  Ngày khởi hành
                </span>
                <span className="block text-sm font-semibold text-ink">
                  {formatLongDateVN(order.departure.date)}
                </span>
                {!isCancelled && !isExpired && daysLeft >= 0 ? (
                  <span className="mt-0.5 block text-xs text-success">
                    {daysLeft === 0
                      ? "Khởi hành hôm nay"
                      : `Còn ${daysLeft} ngày tới khởi hành`}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-sage"
              />
              <div>
                <span className="block text-[0.7rem] text-sage">Điểm đón</span>
                <span className="block text-sm font-medium text-ink">
                  {order.pickupPoint ?? order.departure.meetingPoint ?? "Chưa cập nhật"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-sage"
              />
              <div>
                <span className="block text-[0.7rem] text-sage">
                  Người đại diện
                </span>
                <span className="block text-sm font-semibold text-ink">
                  {order.contactName}
                </span>
                <span className="mt-0.5 block font-mono text-xs text-sage">
                  {order.phoneMasked}
                </span>
              </div>
            </div>

            {order.email ? (
              <div className="flex items-start gap-2.5">
                <Mail
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-sage"
                />
                <div>
                  <span className="block text-[0.7rem] text-sage">Email</span>
                  <span className="block break-all text-sm text-ink">
                    {order.email}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {order.customerNote ? (
            <p className="mt-5 rounded-[10px] bg-canvas p-3 text-sm leading-6 text-sage">
              <span className="font-semibold text-ink">Ghi chú:</span>{" "}
              {order.customerNote}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col justify-between rounded-[14px] border border-line bg-canvas p-4 lg:col-span-5">
          <div>
            <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-sage uppercase">
              Chi tiết suất đặt
            </span>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sage">
                  <Users aria-hidden="true" className="size-4" />
                  Số khách
                </span>
                <span className="text-right font-semibold text-ink">
                  {order.guests.adults} người lớn
                  {order.guests.children > 0
                    ? `, ${order.guests.children} trẻ em`
                    : ""}
                  {order.guests.infants > 0
                    ? `, ${order.guests.infants} em bé`
                    : ""}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sage">Số chỗ</span>
                <span className="font-semibold text-ink">
                  {order.guests.seats} chỗ
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <span className="block text-[0.7rem] text-sage">
                Tổng tạm tính
              </span>
              <span className="mt-1 block font-display text-2xl font-semibold text-clay tabular-nums">
                {formatVndDisplay(order.pricing.totalAmount)}
              </span>
            </div>
          </div>

          {hasActiveHold && order.holdExpiresAt ? (
            <div className="mt-4 rounded-[10px] border border-clay/20 bg-surface p-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Clock3 aria-hidden="true" className="size-4 text-clay" />
                Thời hạn giữ chỗ
              </span>
              <p className="mt-1 text-xs leading-5 text-sage">
                Còn <HoldCountdown holdExpiresAt={order.holdExpiresAt} /> · hết hạn
                lúc {formatDateTimeLongVN(order.holdExpiresAt)}.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-5 p-5 md:p-7 lg:flex-row lg:items-center">
        <div className="flex max-w-3xl items-start gap-3">
          {isCancelled || isExpired ? (
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-danger"
            />
          ) : (
            <CircleCheck
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-success"
            />
          )}
          <div>
            <p className="text-sm font-semibold text-ink">
              {isCancelled
                ? "Đơn đã được hủy"
                : isExpired
                  ? "Đơn đã hết hạn giữ chỗ"
                  : order.cancellation.canCancel
                    ? `Có thể tự hủy đến hết ngày ${formatLongDateVN(order.cancellation.deadline)}.`
                    : "Đã quá hạn tự hủy, vui lòng liên hệ hotline."}
            </p>
            <p className="mt-1 text-sm leading-6 text-sage">
              {isCancelled && order.cancelReason
                ? `Lý do: ${order.cancelReason}.`
                : order.cancellation.policy}
            </p>
          </div>
        </div>

        {canCancel ? (
          <button
            type="button"
            onClick={onRequestCancel}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-[10px] border border-danger px-5 text-sm font-semibold text-danger transition-colors hover:bg-danger/5 focus-visible:ring-2 focus-visible:ring-danger/30 focus-visible:outline-none"
          >
            Yêu cầu hủy đơn
          </button>
        ) : null}
      </div>
    </article>
  );
}
