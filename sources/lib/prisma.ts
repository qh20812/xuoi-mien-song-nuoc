import { PrismaClient } from "@prisma/client";

// Tránh tạo nhiều PrismaClient khi Next.js hot-reload ở môi trường dev.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Cảnh báo khi dev server vô tình trỏ vào database production.
 *
 * `npm run dev` đọc `DATABASE_URL` (production). Muốn dùng DB dev, chạy
 * `npm run dev:local` — script này override `DATABASE_URL` bằng
 * `DEV_DATABASE_URL` trước khi spawn Next.js.
 */
function warnIfUsingProductionDatabase() {
  if (process.env.NODE_ENV === "production") return;

  const url = process.env.DATABASE_URL;
  const productionDb = process.env.DB_NAME;
  if (!url || !productionDb) return;

  try {
    const database = new URL(url).pathname.replace(/^\//, "");
    if (database === productionDb) {
      console.warn(
        `[db] Đang dùng database PRODUCTION "${database}" trong môi trường dev. ` +
          "Chạy `npm run dev:local` để dùng DEV_DATABASE_URL.",
      );
    }
  } catch {
    // DATABASE_URL không phải URL hợp lệ — Prisma sẽ báo lỗi khi kết nối.
  }
}

warnIfUsingProductionDatabase();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
