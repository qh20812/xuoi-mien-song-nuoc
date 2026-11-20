import Link from "next/link";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DestinationForm } from "@/components/admin/destination-form";
import { requireCapabilityPage } from "@/lib/auth/session";
import { CATEGORY_LABELS } from "@/lib/destinations/categories";
import {
  DESTINATION_STATUS_LABEL,
  listAdminDestinations,
  listTourOptions,
} from "@/server/content/admin-destinations";
import { listMediaImageUrls } from "@/server/media/admin-media";
import { createDestinationAction } from "./actions";

export const instant = false;

export const metadata = {
  title: "Điểm đến | Quản trị Xuôi Miền Sông Nước",
};

const OK_MESSAGE: Record<string, string> = {
  created: "Đã thêm điểm đến.",
  deleted: "Đã xoá điểm đến.",
};

const linkClass =
  "inline-flex min-h-9 items-center rounded-[8px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";

export default async function AdminDestinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const admin = await requireCapabilityPage("content:write", "/admin/destinations");
  if (!admin) return <AccessDenied title="Không có quyền quản lý điểm đến" />;

  const query = await searchParams;
  const [destinations, tourOptions, mediaUrls] = await Promise.all([
    listAdminDestinations(),
    listTourOptions(),
    listMediaImageUrls(),
  ]);
  const okMessage = query.ok ? OK_MESSAGE[query.ok] : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Quản trị", href: "/admin" }, { label: "Điểm đến" }]}
        title="Điểm đến"
        description="Thêm, sửa, ẩn hoặc xoá điểm đến. Thay đổi áp dụng ngay cho /diem-den, trang chủ và phần điểm đến của tour."
        actions={<span className="text-[13px] text-sage">{destinations.length} điểm đến</span>}
      />

      {okMessage ? (
        <p
          role="status"
          className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-[13px] text-success"
        >
          {okMessage}
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

      <details className="rounded-xl border border-line bg-surface p-4 md:p-5">
        <summary className="cursor-pointer text-[15px] font-semibold text-ink">
          Thêm điểm đến
        </summary>
        <div className="mt-4">
          <DestinationForm
            action={createDestinationAction}
            tourOptions={tourOptions}
            mediaUrls={mediaUrls}
            submitLabel="Thêm điểm đến"
          />
        </div>
      </details>

      {destinations.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface py-12 text-center">
          <p className="text-[13px] text-sage">Chưa có điểm đến nào trong database.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-warm">
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Điểm đến
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Tỉnh/thành
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Nhóm
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Trạng thái
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Tour
                </th>
                <th scope="col" className="px-4 py-3 text-right text-[12px] font-semibold text-sage">
                  Thứ tự
                </th>
                <th scope="col" className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {destinations.map((destination) => (
                <tr key={destination.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <span className="block font-medium text-ink">{destination.name}</span>
                    <span className="font-mono text-[12px] text-sage">{destination.slug}</span>
                  </td>
                  <td className="px-4 py-3 text-ink">{destination.province}</td>
                  <td className="px-4 py-3 text-sage">
                    {CATEGORY_LABELS[destination.category]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        destination.status === "published"
                          ? "inline-flex rounded-full bg-success/10 px-2.5 py-1 text-[12px] font-medium text-success"
                          : "inline-flex rounded-full bg-surface-warm px-2.5 py-1 text-[12px] font-medium text-sage"
                      }
                    >
                      {DESTINATION_STATUS_LABEL[destination.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink">{destination.tourIds.length}</td>
                  <td className="px-4 py-3 text-right text-ink tabular-nums">
                    {destination.sortOrder}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/destinations/${destination.id}`} className={linkClass}>
                      Sửa
                    </Link>
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
