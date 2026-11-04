import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { primaryNavigation } from "@/lib/navigation";
import { siteSettings } from "@/lib/fixtures/site";

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas font-sans text-ink">
      <SiteHeader navigation={primaryNavigation} settings={siteSettings} />
      <main className="flex-1 pt-16 lg:pt-20">
        <NotFoundContent />
      </main>
      <SiteFooter settings={siteSettings} />
    </div>
  );
}
