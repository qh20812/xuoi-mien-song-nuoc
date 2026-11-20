/**
 * CLI: đối soát `seats_taken` với tổng khách của các đơn đang giữ chỗ
 * (status: new | pending | confirmed).
 *
 *   node --import tsx scripts/reconcile-seats.mts            # chỉ báo cáo
 *   node --import tsx scripts/reconcile-seats.mts --fix      # sửa seats_taken
 *   node --import tsx scripts/reconcile-seats.mts --all      # gồm cả ngày đã qua
 *
 * Mặc định chỉ xét các ngày khởi hành từ hôm nay (giờ VN) trở đi. Logic nằm ở
 * `server/jobs/reconcile-seats.ts` — cùng bản với cron route `/api/jobs/reconcile-seats`.
 */
process.loadEnvFile(".env");

const args = new Set(process.argv.slice(2));
const fix = args.has("--fix");
const all = args.has("--all");

const { reconcileSeats } = await import("@/server/jobs/reconcile-seats");
const { default: prisma } = await import("@/lib/prisma");

try {
  const result = await reconcileSeats({ fix, all });

  for (const item of result.items) {
    const label = `${item.tourCode} ${item.departureDate}`;

    if (item.overbooked) {
      console.log(
        `⚠ QUÁ SỨC CHỨA ${label}: khách=${item.expected}, sức chứa=${item.capacity}`,
      );
    }

    if (item.expected === item.actual) continue;

    console.log(
      `✗ ${label}: seats_taken=${item.actual}, đúng=${item.expected} ` +
        `(lệch ${item.actual - item.expected})`,
    );

    if (item.fixed) {
      console.log(`  → đã sửa thành ${item.expected}`);
    } else if (item.skipped) {
      console.log("  → bỏ qua: dữ liệu vừa thay đổi, chạy lại sau");
    }
  }

  console.log(
    `\nĐã kiểm tra ${result.checked} ngày khởi hành: lệch=${result.mismatches}, đã sửa=${result.fixed}, ` +
      `bỏ qua=${result.skipped}, quá sức chứa=${result.overbooked}, hold quá hạn chưa xử lý=${result.staleHolds}`,
  );

  if (result.staleHolds > 0) {
    console.log("⚠ Có hold quá hạn — chạy scripts/expire-holds.mts.");
  }

  if (result.overbooked > 0 || (result.mismatches > 0 && !fix) || result.skipped > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error("✗ reconcile-seats thất bại:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
