"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Copy,
  MapPin,
  MessageCircle,
  Phone,
  User,
  Users,
} from "lucide-react";
import { HoldCountdown } from "@/components/booking/hold-countdown";
import { buttonVariants } from "@/components/ui/button";
import type { BookingSuccessData } from "@/lib/contracts/booking";
import type { SiteSettings } from "@/lib/contracts/site";
import {
  formatDateTimeLongVN,
  formatLongDateVN,
  formatVndDisplay,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type BookingSuccessProps = {
  success: BookingSuccessData;
  settings: SiteSettings;
  onReset: () => void;
};

const NEXT_STEPS = [
  {
    title: "Nhân viên liên hệ",
    timing: "Trong thời gian giữ chỗ",
    description:
      "Điều phối viên gọi điện hoặc nhắn Zalo để xác nhận điểm đón, nhu cầu ăn uống và thông tin đoàn.",
  },
  {
    title: "Xác nhận đặt cọc",
    timing: "Sau khi hai bên thống nhất",
    description:
      "Không thu tiền trực tuyến. Nhân viên hướng dẫn cách đặt cọc; tiền cọc được trừ vào tổng giá tour.",
  },
  {
    title: "Tra cứu hoặc hủy đơn",
    timing: "Trước hạn tự hủy",
    description:
      "Dùng mã đơn và số điện thoại để tra cứu trạng thái, hủy hoặc liên hệ hỗ trợ khi cần thay đổi.",
  },
] as const;

export function BookingSuccess({
  success,
  settings,
  onReset,
}: BookingSuccessProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(success.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const guestSummary = `${success.guests.adults} người lớn${
    success.guests.children > 0 ? `, ${success.guests.children} trẻ em` : ""
  }${success.guests.infants > 0 ? `, ${success.guests.infants} em bé` : ""}`;
  const seats =
    success.guests.adults + success.guests.children + success.guests.infants;

  return (
    <div className="flex flex-col gap-8">
      <nav
        aria-label="Đường dẫn trang"
        className="flex flex-wrap items-center gap-1.5 text-xs text-sage"
      >
        <Link href="/" className="transition-colors hover:text-ink">
          Trang chủ
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <Link href="/dat-tour" className="transition-colors hover:text-ink">
          Đặt giữ chỗ
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span className="font-medium text-ink">Ghi nhận giữ chỗ</span>
      </nav>

      <section className="flex flex-col justify-between gap-8 border-b border-line pb-8 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-success uppercase">
            <CircleCheck aria-hidden="true" className="size-4" />
            Đã ghi nhận yêu cầu
          </span>
          <h1 className="mt-4 font-display text-[clamp(2.25rem,4.8vw,4rem)] leading-[1.05] font-medium tracking-[-0.03em] text-ink">
            Chỗ của bạn đang được giữ
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-sage">
            Nhân viên sẽ liên hệ qua điện thoại hoặc Zalo để xác nhận lịch trình,
            điểm đón và hướng dẫn đặt cọc. Đơn chỉ được xác nhận sau khi hoàn tất
            bước này.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 rounded-[16px] border border-line bg-surface-warm/60 px-5 py-4">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Clock3 aria-hidden="true" className="size-4 text-clay" />
            Giữ chỗ {settings.booking.holdHours} giờ
          </span>
          <span className="text-xs text-sage">Chưa thu tiền trực tuyến</span>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-7">
          <section className="rounded-[20px] border border-line bg-surface p-5 shadow-[0_18px_48px_-24px_rgba(23,51,43,0.22)] md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
              <div>
                <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-sage uppercase">
                  Mã đơn giữ chỗ
                </span>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-2xl font-semibold tracking-[0.03em] text-ink md:text-3xl">
                    {success.code}
                  </span>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-[8px] border border-line bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-warm focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
                  >
                    {copied ? (
                      <Check aria-hidden="true" className="size-3.5 text-success" />
                    ) : (
                      <Copy aria-hidden="true" className="size-3.5" />
                    )}
                    {copied ? "Đã sao chép" : "Sao chép"}
                  </button>
                  <span className="sr-only" role="status" aria-live="polite">
                    {copied ? "Đã sao chép mã đơn." : ""}
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full bg-clay-soft px-3 py-1.5 text-xs font-semibold text-ink">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-clay" />
                {success.statusLabel}
              </span>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-[12px] border border-line bg-canvas p-4">
              <Clock3 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
              <div>
                <span className="block text-sm font-semibold text-ink">
                  Thời hạn giữ chỗ đến {formatDateTimeLongVN(success.holdExpiresAt)}
                </span>
                <p className="mt-1 text-sm leading-6 text-sage">
                  Còn lại <HoldCountdown holdExpiresAt={success.holdExpiresAt} /> để
                  nhân viên liên hệ và hướng dẫn bước tiếp theo.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[20px] border border-line bg-surface p-5 md:p-7">
            <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-sage uppercase">
              Quy trình tiếp theo
            </span>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              Ba bước để hoàn tất giữ chỗ
            </h2>

            <ol className="mt-6 border-l border-line pl-6">
              {NEXT_STEPS.map((item, index) => (
                <li
                  key={item.title}
                  className="relative pb-7 pl-5 last:pb-0"
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-1 -left-[31px] flex size-4 items-center justify-center rounded-full border-2 border-clay bg-canvas"
                  >
                    <span className="size-1.5 rounded-full bg-clay" />
                  </span>
                  <span className="font-mono text-[0.68rem] tracking-[0.06em] text-clay uppercase">
                    Bước {String(index + 1).padStart(2, "0")} · {item.timing}
                  </span>
                  <h3 className="mt-1 text-sm font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-sage">
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tra-cuu-don"
              className={cn(
                buttonVariants({ variant: "site", size: "site" }),
                "w-full sm:w-auto",
              )}
            >
              Tra cứu đơn
            </Link>
            <button
              type="button"
              onClick={onReset}
              className={cn(
                buttonVariants({ variant: "site-outline", size: "site" }),
                "w-full sm:w-auto",
              )}
            >
              Đặt chuyến khác
            </button>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center gap-1.5 px-2 text-sm font-medium text-sage transition-colors hover:text-ink"
            >
              Về trang chủ
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>

        <aside className="flex flex-col gap-6 lg:col-span-5">
          <section className="overflow-hidden rounded-[20px] border border-line bg-surface">
            {success.coverImage ? (
              <div className="relative aspect-[16/9] overflow-hidden bg-surface-warm">
                <Image
                  src={success.coverImage.src}
                  alt={success.coverImage.alt}
                  fill
                  sizes="(min-width: 1024px) 36vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className="p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-line bg-surface-warm px-2.5 py-1 font-mono text-[0.7rem] text-clay">
                  {success.tourCode}
                </span>
                <span className="text-xs text-sage">
                  {success.durationDays} ngày {success.durationNights} đêm
                </span>
              </div>
              <h2 className="mt-2 font-display text-xl leading-tight font-semibold text-ink">
                <Link
                  href={`/tour/${success.tourSlug}`}
                  className="transition-colors hover:text-clay"
                >
                  {success.tourName}
                </Link>
              </h2>

              <div className="mt-5 flex flex-col gap-4 border-t border-line pt-4">
                <div className="flex items-start gap-2.5">
                  <CalendarDays
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-sage"
                  />
                  <div>
                    <span className="block text-[0.7rem] text-sage">
                      Ngày khởi hành
                    </span>
                    <span className="block text-sm font-semibold text-ink">
                      {formatLongDateVN(success.departureDate)}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-sage"
                  />
                  <div>
                    <span className="block text-[0.7rem] text-sage">Điểm đón</span>
                    <span className="block text-sm font-medium text-ink">
                      {success.pickupPoint}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <User
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-sage"
                  />
                  <div>
                    <span className="block text-[0.7rem] text-sage">
                      Người đại diện
                    </span>
                    <span className="block text-sm font-semibold text-ink">
                      {success.contactName}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-sage">
                      {success.phoneMasked}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Users
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-sage"
                  />
                  <div>
                    <span className="block text-[0.7rem] text-sage">Đoàn của bạn</span>
                    <span className="block text-sm font-medium text-ink">
                      {guestSummary} · {seats} chỗ
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-line pt-4">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <span className="block text-[0.7rem] text-sage">
                      Tổng tạm tính
                    </span>
                    <span className="block text-xs text-sage">
                      Thanh toán sau khi xác nhận
                    </span>
                  </div>
                  <span className="font-display text-2xl font-semibold text-clay tabular-nums">
                    {formatVndDisplay(success.totalAmount)}
                  </span>
                </div>
              </div>

              <p className="mt-4 border-t border-line pt-4 text-xs leading-5 text-sage">
                {success.canCancel
                  ? `Có thể tự hủy trước ngày ${formatLongDateVN(success.cancellationDeadline)}.`
                  : "Đã quá hạn tự hủy, vui lòng liên hệ hotline để được hỗ trợ."}
              </p>
            </div>
          </section>

          <section className="rounded-[20px] border border-ink bg-ink p-5 text-contrast-on-accent md:p-6">
            <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-clay-soft uppercase">
              Hỗ trợ trực tiếp
            </span>
            <h2 className="mt-1 font-display text-xl font-semibold text-surface">
              Cần hỗ trợ về chuyến đi?
            </h2>
            <p className="mt-2 text-sm leading-6 text-surface/70">
              Liên hệ điều phối viên để thay đổi điểm đón, nhu cầu ăn uống hoặc kiểm
              tra tình trạng đơn.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a
                href={settings.hotlineHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-white/15 px-3 text-sm font-semibold text-surface transition-colors hover:bg-white/10"
              >
                <Phone aria-hidden="true" className="size-4 text-clay-soft" />
                {settings.hotline}
              </a>
              <a
                href={settings.zaloHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-clay px-3 text-sm font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                Nhắn Zalo
              </a>
            </div>
            <p className="mt-3 text-center text-xs text-surface/50">
              {settings.supportHours}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
