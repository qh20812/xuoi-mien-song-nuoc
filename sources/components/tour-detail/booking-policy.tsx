import { Clock3, RotateCcw, ShieldCheck } from "lucide-react";
import type { SiteSettings } from "@/lib/contracts/site";

type BookingPolicyProps = {
  settings: SiteSettings;
};

export function BookingPolicy({ settings }: BookingPolicyProps) {
  const { holdHours, cancelCutoffDays } = settings.booking;

  return (
    <section aria-labelledby="tour-policy" className="border-t border-line pt-8">
      <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
        Chính sách minh bạch
      </span>
      <h2
        id="tour-policy"
        className="mt-2 font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight font-semibold text-ink"
      >
        Giữ chỗ, hủy và dời lịch
      </h2>

      <div className="mt-7 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="border-t border-line pt-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Clock3 aria-hidden="true" className="size-4 text-clay" />
            Giữ chỗ & đặt cọc
          </h3>
          <p className="mt-2 text-sm leading-6 text-sage">
            Đơn online được giữ tối đa {holdHours} giờ và chưa thu tiền trực tuyến.
            Nhân viên liên hệ hướng dẫn đặt cọc để xác nhận; tiền cọc được trừ vào
            tổng giá tour.
          </p>
        </div>

        <div className="border-t border-line pt-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ShieldCheck aria-hidden="true" className="size-4 text-clay" />
            Hủy & hoàn cọc
          </h3>
          <p className="mt-2 text-sm leading-6 text-sage">
            Hủy trước ít nhất {cancelCutoffDays} ngày: miễn phí và hoàn 100% tiền
            cọc. Trong vòng {cancelCutoffDays} ngày, vui lòng liên hệ hotline; khoản
            hoàn được tính theo chi phí thực tế đã phát sinh.
          </p>
        </div>

        <div className="border-t border-line pt-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <RotateCcw aria-hidden="true" className="size-4 text-clay" />
            Dời lịch
          </h3>
          <p className="mt-2 text-sm leading-6 text-sage">
            Miễn phí thủ tục dời lịch khi chuyến mới còn chỗ. Tiền cọc được chuyển
            sang ngày mới; phần chênh lệch giá tour, nếu có, được xử lý theo báo giá
            mới.
          </p>
        </div>
      </div>

      <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-sage">
        Trường hợp bất khả kháng như thiên tai, dịch bệnh hoặc lệnh cấm đi lại,
        chuyến đi được ưu tiên bảo lưu; nếu không thể sắp xếp sẽ hoàn theo thỏa
        thuận.
      </p>
    </section>
  );
}
