import Image from "next/image";
import logo from "@/public/logo-xuoi-mien-song-nuoc.png";
import { sanitizeNextPath } from "@/lib/auth/next-path";
import { LoginForm } from "./login-form";

export const instant = false;

export const metadata = {
  title: "Đăng nhập quản trị | Xuôi Miền Sông Nước",
};

/**
 * `cacheComponents` chặn `new Date()` khi prerender, nên năm bản quyền phải
 * nằm trong cache — giống `getCopyrightYear` ở `components/site/site-footer.tsx`.
 */
async function getCopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; ok?: string }>;
}) {
  const { next, ok } = await searchParams;
  const year = await getCopyrightYear();

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-[880px]">
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_18px_48px_-24px_rgba(23,51,43,0.22)]">
          <div className="grid grid-cols-1 lg:grid-cols-10">
            <aside className="hidden bg-ink p-10 lg:col-span-4 lg:flex lg:flex-col">
              <Image
                src={logo}
                alt=""
                loading="eager"
                sizes="96px"
                className="size-24 shrink-0 object-contain"
              />
              <p className="mt-8 font-display text-[24px] leading-tight text-contrast-on-accent">
                Xuôi Miền Sông Nước
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-contrast-on-accent/65">
                Khu vực nội bộ cho người điều hành tour
              </p>
            </aside>

            <div className="p-6 sm:p-8 lg:col-span-6 lg:p-12">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <Image
                  src={logo}
                  alt=""
                  loading="eager"
                  sizes="40px"
                  className="size-10 shrink-0 object-contain"
                />
                <span className="font-display text-[15px] text-ink">Xuôi Miền Sông Nước</span>
              </div>

              <p className="text-[11px] font-semibold tracking-[0.16em] text-clay uppercase">
                Quản trị
              </p>
              <h1 className="mt-1.5 font-display text-[26px] leading-tight font-medium tracking-[-0.02em] text-ink">
                Đăng nhập
              </h1>
              <p className="mt-2 text-[13px] text-sage">Dùng email nội bộ đã được cấp.</p>

              {ok === "password" ? (
                <p
                  role="status"
                  className="mt-5 rounded-[8px] border border-success/30 bg-success/10 px-3 py-2.5 text-[13px] font-medium text-success"
                >
                  Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới.
                </p>
              ) : null}

              <div className="mt-6">
                <LoginForm next={sanitizeNextPath(next)} />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[12px] text-sage">
          © {year} Xuôi Miền Sông Nước
        </p>
      </div>
    </main>
  );
}
