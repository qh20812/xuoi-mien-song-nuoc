/**
 * D10.3 — service nhật ký thao tác.
 *
 *   node --import tsx --test scripts/tests/audit.test.mts
 *
 * Dùng action prefix riêng `qa.audit.` để không phụ thuộc dữ liệu seed và dọn sạch
 * sau khi chạy. Các bản ghi cố ý đặt mốc giờ sát biên ngày Việt Nam (UTC+7).
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

const { default: prisma } = await import("@/lib/prisma");
const { createTestAdmin } = await import("@/scripts/tests/helpers/factories");
const { listAdminAuditLogs, listAuditAdminOptions } = await import(
  "@/server/audit/admin-audit"
);

const PREFIX = "qa.audit.";

let adminA: { id: number };
let adminB: { id: number };
let rowA = 0;
let rowB = 0;
let rowC = 0;
let rowD = 0;

before(async () => {
  await prisma.adminAuditLog.deleteMany({ where: { action: { startsWith: PREFIX } } });

  adminA = await createTestAdmin(prisma, { name: "QA Audit A", role: "editor" });
  adminB = await createTestAdmin(prisma, { name: "QA Audit B", role: "admin" });

  // 23:59 ngày 20/11 giờ VN
  rowA = (
    await prisma.adminAuditLog.create({
      data: {
        adminId: adminA.id,
        action: `${PREFIX}alpha`,
        entity: "qa_entity",
        entityId: 1,
        meta: { note: "a" },
        createdAt: new Date("2026-11-20T16:59:00.000Z"),
      },
      select: { id: true },
    })
  ).id;

  // 00:00 ngày 21/11 giờ VN — biên của filter ngày
  rowB = (
    await prisma.adminAuditLog.create({
      data: {
        adminId: adminA.id,
        action: `${PREFIX}beta`,
        entity: "qa_entity",
        entityId: 2,
        createdAt: new Date("2026-11-20T17:00:00.000Z"),
      },
      select: { id: true },
    })
  ).id;

  rowC = (
    await prisma.adminAuditLog.create({
      data: {
        adminId: adminB.id,
        action: `${PREFIX}alpha`,
        entity: "qa_entity_b",
        entityId: null,
        createdAt: new Date("2026-11-22T03:00:00.000Z"),
      },
      select: { id: true },
    })
  ).id;

  rowD = (
    await prisma.adminAuditLog.create({
      data: {
        adminId: null,
        action: `${PREFIX}gamma`,
        entity: "qa_entity",
        entityId: 4,
        createdAt: new Date("2026-11-23T03:00:00.000Z"),
      },
      select: { id: true },
    })
  ).id;
});

after(async () => {
  await prisma.adminAuditLog.deleteMany({ where: { action: { startsWith: PREFIX } } });
  await prisma.adminUser.deleteMany({ where: { id: { in: [adminA.id, adminB.id] } } });
});

test("mặc định sắp xếp mới nhất trước và phân trang 50", async () => {
  const result = await listAdminAuditLogs({ action: PREFIX });

  assert.equal(result.pagination.total, 4);
  assert.equal(result.pagination.page, 1);
  assert.equal(result.pagination.pageSize, 50);
  assert.equal(result.pagination.totalPages, 1);
  assert.deepEqual(
    result.rows.map((row) => row.id),
    [rowD, rowC, rowB, rowA],
  );
  assert.equal(result.rows[0]?.meta, null);
  assert.deepEqual(result.rows[3]?.meta, { note: "a" });
});

test("lọc entity exact + action prefix", async () => {
  const byEntity = await listAdminAuditLogs({ action: PREFIX, entity: "qa_entity" });
  assert.deepEqual(
    byEntity.rows.map((row) => row.id),
    [rowD, rowB, rowA],
  );

  const byPrefix = await listAdminAuditLogs({
    action: `${PREFIX}alpha`,
    entity: "qa_entity",
  });
  assert.deepEqual(
    byPrefix.rows.map((row) => row.id),
    [rowA],
  );
  assert.equal(byPrefix.pagination.total, 1);
});

test("lọc theo người thực hiện", async () => {
  const result = await listAdminAuditLogs({ action: PREFIX, adminId: adminA.id });

  assert.equal(result.pagination.total, 2);
  assert.deepEqual(
    result.rows.map((row) => row.id),
    [rowB, rowA],
  );
  for (const row of result.rows) {
    assert.equal(row.admin?.id, adminA.id);
    assert.ok(row.admin?.name);
    assert.ok(row.admin?.email);
  }
});

test("biên ngày tính theo múi giờ Việt Nam, to là inclusive", async () => {
  const day20 = await listAdminAuditLogs({
    action: PREFIX,
    from: "2026-11-20",
    to: "2026-11-20",
  });
  assert.deepEqual(
    day20.rows.map((row) => row.id),
    [rowA],
    "16:59Z là 23:59 ngày 20/11 giờ VN",
  );

  const day21 = await listAdminAuditLogs({
    action: PREFIX,
    from: "2026-11-21",
    to: "2026-11-21",
  });
  assert.deepEqual(
    day21.rows.map((row) => row.id),
    [rowB],
    "17:00Z là 00:00 ngày 21/11 giờ VN",
  );

  const from22 = await listAdminAuditLogs({ action: PREFIX, from: "2026-11-22" });
  assert.deepEqual(
    from22.rows.map((row) => row.id),
    [rowD, rowC],
  );
});

test("ngày không hợp lệ bị bỏ qua thay vì ném lỗi", async () => {
  const result = await listAdminAuditLogs({
    action: PREFIX,
    from: "khong-phai-ngay",
    to: "2026-02-31",
  });

  assert.equal(result.pagination.total, 4);
});

test("pageSize bị kẹp 100 và page trả đúng khoảng", async () => {
  const capped = await listAdminAuditLogs({ action: PREFIX, pageSize: 500 });
  assert.equal(capped.pagination.pageSize, 100);

  const second = await listAdminAuditLogs({ action: PREFIX, page: 2, pageSize: 2 });
  assert.equal(second.pagination.totalPages, 2);
  assert.deepEqual(
    second.rows.map((row) => row.id),
    [rowB, rowA],
  );
});

test("admin đã xoá/không có admin trả null", async () => {
  const result = await listAdminAuditLogs({ action: `${PREFIX}gamma` });

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0]?.admin, null);
  assert.equal(result.rows[0]?.entityId, 4);
});

test("filter không khớp trả rỗng; options gồm admin vừa tạo", async () => {
  const empty = await listAdminAuditLogs({ action: `${PREFIX}khong-ton-tai` });
  assert.equal(empty.pagination.total, 0);
  assert.deepEqual(empty.rows, []);

  const options = await listAuditAdminOptions();
  const ids = options.map((item) => item.id);
  assert.ok(ids.includes(adminA.id));
  assert.ok(ids.includes(adminB.id));
});
