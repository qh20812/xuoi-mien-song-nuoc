# PLAN.md — Build backend & Test

> Tài liệu thực thi cho việc nối backend và kiểm thử dự án **Xuôi Miền Sông Nước**.
> Mọi đường dẫn tính từ `sources/` trừ khi ghi rõ.
> Cập nhật checkbox ở §8 khi hoàn thành từng task để plan không bị trôi.

---

## 0. Bối cảnh & quyết định đã chốt

### Hiện trạng

- Frontend đã đạt ~95% `sources/DESIGN.md`, `tsc` + `lint` + `build` đều pass.
- Backend (`server/booking/`, `app/api/`) đã hoàn chỉnh và có test integration.
- **Nhưng 3 luồng khách hàng vẫn là mock**, đơn đặt trên web không tồn tại trong MySQL.
- Site public (`app/(site)/**`) đọc 100% từ `lib/fixtures/*`, không chạm database.

### Blocker nghiêm trọng

`lib/fixtures/tour-details.ts` hardcode ID chuyến đi (`4101`, `4102`, `3201`, …) trong khi
`tour_departures.id` là `@default(autoincrement)` bắt đầu từ `1`.
`createOrder()` tra `findUnique({ id: input.departureId })` → không thấy → ném
`DEPARTURE_NOT_FOUND` (404).

→ **Không thể chỉ "thay mock bằng fetch".** Phải cho UI đọc chuyến đi thật từ DB trước (B1).

Ngoài ra ngày khởi hành trong fixture là tĩnh (`2026-11-07`), còn seed sinh ngày theo
`nextWeekday()` tính từ hôm nay → ngày cũng lệch.

### Quyết định đã chốt

| # | Quyết định |
|---|---|
| 1 | **Mô hình:** Modular Monolith — Layered. 1 process Next.js, REST route handler là transport, Server Actions chỉ cho form admin, Prisma chỉ trong `server/` |
| 2 | **Test:** đủ 4 tầng — unit / feature-API / contract / full-flow |
| 3 | **Fixture:** tự tạo riêng trong `before()`, xoá trong `after()`. Không phụ thuộc seed hay ngày chạy |
| 4 | **Coverage:** có gate, 2 lệnh riêng (unit chặt, full rộng), ngưỡng đo baseline rồi khoá |
| 5 | **Thứ tự:** build backend trước (B0→B6), test sau (T0→T4) |

### Bằng chứng đã kiểm chứng trên repo

```
npx tsc --noEmit  → pass
npm run lint      → pass
npm run build     → pass
```

Coverage gate hoạt động (Node 26 + tsx):

```
--experimental-test-coverage --test-coverage-lines=99
→ ℹ Error: 97.85% line coverage does not meet threshold of 99%.  EXIT=1
```

`--test-coverage-include-all` tính cả file chưa từng load (0%), nên gate phản ánh trung thực.

---

## 1. Nguyên tắc chung

### Cổng chất lượng — bắt buộc qua trước khi sang phase kế

```sh
cd sources
npx tsc --noEmit && npm run lint && npm run build
```

Cộng thêm **smoke test tay** theo cột "Done khi" của từng phase.

### Ranh giới layer

```
Transport      app/api/**/route.ts  ·  app/admin/**/actions.ts
                 ↓  (zod parse, rate limit, auth, map lỗi)
Application    server/<domain>/*.ts      ← toàn bộ nghiệp vụ
                 ↓
Data           Prisma (CHỈ trong server/)
                 ↕
Shared         lib/contracts (DTO) · lib/time · lib/http · lib/rate-limit
```

**Quy tắc cứng:**

- Không import `@/lib/prisma` trong `app/` hoặc `components/` (hiện tại: 0 vi phạm, phải giữ).
- Không trả Prisma model ra ngoài — luôn map qua DTO trong `server/<domain>/dto.ts`.
- Route handler không chứa logic nghiệp vụ; server action cũng không.

### Quy ước response

```jsonc
// thành công
{ "ok": true, "order": { … } }
// lỗi
{ "ok": false, "error": { "code": "DEPARTURE_FULL", "message": "…", "details": { … } } }
```

---

## 2. TRACK A — Build backend (làm trước)

### B0 · Foundation

| | |
|---|---|
| **Mục tiêu** | Chuẩn hoá lỗi, HTTP client, tách ranh giới `lib`/`server` |
| **Tạo mới** | `server/errors.ts` (`AppError`) · `lib/api/client.ts` · `server/settings/get-booking-settings.ts` |
| **Sửa** | `server/booking/errors.ts` (extends `AppError`) · `lib/http.ts` (bắt `AppError` thay `BookingError`) · `lib/settings.ts` (bỏ Prisma, giữ type + default + hàm clamp thuần) · cập nhật import ở `server/booking/*` |
| **Lý do** | `lib/http.ts` (cross-cutting) đang import `BookingError` từ `server/booking/` — sai hướng phụ thuộc; domain `contact`/`catalog` sẽ không dùng được |
| **Done khi** | `tsc/lint/build` xanh, **không đổi hành vi** — `npm test` cũ vẫn pass nguyên |

---

### B1 · Catalog — đọc tour/chuyến thật từ DB

| | |
|---|---|
| **Mục tiêu** | Xoá blocker `DEPARTURE_NOT_FOUND`; UI dùng ID chuyến thật |
| **Tạo mới** | `server/catalog/is-bookable.ts` (**hàm thuần, testable không cần DB**) · `server/catalog/list-bookable-tours.ts` · `server/catalog/get-bookable-departures.ts` |
| **Sửa** | `app/(site)/dat-tour/page.tsx` · `app/(site)/tour/[slug]/page.tsx` · `components/booking/booking-wizard.tsx` (empty state) |

**Điều kiện một chuyến được coi là đặt được:**

- `departure.status === "open"`
- `tour.status === "published"`
- `departure.seatsTaken < departure.capacityTotal`
- `departureDate >= todayVN() + settings.booking.minDaysAhead`

**Map sang contract có sẵn:**

```ts
id: departure.id                                  // ID THẬT từ DB
date: dateOnly(departure.departureDate)           // "YYYY-MM-DD"
seatsRemaining: capacityTotal - seatsTaken
priceAdult: departure.priceAdult ?? tour.basePriceAdult
priceChild: departure.priceChild ?? tour.basePriceChild
coverImage: { src: tour.coverImageUrl, alt: tour.name }
```

> URL ảnh trong seed là `upload.wikimedia.org` → đã có trong `next.config.ts#images.remotePatterns`.

| | |
|---|---|
| **Bẫy** | `components/booking/booking-wizard.tsx` có `tours[0]!` và `tours[0]!.departures[0]` → crash nếu DB rỗng. Đã xử lý bằng cách chặn ở `dat-tour/page.tsx` trước khi render wizard (`tours.some(t => t.departures.length > 0)`), giữ nguyên invariant `tours.length >= 1` bên trong wizard |
| **Done khi** | `/dat-tour` render ID thật · `/tour/[slug]` hiện ngày/giá/chỗ khớp DB · DB rỗng → "Chưa có lịch khởi hành", không crash |

> **Hệ quả render:** `/tour/[slug]` chuyển từ `◐` (partial prerender) sang `ƒ` (dynamic)
> vì đọc DB mỗi request. Đã build pass; chấp nhận được với traffic nhỏ. `/dat-tour` vốn
> đã `ƒ` nên không đổi.

---

### B2 · Booking create

| | |
|---|---|
| **Mục tiêu** | Form đặt tour ghi đơn thật vào MySQL |
| **Sửa** | `lib/booking/submit.ts` → `POST /api/orders` · `lib/booking/success.ts` (mapper DTO → success) · `lib/validation/order.ts` (nhận `email: null`) · `components/booking/booking-wizard.tsx` · `components/booking/booking-success.tsx` |

**Đổi signature** (bỏ `holdHours` — server quyết định, client không tự tính hạn giữ chỗ):

```ts
submitBookingRequest(input: BookingRequestInput): Promise<OrderDto>
```

**Success screen phải lấy từ response server, không từ state local:**

| Trường | Hiện tại (sai) | Sau khi sửa |
|---|---|---|
| `totalAmount` | `preview.total` (client tính) | `order.pricing.totalAmount` |
| `holdExpiresAt` | `Date.now() + holdHours` | `order.holdExpiresAt` |
| `cancellationDeadline` | `cancelDeadline()` client | `order.cancellation.deadline` |
| `canCancel` | `isAtLeastDaysAhead()` client | `order.cancellation.canCancel` |
| `statusLabel` | hardcode "Chờ xác nhận" | `order.statusLabel` |

> Đây là yêu cầu `DESIGN.md §7.4`: tổng tiền chỉ đọc, server quyết định, không tự sửa im lặng.

**Error map** — hiện `catch {}` nuốt mọi lỗi thành một câu chung:

| `error.code` | Thông báo UI |
|---|---|
| `DEPARTURE_FULL` | Chuyến đã hết chỗ |
| `DEPARTURE_TOO_SOON` | Chuyến khởi hành quá gần |
| `DEPARTURE_CLOSED` | Chuyến đã đóng |
| `DEPARTURE_NOT_FOUND` | Không tìm thấy ngày khởi hành |
| `RATE_LIMITED` | Bạn thao tác quá nhanh, thử lại sau ít phút |
| `INVALID_INPUT` | Hiện `details.fields[].message` |

| | |
|---|---|
| **Chặn** | `sources/.env` đang trỏ Aiven **production**. Phải chuyển sang DB dev trước phase này |
| **Done khi** | Đặt 1 đơn → `SELECT * FROM orders` có row, mã đúng `XMSN-YYYY-NNNN`, `seats_taken` tăng đúng |

> **Bug tích hợp phát hiện khi smoke test (đã sửa):** client gửi `email: null` cho trường
> không bắt buộc, nhưng `optionalEmail` trong `lib/validation/order.ts` chỉ chấp nhận
> `undefined`/chuỗi → server trả `400 INVALID_INPUT` cho **mọi** đơn không nhập email.
> Đã cho `optionalEmail` nhận `null`. T3 phải có case này.
>
> `BookingSuccessData.holdExpiresAt` đổi thành `string | null` vì `PublicOrder` cho phép
> null (đơn đã huỷ/hết hạn); `booking-success.tsx` chỉ render khối đếm ngược khi có giá trị.
>
> Mapper `orderDtoToBookingSuccess()` nằm ở `lib/booking/success.ts` — đây là hàm T3 kiểm tra.

---

### B3 · Lookup / Cancel

| | |
|---|---|
| **Mục tiêu** | Tra cứu và huỷ đơn thật |
| **Sửa** | `lib/orders/client.ts` → `POST /api/orders/lookup` + `POST /api/orders/cancel` |
| **Xoá** | `lib/fixtures/order.ts` (chỉ `lib/orders/client.ts` import) |
| **Giữ nguyên** | `OrderApiError(message, status, code)` để `components/lookup/order-lookup.tsx` không phải sửa |

> Thuận lợi: `server/booking/dto.ts#toOrderDto` **đã trả đúng shape `PublicOrder`** từng field,
> kể cả `alreadyCancelled`. Chỉ cần bọc fetch.

| | |
|---|---|
| **Done khi** | Tra cứu đơn tạo ở B2 ra đúng · huỷ → `seats_taken` giảm · `/admin` thấy `cancelled` |

> **Đã kiểm chứng trên DB dev:** tạo đơn 2 người lớn + 1 em bé → `seatsTaken` 0 → 3;
> lookup đúng trả `new`/3 chỗ; sai SĐT **và** mã không tồn tại trả **cùng** message
> `404 ORDER_NOT_FOUND` (chống dò đơn); huỷ → `cancelled`, `cancelReason` được ghi,
> `seatsTaken` về 0; huỷ lần 2 trả `alreadyCancelled: true`; `order_status_history` có 2 dòng.
>
> `OrderApiError` chỉ map từ `ApiError` (giữ `message` server trả) nên UI không phải sửa.
> `lib/fixtures/order.ts` đã xoá — không còn mã đơn giả `XMSN-2026-0001` lộ ra UI.

---

### B4 · Contact

| | |
|---|---|
| **Mục tiêu** | Form liên hệ lưu vào `contact_messages` |
| **Tạo mới** | `lib/validation/contact.ts` (zod, tái dùng `normalizePhone`) · `server/contact/create-contact-message.ts` · `app/api/contact/route.ts` |
| **Sửa** | `lib/contact/client.ts` → `POST /api/contact` |
| **Route** | `rateLimit(3/10 phút/IP)` · `readJsonLimited` · `handleApiError` · trả `{ ok: true }` |

> Model `ContactMessage` đã có trong `prisma/schema.prisma` (`status: ContactStatus = new`),
> nhưng chưa có schema validate, service, hay route nào.

| | |
|---|---|
| **Done khi** | Gửi form → `SELECT * FROM contact_messages` có row · phone sai → 400 kèm `details.fields` |

