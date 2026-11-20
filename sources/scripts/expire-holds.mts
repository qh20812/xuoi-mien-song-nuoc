/**
 * CLI: giải phóng chỗ của các đơn giữ chỗ đã quá hạn.
 *
 *   node --import tsx scripts/expire-holds.mts
 *
 * Tùy chọn:
 *   --dry-run          Chỉ liệt kê, không thay đổi dữ liệu
 *   --batch-size=100   Số đơn xử lý mỗi lượt (mặc định 100)
 *   --max=1000         Giới hạn tổng số đơn xử lý trong lần chạy (mặc định 1000)
 *
 * Logic nằm ở `server/jobs/expire-holds.ts` — cùng một bản với cron route
 * `/api/jobs/expire-holds` để CLI và Vercel không lệch nhau.
 */
process.loadEnvFile(".env");

const args = new Set(process.argv.slice(2));
const argValue = (name: string) =>
  [...args].find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1];

const { expireHolds, DEFAULT_MAX_ORDERS } = await import("@/server/jobs/expire-holds");
const { default: prisma } = await import("@/lib/prisma");

const dryRun = args.has("--dry-run");
const batchSize = Number(argValue("batch-size")) || undefined;
const maxOrders = Number(argValue("max")) || undefined;
const startedAt = Date.now();

try {
  const result = await expireHolds({ dryRun, batchSize, maxOrders });

  for (const order of result.orders) {
    if (dryRun) {
      console.log(
        `[dry-run] ${order.code} — ${order.seats} chỗ — hết hạn ${order.holdExpiresAt ?? "?"}`,
      );
    } else if (order.status === "expired") {
      console.log(`✓ ${order.code} hết hạn — nhả ${order.seats} chỗ`);
    } else {
      console.log(`- ${order.code} đã được xử lý bởi tiến trình khác`);
    }
  }

  console.log(
    `\n${dryRun ? "[dry-run] " : ""}Đã xét ${result.scanned} đơn: hết hạn=${result.expired}, bỏ qua=${result.skipped}, ` +
      `nhả=${result.seatsReleased} chỗ, còn lại=${result.remaining}, ${Date.now() - startedAt}ms`,
  );

  if (result.remaining > 0 && result.scanned >= (maxOrders ?? DEFAULT_MAX_ORDERS)) {
    console.log("⚠ Còn đơn quá hạn chưa xử lý — chạy lại script hoặc tăng --max.");
  }
} catch (error) {
  console.error("✗ expire-holds thất bại:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
