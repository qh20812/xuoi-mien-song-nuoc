import Link from "next/link";

export const metadata = {
  title: "Không tìm thấy trang quản trị | Xuôi Miền Sông Nước",
};

/**
 * Fallback cho 404 phát sinh ngoài nhóm `(dashboard)` — không có sidebar.
 * Trong `(dashboard)`, `app/admin/(dashboard)/not-found.tsx` được dùng thay thế.
 */
export default function AdminNotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4 py-12 text-ink">
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
          className="mt-6 inline-flex h-10 items-center justify-center rounded-[10px] bg-clay px-5 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
        >
          Về danh sách đơn hàng
        </Link>
      </div>
    </main>
  );
}
