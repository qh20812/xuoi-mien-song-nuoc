"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { BookingSuccess } from "@/components/booking/booking-success";
import { BookingSummary } from "@/components/booking/booking-summary";
import { StepContact } from "@/components/booking/step-contact";
import { StepReview } from "@/components/booking/step-review";
import { StepTourSelection } from "@/components/booking/step-tour-selection";
import { buttonVariants } from "@/components/ui/button";
import { calculateBookingPreview, totalSeats } from "@/lib/booking/preview";
import { submitBookingRequest } from "@/lib/booking/submit";
import {
  normalizePhone,
  passengerTypeAt,
  validateContact,
  validatePassengerDrafts,
} from "@/lib/booking/validation";
import type {
  BookingContactValues,
  BookingGuestCounts,
  BookingInitialSelection,
  BookingRequestInput,
  BookingSuccessData,
  BookingTourOption,
  PassengerDraft,
} from "@/lib/contracts/booking";
import type { SiteSettings } from "@/lib/contracts/site";
import type { TourDepartureOption } from "@/lib/contracts/tour";
import {
  formatLongDateVN,
  formatVndDisplay,
  maskPhone,
} from "@/lib/format";
import {
  cancelDeadline,
  isAtLeastDaysAhead,
  parseDateOnly,
} from "@/lib/time";
import { cn } from "@/lib/utils";

type BookingWizardProps = {
  tours: BookingTourOption[];
  settings: SiteSettings;
  initial: BookingInitialSelection;
};

type Step = 1 | 2 | 3;

function departureLabel(date: string | null) {
  return date ? formatLongDateVN(date) : "Chưa chọn ngày";
}

function clampGuests(
  guests: BookingGuestCounts,
  seatsAvailable: number,
): BookingGuestCounts {
  const adults = Math.max(1, Math.min(guests.adults, seatsAvailable));
  const children = Math.min(
    guests.children,
    Math.max(0, seatsAvailable - adults),
  );
  const infants = Math.min(
    guests.infants,
    Math.max(0, seatsAvailable - adults - children),
  );
  return { adults, children, infants };
}

