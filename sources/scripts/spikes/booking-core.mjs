/**
 * Gate A — Spike kiểm chứng booking core trên database test.
 * Không dùng cho production.
 *
 *   node scripts/spikes/booking-core.mjs
 */
import { PrismaClient } from "@prisma/client";

process.loadEnvFile(".env");
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error("Thiếu TEST_DATABASE_URL trong .env");
process.env.DATABASE_URL = testUrl;

const prisma = new PrismaClient({ log: ["error"] });

const results = [];
const ok = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
};

const randomToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 24);

const yearVN = () =>
  Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date()));

let phoneSeq = 0;
const nextPhone = () => `09${String(10000000 + ++phoneSeq).slice(-8)}`;

async function allocateCode(tx) {
  const year = yearVN();
  await tx.$executeRaw`
    INSERT INTO booking_sequences (year, last_seq)
    VALUES (${year}, LAST_INSERT_ID(1))
    ON DUPLICATE KEY UPDATE last_seq = LAST_INSERT_ID(last_seq + 1)`;
  const [row] = await tx.$queryRaw`SELECT LAST_INSERT_ID() AS seq`;
  return { year, seq: Number(row.seq), code: `XMSN-${year}-${String(row.seq).padStart(4, "0")}` };
}

async function book(departure, { capacityCheck = true } = {}) {
  const started = performance.now();
  try {
    const order = await prisma.$transaction(
      async (tx) => {
        if (capacityCheck) {
          const affected = await tx.$executeRaw`
            UPDATE tour_departures
               SET seats_taken = seats_taken + 1
             WHERE id = ${departure.id}
               AND status = 'open'
               AND seats_taken + 1 <= capacity_total`;
          if (affected === 0) throw new Error("DEPARTURE_FULL");
        } else {
          await tx.$executeRaw`UPDATE tour_departures SET seats_taken = seats_taken + 1 WHERE id = ${departure.id}`;
        }

        const { code } = await allocateCode(tx);
        return tx.order.create({
          data: {
            code,
            tourId: departure.tourId,
            departureId: departure.id,
            contactName: "Spike Test",
            phone: nextPhone(),
            adults: 1,
            children: 0,
            unitPriceAdult: 1000000,
            unitPriceChild: 0,
            totalAmount: 1000000,
            status: "new",
            source: "web",
            lookupToken: randomToken(),
          },
          select: { id: true, code: true },
        });
      },
      { timeout: 15000, maxWait: 10000 },
    );
    return { ok: true, ms: performance.now() - started, order };
  } catch (error) {
    return { ok: false, ms: performance.now() - started, error: error.message };
  }
}

