# Xuôi Miền Sông Nước

Website đặt tour **Sài Gòn – U Minh Hạ – Đất Mũi Cà Mau**: khách giữ chỗ trực tuyến
(không thanh toán online), tra cứu/huỷ đơn, xem tour – bài viết – FAQ – liên hệ; kèm
khu quản trị tối giản để xử lý đơn.

> Trạng thái: backend + mini admin đã hoàn chỉnh, build production và test đều pass.
> Giao diện phía khách (trang chủ, chi tiết tour, form đặt tour) sẽ được ghép vào các
> API đã có.

## Công nghệ

| Thành phần | Lựa chọn |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components) |
| Ngôn ngữ | TypeScript |
| ORM / DB | Prisma 6.19 + MySQL 8 (Aiven) |
| Auth admin | JWT HS256 trong cookie httpOnly (`jose`) + `bcryptjs` |
| Validate | Zod 3 |
| Styling | Tailwind CSS 4 |

## Tính năng

**Khách hàng**

- Xem tour, lịch khởi hành, điểm đến, ẩm thực, bài viết, FAQ.
- Đặt tour dạng **giữ chỗ**: không thanh toán online, đơn ở trạng thái `new` và giữ
  chỗ tối đa **24 giờ** (cấu hình trong bảng `settings`).
- Tra cứu đơn bằng **mã đơn + số điện thoại**; huỷ đơn khi còn **≥ 3 ngày** trước
  khởi hành.
- Gửi liên hệ (bảng `contact_messages`).

**Quản trị**

- Đăng nhập `/admin/login`, bảo vệ toàn bộ `/admin` bằng `proxy.ts`.
- Dashboard đếm đơn theo trạng thái, danh sách đơn (lọc trạng thái / tìm mã, SĐT, tên).
- Chi tiết đơn: khách, tour, hành khách, chi phí, lịch sử trạng thái.
- Thao tác: `pending` (đã liên hệ) → `confirm` (xác nhận, bỏ hạn giữ chỗ) →
  `complete`; huỷ đơn (admin được phép huỷ cả khi quá hạn).
- Mọi thao tác ghi `order_status_history` + `admin_audit_logs`.

## Cấu trúc chính

```
app/
  api/orders/…           đặt chỗ, tra cứu, huỷ (public)
  api/admin/…            login/logout/me, danh sách & cập nhật đơn
  admin/login/           trang đăng nhập
  admin/(dashboard)/     dashboard, danh sách đơn, chi tiết đơn + server actions
lib/
  auth/                  JWT cookie, session, sanitize `next`
  validation/order.ts    schema đầu vào public API
  settings.ts            cấu hình đặt tour (đọc bảng settings)
  time.ts                ngày/giờ theo múi giờ VN
  rate-limit.ts          rate limit trong bộ nhớ
server/
  booking/               create / lookup / cancel / admin update + DTO
  auth/authenticate.ts   xác thực admin dùng chung
prisma/
  schema.prisma          schema (22 model)
  migrations/            migration đã áp dụng
  seed.mjs               seed dữ liệu thật (idempotent)
scripts/
  with-db.mjs            chạy lệnh với DB dev / test / prod
  expire-holds.mjs       job tự huỷ đơn giữ chỗ quá hạn
  reconcile-seats.mjs    job đối soát seats_taken
  tests/                 integration tests
```

## Bắt đầu

```bash
cp .env.example .env      # điền DB, AUTH_SECRET, IP_HASH_SALT
npm install
npx prisma migrate deploy # áp migration
npm run db:seed           # seed dữ liệu thật (idempotent)
npm run dev               # http://localhost:3000
```

Kiểm tra:

