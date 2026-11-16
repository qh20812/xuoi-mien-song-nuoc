/**
 * T2 · Feature test cho catalog công khai (`server/catalog/*`).
 *
 * Tự tạo tour + chuyến riêng nên không phụ thuộc seed và không phụ thuộc ngày chạy.
 * Đây là test chặn tái phát blocker B1: UI lọc sai → `POST /api/orders` trả 404.
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

const { addDaysToDateString, todayVN } = await import("@/lib/time");
const {
  cleanupTour,
  createTestDeparture,
  createTestSettings,
  createTestTour,
  readBookingSettings,
  restoreBookingSettings,
} = await import("@/scripts/tests/helpers/factories");

const { default: prisma } = await import("@/lib/prisma");
const { listBookableTours } = await import(
  "@/server/catalog/list-bookable-tours"
);
const { getBookableDepartures } = await import(
  "@/server/catalog/get-bookable-departures"
);

const TODAY = todayVN();
const MIN_DAYS_AHEAD = 3;

let tourId = 0;
let tourSlug = "";
let draftTourId = 0;
let draftTourSlug = "";
let settingsBefore: Awaited<ReturnType<typeof readBookingSettings>> = null;

before(async () => {
  settingsBefore = await readBookingSettings(prisma);
  await createTestSettings(prisma, {
    minDaysAhead: MIN_DAYS_AHEAD,
    maxGuestsPerOrder: 20,
    holdHours: 24,
    cancelCutoffDays: 3,
  });

  const tour = await createTestTour(prisma);
  tourId = tour.id;
  tourSlug = tour.slug;

  // Quá sát ngày → loại
  await createTestDeparture(prisma, tourId, {
    daysFromToday: 1,
    capacityTotal: 24,
  });
  // Đúng biên minDaysAhead → nhận
  await createTestDeparture(prisma, tourId, {
    daysFromToday: MIN_DAYS_AHEAD,
    capacityTotal: 24,
  });
  // Hợp lệ → nhận
  await createTestDeparture(prisma, tourId, {
    daysFromToday: 7,
    capacityTotal: 24,
  });
  // Đã đầy → loại
  await createTestDeparture(prisma, tourId, {
    daysFromToday: 14,
    capacityTotal: 24,
    seatsTaken: 24,
  });

  // Tour chưa publish → không xuất hiện
  const draft = await createTestTour(prisma, { status: "draft" });
  draftTourId = draft.id;
  draftTourSlug = draft.slug;
  await createTestDeparture(prisma, draftTourId, {
    daysFromToday: 7,
    capacityTotal: 24,
  });
});

after(async () => {
  await cleanupTour(prisma, tourId);
  await cleanupTour(prisma, draftTourId);
  await restoreBookingSettings(prisma, settingsBefore);
  await prisma.$disconnect();
});

test("chỉ trả chuyến qua minDaysAhead và còn chỗ", async () => {
  const tours = await listBookableTours();
  const found = tours.find((item) => item.slug === tourSlug);

  assert.ok(found, "tour vừa tạo phải có trong danh sách");
  assert.deepEqual(
    found.departures.map((departure) => departure.date),
    [
      addDaysToDateString(TODAY, MIN_DAYS_AHEAD),
      addDaysToDateString(TODAY, 7),
    ],
  );
});

test("departureId trả về là ID thật trong tour_departures", async () => {
  const tours = await listBookableTours();
  const found = tours.find((item) => item.slug === tourSlug);
  assert.ok(found);

  const ids = found.departures.map((departure) => departure.id);
  const rows = await prisma.tourDeparture.findMany({
    where: { id: { in: ids } },
    select: { id: true, tourId: true },
  });

  assert.equal(rows.length, ids.length);
  assert.ok(rows.every((row) => row.tourId === tourId));
});

test("seatsRemaining = capacityTotal - seatsTaken, giá rơi về giá tour", async () => {
  const tours = await listBookableTours();
  const found = tours.find((item) => item.slug === tourSlug);
  assert.ok(found);

  const first = found.departures[0]!;
  assert.equal(first.seatsRemaining, 24);
  assert.equal(first.priceAdult, 4_190_000);
  assert.equal(first.priceChild, 2_930_000);
  assert.equal(first.meetingPoint, "Trung tâm TP.HCM (Quận 1)");
});

test("tour chưa publish không xuất hiện trong danh sách", async () => {
  const tours = await listBookableTours();

  assert.equal(
    tours.some((item) => item.slug === draftTourSlug),
    false,
    "tour draft không được lọt vào catalog",
  );
});

test("getBookableDepartures trả cùng bộ chuyến, slug lạ trả rỗng", async () => {
  const departures = await getBookableDepartures(tourSlug);

  assert.deepEqual(
    departures.map((departure) => departure.date),
    [
      addDaysToDateString(TODAY, MIN_DAYS_AHEAD),
      addDaysToDateString(TODAY, 7),
    ],
  );
  assert.deepEqual(await getBookableDepartures("khong-ton-tai"), []);
});