> **Phạm vi đã chốt:** chỉ lưu vào `contact_messages`. Trang `/admin/messages` (đọc +
> đánh dấu `read`/`replied`) để phase sau — model đã có `status` sẵn.
>
> **Đã kiểm chứng trên DB dev:** adapter trả `{ ok: true }`; phone sai → `400 INVALID_INPUT`
> với `details.fields[0].path === "phone"`; request thứ 4 trong 10 phút → `429` +
> `retry-after: 600`; 2 row ghi đúng `name`/`subject`/`email: null`/`status: new`.
>
> Route trả `{ ok: true }` **không** kèm `id` để không lộ số lượng lời nhắn.

---

### B5 · Settings sync

| | |
|---|---|
| **Mục tiêu** | UI và server dùng chung một nguồn cấu hình |
| **Sửa** | `app/(site)/dat-tour/page.tsx` — lấy `holdHours` / `cancelCutoffDays` / `maxGuestsPerOrder` từ `getBookingSettings()` (DB) thay vì `siteSettings` fixture |
| **Lý do** | Hiện `lib/fixtures/site.ts` hardcode `24 / 3 / 20`. Admin đổi `settings.booking` trong DB thì UI vẫn hiện số cũ, lệch với server |
| **Done khi** | Sửa `settings.booking.holdHours` trong DB → UI hiện đúng số mới, khớp hạn giữ chỗ server trả về |

> **Phạm vi thực tế rộng hơn plan:** thêm `server/settings/get-site-settings.ts` (ghép
> fixture + `settings.booking`) và dùng nó ở **cả** `/dat-tour` và `/tour/[slug]`, vì trang
> chi tiết tour cũng hiện "giữ chỗ tối đa X giờ / huỷ trước Y ngày". `step-tour-selection.tsx`
> bỏ hardcode "tối đa 20 khách", nhận `maxGuestsPerOrder` từ props.
>
> **Đã kiểm chứng trên DB dev:** đặt `holdHours=12 / cancelCutoffDays=5 / maxGuestsPerOrder=15`
> → `getSiteSettings()` và `getBookingSettings()` trả đúng 12/5/15. Giá trị rác bị kẹp đúng:
> `9999→168`, `-5→0`, `0→1`.
>
> **Lưu ý dữ liệu:** `settings.booking` trong DB còn field `cancellationPolicy` (chuỗi chính
> sách) mà `BookingSettings` **không** đọc. Không có chỗ nào dùng — nhưng nếu sau này viết
> UI ghi đè `settings.booking`, phải merge chứ không replace cả object, nếu không sẽ mất field này.
>
> Copy marketing trên trang chủ (`hero-section`, `promise-strip`, `home-cta-section`) vẫn ghi
> "Giữ chỗ 24 giờ" theo `DESIGN.md §6` — cố ý giữ tĩnh, không kéo homepage sang dynamic.

---

### B6 · Hardening

| | |
|---|---|
| **Mục tiêu** | Dọn dẹp trước khi test |
| **Sửa** | Log lỗi có context · gộp `maskPhone` trùng lặp (`lib/format.ts:13` ↔ `server/booking/dto.ts:29`) · `sources/README.md` (bỏ ghi chú "Trạng thái" sai, thêm `POST /api/contact`) · `AGENTS.md` root (mục "Two disconnected halves" không còn đúng) |
| **Done khi** | Docs khớp code · không còn file mock nào · `npm test` cũ vẫn xanh |

> **Đã làm:** `maskPhone` gộp về một nguồn duy nhất (`lib/format.ts`), `server/booking/dto.ts`
> import lại thay vì tự định nghĩa. Log lỗi có context đã có sẵn trong `lib/http.ts`
> (`console.error(\`[${context}]\`, error)`) nên không phải sửa. `sources/README.md` cập nhật
> trạng thái, cây thư mục (`server/catalog|contact|settings`, `lib/api/client.ts`) và thêm
> `POST /api/contact`. `AGENTS.md` root: mục "Two disconnected halves" thay bằng
> "Content vs. data" phản ánh đúng hiện trạng.
>
> Grep xác nhận không còn dấu vết mock (`Adapter frontend-first`, `mockOrder`, `createMockOrder`,
> `setMockCancelled`) trong `lib/`, `components/`, `app/`.

---

## 3. TRACK B — Test (làm sau)

### T0 · Hạ tầng test

| | |
|---|---|
| **Tạo mới** | `scripts/tests/helpers/env.ts` · `scripts/tests/helpers/factories.ts` |
| **Sửa** | `package.json` thêm `test:unit`, `test:catalog`, `test:contact`, `test:flow`, `test:coverage` |

**`helpers/env.ts`** — gom phần đang lặp ở 3 file test hiện tại:

```ts
process.loadEnvFile(".env");
if (!process.env.TEST_DATABASE_URL) throw new Error("Thiếu TEST_DATABASE_URL trong .env");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.AUTH_SECRET ??= "test-auth-secret-at-least-32-characters-long";
process.env.IP_HASH_SALT ??= "test-ip-salt";
```

**`helpers/factories.ts`:**

```ts
createTestTour(tx, overrides)        // status: "published", basePriceAdult/Child, slug+code unique
createTestDeparture(tx, tourId, { daysFromToday, capacityTotal, seatsTaken, status, holidaySurcharge })
createTestSettings(tx, partial)      // upsert settings.key = "booking"
createTestAdmin(tx, overrides)
cleanupTour(tx, tourId)              // order.deleteMany → tour.delete
```

**3 bẫy bắt buộc xử lý:**

1. `Order` **không** có `onDelete: Cascade` từ `Tour` → phải `order.deleteMany({ where: { tourId } })`
   **trước** `tour.delete()`, nếu không Prisma ném lỗi FK.
2. `@@unique([tourId, departureDate])` → trong một test, không tạo 2 chuyến cùng ngày cho một tour.
3. `Order.lookupToken` **bắt buộc, unique, không default** → factory tạo order tay phải tự sinh.

| | |
|---|---|
| **Done khi** | `npm run test:unit` chạy được trên repo sạch (chưa cần DB) |

> **Đã làm & kiểm chứng**
>
> - `helpers/env.ts` (TS, dùng cho test chạy bằng `tsx`) — `booking.test.mts` và `admin.test.mts`
>   đã chuyển sang `import "./helpers/env";`, bỏ khối lặp 4 dòng.
>   `jobs.test.mjs` **giữ** khối inline vì `test:jobs` cố ý chạy `node --test` không có `tsx`
>   (để chứng minh job `.mjs` chạy được không cần toolchain TS) — nó không import được file `.ts`.
> - `helpers/factories.ts`: `createTestTour`, `createTestDeparture`, `createTestSettings`,
>   `readBookingSettings`/`restoreBookingSettings`, `createTestAdmin` (bcrypt thật, mật khẩu
>   `TestAdmin#2026`), `createTestOrder` (tự sinh `lookupToken` 24 ký tự), `cleanupTour`.
>   `cleanupTour` xoá theo thứ tự **review → order → tour** vì `Order` không cascade từ `Tour`
>   và `Review` là `SetNull`.
> - `scripts/tests/unit/settings-clamp.test.ts` — test canary để `npm run test:unit` chạy được
>   ngay từ T0 (5 case, thuần, không cần `.env`). File này tính vào T1.
> - `package.json`: thêm `test:unit`, `test:catalog`, `test:contact`, `test:flow`,
>   `test:coverage:unit`, `test:coverage`.
>   `test:catalog` / `test:orders` / `test:lookup` / `test:contact` / `test:coverage` đã chạy
>   được từ T2; chỉ `test:flow` chờ T4.
>
> **Baseline coverage đo tại T0** (4 suite cũ, đã loại `lib/fixtures/**` + `lib/contracts/**`):
>
> ```
> lines 51.54%   branches 86.19%   functions 88.07%
> ```
>
> → khoá ngưỡng `test:coverage` = **49 / 84 / 86** (làm tròn xuống 2%). Đây là mức sàn chống
> tái quy giảm; T2–T4 phải **nâng** ngưỡng sau khi thêm test, không được hạ.
> `test:coverage:unit` giữ ngưỡng **lines 90 / branches 85 / functions 90**; tại T0 cố ý fail
> (16% lines), T1 đưa lên **98.11%**.

---

### T1 · Unit (không cần DB)

```
scripts/tests/unit/api-client.test.ts
scripts/tests/unit/format.test.ts
scripts/tests/unit/next-path.test.ts
scripts/tests/unit/preview.test.ts
scripts/tests/unit/validation-order.test.ts
scripts/tests/unit/catalog-filter.test.ts
scripts/tests/unit/contact-validation.test.ts
scripts/tests/unit/settings-clamp.test.ts
```

**Case bắt buộc:**

- `calculateBookingPreview`: em bé **không** vào `billedGuests` nhưng **có** vào `seats`; phụ thu lễ chỉ áp `adults + children`
- `normalizePhone`: `+84…`, `84…` (11 số), có space/dấu chấm/ngoặc → cùng về `0xxxxxxxxx`
- `createOrderSchema`: `clientRequestId` không phải UUID → fail; `passengers.length !== seats` → fail; `infants > adults + children + 1` → fail
- `sanitizeNextPath`: `//evil.com`, `/admin\..`, `https://x` → fallback `/admin`
- `maskPhone`: chuỗi < 8 ký tự → `***`
- `isBookableDeparture`: biên `today + minDaysAhead` (đúng bằng → nhận, nhỏ hơn 1 ngày → loại)

> **Kết quả:** 8 file, **60 test case**, tất cả pass. `scripts/tests/time.test.ts` đã chuyển vào
> `scripts/tests/unit/` (nó là unit test thuần) để `npm run test:unit` và glob coverage phủ luôn —
> `npm test` cập nhật theo.
>
> `npm run test:coverage:unit` → **lines 98.11% / branches 94.26% / functions 94.81%**
> (ngưỡng 90/85/90). Riêng `lib/validation/contact.ts` được phủ thêm bằng case cho
> `createContactMessageSchema` (schema server) ngay trong `contact-validation.test.ts`, thay vì
> đợi T2 — nếu không nó sẽ kéo gate unit xuống 5%.
>
> Coverage backend toàn phần (đo lại cùng bộ lọc T0) tăng từ **51.54/86.19/88.07** lên
> **62.34/89.73/92.53** → nâng ngưỡng `test:coverage` lên **60 / 87 / 90** theo luật ratchet.
>
> Ghi chú: `formatDateVN("không-phải-ngày")` trả `"ngày/phải/không"` (hàm split theo `-` rồi
> ghép lại). Đây là hành vi sẵn có, không sửa trong T1 — test chỉ khoá lại nhánh passthrough
> với input không có dấu `-`.

---

### T2 · Feature API (cần DB test)

```
scripts/tests/catalog.test.mts
scripts/tests/orders-route.test.mts
scripts/tests/lookup-route.test.mts
scripts/tests/contact.test.mjs
```

**`catalog.test.mts` — quan trọng nhất** (chặn tái phát blocker ở B1):
tạo 1 tour riêng với 4 chuyến → `today+1` (quá gần), `today+3` (đúng biên), `today+7` (hợp lệ),
`today+14` + `seatsTaken == capacityTotal` (đầy). Assert **chỉ trả `today+3` và `today+7`**.

**`orders-route.test.mts`:**

- Hợp lệ → `201` + `{ ok: true, order }`
- Sai phone → `400` + `error.details.fields[].path === "phone"`
- 6 request liên tiếp → request 6 trả `429` + header `retry-after`

**`lookup-route.test.mts`:**

- Sai SĐT và mã không tồn tại → **cùng một message** (chống dò đơn)
- Huỷ lần 2 → `alreadyCancelled: true` và **không** nhả chỗ thêm lần nữa

**`contact.test.mjs`:**

- Hợp lệ → `201` + row trong `contact_messages`
- `message` < 10 ký tự → `400`

> Mọi test gọi route có rate limit phải gọi `resetRateLimit()` ở đầu — state rò trong cùng file.
> `node:test` chạy mỗi file trong process riêng nên không rò giữa các file.

