import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/session";
import { logoutAction } from "./actions";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminPage("/admin");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/admin" className="font-semibold">
            Xuôi Miền Sông Nước · Quản trị
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin/orders" className="text-muted-foreground hover:text-foreground">
              Đơn hàng
            </Link>
            <span className="hidden text-muted-foreground sm:inline">{admin.name}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Đăng xuất
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
