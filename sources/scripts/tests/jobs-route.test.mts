/**
 * E3 — cron route `/api/jobs/*` (auth bằng CRON_SECRET + gọi service thật).
 *
 *   node --import tsx --test scripts/tests/jobs-route.test.mts
 *
 * Test gọi `handle*Cron` thay vì `GET` vì `GET` có `await connection()` — hàm đó
 * chỉ chạy trong request context của Next, ngoài `node --test` sẽ ném lỗi.
 * Phần còn lại của route (auth → service → envelope) được kiểm đủ.
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

const { default: prisma } = await import("@/lib/prisma");
const { handleExpireHoldsCron } = await import("@/app/api/jobs/expire-holds/route");
const { handleReconcileSeatsCron, readFlag } = await import(
  "@/app/api/jobs/reconcile-seats/route"
);

const SECRET = "test-cron-secret";

let departure: { id: number; tourId: number };

function cronRequest(path: string, authorization?: string): Request {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request(`http://localhost:3000${path}`, { headers });
}

function authorized(path: string): Request {
  return cronRequest(path, `Bearer ${SECRET}`);
}

function phone(): string {
  return `09${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
}

async function createOrder(input: {
  adults?: number;
  children?: number;
  infants?: number;
  status?: "new" | "pending" | "confirmed";
  holdExpiresAt?: Date | null;
}): Promise<number> {
  const row = await prisma.order.create({
    data: {
      code: `CR-${Date.now()}-${randomUUID().slice(0, 3)}`,
      tourId: departure.tourId,
      departureId: departure.id,
      contactName: "Cron Route Test",
      phone: phone(),
      adults: input.adults ?? 1,
      children: input.children ?? 0,
      infants: input.infants ?? 0,
      unitPriceAdult: 1000000,
      unitPriceChild: 0,
      totalAmount: 1000000,
      status: input.status ?? "new",
      holdExpiresAt: input.holdExpiresAt ?? null,
      source: "web",
      lookupToken: randomUUID().replace(/-/g, "").slice(0, 24),
      clientRequestId: randomUUID(),
    },
    select: { id: true },
  });
  return row.id;
}

async function seatsTaken(): Promise<number> {
  const row = await prisma.tourDeparture.findUniqueOrThrow({
    where: { id: departure.id },
    select: { seatsTaken: true },
  });
  return row.seatsTaken;
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

  process.env.CRON_SECRET = SECRET;
});

after(async () => {
  await prisma.order.deleteMany({ where: { departureId: departure.id } });
  await prisma.tourDeparture.update({
    where: { id: departure.id },
    data: { capacityTotal: 24, seatsTaken: 0 },
  });
  delete process.env.CRON_SECRET;
  await prisma.$disconnect();
});

test("thiếu CRON_SECRET → 503, sai secret → 401, không đụng dữ liệu", async () => {
  const orderId = await createOrder({
    adults: 2,
    holdExpiresAt: new Date(Date.now() - 3_600_000),
  });
  await prisma.tourDeparture.update({
    where: { id: departure.id },
    data: { seatsTaken: 2 },
  });

  const saved = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;
  const disabled = await handleExpireHoldsCron(authorized("/api/jobs/expire-holds"));
  assert.equal(disabled.status, 503);
  const disabledBody = (await disabled.json()) as { error?: { code?: string } };
  assert.equal(disabledBody.error?.code, "CRON_DISABLED");
  process.env.CRON_SECRET = saved;

  const unauthorized = await handleExpireHoldsCron(
    cronRequest("/api/jobs/expire-holds", "Bearer wrong"),
  );
  assert.equal(unauthorized.status, 401);

  const missing = await handleExpireHoldsCron(cronRequest("/api/jobs/expire-holds"));
  assert.equal(missing.status, 401);

  const row = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { status: true },
  });
  assert.equal(row.status, "new");
  assert.equal(await seatsTaken(), 2);
});

test("expire-holds: 200 với secret, chuyển expired + nhả chỗ, idempotent", async () => {
  await prisma.order.deleteMany({ where: { departureId: departure.id } });
  await prisma.tourDeparture.update({
    where: { id: departure.id },
    data: { seatsTaken: 0 },
  });

  const orderId = await createOrder({
    adults: 2,
    children: 1,
    infants: 1,
    holdExpiresAt: new Date(Date.now() - 60_000),
  });
  await createOrder({
    adults: 1,
    holdExpiresAt: new Date(Date.now() + 60_000),
  });
  await createOrder({
    adults: 3,
    status: "pending",
    holdExpiresAt: new Date(Date.now() - 60_000),
  });
  await prisma.tourDeparture.update({
    where: { id: departure.id },
    data: { seatsTaken: 8 },
  });

  const response = await handleExpireHoldsCron(authorized("/api/jobs/expire-holds"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");

  const body = (await response.json()) as {
    ok: boolean;
    expired: number;
    skipped: number;
    seatsReleased: number;
    orders: { code: string; seats: number; status: string }[];
  };
  assert.equal(body.ok, true);
  assert.equal(body.expired, 1);
  assert.equal(body.skipped, 0);
  assert.equal(body.seatsReleased, 4);
  assert.equal(body.orders[0]?.seats, 4);

  const row = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { status: true },
  });
  assert.equal(row.status, "expired");
  assert.equal(await seatsTaken(), 4);

  const history = await prisma.orderStatusHistory.findFirstOrThrow({
    where: { orderId, toStatus: "expired" },
    select: { note: true },
  });
  assert.match(history.note ?? "", /sau \d+ giờ/);

  const again = await handleExpireHoldsCron(authorized("/api/jobs/expire-holds"));
  const againBody = (await again.json()) as { expired: number; skipped: number };
  assert.equal(againBody.expired, 0);
  assert.equal(againBody.skipped, 0);
  assert.equal(await seatsTaken(), 4);
});

test("reconcile-seats: mặc định chỉ báo cáo, ?fix=1 mới ghi", async () => {
  await prisma.tourDeparture.update({
    where: { id: departure.id },
    data: { seatsTaken: 9 },
  });

  const report = await handleReconcileSeatsCron(
    authorized("/api/jobs/reconcile-seats"),
  );
  assert.equal(report.status, 200);
  const reportBody = (await report.json()) as {
    ok: boolean;
    mismatches: number;
    fixed: number;
    items: { departureId: number; actual: number; expected: number; fixed: boolean }[];
  };
  assert.equal(reportBody.ok, true);
  assert.equal(reportBody.fixed, 0);
  const reported = reportBody.items.find((item) => item.departureId === departure.id);
  assert.ok(reported, "phải báo lệch cho ngày khởi hành của suite");
  assert.equal(reported.actual, 9);
  assert.equal(reported.expected, 4);
  assert.equal(await seatsTaken(), 9, "không được sửa khi thiếu ?fix=1");

  const fixedResponse = await handleReconcileSeatsCron(
    authorized("/api/jobs/reconcile-seats?fix=1"),
  );
  const fixedBody = (await fixedResponse.json()) as { fixed: number };
  assert.ok(fixedBody.fixed >= 1);
  assert.equal(await seatsTaken(), 4);
});

test("readFlag chỉ nhận giá trị bật", () => {
  const url = new URL("http://localhost/api/jobs/reconcile-seats?fix=1&all=no");
  assert.equal(readFlag(url, "fix"), true);
  assert.equal(readFlag(url, "all"), false);
  assert.equal(readFlag(url, "missing"), false);
  assert.equal(readFlag(new URL("http://localhost/x?fix=TRUE"), "fix"), true);
});