```bash
npm run build
npm test
npx tsc --noEmit
npm run lint
```

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Chuỗi Prisma tới MySQL production |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | ✅ | Dùng cho `npm run db:check` (verify CA) |
| `DB_SSL` / `DB_SSL_CA` | ✅ | Aiven yêu cầu TLS; CA ở `prisma/ca.pem` |
| `AUTH_SECRET` | ✅ | Khoá ký JWT admin, **≥ 32 ký tự** |
| `IP_HASH_SALT` | ✅ (khuyến nghị) | Muối băm IP khách; fallback `AUTH_SECRET` |
| `DEV_DATABASE_URL` | tuỳ chọn | DB dev cho `with-db.mjs` |
| `TEST_DATABASE_URL` | tuỳ chọn | DB test cho integration tests |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | tuỳ chọn | Tài khoản admin tạo lần đầu khi seed |
| `SEED_ALLOW_PROD` | tuỳ chọn | Cho phép seed khi `NODE_ENV=production` |
| `SEED_FORCE_SETTINGS` | tuỳ chọn | Ghi đè nhóm settings khi seed lại |
| `NEXT_BUILD_CPUS` | tuỳ chọn (build) | Số worker khi `next build`; Dockerfile mặc định `2` |
| `CLOUDINARY_URL` | chưa dùng | Dành cho upload ảnh sau này |

Sinh khoá:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Môi trường dev / test / prod

Mặc định mọi lệnh Prisma/seed đọc `DATABASE_URL`. Để tránh sửa nhầm production,
dùng `scripts/with-db.mjs` — script nạp `.env` rồi ghi đè `DATABASE_URL` bằng
`DEV_DATABASE_URL` hoặc `TEST_DATABASE_URL`:

```bash
node scripts/with-db.mjs dev  npx prisma migrate deploy
node scripts/with-db.mjs dev  node prisma/seed.mjs
node scripts/with-db.mjs test npx prisma migrate deploy
node scripts/with-db.mjs test node prisma/seed.mjs
node scripts/with-db.mjs prod npx prisma migrate deploy
```

Hoặc dùng npm scripts:

```bash
npm run db:migrate:dev
npm run db:seed:dev
npm run db:verify:dev
npm run db:migrate:test
npm run db:seed:test
npm run db:verify:test
```

> `with-db.mjs` dựa trên đặc điểm `process.loadEnvFile()` **không ghi đè** biến đã có
> trong môi trường. Vì vậy biến do script gán luôn thắng giá trị trong `.env`.

## Scripts

| Lệnh | Việc |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` | ESLint |
| `npm test` | Toàn bộ test (time, booking, admin, jobs) |
| `npm run test:booking` / `test:admin` / `test:jobs` | Test từng nhóm |
| `npm run db:check` | Kết nối MySQL + verify CA bằng `mysql2` |
| `npm run db:check:prisma` | Kiểm tra Prisma Client |
| `npm run db:migrate` | `prisma migrate dev` (chỉ dev) |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:seed` | Seed (idempotent) |
| `npm run db:studio` | Prisma Studio |
| `npm run jobs:expire` | Huỷ đơn giữ chỗ quá hạn và nhả chỗ (chạy thật; thêm `-- --dry-run` để xem trước) |
| `npm run jobs:reconcile` | Đối soát chỗ (chỉ báo cáo; thêm `-- --fix` để sửa) |

## API

### Public

| Method | Đường dẫn | Ghi chú |
| --- | --- | --- |
| `POST` | `/api/orders` | Giữ chỗ. Rate limit 5 req / 10 phút / IP |
| `POST` | `/api/orders/lookup` | `{ code, phone }`. Lỗi chung khi không khớp. 15 req / 10 phút |
| `POST` | `/api/orders/cancel` | `{ code, phone, reason? }`. Chỉ khi còn ≥ 3 ngày |

`POST /api/orders` nhận:

```jsonc
{
  "departureId": 12,
  "contactName": "Nguyễn Văn A",
  "phone": "0901234567",
  "email": "a@example.com",          // optional
  "pickupPoint": "Quận 1",            // optional
  "customerNote": "…",                // optional
  "adults": 2,
  "children": 1,
  "infants": 0,
  "clientRequestId": "uuid-v4",       // idempotency key
  "passengers": [                     // optional, nếu gửi phải đủ số khách
    { "fullName": "…", "type": "adult", "birthYear": 1990, "note": "…" }
  ]
}
```

Giá **không** nhận từ client. Server đọc `tour_departures` + `tours` và snapshot
`unit_price_adult`, `unit_price_child`, `surcharge`, `total_amount` vào đơn.

