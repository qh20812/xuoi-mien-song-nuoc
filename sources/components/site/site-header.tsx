import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import logo from "@/public/logo-xuoi-mien-song-nuoc.png";
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
          className="group flex shrink-0 items-center gap-3 rounded-sm py-1.5 text-left focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-4 focus-visible:ring-offset-canvas focus-visible:outline-none"
          aria-label={`${settings.name} – Trang chủ`}
        >
          <Image
            src={logo}
            alt=""
            loading="eager"
            sizes="(min-width: 1280px) 48px, (min-width: 1024px) 40px, 36px"
            className="size-9 shrink-0 object-contain lg:size-10 xl:size-12"
          />
          <span className="flex flex-col">
            <span className="font-display text-lg leading-tight font-semibold tracking-[-0.02em] text-ink transition-colors group-hover:text-clay lg:text-xl">
              {settings.name}
            </span>
            <span className="hidden text-[0.625rem] font-semibold tracking-[0.14em] text-sage uppercase sm:block">
              {settings.tagline}
            </span>
          </span>
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-4 lg:flex xl:gap-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-2 text-sm font-medium whitespace-nowrap text-sage transition-colors hover:text-ink"
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
