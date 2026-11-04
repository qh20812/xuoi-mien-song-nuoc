const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  new: { label: "Chờ xác nhận", className: "bg-amber-100 text-amber-900" },
  pending: { label: "Đang liên hệ", className: "bg-sky-100 text-sky-900" },
  confirmed: { label: "Đã xác nhận", className: "bg-emerald-100 text-emerald-900" },
  completed: { label: "Hoàn thành", className: "bg-zinc-200 text-zinc-800" },
  cancelled: { label: "Đã huỷ", className: "bg-rose-100 text-rose-800" },
  expired: { label: "Hết hạn", className: "bg-zinc-200 text-zinc-600" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { label: status, className: "bg-zinc-100 text-zinc-700" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}
