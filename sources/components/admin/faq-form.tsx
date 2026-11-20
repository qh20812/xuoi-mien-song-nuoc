import {
  FAQ_CATEGORIES,
  FAQ_CATEGORY_LABELS,
  FAQ_PLACEMENT_LABELS,
} from "@/lib/content/faq-options";
import type { AdminFaqRow } from "@/server/content/admin-faqs";

type FaqFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  faq?: AdminFaqRow;
  submitLabel: string;
};

const fieldClass =
  "h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const textareaClass =
  "w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] leading-6 text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const labelClass = "text-[12px] font-semibold text-sage";
const primaryButtonClass =
  "h-10 rounded-[10px] bg-clay px-4 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none";

export function FaqForm({ action, faq, submitLabel }: FaqFormProps) {
  return (
    <form action={action} className="flex flex-col gap-5">
      {faq ? <input type="hidden" name="id" value={faq.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="faq-question" className={labelClass}>
          Câu hỏi
        </label>
        <input
          id="faq-question"
          name="question"
          required
          maxLength={500}
          defaultValue={faq?.question ?? ""}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="faq-answer" className={labelClass}>
          Câu trả lời
        </label>
        <textarea
          id="faq-answer"
          name="answer"
          required
          rows={5}
          maxLength={60_000}
          defaultValue={faq?.answer ?? ""}
          className={textareaClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="faq-category" className={labelClass}>
            Chủ đề
          </label>
          <select
            id="faq-category"
            name="category"
            defaultValue={faq?.category ?? "general"}
            className={fieldClass}
          >
            {FAQ_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {FAQ_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="faq-placement" className={labelClass}>
            Hiển thị tại
          </label>
          <select
            id="faq-placement"
            name="placement"
            defaultValue={faq?.placement ?? ""}
            className={fieldClass}
          >
            <option value="">Không đặt</option>
            {(Object.keys(FAQ_PLACEMENT_LABELS) as Array<
              keyof typeof FAQ_PLACEMENT_LABELS
            >).map((value) => (
              <option key={value} value={value}>
                {FAQ_PLACEMENT_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="faq-sort" className={labelClass}>
            Thứ tự
          </label>
          <input
            id="faq-sort"
            name="sortOrder"
            type="number"
            min={0}
            max={999}
            defaultValue={faq?.sortOrder ?? 0}
            className={fieldClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px] text-ink">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={faq?.isActive ?? true}
          className="size-4 rounded border-line text-clay focus-visible:ring-2 focus-visible:ring-clay/40"
        />
        Hiển thị công khai
      </label>

      <div>
        <button type="submit" className={primaryButtonClass}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
