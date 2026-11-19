import Link from "next/link";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireCapabilityPage } from "@/lib/auth/session";
import { formatDateVN, formatVndDisplay } from "@/lib/format";
import { listAdminTours } from "@/server/catalog/admin-departures";

export const instant = false;

export const metadata = {
  title: "Tour & chuyến khởi hành | Quản trị Xuôi Miền Sông Nước",
};

const TOUR_STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  published: "Đang bán",
  archived: "Lưu trữ",
};

export default async function AdminToursPage() {
  const admin = await requireCapabilityPage("catalog:write", "/admin/tours");
  if (!admin) return <AccessDenied />;

  const tours = await listAdminTours();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Quản trị", href: "/admin" }, { label: "Tour & chuyến" }]}
        title="Tour & chuyến khởi hành"
        description="Mở bán chuyến mới, chỉnh số chỗ và giá, đóng hoặc huỷ chuyến. Thay đổi áp dụng ngay cho trang đặt tour."
        actions={<span className="text-[13px] text-sage">{tours.length} tour</span>}
      />

      {tours.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface py-12 text-center">
          <p className="text-[13px] text-sage">Chưa có tour nào trong database.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-warm">
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Mã
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Tour
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Trạng thái
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Chuyến đang mở
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Chuyến gần nhất
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Chỗ đã bán / tổng
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Giá từ
                </th>
                <th scope="col" className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tours.map((tour) => (
                <tr key={tour.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3 font-mono text-[12px] text-sage">{tour.code}</td>
                  <td className="px-4 py-3">
                    <span className="block font-medium text-ink">{tour.name}</span>
                    <span className="text-[12px] text-sage">
                      {tour.departureCount} chuyến đã tạo
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        tour.status === "published"
                          ? "inline-flex rounded-full bg-success/10 px-2.5 py-1 text-[12px] font-medium text-success"
                          : "inline-flex rounded-full bg-surface-warm px-2.5 py-1 text-[12px] font-medium text-sage"
                      }
                    >
                      {TOUR_STATUS_LABEL[tour.status] ?? tour.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink">{tour.openDepartureCount}</td>
                  <td className="px-4 py-3 text-ink">
                    {tour.nextDepartureDate ? formatDateVN(tour.nextDepartureDate) : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {tour.seatsTaken} / {tour.capacityTotal}
                  </td>
                  <td className="px-4 py-3 text-ink">{formatVndDisplay(tour.basePriceAdult)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/tours/${tour.slug}`}
                        className="text-[13px] font-medium text-clay underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
                      >
                        Sửa
                      </Link>
                      <Link
                        href={`/admin/tours/${tour.slug}/departures`}
                        className="text-[13px] font-medium text-clay underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
                      >
                        Quản lý chuyến
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
