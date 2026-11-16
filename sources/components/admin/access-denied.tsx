import Link from "next/link";

type AccessDeniedProps = {
  title?: string;
  description?: string;
};

/** Chặn mềm trong page: hiển thị thông báo thay vì redirect im lặng. */
export function AccessDenied({
  title = "Không có quyền truy cập",
  description = "Chỉ chủ sở hữu hệ thống mới mở được khu vực này.",
}: AccessDeniedProps) {
  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <h1 className="font-display text-[22px] font-medium text-ink">{title}</h1>
      <p className="mt-2 max-w-[60ch] text-[13px] leading-6 text-sage">{description}</p>
      <Link
        href="/admin"
        className="mt-4 inline-flex h-10 items-center rounded-[10px] border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
      >
        Về tổng quan
      </Link>
    </div>
  );
}
