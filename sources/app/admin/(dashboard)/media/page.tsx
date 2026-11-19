import Image from "next/image";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireCapabilityPage } from "@/lib/auth/session";
import {
  MEDIA_TYPES,
  MEDIA_TYPE_LABEL,
  listAdminMedia,
} from "@/server/media/admin-media";
import { createMediaAction, deleteMediaAction, updateMediaAction } from "./actions";

export const metadata = {
  title: "Thư viện ảnh | Quản trị Xuôi Miền Sông Nước",
};

const OK_MESSAGE: Record<string, string> = {
  created: "Đã thêm media.",
  updated: "Đã lưu media.",
  deleted: "Đã xoá media.",
};

const fieldClass =
  "h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const labelClass = "text-[12px] font-semibold text-sage";
const primaryButtonClass =
  "h-10 rounded-[10px] bg-clay px-4 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none";

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const admin = await requireCapabilityPage("content:write", "/admin/media");
  if (!admin) return <AccessDenied title="Không có quyền quản lý thư viện ảnh" />;

  const query = await searchParams;
  const media = await listAdminMedia();
  const okMessage = query.ok ? OK_MESSAGE[query.ok] : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Quản trị", href: "/admin" }, { label: "Thư viện ảnh" }]}
        title="Thư viện ảnh"
        description="Danh mục ảnh/video dùng làm gợi ý khi chọn ảnh bìa tour. Ảnh phải nằm trong /public/images vì next/image không còn nhận host ngoài."
        actions={<span className="text-[13px] text-sage">{media.length} mục</span>}
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
        <h2 className="text-[15px] font-semibold text-ink">Thêm media</h2>

        <form action={createMediaAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-type" className={labelClass}>
              Loại
            </label>
            <select id="new-type" name="type" defaultValue="image" className={fieldClass}>
              {MEDIA_TYPES.map((type) => (
                <option key={type} value={type}>
                  {MEDIA_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="new-url" className={labelClass}>
              Đường dẫn *
            </label>
            <input
              id="new-url"
              name="url"
              required
              maxLength={1000}
              placeholder="/images/23-xuong-may-tren-kenh-phu-sa.webp"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-sortOrder" className={labelClass}>
              Thứ tự
            </label>
            <input
              id="new-sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              max={9999}
              defaultValue={0}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="new-title" className={labelClass}>
              Tiêu đề
            </label>
            <input id="new-title" name="title" maxLength={255} className={fieldClass} />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="new-alt" className={labelClass}>
              Alt text
            </label>
            <input id="new-alt" name="alt" maxLength={255} className={fieldClass} />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="new-tags" className={labelClass}>
              Tags (cách nhau dấu phẩy)
            </label>
            <input id="new-tags" name="tags" maxLength={500} className={fieldClass} />
          </div>

          <label className="flex items-center gap-2 text-[12px] text-ink">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked
              className="size-4 rounded border-line"
            />
            Đang dùng
          </label>

          <div className="md:col-span-4">
            <button type="submit" className={primaryButtonClass}>
              Thêm media
            </button>
          </div>
        </form>
      </section>

      {media.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface py-12 text-center">
          <p className="text-[13px] text-sage">Thư viện đang trống.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {media.map((item) => (
            <li key={item.id} className="rounded-xl border border-line bg-surface p-3">
              <div className="flex gap-3">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-[10px] border border-line bg-surface-warm">
                  {item.type === "image" ? (
                    <Image
                      src={item.url}
                      alt={item.alt ?? ""}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[11px] text-sage">
                      Video
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">
                    {item.title ?? "(chưa đặt tiêu đề)"}
                  </p>
                  <p className="truncate text-[12px] text-sage">{item.url}</p>
                  <p className="mt-1 text-[12px] text-sage">
                    {MEDIA_TYPE_LABEL[item.type]} · thứ tự {item.sortOrder} ·{" "}
                    {item.isActive ? "đang dùng" : "đã tắt"}
                  </p>
                  {item.tags.length > 0 ? (
                    <p className="mt-1 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-surface-warm px-1.5 py-0.5 text-[11px] text-sage"
                        >
                          {tag}
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-start gap-2 border-t border-line pt-3">
                <details className="flex-1 rounded-[10px] border border-line bg-surface-warm/60">
                  <summary className="cursor-pointer px-3 py-2 text-[12px] font-semibold text-ink">
                    Sửa
                  </summary>

                  <form action={updateMediaAction} className="grid grid-cols-2 gap-3 p-3">
                    <input type="hidden" name="mediaId" value={item.id} />

                    <div className="col-span-1 flex flex-col gap-1">
                      <label
                        htmlFor={`type-${item.id}`}
                        className="text-[11px] font-semibold text-sage"
                      >
                        Loại
                      </label>
                      <select
                        id={`type-${item.id}`}
                        name="type"
                        defaultValue={item.type}
                        className={fieldClass}
                      >
                        {MEDIA_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {MEDIA_TYPE_LABEL[type]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1 flex flex-col gap-1">
                      <label
                        htmlFor={`sort-${item.id}`}
                        className="text-[11px] font-semibold text-sage"
                      >
                        Thứ tự
                      </label>
                      <input
                        id={`sort-${item.id}`}
                        name="sortOrder"
                        type="number"
                        min={0}
                        max={9999}
                        defaultValue={item.sortOrder}
                        className={fieldClass}
                      />
                    </div>

                    <div className="col-span-2 flex flex-col gap-1">
                      <label
                        htmlFor={`url-${item.id}`}
                        className="text-[11px] font-semibold text-sage"
                      >
                        Đường dẫn
                      </label>
                      <input
                        id={`url-${item.id}`}
                        name="url"
                        required
                        maxLength={1000}
                        defaultValue={item.url}
                        className={fieldClass}
                      />
                    </div>

                    <div className="col-span-1 flex flex-col gap-1">
                      <label
                        htmlFor={`title-${item.id}`}
                        className="text-[11px] font-semibold text-sage"
                      >
                        Tiêu đề
                      </label>
                      <input
                        id={`title-${item.id}`}
                        name="title"
                        maxLength={255}
                        defaultValue={item.title ?? ""}
                        className={fieldClass}
                      />
                    </div>

                    <div className="col-span-1 flex flex-col gap-1">
                      <label
                        htmlFor={`alt-${item.id}`}
                        className="text-[11px] font-semibold text-sage"
                      >
                        Alt
                      </label>
                      <input
                        id={`alt-${item.id}`}
                        name="alt"
                        maxLength={255}
                        defaultValue={item.alt ?? ""}
                        className={fieldClass}
                      />
                    </div>

                    <div className="col-span-2 flex flex-col gap-1">
                      <label
                        htmlFor={`tags-${item.id}`}
                        className="text-[11px] font-semibold text-sage"
                      >
                        Tags (cách nhau dấu phẩy)
                      </label>
                      <input
                        id={`tags-${item.id}`}
                        name="tags"
                        maxLength={500}
                        defaultValue={item.tags.join(", ")}
                        className={fieldClass}
                      />
                    </div>

                    <label className="col-span-2 flex items-center gap-2 text-[12px] text-ink">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={item.isActive}
                        className="size-4 rounded border-line"
                      />
                      Đang dùng
                    </label>

                    <div className="col-span-2">
                      <button type="submit" className={primaryButtonClass}>
                        Lưu
                      </button>
                    </div>
                  </form>
                </details>

                <form action={deleteMediaAction}>
                  <input type="hidden" name="mediaId" value={item.id} />
                  <button
                    type="submit"
                    className="h-9 rounded-[10px] border border-danger/30 px-3 text-[12px] font-semibold text-danger transition-colors hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:outline-none"
                  >
                    Xoá
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[12px] text-sage">
        Muốn thêm ảnh mới: chép file vào <code>public/images</code> rồi khai báo
        đường dẫn ở đây.
      </p>
    </div>
  );
}
