import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo-xuoi-mien-song-nuoc.png";
import { AdminNavLinks } from "@/components/admin/admin-nav-links";

type AdminSidebarProps = {
  admin: { name: string; email: string };
  capabilities: readonly string[];
  unreadMessages: number;
  logoutAction: () => Promise<void>;
};

export function AdminSidebar({
  admin,
  capabilities,
  unreadMessages,
  logoutAction,
}: AdminSidebarProps) {
  return (
    <aside className="hidden bg-ink lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-[248px] lg:shrink-0 lg:flex-col">
      <Link
        href="/admin"
        className="flex items-center gap-3 px-5 py-5 focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none"
      >
        <Image
          src={logo}
          alt=""
          loading="eager"
          sizes="40px"
          className="size-10 shrink-0 object-contain"
        />
        <span className="flex min-w-0 flex-col">
          <span className="font-display text-[15px] leading-tight text-contrast-on-accent">
            Xuôi Miền Sông Nước
          </span>
          <span className="mt-0.5 text-[10px] font-semibold tracking-[0.16em] text-contrast-on-accent/60 uppercase">
            Quản trị
          </span>
        </span>
      </Link>

      <div className="mt-2">
        <AdminNavLinks
          capabilities={capabilities}
          unreadMessages={unreadMessages}
        />
      </div>

      <div className="mt-auto border-t border-contrast-on-accent/10 px-5 py-4">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-contrast-on-accent/60 uppercase">
          Quản trị viên
        </p>
        <p className="mt-1 truncate text-[13px] font-medium text-contrast-on-accent">{admin.name}</p>
        <p className="truncate text-[11px] text-contrast-on-accent/60">{admin.email}</p>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="inline-flex min-h-9 items-center text-[12px] font-medium text-contrast-on-accent/70 underline underline-offset-4 transition-colors hover:text-contrast-on-accent focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none"
          >
            Đăng xuất
          </button>
        </form>
      </div>
    </aside>
  );
}