### Admin (cần cookie `xmsn_admin`)

| Method | Đường dẫn | Ghi chú |
| --- | --- | --- |
| `POST` | `/api/admin/login` | `{ email, password }`; 8 lần / 15 phút / IP và / email |
| `POST` | `/api/admin/logout` | Xoá cookie |
| `GET` | `/api/admin/me` | Phiên hiện tại |
| `GET` | `/api/admin/orders?status=&q=&page=` | Danh sách + phân trang |
| `GET` | `/api/admin/orders/:id` | Chi tiết |
| `PATCH` | `/api/admin/orders/:id` | `{ action: "pending" \| "confirm" \| "complete" \| "cancel", reason? }` |

## Trạng thái đơn

```
new ──pending──▶ pending ──confirm──▶ confirmed ──complete──▶ completed
 │                  │                     │
 └──────cancel──────┴────────cancel───────┘─▶ cancelled
 │
 └──(quá 24h, job)──▶ expired
```

- Chỉ đơn `new` mới bị job tự huỷ khi quá hạn giữ chỗ. Đơn admin đã chuyển
  `pending`/`confirmed` **không** bị tự huỷ.
- `completed` và `cancelled` là trạng thái cuối.
- Huỷ đơn (khách hoặc admin) nhả chỗ: `seats_taken = GREATEST(seats_taken - n, 0)`.

## Nghiệp vụ quan trọng

- **Mọi khách đều chiếm chỗ**: `seats = adults + children + infants`. Em bé miễn phí
  nhưng vẫn tính chỗ.
- **Giữ chỗ nguyên tử**: một câu `UPDATE tour_departures SET seats_taken = seats_taken + n
  WHERE id = ? AND status = 'open' AND seats_taken + n <= capacity_total`; kiểm tra
  số dòng bị ảnh hưởng. Transaction `ReadCommitted`, timeout 20s, retry `P2034`.
- **Mã đơn** cấp trong cùng transaction qua `booking_sequences` +
  `LAST_INSERT_ID()` → `XMSN-YYYY-NNNN`.
- **Idempotency**: `orders.client_request_id` unique; gửi lại cùng
  `clientRequestId` trả về đơn cũ, không giữ thêm chỗ.
- **Hạn huỷ khách**: `departureDate - todayVN >= cancelCutoffDays` (mặc định 3).
  Admin được override.
- **Phụ thu lễ**: áp cho mỗi người lớn + trẻ em, không áp cho em bé.
- **Bảo vệ dữ liệu**: không lưu IP thô — chỉ `ip_hash`; tra cứu sai trả cùng một
  thông báo để tránh dò mã đơn.

## Job định kỳ

Backend giả định job chạy ngoài tiến trình Next.js. Trên VPS dùng systemd timer
(hoặc cron):

```ini
# /etc/systemd/system/xmsn-expire.service
[Unit]
Description=Xuoi Mien Song Nuoc - expire booking holds

[Service]
Type=oneshot
WorkingDirectory=/srv/xmsn
EnvironmentFile=/srv/xmsn/.env
ExecStart=/usr/bin/node scripts/expire-holds.mjs
```

```ini
# /etc/systemd/system/xmsn-expire.timer
[Unit]
Description=Run expire-holds every 5 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
Unit=xmsn-expire.service

[Install]
WantedBy=timers.target
```

```bash
systemctl daemon-reload
systemctl enable --now xmsn-expire.timer
```

Đối soát chỗ nên chạy 1 lần/ngày (báo cáo) và bật `--fix` khi cần:

```bash
node scripts/reconcile-seats.mjs
node scripts/reconcile-seats.mjs --fix
```

Với Docker: `docker compose exec -T app node scripts/expire-holds.mjs`.

## Triển khai (VPS / Docker)

Repo có sẵn `Dockerfile` (multi-stage, `node:22-bookworm-slim`) và
`docker-compose.yml`. `Dockerfile` đặt `NEXT_BUILD_CPUS=2` cho builder để vừa RAM
trên VPS nhỏ; có thể tăng khi build:

```bash
docker compose build --build-arg NEXT_BUILD_CPUS=4
```

