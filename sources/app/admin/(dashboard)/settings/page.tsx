import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireCapabilityPage } from "@/lib/auth/session";
import { siteSettings } from "@/lib/fixtures/site";
import { getBookingSettings } from "@/server/settings/get-booking-settings";
import { saveBookingSettingsAction } from "./actions";

export const instant = false;

export const metadata = {
  title: "Cấu hình đặt tour | Quản trị Xuôi Miền Sông Nước",
};

const fieldClass =
  "h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const labelClass = "text-[12px] font-semibold text-sage";

const FIELDS = [
  {
    name: "minDaysAhead",
    label: "Số ngày đặt trước tối thiểu",
    hint: "Chuyến khởi hành gần hơn mức này sẽ không hiện cho khách đặt.",
    min: 0,
    max: 60,
    unit: "ngày",
  },
  {
    name: "maxGuestsPerOrder",
    label: "Số khách tối đa mỗi đơn",
    hint: "Tính cả người lớn, trẻ em và em bé.",
    min: 1,
    max: 50,
    unit: "khách",
  },
  {
    name: "holdHours",
    label: "Thời gian giữ chỗ",
    hint: "Quá thời gian này mà chưa xác nhận, đơn tự chuyển sang hết hạn.",
    min: 1,
    max: 168,
    unit: "giờ",
  },
  {
    name: "cancelCutoffDays",
    label: "Hạn khách tự huỷ",
    hint: "Khách được tự huỷ khi còn ít nhất số ngày này trước khởi hành.",
    min: 0,
    max: 30,
    unit: "ngày",
  },
] as const;

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const admin = await requireCapabilityPage("settings:write", "/admin/settings");
  if (!admin) return <AccessDenied title="Chỉ quản trị viên đổi được cấu hình" />;

  const query = await searchParams;
  const settings = await getBookingSettings();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Quản trị", href: "/admin" }, { label: "Cấu hình" }]}
        title="Cấu hình đặt tour"
        description="Áp dụng cho cả giao diện đặt tour và phần kiểm tra phía server — server luôn đọc từ database nên không thể lệch với UI."
      />

      {query.ok ? (
        <p
          role="status"
          className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-[13px] text-success"
        >
          Đã lưu cấu hình.
        </p>
      ) : null}

      {query.error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger"
        >
          {query.error}
        </p>
      ) : null}

      <form
        action={saveBookingSettingsAction}
        className="rounded-xl border border-line bg-surface p-4 md:p-5"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label htmlFor={field.name} className={labelClass}>
                {field.label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  inputMode="numeric"
                  min={field.min}
                  max={field.max}
                  required
                  defaultValue={settings[field.name]}
                  className={fieldClass}
                />
                <span className="shrink-0 text-[12px] text-sage">{field.unit}</span>
              </div>
              <p className="text-[12px] leading-5 text-sage">
                {field.hint} Giới hạn {field.min}–{field.max}.
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
          <button
            type="submit"
            className="h-10 rounded-[10px] bg-clay px-4 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
          >
            Lưu cấu hình
          </button>
          <span className="text-[12px] text-sage">
            Thay đổi có hiệu lực ngay với các đơn mới.
          </span>
        </div>
      </form>

      <section className="rounded-xl border border-line bg-surface-warm/60 p-4 md:p-5">
        <h2 className="text-[14px] font-semibold text-ink">Thông tin thương hiệu</h2>
        <p className="mt-1 text-[12px] leading-6 text-sage">
          Tên site, hotline, Zalo, email và địa chỉ đang đọc từ fixture
          (<code className="rounded bg-surface px-1 py-0.5">lib/fixtures/site.ts</code>),
          không đọc từ database — sửa ở đây sẽ không đổi nội dung công khai. Bản
          đang dùng:
        </p>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
          <div>
            <dt className="text-[12px] text-sage">Hotline</dt>
            <dd className="text-ink">{siteSettings.hotline}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-sage">Email</dt>
            <dd className="text-ink">{siteSettings.email}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[12px] text-sage">Địa chỉ</dt>
            <dd className="text-ink">{siteSettings.address}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
