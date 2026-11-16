/**
 * T1 · Validate form liên hệ phía client và map sang payload API.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { contactSubjectLabel } from "@/lib/contact/topics";
import {
  toContactRequest,
  validateContact,
} from "@/lib/contact/validation";
import type { ContactFormValues } from "@/lib/contracts/contact";
import { createContactMessageSchema } from "@/lib/validation/contact";

const valid: ContactFormValues = {
  name: "Nguyễn Văn A",
  phone: "0901234567",
  email: "",
  topic: "tour",
  message: "Tôi muốn hỏi lịch khởi hành tháng 12.",
};

test("form hợp lệ thì không có lỗi", () => {
  assert.deepEqual(validateContact(valid), {});
});

test("họ tên: tối thiểu 2 và tối đa 120 ký tự", () => {
  assert.ok(validateContact({ ...valid, name: "A" }).name);
  assert.ok(validateContact({ ...valid, name: "a".repeat(121) }).name);
  assert.equal(
    validateContact({ ...valid, name: "a".repeat(120) }).name,
    undefined,
  );
});

test("số điện thoại: chấp nhận định dạng VN, chặn chuỗi sai", () => {
  assert.ok(validateContact({ ...valid, phone: "123" }).phone);
  assert.ok(validateContact({ ...valid, phone: "09012345678" }).phone);
  assert.equal(
    validateContact({ ...valid, phone: "+84 901 234 567" }).phone,
    undefined,
  );
});

test("email: tuỳ chọn, nhưng sai định dạng thì báo lỗi", () => {
  assert.equal(validateContact({ ...valid, email: "" }).email, undefined);
  assert.ok(validateContact({ ...valid, email: "sai-dinh-dang" }).email);
  assert.ok(
    validateContact({ ...valid, email: `${"a".repeat(160)}@x.vn` }).email,
  );
});

test("chủ đề là bắt buộc", () => {
  assert.ok(validateContact({ ...valid, topic: "" }).topic);
});

test("nội dung: 10 đến 2000 ký tự", () => {
  assert.ok(validateContact({ ...valid, message: "ngắn" }).message);
  assert.ok(
    validateContact({ ...valid, message: "a".repeat(2001) }).message,
  );
  assert.equal(
    validateContact({ ...valid, message: "a".repeat(2000) }).message,
    undefined,
  );
});

test("toContactRequest: chuẩn hoá phone/email và map nhãn chủ đề", () => {
  const request = toContactRequest({
    ...valid,
    phone: "+84 901 234 567",
    email: "A@Example.COM",
  });

  assert.deepEqual(request, {
    name: "Nguyễn Văn A",
    phone: "0901234567",
    email: "a@example.com",
    subject: "Tư vấn tour",
    message: "Tôi muốn hỏi lịch khởi hành tháng 12.",
  });
});

test("toContactRequest: email rỗng hoặc chỉ khoảng trắng thành null", () => {
  assert.equal(toContactRequest({ ...valid, email: "" }).email, null);
  assert.equal(toContactRequest({ ...valid, email: "   " }).email, null);
});

test("contactSubjectLabel: map đủ 4 chủ đề, rỗng thì trả chuỗi rỗng", () => {
  assert.equal(contactSubjectLabel("tour"), "Tư vấn tour");
  assert.equal(contactSubjectLabel("booking"), "Hỗ trợ đơn giữ chỗ");
  assert.equal(contactSubjectLabel("private-group"), "Thiết kế đoàn riêng");
  assert.equal(contactSubjectLabel("other"), "Câu hỏi khác");
  assert.equal(contactSubjectLabel(""), "");
});

// --- Schema phía server (POST /api/contact) --------------------------------

function serverPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Nguyễn Văn A",
    phone: "0901234567",
    email: null,
    subject: "Tư vấn tour",
    message: "Tôi muốn hỏi lịch khởi hành tháng 12.",
    ...overrides,
  };
}

test("createContactMessageSchema: hợp lệ, chuẩn hoá phone/email", () => {
  const parsed = createContactMessageSchema.parse(
    serverPayload({ phone: "+84 901 234 567", email: "A@Example.COM" }),
  );

  assert.equal(parsed.phone, "0901234567");
  assert.equal(parsed.email, "a@example.com");
  assert.equal(parsed.subject, "Tư vấn tour");
});

test("createContactMessageSchema: email null hoặc rỗng đều thành null", () => {
  assert.equal(createContactMessageSchema.parse(serverPayload()).email, null);
  assert.equal(
    createContactMessageSchema.parse(serverPayload({ email: "  " })).email,
    null,
  );
});

test("createContactMessageSchema: nội dung dưới 10 ký tự bị chặn", () => {
  assert.throws(() =>
    createContactMessageSchema.parse(serverPayload({ message: "ngắn" })),
  );
});

test("createContactMessageSchema: chủ đề rỗng bị chặn", () => {
  assert.throws(() =>
    createContactMessageSchema.parse(serverPayload({ subject: "" })),
  );
});

test("createContactMessageSchema: phone sai và field lạ bị chặn", () => {
  assert.throws(() =>
    createContactMessageSchema.parse(serverPayload({ phone: "123" })),
  );
  assert.throws(() =>
    createContactMessageSchema.parse(serverPayload({ status: "read" })),
  );
});
