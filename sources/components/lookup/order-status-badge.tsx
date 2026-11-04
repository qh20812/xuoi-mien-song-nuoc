import type { OrderStatus } from "@/lib/contracts/order";
import { cn } from "@/lib/utils";

type OrderStatusBadgeProps = {
  status: OrderStatus;
  label: string;
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  new: "bg-warning/10 text-warning",
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
  expired: "bg-surface-warm text-sage",
};

const STATUS_DOTS: Record<OrderStatus, string> = {
  new: "bg-warning",
  pending: "bg-warning",
  confirmed: "bg-success",
  completed: "bg-success",
  cancelled: "bg-danger",
  expired: "bg-sage",
};

export function OrderStatusBadge({ status, label }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
        STATUS_STYLES[status],
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", STATUS_DOTS[status])}
      />
      {label}
    </span>
  );
}
