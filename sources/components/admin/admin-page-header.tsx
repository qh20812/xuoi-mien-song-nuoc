import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AdminPageHeaderProps = {
  breadcrumb: BreadcrumbItem[];
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Cho phép đổi font/size khi tiêu đề là mã đơn (mono). */
  titleClassName?: string;
};

/** Tiêu đề + breadcrumb dùng chung cho các trang quản trị (A4–A7). */
export function AdminPageHeader({
  breadcrumb,
  title,
  description,
  actions,
  titleClassName,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-5">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12px] text-sage">
        {breadcrumb.map((item, index) => (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-ink">
                {item.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1
            className={cn(
              "font-display text-[26px] leading-tight font-medium tracking-[-0.02em] text-ink sm:text-[28px]",
              titleClassName,
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-[70ch] text-[14px] leading-relaxed text-sage">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
