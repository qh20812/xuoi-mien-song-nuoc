import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Chọn chuyến đi" },
  { number: 2, label: "Thông tin liên hệ" },
  { number: 3, label: "Xem lại & xác nhận" },
] as const;

type BookingStepperProps = {
  currentStep: 1 | 2 | 3;
};

export function BookingStepper({ currentStep }: BookingStepperProps) {
  return (
    <nav aria-label="Tiến trình đặt giữ chỗ" className="w-full">
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((step, index) => {
          const completed = currentStep > step.number;
          const active = currentStep === step.number;

          return (
            <li
              key={step.number}
              className={cn("flex min-w-0 items-center gap-2", index > 0 && "flex-1")}
              aria-current={active ? "step" : undefined}
            >
              {index > 0 ? (
                <span aria-hidden="true" className="h-px min-w-3 flex-1 bg-line" />
              ) : null}
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  completed && "border-success bg-success text-white",
                  active && "border-clay bg-clay text-contrast-on-accent",
                  !active && !completed && "border-line bg-surface text-sage",
                )}
              >
                {completed ? <Check aria-hidden="true" className="size-3.5" /> : step.number}
              </span>
              <span
                className={cn(
                  "truncate text-xs font-medium sm:text-sm",
                  active ? "block text-ink" : "hidden text-sage min-[420px]:block",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
