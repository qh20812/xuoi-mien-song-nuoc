/**
 * Test tích hợp cho scripts/expire-holds.mjs và scripts/reconcile-seats.mjs.
 * Chạy trên database test:
 *
 *   node --test scripts/tests/jobs.test.mjs
 *
 * Yêu cầu: TEST_DATABASE_URL trong .env và seed đã chạy trên DB test.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { PrismaClient } from "@prisma/client";

process.loadEnvFile(".env");
if (!process.env.TEST_DATABASE_URL) throw new Error("Thiếu TEST_DATABASE_URL trong .env");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const prisma = new PrismaClient({ log: ["error"] });
const TOKEN = () => randomUUID().replace(/-/g, "").slice(0, 24);
const PHONE = () => `08${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;

let departure;
let sequence = 0;

async function createOrder({ adults = 1, children = 0, infants = 0, status = "new", holdExpiresAt }) {
  sequence += 1;
  return prisma.order.create({
    data: {
      code: `TEST-${Date.now()}-${sequence}`,
      tourId: departure.tourId,
      departureId: departure.id,
      contactName: "Test Job",
      phone: PHONE(),
      adults,
      children,
      infants,
      unitPriceAdult: 1000000,
      unitPriceChild: 0,
      totalAmount: 1000000,
      status,
      holdExpiresAt,
      source: "web",
      lookupToken: TOKEN(),
      clientRequestId: randomUUID(),
    },
  });
}

function runScript(name, args = []) {
  const result = spawnSync(process.execPath, [`scripts/${name}`, ...args], {
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
  return {
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

async function currentDeparture() {
  return prisma.tourDeparture.findUniqueOrThrow({
    where: { id: departure.id },
    select: { seatsTaken: true },
  });
}

before(async () => {
  const tour = await prisma.tour.findFirstOrThrow({
    where: { code: "XMSN-4N3D" },
    select: { id: true },
  });
  const found = await prisma.tourDeparture.findFirstOrThrow({
    where: { tourId: tour.id, departureDate: { gte: new Date() } },
    orderBy: { departureDate: "asc" },
    select: { id: true, tourId: true },
  });
  departure = found;

  await prisma.order.deleteMany({ where: { departureId: departure.id } });
  await prisma.tourDeparture.update({
    where: { id: departure.id },
    data: { capacityTotal: 24, seatsTaken: 0 },
  });
});

after(async () => {
  await prisma.order.deleteMany({ where: { departureId: departure.id } });
  await prisma.tourDeparture.update({
    where: { id: departure.id },
    data: { capacityTotal: 24, seatsTaken: 0 },
  });
  await prisma.$disconnect();
});

test("expire-holds chỉ xử lý đơn new quá hạn, nhả chỗ đúng và idempotent", async () => {
  const past = new Date(Date.now() - 60 * 60 * 1000);
  const future = new Date(Date.now() + 60 * 60 * 1000);

  const expiredHold = await createOrder({ adults: 2, children: 1, infants: 1, holdExpiresAt: past });
  const activeHold = await createOrder({ adults: 1, holdExpiresAt: future });
  const pendingOrder = await createOrder({ adults: 3, status: "pending", holdExpiresAt: past });

  // 4 + 1 + 3 khách đang chiếm chỗ
  await prisma.tourDeparture.update({ where: { id: departure.id }, data: { seatsTaken: 8 } });

  const first = runScript("expire-holds.mjs");
  assert.equal(first.status, 0, first.output);
  assert.match(first.output, /hết hạn=1/);

  const rows = await prisma.order.findMany({
    where: { id: { in: [expiredHold.id, activeHold.id, pendingOrder.id] } },
    select: { id: true, status: true },
  });
  const statusById = new Map(rows.map((r) => [r.id, r.status]));
  assert.equal(statusById.get(expiredHold.id), "expired");
  assert.equal(statusById.get(activeHold.id), "new");
  assert.equal(statusById.get(pendingOrder.id), "pending");
  assert.equal((await currentDeparture()).seatsTaken, 4);

  const history = await prisma.orderStatusHistory.findFirst({
    where: { orderId: expiredHold.id, toStatus: "expired" },
  });
  assert.ok(history, "phải ghi lịch sử hết hạn");

  const second = runScript("expire-holds.mjs");
  assert.equal(second.status, 0, second.output);
  assert.match(second.output, /hết hạn=0/);
  assert.equal((await currentDeparture()).seatsTaken, 4, "không được nhả chỗ lần hai");
});

test("reconcile-seats phát hiện lệch, --fix sửa đúng", async () => {
  await prisma.tourDeparture.update({ where: { id: departure.id }, data: { seatsTaken: 9 } });

  const report = runScript("reconcile-seats.mjs");
  assert.equal(report.status, 1);
  assert.match(report.output, /lệch=1/);
  assert.equal((await currentDeparture()).seatsTaken, 9, "không sửa khi không có --fix");

  const fixed = runScript("reconcile-seats.mjs", ["--fix"]);
  assert.equal(fixed.status, 0, fixed.output);
  assert.match(fixed.output, /đã sửa=1/);
  assert.equal((await currentDeparture()).seatsTaken, 4);

  const again = runScript("reconcile-seats.mjs");
  assert.equal(again.status, 0, again.output);
  assert.match(again.output, /lệch=0/);
});
