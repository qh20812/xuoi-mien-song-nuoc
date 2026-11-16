import type { Metadata } from "next";
import Link from "next/link";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { BookingInitialSelection } from "@/lib/contracts/booking";
import type { SiteSettings } from "@/lib/contracts/site";
import { listBookableTours } from "@/server/catalog/list-bookable-tours";
import { getSiteSettings } from "@/server/settings/get-site-settings";

export const metadata: Metadata = {
  title: "Đặt giữ chỗ tour",
  description:
    "Chọn tour, ngày khởi hành và để lại thông tin liên hệ. Website giữ chỗ 24 giờ, chưa thu tiền trực tuyến.",
};

// Route phụ thuộc searchParams để khôi phục lựa chọn từ trang chi tiết tour.
export const instant = false;

type BookingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function NoBookableSchedule({ settings }: { settings: SiteSettings }) {
  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto max-w-2xl rounded-[20px] border border-line bg-surface p-8 text-center md:p-12">
        <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
          Đặt giữ chỗ
        </span>
        <h1 className="mt-3 font-display text-[clamp(1.9rem,3.6vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.02em] text-ink">
          Chưa có lịch khởi hành đang mở
        </h1>
        <p className="mt-4 text-sm leading-6 text-sage md:text-base">
          Các chuyến gần nhất đã đóng hoặc hết chỗ. Liên hệ hotline để được xếp
          chuyến phù hợp, hoặc xem lại danh sách tour đang mở bán.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={settings.hotlineHref}
            className={buttonVariants({ variant: "site", size: "site" })}
          >
            Gọi {settings.hotline}
          </a>
          <Link
            href="/tour"
            className={buttonVariants({ variant: "site-outline", size: "site" })}
          >
            Xem danh sách tour
          </Link>
        </div>
      </div>
    </Container>
  );
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const params = await searchParams;
  const initial: BookingInitialSelection = {
    tourSlug: firstValue(params.tour),
    departureId: positiveInteger(firstValue(params.departureId)),
    adults: positiveInteger(firstValue(params.adults)),
    children: positiveInteger(firstValue(params.children)),
    infants: positiveInteger(firstValue(params.infants)),
  };

  // Tour, chuyến khởi hành và cấu hình đặt tour đọc thẳng từ MySQL:
  // - `departureId` gửi lên API luôn tồn tại (fixture cũ hardcode ID sai)
  // - giới hạn khách / hạn giữ chỗ / hạn huỷ khớp với server
  const [tours, settings] = await Promise.all([
    listBookableTours(),
    getSiteSettings(),
  ]);

  // Không còn chuyến nào đặt được (DB rỗng, hết chỗ, hoặc quá sát ngày):
  // hiện thông báo thay vì để wizard crash vì `tours[0]` không có chuyến.
  if (!tours.some((tour) => tour.departures.length > 0)) {
    return <NoBookableSchedule settings={settings} />;
  }

  return (
    <Container className="py-8 md:py-12">
      <BookingWizard tours={tours} settings={settings} initial={initial} />
    </Container>
  );
}
