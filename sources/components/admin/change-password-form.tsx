"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type ChangePasswordState = { error?: string };

type ChangePasswordFormProps = {
  action: (
    previous: ChangePasswordState,
    formData: FormData,
  ) => Promise<ChangePasswordState>;
};

const initialState: ChangePasswordState = {};

const fieldClass =
  "h-11 w-full rounded-[10px] border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-sage focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const labelClass = "text-[13px] font-semibold text-ink";

export function ChangePasswordForm({ action }: ChangePasswordFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const hasError = Boolean(state.error);
  const inputType = showPassword ? "text" : "password";
  const describedBy = hasError ? "change-password-error" : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {hasError ? (
        <p
          id="change-password-error"
          role="alert"
          className="rounded-[8px] border border-danger/20 bg-danger/10 px-3 py-2.5 text-[13px] font-medium text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="current-password" className={labelClass}>
          Mật khẩu hiện tại
        </label>
        <input
          id="current-password"
          type={inputType}
          name="currentPassword"
          autoComplete="current-password"
          required
          maxLength={200}
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password" className={labelClass}>
          Mật khẩu mới
        </label>
        <input
          id="new-password"
          type={inputType}
          name="newPassword"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={200}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={fieldClass}
        />
        <p className="text-[12px] text-sage">Từ 8 đến 200 ký tự, khác mật khẩu hiện tại.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className={labelClass}>
          Xác nhận mật khẩu mới
        </label>
        <input
          id="confirm-password"
          type={inputType}
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={200}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-pressed={showPassword}
          className="inline-flex min-h-9 items-center gap-1.5 text-[12px] font-semibold text-sage transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
        >
          {showPassword ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
          {showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        </button>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-[10px] bg-clay px-5 text-[14px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Đổi mật khẩu"}
        </button>
      </div>
    </form>
  );
}
