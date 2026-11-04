"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { NavigationItem, SiteSettings } from "@/lib/contracts/site";
import { cn } from "@/lib/utils";

type MobileNavigationProps = {
  navigation: NavigationItem[];
  settings: SiteSettings;
};

export function MobileNavigation({
  navigation,
  settings,
}: MobileNavigationProps) {
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
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-[10px] border border-line text-ink transition-colors hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none lg:hidden"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Đóng menu" : "Mở menu"}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
      </button>

      {open ? (
        <div
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Điều hướng chính"
          className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-line bg-canvas lg:hidden"
        >
          <nav className="mx-auto flex w-full max-w-[1320px] flex-col px-5 py-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-4 font-display text-2xl text-ink transition-colors hover:text-clay"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/dat-tour"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "site", size: "site" }),
                "mt-6 w-full",
              )}
            >
              Đặt tour
            </Link>

            <div className="mt-6 flex flex-col gap-3 text-sm text-sage">
              <a
                href={settings.hotlineHref}
                className="inline-flex min-h-11 items-center gap-3 hover:text-ink"
              >
                <Phone aria-hidden="true" className="size-4 text-clay" />
                Hotline: {settings.hotline}
              </a>
              <a
                href={settings.zaloHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-3 hover:text-ink"
              >
                <MessageCircle aria-hidden="true" className="size-4 text-clay" />
                Zalo · {settings.supportHours}
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
