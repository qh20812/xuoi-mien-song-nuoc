/**
 * T1 · Schema đầu vào API đặt chỗ / tra cứu.
 *
 * Gồm case hồi quy cho bug B2: client gửi `email: null` cho trường không bắt buộc.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  createOrderSchema,
  lookupOrderSchema,
  normalizePhone,
} from "@/lib/validation/order";

function validOrder(overrides: Record<string, unknown> = {}) {
  return {
    departureId: 12,
    contactName: "Nguyễn Văn A",
    phone: "0901234567",
    email: null,
    pickupPoint: null,
    customerNote: null,
    adults: 2,
    children: 1,
    infants: 1,
    clientRequestId: randomUUID(),
    ...overrides,
  };
}

test("normalizePhone: +84, 84, khoảng trắng, dấu chấm, ngoặc", () => {
  assert.equal(normalizePhone("0901234567"), "0901234567");
  assert.equal(normalizePhone("+84 901 234 567"), "0901234567");
  assert.equal(normalizePhone("+84901234567"), "0901234567");
  assert.equal(normalizePhone("84-901-234-567"), "0901234567");
  assert.equal(normalizePhone("(090) 123.4567"), "0901234567");
});

test("chấp nhận email null (hồi quy bug B2)", () => {
  const parsed = createOrderSchema.parse(validOrder());

  assert.equal(parsed.email, null);
});

test("chuẩn hoá phone và email khi parse", () => {
  const parsed = createOrderSchema.parse(
    validOrder({ phone: "+84 901 234 567", email: "A@Example.COM" }),
  );

  assert.equal(parsed.phone, "0901234567");
  assert.equal(parsed.email, "a@example.com");
});

test("email rỗng được coi là không có", () => {
  const parsed = createOrderSchema.parse(validOrder({ email: "   " }));

  assert.equal(parsed.email, null);
});

test("clientRequestId phải là UUID", () => {
  assert.throws(() =>
    createOrderSchema.parse(validOrder({ clientRequestId: "abc" })),
  );
});

test("passengers phải đủ số khách khi có gửi", () => {
  assert.throws(() =>
    createOrderSchema.parse(
      validOrder({
        passengers: [
          { fullName: "A", type: "adult", birthYear: 1990, note: null },
        ],
      }),
    ),
  );
});

test("số em bé không hợp lý so với người lớn + trẻ em", () => {
  assert.throws(() =>
    createOrderSchema.parse(
      validOrder({ adults: 1, children: 0, infants: 5 }),
    ),
  );
});

test("chặn field lạ (strict)", () => {
  assert.throws(() =>
    createOrderSchema.parse(validOrder({ totalAmount: 1_000_000 })),
  );
});

test("lookupOrderSchema: chuẩn hoá mã đơn và số điện thoại", () => {
  const parsed = lookupOrderSchema.parse({
    code: "xmsn-2026-0001",
    phone: "+84 901 234 567",
  });

  assert.equal(parsed.code, "XMSN-2026-0001");
  assert.equal(parsed.phone, "0901234567");
});

test("lookupOrderSchema: mã sai định dạng bị chặn", () => {
  assert.throws(() =>
    lookupOrderSchema.parse({ code: "TEST-1", phone: "0901234567" }),
  );
  assert.throws(() =>
    lookupOrderSchema.parse({ code: "XMSN-26-0001", phone: "0901234567" }),
  );
});
