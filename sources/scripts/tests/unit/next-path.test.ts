/**
 * T1 · `sanitizeNextPath` chống open redirect sau khi đăng nhập admin.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeNextPath } from "@/lib/auth/next-path";

test("chấp nhận đường dẫn nội bộ trong /admin", () => {
  assert.equal(sanitizeNextPath("/admin"), "/admin");
  assert.equal(sanitizeNextPath("/admin/orders"), "/admin/orders");
  assert.equal(
    sanitizeNextPath("/admin/orders?status=new"),
    "/admin/orders?status=new",
  );
  assert.equal(sanitizeNextPath("/admin?tab=1"), "/admin?tab=1");
});

test("chặn open redirect và đường dẫn ngoài /admin", () => {
  assert.equal(sanitizeNextPath("//evil.com"), "/admin");
  assert.equal(sanitizeNextPath("https://evil.com"), "/admin");
  assert.equal(sanitizeNextPath("/admin\\..\\evil"), "/admin");
  assert.equal(sanitizeNextPath("/other"), "/admin");
  assert.equal(sanitizeNextPath("admin"), "/admin");
});

test("rỗng hoặc null trả fallback", () => {
  assert.equal(sanitizeNextPath(""), "/admin");
  assert.equal(sanitizeNextPath(null), "/admin");
  assert.equal(sanitizeNextPath(undefined), "/admin");
});

test("dùng fallback tuỳ chỉnh khi giá trị không hợp lệ", () => {
  assert.equal(sanitizeNextPath("https://evil.com", "/admin/orders"), "/admin/orders");
  assert.equal(sanitizeNextPath(null, "/admin/orders"), "/admin/orders");
});
