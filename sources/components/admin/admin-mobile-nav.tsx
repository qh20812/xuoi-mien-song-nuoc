"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import logo from "@/public/logo-xuoi-mien-song-nuoc.png";
import { AdminNavLinks } from "@/components/admin/admin-nav-links";

type AdminMobileNavProps = {
  admin: { name: string; email: string };
  capabilities: readonly string[];
  unreadMessages: number;
  logoutAction: () => Promise<void>;
};

export function AdminMobileNav({
  admin,
  capabilities,
  unreadMessages,
  logoutAction,
}: AdminMobileNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-line bg-canvas px-4 lg:hidden">
        <Link
          href="/admin"
          className="flex min-w-0 items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
        >
          <Image
            src={logo}
            alt=""
            loading="eager"
            sizes="32px"
            className="size-8 shrink-0 object-contain"
          />
          <span className="truncate font-display text-[15px] text-ink">Xuôi Miền Sông Nước</span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          aria-label="Mở menu quản trị"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-line text-ink transition-colors hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Đóng menu quản trị"
            className="absolute inset-0 bg-ink/40"
          />

          <div
            id="admin-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Điều hướng quản trị"
            className="relative flex h-full w-[300px] max-w-[85vw] flex-col bg-ink"
          >
            <div className="relative flex items-center px-5 py-4">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex min-w-0 items-center gap-3 pr-10 focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none"
              >
                <Image
                  src={logo}
                  alt=""
                  loading="eager"
                  sizes="36px"
                  className="size-9 shrink-0 object-contain"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-display text-[15px] leading-tight text-contrast-on-accent">
                    Xuôi Miền Sông Nước
                  </span>
                  <span className="mt-0.5 text-[10px] font-semibold tracking-[0.16em] text-contrast-on-accent/60 uppercase">
                    Quản trị
                  </span>
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng menu quản trị"
                className="absolute top-1/2 right-3 inline-flex size-11 shrink-0 -translate-y-1/2 items-center justify-center rounded-[10px] text-contrast-on-accent/70 transition-colors hover:bg-contrast-on-accent/10 hover:text-contrast-on-accent focus-visible:ring-2 focus-visible:ring-clay focus-visible:outline-none"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <AdminNavLinks
              capabilities={capabilities}
              unreadMessages={unreadMessages}
              onNavigate={() => setOpen(false)}
            />

            <div className="mt-auto border-t border-contrast-on-accent/10 px-5 py-4">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-contrast-on-accent/60 uppercase">
                Quản trị viên
              </p>
              <p className="mt-1 truncate text-[13px] font-medium text-contrast-on-accent">
                {admin.name}
              </p>
              <p className="truncate text-[11px] text-contrast-on-accent/60">{admin.email}</p>
              <form action={logoutAction} className="mt-3">
                <button
                  type="submit"
                  className="inline-flex min-h-9 items-center text-[12px] font-medium text-contrast-on-accent/70 underline underline-offset-4 transition-colors hover:text-contrast-on-accent focus-visible:ring-2 focus-visible:ring-clay focus-visible:outline-none"
                >
                  Đăng xuất
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
