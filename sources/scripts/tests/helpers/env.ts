/**
 * Nạp biến môi trường cho các test cần database.
 *
 * Phải import **đầu tiên** trong file test, trước mọi `await import()` chạm tới
 * Prisma — `PrismaClient` đọc `DATABASE_URL` ngay lúc khởi tạo.
 *
 *   import "./helpers/env";
 *   const { default: prisma } = await import("@/lib/prisma");
 *
 * Không dùng cho `scripts/tests/unit/*`: các test đó phải chạy được trên repo
 * sạch (không cần `.env`, không cần MySQL).
 */
import process from "node:process";

process.loadEnvFile(".env");

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Thiếu TEST_DATABASE_URL trong .env");
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.AUTH_SECRET ??= "test-auth-secret-at-least-32-characters-long";
process.env.IP_HASH_SALT ??= "test-ip-salt";
