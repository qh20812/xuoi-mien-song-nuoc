/**
 * Đối soát seats_taken của các ngày khởi hành với tổng số khách của các đơn
 * đang giữ chỗ (status: new | pending | confirmed).
 *
 *   node scripts/reconcile-seats.mjs            # chỉ báo cáo
 *   node scripts/reconcile-seats.mjs --fix      # sửa seats_taken
 *   node scripts/reconcile-seats.mjs --all      # gồm cả ngày đã qua
 *
 * Mặc định chỉ xét các ngày khởi hành từ hôm nay (giờ VN) trở đi.
 * Khi --fix, chỉ cập nhật nếu seats_taken vẫn đúng giá trị đã đọc — tránh
 * ghi đè một booking vừa phát sinh trong lúc đối soát.
 */
import { PrismaClient } from "@prisma/client";

process.loadEnvFile(".env");

const args = new Set(process.argv.slice(2));
const fix = args.has("--fix");
const all = args.has("--all");

const prisma = new PrismaClient({ log: ["error"] });

const ACTIVE = ["new", "pending", "confirmed"];

function todayVN() {
  // en-CA cho ra YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function main() {
  const today = todayVN();

  const departures = await prisma.tourDeparture.findMany({
    where: all ? {} : { departureDate: { gte: new Date(`${today}T00:00:00.000Z`) } },
    orderBy: { departureDate: "asc" },
    select: {
      id: true,
      departureDate: true,
      capacityTotal: true,
      seatsTaken: true,
      tour: { select: { code: true, name: true } },
    },
  });

  const sums = await prisma.order.groupBy({
    by: ["departureId"],
    where: {
      status: { in: ACTIVE },
      departureId: { in: departures.map((d) => d.id) },
    },
    _sum: { adults: true, children: true, infants: true },
  });
  const expectedByDeparture = new Map(
    sums.map((s) => [
      s.departureId,
      (s._sum.adults ?? 0) + (s._sum.children ?? 0) + (s._sum.infants ?? 0),
    ]),
  );

  let mismatches = 0;
  let fixed = 0;
  let skipped = 0;
  let overbooked = 0;

  for (const departure of departures) {
    const expected = expectedByDeparture.get(departure.id) ?? 0;
    const actual = departure.seatsTaken;

    if (expected > departure.capacityTotal) {
      overbooked += 1;
      console.log(
        `⚠ QUÁ SỨC CHỨA ${departure.tour.code} ${departure.departureDate.toISOString().slice(0, 10)}: ` +
          `khách=${expected}, sức chứa=${departure.capacityTotal}`,
      );
    }

    if (expected === actual) continue;

    mismatches += 1;
    const label = `${departure.tour.code} ${departure.departureDate.toISOString().slice(0, 10)}`;
    console.log(`✗ ${label}: seats_taken=${actual}, đúng=${expected} (lệch ${actual - expected})`);

    if (!fix) continue;

    const updated = await prisma.tourDeparture.updateMany({
      where: { id: departure.id, seatsTaken: actual },
      data: { seatsTaken: expected },
    });

    if (updated.count === 1) {
      fixed += 1;
      console.log(`  → đã sửa thành ${expected}`);
    } else {
      skipped += 1;
      console.log("  → bỏ qua: dữ liệu vừa thay đổi, chạy lại sau");
    }
  }

  const staleHolds = await prisma.order.count({
    where: { status: "new", holdExpiresAt: { lt: new Date() } },
  });

  console.log(
    `\nĐã kiểm tra ${departures.length} ngày khởi hành: lệch=${mismatches}, đã sửa=${fixed}, ` +
      `bỏ qua=${skipped}, quá sức chứa=${overbooked}, hold quá hạn chưa xử lý=${staleHolds}`,
  );

  if (staleHolds > 0) {
    console.log("⚠ Có hold quá hạn — chạy scripts/expire-holds.mjs.");
  }

  if (overbooked > 0 || (mismatches > 0 && !fix) || skipped > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("✗ reconcile-seats thất bại:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
