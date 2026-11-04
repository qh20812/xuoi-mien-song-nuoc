"use client";

import { useState } from "react";
import { Backpack, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type PackingChecklistProps = {
  items: string[];
};

export function PackingChecklist({ items }: PackingChecklistProps) {
  const [checked, setChecked] = useState<boolean[]>(() =>
    items.map(() => false),
  );
  const checkedCount = checked.filter(Boolean).length;

  return (
    <div className="rounded-[16px] border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-ink uppercase">
          <Backpack aria-hidden="true" className="size-4 text-clay" />
          Checklist hành lý
        </h2>
        <span
          aria-live="polite"
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-[0.65rem]",
            checkedCount === items.length
              ? "bg-success text-white"
              : "bg-surface-warm text-sage",
          )}
        >
          {checkedCount}/{items.length}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-sage">
        Danh sách tham khảo từ bài viết. Đánh dấu những món bạn đã chuẩn bị.
      </p>

      <fieldset className="mt-3 border-t border-line pt-2">
        <legend className="sr-only">Danh sách hành lý cần chuẩn bị</legend>
        <div className="flex flex-col">
          {items.map((item, index) => (
            <label
              key={item}
              className="flex cursor-pointer items-start gap-3 rounded-[6px] px-2 py-2 text-xs leading-5 text-ink transition-colors hover:bg-surface-warm/60"
            >
              <input
                type="checkbox"
                checked={checked[index] ?? false}
                onChange={(event) =>
                  setChecked((current) => {
                    const next = [...current];
                    next[index] = event.target.checked;
                    return next;
                  })
                }
                className="mt-0.5 size-4 shrink-0 accent-[var(--site-clay)]"
              />
              <span className={checked[index] ? "text-sage line-through" : ""}>
                {item}
              </span>
              {checked[index] ? (
                <Check
                  aria-hidden="true"
                  className="ml-auto mt-0.5 size-3.5 shrink-0 text-success"
                />
              ) : null}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