export function BookingWizard({ tours, settings, initial }: BookingWizardProps) {
  const initialTour = tours[0]!;
  const initialSelectedTour =
    tours.find((tour) => tour.slug === initial.tourSlug) ?? initialTour;
  const initialDeparture =
    initialSelectedTour.departures.find(
      (departure) => departure.id === initial.departureId,
    ) ??
    initialSelectedTour.departures[0] ??
    null;
  const initialSeats = Math.min(
    initialDeparture?.seatsRemaining ?? 1,
    settings.booking.maxGuestsPerOrder,
  );

  const [step, setStep] = useState<Step>(1);
  const [selectedTourSlug, setSelectedTourSlug] = useState(initialSelectedTour.slug);
  const [selectedDepartureId, setSelectedDepartureId] = useState<number | null>(
    initialDeparture?.id ?? null,
  );
  const [guests, setGuests] = useState<BookingGuestCounts>(() =>
    clampGuests(
      {
        adults: Math.max(1, initial.adults ?? 1),
        children: Math.max(0, initial.children ?? 0),
        infants: Math.max(0, initial.infants ?? 0),
      },
      initialSeats,
    ),
  );
  const [contact, setContact] = useState<BookingContactValues>({
    contactName: "",
    phone: "",
    email: "",
    pickupPoint: "Trung tâm Quận 1",
    customerNote: "",
  });
  const [passengerDrafts, setPassengerDrafts] = useState<PassengerDraft[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<BookingSuccessData | null>(null);
  const requestIdRef = useRef<string | null>(null);

  const selectedTour = useMemo(
    () =>
      tours.find((tour) => tour.slug === selectedTourSlug) ?? initialTour,
    [initialTour, selectedTourSlug, tours],
  );
  const selectedDeparture = useMemo(
    () =>
      selectedTour.departures.find(
        (departure) => departure.id === selectedDepartureId,
      ) ?? null,
    [selectedDepartureId, selectedTour.departures],
  );
  const seats = totalSeats(guests);
  const maxSeats = Math.min(
    settings.booking.maxGuestsPerOrder,
    selectedDeparture?.seatsRemaining ?? 0,
  );
  const preview = calculateBookingPreview(selectedTour, selectedDeparture, guests);
  const hasPassengerDetails = passengerDrafts.some(
    (draft) => draft.fullName.trim() || draft.birthYear.trim(),
  );

  function invalidateRequestId() {
    requestIdRef.current = null;
  }

  function clearError(field?: string) {
    if (!field) {
      setErrors({});
      return;
    }

    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  }

  function selectTour(tour: BookingTourOption) {
    const departure = tour.departures[0] ?? null;
    setSelectedTourSlug(tour.slug);
    setSelectedDepartureId(departure?.id ?? null);
    setGuests((current) =>
      clampGuests(
        current,
        departure?.seatsRemaining ?? settings.booking.maxGuestsPerOrder,
      ),
    );
    setPassengerDrafts([]);
    setAccepted(false);
    clearError();
    invalidateRequestId();
  }

  function selectDeparture(departure: TourDepartureOption) {
    setSelectedDepartureId(departure.id);
    setGuests((current) => clampGuests(current, departure.seatsRemaining));
    clearError();
    invalidateRequestId();
  }

  function changeGuests(key: keyof BookingGuestCounts, delta: number) {
    setGuests((current) => {
      const next = { ...current, [key]: current[key] + delta };
      if (
        next.adults < 1 ||
        next.children < 0 ||
        next.infants < 0 ||
        totalSeats(next) > maxSeats
      ) {
        return current;
      }
      return next;
    });
    clearError();
    invalidateRequestId();
  }

  function updateContact(field: keyof BookingContactValues, value: string) {
    setContact((current) => ({ ...current, [field]: value }));
    clearError(field);
    invalidateRequestId();
  }

  function updatePassenger(
    index: number,
    field: keyof PassengerDraft,
    value: string,
  ) {
    setPassengerDrafts((current) => {
      const next = [...current];
      while (next.length <= index) {
        next.push({ fullName: "", birthYear: "" });
      }
      next[index] = { ...next[index]!, [field]: value };
      return next;
    });
    clearError(`passenger-${index}-${field}`);
    invalidateRequestId();
  }

  function validateStepOne(): boolean {
    if (!selectedDeparture) {
      setErrors({ step1: "Vui lòng chọn ngày khởi hành." });
      return false;
    }

    if (guests.adults < 1) {
      setErrors({ step1: "Cần ít nhất một người lớn." });
      return false;
    }

    if (seats > selectedDeparture.seatsRemaining) {
      setErrors({
        step1: "Số khách vượt quá số chỗ còn lại của chuyến đã chọn.",
      });
      return false;
    }

    if (seats > settings.booking.maxGuestsPerOrder) {
      setErrors({
        step1: `Mỗi đơn tối đa ${settings.booking.maxGuestsPerOrder} khách.`,
      });
      return false;
    }

    if (seats < 1) {
      setErrors({ step1: "Vui lòng chọn ít nhất một khách." });
      return false;
    }

    setErrors({});
    return true;
  }

  function validateContactStep(): boolean {
    const nextErrors: Record<string, string> = {
      ...validateContact(contact),
    };

    if (hasPassengerDetails) {
      Object.assign(
        nextErrors,
        validatePassengerDrafts(passengerDrafts, seats),
      );
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goToStep(nextStep: Step) {
    setStep(nextStep);
    setErrors({});
    setServerError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNext() {
    if (step === 1 && validateStepOne()) {
      goToStep(2);
      return;
    }

    if (step === 2 && validateContactStep()) {
      goToStep(3);
    }
  }

  function buildPassengers(): BookingRequestInput["passengers"] {
    if (!hasPassengerDetails) return undefined;

    return Array.from({ length: seats }).map((_, index) => {
      const draft = passengerDrafts[index] ?? { fullName: "", birthYear: "" };
      const birthYear = Number(draft.birthYear);

      return {
        fullName: draft.fullName.trim() || null,
        type: passengerTypeAt(index, guests),
        birthYear:
          draft.birthYear.trim() && Number.isFinite(birthYear)
            ? birthYear
            : null,
        note: null,
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const departure = selectedDeparture;
    if (!departure) {
      setStep(1);
      setErrors({ step1: "Vui lòng chọn ngày khởi hành." });
      return;
    }

    if (!validateContactStep()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!accepted) {
      setErrors({ terms: "Vui lòng đồng ý với chính sách đặt chỗ." });
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const clientRequestId =
        requestIdRef.current ??
        (requestIdRef.current = crypto.randomUUID());

      const payload: BookingRequestInput = {
        departureId: departure.id,
        contactName: contact.contactName.trim(),
        phone: normalizePhone(contact.phone),
        email: contact.email.trim().toLowerCase() || null,
        pickupPoint: contact.pickupPoint || null,
        customerNote: contact.customerNote.trim() || null,
        adults: guests.adults,
        children: guests.children,
        infants: guests.infants,
        clientRequestId,
        passengers: buildPassengers(),
      };

      const result = await submitBookingRequest(
        payload,
        settings.booking.holdHours,
      );

      setSuccess({
        code: result.code,
        status: "new",
        statusLabel: "Chờ xác nhận",
        holdExpiresAt: result.holdExpiresAt,
        tourCode: selectedTour.code,
        tourName: selectedTour.name,
        tourSlug: selectedTour.slug,
        durationDays: selectedTour.durationDays,
        durationNights: selectedTour.durationNights,
        coverImage: selectedTour.coverImage,
        departureDate: departure.date,
        contactName: payload.contactName,
        phoneMasked: maskPhone(payload.phone),
        guests,
        totalAmount: preview.total,
        pickupPoint: contact.pickupPoint,
        cancellationDeadline: cancelDeadline(
          departure.date,
          settings.booking.cancelCutoffDays,
        ),
        canCancel:
          isAtLeastDaysAhead(
            parseDateOnly(departure.date),
            settings.booking.cancelCutoffDays,
          ),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError(
        "Không thể gửi yêu cầu giữ chỗ. Vui lòng kiểm tra kết nối và thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetBooking() {
    const firstTour = tours[0]!;
    const firstDeparture = firstTour.departures[0] ?? null;
    setSuccess(null);
    setStep(1);
    setSelectedTourSlug(firstTour.slug);
    setSelectedDepartureId(firstDeparture?.id ?? null);
    setGuests(clampGuests({ adults: 1, children: 0, infants: 0 }, firstDeparture?.seatsRemaining ?? 1));
    setContact({
      contactName: "",
      phone: "",
      email: "",
      pickupPoint: "Trung tâm Quận 1",
      customerNote: "",
    });
    setPassengerDrafts([]);
    setAccepted(false);
    setErrors({});
    setServerError(null);
    requestIdRef.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (success) {
    return (
      <BookingSuccess
        success={success}
        settings={settings}
        onReset={resetBooking}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-6 border-b border-line pb-6 md:flex-row md:items-end">
        <div>
          <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase">
            Đặt giữ chỗ
          </span>
          <h1 className="mt-2 font-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.05] font-medium tracking-[-0.03em] text-ink">
            Chuẩn bị cho chuyến đi
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-sage">
            Chọn chuyến, để lại thông tin liên hệ và xem lại trước khi gửi. Chưa
            thu tiền trực tuyến.
          </p>
        </div>
        <div className="w-full max-w-xl md:w-auto md:min-w-[420px]">
          <BookingStepper currentStep={step} />
        </div>
      </div>

      {Object.keys(errors).length > 0 && !errors.form ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-[10px] border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
        >
          Vui lòng kiểm tra các trường được đánh dấu.
        </div>
      ) : null}

      <details className="group rounded-[16px] border border-line bg-surface lg:hidden">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">
              {selectedTour.code} ·{" "}
              {departureLabel(selectedDeparture?.date ?? null)}
            </span>
            <span className="mt-0.5 block truncate text-xs text-sage">
              {guests.adults} người lớn
              {guests.children > 0 ? `, ${guests.children} trẻ em` : ""}
              {guests.infants > 0 ? `, ${guests.infants} em bé` : ""} ·{" "}
              {preview.seats} chỗ
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-display text-lg font-semibold text-clay tabular-nums">
              {formatVndDisplay(preview.total)}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="size-4 text-sage transition-transform group-open:rotate-180"
            />
          </div>
        </summary>
        <div className="border-t border-line p-4">
          <BookingSummary
            tour={selectedTour}
            departure={selectedDeparture}
            guests={guests}
            pickupPoint={contact.pickupPoint}
            settings={settings}
            embedded
          />
        </div>
      </details>

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="min-w-0 lg:col-span-8">
          <form noValidate onSubmit={handleSubmit}>
            <div className="rounded-[20px] border border-line bg-surface p-4 md:p-7">
              {step === 1 ? (
                <StepTourSelection
                  tours={tours}
                  selectedTour={selectedTour}
                  selectedDeparture={selectedDeparture}
                  guests={guests}
                  maxSeats={maxSeats}
                  error={errors.step1}
                  onSelectTour={selectTour}
                  onSelectDeparture={selectDeparture}
                  onChangeGuests={changeGuests}
                />
              ) : null}

              {step === 2 ? (
                <StepContact
                  values={contact}
                  errors={errors}
                  totalGuests={seats}
                  guests={guests}
                  passengers={passengerDrafts}
                  onChange={updateContact}
                  onChangePassenger={updatePassenger}
                />
              ) : null}

              {step === 3 ? (
                <StepReview
                  tour={selectedTour}
                  departure={selectedDeparture}
                  guests={guests}
                  contact={contact}
                  settings={settings}
                  accepted={accepted}
                  hasPassengerDetails={hasPassengerDetails}
                  errors={errors}
                  serverError={serverError}
                  onAcceptedChange={(value) => {
                    setAccepted(value);
                    clearError("terms");
                  }}
                />
              ) : null}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep((step - 1) as Step)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-ink px-5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Quay lại
                </button>
              ) : (
                <span />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className={cn(
                    buttonVariants({ variant: "site", size: "site" }),
                    "w-full sm:w-auto",
                  )}
                >
                  Tiếp tục
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              ) : (
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
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                      Đang gửi yêu cầu
                    </>
                  ) : (
                    <>
                      Gửi yêu cầu giữ chỗ
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="mt-3 text-center text-xs text-sage sm:text-right">
              Thông tin liên hệ không được dùng để gửi quảng cáo.
            </p>
          </form>
        </div>

        <aside className="hidden self-start lg:sticky lg:top-28 lg:col-span-4 lg:block">
          <BookingSummary
            tour={selectedTour}
            departure={selectedDeparture}
            guests={guests}
            pickupPoint={contact.pickupPoint}
            settings={settings}
          />
        </aside>
      </div>
    </div>
  );
}
