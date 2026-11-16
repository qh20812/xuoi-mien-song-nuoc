import Link from "next/link";

export const metadata = {
  title: "Không tìm thấy đơn | Quản trị Xuôi Miền Sông Nước",
};

export default function AdminNotFound() {
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12px] text-sage">
        <Link
          href="/admin"
          className="transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
        >
          Quản trị
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-medium text-ink">
          Không tìm thấy
        </span>
      </nav>

      <div className="flex justify-center py-8">
        <div className="w-full max-w-[520px] rounded-xl border border-line bg-surface p-8 text-center">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-clay">LỖI 404</p>
          <h1 className="mt-2 font-display text-[26px] leading-tight font-medium tracking-[-0.02em] text-ink">
            Không tìm thấy đơn này
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-sage">
            Đơn có thể đã bị xoá, hoặc đường dẫn không đúng. Kiểm tra lại mã đơn trong danh sách.
          </p>
          <Link
            href="/admin/orders"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-[10px] bg-clay px-5 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
          >
            Về danh sách đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
