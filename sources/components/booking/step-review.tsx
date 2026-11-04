import { CircleAlert, Mail, MapPin, Phone, User, Users } from "lucide-react";
import { BookingPolicy } from "@/components/tour-detail/booking-policy";
import type {
  BookingContactValues,
  BookingGuestCounts,
  BookingTourOption,
} from "@/lib/contracts/booking";
import type { SiteSettings } from "@/lib/contracts/site";
import type { TourDepartureOption } from "@/lib/contracts/tour";
import { calculateBookingPreview } from "@/lib/booking/preview";
import { formatLongDateVN, formatVndDisplay } from "@/lib/format";
import { cn } from "@/lib/utils";

type StepReviewProps = {
  tour: BookingTourOption;
  departure: TourDepartureOption | null;
  guests: BookingGuestCounts;
  contact: BookingContactValues;
  settings: SiteSettings;
  accepted: boolean;
  hasPassengerDetails: boolean;
  errors: Record<string, string>;
  serverError: string | null;
  onAcceptedChange: (accepted: boolean) => void;
};

export function StepReview({
  tour,
  departure,
  guests,
  contact,
  settings,
  accepted,
  hasPassengerDetails,
  errors,
  serverError,
  onAcceptedChange,
}: StepReviewProps) {
  const preview = calculateBookingPreview(tour, departure, guests);

  return (
    <div className="flex flex-col gap-7">
      <section className="rounded-[16px] border border-line bg-surface p-4 md:p-6">
        <h2 className="text-sm font-semibold tracking-[0.08em] text-ink uppercase">
          Thông tin giữ chỗ
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-5 border-t border-line pt-4 sm:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <User aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage" />
            <div>
              <span className="block text-[0.7rem] text-sage">Người đại diện</span>
              <span className="block text-sm font-semibold text-ink">
                {contact.contactName}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage" />
            <div>
              <span className="block text-[0.7rem] text-sage">Điện thoại</span>
              <span className="block font-mono text-sm text-ink">{contact.phone}</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage" />
            <div>
              <span className="block text-[0.7rem] text-sage">Email</span>
              <span className="block break-all text-sm text-ink">
                {contact.email || "Không cung cấp"}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage" />
            <div>
              <span className="block text-[0.7rem] text-sage">Điểm đón</span>
              <span className="block text-sm font-semibold text-ink">
                {contact.pickupPoint}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="block text-[0.7rem] text-sage">Tour đã chọn</span>
              <span className="block text-sm font-semibold text-ink">{tour.name}</span>
            </div>
            <span className="rounded border border-line bg-surface-warm px-2 py-1 font-mono text-[0.7rem] text-clay">
              {tour.code}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-sage">
            <span>
              Khởi hành:{" "}
              <strong className="font-medium text-ink">
                {departure ? formatLongDateVN(departure.date) : "Chưa chọn"}
              </strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users aria-hidden="true" className="size-4" />
              {guests.adults} người lớn
              {guests.children > 0 ? `, ${guests.children} trẻ em` : ""}
              {guests.infants > 0 ? `, ${guests.infants} em bé` : ""}
            </span>
          </div>
          {hasPassengerDetails ? (
            <p className="mt-2 text-xs text-sage">
              Đã bổ sung thông tin hành khách.
            </p>
          ) : null}
          {contact.customerNote ? (
            <p className="mt-3 rounded-[8px] bg-canvas p-3 text-xs leading-5 text-sage">
              <span className="font-semibold text-ink">Ghi chú:</span>{" "}
              {contact.customerNote}
            </p>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-[16px] border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-warm/50 px-4 py-3 md:px-6">
          <h2 className="text-sm font-semibold text-ink">Chi phí tạm tính</h2>
          <span className="text-xs text-sage">Đơn vị: VND</span>
        </div>
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-3 text-sm">
            <span className="text-ink">
              {guests.adults} × Người lớn
            </span>
            <span className="font-mono text-xs text-ink tabular-nums">
              {formatVndDisplay(guests.adults * preview.priceAdult)}
            </span>
          </div>
          {guests.children > 0 ? (
            <div className="flex items-center justify-between gap-4 border-b border-line py-3 text-sm">
              <span className="text-ink">
                {guests.children} × Trẻ em 5–10 tuổi
              </span>
              <span className="font-mono text-xs text-ink tabular-nums">
                {formatVndDisplay(guests.children * preview.priceChild)}
              </span>
            </div>
          ) : null}
          {guests.infants > 0 ? (
            <div className="flex items-center justify-between gap-4 border-b border-line py-3 text-sm">
              <span className="text-ink">
                {guests.infants} × Em bé
              </span>
              <span className="font-mono text-xs text-success">Miễn phí</span>
            </div>
          ) : null}
          {preview.surchargePerPerson > 0 ? (
            <div className="flex items-center justify-between gap-4 border-b border-line py-3 text-sm">
              <span className="text-ink">Phụ thu ngày lễ</span>
              <span className="font-mono text-xs text-ink tabular-nums">
                {formatVndDisplay(preview.billedGuests * preview.surchargePerPerson)}
              </span>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-4 pt-4">
            <div>
              <span className="block text-sm font-semibold text-ink">
                Tổng tạm tính
              </span>
              <span className="mt-0.5 block text-xs text-sage">
                Giá cuối cùng do nhân viên xác nhận
              </span>
            </div>
            <span className="font-display text-2xl font-semibold text-clay tabular-nums">
              {formatVndDisplay(preview.total)}
            </span>
          </div>
        </div>
      </section>

      <div id="booking-policy">
        <BookingPolicy settings={settings} />
      </div>

      <section className="rounded-[16px] border border-line bg-surface-warm/50 p-4 md:p-5">
        <label htmlFor="booking-terms" className="flex cursor-pointer items-start gap-3">
          <input
            id="booking-terms"
            name="booking-terms"
            type="checkbox"
            checked={accepted}
            onChange={(event) => onAcceptedChange(event.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-[var(--site-clay)]"
            aria-invalid={Boolean(errors.terms)}
          />
          <span className="text-sm leading-6 text-sage">
            Tôi đã đọc và đồng ý với chính sách giữ chỗ, đặt cọc, hủy và dời lịch ở
            trên.
          </span>
        </label>
        {errors.terms ? (
          <p role="alert" className="mt-2 text-xs text-danger">
            {errors.terms}
          </p>
        ) : null}
      </section>

      {serverError ? (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2.5 rounded-[12px] border border-danger/30 bg-danger/5 p-4 text-sm leading-6 text-danger"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {serverError}
        </div>
      ) : null}

      <p className={cn("text-xs leading-5 text-sage", errors.form && "text-danger")}>
        {errors.form ??
          "Bằng việc gửi yêu cầu, bạn đồng ý để nhân viên liên hệ xác nhận lịch trình và hướng dẫn đặt cọc."}
      </p>
    </div>
  );
}