> **Kết quả:** 4 file, **17 test case**, tất cả pass. `npm test` tổng **98/98**.
>
> - `contact.test.mts` (không phải `.mjs`) — nó cần Prisma + alias `@/`, tức phải chạy qua `tsx`.
> - Thêm `test:orders` và `test:lookup`; `npm test` và `test:coverage` đã gộp cả 4 suite mới.
> - `lookup-route.test.mts` có thêm case quá hạn tự huỷ → `409 CANCEL_TOO_LATE` (tạo đơn bằng
>   factory trên chuyến `today+1` rồi đổi `code` sang định dạng `XMSN-YYYY-NNNN` để route nhận).
>
> **2 bẫy phát hiện khi chạy:**
>
> 1. **Không import named export tĩnh từ module `.ts` trong file `.mts`.** tsx biên dịch `.ts`
>    sang CJS, nên `import { x } from "@/lib/time"` trong `.mts` ném
>    `does not provide an export named 'x'`. Phải dùng `const { x } = await import("@/…")` —
>    đúng pattern của `booking.test.mts`/`admin.test.mts`. Helper factory vì thế được import qua
>    alias `@/scripts/tests/helpers/factories`.
> 2. **`--test-concurrency=1` là bắt buộc cho MỌI lệnh chạy nhiều suite DB.** Chạy coverage
>    không có cờ này khiến các file chạy song song trên cùng DB: `jobs.test.mjs` (đếm toàn cục)
>    thấy trạng thái trung gian và fail. Đã thêm cờ vào `test:coverage`.

---

### T3 · Contract (regression — giá trị cao nhất)

```
scripts/tests/contract.test.mts
```

- `toOrderDto()` trả **đủ** mọi key của `PublicOrder`
- **Không** rò `lookupToken`, `ipHash`, `adminNote`, `id`, `tourId`
- Mapper mới `orderDtoToBookingSuccess()`: `totalAmount` lấy từ `pricing.totalAmount` server,
  **không** từ preview client
- `createOrderSchema` chấp nhận `email: null` (bug thật gặp ở B2) và trả `email: null` trong DTO

> Đây là tầng duy nhất bắt được lỗi âm thầm khi thay mock bằng fetch mà `tsc` không thấy
> (vì `OrderDto` là `ReturnType`, không phải type tường minh).

> **Kết quả:** 5 test case, pass. Danh sách key dùng
> `Record<Exclude<keyof PublicOrder, "alreadyCancelled">, true>` nên **thêm field vào contract
> mà quên cập nhật test → `tsc` báo lỗi**, không thể trôi âm thầm.
>
> **T3 bắt được 2 lệch contract thật** (đã sửa ở nguồn, không phải nới test):
>
> 1. `toOrderDto` trả `pricing.currency: string` (literal bị widen) trong khi `PublicOrder`
>    yêu cầu literal `"VND"`. Sửa: `currency: "VND" as const` trong `server/booking/dto.ts`.
> 2. `cancellation.policy` là `string | null` (vì `tours.cancellation_policy` nullable) nhưng
>    contract khai `string`. Sửa: `PublicOrder.cancellation.policy: string | null`, và
>    `components/lookup/lookup-result.tsx` hiện "Chưa có chính sách huỷ cho tour này." khi null.
>
> Cả hai lỗi đều **không** lộ ra khi chạy thật vì client tự cast response sang `PublicOrder`;
> chỉ tầng contract mới thấy.

---

### T4 · Full flow + khoá coverage

```
scripts/tests/flow.test.mts
```

`listBookableTours` → `POST /api/orders` → `POST /api/orders/lookup` → `POST /api/orders/cancel`
→ assert `seatsTaken` về ban đầu + `order_status_history` có 2 bản ghi.

> **Kết quả:** 2 test case, pass. `flow.test.mts` kiểm 7 mốc: catalog thấy chuyến → đặt chỗ
> (`seatsTaken` +3) → tra cứu `new` → huỷ → `seatsTaken` về 0 → `order_status_history` đúng
> `[null→new, new→cancelled]` → catalog thấy chỗ đã trả lại.
>
> Test thứ hai phủ **B5**: ghi `settings.booking` rồi assert `getSiteSettings()` trả đúng
> `holdHours`/`cancelCutoffDays`/`maxGuestsPerOrder`, và giá trị rác bị kẹp (`9999→168`,
> `-5→0`, `0→1`). Nhờ vậy `server/settings/get-site-settings.ts` đạt 100% thay vì 4%.
> Settings được khôi phục trong `finally` để không ảnh hưởng test khác.
>
> `package.json`: thêm `test:contract`; `npm test` và `test:coverage` đã gộp `contract` + `flow`.
> Tổng **111 test case**, `npm test` xanh.

**Coverage gate** — đã cấu hình sẵn trong `package.json` (nguồn sự thật duy nhất, đừng copy lại lệnh):

```sh
npm run test:coverage:unit   # gate chặt cho module thuần (T1)
npm run test:coverage        # gate rộng cho backend (T4)
```

- `test:coverage:unit`: include `lib/format|time|settings|api/client|validation/*|booking/preview|auth/next-path` +
  `server/catalog/is-bookable.ts`; ngưỡng **lines 90 / branches 85 / functions 90**.
  Chỉ `is-bookable.ts` được include từ `server/catalog/` vì 3 file còn lại cần DB, không phải unit test.
- `test:coverage`: include `server/**`, `lib/**`, `app/api/**`, loại trừ `lib/fixtures/**` và
  `lib/contracts/**`; ngưỡng khoá cuối cùng **lines 72 / branches 88 / functions 92**
  (ratchet: T0 51.54/86.19/88.07 → T1 62.34/89.73/92.53 → T2 72.14/89.99/94.25 →
  T3+T4 **74.31/90.24/94.56**). Script đã gộp đủ 10 suite, chạy được từ T2.

**Loại trừ khỏi gate:** `lib/fixtures/**` (dữ liệu tĩnh), `lib/contracts/**` (chỉ type),
`components/**`, `app/(site)/**`, `app/admin/**`.

> **Không đặt ngưỡng bằng cách đoán.** Baseline đã đo ở T0 và khoá. T2–T4 thêm test thì **nâng**
> ngưỡng theo số đo mới (làm tròn xuống 2%), không bao giờ hạ.

---

## 4. Sơ đồ phụ thuộc

```
B0 ──▶ B1 ──▶ B2 ──▶ B3
 │             │
 │             └──▶ B5
 ├──▶ B4 ──▶ B6
 │
 └─────────────▶ T0 ──▶ T1 ──▶ T2 ──▶ T3 ──▶ T4
```

- **B0 trước tất cả** — `AppError` là thứ B4/B6 sẽ dùng.
- **B1 trước B2** — không có departure ID thật thì `createOrder` trả 404, đơn không bao giờ tạo được.
- **B3 sau B2** — cần một đơn thật trong DB để test tra cứu/huỷ.
- **B4 song song được** với B1→B3 (độc lập hoàn toàn).

---

## 5. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| **`sources/.env` trỏ `DATABASE_URL` vào Aiven production** | Đã giải quyết: `.env` có `DEV_DATABASE_URL` + `TEST_DATABASE_URL` (cùng host, khác database). Mọi smoke test dùng `node scripts/with-db.mjs dev|test …`; không có lệnh nào chạy với `DATABASE_URL` production |
| Build trước test sau → lỗi ẩn tích tụ qua 4 phase | Smoke test tay bắt buộc cuối mỗi phase (cột "Done khi") |
| T2 phát hiện sai thiết kế ở B1 → phải sửa lại | Tách `is-bookable.ts` thành hàm thuần ngay từ B1, sửa được mà không đụng Prisma |
| T3 lộ DTO thiếu field → phải sửa B2 | B2 map success screen **hoàn toàn** từ `OrderDto`, không giữ state local |
| Rate limit in-memory 5 đơn/10 phút/IP chặn test tay | Biết trước, gọi `resetRateLimit()` trong test; khi test tay thì đợi hoặc restart dev server |
| `--test-coverage-include-all` kéo điểm xuống nếu quên loại trừ | Loại trừ `lib/fixtures/**` và `lib/contracts/**` |
| `tsx` in `DEP0205 module.register() deprecated` | Vô hại, đừng nhầm là lỗi |
| Fixture tự tạo rò rỉ khi test fail | `after()` + `deleteMany` theo `tourId`, không dựa vào `afterEach` của test đang fail |

---

## 6. Việc cần chốt trước khi bắt đầu

1. ~~**DB dev để smoke test**~~ → **đã có**: `DEV_DATABASE_URL` + `TEST_DATABASE_URL` trong `.env`, dùng qua `scripts/with-db.mjs`.
2. **Phạm vi B1** — chỉ `/dat-tour`, hay cả `/tour/[slug]`? (khuyến nghị: cả hai, vì trang chi tiết tour đang hiện ngày/giá/chỗ lấy từ fixture, có thể đã lỗi thời)
3. ~~**B4 có kèm admin inbox**~~ → **đã chốt: chỉ lưu**, trang `/admin/messages` làm sau.

---

## 7. Khối lượng ước tính

| | Số file |
|---|---|
| Tạo mới (build) | 8 — `server/errors.ts`, `lib/api/client.ts`, `server/settings/*`, `server/catalog/*` ×3, `server/contact/*`, `app/api/contact/route.ts` |
| Sửa (build) | ~12 |
| Xoá | 1 — `lib/fixtures/order.ts` |
| Tạo mới (test) | 15 — 2 helpers + 8 unit + 4 feature + 1 contract + 1 flow |

**Thứ tự thực thi: B0 → B6, rồi T0 → T4.**

---

## 8. Checklist tiến độ

### Track A — Build

- [x] **B0** Foundation — `AppError`, `lib/api/client.ts`, tách `getBookingSettings`
- [x] **B1** Catalog — đọc tour/chuyến thật, empty state
- [x] **B2** Booking create — `POST /api/orders`, success screen từ DTO, error map
- [x] **B3** Lookup / Cancel — thay mock, xoá `lib/fixtures/order.ts`
- [x] **B4** Contact — schema, service, `POST /api/contact` (chỉ lưu, chưa có admin UI)
- [x] **B5** Settings sync — `/dat-tour` lấy settings từ DB
- [x] **B6** Hardening — log, gộp `maskPhone`, cập nhật docs

### Track B — Test

- [x] **T0** Hạ tầng — helpers, factories, `package.json`, đo baseline coverage
- [x] **T1** Unit — 8 file, không cần DB
- [x] **T2** Feature API — catalog, orders, lookup, contact
- [x] **T3** Contract — `toOrderDto` ↔ `PublicOrder`, chống rò field nội bộ
- [x] **T4** Full flow + khoá coverage gate

### Track C — Admin UI → chi tiết ở §9

- [x] **A0** Design system admin — `DESIGN-ADMIN.md`, token map, danh sách cắt bỏ
- [x] **A1** Admin shell — sidebar 248px, drawer mobile, page header
- [x] **A2** Primitives — `statusLabel`, chip trạng thái, quy ước tiền/bảng
- [x] **A3** Login — bỏ prefill, hiển thị đúng 3 lỗi server
- [x] **A4** Tổng quan — KPI từ `countOrdersByStatus`, bảng 8 đơn
- [x] **A5** Danh sách đơn — lọc `status`/`q` thật, phân trang giữ filter
- [x] **A6** Chi tiết đơn — state machine đúng, bỏ trường bịa
- [x] **A7** 404 admin — trong shell, bỏ thuật ngữ bịa
- [x] **A8** A11y + responsive + test/coverage

### Track D — Admin backend → chi tiết ở §10

- [x] **D0** Ảnh local + bỏ `remotePatterns` (prerequisite)
- [x] **D1** CRUD chuyến khởi hành
- [x] **D2** Cấu hình đặt tour (+ sửa lỗi mất `cancellationPolicy`)
- [x] **D3** Hộp thư liên hệ + tài khoản quản trị
- [x] **D4** Nội dung tour + thư viện media
- [x] **D5** Kiểm duyệt đánh giá + xuất CSV đơn
- [ ] **D6** Phân quyền theo vai trò (owner / admin / editor) — **ưu tiên 1**
- [ ] **D7** Ghi chú nội bộ + phân công đơn (cần migration)
- [ ] **D8** Kênh khách gửi đánh giá
- [ ] **D9** Public đọc DB + CRUD điểm đến/bài viết/món ăn/FAQ
- [ ] **D10** Upload ảnh, màn audit log, badge tin mới

### Điều kiện chặn

- [x] DB dev dùng cho smoke test (`DEV_DATABASE_URL` + `scripts/with-db.mjs dev`)
- [x] `TEST_DATABASE_URL` trỏ DB test riêng, đã `db:migrate:test` + `db:seed:test`

---

## 9. TRACK C — Admin UI (dựng lại từ bản Stitch)

> Phạm vi: **5 màn admin đang có sẵn**. Không thêm module mới (khách hàng, lịch trình, tin nhắn,
> thanh toán). Đường dẫn tính từ `sources/`.
> Checklist cập nhật ở §8 → "Track C".

### 9.0 Bối cảnh

- Storefront đã xong; admin hiện là UI tối giản: header ngang `max-w-5xl`, token shadcn
  đen/trắng, lệch hẳn brand.
- Stitch đã trả 5 file HTML: login, tổng quan, danh sách đơn, chi tiết đơn, 404.
- **Không port trực tiếp được.** Chúng là document HTML độc lập (`<html>/<head>`), dùng
  `cdn.tailwindcss.com` + `tailwind.config` inline trong khi dự án là Tailwind v4 khai báo
  bằng `@theme` trong `app/globals.css` (không có file config). Khoảng 15 utility class
  không tồn tại, và một số class **trùng tên nhưng khác màu** — port thẳng sẽ ra chữ trắng
  trên nền trắng.
