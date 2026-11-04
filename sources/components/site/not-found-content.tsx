import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo-xuoi-mien-song-nuoc.png";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteSettings } from "@/lib/fixtures/site";
import { cn } from "@/lib/utils";

const suggestions = [
  { label: "Tuyến tour", href: "/tour" },
  { label: "Điểm đến", href: "/diem-den" },
  { label: "Ẩm thực", href: "/am-thuc" },
  { label: "Kinh nghiệm", href: "/kinh-nghiem" },
  { label: "Liên hệ", href: "/lien-he" },
];

export function NotFoundContent() {
  return (
    <section className="flex min-h-[calc(100dvh-4rem)] items-start lg:min-h-[calc(100dvh-5rem)] lg:items-center">
      <Container className="w-full py-14 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <p className="font-sans text-xs font-semibold tracking-[0.14em] text-clay uppercase">
              Lỗi 404 · Không tìm thấy trang
            </p>

            <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2.5rem,4.8vw,4.25rem)] leading-[1.04] font-medium tracking-[-0.025em] text-ink">
              Trang này không nằm trên bản đồ dòng sông
            </h1>

            <p className="mt-6 max-w-[52ch] text-base leading-[1.65] text-sage md:text-lg">
              Đường dẫn có thể đã đổi tên hoặc chưa từng tồn tại. Bạn hãy quay về
              trang chủ, xem những chuyến đang mở, hoặc chọn một hướng khác để
              tiếp tục.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "site", size: "site" }),
                  "w-full sm:w-auto",
                )}
              >
                Về trang chủ
              </Link>
              <Link
                href="/tour"
                className={cn(
                  buttonVariants({ variant: "site-outline", size: "site" }),
                  "w-full sm:w-auto",
                )}
              >
                Xem các tour
              </Link>
            </div>

            <div className="mt-10 border-t border-line pt-6">
              <h2 className="text-xs font-semibold tracking-[0.14em] text-sage uppercase">
                Hoặc tiếp tục từ
              </h2>
              <ul className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1">
                {suggestions.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-ink underline-offset-4 transition-colors hover:text-clay hover:underline focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm leading-6 text-sage">
                Cần người điều phối? Gọi{" "}
                <a
                  href={siteSettings.hotlineHref}
                  className="font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:text-clay focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
                >
                  {siteSettings.hotline}
                </a>{" "}
                hoặc nhắn Zalo, hỗ trợ {siteSettings.supportHours}.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 lg:flex lg:justify-end">
            <Image
              src={logo}
              alt=""
              loading="eager"
              sizes="(min-width: 1024px) 360px, (min-width: 768px) 320px, 280px"
              className="h-auto w-full max-w-[280px] object-contain md:max-w-[320px] lg:max-w-[360px]"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
