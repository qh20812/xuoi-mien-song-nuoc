import assert from "node:assert/strict";
import { test } from "node:test";
import { formatUnreadCount } from "@/lib/contact/unread";

test("formatUnreadCount: ẩn badge khi 0 hoặc giá trị không hợp lệ", () => {
  assert.equal(formatUnreadCount(0), null);
  assert.equal(formatUnreadCount(-1), null);
  assert.equal(formatUnreadCount(Number.NaN), null);
  assert.equal(formatUnreadCount(Number.POSITIVE_INFINITY), null);
});

test("formatUnreadCount: 1–99 giữ nguyên, từ 100 cap 99+", () => {
  assert.equal(formatUnreadCount(1), "1");
  assert.equal(formatUnreadCount(42), "42");
  assert.equal(formatUnreadCount(99), "99");
  assert.equal(formatUnreadCount(100), "99+");
  assert.equal(formatUnreadCount(1234), "99+");
  assert.equal(formatUnreadCount(3.9), "3");
});
