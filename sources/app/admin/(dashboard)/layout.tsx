import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminPage } from "@/lib/auth/session";
import { logoutAction } from "./actions";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminPage("/admin");

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <div className="lg:flex">
        <AdminSidebar admin={admin} logoutAction={logoutAction} />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminMobileNav admin={admin} logoutAction={logoutAction} />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1200px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