async function main() {
  console.log("→ Spike trên:", new URL(testUrl).pathname.slice(1));

  // 0. Độ trễ Aiven
  const pingTimes = [];
  for (let i = 0; i < 20; i++) {
    const t = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    pingTimes.push(performance.now() - t);
  }
  ok("Aiven latency", true, `p50=${percentile(pingTimes, 50).toFixed(1)}ms p95=${percentile(pingTimes, 95).toFixed(1)}ms`);

  const tour = await prisma.tour.findFirstOrThrow({
    where: { code: "XMSN-4N3D" },
    select: { id: true, basePriceAdult: true },
  });
  const departure = await prisma.tourDeparture.findFirstOrThrow({
    where: { tourId: tour.id },
    orderBy: { departureDate: "asc" },
    select: { id: true, tourId: true, departureDate: true },
  });

  // 1. 10 request tranh 1 chỗ cuối
  await prisma.order.deleteMany({ where: { departureId: departure.id } });
  await prisma.tourDeparture.update({
    where: { id: departure.id },
    data: { capacityTotal: 1, seatsTaken: 0 },
  });

  const race = await Promise.all(Array.from({ length: 10 }, () => book(departure)));
  const successes = race.filter((r) => r.ok);
  const fulls = race.filter((r) => !r.ok && r.error === "DEPARTURE_FULL");
  const otherErrors = race.filter((r) => !r.ok && r.error !== "DEPARTURE_FULL");
  const depAfterRace = await prisma.tourDeparture.findUniqueOrThrow({ where: { id: departure.id } });

  ok(
    "10 request tranh 1 chỗ",
    successes.length === 1 && fulls.length === 9 && otherErrors.length === 0 && depAfterRace.seatsTaken === 1,
    `thành công=${successes.length}, hết chỗ=${fulls.length}, lỗi khác=${otherErrors.length}, seats=${depAfterRace.seatsTaken}`,
  );

  // 2. 30 request song song — mã đơn duy nhất
  await prisma.order.deleteMany({ where: { departureId: departure.id } });
  await prisma.tourDeparture.update({
    where: { id: departure.id },
    data: { capacityTotal: 50, seatsTaken: 0 },
  });

  const burst = await Promise.all(Array.from({ length: 30 }, () => book(departure)));
  const burstOk = burst.filter((r) => r.ok);
  const codes = burstOk.map((r) => r.order.code);
  const uniqueCodes = new Set(codes).size;
  const depAfterBurst = await prisma.tourDeparture.findUniqueOrThrow({ where: { id: departure.id } });
  const times = burstOk.map((r) => r.ms);

  ok(
    "30 đơn song song",
    burstOk.length === 30 && uniqueCodes === 30 && depAfterBurst.seatsTaken === 30,
    `thành công=${burstOk.length}, mã duy nhất=${uniqueCodes}, seats=${depAfterBurst.seatsTaken}, ` +
      `p50=${percentile(times, 50).toFixed(0)}ms p95=${percentile(times, 95).toFixed(0)}ms`,
  );

  // 3. Huỷ 2 lần chỉ hoàn chỗ 1 lần
  const target = burstOk[0].order;
  const cancel = async () => {
    const affected = await prisma.$executeRaw`
      UPDATE orders SET status = 'cancelled', cancelled_at = NOW(3), cancel_reason = 'spike'
       WHERE id = ${target.id} AND status IN ('new', 'pending', 'confirmed')`;
    if (affected === 0) return false;
    await prisma.$executeRaw`
      UPDATE tour_departures SET seats_taken = GREATEST(seats_taken - 1, 0) WHERE id = ${departure.id}`;
    return true;
  };
  const firstCancel = await cancel();
  const secondCancel = await cancel();
  const depAfterCancel = await prisma.tourDeparture.findUniqueOrThrow({ where: { id: departure.id } });

  ok(
    "Huỷ 2 lần idempotent",
    firstCancel === true && secondCancel === false && depAfterCancel.seatsTaken === 29,
    `lần 1=${firstCancel}, lần 2=${secondCancel}, seats=${depAfterCancel.seatsTaken}`,
  );

  // 4. Expire chỉ nhả chỗ 1 lần
  const expireTarget = burstOk[1].order;
  const expire = async () => {
    const affected = await prisma.$executeRaw`
      UPDATE orders SET status = 'cancelled', cancel_reason = 'expired-spike'
       WHERE id = ${expireTarget.id} AND status = 'new' AND created_at < NOW(3)`;
    if (affected === 0) return false;
    await prisma.$executeRaw`
      UPDATE tour_departures SET seats_taken = GREATEST(seats_taken - 1, 0) WHERE id = ${departure.id}`;
    return true;
  };
  const firstExpire = await expire();
  const secondExpire = await expire();
  const depAfterExpire = await prisma.tourDeparture.findUniqueOrThrow({ where: { id: departure.id } });

  ok(
    "Expire idempotent",
    firstExpire === true && secondExpire === false && depAfterExpire.seatsTaken === 28,
    `lần 1=${firstExpire}, lần 2=${secondExpire}, seats=${depAfterExpire.seatsTaken}`,
  );

  // 5. Đối soát seats_taken
  const active = await prisma.order.aggregate({
    where: { departureId: departure.id, status: { in: ["new", "pending", "confirmed"] } },
    _sum: { adults: true, children: true },
  });
  const expected = (active._sum.adults ?? 0) + (active._sum.children ?? 0);
  ok(
    "Đối soát seats_taken",
    expected === depAfterExpire.seatsTaken,
    `orders=${expected}, seats_taken=${depAfterExpire.seatsTaken}`,
  );

  // 6. Timezone: 00:30 giờ VN vẫn là "hôm nay" theo lịch VN
  const vnDate = (d) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const now = new Date("2026-10-20T17:30:00Z"); // 00:30 ngày 21/10 giờ VN
  ok(
    "Ngày VN qua múi giờ",
    vnDate(now) === "2026-10-21" && now.toISOString().slice(0, 10) === "2026-10-20",
    `VN=${vnDate(now)}, UTC=${now.toISOString().slice(0, 10)}`,
  );

  // Dọn dữ liệu spike
  await prisma.order.deleteMany({ where: { departureId: departure.id } });
  await prisma.tourDeparture.update({ where: { id: departure.id }, data: { capacityTotal: 24, seatsTaken: 0 } });

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${failed.length === 0 ? "✓ Tất cả spike PASS" : `✗ ${failed.length} spike FAIL`}`);
  process.exitCode = failed.length === 0 ? 0 : 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
