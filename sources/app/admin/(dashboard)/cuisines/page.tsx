import Link from "next/link";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CuisineForm } from "@/components/admin/cuisine-form";
import { requireCapabilityPage } from "@/lib/auth/session";
import {
  listAdminCuisines,
  listCuisineTourOptions,
} from "@/server/content/admin-cuisines";
import { listMediaImageUrls } from "@/server/media/admin-media";
import { createCuisineAction } from "./actions";

export const instant = false;

export const metadata = {
  title: "Món ăn | Quản trị Xuôi Miền Sông Nước",
};

const OK_MESSAGE: Record<string, string> = {
  created: "Đã thêm món ăn.",
  deleted: "Đã xoá món ăn.",
};

const linkClass =
  "inline-flex min-h-9 items-center rounded-[8px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";

export default async function AdminCuisinesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const admin = await requireCapabilityPage("content:write", "/admin/cuisines");
  if (!admin) return <AccessDenied title="Không có quyền quản lý món ăn" />;

  const query = await searchParams;
  const [cuisines, tourOptions, mediaUrls] = await Promise.all([
    listAdminCuisines(),
    listCuisineTourOptions(),
    listMediaImageUrls(),
  ]);
  const okMessage = query.ok ? OK_MESSAGE[query.ok] : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Quản trị", href: "/admin" }, { label: "Món ăn" }]}
        title="Món ăn"
        description="Thêm, sửa hoặc xoá món ăn. Thay đổi áp dụng ngay cho /am-thuc, trang chủ và phần ẩm thực của tour."
        actions={<span className="text-[13px] text-sage">{cuisines.length} món ăn</span>}
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
          Thêm món ăn
        </summary>
        <div className="mt-4">
          <CuisineForm
            action={createCuisineAction}
            tourOptions={tourOptions}
            mediaUrls={mediaUrls}
            submitLabel="Thêm món ăn"
          />
        </div>
      </details>

      {cuisines.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface py-12 text-center">
          <p className="text-[13px] text-sage">Chưa có món ăn nào trong database.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-warm">
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Món ăn
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Vùng
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
              {cuisines.map((cuisine) => (
                <tr key={cuisine.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <span className="block font-medium text-ink">{cuisine.name}</span>
                    <span className="font-mono text-[12px] text-sage">{cuisine.slug}</span>
                  </td>
                  <td className="px-4 py-3 text-ink">{cuisine.province ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{cuisine.tourIds.length}</td>
                  <td className="px-4 py-3 text-right text-ink tabular-nums">
                    {cuisine.sortOrder}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/cuisines/${cuisine.id}`} className={linkClass}>
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
