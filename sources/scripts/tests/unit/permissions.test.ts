/**
 * T1 · Ma trận phân quyền admin (D6).
 *
 * Hàm thuần, không cần DB: bảo đảm `editor` không bao giờ chạm vào tiền/cấu hình
 * và `admin` không quản lý được tài khoản.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CAPABILITIES,
  can,
  capabilitiesFor,
  isAdminRoleValue,
  isCapability,
} from "@/server/auth/permissions";

test("owner có toàn bộ capability", () => {
  for (const capability of CAPABILITIES) {
    assert.equal(can("owner", capability), true, `owner thiếu ${capability}`);
  }
  assert.equal(capabilitiesFor("owner").length, CAPABILITIES.length);
});

test("admin làm được vận hành nhưng không quản lý tài khoản/audit", () => {
  assert.equal(can("admin", "orders:read"), true);
  assert.equal(can("admin", "orders:write"), true);
  assert.equal(can("admin", "orders:export"), true);
  assert.equal(can("admin", "catalog:write"), true);
  assert.equal(can("admin", "settings:write"), true);
  assert.equal(can("admin", "content:write"), true);
  assert.equal(can("admin", "messages:write"), true);

  assert.equal(can("admin", "users:manage"), false);
  assert.equal(can("admin", "audit:read"), false);
});

test("editor chỉ đọc đơn, xử lý hộp thư và nội dung", () => {
  assert.equal(can("editor", "orders:read"), true);
  assert.equal(can("editor", "messages:read"), true);
  assert.equal(can("editor", "messages:write"), true);
  assert.equal(can("editor", "content:write"), true);

  assert.equal(can("editor", "orders:write"), false);
  assert.equal(can("editor", "orders:export"), false);
  assert.equal(can("editor", "catalog:write"), false, "editor không được sửa giá/chuyến");
  assert.equal(can("editor", "settings:write"), false);
  assert.equal(can("editor", "users:manage"), false);
  assert.equal(can("editor", "audit:read"), false);
});

test("role lạ hoặc rỗng không có quyền gì", () => {
  for (const role of [null, undefined, "", "root", "OWNER"]) {
    assert.equal(can(role, "orders:read"), false, `role ${String(role)} phải bị chặn`);
    assert.deepEqual(capabilitiesFor(role), []);
  }
});

test("capabilitiesFor trả bản sao, sửa không ảnh hưởng ma trận", () => {
  const editorCaps = capabilitiesFor("editor");
  editorCaps.push("users:manage");

  assert.equal(can("editor", "users:manage"), false);
});

test("isCapability và isAdminRoleValue chỉ nhận giá trị khai báo", () => {
  assert.equal(isCapability("orders:read"), true);
  assert.equal(isCapability("orders:delete"), false);
  assert.equal(isCapability(null), false);
  assert.equal(isCapability(42), false);

  assert.equal(isAdminRoleValue("owner"), true);
  assert.equal(isAdminRoleValue("editor"), true);
  assert.equal(isAdminRoleValue("root"), false);
  assert.equal(isAdminRoleValue(undefined), false);
});
