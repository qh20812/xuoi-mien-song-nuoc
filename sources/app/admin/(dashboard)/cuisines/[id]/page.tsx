import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CuisineForm } from "@/components/admin/cuisine-form";
import { requireCapabilityPage } from "@/lib/auth/session";
import {
  getAdminCuisine,
  listCuisineTourOptions,
} from "@/server/content/admin-cuisines";
import { isAppError } from "@/server/errors";
import { listMediaImageUrls } from "@/server/media/admin-media";
import { deleteCuisineAction, updateCuisineAction } from "../actions";

export const instant = false;

export const metadata = {
  title: "Sửa món ăn | Quản trị Xuôi Miền Sông Nước",
};

const OK_MESSAGE: Record<string, string> = {
  updated: "Đã lưu món ăn.",
};

const ghostButtonClass =
  "h-9 rounded-[10px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";

export default async function AdminCuisineEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const admin = await requireCapabilityPage(
    "content:write",
    `/admin/cuisines/${rawId}`,
  );
  if (!admin) return <AccessDenied title="Không có quyền quản lý món ăn" />;

  const cuisine = await getAdminCuisine(id).catch((error: unknown) => {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  });

  const query = await searchParams;
  const [tourOptions, mediaUrls] = await Promise.all([
    listCuisineTourOptions(),
    listMediaImageUrls(),
  ]);
  const okMessage = query.ok ? OK_MESSAGE[query.ok] : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[
          { label: "Quản trị", href: "/admin" },
          { label: "Món ăn", href: "/admin/cuisines" },
          { label: cuisine.name },
        ]}
        title={cuisine.name}
        description={`${cuisine.slug} · ${cuisine.province ?? "Chưa rõ vùng"} · ${cuisine.tourIds.length} tour liên kết`}
        actions={
          <Link href="/admin/cuisines" className={ghostButtonClass}>
            Về danh sách
          </Link>
        }
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

      <section className="rounded-xl border border-line bg-surface p-4 md:p-5">
        <CuisineForm
          action={updateCuisineAction}
          cuisine={cuisine}
          tourOptions={tourOptions}
          mediaUrls={mediaUrls}
          submitLabel="Lưu thay đổi"
        />
      </section>

      <details className="rounded-xl border border-danger/30 bg-danger/5 p-4">
        <summary className="cursor-pointer text-[13px] font-semibold text-danger">
          Xoá món ăn
        </summary>
        <p className="mt-2 text-[13px] leading-6 text-sage">
          Xoá vĩnh viễn món ăn này khỏi database. Liên kết với tour cũng bị xoá.
          Hành động không thể hoàn tác.
        </p>
        <form action={deleteCuisineAction} className="mt-3">
          <input type="hidden" name="id" value={cuisine.id} />
          <button
            type="submit"
            className="h-9 rounded-[10px] bg-danger px-3 text-[12px] font-semibold text-white transition-colors hover:bg-danger/90 focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:outline-none"
          >
            Xoá món ăn
          </button>
        </form>
      </details>
    </div>
  );
}
