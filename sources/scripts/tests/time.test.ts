import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDaysToDateString,
  addHours,
  cancelDeadline,
  dateOnly,
  daysBetweenDateStrings,
  daysUntilDeparture,
  isAtLeastDaysAhead,
  parseDateOnly,
  todayVN,
} from "@/lib/time";

test("todayVN dùng múi giờ Việt Nam, không dùng UTC của server", () => {
  const lateUtc = new Date("2026-10-20T17:30:00.000Z"); // 00:30 ngày 21/10 giờ VN
  assert.equal(todayVN(lateUtc), "2026-10-21");
  assert.equal(lateUtc.toISOString().slice(0, 10), "2026-10-20");

  const earlyUtc = new Date("2026-10-20T16:59:00.000Z"); // 23:59 ngày 20/10 giờ VN
  assert.equal(todayVN(earlyUtc), "2026-10-20");
});

test("daysUntilDeparture tính đúng theo lịch VN", () => {
  const now = new Date("2026-10-21T03:00:00.000Z"); // 10:00 giờ VN
  assert.equal(daysUntilDeparture(parseDateOnly("2026-10-21"), now), 0);
  assert.equal(daysUntilDeparture(parseDateOnly("2026-10-24"), now), 3);
  assert.equal(daysUntilDeparture(parseDateOnly("2026-10-20"), now), -1);
});

test("isAtLeastDaysAhead biên đúng 3 ngày", () => {
  const now = new Date("2026-10-21T03:00:00.000Z");
  assert.equal(isAtLeastDaysAhead(parseDateOnly("2026-10-24"), 3, now), true);
  assert.equal(isAtLeastDaysAhead(parseDateOnly("2026-10-23"), 3, now), false);
});

test("cộng ngày qua tháng/năm và hạn huỷ", () => {
  assert.equal(addDaysToDateString("2026-12-30", 3), "2027-01-02");
  assert.equal(addDaysToDateString("2026-03-01", -1), "2026-02-28");
  assert.equal(daysBetweenDateStrings("2026-10-21", "2026-10-24"), 3);
  assert.equal(cancelDeadline("2026-11-10", 3), "2026-11-07");
  assert.equal(cancelDeadline(parseDateOnly("2026-01-02"), 3), "2025-12-30");
});

test("dateOnly và addHours", () => {
  assert.equal(dateOnly(parseDateOnly("2026-10-24")), "2026-10-24");
  const start = new Date("2026-10-21T00:00:00.000Z");
  assert.equal(addHours(start, 24).toISOString(), "2026-10-22T00:00:00.000Z");
});
