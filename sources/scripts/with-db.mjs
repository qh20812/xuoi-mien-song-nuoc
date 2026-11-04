/**
 * Chạy lệnh với database chỉ định.
 *
 *   node scripts/with-db.mjs test prisma migrate deploy
 *   node scripts/with-db.mjs dev  node prisma/seed.mjs
 *
 * Target: dev | test | prod
 * Lưu ý: prod chỉ nên dùng cho `prisma migrate deploy`, không dùng `migrate dev`.
 */
import { spawnSync } from "node:child_process";

process.loadEnvFile(".env");

const target = process.argv[2];
const command = process.argv.slice(3);

const envKey = { dev: "DEV_DATABASE_URL", test: "TEST_DATABASE_URL", prod: "DATABASE_URL" }[target];

if (!envKey) {
  console.error("Target không hợp lệ. Dùng: dev | test | prod");
  process.exit(1);
}

const url = process.env[envKey];
if (!url) {
  console.error(`Thiếu ${envKey} trong .env`);
  process.exit(1);
}

if (command.length === 0) {
  console.error("Thiếu lệnh cần chạy.");
  process.exit(1);
}

console.log(`→ [${target}] ${command.join(" ")}`);

const result = spawnSync(command[0], command.slice(1), {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
