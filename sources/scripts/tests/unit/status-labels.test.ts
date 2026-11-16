/**
 * A8 · Nhãn trạng thái đơn dùng chung cho admin và API công khai. Thuần, không cần DB.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  isOrderStatus,
  statusLabel,
} from "@/lib/booking/status-labels";

test("ORDER_STATUSES: đúng 6 trạng thái, đúng thứ tự hiển thị", () => {
  assert.deepEqual([...ORDER_STATUSES], [
    "new",
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "expired",
  ]);
});

test("statusLabel: nhãn tiếng Việt khớp bảng", () => {
  assert.equal(statusLabel("new"), "Chờ xác nhận");
  assert.equal(statusLabel("pending"), "Đang liên hệ");
  assert.equal(statusLabel("confirmed"), "Đã xác nhận");
  assert.equal(statusLabel("completed"), "Đã hoàn thành");
  assert.equal(statusLabel("cancelled"), "Đã huỷ");
  assert.equal(statusLabel("expired"), "Hết hạn giữ chỗ");
});

test("statusLabel: giá trị lạ trả nguyên văn, không che lỗi dữ liệu", () => {
  assert.equal(statusLabel("unknown"), "unknown");
  assert.equal(statusLabel(""), "");
});

test("isOrderStatus: chỉ nhận chuỗi thuộc enum", () => {
  assert.equal(isOrderStatus("new"), true);
  assert.equal(isOrderStatus("expired"), true);
  assert.equal(isOrderStatus("NEW"), false);
  assert.equal(isOrderStatus(null), false);
  assert.equal(isOrderStatus(1), false);
});

test("ORDER_STATUS_LABELS: phủ đủ mọi key của ORDER_STATUSES", () => {
  for (const status of ORDER_STATUSES) {
    assert.equal(ORDER_STATUS_LABELS[status], statusLabel(status));
  }
});
