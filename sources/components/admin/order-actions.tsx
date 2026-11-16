"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type OrderStatusValue = string;

type OrderActionsProps = {
  orderId: number;
  status: OrderStatusValue;
  updateOrder: (formData: FormData) => Promise<void>;
};

const CANCELLABLE = ["new", "pending", "confirmed"];

const VARIANTS = {
  primary:
    "bg-clay text-contrast-on-accent hover:bg-clay-hover focus-visible:ring-clay/40",
  secondary: "border border-line text-ink hover:bg-ink/5 focus-visible:ring-clay/40",
  danger: "border border-danger/40 text-danger hover:bg-danger/10 focus-visible:ring-danger/30",
} as const;

function SubmitButton({
  children,
  variant,
}: {
  children: ReactNode;
  variant: keyof typeof VARIANTS;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex h-10 w-full items-center justify-center rounded-[10px] px-4 text-[13px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none disabled:opacity-60",
        VARIANTS[variant],
      )}
    >
      {pending ? "Đang xử lý…" : children}
    </button>
  );
}

export function OrderActions({ orderId, status, updateOrder }: OrderActionsProps) {
  const [reason, setReason] = useState("");

  const canContact = status === "new";
  const canConfirm = status === "new" || status === "pending";
  const canComplete = status === "confirmed";
  const canCancel = CANCELLABLE.includes(status);

  if (!canContact && !canConfirm && !canComplete && !canCancel) {
    return (
      <p className="text-[13px] leading-relaxed text-sage">
        Đơn đã ở trạng thái cuối, không còn hành động nào.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {canContact ? (
        <form action={updateOrder}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="action" value="pending" />
          <SubmitButton variant="secondary">Đã liên hệ khách</SubmitButton>
        </form>
      ) : null}

      {canConfirm ? (
        <form action={updateOrder}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="action" value="confirm" />
          <SubmitButton variant="primary">Xác nhận đơn</SubmitButton>
        </form>
      ) : null}

      {canComplete ? (
        <form action={updateOrder}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="action" value="complete" />
          <SubmitButton variant="secondary">Đánh dấu hoàn thành</SubmitButton>
        </form>
      ) : null}

      {canCancel ? (
        <form action={updateOrder} className="mt-1 flex flex-col gap-2 border-t border-line pt-4">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="action" value="cancel" />
          <label htmlFor="cancel-reason" className="text-[12px] font-semibold text-sage">
            Lý do huỷ
          </label>
          <input
            id="cancel-reason"
            name="reason"
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Khách báo huỷ…"
            className="h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-sage focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
          />
          <SubmitButton variant="danger">Huỷ đơn</SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