- Vì vậy Track C là **dựng lại theo bản tham chiếu thị giác**, không chỉnh sửa file Stitch.

### 9.1 Những gì cắt khỏi bản Stitch (đã chốt)

| Hạng mục trong bản Stitch | Lý do cắt |
|---|---|
| "Chưa thanh toán", "thu tiền tại bến" | Không có trạng thái thanh toán trong schema; mô hình là giữ chỗ rồi thu cọc sau khi liên hệ |
| Tàu / khoang / số ghế / "thời gian trễ" | Không có field trong `Order` hay `Departure` |
| "In phiếu điều phối", nút "Nhật ký" | Không có tính năng, và "Nhật ký" trùng khối lịch sử trạng thái |
| Sự kiện "Gửi mã đơn qua Zalo ZNS" | Không có tích hợp; `order_status_history` chỉ lưu chuyển trạng thái |
| "Đồng bộ máy chủ nội bộ", "Phân hiệu vận hành", "Hotline kỹ thuật nội bộ" | Bịa; hotline `0903 123 456` là số khách hàng |
| Nav "Lịch trình tour", "Khách hàng" | Không có route, không có module |
| Nút "Mô phỏng rỗng" và khối chọn trạng thái ở login | Artifact của Stitch, không được lên production |
| Prefill email + mật khẩu ở login | Nguy hiểm: mật khẩu là 12 ký tự `•` **thật**, `required` pass và form gửi chuỗi rác |
| `history.back()` ở 404 | Có thể thoát khỏi admin hoặc lặp lại 404 |
| `ERR_RECORD_NOT_FOUND`, "định dạng `#XMSN-XXXX`", "bộ phận kỹ thuật nội bộ" | Thuật ngữ bịa, mã đơn thật không có dấu `#` |

### 9.2 Token map (bắt buộc, dùng khi port bất kỳ class nào)

| Bản Stitch | Dự án | Ghi chú |
|---|---|---|
| `bg-accent`, `text-accent` | `bg-clay`, `text-clay` | `accent` của shadcn là xám gần trắng → CTA trắng trên trắng |
| `bg-accent-soft` | `bg-clay-soft` | |
| `border-hairline` / `divide-hairline` | `border-line` / `divide-line` | |
| `text-muted` | `text-sage` (site) hoặc `text-muted-foreground` (shadcn) | `text-muted` không tồn tại |
| `bg-surface-container*` | `bg-surface-warm` (hoặc bỏ nền) | 4 biến thể `-low/-high/-highest` đều không tồn tại |
| `font-serif` | `font-display` | `font-serif` = Georgia, **không phải** Fraunces |
| `font-code-id` / `text-code-id` | `font-mono` + size thật | |
| `font-label-md` / `font-metadata` / `font-headline-sm` / `font-eyebrow` / `font-body-md` | bỏ class, dùng `text-[Npx] font-semibold` | Không tồn tại → H1 rơi về 16px/400 |
| `bg-danger-bg` | `bg-danger/10` + `text-danger` | |

**Cấm dùng:** `accent`, `primary`, `secondary`, `muted`, `surface-container*`, `hairline`,
`font-serif` trong code admin. Grep lại sau A2 trước khi sang A3.

### 9.3 Nguyên tắc riêng của Track C

- Không import `@/lib/prisma` trong `app/`/`components/` (giữ 0 vi phạm).
- Không thêm query mới: `countOrdersByStatus`, `listAdminOrders`, `getAdminOrderById`,
  `updateOrderAction` đã đủ cho cả 5 màn.
- **`DATABASE_URL` trỏ Aiven production.** Muốn smoke test confirm/cancel phải chạy
  `node scripts/with-db.mjs dev …`; không bấm nút trên DB mặc định.
- Login rate limit 8 lần/15 phút/IP là in-memory: test tay sai nhiều sẽ bị khoá, restart
  dev server để reset.
- `app/admin/(dashboard)/layout.tsx` giữ `requireAdminPage` + `logoutAction`; root
  `app/admin/layout.tsx` giữ `export const instant = false`.
- Dữ liệu mẫu trong bản Stitch **không được copy vào code**. Mọi con số phải đến từ query.
  (Bản Stitch có cùng đơn `XMSN-2411-0187` xuất hiện với 3 trạng thái, 3 số tiền và 2 tên
  khách khác nhau ở 3 màn — đây là lỗi mẫu, không phải nguồn dữ liệu.)

---

### A0 · Chốt design system admin

| | |
|---|---|
| **Mục tiêu** | Một nguồn sự thật để A1–A8 không lệch nhau |
| **Tạo mới** | `sources/DESIGN-ADMIN.md` |
| **Nội dung** | Palette chỉ gồm token thật · thang chữ (H1 26–28 `font-display`, body 14, bảng 13, label 12) · mật độ bảng 52px · card không shadow · 6 chip trạng thái · breakpoint 1024 (sidebar) và 768 (bảng → card) · bảng token map ở §9.2 |
| **Done khi** | Doc không nhắc class không tồn tại; người review đọc xong dựng được A1 mà không cần hỏi |

> **Đã làm:** `sources/DESIGN-ADMIN.md` — 13 mục: phạm vi, nguyên tắc, token thật, thang chữ,
> bố cục shell, thành phần, hệ thống 6 trạng thái, định dạng dữ liệu, responsive, chuyển động,
> tiếp cận, bảng đối chiếu Stitch, danh sách cắt bỏ, checklist merge.
>
> Doc khớp với shell đã dựng ở A1: sidebar 248px `sticky`, drawer 300px, top bar 56px,
> content `max-w-[1200px]`, chỉ document scroll.
>
> **2 phát hiện khi viết doc** (đã ghi vào §7, để A2/A4–A6 xử lý):
>
> 1. `formatDateTimeVN` trả `08:42 5/11/26` (`dateStyle: "short"` của vi-VN), lệch hẳn
>    `formatDateVN` (`05/11/2026`). Chốt chuẩn admin là `dd/MM/yyyy HH:mm`.
>    `scripts/tests/unit/format.test.ts` chỉ khoá nhánh `null` nên đổi được mà không sửa test.
> 2. Admin đang dùng `formatVnd` (`8.380.000đ`) trong khi toàn storefront dùng
>    `formatVndDisplay` (`8.380.000 ₫`). Chốt admin dùng bản có `₫`.
>    Sau khi A4–A6 chuyển xong, `formatVnd` không còn nơi dùng — xoá ở A8.
>
> Grep kiểm chứng: doc chỉ nhắc `accent`/`primary`/`muted`/`font-serif`/`hairline` trong
> bảng đối chiếu "không dùng", không dùng chúng trong bất kỳ class mẫu nào.

### A1 · Admin shell

| | |
|---|---|
| **Mục tiêu** | Thay header ngang bằng sidebar + content, làm một lần cho mọi trang |
| **Tạo mới** | `components/admin/admin-sidebar.tsx` (client, `usePathname`) · `components/admin/admin-mobile-nav.tsx` · `components/admin/admin-page-header.tsx` |
| **Sửa** | `app/admin/(dashboard)/layout.tsx` |
| **Yêu cầu** | Sidebar 248px nền `ink`; logo PNG thật 40px qua `next/image` (`sizes="40px"`, không `priority`); wordmark + "QUẢN TRỊ"; **đúng 2 nav** Tổng quan/Đơn hàng; active = nền trắng 8% + thanh `clay` 3px + `aria-current`; footer tên admin + `logoutAction`; mobile <1024 dùng top bar 56px + drawer theo pattern `components/site/mobile-navigation.tsx` (Escape, khoá scroll body, `role="dialog"`) |
| **Bẫy** | Chỉ được có **một** vùng cuộn (document), không lặp lại `overflow-y-auto min-h-screen` của Stitch |
| **Done khi** | `/admin` và `/admin/orders` active đúng · Tab/Escape đóng drawer · ảnh 390/1024/1440 không tràn ngang · `tsc/lint/build` xanh |

> **Đã làm:** `admin-sidebar.tsx` (server, cột 248px `sticky`, logo PNG 40px) ·
> `admin-mobile-nav.tsx` (client, top bar 56px + drawer 300px) · `admin-nav-links.tsx`
> (client, `usePathname` + `aria-current`, đóng drawer khi bấm link) · `admin-page-header.tsx`
> (dùng từ A4). Layout `(dashboard)` bỏ header ngang, chuyển `lg:flex`; nội dung
> `max-w-[1200px]`; **chỉ còn document scroll** (không `overflow-y-auto`).
>
> Kiểm chứng: `tsc/lint/build` xanh · `/admin` và `/admin/orders` highlight đúng ·
> drawer mở/đóng bằng Escape, khoá `body` overflow, tự đóng khi điều hướng ·
> `scrollWidth` = 390/1024/1440 (không tràn) · 0 phần tử có `overflow-y` cuộn được
> ngoài document.

### A2 · Primitives

| | |
|---|---|
| **Mục tiêu** | Chấm dứt việc mỗi trang tự map trạng thái và màu |
| **Tạo mới** | `lib/booking/status-labels.ts` — `ORDER_STATUS_LABELS` + `statusLabel(status)` (thuần, unit-testable) |
| **Sửa** | `components/admin/status-badge.tsx` — 6 trạng thái, màu lấy từ `success/warning/danger/sage/surface-warm`, bỏ `bg-amber-100`/`bg-sky-100` |
| **Thêm** | `HoldExpiredLabel` (text 12px `danger`, **không** phải chip) |
| **Done khi** | Không còn mã màu Tailwind mặc định trong `components/admin/`; A4–A6 chỉ import, không tự viết lại nhãn |

> **Đã làm:**
>
> - `lib/booking/status-labels.ts` — `ORDER_STATUSES`, `ORDER_STATUS_LABELS`, `isOrderStatus`,
>   `statusLabel` (thuần, không Prisma/React).
> - `server/booking/dto.ts` bỏ map cục bộ, dùng `statusLabel` → API công khai và admin cùng nhãn.
> - `server/booking/admin-queries.ts`: `ADMIN_ORDER_STATUSES = ORDER_STATUSES` (hết trùng danh sách).
> - `components/admin/status-badge.tsx` viết lại theo token: `warning/15`, `surface-warm`,
>   `success/15`, `ink/10`, `danger/15`, `sage/15`; thêm `HoldExpiredLabel` (chữ 12px `danger`,
>   không phải chip).
> - `app/admin/(dashboard)/orders/page.tsx`: select trạng thái dùng `statusLabel` thay map riêng,
>   tránh lệch nhãn với chip trước khi A5 restyle.
> - `lib/format.ts`: `formatDateTimeVN` chuẩn hoá `dd/MM/yyyy HH:mm` (trước là `08:42 5/11/26`).
>
> Kiểm chứng: `tsc/lint/build` xanh · `npm run test:unit` 65/65 · `statusLabel` trả đúng 6 nhãn,
> giá trị lạ rơi về nguyên văn · `formatDateTimeVN` → `05/11/2026 08:42` · CSS build có đủ
> `bg-warning/15`, `bg-success/15`, `bg-danger/15`, `bg-sage/15`, `bg-ink/10` ·
> grep `bg-(amber|sky|emerald|zinc|rose)` trong `components/admin/` không còn kết quả.

### A3 · Login

| | |
|---|---|
| **Sửa** | `app/admin/login/page.tsx` · `app/admin/login/login-form.tsx` |
| **Giữ nguyên** | `loginAction`, `useActionState`, hidden `next`, `sanitizeNextPath` |
| **Bỏ** | Email/mật khẩu prefill, `novalidate`, khối chọn trạng thái demo, `setTimeout` giả lập |
| **Thêm** | 2 cột từ `lg` (không phải `md`) · `autoComplete` username/current-password · `aria-invalid` · `role="alert"` cho lỗi · hiện/ẩn mật khẩu bằng state có `aria-pressed` · pending state "Đang đăng nhập…" |
| **Copy** | Dùng nguyên chuỗi server trả: "Email hoặc mật khẩu không đúng." / "Bạn đăng nhập sai quá nhiều lần…" / "Vui lòng nhập email và mật khẩu hợp lệ." — không tự viết lại |
| **Done khi** | Sai mật khẩu hiện đúng câu của server · submit rỗng bị chặn · Tab đi hết form · 390px một cột |

