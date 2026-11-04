import Image from "next/image";
import Link from "next/link";
import { Clock3, MapPin, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { ImageAsset } from "@/lib/contracts/home";

type HeroSectionProps = {
  image: ImageAsset;
};

export function HeroSection({ image }: HeroSectionProps) {
  return (
    <section className="bg-canvas">
      <Container className="grid grid-cols-1 items-center gap-10 py-10 lg:grid-cols-12 lg:gap-16 lg:py-20">
        <div className="flex flex-col justify-center lg:col-span-7">
          <div className="mb-5 flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-6 bg-sage" />
            <span className="text-xs font-semibold tracking-[0.14em] text-sage uppercase">
              Sài Gòn · U Minh Hạ · Đất Mũi Cà Mau
            </span>
          </div>

          <h1 className="max-w-[11ch] font-display text-[clamp(2.75rem,6.2vw,5.75rem)] leading-[1.02] font-medium tracking-[-0.035em] text-ink">
            Xuôi về miền sông nước
          </h1>

          <p className="mt-6 max-w-[56ch] text-base leading-[1.7] text-sage md:text-lg">
            Hành trình đưa người lữ khách đi từ nhịp sống Sài Gòn qua những vạt rừng
            tràm U Minh Hạ, lắng nghe tiếng đờn ca tài tử và chạm vào mốc tọa độ Đất
            Mũi. Không ồn ào vội vã, chỉ có thiên nhiên hoang sơ và tình người Nam Bộ.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/dat-tour"
              className={buttonVariants({ variant: "site", size: "site" })}
            >
              Đặt giữ chỗ
            </Link>
            <Link
              href="#tours-noi-bat"
              className="inline-flex min-h-11 items-center gap-2 border-b border-ink/30 text-sm font-semibold text-ink transition-colors hover:border-clay hover:text-clay"
            >
              Xem hành trình
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 border-t border-line pt-5 text-sm text-sage sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-4 shrink-0 text-clay" />
              Đón tại Quận 1 & Bến xe Miền Tây
            </span>
            <span className="flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-4 shrink-0 text-clay" />
              Giữ chỗ 24 giờ, chưa thu tiền online
            </span>
          </div>
        </div>

        <figure className="lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] border border-line bg-surface">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-4 flex items-start gap-3 border-l border-clay/60 pl-4">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-clay" />
            <span className="text-sm leading-6 text-sage">
              <span className="block text-xs font-semibold tracking-[0.12em] text-ink uppercase">
                Rừng tràm U Minh Hạ
              </span>
              Màu xanh của vườn chuối và tán rừng tràm trong vùng đất ngập nước
              U Minh Hạ.
            </span>
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
