import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { MobileNavigation } from "@/components/site/mobile-navigation";
import type { NavigationItem, SiteSettings } from "@/lib/contracts/site";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  navigation: NavigationItem[];
  settings: SiteSettings;
};

export function SiteHeader({ navigation, settings }: SiteHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-canvas">
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link
          href="/"
          className="group flex shrink-0 flex-col text-left"
          aria-label={`${settings.name} – Trang chủ`}
        >
          <span className="font-display text-lg leading-tight font-semibold tracking-[-0.02em] text-ink transition-colors group-hover:text-clay lg:text-xl">
            {settings.name}
          </span>
          <span className="hidden text-[0.625rem] font-semibold tracking-[0.14em] text-sage uppercase sm:block">
            {settings.tagline}
          </span>
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-2 text-sm font-medium text-sage transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={settings.hotlineHref}
            className="hidden min-h-11 items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-clay 2xl:flex"
          >
            <Phone aria-hidden="true" className="size-4 text-sage" />
            Hotline: {settings.hotline}
          </a>
          <a
            href={settings.zaloHref}
            target="_blank"
            rel="noreferrer"
            className="hidden min-h-11 items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-clay 2xl:flex"
          >
            <MessageCircle aria-hidden="true" className="size-4 text-sage" />
            Zalo
          </a>
          <Link
            href="/dat-tour"
            className={cn(
              buttonVariants({ variant: "site", size: "site-sm" }),
              "hidden sm:inline-flex lg:h-12 lg:px-6",
            )}
          >
            Đặt tour
          </Link>
          <MobileNavigation navigation={navigation} settings={settings} />
        </div>
      </Container>
    </header>
  );
}
