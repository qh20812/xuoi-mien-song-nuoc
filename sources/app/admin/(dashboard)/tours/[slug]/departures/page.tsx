import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireAdminPage } from "@/lib/auth/session";
import { formatDateVN, formatVndDisplay } from "@/lib/format";
import {
  DEPARTURE_STATUS_LABEL,
  getAdminTourDepartures,
} from "@/server/catalog/admin-departures";
import { isAppError } from "@/server/errors";
import {
  createDepartureAction,
  deleteDepartureAction,
  setDepartureStatusAction,
  updateDepartureAction,
} from "./actions";

export const metadata = {
  title: "Chuyến khởi hành | Quản trị Xuôi Miền Sông Nước",
};

const OK_MESSAGE: Record<string, string> = {
  created: "Đã thêm chuyến khởi hành.",
  updated: "Đã lưu thay đổi.",
  status: "Đã đổi trạng thái chuyến.",
  deleted: "Đã xoá chuyến.",
};

const fieldClass =
  "h-10 rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const labelClass = "text-[12px] font-semibold text-sage";
const primaryButtonClass =
  "h-10 rounded-[10px] bg-clay px-4 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none";
const secondaryButtonClass =
  "h-9 rounded-[10px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-success/10 text-success",
  closed: "bg-surface-warm text-sage",
  cancelled: "bg-danger/10 text-danger",
};

