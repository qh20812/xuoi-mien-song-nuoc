"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

type ShareButtonProps = {
  title: string;
};

export function ShareButton({ title }: ShareButtonProps) {
  const [message, setMessage] = useState("");

  async function share() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setMessage("Đã mở hộp thoại chia sẻ.");
        return;
      }

      await navigator.clipboard.writeText(url);
      setMessage("Đã sao chép liên kết.");
      window.setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage("Không thể chia sẻ lúc này.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={share}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-[8px] border border-line bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-warm focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
      >
        <Share2 aria-hidden="true" className="size-3.5" />
        Chia sẻ bài viết
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {message}
      </span>
      {message.startsWith("Đã") ? (
        <Check aria-hidden="true" className="size-4 text-success" />
      ) : null}
    </div>
  );
}
