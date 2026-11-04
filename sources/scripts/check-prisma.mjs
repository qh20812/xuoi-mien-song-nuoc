/**
 * Smoke test Prisma Client: kết nối DB và đếm số bản ghi trong vài bảng.
 *
 * Chạy: node scripts/check-prisma.mjs
 */
import { PrismaClient } from "@prisma/client";

process.loadEnvFile(".env");

const prisma = new PrismaClient({ log: ["error"] });

try {
  const [version] = await prisma.$queryRaw`SELECT VERSION() AS version`;
  const [tours, departures, orders, reviews] = await Promise.all([
    prisma.tour.count(),
    prisma.tourDeparture.count(),
    prisma.order.count(),
    prisma.review.count(),
  ]);

  console.log("✓ Prisma Client kết nối thành công");
  console.log(`  MySQL   : ${version.version}`);
  console.log(`  tours   : ${tours}`);
  console.log(`  departures: ${departures}`);
  console.log(`  orders  : ${orders}`);
  console.log(`  reviews : ${reviews}`);
} catch (error) {
  console.error("✗ Prisma Client lỗi:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
