/**
 * T1 · Định dạng hiển thị dùng chung. Thuần, không cần DB.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatDateVN,
  formatDateTimeLongVN,
  formatDateTimeVN,
  formatLongDateVN,
  formatVndDisplay,
  maskPhone,
} from "@/lib/format";

test("maskPhone: chuỗi dưới 8 ký tự trả về ***", () => {
  assert.equal(maskPhone(""), "***");
  assert.equal(maskPhone("1234567"), "***");
});

test("maskPhone: giữ 4 ký tự đầu và 3 ký tự cuối", () => {
  assert.equal(maskPhone("0901234567"), "0901***567");
  assert.equal(maskPhone("12345678"), "1234***678");
});

test("formatVndDisplay: dấu ₫ và phân cách nghìn", () => {
  assert.equal(formatVndDisplay(4_190_000), "4.190.000 ₫");
  assert.equal(formatVndDisplay(0), "0 ₫");
});

test("formatDateVN: YYYY-MM-DD -> DD/MM/YYYY, fallback khi rỗng", () => {
  assert.equal(formatDateVN("2026-11-07"), "07/11/2026");
  assert.equal(formatDateVN(null), "—");
  assert.equal(formatDateVN(undefined), "—");
  assert.equal(formatDateVN(""), "—");
  assert.equal(formatDateVN("2026/11/07"), "2026/11/07");
});

test("formatLongDateVN: có thứ trong tuần, đúng ngày", () => {
  const formatted = formatLongDateVN("2026-11-07");

  assert.match(formatted, /^Thứ/);
  assert.match(formatted, /07\/11\/2026$/);
});

test("formatLongDateVN: giá trị không hợp lệ trả nguyên chuỗi", () => {
  assert.equal(formatLongDateVN("abc"), "abc");
});

test("formatDateTimeVN: fallback khi rỗng", () => {
  assert.equal(formatDateTimeVN(null), "—");
  assert.equal(formatDateTimeVN(undefined), "—");
});

test("formatDateTimeVN: dd/MM/yyyy HH:mm theo giờ Việt Nam", () => {
  assert.equal(formatDateTimeVN("2026-11-05T08:42:00+07:00"), "05/11/2026 08:42");
  assert.equal(formatDateTimeVN("2026-11-05T01:42:00.000Z"), "05/11/2026 08:42");
});

test("formatDateTimeLongVN: đổi UTC sang giờ Việt Nam", () => {
  // 15:16 UTC = 22:16 giờ VN
  const formatted = formatDateTimeLongVN("2026-11-05T15:16:00.000Z");

  assert.match(formatted, /05\/11\/2026/);
  assert.match(formatted, /22:16$/);
  assert.equal(formatDateTimeLongVN(null), "—");
});
