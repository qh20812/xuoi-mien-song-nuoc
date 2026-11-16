/**
 * T1 · `normalizeBookingSettings` kẹp cấu hình do admin nhập về khoảng an toàn.
 *
 * Test thuần — không cần database, không cần `.env`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_BOOKING_SETTINGS,
  normalizeBookingSettings,
} from "@/lib/settings";

test("giữ nguyên giá trị hợp lệ", () => {
  assert.deepEqual(
    normalizeBookingSettings({
      minDaysAhead: 5,
      maxGuestsPerOrder: 12,
      holdHours: 48,
      cancelCutoffDays: 7,
    }),
    {
      minDaysAhead: 5,
      maxGuestsPerOrder: 12,
      holdHours: 48,
      cancelCutoffDays: 7,
    },
  );
});

test("thiếu hoặc sai kiểu thì dùng mặc định", () => {
  assert.deepEqual(normalizeBookingSettings({}), DEFAULT_BOOKING_SETTINGS);
  assert.deepEqual(normalizeBookingSettings(null), DEFAULT_BOOKING_SETTINGS);
  assert.deepEqual(normalizeBookingSettings(undefined), DEFAULT_BOOKING_SETTINGS);
  assert.deepEqual(normalizeBookingSettings([]), DEFAULT_BOOKING_SETTINGS);
  assert.deepEqual(
    normalizeBookingSettings("không phải object"),
    DEFAULT_BOOKING_SETTINGS,
  );
});

test("giá trị vượt biên bị kẹp về min/max", () => {
  const settings = normalizeBookingSettings({
    minDaysAhead: 999,
    maxGuestsPerOrder: 0,
    holdHours: 9999,
    cancelCutoffDays: -5,
  });

  assert.equal(settings.minDaysAhead, 60);
  assert.equal(settings.maxGuestsPerOrder, 1);
  assert.equal(settings.holdHours, 168);
  assert.equal(settings.cancelCutoffDays, 0);
});

test("số lẻ bị cắt phần thập phân", () => {
  const settings = normalizeBookingSettings({
    holdHours: 24.9,
    minDaysAhead: 2.7,
  });

  assert.equal(settings.holdHours, 24);
  assert.equal(settings.minDaysAhead, 2);
});

test("NaN và Infinity rơi về mặc định", () => {
  const settings = normalizeBookingSettings({
    holdHours: Number.NaN,
    minDaysAhead: Number.POSITIVE_INFINITY,
    maxGuestsPerOrder: Number.NEGATIVE_INFINITY,
  });

  assert.equal(settings.holdHours, DEFAULT_BOOKING_SETTINGS.holdHours);
  assert.equal(settings.minDaysAhead, DEFAULT_BOOKING_SETTINGS.minDaysAhead);
  assert.equal(
    settings.maxGuestsPerOrder,
    DEFAULT_BOOKING_SETTINGS.maxGuestsPerOrder,
  );
});
