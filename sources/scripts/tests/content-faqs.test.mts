/**
 * D9.5 · FAQ: loader public theo placement + CRUD admin (DB test).
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { FaqInput } from "@/server/content/admin-faqs";
import type { FaqPlacement } from "@/lib/contracts/faq";
import type { FaqCategory } from "@/lib/content/faq-options";

const { createTestAdmin, uniqueSuffix } = await import(
  "@/scripts/tests/helpers/factories"
);
const { default: prisma } = await import("@/lib/prisma");
const { AppError } = await import("@/server/errors");
const { queryContactFaqs, queryHomeFaqs } = await import(
  "@/server/content/faqs-query"
);
const {
  createFaq,
  deleteFaq,
  getAdminFaq,
  listAdminFaqs,
  updateFaq,
} = await import("@/server/content/admin-faqs");

let prefix = "";
let adminId = 0;
let homeQuestion = "";
let contactQuestion = "";
let bothQuestion = "";
let hiddenQuestion = "";
let unplacedQuestion = "";

async function cleanup() {
  if (prefix) {
    await prisma.faq.deleteMany({
      where: { question: { startsWith: prefix } },
    });
  }
  if (adminId) {
    await prisma.adminAuditLog.deleteMany({ where: { adminId } });
    await prisma.adminUser.deleteMany({ where: { id: adminId } });
  }
}

before(async () => {
  prefix = `QA FAQ ${uniqueSuffix()}`;
  await cleanup();

  const admin = await createTestAdmin(prisma);
  adminId = admin.id;

  homeQuestion = `${prefix} — trang chủ`;
  contactQuestion = `${prefix} — liên hệ`;
  bothQuestion = `${prefix} — cả hai`;
  hiddenQuestion = `${prefix} — đang ẩn`;
  unplacedQuestion = `${prefix} — không đặt`;

  await prisma.faq.createMany({
    data: [
      {
        question: homeQuestion,
        answer: "Trả lời trang chủ",
        category: "booking",
        placement: "home",
        sortOrder: 900,
        isActive: true,
      },
      {
        question: contactQuestion,
        answer: "Trả lời liên hệ",
        category: "transport",
        placement: "contact",
        sortOrder: 901,
        isActive: true,
      },
      {
        question: bothQuestion,
        answer: "Trả lời cả hai",
        category: "safety",
        placement: "both",
        sortOrder: 902,
        isActive: true,
      },
      {
        question: hiddenQuestion,
        answer: "Không được hiện",
        category: "general",
        placement: "home",
        sortOrder: 903,
        isActive: false,
      },
      {
        question: unplacedQuestion,
        answer: "Không đặt vị trí",
        category: "weather",
        placement: null,
        sortOrder: 904,
        isActive: true,
      },
    ],
  });
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

function faqInput(overrides: Partial<FaqInput> = {}): FaqInput {
  return {
    question: `${prefix} — admin`,
    answer: "Câu trả lời admin",
    category: "booking",
    placement: "home",
    sortOrder: 905,
    isActive: true,
    ...overrides,
  };
}

test("queryHomeFaqs: chỉ active + home/both, đúng thứ tự", async () => {
  const rows = await queryHomeFaqs();
  const ours = rows.filter((row) => row.question.startsWith(prefix));

  assert.deepEqual(
    ours.map((row) => row.question),
    [homeQuestion, bothQuestion],
  );

  assert.equal(ours[0]!.placement, "home");
  assert.equal(ours[1]!.placement, "both");
  assert.ok(ours.every((row) => row.isActive));
});

test("queryContactFaqs: chỉ active + contact/both", async () => {
  const rows = await queryContactFaqs();
  const ours = rows.filter((row) => row.question.startsWith(prefix));

  assert.deepEqual(
    ours.map((row) => row.question),
    [contactQuestion, bothQuestion],
  );
});

test("admin: tạo FAQ, ghi audit và hiện đúng placement", async () => {
  const input = faqInput({ placement: "both" });
  const row = await createFaq(input, adminId);

  assert.equal(row.question, input.question);
  assert.equal(row.placement, "both");
  assert.equal(row.isActive, true);

  const audit = await prisma.adminAuditLog.findFirst({
    where: {
      adminId,
      entity: "faq",
      entityId: row.id,
      action: "faq.create",
    },
  });
  assert.ok(audit);

  const home = await queryHomeFaqs();
  const contact = await queryContactFaqs();
  assert.ok(home.some((item) => item.question === input.question));
  assert.ok(contact.some((item) => item.question === input.question));
});

test("admin: sửa FAQ, tắt isActive thì biến khỏi public", async () => {
  const created = await createFaq(
    faqInput({ question: `${prefix} — sửa`, placement: "contact" }),
    adminId,
  );

  const updated = await updateFaq(
    created.id,
    {
      ...faqInput({ question: `${prefix} — đã sửa`, placement: "home" }),
      category: "food",
      isActive: false,
      sortOrder: 906,
    },
    adminId,
  );

  assert.equal(updated.question, `${prefix} — đã sửa`);
  assert.equal(updated.category, "food");
  assert.equal(updated.placement, "home");
  assert.equal(updated.isActive, false);

  const audit = await prisma.adminAuditLog.findFirst({
    where: {
      adminId,
      entity: "faq",
      entityId: created.id,
      action: "faq.update",
    },
  });
  assert.ok(audit);

  const home = await queryHomeFaqs();
  assert.equal(
    home.some((item) => item.question === updated.question),
    false,
  );
});

test("admin: xoá FAQ, 404 và audit", async () => {
  const created = await createFaq(
    faqInput({ question: `${prefix} — xoá` }),
    adminId,
  );

  await deleteFaq(created.id, adminId);

  await assert.rejects(
    () => getAdminFaq(created.id),
    (error: unknown) =>
      error instanceof AppError && error.code === "FAQ_NOT_FOUND",
  );

  await assert.rejects(
    () => deleteFaq(created.id, adminId),
    (error: unknown) =>
      error instanceof AppError && error.code === "FAQ_NOT_FOUND",
  );

  const audit = await prisma.adminAuditLog.findFirst({
    where: {
      adminId,
      entity: "faq",
      entityId: created.id,
      action: "faq.delete",
    },
  });
  assert.ok(audit);
});

test("admin: danh sách gồm cả FAQ ẩn và không đặt vị trí", async () => {
  const rows = await listAdminFaqs();
  const ours = rows.filter((row) => row.question.startsWith(prefix));

  assert.ok(ours.some((row) => row.question === hiddenQuestion && !row.isActive));
  assert.ok(ours.some((row) => row.question === unplacedQuestion && row.placement === null));

  const sorted = ours.every(
    (row, index) => index === 0 || ours[index - 1]!.sortOrder <= row.sortOrder,
  );
  assert.ok(sorted);
});

test("admin: validate question/answer/category/placement/sort/isActive", async () => {
  const cases: Array<Partial<FaqInput>> = [
    { question: "A" },
    { answer: "A" },
    { category: "khong-hop-le" as FaqCategory },
    { placement: "sidebar" as FaqPlacement },
    { sortOrder: -1 },
    { isActive: "yes" as unknown as boolean },
  ];

  for (const [index, overrides] of cases.entries()) {
    await assert.rejects(
      () =>
        createFaq(
          faqInput({
            ...overrides,
            question:
              overrides.question ?? `${prefix} — bad ${index}`,
          }),
          adminId,
        ),
      (error: unknown) =>
        error instanceof AppError && error.code === "INVALID_FAQ",
      `case ${index}`,
    );
  }
});

test("admin: update 404", async () => {
  await assert.rejects(
    () => updateFaq(999_999_999, faqInput({ question: `${prefix} — 404` }), adminId),
    (error: unknown) =>
      error instanceof AppError && error.code === "FAQ_NOT_FOUND",
  );
});
