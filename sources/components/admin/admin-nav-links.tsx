"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  Images,
  Inbox,
  LayoutDashboard,
  MapPin,
  Newspaper,
  Settings,
  Star,
  Users,
} from "lucide-react";
import type { Capability } from "@/server/auth/permissions";
import { cn } from "@/lib/utils";

type AdminLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact: boolean;
  /** Quyền cần có để thấy mục này. Không khai báo = ai đăng nhập cũng thấy. */
  capability?: Capability;
};

const ADMIN_LINKS: AdminLink[] = [
  {
    href: "/admin",
    label: "Tổng quan",
    icon: LayoutDashboard,
    exact: true,
    capability: "orders:read",
  },
  {
    href: "/admin/orders",
    label: "Đơn hàng",
    icon: ClipboardList,
    exact: false,
    capability: "orders:read",
  },
  {
    href: "/admin/messages",
    label: "Hộp thư",
    icon: Inbox,
    exact: false,
    capability: "messages:read",
  },
  {
    href: "/admin/tours",
    label: "Tour & chuyến",
    icon: CalendarDays,
    exact: false,
    capability: "catalog:write",
  },
  {
    href: "/admin/destinations",
    label: "Điểm đến",
    icon: MapPin,
    exact: false,
    capability: "content:write",
  },
  {
    href: "/admin/posts",
    label: "Bài viết",
    icon: Newspaper,
    exact: false,
    capability: "content:write",
  },
  {
    href: "/admin/media",
    label: "Thư viện ảnh",
    icon: Images,
    exact: false,
    capability: "content:write",
  },
  {
    href: "/admin/reviews",
    label: "Đánh giá",
    icon: Star,
    exact: false,
    capability: "content:write",
  },
  {
    href: "/admin/users",
    label: "Tài khoản",
    icon: Users,
    exact: false,
    capability: "users:manage",
  },
  {
    href: "/admin/settings",
    label: "Cấu hình",
    icon: Settings,
    exact: false,
    capability: "settings:write",
  },
];

type AdminNavLinksProps = {
  /** Gọi sau khi điều hướng, dùng để đóng drawer mobile. */
  onNavigate?: () => void;
  /** Quyền của admin đang đăng nhập — mục thiếu quyền sẽ bị ẩn. */
  capabilities: readonly string[];
};

export function AdminNavLinks({ onNavigate, capabilities }: AdminNavLinksProps) {
  const pathname = usePathname();
  const links = ADMIN_LINKS.filter(
    (link) => !link.capability || capabilities.includes(link.capability),
  );

  return (
    <nav aria-label="Điều hướng quản trị" className="flex flex-col gap-1 px-3">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-11 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none",
              active
                ? "bg-contrast-on-accent/10 text-contrast-on-accent"
                : "text-contrast-on-accent/60 hover:bg-contrast-on-accent/5 hover:text-contrast-on-accent",
            )}
          >
            {active ? (
              <span
                aria-hidden="true"
                className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r bg-clay"
              />
            ) : null}
            <Icon aria-hidden="true" className="size-[18px] shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
