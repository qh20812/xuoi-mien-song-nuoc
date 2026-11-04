import {
  ChevronDown,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  User,
  Users,
} from "lucide-react";
import type {
  BookingContactValues,
  BookingGuestCounts,
  PassengerDraft,
} from "@/lib/contracts/booking";
import { passengerTypeAt } from "@/lib/booking/validation";
import { cn } from "@/lib/utils";

type StepContactProps = {
  values: BookingContactValues;
  errors: Record<string, string>;
  totalGuests: number;
  guests: BookingGuestCounts;
  passengers: PassengerDraft[];
  onChange: (field: keyof BookingContactValues, value: string) => void;
  onChangePassenger: (
    index: number,
    field: keyof PassengerDraft,
    value: string,
  ) => void;
};

const PASSENGER_LABELS = {
  adult: "Người lớn",
  child: "Trẻ em",
  infant: "Em bé",
} as const;

const inputClass =
  "h-12 w-full rounded-[10px] border border-line bg-surface px-4 text-base text-ink outline-none transition-colors placeholder:text-sage/60 focus:border-clay focus:ring-2 focus:ring-clay/20";

function fieldErrorId(field: string) {
  return `${field}-error`;
}

export function StepContact({
  values,
  errors,
  totalGuests,
  guests,
  passengers,
  onChange,
  onChangePassenger,
}: StepContactProps) {
  const hasPassengerErrors = Object.keys(errors).some((key) =>
    key.startsWith("passenger-"),
  );

  return (
    <div className="flex flex-col gap-7">
      <section>
        <h2 className="text-sm font-semibold tracking-[0.08em] text-ink uppercase">
          Thông tin người đại diện
        </h2>
        <div className="mt-4 rounded-[16px] border border-line bg-surface p-4 md:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="contactName"
                className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink"
              >
                <User aria-hidden="true" className="size-4 text-sage" />
                Họ và tên <span className="text-danger">*</span>
              </label>
              <input
                id="contactName"
                name="contactName"
                type="text"
                autoComplete="name"
                maxLength={120}
                value={values.contactName}
                onChange={(event) => onChange("contactName", event.target.value)}
                aria-invalid={Boolean(errors.contactName)}
                aria-describedby={
                  errors.contactName ? fieldErrorId("contactName") : undefined
                }
                className={cn(inputClass, errors.contactName && "border-danger")}
                placeholder="Họ tên người đại diện"
              />
              {errors.contactName ? (
                <p id={fieldErrorId("contactName")} className="mt-1.5 text-xs text-danger">
                  {errors.contactName}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink"
              >
                <Phone aria-hidden="true" className="size-4 text-sage" />
                Số điện thoại <span className="text-danger">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={20}
                value={values.phone}
                onChange={(event) => onChange("phone", event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? fieldErrorId("phone") : undefined}
                className={cn(
                  inputClass,
                  "font-mono",
                  errors.phone && "border-danger",
                )}
                placeholder="0901 234 567"
              />
              {errors.phone ? (
                <p id={fieldErrorId("phone")} className="mt-1.5 text-xs text-danger">
                  {errors.phone}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-sage">
                  Dùng để nhân viên gọi hoặc nhắn Zalo xác nhận.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink"
              >
                <Mail aria-hidden="true" className="size-4 text-sage" />
                Email{" "}
                <span className="text-xs font-normal text-sage">(tùy chọn)</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={160}
                value={values.email}
                onChange={(event) => onChange("email", event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? fieldErrorId("email") : undefined}
                className={cn(inputClass, errors.email && "border-danger")}
                placeholder="ban@example.com"
              />
              {errors.email ? (
                <p id={fieldErrorId("email")} className="mt-1.5 text-xs text-danger">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="pickupPoint"
                className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink"
              >
                <MapPin aria-hidden="true" className="size-4 text-sage" />
                Điểm đón <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <select
                  id="pickupPoint"
                  name="pickupPoint"
                  value={values.pickupPoint}
                  onChange={(event) => onChange("pickupPoint", event.target.value)}
                  aria-invalid={Boolean(errors.pickupPoint)}
                  aria-describedby={
                    errors.pickupPoint ? fieldErrorId("pickupPoint") : undefined
                  }
                  className={cn(
                    inputClass,
                    "appearance-none pr-10",
                    errors.pickupPoint && "border-danger",
                  )}
                >
                  <option value="">Chọn điểm đón</option>
                  <option value="Trung tâm Quận 1">Trung tâm Quận 1</option>
                  <option value="Bến xe Miền Tây">Bến xe Miền Tây</option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-sage"
                />
              </div>
              {errors.pickupPoint ? (
                <p
                  id={fieldErrorId("pickupPoint")}
                  className="mt-1.5 text-xs text-danger"
                >
                  {errors.pickupPoint}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="customerNote"
              className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink"
            >
              <MessageSquareText aria-hidden="true" className="size-4 text-sage" />
              Ghi chú ăn uống hoặc sức khỏe{" "}
              <span className="text-xs font-normal text-sage">(tùy chọn)</span>
            </label>
            <textarea
              id="customerNote"
              name="customerNote"
              rows={3}
              maxLength={2000}
              value={values.customerNote}
              onChange={(event) => onChange("customerNote", event.target.value)}
              aria-invalid={Boolean(errors.customerNote)}
              aria-describedby={
                errors.customerNote ? fieldErrorId("customerNote") : undefined
              }
              className={cn(
                "min-h-24 w-full resize-y rounded-[10px] border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-sage/60 focus:border-clay focus:ring-2 focus:ring-clay/20",
                errors.customerNote && "border-danger",
              )}
              placeholder="Ví dụ: một thành viên ăn chay, trẻ nhỏ cần ghế gần cửa sổ…"
            />
            {errors.customerNote ? (
              <p
                id={fieldErrorId("customerNote")}
                className="mt-1.5 text-xs text-danger"
              >
                {errors.customerNote}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <details
        open={hasPassengerErrors || undefined}
        className="group rounded-[16px] border border-line bg-surface"
      >
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 md:px-6">
          <span className="flex items-center gap-2.5">
            <Users aria-hidden="true" className="size-4 text-sage" />
            <span>
              <span className="block text-sm font-semibold text-ink">
                Thông tin hành khách
              </span>
              <span className="block text-xs text-sage">
                Tùy chọn · {totalGuests} khách
              </span>
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 text-sage transition-transform group-open:rotate-180"
          />
        </summary>

        <div className="border-t border-line p-4 md:p-6">
          <p className="mb-4 text-xs leading-5 text-sage">
            Bạn có thể bổ sung tên và năm sinh để nhân viên chuẩn bị danh sách
            đoàn. Bỏ trống nếu muốn cung cấp sau.
          </p>
          <div className="flex flex-col gap-4">
            {Array.from({ length: totalGuests }).map((_, index) => {
              const draft = passengers[index] ?? { fullName: "", birthYear: "" };
              const type = passengerTypeAt(index, guests);
              const nameError = errors[`passenger-${index}-fullName`];
              const yearError = errors[`passenger-${index}-birthYear`];

              return (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0 sm:grid-cols-[8rem_1fr_7rem]"
                >
                  <span className="self-center text-xs font-semibold text-ink">
                    Khách {index + 1}
                    <span className="mt-0.5 block font-normal text-sage">
                      {PASSENGER_LABELS[type]}
                    </span>
                  </span>
                  <div>
                    <label htmlFor={`passenger-${index}-name`} className="sr-only">
                      Họ tên hành khách {index + 1}
                    </label>
                    <input
                      id={`passenger-${index}-name`}
                      type="text"
                      maxLength={120}
                      value={draft.fullName}
                      onChange={(event) =>
                        onChangePassenger(index, "fullName", event.target.value)
                      }
                      aria-invalid={Boolean(nameError)}
                      className={cn(inputClass, "h-11", nameError && "border-danger")}
                      placeholder="Họ và tên"
                    />
                    {nameError ? (
                      <p className="mt-1 text-xs text-danger">{nameError}</p>
                    ) : null}
                  </div>
                  <div>
                    <label
                      htmlFor={`passenger-${index}-birthYear`}
                      className="sr-only"
                    >
                      Năm sinh hành khách {index + 1}
                    </label>
                    <input
                      id={`passenger-${index}-birthYear`}
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={draft.birthYear}
                      onChange={(event) =>
                        onChangePassenger(index, "birthYear", event.target.value)
                      }
                      aria-invalid={Boolean(yearError)}
                      className={cn(inputClass, "h-11", yearError && "border-danger")}
                      placeholder="Năm sinh"
                    />
                    {yearError ? (
                      <p className="mt-1 text-xs text-danger">{yearError}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </details>
    </div>
  );
}