> **Đã làm:** `page.tsx` dựng lại 2 cột từ `lg` (panel `ink` + logo 96px + wordmark + tagline;
> form bên phải), branding gọn ở mobile, footer `© {năm}`. `login-form.tsx`: giữ
> `loginAction`/`useActionState`/hidden `next`; thêm hiện–ẩn mật khẩu có `aria-pressed`,
> `autoComplete`, `aria-invalid` + `aria-describedby` khi lỗi, `role="alert"`, pending
> "Đang đăng nhập…", nút 44px.
>
> 4 mục "Bỏ" (prefill, `novalidate`, khối chọn trạng thái, `setTimeout`) **không tồn tại**
> trong repo — chúng chỉ có ở file Stitch, chưa từng được port. Không phải xoá gì.
>
> Kiểm chứng (CDP, DB dev): `tsc/lint/build` xanh · grid 1 cột ở 768/1023, 10 cột từ 1024 ·
> `aside` ẩn dưới `lg` · `scrollWidth` = 768/1023/1024/1440 (không tràn) · submit rỗng bị
> native validation chặn (`Vui lòng điền vào ô này.`) · sai mật khẩu hiện đúng câu server
> "Email hoặc mật khẩu không đúng.", `aria-invalid="true"` + `aria-describedby="login-error"`
> trên cả 2 field · toggle đổi `password ↔ text`, `aria-pressed` và `aria-label` đổi theo ·
> Tab: email → mật khẩu → nút hiện/ẩn → Đăng nhập.
>
> **Hành vi đã biết:** React 19 reset form sau khi action chạy, nên sau một lần sai mật khẩu
> hai ô trống lại và focus về ô Email. Muốn giữ giá trị phải đổi sang pattern khác (dispatch
> thủ công + đồng bộ DOM); `react-hooks/set-state-in-effect` chặn cách làm bằng `useEffect`,
> nên giữ nguyên hành vi chuẩn của React thay vì hack.

### A4 · Tổng quan

| | |
|---|---|
| **Sửa** | `app/admin/(dashboard)/page.tsx` |
| **Giữ nguyên** | `countOrdersByStatus` + `listAdminOrders({ page: 1, pageSize: 8 })` |
| **Yêu cầu** | 4 KPI là link thật `?status=new\|pending\|confirmed\|cancelled` · số 0 vẫn hiện, chỉ giảm độ đậm · bảng 6 cột + nhãn "Quá hạn giữ chỗ" khi `order.holdExpired` · empty state "Chưa có đơn nào." |
| **Bỏ** | "Đồng bộ máy chủ", "Phân hiệu vận hành", "Hotline kỹ thuật nội bộ", nút mô phỏng |
| **Done khi** | Số KPI khớp `SELECT status, count(*)` · bấm KPI ra đúng danh sách đã lọc |

> **Đã làm:** dùng `AdminPageHeader` (A1), 4 KPI là link thật, bảng 6 cột + card ở mobile
> (cùng một mảng `recent.orders`), `HoldExpiredLabel` dưới mã đơn, empty state
> "Chưa có đơn nào.", tiền chuyển sang `formatVndDisplay` (`₫`).
>
> **Một thay đổi ngoài 2 query đã nêu:** thêm `getSiteSettings()` để câu "tự hết hạn sau
> **N** giờ" lấy từ bảng `settings` thay vì hardcode 24 — đúng quy tắc B5, nếu admin đổi
> `holdHours` thì dashboard không nói sai.
>
> Các mục "Bỏ" (đồng bộ máy chủ, phân hiệu, hotline kỹ thuật, nút mô phỏng) **không tồn tại**
> trong repo — bản cũ chỉ có header + 4 card + bảng, nên không phải xoá gì.
>
> Kiểm chứng trên DB dev: seed tạm 6 đơn (2 `new`, 1 `pending`, 1 `confirmed`, 1 `completed`,
> 1 `cancelled`, một đơn `new` quá hạn giữ chỗ) → KPI hiện **2 / 1 / 1 / 1**, tổng 6, đúng
> `groupBy status`; bảng 6 dòng, đúng 1 nhãn "Quá hạn giữ chỗ"; bấm KPI "Chờ xác nhận" →
> `/admin/orders?status=new` và trang đích báo "2 đơn"; 390px không tràn, bảng ẩn và hiện
> 6 card. Sau đó **xoá 6 đơn tạm**: KPI về `0` màu `sage` (không ẩn), hiện "Chưa có đơn nào."

### A5 · Danh sách đơn

| | |
|---|---|
| **Sửa** | `app/admin/(dashboard)/orders/page.tsx` |
| **Giữ nguyên** | Form `method="get"`, `searchParams`, `listAdminOrders`, `buildHref` |
| **Sửa lỗi map** | Select dựng từ `ADMIN_ORDER_STATUSES` qua `statusLabel` → `new` = "Chờ xác nhận", `pending` = "Đang liên hệ". Bản Stitch map ngược (`pending` = "Chờ xác nhận") nên lọc ra sai danh sách |
| **Yêu cầu** | `name="q"` (không phải `search`) · "Lọc" là submit thật · "Xoá lọc" là link · bỏ `value="0912"` và `selected` hardcode · cột "Số khách" in số nguyên căn phải · phân trang giữ `status` + `q` · empty state khi `total === 0` |
| **Mobile** | Card <768 render từ **cùng mảng** `result.orders`, không copy markup |
| **Done khi** | `?status=new` chỉ ra đơn `new` · `?q=` khớp mã/SĐT/tên · `?page=2` giữ filter · 390px không tràn |

> **Đã làm:** `AdminPageHeader` + tổng số đơn; card lọc (select từ `ADMIN_ORDER_STATUSES` qua
> `statusLabel`, input `name="q"` có icon, nút "Lọc" submit thật, link "Xoá lọc"); bảng 8 cột
> gồm "Số khách" (số nguyên, căn phải), tiền `formatVndDisplay`, "Tạo lúc" `formatDateTimeVN`
> (`dd/MM/yyyy HH:mm`); card mobile <768 từ cùng mảng `result.orders`; empty state 2 nhánh:
> có filter → "Không có đơn phù hợp." + "Xoá bộ lọc", không filter → "Chưa có đơn nào.";
> phân trang giữ `status` + `q` qua `buildHref`.
>
> Map trạng thái đã đúng từ A2 (`new` = "Chờ xác nhận", `pending` = "Đang liên hệ"); select
> dùng `defaultValue` theo `searchParams`, không còn giá trị hardcode.
>
> Kiểm chứng trên DB dev (seed tạm 25 đơn: 23 `new`, 1 `pending`, 1 `confirmed`, rồi xoá):
> `/admin/orders` → **25 đơn**, 20 dòng, "Trang 1/2"; `?status=new` → **23 đơn**, chỉ chip
> "Chờ xác nhận", link sau là `/admin/orders?status=new&page=2`; `?status=new&page=2` → 3 dòng,
> "Trang 2/2", link trước `/admin/orders?status=new` (giữ filter, bỏ `page`); `?q=0900000111`
> và `?q=Tìm Kiếm` → 1 đơn mỗi trường hợp; `?q=khongcogi` → 0 đơn + "Không có đơn phù hợp."
> và "Xoá bộ lọc". Đo breakpoint: 375/390 `scrollWidth` = viewport, chỉ card; 767 card;
> 768+ chỉ bảng. Sau khi xoá seed: 0 đơn, "Chưa có đơn nào.", không hiện phân trang.
>
> **A8 sửa lại ngưỡng:** bảng 8 cột cần ~821px nên ở 768 (718px) và 1024 (710px, đã có
> sidebar) bị bóp cột. Chuyển bảng sang `xl` (≥1280), card cho `<1280`.

### A6 · Chi tiết đơn

| | |
|---|---|
| **Sửa** | `app/admin/(dashboard)/orders/[id]/page.tsx` · `app/admin/(dashboard)/orders/[id]/actions.ts` (chỉ đọc, không đổi chữ ký) |
| **Tạo mới** | `components/admin/order-actions.tsx` (client, `useFormStatus` để disable khi pending) |
| **State machine — chỉ render nút hợp lệ** | `new` → Đã liên hệ khách · Xác nhận · Huỷ<br>`pending` → Xác nhận · Huỷ<br>`confirmed` → Hoàn thành · Huỷ<br>`completed`/`cancelled`/`expired` → không nút |
| **Hành động** | Mỗi nút là `<form action={updateOrderAction}>` + hidden `orderId`/`action`; huỷ có `reason` bắt buộc |
| **Chi phí** | Đúng 4 số đã lưu: `unitPriceAdult`, `unitPriceChild`, `surcharge`, `totalAmount`. Không tự nhân dòng "x2" nếu không tính giống server |
| **Lịch sử** | `fromStatus → toStatus` qua `statusLabel`; `changedBy` chỉ in id; `note` là `row.note` |
| **Chính sách** | Render `order.cancellation.policy` + `deadline` từ server, không hardcode câu |
| **Bỏ** | Tàu/khoang/ghế, `CUST-*`, `BK-*`, thời gian trễ, "Chưa thanh toán", "In phiếu", "Nhật ký", ZNS |
| **Done khi** | 3 đơn ở 3 status khác nhau ra 3 bộ nút khác nhau · huỷ thiếu lý do bị chặn · đơn `confirmed` không có "Xác nhận" · lỗi từ `searchParams.error` hiển thị |

> **Đã làm:**
>
> - `components/admin/order-actions.tsx` (client, `useFormStatus`): mỗi hành động một `<form>`
>   với hidden `orderId`/`action`; nút disable + "Đang xử lý…" khi pending; lý do huỷ `required`.
> - `app/admin/(dashboard)/orders/[id]/page.tsx` dựng lại: header mono (mở rộng
>   `AdminPageHeader` thêm prop `titleClassName`), 3 card trái (Khách đặt / Chuyến đi / Hành
>   khách), cột phải sticky (Chi phí / Hành động / Chính sách huỷ), timeline lịch sử full width.
> - Chi phí đúng **4 số** đã lưu; chính sách lấy `order.cancellation.policy` + `deadline`;
>   nguồn map `web|zalo|phone|facebook`; `changedBy` chỉ in id.
> - Bản cũ vốn đã tối giản (không có tàu/khoang/thanh toán/in phiếu) nên không phải xoá gì.
>
> Kiểm chứng trên DB dev (seed 5 đơn `new`/`pending`/`confirmed`/`completed`/`cancelled`
> rồi xoá, 1 đơn có 4 hành khách + 2 dòng lịch sử):
> `new` → 3 nút (Đã liên hệ · Xác nhận · Huỷ), có "Quá hạn giữ chỗ"; `pending` → 2 nút;
> `confirmed` → 2 nút (Hoàn thành · Huỷ); `completed` → 0 nút + "Đơn đã ở trạng thái cuối";
> huỷ thiếu lý do bị native validation chặn ("Vui lòng điền vào ô này.") và URL không đổi;
> bấm "Xác nhận đơn" trên đơn `pending` → chip đổi "Đã xác nhận", bộ nút đổi theo, lịch sử
> có thêm 1 dòng; `?error=…` hiện đúng câu qua `role="alert"`; card chi phí đúng 4 giá trị;
> bảng hành khách 4 dòng với "Người lớn/Trẻ em/Em bé"; timeline 2 dòng, mới nhất có chấm clay,
> hiện `Chờ xác nhận →` và "bởi quản trị viên #1" / "Hệ thống tự động"; 390px `scrollWidth`
> = 390 (không tràn).

### A7 · 404 admin

| | |
|---|---|
| **Tạo mới** | `app/admin/(dashboard)/not-found.tsx` (render trong shell) |
| **Sửa** | `app/admin/not-found.tsx` thành fallback tối giản (dùng khi 404 ngoài nhóm `(dashboard)`) |
| **Copy** | "LỖI 404" / "Không tìm thấy đơn này" / "Đơn có thể đã bị xoá, hoặc đường dẫn không đúng. Kiểm tra lại mã đơn trong danh sách." · 1 CTA "Về danh sách đơn hàng" → `/admin/orders` |
| **Bỏ** | `ERR_RECORD_NOT_FOUND`, khối "Kiểm tra thông số truy vấn", `history.back()`, `<script>` copy từ trang danh sách |
| **Bẫy** | `notFound()` trong `(dashboard)` chỉ lấy shell nếu file nằm trong `(dashboard)`; đặt ở `app/admin/` sẽ mất sidebar |
| **Done khi** | `/admin/orders/999999` trả **404**, vẫn có sidebar, breadcrumb "Quản trị / Không tìm thấy" |

