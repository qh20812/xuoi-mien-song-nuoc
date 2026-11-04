/**
 * Giải phóng chỗ của các đơn giữ chỗ đã quá hạn (holdExpiresAt < now).
 *
 * Chạy định kỳ (cron/systemd timer), ví dụ mỗi 5 phút:
 *   node scripts/expire-holds.mjs
 *
 * Tùy chọn:
 *   --dry-run          Chỉ liệt kê, không thay đổi dữ liệu
 *   --batch-size=100   Số đơn xử lý mỗi lượt (mặc định 100)
 *   --max=1000         Giới hạn tổng số đơn xử lý trong lần chạy (mặc định 1000)
 *
 * Nguyên tắc:
 * - Chỉ đơn status = "new" mới hết hạn tự động. Đơn admin đã chuyển sang
 *   pending/confirmed không bị huỷ.
 * - Mỗi đơn xử lý trong một transaction: UPDATE có điều kiện status = "new"
 *   (idempotent) + nhả chỗ + ghi lịch sử. Chạy song song nhiều tiến trình
 *   cũng không nhả chỗ hai lần.
 */
import { PrismaClient } from "@prisma/client";

process.loadEnvFile(".env");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const batchArg = [...args].find((a) => a.startsWith("--batch-size="));
const maxArg = [...args].find((a) => a.startsWith("--max="));
const batchSize = Math.min(500, Math.max(1, Number(batchArg?.split("=")[1]) || 100));
const maxOrders = Math.max(1, Number(maxArg?.split("=")[1]) || 1000);

const prisma = new PrismaClient({ log: ["error"] });

const startedAt = Date.now();

async function expireOne(order) {
  const seats = order.adults + order.children + order.infants;

  return prisma.$transaction(
    async (tx) => {
      const changed = await tx.$executeRaw`
        UPDATE orders
           SET status = 'expired',
               updated_at = NOW(3)
         WHERE id = ${order.id}
           AND status = 'new'
           AND hold_expires_at IS NOT NULL
           AND hold_expires_at < NOW(3)`;

      if (changed === 0) return "skipped";

      await tx.$executeRaw`
        UPDATE tour_departures
           SET seats_taken = GREATEST(CAST(seats_taken AS SIGNED) - ${seats}, 0)
         WHERE id = ${order.departureId}`;

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: "new",
          toStatus: "expired",
          note: "Tự động hết hạn giữ chỗ sau 24 giờ",
        },
      });

      return "expired";
    },
    { timeout: 15000, maxWait: 10000 },
  );
}

async function main() {
  let total = 0;
  let expired = 0;
  let skipped = 0;
  let seatsReleased = 0;

  while (total < maxOrders) {
    const orders = await prisma.order.findMany({
      where: { status: "new", holdExpiresAt: { lt: new Date() } },
      orderBy: { holdExpiresAt: "asc" },
      take: Math.min(batchSize, maxOrders - total),
      select: {
        id: true,
        code: true,
        departureId: true,
        adults: true,
        children: true,
        infants: true,
        holdExpiresAt: true,
      },
    });

    if (orders.length === 0) break;

    for (const order of orders) {
      total += 1;
      const seats = order.adults + order.children + order.infants;

      if (dryRun) {
        console.log(
          `[dry-run] ${order.code} — ${seats} chỗ — hết hạn ${order.holdExpiresAt?.toISOString()}`,
        );
        expired += 1;
        seatsReleased += seats;
        continue;
      }

      const result = await expireOne(order);
      if (result === "expired") {
        expired += 1;
        seatsReleased += seats;
        console.log(`✓ ${order.code} hết hạn — nhả ${seats} chỗ`);
      } else {
        skipped += 1;
        console.log(`- ${order.code} đã được xử lý bởi tiến trình khác`);
      }
    }

    if (dryRun) break;
    if (orders.length < batchSize) break;
  }

  const remaining = await prisma.order.count({
    where: { status: "new", holdExpiresAt: { lt: new Date() } },
  });

  console.log(
    `\n${dryRun ? "[dry-run] " : ""}Đã xét ${total} đơn: hết hạn=${expired}, bỏ qua=${skipped}, ` +
      `nhả=${seatsReleased} chỗ, còn lại=${remaining}, ${Date.now() - startedAt}ms`,
  );

  if (remaining > 0 && total >= maxOrders) {
    console.log("⚠ Còn đơn quá hạn chưa xử lý — chạy lại script hoặc tăng --max.");
  }
}

main()
  .catch((error) => {
    console.error("✗ expire-holds thất bại:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
