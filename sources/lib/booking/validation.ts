import type { BookingContactValues, PassengerDraft } from "@/lib/contracts/booking";

export type ValidationErrors = Record<string, string>;

export function normalizePhone(raw: string): string {
  let phone = raw.replace(/[\s.\-()]/g, "");
  if (phone.startsWith("+84")) phone = `0${phone.slice(3)}`;
  else if (phone.startsWith("84") && phone.length === 11) {
    phone = `0${phone.slice(2)}`;
  }
  return phone;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateContact(values: BookingContactValues): ValidationErrors {
  const errors: ValidationErrors = {};
  const name = values.contactName.trim();
  const phone = normalizePhone(values.phone);
  const email = values.email.trim();
  const note = values.customerNote.trim();

  if (name.length < 2) {
    errors.contactName = "Vui lòng nhập họ tên người đại diện.";
  } else if (name.length > 120) {
    errors.contactName = "Họ tên tối đa 120 ký tự.";
  }

  if (!/^0\d{9}$/.test(phone)) {
    errors.phone = "Số điện thoại không hợp lệ.";
  }

  if (email && !isValidEmail(email)) {
    errors.email = "Email không hợp lệ.";
  } else if (email.length > 160) {
    errors.email = "Email tối đa 160 ký tự.";
  }

  if (!values.pickupPoint) {
    errors.pickupPoint = "Vui lòng chọn điểm đón.";
  }

  if (note.length > 2000) {
    errors.customerNote = "Ghi chú tối đa 2.000 ký tự.";
  }

  return errors;
}

export function validatePassengerDrafts(
  drafts: PassengerDraft[],
  totalGuests: number,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const currentYear = new Date().getFullYear();

  for (let index = 0; index < totalGuests; index += 1) {
    const draft = drafts[index];
    if (!draft) continue;

    if (draft.fullName.trim().length > 120) {
      errors[`passenger-${index}-fullName`] = "Họ tên tối đa 120 ký tự.";
    }

    const birthYear = draft.birthYear.trim();
    if (
      birthYear &&
      (!/^\d{4}$/.test(birthYear) ||
        Number(birthYear) < 1900 ||
        Number(birthYear) > currentYear)
    ) {
      errors[`passenger-${index}-birthYear`] = "Năm sinh không hợp lệ.";
    }
  }

  return errors;
}

export function passengerTypeAt(
  index: number,
  counts: { adults: number; children: number },
): "adult" | "child" | "infant" {
  if (index < counts.adults) return "adult";
  if (index < counts.adults + counts.children) return "child";
  return "infant";
}