> **Đã làm:** thêm `app/admin/(dashboard)/not-found.tsx` (breadcrumb + card trong shell, đúng
> 3 câu copy, 1 CTA `/admin/orders`); viết lại `app/admin/not-found.tsx` thành fallback tối
> giản cho 404 ngoài nhóm `(dashboard)`. Không còn `ERR_RECORD_NOT_FOUND`, "thông số truy vấn"
> hay `history.back()` — bản cũ vốn không có, nhưng đã thay toàn bộ copy.
>
> Kiểm chứng (DB dev, CDP): `/admin/orders/999999` → sidebar hiện (`aside: flex`), nav active
> "Đơn hàng", breadcrumb `Quản trị / Không tìm thấy`, eyebrow "LỖI 404", H1 "Không tìm thấy
> đơn này" (Fraunces), đúng câu body, CTA trỏ `/admin/orders`; 390px không tràn
> (`scrollWidth` = 390), sidebar ẩn sau top bar.
>
> **Sai lệch so với "Done khi":** HTTP status là **200**, không phải 404. Nguyên nhân:
> `/admin/orders/[id]` build ra `◐` (partial prerender) nên shell được gửi trước khi
> `notFound()` chạy; Next giữ 200 và tự gắn `noindex` (đúng như tài liệu `not-found.md`).
> Đã thử `export const instant = false` ngay trong page — route vẫn `◐`, không đổi. Muốn 404
> thật phải kiểm tra tồn tại đơn ở `proxy.ts` (thêm query DB vào proxy), ngoài phạm vi A7.

### A8 · A11y + responsive + test

| | |
|---|---|
| **Việc** | Focus-visible ring `clay` cho mọi link/nút/card-link · `scope="col"` cho `<th>` · `aria-current` nav · không dùng `sage` trên nền `ink` (sidebar label dùng `#FFF9F0` 60%) · kiểm tra chỉ 1 scroll container |
| **Đo** | Ảnh chụp 375/390/768/1024/1280/1440 + `scrollWidth` = viewport |
| **Test** | Unit cho `statusLabel` trong `scripts/tests/unit/` (chạy `npm run test:unit`); nếu có sửa action thì chạy `npm run test:admin` trên **test DB** |
| **Docs** | Cập nhật `sources/DESIGN-ADMIN.md` theo thực tế; thêm ghi chú admin vào `sources/README.md` |
| **Done khi** | `npx tsc --noEmit && npm run lint && npm run build` xanh · `npm run test:unit` xanh · 6 ảnh breakpoint không tràn · Tab qua login → danh sách → chi tiết không mất focus |

> **Đã làm:**
>
> - `scripts/tests/unit/status-labels.test.ts` (5 case): thứ tự enum, 6 nhãn, fallback nguyên văn,
>   `isOrderStatus` với `NEW`/`null`/số, phủ đủ key.
> - `format.test.ts`: thêm case `formatDateTimeVN` → `05/11/2026 08:42` (cả ISO +07:00 và UTC).
> - Xoá `formatVnd` khỏi `lib/format.ts` (không còn nơi dùng sau A4–A6); admin + storefront dùng
>   chung `formatVndDisplay`.
> - Tăng độ tương phản nhãn sidebar: `contrast-on-accent/50` → `/60` (trước ~3.4:1, sau ~5.4:1).
> - **Sửa ngưỡng responsive của danh sách đơn**: bảng 8 cột cần ~821px, nhưng vùng nội dung ở
>   768 chỉ 718px và ở 1024 (đã có sidebar) chỉ 710px → trước đây bảng bị bóp, "Quá hạn giữ chỗ"
>   xuống 4 dòng và cột "Tạo lúc" bị cắt. Đổi bảng sang `xl` (≥1280), card cho `<1280`.
> - `DESIGN-ADMIN.md`: cập nhật §7 (đã chuẩn hoá format), §8 (bảng ngưỡng mới), §13 (thêm 1280),
>   thêm §14 "Đã triển khai" (route ↔ file, component, sai lệch đã biết).
> - `README.md`: thêm ghi chú giao diện quản trị + `components/admin/` + `lib/booking/status-labels.ts`
>   vào cây thư mục.
>
> Kiểm chứng: `tsc/lint/build` xanh · `npm run test:unit` **71/71** · `test:coverage:unit` pass
> ngưỡng 90/85/90 · quét 5 route × 6 breakpoint (375/390/768/1024/1280/1440):
> **0 trường hợp tràn ngang** · audit a11y ở trang chi tiết: 12 phần tử tương tác, **0 thiếu
> `focus-visible:ring`**, 5 `<th>` đều có `scope="col"`, 2 `aria-current`, **0 vùng cuộn lồng** ·
> danh sách đơn: card ở 768/1024, bảng ở 1280 với `tableWidth = wrapWidth = 966` (không bóp).

---

### 9.4 Sơ đồ phụ thuộc

```
A0 ──▶ A1 ──▶ A2 ──┬──▶ A3
                    ├──▶ A4
                    ├──▶ A5
                    ├──▶ A6
                    └──▶ A7
A3..A7 ──▶ A8
```

- **A0 trước A1** — chốt token trước khi viết class, tránh sửa 5 file cùng lúc.
- **A1 trước A3–A7** — đổi shell là đổi layout của mọi trang; làm sau sẽ phải sửa lại từng trang.
- **A2 trước A4–A6** — cả 3 trang dùng chung `statusLabel`; làm sớm tránh 3 bảng nhãn trôi lệch.
- **A3–A7 song song được** sau A2 (5 trang độc lập, không share state).
- **A8 sau cùng** — chỉ đo và chỉnh, không thêm tính năng.

### 9.5 Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Port class trùng tên nhưng khác màu (`accent`, `primary`, `muted`) → chữ trắng trên nền trắng | Bảng map §9.2 + grep `bg-accent\|text-accent\|surface-container\|font-serif` sau A2 |
| Đổi shell làm mất `max-w-5xl`, bảng 8 cột tràn | A1 phải giữ `overflow-x-auto` cho wrapper bảng; đo `scrollWidth` ở 1024 |
| Test tay confirm/cancel ghi vào DB production | Luôn `node scripts/with-db.mjs dev …`; không bấm nút trên `DATABASE_URL` mặc định |
| Rate limit login 8/15 phút chặn QA | Restart dev server để reset in-memory; hoặc dùng `TEST_DATABASE_URL` |
| `notFound()` render sai boundary, mất sidebar | Đặt file trong `(dashboard)`, kiểm bằng `/admin/orders/999999` |
| Copy dữ liệu mẫu Stitch vào code | Mọi số liệu lấy từ query; review diff phải không thấy mã đơn/tên khách hardcode |
| `next/image` tải ảnh gốc 488 KB cho logo 40px | Bắt buộc `sizes="40px"`; kiểm request thực tế trả WebP/AVIF vài KB |

### 9.6 Khối lượng ước tính

| | Số file |
|---|---|
| Tạo mới | 5 — `DESIGN-ADMIN.md`, `admin-sidebar.tsx`, `admin-mobile-nav.tsx`, `admin-page-header.tsx`, `lib/booking/status-labels.ts` (+ `order-actions.tsx`, `(dashboard)/not-found.tsx` nếu tách riêng → 7) |
| Sửa | 8 — layout `(dashboard)`, dashboard page, orders page, order detail page, login page, login-form, `status-badge.tsx`, `admin/not-found.tsx` |
| Xoá | 0 |

**Thứ tự thực thi: A0 → A1 → A2 → A3/A4/A5/A6/A7 → A8.**
Không gộp 2 phase vào một lần build; mỗi phase phải qua cổng `tsc + lint + build` trước khi sang phase kế.

---

## 10. TRACK D — Admin backend vận hành & nội dung

> Track này được thêm **sau khi A8 xong**, khi yêu cầu chuyển từ "giao diện admin" sang
> "vận hành thật": mở bán chuyến, sửa giá, đọc hộp thư, quản lý tài khoản.
> Đường dẫn tính từ `sources/`.

### 10.0 Bối cảnh

Admin hiện có **8 mục menu**, tất cả đều là server component gọi server action → service →
Prisma. Không có màn nào tự query DB, không có màn nào dùng dữ liệu mẫu.

| Domain | Route | Service | Audit | Test |
|---|---|---|---|---|
| Đơn hàng | `/admin/orders`, `/admin/orders/[id]` | `server/booking/admin-queries.ts`, `admin-update-order.ts` | ✅ | ✅ |
| Xuất CSV | `/api/admin/orders/export` | `listAdminOrdersForExport` + `lib/csv.ts` | — | ✅ |
| Chuyến khởi hành | `/admin/tours/[slug]/departures` | `server/catalog/admin-departures.ts` | ✅ | ✅ |
| Nội dung tour | `/admin/tours/[slug]` | `server/catalog/admin-tours.ts` | ✅ | ✅ |
| Hộp thư | `/admin/messages` | `server/contact/admin-messages.ts` | ✅ | ✅ |
| Thư viện ảnh | `/admin/media` | `server/media/admin-media.ts` | ✅ | ✅ |
| Đánh giá | `/admin/reviews` | `server/reviews/admin-reviews.ts` | ✅ | ✅ |
| Cấu hình booking | `/admin/settings` | `server/settings/update-booking-settings.ts` | ✅ | ✅ |
| Tài khoản | `/admin/users` (owner) | `server/auth/admin-users.ts` | ✅ | ✅ |

Ranh giới layer giữ nguyên: **0 file trong `app/` import `@/lib/prisma`** (kiểm bằng script),
mọi page/action đều có `requireAdminPage` (trừ login/logout), mọi API admin đều có
`requireAdminApi` (trừ login/logout).

**Đo tại thời điểm viết plan:**

```
npx tsc --noEmit            → 0 lỗi
npm run lint                → 0 error, 0 warning
npm run build               → 50 route
npm test                    → 144/144
npm run test:coverage       → exit 0 (all files ≈ 81.2 / 88.3 / 92.8; gate 72 / 88 / 92)
```

**Không có API admin cho** departures / tours / media / reviews / settings / users — các
domain này chỉ có server action. Đủ cho UI hiện tại; nếu cần tích hợp ngoài (app mobile,
đối tác) thì phải bổ sung route handler theo cùng mẫu `requireAdminApi` + `handleApiError`.

---

### D0 · Ảnh local + bỏ `remotePatterns` — **đã xong**

| | |
|---|---|
| **Mục tiêu** | Không còn phụ thuộc ảnh internet; `next/image` không còn host ngoài |
| **Tạo mới** | `lib/images.ts` (`toLocalImage`) · `public/images/CREDITS.md` · `sources/assets/images-originals/` (81 JPG gốc, ngoài `public/`) |
| **Sửa** | `next.config.ts` (xoá `images.remotePatterns`) · `lib/fixtures/{home-media,home,destinations,posts,tour-details}.ts` · `prisma/seed.mjs` · `components/home/hero-section.tsx` (caption) · `app/(site)/kinh-nghiem/[slug]/page.tsx` (dòng credit) |
| **Bẫy** | Ảnh DB cũ vẫn là URL Wikimedia → **runtime error** `hostname not configured`. `next/image` ném ngay khi render, không phải lúc build |
| **Done khi** | `grep wikimedia` trong `sources/` = 0 (ngoài CREDITS.md) · mọi trang 200 · `/dat-tour` không lỗi |

> **Đã làm & kiểm chứng**
>
> - 81 JPG chuyến đi → WebP q78, cạnh dài ≤1920: **119.1 MB → 18.3 MB**; bản gốc chuyển ra
>   `sources/assets/images-originals/` (không bị serve).
> - 8 ảnh điểm đến tải từ Wikimedia Commons (thumb 1920), ghi rõ tác giả + giấy phép +
>   link gốc trong `public/images/CREDITS.md`. 2 ảnh dùng license đơn giản nhất:
>   Chùa Vĩnh Tràng (**CC0**) và Nhà cổ Bình Thủy (**Public domain**).
> - `lib/images.ts#toLocalImage(src, alt)`: chỉ nhận `/images/*.(webp|jpg|png|avif)`, còn lại
>   trả `null`. Dùng ở `server/catalog/list-bookable-tours.ts` và `lib/booking/success.ts` —
>   nhờ vậy dữ liệu cũ trong DB **không làm sập trang** mà chỉ mất ảnh.
> - `npm run db:seed` đã chạy lại trên DB production: 3 tour, 11 điểm đến, 3 bài viết,
>   9 media đều trỏ `/images/*.webp`.
> - Sự cố gặp thật: sau khi xoá `remotePatterns`, `/dat-tour` ném
>   `Invalid src prop … hostname "thumb.wikimedia.org" is not configured`. Fix 2 lớp:
>   seed lại dữ liệu + `toLocalImage` chặn URL ngoài.
> - Sự cố thứ hai: `/admin/login` ném `Blocking Route … unstable value new Date()` vì
>   `cacheComponents`. Fix bằng `async function getCopyrightYear() { "use cache"; … }`,
>   cùng khuôn với `components/site/site-footer.tsx`.

---

### D1 · CRUD chuyến khởi hành — **đã xong**

