import Link from "next/link";

export const metadata = {
  title: "Không tìm thấy trang quản trị | Xuôi Miền Sông Nước",
};

export default function AdminNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-16">
      <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        Lỗi 404
      </p>
      <h1 className="text-xl font-semibold text-foreground">
        Không tìm thấy nội dung quản trị này
      </h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        Đơn hàng hoặc trang bạn mở có thể đã bị xóa, hoặc đường dẫn không đúng.
      </p>
      <Link
        href="/admin/orders"
        className="w-fit text-sm font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
      >
        Về danh sách đơn hàng
      </Link>
    </main>
  );
}
