import { Info, LoaderCircle, Phone, Search, Tag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { SiteSettings } from "@/lib/contracts/site";
import { cn } from "@/lib/utils";

type LookupFormProps = {
  code: string;
  phone: string;
  errors: Record<string, string>;
  loading: boolean;
  settings: SiteSettings;
  onChange: (field: "code" | "phone", value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function LookupForm({
  code,
  phone,
  errors,
  loading,
  settings,
  onChange,
  onSubmit,
}: LookupFormProps) {
  return (
    <div className="rounded-[20px] border border-line bg-surface p-5 md:p-7">
      <form
        noValidate
        onSubmit={onSubmit}
        className="grid grid-cols-1 items-end gap-5 lg:grid-cols-12"
      >
        <div className="lg:col-span-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
            <label htmlFor="order-code" className="text-sm font-semibold text-ink">
              Mã đơn đặt tour <span className="text-danger">*</span>
            </label>
            <span className="text-[0.7rem] text-sage">Dạng XMSN-2026-0001</span>
          </div>
          <div className="relative">
            <input
              id="order-code"
              name="code"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={24}
              value={code}
              onChange={(event) => onChange("code", event.target.value)}
              aria-invalid={Boolean(errors.code)}
              aria-describedby={errors.code ? "order-code-error" : undefined}
              placeholder="XMSN-2026-0001"
              className={cn(
                "h-12 w-full rounded-[10px] border border-line bg-surface px-4 pr-10 font-mono text-sm text-ink uppercase outline-none transition-colors placeholder:text-sage/60 focus:border-clay focus:ring-2 focus:ring-clay/20",
                errors.code && "border-danger",
              )}
            />
            <Tag
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-sage"
            />
          </div>
          {errors.code ? (
            <p id="order-code-error" className="mt-1.5 text-xs text-danger">
              {errors.code}
            </p>
          ) : null}
        </div>

        <div className="lg:col-span-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
            <label htmlFor="order-phone" className="text-sm font-semibold text-ink">
              Số điện thoại <span className="text-danger">*</span>
            </label>
            <span className="text-[0.7rem] text-sage">Số dùng khi đặt chỗ</span>
          </div>
          <div className="relative">
            <input
              id="order-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
              value={phone}
              onChange={(event) => onChange("phone", event.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "order-phone-error" : undefined}
              placeholder="0901 234 567"
              className={cn(
                "h-12 w-full rounded-[10px] border border-line bg-surface px-4 font-mono text-sm text-ink outline-none transition-colors placeholder:text-sage/60 focus:border-clay focus:ring-2 focus:ring-clay/20",
                errors.phone && "border-danger",
              )}
            />
            <Phone
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-sage"
            />
          </div>
          {errors.phone ? (
            <p id="order-phone-error" className="mt-1.5 text-xs text-danger">
              {errors.phone}
            </p>
          ) : null}
        </div>

        <div className="lg:col-span-4">
          <button
            type="submit"
            disabled={loading}
            className={cn(
              buttonVariants({ variant: "site", size: "site" }),
              "w-full",
            )}
          >
            {loading ? (
              <>
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                Đang tra cứu
              </>
            ) : (
              <>
                <Search aria-hidden="true" className="size-4" />
                Tra cứu đơn
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-5 flex items-start gap-2.5 border-t border-line pt-4 text-xs leading-5 text-sage">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>
          Cần nhập đúng cả mã đơn và số điện thoại đã dùng khi đặt chỗ. Nếu quên mã,
          vui lòng gọi{" "}
          <a
            href={settings.hotlineHref}
            className="font-semibold text-ink underline underline-offset-2 hover:text-clay"
          >
            {settings.hotline}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