```bash
# 1. Chuẩn bị .env trên VPS (DATABASE_URL, AUTH_SECRET, IP_HASH_SALT…)

# 2. Build + chạy migration
docker compose build
docker compose run --rm migrate

# 3. Chạy app
docker compose up -d app

# 4. Job định kỳ (systemd timer gọi)
docker compose exec -T app node scripts/expire-holds.mjs
```

Lưu ý production:

- `AUTH_SECRET` phải mới và **≥ 32 ký tự**; không dùng giá trị mẫu.
- Cookie admin tự bật `Secure` khi `NODE_ENV=production` → chạy sau HTTPS
  (reverse proxy Caddy/Nginx + TLS).
- Trên Linux có thể đổi `sslaccept=accept_invalid_certs` thành `sslaccept=strict`
  để verify CA Aiven đầy đủ (`prisma/ca.pem`).
- Chạy `prisma migrate deploy` trước khi start phiên bản mới.

## Seed và an toàn dữ liệu

- Seed **idempotent**: chạy lại không nhân đôi tour/điểm đến/bài viết; không tạo
  đơn, không tạo review, không gán `seats_taken` giả.
- Admin chỉ được **tạo nếu email chưa tồn tại** — chạy lại seed **không reset mật
  khẩu**.
- Seed từ chối chạy khi `NODE_ENV=production`, trừ khi đặt `SEED_ALLOW_PROD=1`.
- Settings chỉ được ghi đè khi đặt `SEED_FORCE_SETTINGS=1`.
- Toạ độ lấy từ Wikidata/OpenStreetMap, khoảng cách từ OSRM, giá tham khảo từ site
  chính thức, ảnh từ Wikimedia Commons.

### Việc phải làm trước go-live

1. Đổi mật khẩu admin mặc định (`admin@xuoiemiensongnuoc.vn` / `Xmsn@2026`).
2. Thay hotline/Zalo placeholder trong bảng `settings`
   (`0900 000 000` / `0900000000`).
3. Đặt `AUTH_SECRET`, `IP_HASH_SALT` thật; bật HTTPS.
4. Cấu hình systemd timer cho `expire-holds` (5 phút) và `reconcile-seats` (1 ngày).
5. Kiểm tra `nha-tho-tac-say` chưa có toạ độ (`lat/lng = null`) nếu hiển thị bản đồ.

## Ghi chú Next.js 16 (Cache Components)

`next.config.ts` bật `cacheComponents: true`. Vì vậy:

- Route handler **không được** khai báo `export const runtime` hoặc
  `export const dynamic` (build sẽ báo lỗi). GET handler cần dữ liệu request-time
  thì gọi `await connection()` từ `next/server`.
- Trang admin đọc `cookies()` / `searchParams`; đặt `export const instant = false`
  ở `app/admin/layout.tsx` để cho phép blocking khi điều hướng.
- Trang public đọc dữ liệu tĩnh nên vẫn prerender bình thường.

## Kiểm thử

```bash
npm test
```

- `scripts/tests/time.test.ts` — logic ngày giờ VN, hạn huỷ.
- `scripts/tests/booking.test.mts` — tạo đơn, idempotency, tranh chỗ đồng thời,
  tra cứu, huỷ, quá hạn.
- `scripts/tests/admin.test.mts` — JWT, đăng nhập (route handler thật), proxy guard,
  chuyển trạng thái, audit, rate limit.
- `scripts/tests/jobs.test.mjs` — `expire-holds`, `reconcile-seats`.

Test dùng `TEST_DATABASE_URL`; mỗi file chạy trong process riêng của Node test
runner.

## Ghi chú vận hành

- Rate limit lưu **trong bộ nhớ** — phù hợp 1 instance. Nếu chạy nhiều instance,
  thay bằng Redis.
- `settings.booking` điều khiển `minDaysAhead`, `maxGuestsPerOrder`, `holdHours`,
  `cancelCutoffDays`; giá trị ngoài khoảng sẽ bị kẹp về mặc định an toàn.
- `package.json#prisma` đã deprecated ở Prisma 6; trước khi lên Prisma 7 cần chuyển
  sang `prisma.config.ts`.
