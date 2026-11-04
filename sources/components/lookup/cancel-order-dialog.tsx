"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, LoaderCircle, X } from "lucide-react";
import type { PublicOrder } from "@/lib/contracts/order";
import { formatLongDateVN, formatVndDisplay } from "@/lib/format";

type CancelOrderDialogProps = {
  order: PublicOrder;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

const REASONS = [
  "Thay đổi kế hoạch cá nhân",
  "Trùng lịch đột xuất",
  "Đã chọn chuyến đi khác",
  "Lý do sức khỏe hoặc gia đình",
  "Lý do khác",
];

export function CancelOrderDialog({
  order,
  submitting,
  error,
  onClose,
  onConfirm,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState(REASONS[0]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(submitting);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const node = dialogRef.current;
    const focusableSelector =
      'button:not([disabled]), select:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

    node?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submittingRef.current) {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const elements = Array.from(
        node?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );
      if (elements.length === 0) return;

      const first = elements[0]!;
      const last = elements[elements.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
        className="relative flex w-full max-w-xl flex-col rounded-[20px] border border-line bg-surface p-5 shadow-[0_24px_70px_-28px_rgba(23,51,43,0.5)] md:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          data-autofocus
          aria-label="Đóng hộp thoại"
          className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full text-sage transition-colors hover:bg-canvas hover:text-ink disabled:opacity-50"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        <span className="flex size-11 items-center justify-center rounded-[12px] bg-danger/10 text-danger">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </span>
        <h2
          id="cancel-dialog-title"
          className="mt-4 font-display text-2xl font-semibold text-ink"
        >
          Xác nhận hủy đơn giữ chỗ?
        </h2>
        <div
          id="cancel-dialog-description"
          className="mt-3 text-sm leading-6 text-sage"
        >
          <p>
            Đơn <strong className="font-mono text-ink">{order.code}</strong> cho tour{" "}
            <strong className="text-ink">{order.tour.name}</strong> ngày{" "}
            <strong className="text-ink">
              {formatLongDateVN(order.departure.date)}
            </strong>{" "}
            sẽ được hủy.
          </p>
          <p className="mt-2">
            {order.guests.seats} chỗ sẽ được mở lại. Nếu bạn đã đặt cọc, nhân viên
            sẽ liên hệ để xử lý theo chính sách hoàn cọc.
          </p>
          <p className="mt-3 flex items-baseline justify-between gap-4 rounded-[10px] bg-canvas p-3 text-xs">
            <span>Tổng tạm tính</span>
            <span className="font-mono font-semibold text-ink">
              {formatVndDisplay(order.pricing.totalAmount)}
            </span>
          </p>
        </div>

        <div className="mt-5">
          <label
            htmlFor="cancel-reason"
            className="mb-2 block text-sm font-semibold text-ink"
          >
            Lý do hủy{" "}
            <span className="text-xs font-normal text-sage">(tùy chọn)</span>
          </label>
          <select
            id="cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={submitting}
            className="h-12 w-full rounded-[10px] border border-line bg-surface px-4 text-base text-ink outline-none transition-colors focus:border-clay focus:ring-2 focus:ring-clay/20"
          >
            {REASONS.map((reasonOption) => (
              <option key={reasonOption} value={reasonOption}>
                {reasonOption}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-[8px] bg-danger/5 p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-line px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas disabled:opacity-50"
          >
            Giữ lại đơn
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={submitting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-danger px-5 text-sm font-semibold text-white transition-colors hover:bg-danger/90 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                Đang hủy
              </>
            ) : (
              "Xác nhận hủy đơn"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
