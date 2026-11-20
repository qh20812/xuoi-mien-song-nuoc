import type {
  AdminDestinationRow,
  TourOption,
} from "@/server/content/admin-destinations";
import { CATEGORY_LABELS } from "@/lib/destinations/categories";
import type { DestinationCategory } from "@/lib/contracts/destination";

type DestinationFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  destination?: AdminDestinationRow;
  tourOptions: TourOption[];
  mediaUrls: string[];
  submitLabel: string;
};

const fieldClass =
  "h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const textareaClass =
  "w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] leading-6 text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const labelClass = "text-[12px] font-semibold text-sage";
const primaryButtonClass =
  "h-10 rounded-[10px] bg-clay px-4 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none";

const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as DestinationCategory[];

export function DestinationForm({
  action,
  destination,
  tourOptions,
  mediaUrls,
  submitLabel,
}: DestinationFormProps) {
  const isEdit = Boolean(destination);

  return (
    <form action={action} className="flex flex-col gap-5">
      {destination ? <input type="hidden" name="id" value={destination.id} /> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-name" className={labelClass}>
            Tên điểm đến
          </label>
          <input
            id="destination-name"
            name="name"
            required
            maxLength={200}
            defaultValue={destination?.name ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-slug" className={labelClass}>
            Slug {isEdit ? "(không đổi)" : ""}
          </label>
          <input
            id="destination-slug"
            name="slug"
            required
            maxLength={160}
            readOnly={isEdit}
            aria-readonly={isEdit}
            defaultValue={destination?.slug ?? ""}
            className={
              isEdit
                ? `${fieldClass} cursor-not-allowed bg-surface-warm text-sage`
                : fieldClass
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-province" className={labelClass}>
            Tỉnh/thành
          </label>
          <input
            id="destination-province"
            name="province"
            required
            maxLength={120}
            defaultValue={destination?.province ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-category" className={labelClass}>
            Nhóm
          </label>
          <select
            id="destination-category"
            name="category"
            defaultValue={destination?.category ?? "song-nuoc"}
            className={fieldClass}
          >
            {CATEGORY_VALUES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="destination-short" className={labelClass}>
            Mô tả ngắn
          </label>
          <textarea
            id="destination-short"
            name="shortDesc"
            rows={2}
            maxLength={500}
            defaultValue={destination?.shortDesc ?? ""}
            className={textareaClass}
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="destination-description" className={labelClass}>
            Mô tả chi tiết
          </label>
          <textarea
            id="destination-description"
            name="description"
            rows={6}
            maxLength={60_000}
            defaultValue={destination?.description ?? ""}
            className={textareaClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-season" className={labelClass}>
            Mùa đẹp
          </label>
          <input
            id="destination-season"
            name="bestSeason"
            maxLength={200}
            defaultValue={destination?.bestSeason ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-note" className={labelClass}>
            Ghi chú di chuyển
          </label>
          <input
            id="destination-note"
            name="travelNote"
            maxLength={500}
            defaultValue={destination?.travelNote ?? ""}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="destination-image" className={labelClass}>
            Ảnh bìa (/images/…)
          </label>
          <input
            id="destination-image"
            name="coverImageUrl"
            list="destination-media-images"
            maxLength={500}
            defaultValue={destination?.coverImageUrl ?? ""}
            className={fieldClass}
          />
          <datalist id="destination-media-images">
            {mediaUrls.map((url) => (
              <option key={url} value={url} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-lat" className={labelClass}>
            Vĩ độ
          </label>
          <input
            id="destination-lat"
            name="lat"
            type="number"
            step="any"
            defaultValue={destination?.lat ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-lng" className={labelClass}>
            Kinh độ
          </label>
          <input
            id="destination-lng"
            name="lng"
            type="number"
            step="any"
            defaultValue={destination?.lng ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-sort" className={labelClass}>
            Thứ tự
          </label>
          <input
            id="destination-sort"
            name="sortOrder"
            type="number"
            min={0}
            max={999}
            defaultValue={destination?.sortOrder ?? 0}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-status" className={labelClass}>
            Trạng thái
          </label>
          <select
            id="destination-status"
            name="status"
            defaultValue={destination?.status ?? "published"}
            className={fieldClass}
          >
            <option value="published">Đang hiển thị</option>
            <option value="draft">Nháp</option>
          </select>
        </div>
      </div>

      <fieldset className="rounded-xl border border-line bg-surface-warm/40 p-4">
        <legend className="px-1 text-[12px] font-semibold text-sage">
          Tour liên kết
        </legend>
        {tourOptions.length === 0 ? (
          <p className="text-[13px] text-sage">Chưa có tour đang bán.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {tourOptions.map((tour) => (
              <label
                key={tour.id}
                className="flex items-start gap-2 text-[13px] leading-5 text-ink"
              >
                <input
                  type="checkbox"
                  name="tourIds"
                  value={tour.id}
                  defaultChecked={destination?.tourIds.includes(tour.id)}
                  className="mt-0.5 size-4 rounded border-line text-clay focus-visible:ring-2 focus-visible:ring-clay/40"
                />
                <span>
                  <span className="font-mono text-[12px] text-clay">{tour.code}</span>{" "}
                  {tour.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div>
        <button type="submit" className={primaryButtonClass}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
