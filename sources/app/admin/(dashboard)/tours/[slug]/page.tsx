import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireAdminPage } from "@/lib/auth/session";
import { formatVndDisplay } from "@/lib/format";
import {
  TOUR_STATUS_LABEL,
  getAdminTour,
} from "@/server/catalog/admin-tours";
import { isAppError } from "@/server/errors";
import { listMediaImageUrls } from "@/server/media/admin-media";
import { setTourStatusAction, updateTourContentAction } from "./actions";

export const metadata = {
  title: "Sửa tour | Quản trị Xuôi Miền Sông Nước",
};

const OK_MESSAGE: Record<string, string> = {
  saved: "Đã lưu nội dung tour.",
  status: "Đã đổi trạng thái bán.",
};

const fieldClass =
  "h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const textareaClass =
  "w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] leading-6 text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const labelClass = "text-[12px] font-semibold text-sage";
const primaryButtonClass =
  "h-10 rounded-[10px] bg-clay px-4 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none";
const ghostButtonClass =
  "h-9 rounded-[10px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";

export default async function AdminTourEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { slug } = await params;
  await requireAdminPage(`/admin/tours/${slug}`);

  const query = await searchParams;

  const tour = await getAdminTour(slug).catch((error: unknown) => {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  });

  const mediaUrls = await listMediaImageUrls();
  const okMessage = query.ok ? OK_MESSAGE[query.ok] : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[
          { label: "Quản trị", href: "/admin" },
          { label: "Tour & chuyến", href: "/admin/tours" },
          { label: tour.code },
        ]}
        title={tour.name}
        description={`${tour.code} · ${TOUR_STATUS_LABEL[tour.status]} · ${tour.departureCount} chuyến · giá cơ bản ${formatVndDisplay(tour.basePriceAdult)}`}
        actions={
          <Link href={`/admin/tours/${tour.slug}/departures`} className={ghostButtonClass}>
            Quản lý chuyến
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

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-4">
        <span className="text-[12px] font-semibold text-sage">Trạng thái bán:</span>
        {(["draft", "published", "archived"] as const).map((status) => (
          <form key={status} action={setTourStatusAction}>
            <input type="hidden" name="slug" value={tour.slug} />
            <input type="hidden" name="status" value={status} />
            <button
              type="submit"
              disabled={tour.status === status}
              className={
                tour.status === status
                  ? "h-9 rounded-[10px] border border-clay bg-clay/10 px-3 text-[12px] font-semibold text-clay"
                  : ghostButtonClass
              }
            >
              {TOUR_STATUS_LABEL[status]}
            </button>
          </form>
        ))}
        <span className="ml-auto text-[12px] text-sage">
          Chỉ tour “Đang bán” mới hiện cho khách đặt.
        </span>
      </div>

      <form
        action={updateTourContentAction}
        className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-4 md:p-5"
      >
        <input type="hidden" name="slug" value={tour.slug} />

        <fieldset className="flex flex-col gap-3">
          <legend className="text-[15px] font-semibold text-ink">Thông tin chung</legend>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className={labelClass}>
                Tên tour *
              </label>
              <input
                id="name"
                name="name"
                required
                maxLength={200}
                defaultValue={tour.name}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="tagline" className={labelClass}>
                Tagline
              </label>
              <input
                id="tagline"
                name="tagline"
                maxLength={255}
                defaultValue={tour.tagline ?? ""}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="summary" className={labelClass}>
                Tóm tắt (hiện ở danh sách tour)
              </label>
              <textarea
                id="summary"
                name="summary"
                rows={3}
                maxLength={2000}
                defaultValue={tour.summary ?? ""}
                className={textareaClass}
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="description" className={labelClass}>
                Mô tả dài
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                defaultValue={tour.description ?? ""}
                className={textareaClass}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3 border-t border-line pt-4">
          <legend className="text-[15px] font-semibold text-ink">
            Thời lượng &amp; giá
          </legend>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="durationDays" className={labelClass}>
                Số ngày *
              </label>
              <input
                id="durationDays"
                name="durationDays"
                type="number"
                min={1}
                max={30}
                required
                defaultValue={tour.durationDays}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="durationNights" className={labelClass}>
                Số đêm *
              </label>
              <input
                id="durationNights"
                name="durationNights"
                type="number"
                min={0}
                max={29}
                required
                defaultValue={tour.durationNights}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="basePriceAdult" className={labelClass}>
                Giá người lớn *
              </label>
              <input
                id="basePriceAdult"
                name="basePriceAdult"
                type="number"
                min={0}
                step={1000}
                required
                defaultValue={tour.basePriceAdult}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="basePriceChild" className={labelClass}>
                Giá trẻ em *
              </label>
              <input
                id="basePriceChild"
                name="basePriceChild"
                type="number"
                min={0}
                step={1000}
                required
                defaultValue={tour.basePriceChild}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="childAgeNote" className={labelClass}>
                Ghi chú độ tuổi trẻ em
              </label>
              <input
                id="childAgeNote"
                name="childAgeNote"
                maxLength={255}
                defaultValue={tour.childAgeNote ?? ""}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="sortOrder" className={labelClass}>
                Thứ tự hiển thị
              </label>
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                max={999}
                defaultValue={tour.sortOrder}
                className={fieldClass}
              />
            </div>

            <label className="flex items-center gap-2 self-end text-[12px] text-ink">
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={tour.isFeatured}
                className="size-4 rounded border-line"
              />
              Tour nổi bật
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3 border-t border-line pt-4">
          <legend className="text-[15px] font-semibold text-ink">Ảnh bìa</legend>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="coverImageUrl" className={labelClass}>
                Đường dẫn ảnh nội bộ
              </label>
              <input
                id="coverImageUrl"
                name="coverImageUrl"
                maxLength={500}
                list="media-image-urls"
                defaultValue={tour.coverImageUrl ?? ""}
                placeholder="/images/23-xuong-may-tren-kenh-phu-sa.webp"
                className={fieldClass}
              />
              <datalist id="media-image-urls">
                {mediaUrls.map((url) => (
                  <option key={url} value={url} />
                ))}
              </datalist>
              <p className="text-[12px] leading-5 text-sage">
                Chỉ nhận ảnh trong `/public/images`. Danh sách gợi ý lấy từ thư
                viện media ({mediaUrls.length} ảnh).
              </p>
            </div>

            {tour.coverImageUrl ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] border border-line bg-surface-warm">
                <Image
                  src={tour.coverImageUrl}
                  alt=""
                  fill
                  sizes="180px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-[10px] border border-dashed border-line text-[12px] text-sage">
                Chưa có ảnh bìa
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3 border-t border-line pt-4">
          <legend className="text-[15px] font-semibold text-ink">
            Chính sách &amp; dặn dò
          </legend>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cancellationPolicy" className={labelClass}>
                Chính sách huỷ
              </label>
              <textarea
                id="cancellationPolicy"
                name="cancellationPolicy"
                rows={4}
                maxLength={5000}
                defaultValue={tour.cancellationPolicy ?? ""}
                className={textareaClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="packingNotes" className={labelClass}>
                Dặn dò hành lý
              </label>
              <textarea
                id="packingNotes"
                name="packingNotes"
                rows={4}
                maxLength={5000}
                defaultValue={tour.packingNotes ?? ""}
                className={textareaClass}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3 border-t border-line pt-4">
          <legend className="text-[15px] font-semibold text-ink">SEO</legend>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="seoTitle" className={labelClass}>
                Tiêu đề SEO
              </label>
              <input
                id="seoTitle"
                name="seoTitle"
                maxLength={200}
                defaultValue={tour.seoTitle ?? ""}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="seoDescription" className={labelClass}>
                Mô tả SEO
              </label>
              <input
                id="seoDescription"
                name="seoDescription"
                maxLength={320}
                defaultValue={tour.seoDescription ?? ""}
                className={fieldClass}
              />
            </div>
          </div>
        </fieldset>

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <button type="submit" className={primaryButtonClass}>
            Lưu thay đổi
          </button>
          <Link
            href="/admin/tours"
            className="text-[13px] font-medium text-sage transition-colors hover:text-ink"
          >
            Huỷ
          </Link>
        </div>
      </form>
    </div>
  );
}