| | |
|---|---|
| **Mục tiêu** | Mở bán/đóng/huỷ chuyến, sửa số chỗ và giá **không cần seed** |
| **Tạo mới** | `server/catalog/admin-departures.ts` · `app/admin/(dashboard)/tours/page.tsx` · `app/admin/(dashboard)/tours/[slug]/departures/{page.tsx,actions.ts}` |
| **Sửa** | `components/admin/admin-nav-links.tsx` (thêm mục) |
| **Bẫy** | `@@unique([tourId, departureDate])` → phải pre-check + bắt `P2002`; hạ `capacityTotal` dưới `seatsTaken` sẽ làm âm chỗ trống; xoá chuyến đã có đơn sẽ mất dữ liệu |
| **Done khi** | Tạo chuyến mới → hiện ngay trên `/dat-tour` · trùng ngày báo lỗi thân thiện · không hạ chỗ dưới mức đã bán · không xoá được chuyến có đơn |

**Bất biến đã cài trong service:**

| Bất biến | Mã lỗi | HTTP |
|---|---|---|
| Một tour chỉ 1 chuyến/ngày | `DEPARTURE_EXISTS` | 409 |
| `capacityTotal >= seatsTaken` | `CAPACITY_BELOW_TAKEN` | 409 |
| Không xoá chuyến đã có đơn | `DEPARTURE_HAS_ORDERS` | 409 |
| `returnDate >= departureDate` | `INVALID_DATE_RANGE` | 400 |
| Ngày/giá/số chỗ hợp lệ | `INVALID_DATE` / `INVALID_PRICE` / `INVALID_CAPACITY` | 400 |

> **Đã làm & kiểm chứng**
>
> - `listAdminTours()`, `getAdminTourDepartures(slug)`, `createDeparture(tourSlug, input, adminId)`,
>   `updateDeparture`, `setDepartureStatus`, `deleteDeparture`; mọi mutation ghi
>   `admin_audit_log` trong **cùng transaction**.
> - UI: bảng chuyến có chỗ đã bán/còn lại, nhãn "đã qua", nút Mở bán/Đóng/Huỷ, nút Xoá chỉ
>   hiện khi `orderCount === 0`, form sửa gập trong `<details>` (không cần JS).
> - Pre-check trùng ngày **trước** khi insert để không in `prisma:error` rác ra log; vẫn giữ
>   nhánh bắt `P2002` cho trường hợp race.
> - Test: tạo/trùng ngày/hạ chỗ/ngày về sai/đổi trạng thái + audit/chặn xoá khi có đơn/xoá
>   khi sạch/404 — nằm trong `scripts/tests/admin-content.test.mts`.

---

### D2 · Cấu hình đặt tour — **đã xong**

| | |
|---|---|
| **Mục tiêu** | Admin đổi `minDaysAhead` / `maxGuestsPerOrder` / `holdHours` / `cancelCutoffDays` từ UI |
| **Tạo mới** | `server/settings/update-booking-settings.ts` · `app/admin/(dashboard)/settings/{page.tsx,actions.ts}` |
| **Bẫy** | `settings.booking` trong DB **có field ngoài** `BookingSettings` (`cancellationPolicy`). Ghi đè nguyên object sẽ **mất dữ liệu** |
| **Done khi** | Lưu → `getBookingSettings()` trả số mới · giá trị vượt biên bị kẹp · `cancellationPolicy` còn nguyên |

> **Đã làm & kiểm chứng**
>
> - Trang `/admin/settings` hiển thị 4 ô số kèm khoảng hợp lệ và ghi chú rằng hotline/email/
>   địa chỉ vẫn đọc từ fixture (sửa DB không đổi nội dung công khai).
> - **Lỗi dữ liệu phát hiện và đã sửa:** bản đầu ghi `value = normalizeBookingSettings(input)`
>   → xoá mất `cancellationPolicy` (đúng như cảnh báo ở B5). Nay service **merge**:
>   `{ ...valueCũ, ...4keyMới }`, và audit ghi thêm `preservedKeys`.
> - Test mới: chèn `cancellationPolicy` + `qaMarker`, lưu cấu hình, assert cả hai còn nguyên;
>   khôi phục nguyên trạng trong `finally`.
> - Giá trị rác bị kẹp: `999 → 168`, `-5 → 0`, `0 → 1` (đã có test từ T4, giữ nguyên).

---

### D3 · Hộp thư liên hệ + Tài khoản quản trị — **đã xong**

| | |
|---|---|
| **Mục tiêu** | Đọc lời nhắn khách gửi (trước đây ghi DB nhưng không ai thấy) + quản lý người dùng admin |
| **Tạo mới** | `server/contact/admin-messages.ts` · `server/auth/admin-users.ts` · `app/admin/(dashboard)/messages/{page.tsx,actions.ts}` · `app/admin/(dashboard)/users/{page.tsx,actions.ts}` · `components/admin/access-denied.tsx` |
| **Sửa** | `components/admin/{admin-nav-links,admin-sidebar,admin-mobile-nav}.tsx` (thêm mục + truyền `role`) |
| **Bẫy** | Không được để admin tự khoá/xoá mình, hoặc bỏ **owner hoạt động cuối cùng** — sẽ mất đường vào hệ thống |
| **Done khi** | Tin khách gửi hiện trong `/admin/messages`, đổi trạng thái được · tạo tài khoản mới đăng nhập được · không tự khoá được mình |

**Quy tắc đã cài:**

| Quy tắc | Mã lỗi |
|---|---|
| Email tài khoản là duy nhất | `ADMIN_EMAIL_TAKEN` (409) |
| Mật khẩu ≥ 8 ký tự | `WEAK_PASSWORD` (400) |
| Không tự vô hiệu hoá | `ADMIN_SELF_DISABLE` (409) |
| Không tự xoá | `ADMIN_SELF_DELETE` (409) |
| Không bỏ owner hoạt động cuối | `ADMIN_LAST_OWNER` (409) |

> **Đã làm & kiểm chứng**
>
> - Hộp thư: 4 chip trạng thái kèm số lượng, tìm theo tên/SĐT/email/nội dung, phân trang
>   giữ filter, đổi trạng thái + xoá, audit `contact.status|delete`.
> - Tài khoản: danh sách, tạo (bcrypt cost 10), sửa tên/vai trò/khoá, đặt lại mật khẩu, xoá.
>   Audit `admin.create|update|password|delete`, **không** ghi mật khẩu vào meta.
> - `/admin/users` chỉ owner: menu ẩn với role khác, vào thẳng URL thì thấy panel
>   "Không có quyền" thay vì redirect im lặng.
> - Test: đổi trạng thái + audit + 404 sau xoá; tạo user → **đăng nhập thật** bằng
>   `authenticateAdmin`; reset mật khẩu thì mật khẩu cũ hết hiệu lực; khoá thì không đăng nhập
>   được; các guard self/last-owner.
> - **Hạn chế đã biết:** đổi mật khẩu **không** huỷ JWT đang có (cookie stateless). Khoá tài
>   khoản thì có hiệu lực ngay vì `getAdminSession()` đọc `isActive` mỗi request. Muốn chặt hơn
>   phải thêm `tokenVersion` vào JWT — xem D6.

---

### D4 · Nội dung tour + Thư viện media — **đã xong**

| | |
|---|---|
| **Mục tiêu** | Sửa nội dung tour **có tác dụng thật** (trang đặt tour đọc DB) + quản lý danh mục ảnh |
| **Tạo mới** | `server/catalog/admin-tours.ts` · `server/media/admin-media.ts` · `app/admin/(dashboard)/tours/[slug]/{page.tsx,actions.ts}` · `app/admin/(dashboard)/media/{page.tsx,actions.ts}` |
| **Bẫy** | Ảnh bìa nhập URL ngoài sẽ làm `next/image` ném lỗi runtime (xem D0) |
| **Done khi** | Sửa giá/tên → `/dat-tour` đổi ngay · đổi trạng thái "Nháp" thì biến khỏi danh sách bán · media thêm/sửa/xoá được |

> **Đã làm & kiểm chứng**
>
> - Tour editor 20 trường: tên, tagline, tóm tắt, mô tả, số ngày/đêm, 2 giá, ghi chú tuổi,
>   chính sách huỷ, dặn dò, ảnh bìa, SEO title/description, thứ tự, nổi bật + **đổi trạng thái
>   bán** bằng 3 nút (Nháp / Đang bán / Lưu trữ).
> - Ô ảnh bìa dùng `<datalist>` lấy từ media đang hoạt động + preview ảnh hiện tại.
> - Media: validate **`image` chỉ nhận `/images/...`**, `youtube` nhận http(s); tags nhập chuỗi
>   phẩy; audit `media.create|update|delete`.
> - **Chưa làm (cố ý):** lịch trình từng ngày, gallery, liên kết điểm đến/món ăn — cần form
>   quan hệ phức tạp, vẫn do seed quản lý.
> - Test: đổi tên/giá/ảnh bìa, đổi trạng thái, chặn ảnh ngoài, chặn thời lượng sai, 404,
>   ô rỗng lưu thành `NULL`.

---

### D5 · Kiểm duyệt đánh giá + xuất CSV — **đã xong**

| | |
|---|---|
| **Mục tiêu** | Duyệt/ẩn/phản hồi đánh giá; xuất đơn ra CSV mở được bằng Excel |
| **Tạo mới** | `server/reviews/admin-reviews.ts` · `lib/csv.ts` · `app/api/admin/orders/export/route.ts` · `app/admin/(dashboard)/reviews/{page.tsx,actions.ts}` |
| **Sửa** | `server/booking/admin-queries.ts` (tách `buildOrderWhere`, thêm `listAdminOrdersForExport`) · `app/admin/(dashboard)/orders/page.tsx` (nút Xuất CSV) |
| **Bẫy** | Dữ liệu khách nhập có thể bắt đầu bằng `=`, `+`, `-`, `@` → **CSV injection** trong Excel |
| **Done khi** | Duyệt đánh giá → `approvedAt` có giá trị · CSV tải về mở bằng Excel không lỗi font, không chạy công thức |

> **Đã làm & kiểm chứng**
>
> - Đánh giá: lọc 4 trạng thái + số lượng, duyệt/từ chối/ẩn, gắn nổi bật, phản hồi của admin
>   (xoá được), xoá; audit `review.status|featured|reply|delete`.
> - CSV: 13 cột, UTF-8 **BOM**, CRLF, tối đa 5000 dòng, giữ filter hiện tại; ô nguy hiểm được
>   thêm `'` để Excel không thực thi công thức (`lib/csv.ts`).
> - **Chưa làm (cố ý):** "phân công đơn" — cần cột `assignedAdminId` + migration, tách sang D7.
> - **Hệ quả đã biết:** `/admin/reviews` sẽ **rỗng** cho tới khi có kênh khách gửi (D8).
> - Test: 4 case CSV (quote/newline/BOM/injection) trong `scripts/tests/unit/csv.test.ts`, cộng các
>   case reviews/media/tour bổ sung trong `scripts/tests/admin-content.test.mts`.

---

### D6 · Phân quyền theo vai trò — **TODO (ưu tiên 1)**

**Vấn đề:** `owner / admin / editor` hiện chỉ dùng ở `/admin/users`. Một `editor` vẫn sửa
được **giá tour, chuyến, cấu hình booking** vì các trang đó chỉ kiểm tra "đã đăng nhập".

| | |
|---|---|
| **Mục tiêu** | Mọi trang/action kiểm tra **capability**, không chỉ kiểm tra đăng nhập |
| **Tạo mới** | `server/auth/permissions.ts` (`Capability`, `ROLE_MATRIX`, `can(role, cap)`) · `lib/auth/session.ts` thêm `requireCapabilityPage(cap)` · `scripts/tests/unit/permissions.test.ts` |
| **Sửa** | Toàn bộ `app/admin/(dashboard)/**/page.tsx` + `actions.ts` · `components/admin/admin-nav-links.tsx` (nhận `capabilities: string[]` thay `role`) · `admin-sidebar`/`admin-mobile-nav` (truyền capabilities) |
| **Ma trận** | xem bảng dưới |
| **Bẫy** | Ẩn menu **không phải** là phân quyền — phải chặn ở cả page và action (gõ URL trực tiếp, và gọi action bằng POST thủ công) |
| **Done khi** | `editor` mở `/admin/tours` → panel không có quyền · menu ẩn mục không đủ quyền · `admin` không vào được `/admin/users` · `owner` tất cả · unit test phủ kín ma trận |

| Capability | owner | admin | editor |
|---|:--:|:--:|:--:|
| `orders:read` (`/admin`, `/admin/orders`) | ✅ | ✅ | ✅ |
| `orders:write` (đổi trạng thái, huỷ) | ✅ | ✅ | ❌ |
| `orders:export` | ✅ | ✅ | ❌ |
| `catalog:write` (tour, giá, chuyến) | ✅ | ✅ | ❌ |
| `settings:write` | ✅ | ✅ | ❌ |
| `content:write` (media, reviews) | ✅ | ✅ | ✅ |
| `messages:read` / `messages:write` | ✅ | ✅ | ✅ |
| `users:manage` | ✅ | ❌ | ❌ |
| `audit:read` (D10) | ✅ | ❌ | ❌ |

**Triển khai gợi ý:**

