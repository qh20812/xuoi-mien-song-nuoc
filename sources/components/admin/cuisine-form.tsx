import type {
  AdminCuisineRow,
  CuisineTourOption,
} from "@/server/content/admin-cuisines";

type CuisineFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cuisine?: AdminCuisineRow;
  tourOptions: CuisineTourOption[];
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

export function CuisineForm({
  action,
  cuisine,
  tourOptions,
  mediaUrls,
  submitLabel,
}: CuisineFormProps) {
  const isEdit = Boolean(cuisine);

  return (
    <form action={action} className="flex flex-col gap-5">
      {cuisine ? <input type="hidden" name="id" value={cuisine.id} /> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cuisine-name" className={labelClass}>
            Tên món ăn
          </label>
          <input
            id="cuisine-name"
            name="name"
            required
            maxLength={200}
            defaultValue={cuisine?.name ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cuisine-slug" className={labelClass}>
            Slug {isEdit ? "(không đổi)" : ""}
          </label>
          <input
            id="cuisine-slug"
            name="slug"
            required
            maxLength={160}
            readOnly={isEdit}
            aria-readonly={isEdit}
            defaultValue={cuisine?.slug ?? ""}
            className={
              isEdit
                ? `${fieldClass} cursor-not-allowed bg-surface-warm text-sage`
                : fieldClass
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cuisine-province" className={labelClass}>
            Vùng
          </label>
          <input
            id="cuisine-province"
            name="province"
            maxLength={120}
            defaultValue={cuisine?.province ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cuisine-sort" className={labelClass}>
            Thứ tự
          </label>
          <input
            id="cuisine-sort"
            name="sortOrder"
            type="number"
            min={0}
            max={999}
            defaultValue={cuisine?.sortOrder ?? 0}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cuisine-description" className={labelClass}>
          Mô tả
        </label>
        <textarea
          id="cuisine-description"
          name="description"
          rows={6}
          maxLength={60_000}
          defaultValue={cuisine?.description ?? ""}
          className={textareaClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="cuisine-where" className={labelClass}>
            Nơi thưởng thức
          </label>
          <input
            id="cuisine-where"
            name="whereToEat"
            maxLength={500}
            defaultValue={cuisine?.whereToEat ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="cuisine-image" className={labelClass}>
            Ảnh món (/images/…)
          </label>
          <input
            id="cuisine-image"
            name="imageUrl"
            list="cuisine-media-images"
            maxLength={500}
            defaultValue={cuisine?.imageUrl ?? ""}
            className={fieldClass}
          />
          <datalist id="cuisine-media-images">
            {mediaUrls.map((url) => (
              <option key={url} value={url} />
            ))}
          </datalist>
        </div>
      </div>

      <fieldset className="rounded-xl border border-line bg-surface-warm/40 p-4">
        <legend className="px-1 text-[12px] font-semibold text-sage">
          Tour có món này
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
                  defaultChecked={cuisine?.tourIds.includes(tour.id)}
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
