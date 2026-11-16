/**
 * T2 · Feature test cho `POST /api/contact` (route handler thật, DB test).
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";

const { default: prisma } = await import("@/lib/prisma");
const { POST } = await import("@/app/api/contact/route");
const { resetRateLimit } = await import("@/lib/rate-limit");

const PHONE = "0901234567";

function request(body: unknown) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Khách kiểm thử",
    phone: PHONE,
    email: null,
    subject: "Tư vấn tour",
    message: "Tôi muốn hỏi lịch khởi hành tháng 12.",
    ...overrides,
  };
}

beforeEach(async () => {
  await prisma.contactMessage.deleteMany({ where: { phone: PHONE } });
  resetRateLimit();
});

after(async () => {
  await prisma.contactMessage.deleteMany({ where: { phone: PHONE } });
  await prisma.$disconnect();
});

test("gửi hợp lệ trả 201 và ghi vào contact_messages", async () => {
  const response = await POST(request(validInput()));

  assert.equal(response.status, 201);

  const body = (await response.json()) as { ok: boolean };
  assert.equal(body.ok, true);
  assert.equal("id" in body, false, "response không được lộ id nội bộ");

  const rows = await prisma.contactMessage.findMany({
    where: { phone: PHONE },
    select: { name: true, subject: true, email: true, status: true },
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.name, "Khách kiểm thử");
  assert.equal(rows[0]!.subject, "Tư vấn tour");
  assert.equal(rows[0]!.email, null);
  assert.equal(rows[0]!.status, "new");
});

test("nội dung dưới 10 ký tự trả 400 kèm path message", async () => {
  const response = await POST(request(validInput({ message: "ngắn" })));

  assert.equal(response.status, 400);

  const body = (await response.json()) as {
    error: { code: string; details?: { fields?: Array<{ path: string }> } };
  };

  assert.equal(body.error.code, "INVALID_INPUT");
  assert.ok(
    body.error.details?.fields?.some((field) => field.path === "message"),
  );
});

test("số điện thoại sai trả 400 kèm path phone", async () => {
  const response = await POST(request(validInput({ phone: "123" })));

  assert.equal(response.status, 400);

  const body = (await response.json()) as {
    error: { details?: { fields?: Array<{ path: string }> } };
  };

  assert.ok(
    body.error.details?.fields?.some((field) => field.path === "phone"),
  );
});

test("request thứ 4 trong 10 phút bị chặn 429 + retry-after", async () => {
  for (let index = 0; index < 3; index += 1) {
    const response = await POST(request(validInput()));
    assert.equal(response.status, 201, `request ${index + 1} phải thành công`);
  }

  const blocked = await POST(request(validInput()));

  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
});