```ts
// server/auth/permissions.ts — hàm thuần, không Prisma
export const CAPABILITIES = ["orders:read", "orders:write", …] as const;
export type Capability = (typeof CAPABILITIES)[number];
const MATRIX: Record<string, Capability[]> = { owner: [...], admin: [...], editor: [...] };
export function can(role: string, cap: Capability): boolean {
  return (MATRIX[role] ?? []).includes(cap);
}
```

`requireCapabilityPage(cap, nextPath)` = `requireAdminPage` + `can()`; nếu không đủ thì **render
`AccessDenied`** (đã có component) thay vì redirect — giữ nguyên pattern của `/admin/users`.
Song song thêm `requireCapabilityApi(cap)` ném `AppError("FORBIDDEN", …, 403)` để dùng cho
route handler về sau.

**Việc phụ nên gộp vào D6:** thêm `tokenVersion` vào `AdminUser` + JWT để **đổi mật khẩu/khoá
tài khoản huỷ được phiên cũ** (đang là hạn chế ở D3). Cần migration → gộp chung đợt migrate
với D7 để chỉ chạy một lần.

---

### D7 · Ghi chú nội bộ + phân công đơn — **TODO (cần migration)**

| | |
|---|---|
| **Mục tiêu** | Admin ghi chú nội bộ cho từng đơn và giao đơn cho một người phụ trách |
| **Schema** | `Order.assignedAdminId Int? @map("assigned_admin_id")` + relation `assignedAdmin AdminUser?` (`onDelete: SetNull`) + `@@index([assignedAdminId, status])` |
| **Migration** | `node scripts/with-db.mjs dev npx prisma migrate dev --name order_assignment` → `npm run db:migrate:test` (**không** dùng `npm run db:migrate` vì nó trỏ `DATABASE_URL` production) |
| **Tạo mới** | `server/booking/admin-order-notes.ts` (`updateAdminNote`, `assignOrder`) |
| **Sửa** | `server/booking/admin-dto.ts` (thêm `assignedAdmin`), `app/admin/(dashboard)/orders/[id]/page.tsx` (card "Nội bộ"), `app/admin/(dashboard)/orders/page.tsx` (filter `?assignee=me|unassigned`) |
| **Bẫy** | `adminNote` đã có trong DB + DTO nhưng **chưa có UI** — chỉ cần render, không thêm cột. Còn `assignedAdminId` là cột mới |
| **Done khi** | Ghi chú → reload còn · giao đơn → filter "của tôi" đúng · audit có `order.note` / `order.assign` · đơn không bị đổi `status` ngoài ý muốn |

> **Ghi chú thiết kế:** giữ nguyên state machine cũ; ghi chú/phân công **không** tạo dòng
> `order_status_history` (chỉ ghi `admin_audit_log`), vì lịch sử trạng thái phải phản ánh
> đúng nghiệp vụ đơn, không phải hoạt động nội bộ.

---

### D8 · Kênh khách gửi đánh giá — **TODO**

| | |
|---|---|
| **Mục tiêu** | Có dữ liệu thật cho `/admin/reviews`; đánh giá từ khách đã đi tour được gắn "đã đi tour" |
| **Tạo mới** | `lib/validation/review.ts` · `server/reviews/create-review.ts` · `app/api/reviews/route.ts` · `components/reviews/review-form.tsx` |
| **Sửa** | `app/(site)/tra-cuu-don/page.tsx` (hiện form khi đơn `completed`) |
| **Chống spam** | `rateLimit(3/10 phút/IP)` · honeypot field · `comment` 10–1000 ký tự · chỉ nhận `rating` 1–5 |
| **Xác thực** | Nếu client gửi kèm `orderCode` + `phone` khớp đơn `completed` → gắn `orderId` (DB unique) và `tourId` từ đơn ⇒ `isVerified = true`. Không khớp → 404 **cùng message** (chống dò đơn, giống B3) |
| **Bẫy** | `Review.orderId` là `@unique` → một đơn chỉ được 1 đánh giá; phải bắt `P2002` và trả lỗi thân thiện. `reviews.phone` là dữ liệu nhạy cảm: **không** trả ra ngoài DTO |
| **Done khi** | Gửi đánh giá từ trang tra cứu → `status = pending` · admin duyệt → hiện `approvedAt` · gửi lần 2 cho cùng đơn bị chặn · SĐT không lộ trong response/UI |

---

### D9 · Public đọc DB + CRUD nội dung — **TODO (lớn, tách 5 bước)**

**Vấn đề gốc:** `app/(site)/**` đọc `lib/fixtures/*`. Nếu chỉ thêm CRUD vào DB thì **sửa
không ai thấy** — đúng như đã cảnh báo khi chốt phạm vi P4.

| Bước | Việc | Done khi |
|---|---|---|
| **D9.1** | Loader DB cho `destinations` + `"use cache"` + `cacheTag` + `revalidateTag` sau khi admin lưu; **fallback fixture khi DB rỗng** | Sửa điểm đến trong admin → `/diem-den` đổi sau revalidate; DB rỗng vẫn render |
| **D9.2** | Loader cho `posts` (`/kinh-nghiem`) | Bài viết trong DB thay fixture |
| **D9.3** | Loader cho `cuisines` + `faqs` | `/am-thuc` + FAQ trang chủ đọc DB |
| **D9.4** | CRUD admin cho 4 domain (`/admin/destinations`, `/admin/posts`, `/admin/cuisines`, `/admin/faqs`) theo mẫu D4 | Tạo/sửa/xoá được, có audit |
| **D9.5** | Xoá dần `lib/fixtures/*` (trừ `site.ts` vẫn là nguồn brand) + cập nhật test | `grep "@/lib/fixtures/destinations"` = 0; build/test xanh |

**Rủi ro phải chấp nhận:** trang chủ mất `○` (static) → chuyển `ƒ` hoặc dùng `"use cache"`
+ `revalidateTag` để vẫn cache. Quyết định cache **trước** khi code, không sửa giữa đường.

**Thứ tự an toàn:** làm từng domain, mỗi domain một PR nhỏ, chạy đủ cổng
`tsc + lint + build + npm test` trước khi sang domain kế.

---

### D10 · Hoàn thiện vận hành — **TODO**

| Hạng mục | Thiết kế | Bẫy |
|---|---|---|
| **Upload ảnh** | `POST /api/admin/media/upload` (multipart) → `sharp` resize 1920 + WebP q78 → lưu trữ → tạo `Media` row | Hệ thống file trên serverless/VPS là ephemeral ⇒ **không ghi vào `public/images`** trong production. `.env` đã có `CLOUDINARY_URL` → dùng Cloudinary (hoặc S3) và lưu URL trả về |
| **Màn audit log** | `/admin/audit` (owner): lọc theo `entity`, `action`, `adminId`, khoảng ngày; read-only; phân trang | Bảng sẽ rất lớn → bắt buộc index + `take` giới hạn (đã có `@@index([entity, entityId, createdAt])`) |
| **Badge tin mới** | Truyền `unreadMessages` từ layout (đã có `countContactMessagesByStatus`) xuống `AdminNavLinks` | Nav là client component → chỉ nhận số, không tự query |
| **Đổi mật khẩu tự phục vụ** | Trang "Tài khoản của tôi" cho mọi role (không chỉ owner) | Gộp với `tokenVersion` ở D6 để đổi mật khẩu là huỷ phiên cũ |

---

### 10.7 Sơ đồ phụ thuộc

```
D0 ──▶ D1 ──▶ D2
 └──▶ D4 ──▶ D5
D3 ──┐
D5 ──┴──▶ D6 ──┬──▶ D7
               └──▶ D10 (audit, badge, upload)
D8 ──▶ (nuôi dữ liệu cho) D5
D9.1 ──▶ D9.2 ──▶ D9.3 ──▶ D9.4 ──▶ D9.5
```

- **D0 trước tất cả** — bỏ `remotePatterns` là điều kiện để `next/image` không nổ.
- **D6 trước D7/D10** — cả hai thêm trang/action mới, phải có capability sẵn để không phải sửa lại.
- **D8 độc lập**, nhưng làm sớm thì D5 mới có dữ liệu để kiểm duyệt thật.
- **D9 sau cùng** vì nó đổi kiến trúc render của storefront; không nên trộn với việc admin.

### 10.8 Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Ảnh DB cũ là URL ngoài → `next/image` ném lỗi runtime | `toLocalImage` chặn ở mọi chỗ đọc DB; grep `https://` trong `fixtures`/`seed` trước khi build |
| Admin sửa giá/chuyến khi chưa phân quyền | D6 làm trước D7; hiện tại chỉ nên cấp tài khoản `owner` cho người tin cậy |
| Migration thêm cột chạy nhầm vào production | Dùng `node scripts/with-db.mjs dev npx prisma migrate dev`; `DATABASE_URL` chỉ dùng cho `migrate deploy` khi go-live |
| `settings.booking` bị ghi đè làm mất `cancellationPolicy` | **Đã sửa** ở D2 (merge); test khoá lại |
| Xoá fixture ở D9.5 làm mất nội dung marketing đang đẹp | Làm từng domain, so sánh bằng mắt trên dev trước khi xoá; giữ fallback đến bước cuối |
| Upload ảnh ghi vào `public/` rồi mất khi deploy | Dùng Cloudinary/S3, không ghi filesystem |
| JWT cũ vẫn dùng được sau khi đổi mật khẩu | `tokenVersion` ở D6 + kiểm trong `getAdminSession()` |

### 10.9 Khối lượng ước tính

| Phase | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|
| D6 | 2 (`permissions.ts`, test) | ~20 (mọi page/action/nav) | Cơ học nhưng rộng; làm một lần |
| D7 | 2 (service, migration) | 4 | Cần migrate dev + test |
| D8 | 4 | 2 | Kèm rate limit + test route |
| D9 | 4 loader + 4 trang admin | ~12 | Chia 5 bước nhỏ, mỗi bước một cổng |
| D10 | 3 | 3 | Upload cần quyết định Cloudinary trước |

**Thứ tự thực thi: D6 → D7 → (D8 song song) → D10 → D9.**
D9 để cuối vì nó đổi kiến trúc render; D6 phải xong trước mọi thứ thêm quyền.

---

## 11. Errata — sai lệch so với các mục trước

Các điểm dưới đây **không còn đúng** như văn bản gốc ở §2–§9; đọc kèm khi làm Track D.

| Mục | Nội dung cũ | Thực tế hiện tại |
|---|---|---|
| §B1 (ghi chú) | "URL ảnh trong seed là `upload.wikimedia.org` → đã có trong `next.config.ts#images.remotePatterns`" | **Sai**: `remotePatterns` đã bị xoá ở D0. Mọi ảnh phải là `/images/*.webp`; dữ liệu DB cũ đi qua `lib/images.ts#toLocalImage` |
| §B1 (`coverImage`) | `coverImage: { src: tour.coverImageUrl, … }` | Phải bọc `toLocalImage(tour.coverImageUrl, tour.name)` — nếu không, một row còn URL ngoài sẽ làm sập trang |
| §B4 | "Trang `/admin/messages` … để phase sau" | **Đã xong** ở D3 |
| §T4 | "Tổng 111 test case" · coverage 74.31 / 90.24 / 94.56 | Hiện **144 test**, coverage đo lại ≈ 81.2 / 88.3 / 92.8 (vẫn qua gate 72 / 88 / 92) |
| §T0 | `helpers/factories.ts` là nguồn tạo dữ liệu test duy nhất | Vẫn đúng, nhưng `scripts/tests/admin-content.test.mts` tự tạo dữ liệu riêng (chuyến 2031, media, review, admin) và **khôi phục** settings/tour trong `after()` |
| §9.6 | Track C: 5 file mới | Không đổi; Track D thêm 8 trang admin + 7 service (xem §10.9) |
| §0 (quyết định 1) | "Server Actions chỉ cho form admin" | Đúng và đang giữ: **toàn bộ** admin dùng server action, trừ `/api/admin/orders*` + `/api/admin/login|logout|me` |
| Ngoài plan | — | `app/admin/login/page.tsx:16` từng ném `Blocking Route` vì `new Date()` dưới `cacheComponents`; đã bọc `"use cache"` (xem D0) |
| Ngoài plan | — | `prisma/seed.mjs` đã chạy lại trên **DB production** ngày 16/11/2026: tours/destinations/posts/faqs/media quay về nội dung seed. Nếu trước đó có sửa tay trên production thì đã bị ghi đè (không đụng `orders`, khách hàng, mật khẩu admin) |
| Ngoài plan | — | `settings.ogImage` vẫn là URL Wikimedia cũ vì `seedSettings()` chỉ update khi `SEED_FORCE_SETTINGS=1`. Biến này **không được đọc ở đâu** trong code nên không ảnh hưởng render; sẽ dọn khi D9 chuyển `seo` sang DB |

