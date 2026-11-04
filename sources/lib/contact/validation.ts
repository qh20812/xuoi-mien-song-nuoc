import type {
  ContactFormValues,
  ContactRequest,
} from "@/lib/contracts/contact";
import { normalizePhone } from "@/lib/booking/validation";
import { contactSubjectLabel } from "@/lib/contact/topics";

export type ContactErrors = Record<string, string>;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateContact(values: ContactFormValues): ContactErrors {
  const errors: ContactErrors = {};
  const name = values.name.trim();
  const phone = normalizePhone(values.phone);
  const email = values.email.trim();
  const message = values.message.trim();

  if (name.length < 2) {
    errors.name = "Vui lòng nhập họ tên.";
  } else if (name.length > 120) {
    errors.name = "Họ tên tối đa 120 ký tự.";
  }

  if (!/^0\d{9}$/.test(phone)) {
    errors.phone = "Số điện thoại không hợp lệ.";
  }

  if (email && !isValidEmail(email)) {
    errors.email = "Email không hợp lệ.";
  } else if (email.length > 160) {
    errors.email = "Email tối đa 160 ký tự.";
  }

  if (!values.topic) {
    errors.topic = "Vui lòng chọn chủ đề.";
  }

  if (message.length < 10) {
    errors.message = "Vui lòng mô tả nội dung cần hỗ trợ.";
  } else if (message.length > 2000) {
    errors.message = "Nội dung tối đa 2.000 ký tự.";
  }

  return errors;
}

export function toContactRequest(values: ContactFormValues): ContactRequest {
  return {
    name: values.name.trim(),
    phone: normalizePhone(values.phone),
    email: values.email.trim().toLowerCase() || null,
    subject: contactSubjectLabel(values.topic),
    message: values.message.trim(),
  };
}
