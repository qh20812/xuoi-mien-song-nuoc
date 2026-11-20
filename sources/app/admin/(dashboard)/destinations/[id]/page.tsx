import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DestinationForm } from "@/components/admin/destination-form";
import { requireCapabilityPage } from "@/lib/auth/session";
import {
  getAdminDestination,
  listTourOptions,
} from "@/server/content/admin-destinations";
import { isAppError } from "@/server/errors";
import { listMediaImageUrls } from "@/server/media/admin-media";
import {
  deleteDestinationAction,
  updateDestinationAction,
} from "../actions";

export const instant = false;

export const metadata = {
  title: "Sửa điểm đến | Quản trị Xuôi Miền Sông Nước",
};

const OK_MESSAGE: Record<string, string> = {
  updated: "Đã lưu điểm đến.",
};

const ghostButtonClass =
  "h-9 rounded-[10px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";

export default async function AdminDestinationEditPage({
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
    `/admin/destinations/${rawId}`,
  );
  if (!admin) return <AccessDenied title="Không có quyền quản lý điểm đến" />;

  const destination = await getAdminDestination(id).catch((error: unknown) => {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  });

  const query = await searchParams;
  const [tourOptions, mediaUrls] = await Promise.all([
    listTourOptions(),
    listMediaImageUrls(),
  ]);
  const okMessage = query.ok ? OK_MESSAGE[query.ok] : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[
          { label: "Quản trị", href: "/admin" },
          { label: "Điểm đến", href: "/admin/destinations" },
          { label: destination.name },
        ]}
        title={destination.name}
        description={`${destination.slug} · ${destination.province} · ${destination.tourIds.length} tour liên kết`}
        actions={
          <Link href="/admin/destinations" className={ghostButtonClass}>
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
        <DestinationForm
          action={updateDestinationAction}
          destination={destination}
          tourOptions={tourOptions}
          mediaUrls={mediaUrls}
          submitLabel="Lưu thay đổi"
        />
      </section>

      <details className="rounded-xl border border-danger/30 bg-danger/5 p-4">
        <summary className="cursor-pointer text-[13px] font-semibold text-danger">
          Xoá điểm đến
        </summary>
        <p className="mt-2 text-[13px] leading-6 text-sage">
          Xoá vĩnh viễn điểm đến này khỏi database. Liên kết với tour cũng bị xoá.
          Hành động không thể hoàn tác.
        </p>
        <form action={deleteDestinationAction} className="mt-3">
          <input type="hidden" name="id" value={destination.id} />
          <button
            type="submit"
            className="h-9 rounded-[10px] bg-danger px-3 text-[12px] font-semibold text-white transition-colors hover:bg-danger/90 focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:outline-none"
          >
            Xoá điểm đến
          </button>
        </form>
      </details>
    </div>
  );
}