export default async function AdminTourDeparturesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { slug } = await params;
  await requireAdminPage(`/admin/tours/${slug}/departures`);

  const query = await searchParams;

  const data = await getAdminTourDepartures(slug).catch((error: unknown) => {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  });

  const { tour, departures } = data;
  const okMessage = query.ok ? OK_MESSAGE[query.ok] : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[
          { label: "Quản trị", href: "/admin" },
          { label: "Tour & chuyến", href: "/admin/tours" },
          { label: tour.name },
        ]}
        title={tour.name}
        description={`${tour.code} · ${tour.durationDays}N${tour.durationNights}Đ · giá cơ bản ${formatVndDisplay(tour.basePriceAdult)}/khách. Chuyến không khai giá riêng sẽ dùng giá này.`}
        actions={
          <span className="text-[13px] text-sage">{departures.length} chuyến</span>
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

      <section
        aria-labelledby="add-departure"
        className="rounded-xl border border-line bg-surface p-4 md:p-5"
      >
        <h2 id="add-departure" className="text-[15px] font-semibold text-ink">
          Thêm chuyến khởi hành
        </h2>
        <p className="mt-1 text-[12px] text-sage">
          Mỗi tour chỉ có một chuyến cho mỗi ngày. Bỏ trống giá nếu muốn dùng giá
          cơ bản của tour.
        </p>

        <form action={createDepartureAction} className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <input type="hidden" name="tourSlug" value={tour.slug} />

          <div className="col-span-1 flex flex-col gap-1.5">
            <label htmlFor="new-departureDate" className={labelClass}>
              Khởi hành *
            </label>
            <input
              id="new-departureDate"
              name="departureDate"
              type="date"
              required
              className={fieldClass}
            />
          </div>

          <div className="col-span-1 flex flex-col gap-1.5">
            <label htmlFor="new-returnDate" className={labelClass}>
              Ngày về
            </label>
            <input id="new-returnDate" name="returnDate" type="date" className={fieldClass} />
          </div>

          <div className="col-span-1 flex flex-col gap-1.5">
            <label htmlFor="new-capacityTotal" className={labelClass}>
              Số chỗ *
            </label>
            <input
              id="new-capacityTotal"
              name="capacityTotal"
              type="number"
              min={1}
              max={200}
              required
              defaultValue={20}
              className={fieldClass}
            />
          </div>

          <div className="col-span-1 flex flex-col gap-1.5">
            <label htmlFor="new-holidaySurcharge" className={labelClass}>
              Phụ thu lễ (đ)
            </label>
            <input
              id="new-holidaySurcharge"
              name="holidaySurcharge"
              type="number"
              min={0}
              step={1000}
              defaultValue={0}
              className={fieldClass}
            />
          </div>

          <div className="col-span-1 flex flex-col gap-1.5">
            <label htmlFor="new-priceAdult" className={labelClass}>
              Giá người lớn (đ)
            </label>
            <input
              id="new-priceAdult"
              name="priceAdult"
              type="number"
              min={0}
              step={1000}
              placeholder={String(tour.basePriceAdult)}
              className={fieldClass}
            />
          </div>

          <div className="col-span-1 flex flex-col gap-1.5">
            <label htmlFor="new-priceChild" className={labelClass}>
              Giá trẻ em (đ)
            </label>
            <input
              id="new-priceChild"
              name="priceChild"
              type="number"
              min={0}
              step={1000}
              placeholder={String(tour.basePriceChild)}
              className={fieldClass}
            />
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <label htmlFor="new-meetingPoint" className={labelClass}>
              Điểm đón
            </label>
            <input
              id="new-meetingPoint"
              name="meetingPoint"
              maxLength={255}
              className={fieldClass}
            />
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <label htmlFor="new-note" className={labelClass}>
              Ghi chú nội bộ
            </label>
            <input id="new-note" name="note" maxLength={500} className={fieldClass} />
          </div>

          <div className="col-span-2 flex items-end md:col-span-4">
            <button type="submit" className={primaryButtonClass}>
              Thêm chuyến
            </button>
          </div>
        </form>
      </section>

      {departures.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface py-12 text-center">
          <p className="text-[13px] text-sage">Tour chưa có chuyến nào.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-warm">
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Khởi hành
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Trạng thái
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Chỗ
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Giá (NL / TE)
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Đơn
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {departures.map((departure) => {
                const statusLabel = DEPARTURE_STATUS_LABEL[departure.status];

                return (
                  <tr key={departure.id} className="border-b border-line align-top last:border-b-0">
                    <td className="px-4 py-3">
                      <span className="block font-medium text-ink">
                        {formatDateVN(departure.departureDate)}
                      </span>
                      {departure.returnDate ? (
                        <span className="block text-[12px] text-sage">
                          về {formatDateVN(departure.returnDate)}
                        </span>
                      ) : null}
                      {departure.isPast ? (
                        <span className="mt-1 inline-block rounded bg-surface-warm px-1.5 py-0.5 text-[11px] text-sage">
                          đã qua
                        </span>
                      ) : null}
                      {departure.note ? (
                        <span className="mt-1 block max-w-[26ch] truncate text-[12px] text-sage">
                          {departure.note}
                        </span>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium ${STATUS_BADGE[departure.status]}`}
                      >
                        {statusLabel}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="block text-ink">
                        {departure.seatsTaken} / {departure.capacityTotal}
                      </span>
                      <span className="text-[12px] text-sage">
                        còn {departure.seatsRemaining} chỗ
                      </span>
                    </td>

                    <td className="px-4 py-3 text-ink">
                      {departure.priceAdult === null ? (
                        <span className="text-sage">theo giá tour</span>
                      ) : (
                        formatVndDisplay(departure.priceAdult)
                      )}
                      <span className="block text-[12px] text-sage">
                        {departure.priceChild === null
                          ? "trẻ em: theo tour"
                          : `trẻ em: ${formatVndDisplay(departure.priceChild)}`}
                      </span>
                      {departure.holidaySurcharge > 0 ? (
                        <span className="block text-[12px] text-sage">
                          phụ thu {formatVndDisplay(departure.holidaySurcharge)}
                        </span>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 text-ink">{departure.orderCount}</td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          {departure.status !== "open" ? (
                            <form action={setDepartureStatusAction}>
                              <input type="hidden" name="tourSlug" value={tour.slug} />
                              <input type="hidden" name="departureId" value={departure.id} />
                              <input type="hidden" name="status" value="open" />
                              <button type="submit" className={secondaryButtonClass}>
                                Mở bán
                              </button>
                            </form>
                          ) : null}

                          {departure.status !== "closed" ? (
                            <form action={setDepartureStatusAction}>
                              <input type="hidden" name="tourSlug" value={tour.slug} />
                              <input type="hidden" name="departureId" value={departure.id} />
                              <input type="hidden" name="status" value="closed" />
                              <button type="submit" className={secondaryButtonClass}>
                                Đóng
                              </button>
                            </form>
                          ) : null}

                          {departure.status !== "cancelled" ? (
                            <form action={setDepartureStatusAction}>
                              <input type="hidden" name="tourSlug" value={tour.slug} />
                              <input type="hidden" name="departureId" value={departure.id} />
                              <input type="hidden" name="status" value="cancelled" />
                              <button type="submit" className={secondaryButtonClass}>
                                Huỷ chuyến
                              </button>
                            </form>
                          ) : null}

                          {departure.orderCount === 0 ? (
                            <form action={deleteDepartureAction}>
                              <input type="hidden" name="tourSlug" value={tour.slug} />
                              <input type="hidden" name="departureId" value={departure.id} />
                              <button type="submit" className={secondaryButtonClass}>
                                Xoá
                              </button>
                            </form>
                          ) : null}
                        </div>

                        <details className="rounded-[10px] border border-line bg-surface-warm/60">
                          <summary className="cursor-pointer px-3 py-2 text-[12px] font-semibold text-ink">
                            Sửa chuyến
                          </summary>

                          <form
                            action={updateDepartureAction}
                            className="grid grid-cols-2 gap-3 p-3"
                          >
                            <input type="hidden" name="tourSlug" value={tour.slug} />
                            <input type="hidden" name="departureId" value={departure.id} />

                            <div className="col-span-1 flex flex-col gap-1">
                              <label
                                htmlFor={`date-${departure.id}`}
                                className="text-[11px] font-semibold text-sage"
                              >
                                Khởi hành
                              </label>
                              <input
                                id={`date-${departure.id}`}
                                name="departureDate"
                                type="date"
                                required
                                defaultValue={departure.departureDate}
                                className={fieldClass}
                              />
                            </div>

                            <div className="col-span-1 flex flex-col gap-1">
                              <label
                                htmlFor={`return-${departure.id}`}
                                className="text-[11px] font-semibold text-sage"
                              >
                                Ngày về
                              </label>
                              <input
                                id={`return-${departure.id}`}
                                name="returnDate"
                                type="date"
                                defaultValue={departure.returnDate ?? ""}
                                className={fieldClass}
                              />
                            </div>

                            <div className="col-span-1 flex flex-col gap-1">
                              <label
                                htmlFor={`capacity-${departure.id}`}
                                className="text-[11px] font-semibold text-sage"
                              >
                                Số chỗ
                              </label>
                              <input
                                id={`capacity-${departure.id}`}
                                name="capacityTotal"
                                type="number"
                                min={Math.max(1, departure.seatsTaken)}
                                max={200}
                                required
                                defaultValue={departure.capacityTotal}
                                className={fieldClass}
                              />
                              <span className="text-[11px] text-sage">
                                tối thiểu {departure.seatsTaken} (đã bán)
                              </span>
                            </div>

                            <div className="col-span-1 flex flex-col gap-1">
                              <label
                                htmlFor={`surcharge-${departure.id}`}
                                className="text-[11px] font-semibold text-sage"
                              >
                                Phụ thu lễ
                              </label>
                              <input
                                id={`surcharge-${departure.id}`}
                                name="holidaySurcharge"
                                type="number"
                                min={0}
                                step={1000}
                                defaultValue={departure.holidaySurcharge}
                                className={fieldClass}
                              />
                            </div>

                            <div className="col-span-1 flex flex-col gap-1">
                              <label
                                htmlFor={`adult-${departure.id}`}
                                className="text-[11px] font-semibold text-sage"
                              >
                                Giá NL
                              </label>
                              <input
                                id={`adult-${departure.id}`}
                                name="priceAdult"
                                type="number"
                                min={0}
                                step={1000}
                                defaultValue={departure.priceAdult ?? ""}
                                className={fieldClass}
                              />
                            </div>

                            <div className="col-span-1 flex flex-col gap-1">
                              <label
                                htmlFor={`child-${departure.id}`}
                                className="text-[11px] font-semibold text-sage"
                              >
                                Giá TE
                              </label>
                              <input
                                id={`child-${departure.id}`}
                                name="priceChild"
                                type="number"
                                min={0}
                                step={1000}
                                defaultValue={departure.priceChild ?? ""}
                                className={fieldClass}
                              />
                            </div>

                            <div className="col-span-2 flex flex-col gap-1">
                              <label
                                htmlFor={`meeting-${departure.id}`}
                                className="text-[11px] font-semibold text-sage"
                              >
                                Điểm đón
                              </label>
                              <input
                                id={`meeting-${departure.id}`}
                                name="meetingPoint"
                                maxLength={255}
                                defaultValue={departure.meetingPoint ?? ""}
                                className={fieldClass}
                              />
                            </div>

                            <div className="col-span-2 flex flex-col gap-1">
                              <label
                                htmlFor={`note-${departure.id}`}
                                className="text-[11px] font-semibold text-sage"
                              >
                                Ghi chú nội bộ
                              </label>
                              <input
                                id={`note-${departure.id}`}
                                name="note"
                                maxLength={500}
                                defaultValue={departure.note ?? ""}
                                className={fieldClass}
                              />
                            </div>

                            <div className="col-span-2">
                              <button type="submit" className={primaryButtonClass}>
                                Lưu
                              </button>
                            </div>
                          </form>
                        </details>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[12px] text-sage">
        <Link href="/admin/tours" className="underline-offset-4 hover:underline">
          ← Về danh sách tour
        </Link>
      </p>
    </div>
  );
}
