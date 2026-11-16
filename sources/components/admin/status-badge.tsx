import { statusLabel } from "@/lib/booking/status-labels";
import { cn } from "@/lib/utils";

/** Màu chip theo token dự án — xem DESIGN-ADMIN.md §6. */
const STATUS_STYLES: Record<string, string> = {
  new: "bg-warning/15 text-warning",
  pending: "bg-surface-warm text-ink",
  confirmed: "bg-success/15 text-success",
  completed: "bg-ink/10 text-ink",
  cancelled: "bg-danger/15 text-danger",
  expired: "bg-sage/15 text-sage",
};

const FALLBACK_STYLE = "bg-surface-warm text-ink";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] leading-none font-semibold whitespace-nowrap",
        STATUS_STYLES[status] ?? FALLBACK_STYLE,
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

/** Đơn đã quá hạn giữ chỗ: nhãn chữ, không phải chip (DESIGN-ADMIN.md §6). */
export function HoldExpiredLabel({ className }: { className?: string }) {
  return (
    <span className={cn("text-[12px] font-semibold text-danger", className)}>Quá hạn giữ chỗ</span>
  );
}
