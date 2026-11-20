"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MAX_UPLOAD_LABEL } from "@/lib/media/limits";
import {
  ImageUploadError,
  prepareImageForUpload,
} from "@/lib/media/resize-for-upload";

const fieldClass =
  "h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const labelClass = "text-[12px] font-semibold text-sage";

type Stage = "idle" | "compressing" | "uploading";

export function MediaUploadForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const pending = stage !== "idle";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setStage("compressing");
    setError(null);
    setOk(false);

    try {
      const data = new FormData(form);
      const picker = form.elements.namedItem("file");
      const file = picker instanceof HTMLInputElement ? picker.files?.[0] : undefined;

      if (file) {
        const prepared = await prepareImageForUpload(file);
        if (prepared !== file) data.set("file", prepared);
      }

      setStage("uploading");

      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: data,
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: { message?: string } }
        | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error?.message ?? "Tải ảnh thất bại, vui lòng thử lại");
        return;
      }

      form.reset();
      setOk(true);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof ImageUploadError
          ? submitError.message
          : "Không kết nối được máy chủ, vui lòng thử lại",
      );
    } finally {
      setStage("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
      {error ? (
        <p
          role="alert"
          className="rounded-[8px] border border-danger/20 bg-danger/10 px-3 py-2.5 text-[13px] font-medium text-danger"
        >
          {error}
        </p>
      ) : null}

      {ok ? (
        <p
          role="status"
          className="rounded-[8px] border border-success/30 bg-success/10 px-3 py-2.5 text-[13px] font-medium text-success"
        >
          Đã tải ảnh lên và thêm vào thư viện.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="upload-file" className={labelClass}>
            Tệp ảnh *
          </label>
          <input
            id="upload-file"
            name="file"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="block w-full cursor-pointer rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] text-ink file:mr-3 file:rounded-[8px] file:border-0 file:bg-surface-warm file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
          />
          <p className="text-[12px] text-sage">
            JPEG, PNG, WebP hoặc AVIF · tối đa {MAX_UPLOAD_LABEL} · ảnh lớn được tự nén
            trước khi gửi, sau đó resize cạnh dài ≤ 1920px và chuyển WebP.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="upload-title" className={labelClass}>
            Tiêu đề
          </label>
          <input
            id="upload-title"
            name="title"
            maxLength={255}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="upload-alt" className={labelClass}>
            Alt text
          </label>
          <input id="upload-alt" name="alt" maxLength={255} className={fieldClass} />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="upload-tags" className={labelClass}>
            Tags (cách nhau dấu phẩy)
          </label>
          <input
            id="upload-tags"
            name="tags"
            maxLength={500}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-clay px-4 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none disabled:opacity-60"
        >
          {stage === "compressing"
            ? "Đang nén ảnh…"
            : stage === "uploading"
              ? "Đang tải ảnh…"
              : "Tải ảnh lên"}
        </button>
      </div>
    </form>
  );
}
