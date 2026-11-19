import { connection } from "next/server";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminPage } from "@/lib/auth/session";
import { capabilitiesFor } from "@/server/auth/permissions";
import { logoutAction } from "./actions";

// Admin đọc cookie phiên trước khi render; cho phép blocking thay vì instant.
export const instant = false;

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Chặn prerender trước khi đọc cookie/JWT: `jwtVerify` dùng thời gian hiện tại.
  await connection();

  const admin = await requireAdminPage("/admin");
  const capabilities = capabilitiesFor(admin.role);

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <div className="lg:flex">
        <AdminSidebar
          admin={admin}
          capabilities={capabilities}
          logoutAction={logoutAction}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminMobileNav
            admin={admin}
            capabilities={capabilities}
            logoutAction={logoutAction}
          />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1200px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
