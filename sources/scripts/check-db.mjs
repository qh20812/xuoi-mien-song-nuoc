/**
 * Kiểm tra kết nối MySQL (Aiven) từ file .env.
 *
 * Chạy: node scripts/check-db.mjs
 * Thoát với mã 1 nếu không kết nối được.
 */
import { readFileSync, existsSync } from "node:fs";
import { createConnection } from "mysql2/promise";

process.loadEnvFile(".env");

const {
  DB_HOST,
  DB_PORT = "3306",
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_SSL = "false",
  DB_SSL_CA = "prisma/ca.pem",
} = process.env;

const missing = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"].filter(
  (key) => !process.env[key],
);

if (missing.length > 0) {
  console.error(`✗ Thiếu biến môi trường: ${missing.join(", ")}`);
  process.exit(1);
}

const useSsl = DB_SSL === "true";
const caPath = useSsl && existsSync(DB_SSL_CA) ? DB_SSL_CA : null;

async function connect(ssl) {
  return createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl,
    connectTimeout: 15_000,
  });
}

let connection;
let sslVerified = useSsl;

try {
  if (useSsl && caPath) {
    // Verify bằng CA riêng của Aiven (prisma/ca.pem).
    connection = await connect({
      ca: readFileSync(caPath),
      rejectUnauthorized: true,
    });
  } else if (useSsl) {
    try {
      // Không có CA local → thử CA hệ thống trước.
      connection = await connect({ rejectUnauthorized: true });
    } catch {
      sslVerified = false;
      console.warn("! Không verify được CA, thử lại với TLS không verify (chỉ dùng để kiểm tra)...");
      connection = await connect({ rejectUnauthorized: false });
    }
  } else {
    connection = await connect(undefined);
  }

  const [[version]] = await connection.query("SELECT VERSION() AS version");
  const [[db]] = await connection.query(
    "SELECT DATABASE() AS db, @@character_set_database AS charset, @@collation_database AS collation",
  );
  const [tables] = await connection.query(
    `SELECT TABLE_NAME, TABLE_COLLATION
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME`,
    [DB_NAME],
  );

  console.log("✓ Kết nối thành công");
  console.log(`  host      : ${DB_HOST}:${DB_PORT}`);
  console.log(`  user      : ${DB_USER}`);
  console.log(`  database  : ${db.db}`);
  console.log(`  charset   : ${db.charset} / ${db.collation}${db.charset === "utf8mb4" ? "" : "  ← nên là utf8mb4"}`);
  console.log(`  server    : MySQL ${version.version}`);
  console.log(`  TLS       : ${useSsl ? (sslVerified ? `bật (verify CA: ${caPath ?? "system"})` : "bật (chưa verify CA)") : "tắt"}`);
  console.log(`  bảng      : ${tables.length}`);
  for (const table of tables) {
    console.log(`    - ${table.TABLE_NAME} (${table.TABLE_COLLATION})`);
  }
} catch (error) {
  console.error("✗ Kết nối thất bại");
  console.error(`  code    : ${error.code ?? "n/a"}`);
  console.error(`  message : ${error.message}`);
  process.exitCode = 1;
} finally {
  await connection?.end();
}
