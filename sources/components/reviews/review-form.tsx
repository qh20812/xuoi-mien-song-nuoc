"use client";

import { useState } from "react";
import { CircleCheck, Star } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { submitReview } from "@/lib/reviews/client";

type ReviewFormProps = {
  orderCode: string;
  phone: string;
  defaultName?: string;
};

const RATINGS = [1, 2, 3, 4, 5] as const;

export function ReviewForm({ orderCode, phone, defaultName }: ReviewFormProps) {
  const [name, setName] = useState(defaultName ?? "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (name.trim().length < 2) {
      setError("Vui lòng nhập tên hiển thị (ít nhất 2 ký tự).");
      return;
    }
    if (comment.trim().length < 10) {
      setError("Vui lòng chia sẻ ít nhất 10 ký tự.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitReview({
        authorName: name,
        rating,
        comment,
        orderCode,
        phone,
        website,
      });
      setDone(true);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Không gửi được đánh giá lúc này. Vui lòng thử lại sau.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section
        role="status"
        className="flex items-start gap-3 rounded-[16px] border border-success/30 bg-success/5 p-5"
      >
        <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
        <div>
          <h2 className="text-sm font-semibold text-ink">Cảm ơn bạn đã đánh giá</h2>
          <p className="mt-1 text-sm leading-6 text-sage">
            Đánh giá đang chờ duyệt. Sau khi được duyệt, chia sẻ của bạn sẽ hiển thị
            công khai trên website.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="review-heading"
      className="rounded-[16px] border border-line bg-surface p-5 md:p-6"
    >
      <h2
        id="review-heading"
        className="font-display text-xl font-semibold tracking-[-0.01em] text-ink"
      >
        Đánh giá chuyến đi
      </h2>
      <p className="mt-1 text-sm leading-6 text-sage">
        Bạn đã hoàn thành chuyến đi này. Chia sẻ cảm nhận để giúp khách sau chọn
        đúng chuyến — đánh giá sẽ được duyệt trước khi hiển thị.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4" noValidate>
        <fieldset>
          <legend className="text-[12px] font-semibold text-sage">Chấm điểm</legend>
          <div className="mt-1 flex items-center gap-1">
            {RATINGS.map((value) => (
              <label
                key={value}
                className="cursor-pointer rounded p-1 focus-within:ring-2 focus-within:ring-clay/40"
              >
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  className="sr-only"
                />
                <Star
                  aria-hidden="true"
                  className={
                    value <= rating
                      ? "size-7 fill-clay text-clay"
                      : "size-7 text-line"
                  }
                />
                <span className="sr-only">{value} sao</span>
              </label>
            ))}
            <span className="ml-2 text-sm text-sage">{rating}/5</span>
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="review-name" className="text-[12px] font-semibold text-sage">
            Tên hiển thị
          </label>
          <input
            id="review-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            required
            className="h-11 rounded-[10px] border border-line bg-surface px-3 text-sm text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="review-comment" className="text-[12px] font-semibold text-sage">
            Cảm nhận của bạn
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            maxLength={1000}
            required
            placeholder="Hướng dẫn viên, món ăn, điểm dừng bạn thích nhất…"
            className="w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-sm leading-6 text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
          />
          <span className="text-[11px] text-sage">{comment.length}/1000</span>
        </div>

        {/* Honeypot: ẩn với người dùng, chỉ bot điền. */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor="review-website">Website</label>
          <input
            id="review-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm leading-6 text-danger">
            {error}
          </p>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-11 items-center rounded-[10px] bg-clay px-5 text-sm font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
          >
            {submitting ? "Đang gửi…" : "Gửi đánh giá"}
          </button>
        </div>
      </form>
    </section>
  );
}
