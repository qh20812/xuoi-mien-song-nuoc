import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  AUDIT_ENTITY_OPTIONS,
  auditActionLabel,
  auditEntityLabel,
  isAuditEntity,
} from "@/lib/audit/labels";

test("auditEntityLabel map đủ 12 entity thật trong hệ thống", () => {
  assert.equal(Object.keys(AUDIT_ENTITY_LABELS).length, 12);
  assert.equal(auditEntityLabel("order"), "Đơn hàng");
  assert.equal(auditEntityLabel("tour_departure"), "Chuyến khởi hành");
  assert.equal(auditEntityLabel("setting"), "Cấu hình");
  assert.equal(auditEntityLabel("admin_user"), "Người dùng");
});

test("auditEntityLabel giữ nguyên văn giá trị lạ để không che dữ liệu cũ", () => {
  assert.equal(auditEntityLabel("unknown_entity"), "unknown_entity");
  assert.equal(isAuditEntity("order"), true);
  assert.equal(isAuditEntity("tour_departure"), true);
  assert.equal(isAuditEntity("unknown_entity"), false);
  assert.equal(isAuditEntity(null), false);
});

test("AUDIT_ENTITY_OPTIONS khớp keys và giữ nhãn", () => {
  assert.equal(AUDIT_ENTITY_OPTIONS.length, Object.keys(AUDIT_ENTITY_LABELS).length);
  for (const option of AUDIT_ENTITY_OPTIONS) {
    assert.equal(option.label, AUDIT_ENTITY_LABELS[option.value]);
  }
});

test("auditActionLabel map đủ 40 action và không có nhãn rỗng", () => {
  assert.equal(Object.keys(AUDIT_ACTION_LABELS).length, 40);
  for (const [action, label] of Object.entries(AUDIT_ACTION_LABELS)) {
    assert.ok(action.includes("."), `${action} phải có dạng entity.action`);
    assert.ok(label.trim().length > 0, `${action} thiếu nhãn`);
  }

  assert.equal(auditActionLabel("order.confirm"), "Xác nhận đơn");
  assert.equal(auditActionLabel("admin.password_self"), "Tự đổi mật khẩu");
  assert.equal(auditActionLabel("settings.booking.update"), "Cập nhật cấu hình đặt tour");
  assert.equal(auditActionLabel("order.unknown"), "order.unknown");
});
