import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { ImageAsset } from "@/lib/contracts/home";
import type { SiteSettings } from "@/lib/contracts/site";

type HomeCtaSectionProps = {
  image: ImageAsset;
  settings: SiteSettings;
};

export function HomeCtaSection({ image, settings }: HomeCtaSectionProps) {
  return (
    <section className="bg-canvas pb-16 md:pb-24">
      <Container>
        <div className="grid grid-cols-1 overflow-hidden rounded-[24px] border border-line bg-surface lg:grid-cols-12">
          <div className="flex flex-col justify-center p-7 md:p-10 lg:col-span-7 lg:p-14">
            <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
              Khởi đầu chuyến du khảo
            </span>
            <h2 className="mt-3 max-w-[15ch] font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] font-medium tracking-[-0.02em] text-ink">
              Sẵn sàng xuôi về vùng sông nước?
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-sage">
              Để lại thông tin để giữ chỗ trong 24 giờ. Nhân viên sẽ liên hệ xác nhận
              lịch trình, điểm đón và hướng dẫn đặt cọc trước khi chuyến đi được chốt.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href="/dat-tour"
                className={buttonVariants({ variant: "site", size: "site" })}
              >
                Đặt giữ chỗ
              </Link>
              <a
                href={settings.hotlineHref}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-clay"
              >
                <Phone aria-hidden="true" className="size-4 text-sage" />
                Hotline/Zalo: {settings.hotline}
              </a>
            </div>
          </div>

          <div className="relative min-h-[320px] border-t border-line lg:col-span-5 lg:min-h-full lg:border-t-0 lg:border-l">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
