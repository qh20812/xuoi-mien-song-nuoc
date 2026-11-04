"use client";

import { useState, type FormEvent } from "react";
import {
  ChevronDown,
  CircleCheck,
  LoaderCircle,
  Mail,
  MessageSquareText,
  Phone,
  Send,
  User,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { submitContactMessage } from "@/lib/contact/client";
import { CONTACT_TOPICS } from "@/lib/contact/topics";
import {
  toContactRequest,
  validateContact,
  type ContactErrors,
} from "@/lib/contact/validation";
import type {
  ContactFormValues,
  ContactTopic,
} from "@/lib/contracts/contact";
import { cn } from "@/lib/utils";

const INITIAL_VALUES: ContactFormValues = {
  name: "",
  phone: "",
  email: "",
  topic: "",
  message: "",
};

const inputClass =
  "h-12 w-full rounded-[10px] border border-line bg-surface px-4 text-base text-ink outline-none transition-colors placeholder:text-sage/60 focus:border-clay focus:ring-2 focus:ring-clay/20";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-danger">
      {message}
    </p>
  );
}

export function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function updateField<K extends keyof ContactFormValues>(
    field: K,
    value: ContactFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setServerError(null);
    setSubmitted(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validateContact(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      document
        .querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      await submitContactMessage(toContactRequest(values));
      setValues(INITIAL_VALUES);
      setSubmitted(true);
    } catch {
      setServerError(
        "Không thể gửi lời nhắn lúc này. Vui lòng thử lại hoặc gọi hotline.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[20px] border border-line bg-surface p-5 md:p-8">
      <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-sage uppercase">
        Mẫu liên hệ
      </span>
      <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
        Gửi lời nhắn cho đội ngũ
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-sage">
        Điền thông tin cần hỗ trợ. Nhân viên sẽ liên hệ lại qua điện thoại hoặc
        Zalo.
      </p>

      {submitted ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 flex items-start gap-3 rounded-[12px] border border-success/30 bg-success/5 p-4"
        >
          <CircleCheck
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-success"
          />
          <div>
            <span className="block text-sm font-semibold text-ink">
              Đã gửi lời nhắn
            </span>
            <p className="mt-1 text-sm leading-6 text-sage">
              Nhân viên sẽ liên hệ lại qua điện thoại hoặc Zalo để trao đổi chi
              tiết.
            </p>
          </div>
        </div>
      ) : null}

      <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="contact-name"
              className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink"
            >
              <User aria-hidden="true" className="size-4 text-sage" />
              Họ và tên <span className="text-danger">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              autoComplete="name"
              maxLength={120}
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "contact-name-error" : undefined}
              className={cn(inputClass, errors.name && "border-danger")}
              placeholder="Họ tên người liên hệ"
            />
            <FieldError id="contact-name-error" message={errors.name} />
          </div>

          <div>
            <label
              htmlFor="contact-phone"
              className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink"
            >
              <Phone aria-hidden="true" className="size-4 text-sage" />
              Số điện thoại / Zalo <span className="text-danger">*</span>
            </label>
            <input
              id="contact-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
              value={values.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "contact-phone-error" : undefined}
              className={cn(inputClass, "font-mono", errors.phone && "border-danger")}
              placeholder="0901 234 567"
            />
            <FieldError id="contact-phone-error" message={errors.phone} />
          </div>
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink"
          >
            <Mail aria-hidden="true" className="size-4 text-sage" />
            Email{" "}
            <span className="text-xs font-normal text-sage">(tùy chọn)</span>
          </label>
          <input
            id="contact-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={160}
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={cn(inputClass, errors.email && "border-danger")}
            placeholder="ban@example.com"
          />
          <FieldError id="contact-email-error" message={errors.email} />
        </div>

        <div>
          <label
            htmlFor="contact-topic"
            className="mb-2 block text-sm font-semibold text-ink"
          >
            Chủ đề cần hỗ trợ <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <select
              id="contact-topic"
              value={values.topic}
              onChange={(event) =>
                updateField("topic", event.target.value as ContactTopic | "")
              }
              aria-invalid={Boolean(errors.topic)}
              aria-describedby={errors.topic ? "contact-topic-error" : undefined}
              className={cn(
                inputClass,
                "appearance-none pr-10",
                errors.topic && "border-danger",
              )}
            >
              <option value="">Chọn chủ đề</option>
              {CONTACT_TOPICS.map((topic) => (
                <option key={topic.value} value={topic.value}>
                  {topic.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-sage"
            />
          </div>
          <FieldError id="contact-topic-error" message={errors.topic} />
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink"
          >
            <MessageSquareText aria-hidden="true" className="size-4 text-sage" />
            Nội dung lời nhắn <span className="text-danger">*</span>
          </label>
          <textarea
            id="contact-message"
            rows={5}
            maxLength={2000}
            value={values.message}
            onChange={(event) => updateField("message", event.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
            className={cn(
              "min-h-32 w-full resize-y rounded-[10px] border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-sage/60 focus:border-clay focus:ring-2 focus:ring-clay/20",
              errors.message && "border-danger",
            )}
            placeholder="Số người dự kiến, ngày đi hoặc nội dung cần tư vấn…"
          />
          <div className="mt-1.5 flex items-start justify-between gap-4">
            <FieldError id="contact-message-error" message={errors.message} />
            <span className="ml-auto text-xs text-sage">
              {values.message.length}/2000
            </span>
          </div>
        </div>

        <p className="rounded-[10px] bg-canvas p-3 text-xs leading-5 text-sage">
          Thông tin bạn gửi chỉ được dùng để phản hồi yêu cầu tư vấn. Không nhập
          dữ liệu nhạy cảm như mật khẩu hoặc thông tin thẻ.
        </p>

        {serverError ? (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-[8px] bg-danger/5 p-3 text-sm text-danger"
          >
            {serverError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className={cn(
            buttonVariants({ variant: "site", size: "site" }),
            "w-full sm:w-auto",
          )}
        >
          {submitting ? (
            <>
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Đang gửi lời nhắn
            </>
          ) : (
            <>
              Gửi lời nhắn
              <Send aria-hidden="true" className="size-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
