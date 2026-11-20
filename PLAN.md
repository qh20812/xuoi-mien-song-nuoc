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
  `server/catalog/is-bookable.ts`; ngưỡng **lines 96 / branches 92 / functions 93**.
  Chỉ `is-bookable.ts` được include từ `server/catalog/` vì 3 file còn lại cần DB, không phải unit test.
- `test:coverage`: include `server/**`, `lib/**`, `app/api/**`, loại trừ `lib/fixtures/**` và
  `lib/contracts/**`; ngưỡng khoá cuối cùng **lines 80 / branches 88 / functions 92**
  (ratchet: T0 51.54/86.19/88.07 → T1 62.34/89.73/92.53 → T2 72.14/89.99/94.25 →
  T3+T4 74.31/90.24/94.56 → **D8 82.12/88.22/94.09**). Script đã gộp đủ 12 suite/glob,
  chạy được từ T2.

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
- [x] **D6** Phân quyền theo vai trò (owner / admin / editor)
- [x] **D7** Ghi chú nội bộ + phân công đơn (+ `tokenVersion`)
- [x] **D8** Kênh khách gửi đánh giá
- [x] **D9** Public đọc DB + CRUD điểm đến/bài viết/món ăn/FAQ
  - [x] **D9.1** Schema/migration/seed/mapper thuần (`Post.topic`, `relatedTourCodes`, `checklist`, `isFeatured`; `Faq.placement`)
  - [x] **D9.2** Điểm đến — loader + `/diem-den/[slug]` + admin CRUD + cache
  - [x] **D9.3** Bài viết — loader + admin CRUD + featured theo DB
  - [x] **D9.4** Món ăn — loader + admin CRUD + home/tour detail
  - [x] **D9.5** FAQ — loader + admin CRUD + home/liên hệ theo `placement`
  - [x] **D9.6** Xoá fixture domain + docs + ratchet coverage
- [x] **D10** Hoàn thiện vận hành
  - [x] **D10.1** Badge tin mới chưa đọc
  - [x] **D10.2** Đổi mật khẩu tự phục vụ + buộc đăng nhập lại
  - [x] **D10.3** Màn audit log + migration index
  - [x] **D10.4** Upload ảnh Cloudinary + chính sách URL ảnh

### Track E — Deploy Vercel → chi tiết ở §12

- [ ] **E0** Chốt mã nguồn + migration production (push, backup, `migrate deploy`, `status`)
- [ ] **E1** Project Vercel — Root `sources`, env Build/Runtime, Node 22, DB preview riêng
- [x] **E2** Upload ≤4.5 MB — nén client + trần server 4 MB + `maxDuration`
- [x] **E3** Job định kỳ — service dùng chung, `/api/jobs/*`, `CRON_SECRET`, `vercel.json`
- [ ] **E4** Connection pool + rate limit phân tán (hoặc chấp nhận có ghi chú)
- [ ] **E5** Preview deploy + smoke public/booking/admin/media/cron
- [ ] **E6** Production cutover + đổi mật khẩu admin/hotline + rollback plan
- [ ] **E7** Docs + `.vercelignore` + `metadataBase` + dọn assets

### Điều kiện chặn

- [x] DB dev dùng cho smoke test (`DEV_DATABASE_URL` + `scripts/with-db.mjs dev`)
- [x] `TEST_DATABASE_URL` trỏ DB test riêng, đã `db:migrate:test` + `db:seed:test`
- [x] Migration D7 (`token_version`, `assigned_admin_id`) đã áp lên **production** ngày 19/11/2026
- [x] Local dev dùng `npm run dev:local` (DB dev), không dùng `npm run dev` (production)

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
npm run build               → xanh
npm test                    → 224/224
npm run test:coverage       → exit 0 (all files 86.75 / 88.62 / 93.91; gate 84 / 88 / 92)
```

D10 sẽ thêm 2 route admin (`/admin/audit`, `/admin/account`) và mở rộng
`/admin/media` bằng upload Cloudinary.

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

### D6 · Phân quyền theo vai trò — **đã xong**

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
tài khoản huỷ được phiên cũ** (đang là hạn chế ở D3). Cần migration → **dời sang D7** để chỉ
chạy một đợt migrate duy nhất.

> **Đã làm & kiểm chứng**
>
> - `server/auth/permissions.ts` — 10 capability × 3 vai trò, hàm thuần: `can`,
>   `capabilitiesFor`, `isCapability`, `isAdminRoleValue`. Role lạ / `null` / `""` ⇒ **0 quyền**.
> - `lib/auth/session.ts` — 3 helper theo đúng ngữ cảnh:
>   `requireCapabilityPage` trả `null` để page render `<AccessDenied />` (không redirect ngầm);
>   `requireCapabilityAction` redirect `/admin?denied=1`; `requireCapabilityApi` ném
>   `AppError("FORBIDDEN", …, 403)`. `requireAdminApi` chuyển từ `BookingError` sang `AppError`
>   cho đồng nhất.
> - Gắn quyền cho **23 file** page/action/nav (gồm layout + 3 component menu) và **3 route API**
>   (`GET /orders`, `GET|PATCH /orders/[id]`, `/orders/export`). Dashboard có băng cảnh báo
>   khi bị chặn qua `?denied=1`.
> - `scripts/tests/unit/permissions.test.ts` (6 case) khoá ma trận: owner đủ 10 capability;
>   admin thiếu `users:manage` + `audit:read`; editor **không** có `catalog:write`,
>   `orders:write`, `orders:export`, `settings:write`, `users:manage`.
> - Kiểm chứng end-to-end trên **test DB** bằng tài khoản `editor` thật:
>   menu ẩn "Tour & chuyến", "Tài khoản", "Cấu hình"; `/admin/tours`, `/admin/settings`,
>   `/admin/users` render panel chặn và **không lộ form**; `GET /api/admin/orders/export` → **403
>   FORBIDDEN**; `PATCH /api/admin/orders/1` → **403**. Với `owner`: export → 200 `text/csv`.
> - Cổng: `tsc` ✅ · `lint` 0 warning · `build` **50 route** · `npm test` **150/150** ·
>   `test:coverage` exit 0 (**80.8 / 88.5 / 92.9**; `permissions.ts` 98.75 / 96.55 / 93.75).
> - **Chưa làm:** `tokenVersion` — dời sang D7 như ghi chú trên.

---

### D7 · Ghi chú nội bộ + phân công đơn — **đã xong**

| | |
|---|---|
| **Mục tiêu** | Admin ghi chú nội bộ cho từng đơn và giao đơn cho một người phụ trách |
| **Schema** | `Order.assignedAdminId Int? @map("assigned_admin_id")` + relation `assignedAdmin AdminUser?` (`onDelete: SetNull`) + `@@index([assignedAdminId, status])` |
| **Migration** | Sinh SQL bằng `node scripts/with-db.mjs dev npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`, lưu vào `prisma/migrations/<ts>_order_assignment/migration.sql`, rồi `npm run db:migrate:dev` + `npm run db:migrate:test` (**không** dùng `npm run db:migrate` vì nó trỏ `DATABASE_URL` production) |
| **Tạo mới** | `server/booking/admin-order-notes.ts` (`updateAdminNote`, `assignOrder`) |
| **Sửa** | `server/booking/admin-dto.ts` (thêm `assignedAdmin`), `app/admin/(dashboard)/orders/[id]/page.tsx` (card "Nội bộ"), `app/admin/(dashboard)/orders/page.tsx` (filter `?assignee=me|unassigned`) |
| **Bẫy** | `adminNote` đã có trong DB + DTO nhưng **chưa có UI** — chỉ cần render, không thêm cột. Còn `assignedAdminId` là cột mới |
| **Done khi** | Ghi chú → reload còn · giao đơn → filter "của tôi" đúng · audit có `order.note` / `order.assign` · đơn không bị đổi `status` ngoài ý muốn |

> **Ghi chú thiết kế:** giữ nguyên state machine cũ; ghi chú/phân công **không** tạo dòng
> `order_status_history` (chỉ ghi `admin_audit_log`), vì lịch sử trạng thái phải phản ánh
> đúng nghiệp vụ đơn, không phải hoạt động nội bộ.

> **Đã làm & kiểm chứng**
>
> - Migration `20261118090000_order_assignment`: `orders.assigned_admin_id` (+ index
>   `(assigned_admin_id, status)`, FK `ON DELETE SET NULL`) và `admin_users.token_version`.
>   Sinh SQL bằng `prisma migrate diff` rồi `migrate deploy` trên **dev** và **test** —
>   tránh `migrate dev` vì cần shadow database trên Aiven.
> - `server/booking/admin-order-notes.ts`: `updateOrderAdminNote` (trim, rỗng ⇒ `NULL`, tối đa
>   2000 ký tự), `assignOrder` (chặn tài khoản không tồn tại / đã khoá, **idempotent** khi gán
>   lại cùng người), `listAssignableAdmins`. Tất cả chỉ ghi `admin_audit_log`
>   (`order.note`, `order.assign`), **không** đụng `status`.
> - DTO/truy vấn: chi tiết đơn có `assignedAdmin`; danh sách có `assignee` + filter
>   `?assignee=me|unassigned` (kèm `viewerId`); export CSV nhận cùng filter để file khớp màn hình.
> - UI chi tiết đơn: card **"Nội bộ"** — select người phụ trách + textarea ghi chú. Chỉ hiện
>   form khi có `orders:write`; role chỉ đọc thấy dạng văn bản.
> - `tokenVersion` (món nợ từ D6): JWT mang claim `tv`; `getAdminSession` so với DB và lấy
>   **`role` từ DB** (hạ quyền có hiệu lực ngay, không chờ hết phiên); `resetAdminPassword` và
>   thao tác khoá tài khoản đều `tokenVersion++`.
> - Test +6 case (tổng suite nội dung 31): ghi chú trim/không đổi status/audit; phân công +
>   idempotent + bỏ giao + lọc `me`/`unassigned`; chặn 404 và tài khoản đã khoá;
>   `listAssignableAdmins` bỏ tài khoản inactive; kẹp `pageSize` + export + `countOrdersByStatus`;
>   `tokenVersion` tăng khi reset mật khẩu và khi khoá.
> - Kiểm chứng end-to-end trên **test DB**: chi tiết đơn render "Ghi chú nội bộ" / "Người phụ
>   trách" / nút lưu; `?assignee=unassigned` chứa đơn chưa giao; sau khi bump `tokenVersion`,
>   `GET /api/admin/me` trả **401** và `/admin` **không render dashboard** (chỉ còn chỉ dẫn
>   chuyển tới `/admin/login`); đăng nhập lại → 200.
> - Cổng: `tsc` ✅ · `lint` 0 warning · `build` **50 route** · `npm test` **156/156** ·
>   `test:coverage` exit 0 (**81.8 / 88.0 / 93.8**).
> - **Bắt buộc khi deploy:** migration mới phải chạy trên production **trước** khi deploy code.
>   Lần đầu bị bỏ sót: production thiếu `20261118090000_order_assignment` → admin login ném
>   `P2022 token_version does not exist`. Đã backup 2 bảng bị ảnh hưởng
>   (`admin_users`, `orders`) và áp `prisma migrate deploy` trên `xuoi_mien_song_nuoc_db`
>   ngày **19/11/2026**; `migrate status` hiện `up to date`.
> - **Local dev:** không dùng `npm run dev` (trỏ production). Dùng `npm run dev:local` —
>   script override `DATABASE_URL` bằng `DEV_DATABASE_URL` trước khi spawn Next.js.
>   `lib/prisma.ts` in cảnh báo nếu dev server vẫn trỏ production.

---

### D8 · Kênh khách gửi đánh giá — **đã xong**

| | |
|---|---|
| **Mục tiêu** | Có dữ liệu thật cho `/admin/reviews`; đánh giá từ khách đã đi tour được gắn "đã đi tour" |
| **Tạo mới** | `lib/validation/review.ts` · `server/reviews/create-review.ts` · `app/api/reviews/route.ts` · `components/reviews/review-form.tsx` |
| **Sửa** | `app/(site)/tra-cuu-don/page.tsx` (hiện form khi đơn `completed`) |
| **Chống spam** | `rateLimit(3/10 phút/IP)` · honeypot field · `comment` 10–1000 ký tự · chỉ nhận `rating` 1–5 |
| **Xác thực** | Nếu client gửi kèm `orderCode` + `phone` khớp đơn `completed` → gắn `orderId` (DB unique) và `tourId` từ đơn ⇒ `isVerified = true`. Không khớp → 404 **cùng message** (chống dò đơn, giống B3) |
| **Bẫy** | `Review.orderId` là `@unique` → một đơn chỉ được 1 đánh giá; phải bắt `P2002` và trả lỗi thân thiện. `reviews.phone` là dữ liệu nhạy cảm: **không** trả ra ngoài DTO |
| **Done khi** | Gửi đánh giá từ trang tra cứu → `status = pending` · admin duyệt → hiện `approvedAt` · gửi lần 2 cho cùng đơn bị chặn · SĐT không lộ trong response/UI |

> **Đã làm & kiểm chứng**
>
> - Nguồn: `lib/validation/review.ts` (rating 1–5, comment 10–1000, `orderCode`/`phone`/`tourSlug`
>   tuỳ chọn, honeypot `website`) · `server/reviews/create-review.ts` ·
>   `app/api/reviews/route.ts` (3 req/10 phút/IP + `readJsonLimited` + `handleApiError`) ·
>   `components/reviews/review-form.tsx` + adapter `lib/reviews/client.ts`.
> - **Sai lệch nhỏ so với plan:** form được render trong `components/lookup/order-lookup.tsx`
>   (chỉ khi `order.status === "completed"` và đã có credentials tra cứu thay vì sửa
>   `app/(site)/tra-cuu-don/page.tsx`. Trang đó là server component, không biết trạng thái đơn;
>   đặt form cạnh state tra cứu là chỗ duy nhất có `order` + `phone` đã xác thực.
> - Xác thực: `orderCode + phone` khớp đơn `completed` → gắn `orderId` + `tourId` ⇒
>   `isVerified = true`. Sai mã, sai SĐT **hoặc** đơn chưa `completed` đều trả cùng
>   `404 ORDER_NOT_FOUND` với cùng message (chống dò đơn). Không gửi kèm → đánh giá chung
>   (hoặc theo `tourSlug`).
> - Một đơn một đánh giá: pre-check `review.findUnique({ where: { orderId } })` trả
>   `409 REVIEW_EXISTS` trước khi insert (tránh `prisma:error` cho thao tác bình thường);
>   vẫn giữ nhánh bắt `P2002` cho race.
> - `reviews.phone` chỉ lưu để đối soát. `AdminReviewRow` không select/không trả `phone`;
>   response API chỉ `{ ok: true }` (không `id`, không SĐT).
> - Test: `scripts/tests/unit/review-validation.test.ts` (7 case schema) +
>   `scripts/tests/reviews-route.test.mts` (8 case route, DB test) — phủ completed/gắn
>   `orderId`/`isVerified`, chống dò đơn, đơn chưa completed, gửi lần 2 → 409, honeypot,
>   validate rating/comment, đánh giá chung, rate limit.
> - `package.json`: thêm `test:reviews`, gộp vào `npm test` + `test:coverage`.
>   Tổng **171 test case**.
> - Cổng: `tsc` ✅ · `lint` 0 warning · `build` xanh (có `/api/reviews`) · `npm test`
>   **171/171** · coverage **82.12 / 88.22 / 94.09** → ratchet gate full **80 / 88 / 92**,
>   unit **96 / 92 / 93** (đo 98.31 / 94.42 / 95.24).
> - Copy `/admin/reviews` đã bỏ câu "chưa có form gửi đánh giá công khai"; mô tả mới nói rõ
>   nguồn đánh giá và huy hiệu "đã đi tour".

---

### D9 · Public đọc DB + CRUD nội dung — **đã xong**

**Vấn đề gốc:** `app/(site)/**` đọc `lib/fixtures/*`. Nếu chỉ thêm CRUD vào DB thì **sửa
không ai thấy** — đúng như đã cảnh báo khi chốt phạm vi P4.

**Đã kiểm tra lại repo trước khi chốt kế hoạch:**

- `/diem-den/[slug]` **không tồn tại**, dù mọi card và home đều link tới → đang 404.
- `Post` thiếu `topic`, `relatedTourCodes`, `checklist`, `isFeatured`; `post-catalog` đang
  hardcode `featuredPostSlug`.
- `Faq` không có cột đánh dấu hiển thị; `/lien-he` đang so khớp **nguyên văn câu hỏi**.
- `lib/fixtures/home.ts` chứa bản sao destinations/cuisines/faqs của trang chủ;
  `lib/fixtures/tour-details.ts` chứa bản sao destinations/cuisines của trang tour.
- Chưa có loader nào dùng `"use cache"` / `cacheTag`; toàn bộ nội dung public đang đồng bộ.

#### D9.0 · Quyết định đã chốt

| # | Quyết định | Chốt |
|---|---|---|
| 1 | Metadata bài viết | **Migration** thêm `Post.topic`, `Post.relatedTourCodes`, `Post.checklist`, `Post.isFeatured` (không nhét vào `tags`) |
| 2 | FAQ hiển thị ở đâu | **Migration** thêm `Faq.placement` (`home \| contact \| both \| null`); không lạm dụng `category`, không so khớp text |
| 3 | DB rỗng | D9.2–D9.5 tạm fallback fixture để so sánh mắt; **D9.6 bỏ fallback**, DB rỗng → empty state |
| 4 | Phạm vi public | **Cả home + `/tour/[slug]` + `/lien-he`**, không chỉ 3 trang listing |
| 5 | Trang chi tiết điểm đến | **Thêm `/diem-den/[slug]`** ngay D9.2 (fix 404 sẵn có) |
| 6 | Quan hệ tour ↔ điểm đến/món ăn | **Checkbox chọn tour published** trong form admin |
| 7 | Quyền 4 màn CRUD | **`content:write`** cho cả 4 (editor cũng quản lý được) |
| 8 | Cache | **`"use cache"` + `cacheLife("max")` + `cacheTag`**, `updateTag` trong server action sau mutation |
| 9 | Thứ tự | **Vertical slice theo domain**: loader + admin CRUD + cache + test trong cùng một bước |
| 10 | Slug | **Bất biến sau khi tạo**; không có redirect 301 trong D9 |
| 11 | Ảnh thiếu/null | Post: ảnh fallback nội bộ + admin bắt buộc `/images/*`; home destination: lọc bỏ khỏi section nếu không có ảnh; `/diem-den` dùng placeholder sẵn có |
| 12 | Test/coverage | Test **ngay trong từng slice**; cuối D9.6 đo lại và ratchet, không dồn test về cuối |

**Ngoài phạm vi D9:** lịch trình từng ngày, gallery tour, quan hệ tour ↔ post ngoài
`relatedTourCodes`, redirect khi đổi slug, upload ảnh (D10).

#### D9.1 · Nền dữ liệu (chặn tất cả)

| | |
|---|---|
| **Schema** | `Post.topic String? @db.VarChar(40)` · `Post.relatedTourCodes Json?` · `Post.checklist Json?` · `Post.isFeatured Boolean @default(false) @map("is_featured")` · `Faq.placement String? @db.VarChar(20)` |
| **Migration** | Sinh SQL bằng `node scripts/with-db.mjs dev npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`, lưu `prisma/migrations/<ts>_content_metadata/migration.sql`; chạy `npm run db:migrate:dev` + `npm run db:migrate:test` (**không** dùng `npm run db:migrate` vì trỏ production) |
| **Seed** | `prisma/seed.mjs`: thêm `topic`/`relatedTourCodes`/`checklist`/`isFeatured` cho 3 bài viết; thêm 4 FAQ `placement = home`; đánh `placement = contact` cho 4 FAQ liên hệ; giữ 8 FAQ chủ đề |
| **Mapper thuần** | `lib/content/mappers.ts` hoặc mapper theo domain: DB row → contract (`Decimal`→number, JSON→array, category whitelist, `toLocalImage`, `publishedAt`→ISO, fallback ảnh) |
| **Test** | Unit mapper: category lạ, `lat/lng` null, `tags` không phải array, `checklist` sai kiểu, ảnh ngoài `/images` |
| **Done khi** | `tsc/lint/build` xanh · `npm test` cũ vẫn xanh · dev + test DB đã migrate/seed |

> **Đã làm & kiểm chứng**
>
> - Migration `20261120100000_content_metadata`: thêm `posts.topic`, `posts.related_tour_codes`,
>   `posts.checklist`, `posts.is_featured`, `faqs.placement`. Đã `migrate deploy` trên **dev**,
>   **test** và **production** (20/11/2026, trước D9.3 vì public posts cần cột mới; đã backup
>   `posts`/`faqs`/`_prisma_migrations`, cập nhật metadata 3 bài viết production).
> - Seed: 3 bài viết có `topic`/`relatedTourCodes`/`checklist`/`isFeatured`; 12 FAQ
>   (4 `placement = contact`, 4 `placement = home`, 4 chủ đề còn lại `null`).
> - `lib/content/mappers.ts` — mapper thuần cho Destination/Post/Cuisine/FAQ:
>   `Decimal`→number, JSON→string[], category/topic/placement whitelist, `toLocalImage`,
>   `publishedAt`→ISO, ảnh fallback cho post.
> - Tách `lib/destinations/categories.ts` (`CATEGORY_GROUPS`, `CATEGORY_LABELS`,
>   `normalizeDestinationCategory`, `groupFor`); `lib/destinations/listing.ts` re-export
>   `CATEGORY_GROUPS` để component cũ không phải sửa.
> - Thêm `lib/contracts/faq.ts` (`FaqRecord`, `PublicFaqRecord`, `FaqPlacement`);
>   `lib/fixtures/faqs.ts` import lại type thay vì tự định nghĩa.
> - Test `scripts/tests/unit/content-mappers.test.ts` (10 case): category lạ, Decimal/string/null,
>   ảnh ngoài `/images`, tags/checklist sai kiểu, topic/placement fallback, publishedAt hỏng.
> - Cổng: `tsc` ✅ · `lint` ✅ · `build` ✅ · `npm test` **181/181** ·
>   `test:coverage` **83.38 / 88.43 / 93.87** (gate 80/88/92).
> - Kiểm tra DB dev: 3 post đúng metadata, FAQ `home=4 / contact=4 / null=4`.

#### D9.2 · Điểm đến (vertical slice)

| | |
|---|---|
| **Tạo mới** | `server/content/public-destinations.ts` (`listPublicDestinations`, `getPublicDestinationBySlug`, `listDestinationsForTour`) · `server/content/admin-destinations.ts` · `app/admin/(dashboard)/destinations/{page.tsx,actions.ts}` · `app/admin/(dashboard)/destinations/[id]/page.tsx` · `app/(site)/diem-den/[slug]/page.tsx` |
| **Sửa** | `lib/destinations/listing.ts` (bỏ fixture, giữ `CATEGORY_GROUPS` + mapper) · `app/(site)/diem-den/page.tsx` · `app/(site)/page.tsx` + `components/home/destinations-section.tsx` (nhận DB top 4) · `app/(site)/tour/[slug]/page.tsx` + `components/tour-detail/tour-destinations.tsx` (lấy DB) · `components/admin/admin-nav-links.tsx` |
| **Loader** | `"use cache"` + `cacheLife("max")` + `cacheTag("content:destinations")`; filter `status = published`; order `sortOrder`; tourRefs qua `TourDestination` + `Tour.status = published` |
| **Admin** | List + tạo + sửa + xoá; slug bất biến; `status` draft/published; chọn tour liên kết; audit `destination.create\|update\|delete`; `updateTag` sau mutation |
| **Trang chi tiết** | Ảnh bìa, tên, tỉnh, nhóm, mô tả, mùa đẹp, ghi chú di chuyển, tour liên quan; `generateMetadata`; `generateStaticParams` async; `instant = false` |
| **Test** | Loader (published/order/tourRefs/empty) + admin service (create/update/delete/trùng slug/audit/404) + mapper |
| **Done khi** | Sửa điểm đến trong admin → `/diem-den`, `/diem-den/[slug]`, home, tour detail đổi ngay; draft biến khỏi public; xoá → 404; DB rỗng → empty state |

> **Đã làm & kiểm chứng**
>
> - **Loader:** `server/content/destinations-query.ts` (query thô, testable không cần Next runtime)
>   + `server/content/public-destinations.ts` (`"use cache"`, `cacheLife("max")`,
>   `cacheTag("content:destinations")`). Query chỉ lấy `status = published`, order
>   `sortOrder/name`, `tourRefs` qua `TourDestination` + tour published.
> - **Public:** `/diem-den` chuyển sang server loader + empty state; **thêm mới**
>   `/diem-den/[slug]` với ảnh bìa, mô tả, mùa đẹp, ghi chú, toạ độ, tour liên quan,
>   `generateMetadata` + `generateStaticParams`. Home lấy top 4 điểm đến có ảnh; tour detail
>   lấy điểm đến theo `TourDestination`. `DestinationCatalog` thêm section "Điểm đến khác"
>   để điểm đến do admin tạo vẫn hiện trong layout mặc định.
> - **Admin:** `server/content/admin-destinations.ts` — list/create/update/delete, slug bất biến,
>   validate slug/name/province/category/status/sort/ảnh/lat/lng, chặn tour không published,
>   audit `destination.create|update|delete` trong transaction. UI
>   `/admin/destinations` + `/admin/destinations/[id]`, form dùng datalist media và checkbox tour;
>   action gọi `updateTag("content:destinations")`.
> - **Tests:** `scripts/tests/content-destinations.test.mts` (11 case) phủ loader published/draft/order/
>   tourRefs/home, CRUD + audit + slug trùng + 404 + FK + validation. Tổng `npm test` **192/192**.
> - **Coverage:** **84.36 / 88.72 / 93.68** (gate 80/88/92). Loại `server/content/public-*.ts`
>   khỏi coverage vì `cacheLife/cacheTag` chỉ chạy trong Next runtime; query + admin service vẫn
>   được phủ.
> - **Live verify (dev:local):** `/diem-den` và `/diem-den/cho-noi-cai-rang` 200, có tên điểm đến;
>   `/admin/destinations` và `/admin/destinations/1` 200; log không có Instant/Blocking/unstable.
> - **Build:** `/diem-den` là `○`; các slug seed của `/diem-den/[slug]` là `○`, slug mới rơi vào
>   `◐` và render theo request.
> - **Sai lệch nhỏ:** không dùng fallback fixture (D9.0 dự kiến tạm); DB rỗng → empty state ngay,
>   đúng “Done khi” của D9.2 và tránh hiển thị nội dung cũ sau khi admin xoá hết.

#### D9.3 · Bài viết (vertical slice)

| | |
|---|---|
| **Tạo mới** | `server/content/public-posts.ts` · `server/content/admin-posts.ts` · `app/admin/(dashboard)/posts/{page.tsx,actions.ts}` · `app/admin/(dashboard)/posts/[id]/page.tsx` |
| **Sửa** | `lib/posts/listing.ts` (bỏ fixture; `POST_TOPICS` giữ nguyên) · `lib/posts/detail.ts` (nhận dữ liệu, không tự đọc module) · `components/posts/post-catalog.tsx` (featured theo `isFeatured`) · `/kinh-nghiem/page.tsx` · `/kinh-nghiem/[slug]/page.tsx` |
| **Loader** | Chỉ `status = published` và `publishedAt <= now`; order `publishedAt desc`; map `topic`, `tags`, `checklist`, `relatedTourCodes`; tour liên quan qua code + `Tour.status = published`; `generateStaticParams` async |
| **Admin** | Tạo/sửa/xoá; slug bất biến; `category = kinh-nghiem` cố định; tags nhập phẩy; related codes nhập phẩy; checklist mỗi dòng một mục; status draft/published; `publishedAt`; SEO; `isFeatured`; ảnh bìa qua `<datalist>` media; audit `post.create\|update\|delete`; `updateTag("content:posts")` |
| **Test** | Loader (draft/ẩn, order, tags/checklist, related tours) + admin service + mapper |
| **Done khi** | Sửa tiêu đề/nội dung trong admin → `/kinh-nghiem` + detail đổi ngay; draft không hiện; featured đúng bài được tick |

> **Đã làm & kiểm chứng**
>
> - **Loader:** `server/content/posts-query.ts` (query thô) + `server/content/public-posts.ts`
>   (`"use cache"`, `cacheLife("max")`, `cacheTag("content:posts")`). Chỉ lấy
>   `status = published`, `publishedAt <= now`, order `publishedAt desc/createdAt desc`.
>   `queryToursForPost` lọc tour `published`, giữ thứ tự mã; type CTA thu gọn
>   (`PostRelatedTour`) để không phải giả lập `TourDetailData`.
> - **Public:** `/kinh-nghiem` và `/kinh-nghiem/[slug]` async loader; `generateStaticParams`
>   async; bài nổi bật chọn theo `isFeatured`; empty state khi DB rỗng.
> - **Refactor:** `lib/posts/listing.ts` chỉ còn `POST_TOPICS` + `toPostListingData`;
>   `lib/posts/detail.ts` chỉ còn parse article/related-posts thuần. `PostRecord` thêm
>   `isFeatured?`, `PostRelatedTour`.
> - **Admin:** `server/content/admin-posts.ts` — list/create/update/delete, slug bất biến,
>   validate slug/title/topic/status/ngày/ảnh/tags/related/checklist/SEO, audit
>   `post.create|update|delete`. UI `/admin/posts` + `/admin/posts/[id]`, form đầy đủ,
>   datalist media + mã tour; action gọi `updateTag("content:posts")`.
> - **Tests:** `scripts/tests/content-posts.test.mts` (9 case): published/future/draft/order,
>   related posts, tour published, CRUD + audit + slug trùng + validation + 404. Tổng
>   `npm test` **201/201**.
> - **Coverage:** **85.57 / 88.27 / 93.69** (gate 80/88/92).
> - **Live verify (dev:local):** `/kinh-nghiem`, `/kinh-nghiem/mua-nao-di-u-minh-ha-dep-nhat`,
>   `/admin/posts`, `/admin/posts/1` đều 200; log không có Instant/Blocking/unstable.
> - **Build:** `/kinh-nghiem` là `○`; 3 slug seed của `/kinh-nghiem/[slug]` là `○`, slug mới
>   rơi vào `◐`.
> - **Production:** đã backup `posts`/`faqs`/`_prisma_migrations` vào
>   `%TEMP%\xmsn-content-backup-*`, áp migration D9.1 và cập nhật metadata 3 bài viết
>   (topic/related/checklist/isFeatured). FAQ production vẫn để D9.5 xử lý.

#### D9.4 · Món ăn (vertical slice)

| | |
|---|---|
| **Tạo mới** | `server/content/public-cuisines.ts` · `server/content/admin-cuisines.ts` · `app/admin/(dashboard)/cuisines/{page.tsx,actions.ts}` · `app/admin/(dashboard)/cuisines/[id]/page.tsx` |
| **Sửa** | `lib/cuisines/listing.ts` (bỏ fixture) · `lib/cuisines/detail.ts` (nhận dữ liệu) · `/am-thuc/page.tsx` · `/am-thuc/[slug]/page.tsx` · `components/home/cuisine-section.tsx` + `app/(site)/page.tsx` (DB top N) · `components/tour-detail/tour-cuisines.tsx` + `/tour/[slug]` (DB) |
| **Loader** | Order `sortOrder`; tourRefs qua `TourCuisine` + tour published; `imageUrl` qua `toLocalImage`; `description` null → chuỗi rỗng |
| **Admin** | Tạo/sửa/xoá; slug bất biến; chọn tour liên kết; ảnh `/images/*`; audit `cuisine.create\|update\|delete`; `updateTag("content:cuisines")` |
| **Test** | Loader + admin service + mapper |
| **Done khi** | Sửa món trong admin → `/am-thuc`, detail, home, tour detail đổi ngay; xoá → 404 |

> **Đã làm & kiểm chứng**
>
> - **Loader:** `server/content/cuisines-query.ts` + `server/content/public-cuisines.ts`
>   (`"use cache"`, `cacheLife("max")`, `cacheTag("content:cuisines")`). Order
>   `sortOrder asc, name asc`; `tourRefs` qua `TourCuisine` + tour published; `imageUrl` qua
>   `toLocalImage`; `description`/`whereToEat`/`province` null → `""` cho listing và `null` cho
>   `CuisineData` (home/tour). Thêm `toCuisineData` vào `lib/content/mappers.ts`.
> - **Public:** `/am-thuc` và `/am-thuc/[slug]` async loader; `generateStaticParams` async; empty
>   state khi DB rỗng; related dùng `getRelatedCuisines(cuisine, all)`;
>   `getToursForCuisine(cuisine, tourDetails)` vẫn lấy lịch trình từ fixture (D9.6 mới dọn nốt).
> - **Home/tour detail:** `listHomeCuisines(6)` thay `homePageData.cuisines`; `TourCuisines` nhận
>   `cuisines` từ `listCuisinesForTour` thay vì `tour.cuisines`.
> - **Admin:** `server/content/admin-cuisines.ts` + `/admin/cuisines` (list/create/edit/delete),
>   form có checkbox tour, datalist ảnh, slug bất biến; audit `cuisine.create|update|delete`;
>   action gọi `updateTag("content:cuisines")`; menu admin thêm "Món ăn".
> - **Tests:** `content-cuisines.test.mts` (9 case) + unit `cuisines-listing` + mapper
>   `toCuisineData`. Tổng `npm test` **212/212**.
> - **Coverage:** **86.29 / 88.42 / 93.59** (gate 80/88/92).
> - **Build:** `/am-thuc` là `○`; các slug seed của `/am-thuc/[slug]` là `○`, slug mới rơi `◐`.
> - **Live verify (dev:local):** `/am-thuc`, `/am-thuc/lau-mam-u-minh`, `/`,
>   `/tour/sai-gon-can-tho-u-minh-ha-dat-mui-4n3d`, `/admin/cuisines`, `/admin/cuisines/1` đều
>   200; admin list/edit render đúng dữ liệu; log không có Blocking/unstable mới (cảnh báo
>   `new Date()` ở `getBookableDepartures` của `/tour/[slug]` là có sẵn, ngoài phạm vi D9.4).

#### D9.5 · FAQ (vertical slice)

| | |
|---|---|
| **Tạo mới** | `server/content/public-faqs.ts` (`listHomeFaqs`, `listContactFaqs`) · `server/content/admin-faqs.ts` · `app/admin/(dashboard)/faqs/{page.tsx,actions.ts}` · `app/admin/(dashboard)/faqs/[id]/page.tsx` |
| **Sửa** | `app/(site)/page.tsx` (home FAQ từ DB) · `app/(site)/lien-he/page.tsx` (bỏ `CONTACT_QUESTIONS` + so khớp text) · `components/contact/contact-faq.tsx` (type từ `lib/contracts`, không từ fixture) |
| **Loader** | Filter `isActive`; home `placement in (home, both)`; contact `placement in (contact, both)`; order `sortOrder`; `"use cache"` + `cacheTag("content:faqs")` |
| **Admin** | Tạo/sửa/xoá; câu hỏi, trả lời, `category` chủ đề, `placement`, `sortOrder`, `isActive`; audit `faq.create\|update\|delete`; `updateTag("content:faqs")` |
| **Test** | Placement/active/order + admin service |
| **Done khi** | Sửa FAQ trong admin → home + `/lien-he` đổi ngay; tắt `isActive` thì biến mất; không còn phụ thuộc text câu hỏi |

> **Đã làm & kiểm chứng**
>
> - **Loader:** `server/content/faqs-query.ts` + `server/content/public-faqs.ts`
>   (`"use cache"`, `cacheLife("max")`, `cacheTag("content:faqs")`). Chỉ lấy `isActive = true`;
>   home `placement in (home, both)`, contact `placement in (contact, both)`; order
>   `sortOrder asc, id asc`; map qua `toPublicFaqRecord`.
> - **Public:** `app/(site)/page.tsx` dùng `listHomeFaqs()`; `/lien-he` dùng
>   `listContactFaqs()`, bỏ `CONTACT_QUESTIONS` và so khớp nguyên văn câu hỏi.
>   `ContactFaq` nhận `PublicFaqRecord[]` từ `lib/contracts/faq`, có empty state khi DB rỗng;
>   `FaqSection` vẫn tự ẩn khi không có câu hỏi.
> - **Admin:** `server/content/admin-faqs.ts` + `/admin/faqs` (list/create/edit/delete);
>   form câu hỏi, trả lời, chủ đề, vị trí (`home | contact | both | không đặt`), thứ tự,
>   `isActive`; audit `faq.create|update|delete`; action gọi `updateTag("content:faqs")`.
>   Thêm `lib/content/faq-options.ts` (6 chủ đề + nhãn vị trí) và menu admin "FAQ".
> - **Tests:** `content-faqs.test.mts` (8 case): placement/active/order, CRUD + audit,
>   tắt active biến khỏi public, validate, 404. Thêm unit `faq-options`. Tổng
>   `npm test` **222/222**.
> - **Coverage:** **86.73 / 88.53 / 93.86** (gate 80/88/92).
> - **Build:** `/lien-he` là `○`; `/admin/faqs` là `ƒ`, `/admin/faqs/[id]` là `◐`.
> - **Live verify (dev:local):** `/` có 4 FAQ trang chủ; `/lien-he` có FAQ liên hệ và
>   **không** lộ câu hỏi home-only ("Đón khách ở đâu?"); `/admin/faqs` list + form và
>   `/admin/faqs/25` render đúng; log không có Blocking/unstable/prod warning.
> - **Production:** đã backup `faqs` vào `%TEMP%\xmsn-faq-backup-*`, gán `placement = contact`
>   cho 5 câu hỏi liên hệ cũ và thêm 4 FAQ `placement = home` (sort 9–12). Tổng 12 FAQ,
>   khớp seed dev/test; 3 câu chủ đề còn lại vẫn `placement = null`.

#### D9.6 · Dọn fixture + docs + khoá coverage

| | |
|---|---|
| **Xoá** | `lib/fixtures/{destinations,posts,cuisines,faqs}.ts` sau khi `grep` không còn import |
| **Thu gọn** | `lib/fixtures/home.ts` chỉ còn `tours` + `journey` (bỏ destinations/cuisines/faqs) · `tour-details.ts` bỏ `destinations`/`cuisines` nếu trang tour đã lấy DB |
| **Giữ** | `lib/fixtures/site.ts` (brand), `home-media.ts` (ảnh hero/closing), `tour-details.ts` phần lịch trình |
| **Docs** | `sources/README.md` (public reads DB + 4 route admin + cache), `AGENTS.md` mục "Content vs. data", PLAN errata |
| **Kiểm tra** | `grep "@/lib/fixtures/(destinations\|posts\|cuisines\|faqs)"` = 0 · `grep "@/lib/prisma"` trong `app/`/`components/` = 0 · mọi trang 200 |
| **Coverage** | Đo lại, ratchet `test:coverage` + `test:coverage:unit`; thêm test còn thiếu |
| **Done khi** | `tsc/lint/build` xanh · `npm test` xanh · không còn fixture domain · DB rỗng render empty state |

> **Đã làm & kiểm chứng**
>
> - **Xoá fixture:** `lib/fixtures/{destinations,posts,cuisines,faqs}.ts` đã xoá sau khi
>   `grep "@/lib/fixtures/(destinations|posts|cuisines|faqs)"` = **0**. `lib/fixtures/` chỉ còn
>   `site.ts` (brand), `home-media.ts` (hero/closing), `home.ts` (tours + journey),
>   `tour-details.ts` (lịch trình + gallery + departures).
> - **Thu gọn:** `home.ts` bỏ `destinations`/`cuisines`/`faqs` và ảnh điểm đến không dùng;
>   `HomePageData` chỉ còn `tours` + `journey`. `tour-details.ts` bỏ `destinations`/`cuisines`,
>   `TourDetailData` bỏ 2 field đó; `TourDestinations` nhận prop `destinations`, trang tour
>   truyền dữ liệu từ `listDestinationsForTour`.
> - **Sửa lỗi phát sinh:** `/diem-den/[slug]` thiếu `export const instant = false` nên dev log
>   `instant-shell-url-data`; đã thêm, live check sạch cảnh báo này.
> - **Docs:** `sources/README.md` (trạng thái public đọc DB, cây thư mục `server/content`,
>   cache/`updateTag`, danh sách test); `AGENTS.md` mục "Content vs. data" (public content
>   DB-driven, sửa DB tay không invalidate cache); PLAN errata cập nhật.
> - **Kiểm tra tĩnh:** `grep "@/lib/prisma"` trong `app/`/`components/` = **0**; `grep` fixture
>   domain = **0**; `tsc` ✅ · `lint` ✅ · `build` ✅.
> - **Live verify (dev:local):** 10 route public đều 200 — `/`, `/diem-den`,
>   `/diem-den/cho-noi-cai-rang`, `/am-thuc`, `/am-thuc/lau-mam-u-minh`, `/kinh-nghiem`,
>   `/kinh-nghiem/mua-nao-di-u-minh-ha-dep-nhat`, `/lien-he`, `/tour`,
>   `/tour/sai-gon-can-tho-u-minh-ha-dat-mui-4n3d`; tour detail render đúng điểm đến + món ăn
>   từ DB; home có FAQ + ẩm thực từ DB.
> - **Empty state:** các trang/`section` đã có từ D9.2–D9.5 (`/diem-den`, `/am-thuc`,
>   `/kinh-nghiem`, home sections, `/lien-he` FAQ); DB rỗng không crash.
> - **Coverage:** full **86.73 / 88.53 / 93.86**, unit **98.31 / 94.42 / 95.24**. Ratchet
>   `test:coverage` lines **80 → 84**; giữ branches 88 / functions 92 (đã sát số đo). Unit giữ
>   96 / 92 / 93.
> - **Tests:** `npm test` **222/222** (không đổi số case; D9.6 chỉ dọn fixture/docs).
> - **Còn lại có sẵn:** `/tour/[slug]` vẫn log cảnh báo `new Date()` từ `getBookableDepartures`
>   khi dev prerender — lỗi có từ trước D9, ngoài phạm vi dọn fixture.

#### Cache / render

```ts
// server/content/public-destinations.ts
export async function listPublicDestinations() {
  "use cache";
  cacheLife("max");
  cacheTag("content:destinations");
  const rows = await prisma.destination.findMany({ where: { status: "published" }, ... });
  return rows.map(toDestinationListingData);
}
```

- Dùng `"use cache"` cấp **data**, không cache cả page.
- Sau mutation trong server action: `updateTag("content:destinations")` (read-your-own-writes).
- `revalidatePath` không dùng vì phải liệt kê quá nhiều route (home, listing, detail, tour detail).
- Seed/sửa DB tay **không** tự invalidate — phải restart dev hoặc gọi revalidate; ghi vào README.
- Kiểm tra build: `/`, `/diem-den`, `/am-thuc`, `/kinh-nghiem` nên vẫn `○`/`◐`; nếu thành `ƒ`
  là dấu hiệu loader chưa được cache.

#### Rủi ro riêng của D9

| Rủi ro | Giảm thiểu |
|---|---|
| `npm run db:seed` ghi đè nội dung admin vừa sửa | Ghi rõ README; chỉ seed dev/test; production dùng `SEED_FORCE_*` có kiểm soát |
| `generateStaticParams` đọc DB lúc build, DB chưa có → build rỗng | Empty state; deploy DB trước; slug mới render dynamic (`dynamicParams` mặc định) |
| Post `coverImage` NULL nhưng contract bắt buộc | Ảnh fallback nội bộ + admin bắt buộc `/images/*` |
| Destination image NULL làm `DestinationsSection` crash | Home loader lọc điểm đến có ảnh; `/diem-den` dùng placeholder sẵn có |
| Sửa slug làm chết URL cũ | Slug bất biến sau khi tạo |
| Xoá fixture khi home/tour-details còn import | Làm D9.6 cuối; `grep` trước khi xoá |
| Migration chạy nhầm production | `with-db.mjs dev/test`; production `db:deploy` trước khi deploy code |
| 4 màn admin làm sidebar quá dài | Thêm nhóm "Nội dung" hoặc đo breakpoint 1024/768 trước khi merge |
| Cache không invalidate khi sửa DB tay | Ghi rõ trong README; dev restart; test bằng admin action |

#### Khối lượng & thứ tự

| Bước | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|
| D9.1 | 1 mapper + migration + 4 test | 3 | Schema + seed + mapper thuần |
| D9.2 | 2 service + 3 trang admin + 1 trang public | ~8 | Điểm đến |
| D9.3 | 2 service + 3 trang admin | ~7 | Bài viết |
| D9.4 | 2 service + 3 trang admin | ~6 | Món ăn |
| D9.5 | 2 service + 3 trang admin | ~4 | FAQ |
| D9.6 | — | ~6 + xoá 4 | Dọn fixture + docs + coverage |

**Thứ tự thực thi: D9.1 → D9.2 → D9.3 → D9.4 → D9.5 → D9.6.**
Mỗi slice phải qua đủ cổng `tsc + lint + build + npm test` và smoke test “admin save → public
đổi” trước khi sang slice kế. Không gộp 2 domain vào một lần build.

---

### D10 · Hoàn thiện vận hành — **TODO**

> **Quyết định đã chốt (21/11/2026)**
>
> | # | Hạng mục | Chốt |
> |---|---|---|
> | 1 | Lưu trữ ảnh | **Cloudinary** (`CLOUDINARY_URL` đã có trong `.env`) |
> | 2 | Cách upload | **SDK `cloudinary`** + `sharp` (thêm cả hai vào `dependencies`) |
> | 3 | Chính sách URL ảnh | **Cho phép Cloudinary trong toàn bộ ảnh nội dung**: tour, điểm đến, bài viết, món ăn, media |
> | 4 | Xoá media | **Xoá asset Cloudinary**; lưu `Media.publicId`; chặn xoá nếu ảnh đang được dùng làm cover |
> | 5 | Bộ lọc audit | **Entity select tĩnh + action nhập text (prefix)** + admin select + khoảng ngày |
> | 6 | Đổi mật khẩu | **Buộc đăng nhập lại** (xoá cookie, `tokenVersion++`) |
> | 7 | Nav | **Gom nhóm** + vùng nav cuộn trong sidebar, footer cố định |
>
> **Hệ quả quan trọng:** D10 mở lại `next.config.ts#images.remotePatterns` **chỉ cho host
> `res.cloudinary.com`**. Đây là ngoại lệ hẹp của D0, không mở lại host ngoài tuỳ ý.
> `lib/images.ts#toLocalImage` được mở rộng thành `toImageAsset` (local + Cloudinary).

#### D10.1 · Badge tin mới

| | |
|---|---|
| **Mục tiêu** | Hiện số tin liên hệ `new` trên mục “Hộp thư” ở sidebar + drawer mobile |
| **Sửa** | `app/admin/(dashboard)/layout.tsx` · `components/admin/{admin-sidebar,admin-mobile-nav,admin-nav-links}.tsx` |
| **Luồng** | Layout gọi `countContactMessagesByStatus()` (chỉ khi có `messages:read`) → `unreadMessages` → `AdminNavLinks` |
| **UI** | Badge ẩn khi 0, cap `99+`; `aria-label="Hộp thư, N tin mới"`; không chỉ dựa vào màu |
| **Bẫy** | Layout có thể không re-render sau khi đổi trạng thái tin → thêm `revalidatePath("/admin", "layout")` trong action đổi trạng thái/xoá tin nếu live test thấy stale |
| **Done khi** | Gửi tin mới → badge tăng; đánh dấu đã đọc → badge giảm; 0 tin → không có badge |

> **Đã làm & kiểm chứng**
>
> - **Helper:** `lib/contact/unread.ts#formatUnreadCount` — `0/âm/NaN → null`, `1–99` giữ nguyên,
>   `≥100 → "99+"`; test `scripts/tests/unit/unread-count.test.ts` (2 case).
> - **Layout:** `app/admin/(dashboard)/layout.tsx` gọi `countContactMessagesByStatus()` khi role
>   có `messages:read`, truyền `unreadMessages` xuống sidebar + drawer mobile.
> - **UI:** `AdminNavLinks` render badge `bg-clay` ở mục “Hộp thư”, ẩn khi 0, `aria-label`
>   “Hộp thư, N tin mới”, badge `aria-hidden`.
> - **Stale:** thêm `revalidatePath("/admin", "layout")` sau khi đổi trạng thái/xoá tin trong
>   `app/admin/(dashboard)/messages/actions.ts`.
> - **Live verify (dev:local):** seed 2 tin `new` → `/admin` có `aria-label="Hộp thư, 2 tin mới"`;
>   chuyển 1 tin sang `read` → reload còn `"Hộp thư, 1 tin mới"`; xoá dữ liệu QA sau test.
> - **Cổng:** `tsc` ✅ · `lint` ✅ · `build` ✅ · `npm test` **224/224** ·
>   coverage **86.75 / 88.62 / 93.91** (gate 84/88/92).

#### D10.2 · Đổi mật khẩu tự phục vụ

| | |
|---|---|
| **Mục tiêu** | Mọi role tự đổi mật khẩu, huỷ phiên cũ bằng `tokenVersion` có sẵn |
| **Tạo mới** | `app/admin/(dashboard)/account/{page.tsx,actions.ts}` · `components/admin/change-password-form.tsx` |
| **Sửa** | `server/auth/admin-users.ts` thêm `changeOwnPassword` · `components/admin/admin-nav-links.tsx` · `app/admin/login/page.tsx` (đọc `?ok=password`) |
| **Service** | Verify mật khẩu hiện tại bằng bcrypt; mật khẩu mới 8–200 ký tự, khác mật khẩu cũ; update hash + `tokenVersion: { increment: 1 }` trong transaction; audit `admin.password_self` (không ghi mật khẩu) |
| **Sau khi lưu** | Xoá cookie `ADMIN_COOKIE`, redirect `/admin/login?ok=password` → buộc đăng nhập lại |
| **Nav** | Đổi “Tài khoản” (owner, `/admin/users`) → **“Người dùng”**; thêm **“Tài khoản của tôi”** (`/admin/account`) |
| **Test** | Sai mật khẩu hiện tại, mật khẩu yếu, trùng mật khẩu cũ, audit, `tokenVersion +1`, mật khẩu cũ fail / mới pass |
| **Done khi** | Đổi mật khẩu → bị đăng xuất; đăng nhập bằng mật khẩu mới OK; mật khẩu cũ fail; audit có dòng `admin.password_self` |

> **Đã làm & kiểm chứng**
>
> - **Service:** `server/auth/admin-users.ts#changeOwnPassword` — `ADMIN_NOT_FOUND` 404 (không
>   tồn tại/đã khoá), `INVALID_CURRENT_PASSWORD` 400, `WEAK_PASSWORD` 400,
>   `PASSWORD_UNCHANGED` 400. Thành công: update hash + `tokenVersion: { increment: 1 }` +
>   audit `admin.password_self` trong **một transaction**, meta chỉ có `email`. Lỗi không ghi
>   audit, không bump phiên bản.
> - **Action:** `app/admin/(dashboard)/account/actions.ts` — zod cho 3 ô + refine khớp mật khẩu,
>   `requireAdminPage` (mọi role), lỗi trả `{ error }` để hiện inline, thành công xoá
>   `ADMIN_COOKIE` rồi `redirect("/admin/login?ok=password")`.
> - **UI:** trang `/admin/account` (thông tin tài khoản + card đổi mật khẩu);
>   `components/admin/change-password-form.tsx` dùng `useActionState`, **input controlled**
>   (lỗi không mất nội dung), toggle hiện/ẩn mật khẩu có `aria-pressed`, nút pending.
> - **Login:** `/admin/login` đọc `?ok=password`, hiện banner `role="status"`
>   "Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới."
> - **Nav (quyết định #7):** `AdminNavLinks` gom **3 nhóm** Vận hành / Nội dung / Hệ thống,
>   nhóm rỗng tự ẩn; đổi "Tài khoản" → **"Người dùng"**, thêm **"Tài khoản của tôi"**
>   (`/admin/account`, không cần capability). Sidebar + drawer có vùng nav
>   `min-h-0 flex-1 overflow-y-auto`, footer "Đăng xuất" cố định. Trang `/admin/users` đổi
>   title/breadcrumb thành "Người dùng quản trị".
> - **Test:** +2 case trong `scripts/tests/admin-content.test.mts` — (1) sai mật khẩu hiện tại
>   không đổi gì/không audit, mật khẩu yếu, trùng cũ, thành công thì `tokenVersion +1`,
>   `authenticateAdmin` cũ fail/mới pass, audit đúng `entity`/`adminId`/`meta` và không chứa
>   mật khẩu; (2) actor không tồn tại → 404. Tổng **226/226**.
> - **Cổng:** `tsc` ✅ · `lint` 0 warning · `build` ✅ (`/admin/account` là `ƒ`) ·
>   `npm test` **226/226** · `test:coverage` exit 0 — **86.84 / 88.67 / 93.93**
>   (giữ gate 84/88/92; D10.1 đo 86.75/88.62/93.91 nên không ratchet).
> - **Live verify (dev:local, owner seed):** đăng nhập → `/admin/account` 200, có 3 nhóm nav,
>   mục "Người dùng" + "Tài khoản của tôi". POST form đổi mật khẩu → **303**
>   `Location: /admin/login?ok=password`, cookie `xmsn_admin` bị xoá; GET `/admin` bằng cookie cũ
>   rơi về `/admin/login?next=%2Fadmin`; mật khẩu cũ **401**, mật khẩu mới **200**; đổi lại
>   mật khẩu cũ thành công. DB dev: `tokenVersion = 2` (đổi 2 lần), 2 dòng audit
>   `admin.password_self` với `meta = { email }` — không có mật khẩu. Đã trả mật khẩu seed về
>   nguyên trạng.
> - **Bẫy gặp thật:** đặt `requireAdminPage` trực tiếp trong page (không qua
>   `requireCapabilityPage`) làm dev log ném `unstable value new Date()` từ `jwtVerify` dưới
>   `cacheComponents`. Đã thêm `await connection()` đầu page như `layout`/các page admin khác.
> - **Không cần migration** (`token_version` có từ D7), không thêm capability.
> - **Docs:** `README.md` (tính năng + cây thư mục + bước go-live), `DESIGN-ADMIN.md` §4/§12/§14.

#### D10.3 · Màn audit log

| | |
|---|---|
| **Mục tiêu** | Owner xem lịch sử thao tác admin, read-only, có lọc và phân trang |
| **Migration** | Thêm index `@@index([createdAt])`, `@@index([adminId, createdAt])`, `@@index([action, createdAt])`, `@@index([entity, createdAt])`; giữ index cũ `[entity, entityId, createdAt]` |
| **Tạo mới** | `server/audit/admin-audit.ts` · `lib/audit/labels.ts` · `app/admin/(dashboard)/audit/page.tsx` |
| **Sửa** | `components/admin/admin-nav-links.tsx` (mục Audit, `audit:read`) |
| **Service** | Filter entity exact + action prefix + adminId + `from`/`to` (ngày VN, `to` + 1 ngày exclusive); order `createdAt desc, id desc`; `pageSize` mặc định 50, cap 100; join admin name/email; admin đã xoá → “Hệ thống/đã xoá” |
| **UI** | GET form lọc; bảng thời gian / admin / action / entity / entityId / meta; `meta` trong `<details><pre>`; phân trang giữ filter |
| **Bảo mật** | `requireCapabilityPage("audit:read")` → chỉ owner; admin/editor vào URL thấy `AccessDenied` |
| **Test** | Filter entity/action/admin/ngày, order, cap, invalid date, owner-only, 404/empty state |
| **Done khi** | Lọc `entity=order` + `action=order.` ra đúng; `admin`/`editor` không vào được; bảng lớn vẫn phân trang nhanh |

> **Đã làm & kiểm chứng**
>
> - **Migration `20261121100000_admin_audit_indexes`:** thêm index `[createdAt]`,
>   `[adminId, createdAt]`, `[action, createdAt]`, `[entity, createdAt]`, giữ index cũ
>   `[entity, entityId, createdAt]`. SQL sinh bằng `migrate diff`, chỉ chứa 4 `CREATE INDEX`;
>   đã `db:migrate:dev` + `db:migrate:test`.
> - **`lib/time.ts`:** thêm `isDateOnly` (đúng định dạng + ngày có thật) và `vnDayStart`
>   (00:00 VN → instant UTC). Unit test khoá `2026-02-31` là sai và
>   `vnDayStart("2026-11-21") === 2026-11-20T17:00Z`.
> - **`lib/audit/labels.ts`:** 12 entity + **39 action** thực tế trong code; fallback giữ nguyên
>   văn giá trị lạ; options cho select. Phát hiện tên entity khác plan: **`tour_departure`** và
>   **`setting`** (số ít), không phải `departure`/`settings`.
> - **`server/audit/admin-audit.ts`:** `listAdminAuditLogs` (entity exact, action **prefix**,
>   adminId, from/to theo ngày VN với `to` inclusive, order `createdAt desc, id desc`,
>   `pageSize` mặc định 50 cap 100, join admin) + `listAuditAdminOptions` (gồm cả tài khoản khoá).
>   Ngày sai bị bỏ qua; `adminId` null trả `admin: null`.
> - **`app/admin/(dashboard)/audit/page.tsx`:** `requireCapabilityPage("audit:read")`, owner-only,
>   `AccessDenied` cho role khác; form GET đủ 5 filter + nút Lọc/Xoá lọc; bảng 5 cột ở `xl+`,
>   card ở dưới; `meta` trong `<details><pre>`; empty state 2 nhánh; phân trang giữ filter.
> - **Nav:** thêm **“Nhật ký”** (`/admin/audit`, `ScrollText`, `audit:read`) vào nhóm Hệ thống.
> - **Test:** `scripts/tests/audit.test.mts` (8 case: order/pagination, entity+prefix, admin,
>   biên ngày VN 16:59Z vs 17:00Z, ngày sai bị bỏ qua, pageSize cap, admin null, empty/options);
>   `scripts/tests/unit/audit-labels.test.ts` (4 case) và 2 case mới trong `time.test.ts`.
>   Tổng **240/240**.
> - **Cổng:** `tsc` ✅ · `lint` 0 warning · `build` ✅ (`/admin/audit` là `ƒ`, 73 route) ·
>   `npm test` **240/240** · `test:coverage` exit 0 — **87.13 / 88.79 / 94.01**;
>   ratchet `test:coverage` lines **84 → 85** (branch 88 / functions 92 giữ nguyên).
>   `test:coverage:unit` **98.06 / 94.57 / 94.70** (gate 96/92/93).
> - **Live verify (dev:local):** owner `/admin/audit` 200, thấy 3 bản ghi thật
>   (2 `admin.password_self` + 1 `order.confirm`); lọc `entity=admin_user&action=admin.password_`
>   đúng; `action=khongtontai.` → “Không có bản ghi phù hợp.”; `from=khong-phai-ngay` bị bỏ qua;
>   seed tạm 55 dòng → “55 bản ghi”, “Trang 1 / 2”, link sau
>   `/admin/audit?entity=setting&page=2`, link trước bỏ `page` nhưng giữ `entity`; xoá seed sau test.
>   Tài khoản `editor` tạm: `/admin/audit` 200 nhưng hiện AccessDenied, không có form lọc, menu
>   “Nhật ký” ẩn; đã xoá tài khoản.
> - **Không thêm API route** — màn chỉ đọc, dùng server component trực tiếp service.
> - **Docs:** `README.md`, `DESIGN-ADMIN.md` §14.

#### D10.4 · Upload ảnh Cloudinary

| | |
|---|---|
| **Mục tiêu** | Upload ảnh thật, resize/WebP, lưu Cloudinary + `Media` row; ảnh dùng được ngay trong form nội dung |
| **Dependencies** | Thêm trực tiếp `cloudinary` + `sharp` (hiện sharp chỉ là transitive của Next) |
| **Schema/migration** | `Media.publicId String? @unique @map("public_id") @db.VarChar(255)` (asset Cloudinary; legacy row `null`) |
| **URL policy** | `next.config.ts` thêm `images.remotePatterns` cho `res.cloudinary.com` (pathname ưu tiên `/<cloud_name>/image/upload/**`, fallback `/**` nếu build thiếu env); `lib/images.ts` thêm `toImageAsset` (local + Cloudinary), thay `toLocalImage` ở `lib/content/mappers.ts`, `server/content/posts-query.ts`, `server/catalog/list-bookable-tours.ts`, `lib/booking/success.ts` |
| **Validator dùng chung** | `lib/media/image-url.ts` (`isManagedImageUrl`) thay regex `LOCAL_IMAGE` trong `server/media/admin-media.ts`, `server/catalog/admin-tours.ts`, `server/content/admin-{destinations,posts,cuisines}.ts`; thông báo lỗi “/images/… hoặc URL Cloudinary” |
| **Storage adapter** | `server/media/cloudinary.ts`: cấu hình SDK từ `CLOUDINARY_URL`; `uploadBuffer(buffer)` dùng `uploader.upload_stream`; `destroy(publicId)`; tạo `thumbnailUrl` bằng `cloudinary.url(c_fill,w_320,h_320,q_auto,f_auto)`; nhận dependency để test mock |
| **Upload service** | `server/media/upload-media.ts`: validate MIME (`jpeg/png/webp/avif`), size ≤ 8MB, `sharp` `limitInputPixels`, `.rotate()`, resize inside 1920, `.webp({ quality: 78 })`, đọc metadata; upload; tạo `Media` row (`url`, `thumbnailUrl`, `publicId`, `width/height`, title/alt/tags); audit `media.upload` |
| **Route** | `POST /api/admin/media/upload`: `requireCapabilityApi("content:write")`, rate limit, `request.formData()`, trả `201 { ok: true, media }`; lỗi Cloudinary → `502 MEDIA_UPLOAD_FAILED` |
| **UI** | `components/admin/media-upload-form.tsx` (client): chọn file, title/alt/tags, pending/error; `fetch` route rồi `router.refresh()`; `/admin/media` thêm khối upload, giữ form nhập URL local cũ |
| **Xoá media** | Pre-check 4 bảng (`tour.coverImageUrl`, `destination.coverImageUrl`, `post.coverImageUrl`, `cuisine.imageUrl`) → `409 MEDIA_IN_USE`; nếu có `publicId` gọi `destroy(..., { invalidate: true })` chấp nhận kết quả `"ok"` hoặc `"not found"`; xoá row + audit `media.delete` |
| **Bẫy** | Không ghi file vào `public/images` trên production; `next/image` cần remotePatterns; `sharp` phải là dependency trực tiếp; Cloudinary timeout → 1 retry, không tạo DB row dở |
| **Test** | Unit: `isManagedImageUrl`, `toImageAsset`, sharp resize/format, signature/uploader mock; route: 401/403, sai MIME, quá size, Cloudinary lỗi; DB: tạo media + audit, xoá bị chặn khi đang dùng, xoá asset mock |
| **Done khi** | Upload ảnh trên `/admin/media` → row DB + asset Cloudinary; ảnh hiện trong datalist và render được trên public; xoá ảnh không dùng → asset mất; xoá ảnh đang dùng → bị chặn |

> **Đã làm & kiểm chứng**
>
> - **Dependencies:** `cloudinary@^2.11.0` + `sharp@^0.35.5` vào `dependencies`;
>   `next.config.ts` thêm `serverExternalPackages: ["cloudinary","sharp"]`.
> - **Migration `20261121110000_media_public_id`:** `media.public_id VARCHAR(255) NULL`
>   + unique index. Đã áp **dev** và **test**; **production chưa áp** (phải chạy
>   `prisma migrate deploy` trước khi deploy code).
> - **URL policy:** `lib/media/image-url.ts` (`isLocalImageUrl`, `isCloudinaryImageUrl`,
>   `isManagedImageUrl`) + `lib/images.ts` đổi `toLocalImage` → `toImageAsset`.
>   Thay ở `lib/content/mappers.ts`, `server/content/posts-query.ts`,
>   `server/catalog/list-bookable-tours.ts`, `lib/booking/success.ts`.
>   Validator 5 domain (`admin-media`, `admin-tours`, `admin-destinations`,
>   `admin-posts`, `admin-cuisines`) dùng chung; thông báo “/images/… hoặc URL Cloudinary”.
> - **`next.config.ts`:** `images.remotePatterns` **chỉ** `https://res.cloudinary.com`,
>   pathname `/<cloud_name>/image/upload/**` lấy từ `CLOUDINARY_URL`, fallback `/**` nếu thiếu env.
> - **Storage adapter:** `server/media/cloudinary.ts` — `createCloudinaryStorage(client, env)`
>   để test bằng client giả; upload stream WebP, retry 1 lần, `destroy` idempotent
>   (`ok`/`not found`), `thumbnailUrl` 320×320.
> - **Upload service:** `server/media/upload-media.ts` — MIME jpeg/png/webp/avif, ≤ 8 MB,
>   `sharp` `limitInputPixels` 40MP, `.rotate()`, resize inside 1920, WebP q78; upload →
>   transaction tạo `Media` (`url`, `publicId`, `thumbnailUrl`, width/height, tags) + audit
>   `media.upload`; DB lỗi sau upload thì destroy asset, storage lỗi → `502 MEDIA_UPLOAD_FAILED`.
> - **Route:** `POST /api/admin/media/upload` — `requireCapabilityApi("content:write")`,
>   rate limit 10/10 phút theo admin, chặn body >10 MB, trả `201 { ok, media }`.
> - **UI:** `components/admin/media-upload-form.tsx` (file + title/alt/tags, pending/error,
>   `router.refresh()`); `/admin/media` thêm khối “Tải ảnh lên”, preview dùng `toImageAsset`,
>   hiện nguồn Cloudinary/nhập tay.
> - **Xoá media:** pre-check `tour.coverImageUrl`, `destination.coverImageUrl`,
>   `post.coverImageUrl`, `cuisine.imageUrl` → `409 MEDIA_IN_USE` (kèm counts); có `publicId`
>   thì `destroy` trước, lỗi → `502 MEDIA_DELETE_FAILED`; row legacy không gọi Cloudinary.
> - **Sửa media:** row có `publicId` không cho đổi `url`/`type` (`409 MEDIA_MANAGED_URL`);
>   title/alt/tags/sort/isActive vẫn sửa được.
> - **Test:** +7 case `scripts/tests/media-upload.test.mts` (resize/WebP/audit, MIME/size/hỏng,
>   storage lỗi, destroy + audit, chặn ảnh đang dùng, media nhập tay, guard update);
>   +5 case `cloudinary-storage.test.ts`; +4 case `media-image-url.test.ts`; `images.test.ts`
>   chuyển sang `toImageAsset` + Cloudinary. Tổng **257/257**.
> - **Cổng:** `tsc` ✅ · `lint` 0 warning · `build` ✅ (74 route, có `/api/admin/media/upload`) ·
>   `npm test` **257/257** · `test:coverage` exit 0 — **86.92 / 88.68 / 93.83**
>   (gate lines **85** / branches 88 / functions 92; `cloudinary.ts` 96.48% lines).
> - **Live verify (dev:local, Cloudinary thật):** không cookie → **401**; `editor` → **201**
>   (đúng ma trận: editor có `content:write`, nên không có ca 403 với role thật);
>   `text/plain` → **400 MEDIA_INVALID_TYPE**; PNG 800×600 → **201**, URL
>   `res.cloudinary.com/duj1xyanj/image/upload/...webp`, `publicId`, thumbnail 320×320,
>   row DB + 1 audit `media.upload`; `/_next/image?url=…` → **200** (remotePatterns đúng);
>   `/admin/media` 200 có form upload + URL mới; xoá qua service → row `null`, asset trả **404**.
>   Dữ liệu dev + production quét read-only: **0 URL ảnh ngoài** `/images` hoặc Cloudinary.
> - **Không thêm API admin khác**; route upload là transport mỏng, logic nằm trong service.
> - **Docs:** `README.md` (tính năng, env, tree `server/media`), `DESIGN-ADMIN.md` §14,
>   `.env.example`.

**Thứ tự D10:** `D10.1 → D10.2 → D10.3 → D10.4`.
Mỗi slice qua `tsc + lint + build + npm test` và live smoke test trước khi sang slice kế.

**Migration/deploy:** D10.3 và D10.4 mỗi slice một migration; chạy `db:migrate:dev` + `db:migrate:test`; production `prisma migrate deploy` **trước** khi deploy code. D10.4 cần `CLOUDINARY_URL` ở cả môi trường build và runtime.

**Ước lượng thực tế:** D10.1 4–5 file; D10.2 4–5; D10.3 5–7 + migration; D10.4 10–14 + migration. Tổng ~23–31 file, không phải 3+3.

---

### 10.7 Sơ đồ phụ thuộc

```
D0 ──▶ D1 ──▶ D2
 └──▶ D4 ──▶ D5
D3 ──┐
D5 ──┴──▶ D6 ──┬──▶ D7
               └──▶ D10.1 ──▶ D10.2 ──▶ D10.3 ──▶ D10.4
D8 ──▶ (nuôi dữ liệu cho) D5 — ✅ đã xong
D9.1 ──▶ D9.2 ──▶ D9.3 ──▶ D9.4 ──▶ D9.5 ──▶ D9.6
```

- **D0 trước tất cả** — bỏ `remotePatterns` là điều kiện để `next/image` không nổ.
  D10.4 **mở lại hẹp** cho `res.cloudinary.com`; không mở host ngoài tuỳ ý.
- **D6 trước D7/D10** — ✅ đã xong; các phase sau chỉ cần thêm capability vào ma trận.
- **D10 thứ tự:** badge → mật khẩu → audit → upload. Upload cuối vì đụng URL ảnh,
  `next/image`, validator 5 domain và storage ngoài.
- **D8 độc lập**, nhưng làm sớm thì D5 mới có dữ liệu để kiểm duyệt thật.
- **D9 đổi kiến trúc render của storefront** nên làm sau khi admin backend ổn định; không trộn
  với D10. D9 làm **vertical slice** (D9.1 nền → D9.2 điểm đến → D9.3 bài viết → D9.4 món ăn →
  D9.5 FAQ → D9.6 dọn fixture), mỗi slice có đủ loader + admin CRUD + test.

### 10.8 Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Ảnh DB cũ là URL ngoài → `next/image` ném lỗi runtime | `toImageAsset` chỉ nhận local hoặc Cloudinary đúng path; grep `https://` lạ trong DB trước khi build |
| D10.4: Cloudinary URL bị `next/image`/`toLocalImage` chặn | Mở `remotePatterns` hẹp cho `res.cloudinary.com`; thay `toLocalImage` bằng `toImageAsset`; validator ảnh dùng chung |
| D10.4: xoá media làm hỏng ảnh cover đang dùng | Pre-check `tour/destination/post/cuisine` theo URL → `409 MEDIA_IN_USE` |
| D10.4: xoá asset Cloudinary xong DB lỗi | `destroy` idempotent (`"ok"` hoặc `"not found"`), retry xoá DB; không tạo row dở khi upload lỗi |
| D10.3: index cũ `[entity, entityId, createdAt]` không phủ feed/lọc | Migration thêm `createdAt`, `[adminId, createdAt]`, `[action, createdAt]`, `[entity, createdAt]` |
| D10.1: badge stale sau khi đọc tin | `revalidatePath("/admin", "layout")` trong action đổi trạng thái/xoá tin nếu cần |
| D10: sidebar 14 mục tràn viewport | Gom nhóm nav + vùng nav `overflow-y-auto`, footer cố định |
| Admin sửa giá/chuyến khi chưa phân quyền | D6 làm trước D7; hiện tại chỉ nên cấp tài khoản `owner` cho người tin cậy |
| Migration thêm cột chạy nhầm vào production | Dùng `node scripts/with-db.mjs dev npx prisma migrate dev`; `DATABASE_URL` chỉ dùng cho `migrate deploy` khi go-live |
| `settings.booking` bị ghi đè làm mất `cancellationPolicy` | **Đã sửa** ở D2 (merge); test khoá lại |
| Xoá fixture ở D9.6 làm mất nội dung marketing đang đẹp | Làm từng domain, so sánh bằng mắt trên dev trước khi xoá; chỉ xoá sau khi `grep` import = 0 |
| D9: `Post` thiếu `topic`/`relatedTourCodes`/`checklist` → mất UI bài viết | Migration ở D9.1; không nhét vào `tags` |
| D9: `/diem-den/[slug]` không tồn tại → mọi card 404 | Thêm trang chi tiết trong D9.2 |
| D9: home/tour detail vẫn đọc bản sao fixture | Chuyển home destinations/cuisines/faqs + tour detail destinations/cuisines sang DB trong D9.2–D9.5 |
| D9: `db:seed` ghi đè nội dung admin vừa sửa | Chỉ seed dev/test; ghi cảnh báo trong README; production dùng `SEED_FORCE_*` có kiểm soát |
| D9: sửa DB tay nhưng cache `"use cache"` vẫn trả bản cũ | Admin action gọi `updateTag`; sửa tay phải restart dev hoặc gọi revalidate; ghi README |
| D9: 4 màn admin mới làm sidebar quá dài | Thêm nhóm "Nội dung" hoặc kiểm tra breakpoint 1024/768 trước khi merge |
| Upload ảnh ghi vào `public/` rồi mất khi deploy | Dùng Cloudinary, không ghi filesystem |
| JWT cũ vẫn dùng được sau khi đổi mật khẩu | `tokenVersion` ở D7 + D10.2 tăng khi đổi mật khẩu; phiên cũ bị loại |

### 10.9 Khối lượng ước tính

| Phase | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|
| D6 | 2 (`permissions.ts`, test) | ~20 (mọi page/action/nav) | ✅ đã xong — 23 file chạm tới |
| D7 | 2 (service, migration) | 4 | ✅ đã xong — kèm `tokenVersion` |
| D8 | 4 | 3 | ✅ đã xong — kèm `test:reviews` + ratchet coverage |
| D9 | 2 service/domain + 4 mapper + migration + 12 trang admin/public | ~25 | 6 slice: D9.1 nền → D9.2 điểm đến → D9.3 bài viết → D9.4 món ăn → D9.5 FAQ → D9.6 dọn fixture |
| D10.1 | — | 4–5 file | Badge tin mới |
| D10.2 | 3–4 file | 2–3 file | Trang account + service + nav |
| D10.3 | 3–4 file + migration | 2–3 file | Audit service/page + index |
| D10.4 | 9–12 file + migration | 5–8 file | Cloudinary SDK, sharp, URL policy, upload route/UI |

**Thứ tự thực thi: D10.1 → D10.2 → D10.3 → D10.4.**
D9 đã xong; D10 là track cuối. Mỗi slice phải qua `tsc + lint + build + npm test` trước khi sang slice kế.

---

## 11. Errata — sai lệch so với các mục trước

Các điểm dưới đây **không còn đúng** như văn bản gốc ở §2–§9; đọc kèm khi làm Track D.

| Mục | Nội dung cũ | Thực tế hiện tại |
|---|---|---|
| §B1 (ghi chú) | "URL ảnh trong seed là `upload.wikimedia.org` → đã có trong `next.config.ts#images.remotePatterns`" | **Sai**: `remotePatterns` đã bị xoá ở D0. Ảnh hiện tại phải là `/images/*.webp`; dữ liệu DB cũ đi qua `lib/images.ts#toLocalImage`. D10.4 sẽ mở **ngoại lệ hẹp** cho `res.cloudinary.com` và đổi sang `toImageAsset` |
| §B1 (`coverImage`) | `coverImage: { src: tour.coverImageUrl, … }` | Phải bọc `toLocalImage(tour.coverImageUrl, tour.name)` — nếu không, một row còn URL ngoài sẽ làm sập trang. D10.4 đổi thành `toImageAsset` (local + Cloudinary) |
| §B4 | "Trang `/admin/messages` … để phase sau" | **Đã xong** ở D3 |
| §T4 | "Tổng 111 test case" · coverage 74.31 / 90.24 / 94.56 | Sau D10.1: **224 test**, coverage **86.75 / 88.62 / 93.91** (gate full **84 / 88 / 92**, unit **96 / 92 / 93**) |
| §T0 | `helpers/factories.ts` là nguồn tạo dữ liệu test duy nhất | Vẫn đúng, nhưng `scripts/tests/admin-content.test.mts` tự tạo dữ liệu riêng (chuyến 2031, media, review, admin) và **khôi phục** settings/tour trong `after()` |
| §9.6 | Track C: 5 file mới | Không đổi; Track D thêm 8 trang admin + 7 service trước D9, và D9 dự kiến thêm 4 domain nội dung (12 trang admin/public + 8 service) |
| §10.0 (đo lúc viết plan) | `build 50 route` · `npm test 156/156` · coverage 81.8 / 88.0 / 93.8 (gate 72 / 88 / 92) | Sau D10.1: **224 test**, coverage **86.75 / 88.62 / 93.91** (gate full **84 / 88 / 92**); 4 domain nội dung public đã đọc DB |
| §D9 (bảng cũ) | "tách 5 bước" · D9.1 fallback fixture · D9.5 xoá `lib/fixtures/*` trừ `site.ts` | Đổi thành **6 slice** D9.1–D9.6; fallback chỉ tạm đến D9.6 rồi dùng empty state; giữ `site.ts`, `home.ts` (tours/journey), `tour-details.ts` (lịch trình) |
| Ngoài plan | — | `/diem-den/[slug]` chưa từng tồn tại dù mọi card link tới → D9.2 thêm mới, không phải sửa |
| Ngoài plan | — | D9.2 loại `server/content/public-*.ts` khỏi coverage (wrapper `"use cache"`/`cacheLife` chỉ chạy trong Next runtime); query + admin service vẫn được test |
| Ngoài plan | — | **20/11/2026:** trước D9.3, đã backup `posts`/`faqs` và áp migration D9.1 lên production, cập nhật metadata 3 bài viết. FAQ production vẫn 8 row chưa có `placement` — D9.5 sẽ seed/xử lý |
| Ngoài plan | — | D9.3 đổi `RelatedToursCta` sang type `PostRelatedTour` (không cần `TourDetailData` đầy đủ); `TourDetailData[]` vẫn assignable nên trang listing cũ không phải sửa |
| Ngoài plan | — | D9.4: `Cuisine` không có cột `status`, nên admin món ăn không có nháp/ẩn; xoá là mất khỏi public ngay. `TourCuisines` đổi sang prop `cuisines` lấy từ DB thay vì `tour.cuisines` |
| Ngoài plan | — | D9.4: `/am-thuc/[slug]` vẫn dùng `tourDetails` fixture cho `RelatedTourCard` và khớp bữa ăn; chỉ dữ liệu món ăn chuyển sang DB. Phần lịch trình tour giữ lại đến D9.6 |
| Ngoài plan | — | D9.5: FAQ không có slug nên admin sửa/xoá theo `id`; `ContactFaq` nhận `PublicFaqRecord` thay vì `FaqRecord` từ fixture. Chủ đề FAQ được whitelist 6 giá trị (`general/booking/transport/food/safety/weather`) |
| Ngoài plan | — | **20/11/2026:** production FAQ trước D9.5 vẫn là 8 row `placement = null`. Đã backup `faqs` (`%TEMP%\xmsn-faq-backup-*`), gán `contact` cho 5 câu liên hệ và thêm 4 FAQ `home` (sort 9–12); 3 câu chủ đề còn `null` |
| Ngoài plan | — | D9.6: đã xoá `lib/fixtures/{destinations,posts,cuisines,faqs}.ts`; `home.ts` chỉ còn tours/journey, `tour-details.ts` bỏ `destinations`/`cuisines`. `TourDestinations` nhận prop `destinations`; `HomePageData`/`TourDetailData` thu gọn |
| Ngoài plan | — | D9.6: `/diem-den/[slug]` thiếu `export const instant = false` (bỏ sót ở D9.2) → đã thêm. Coverage gate full lines **80 → 84**; branches/functions giữ 88/92 |
| Ngoài plan | — | **21/11/2026:** chốt D10 — Cloudinary + SDK `cloudinary` + `sharp` trực tiếp; cho phép URL Cloudinary trong toàn bộ ảnh nội dung; xoá asset khi xoá media; audit lọc entity/action/admin/ngày; đổi mật khẩu buộc đăng nhập lại; nav gom nhóm + cuộn |
| Ngoài plan | — | D10.4 sẽ thêm `Media.publicId` + mở `next.config.ts#images.remotePatterns` **hẹp** cho `res.cloudinary.com`; `lib/images.ts#toLocalImage` mở rộng thành `toImageAsset`. Đây là ngoại lệ hẹp của D0, không mở host ngoài tuỳ ý |
| Ngoài plan | — | D10.3 sẽ thêm 4 index cho `admin_audit_logs` (`createdAt`, `adminId+createdAt`, `action+createdAt`, `entity+createdAt`); index `[entity, entityId, createdAt]` hiện tại không phủ feed toàn cục |
| Ngoài plan | — | **21/11/2026:** D10.1 dùng `lib/contact/unread.ts#formatUnreadCount` (cap `99+`) + `revalidatePath("/admin", "layout")` sau khi đổi trạng thái/xoá tin để badge không stale |
| Ngoài plan | — | `Post` thiếu `topic`/`relatedTourCodes`/`checklist`/`isFeatured`; `Faq` thiếu `placement` → D9.1 thêm migration |
| Ngoài plan | — | D8 render form đánh giá trong `components/lookup/order-lookup.tsx`, không phải `app/(site)/tra-cuu-don/page.tsx` (trang server không biết trạng thái đơn) |
| Ngoài plan | — | **19/11/2026:** admin login production lỗi `P2022 admin_users.token_version does not exist` vì migration D7 chưa lên production. Đã backup `admin_users`/`orders` rồi `prisma migrate deploy`; `migrate status` up to date. Local dev chuyển sang `npm run dev:local`; `lib/prisma.ts` cảnh báo nếu dev trỏ production |
| Ngoài plan | — | Next.js 16.4.2 → 16.4.6 (bản vá bảo mật) đã merge vào `main` (commit `eaa1e24`, pin `07b9517`) |
| §0 (quyết định 1) | "Server Actions chỉ cho form admin" | Đúng và đang giữ: **toàn bộ** admin dùng server action, trừ `/api/admin/orders*` + `/api/admin/login|logout|me` |
| Ngoài plan | — | `app/admin/login/page.tsx:16` từng ném `Blocking Route` vì `new Date()` dưới `cacheComponents`; đã bọc `"use cache"` (xem D0) |
| Ngoài plan | — | `prisma/seed.mjs` đã chạy lại trên **DB production** ngày 16/11/2026: tours/destinations/posts/faqs/media quay về nội dung seed. Nếu trước đó có sửa tay trên production thì đã bị ghi đè (không đụng `orders`, khách hàng, mật khẩu admin) |
| Ngoài plan | — | `settings.ogImage` vẫn là URL Wikimedia cũ vì `seedSettings()` chỉ update khi `SEED_FORCE_SETTINGS=1`. Biến này **không được đọc ở đâu** trong code nên không ảnh hưởng render; sẽ dọn khi D9 chuyển `seo` sang DB |
| Ngoài plan | — | **21/11/2026 (D10.2):** quyết định #7 (gom nhóm nav + vùng cuộn) làm ngay trong D10.2 thay vì để D10.3 — sidebar 12 mục đã tràn ở viewport 768px, thêm mục "Tài khoản của tôi" là mục thứ 13. Nav chia 3 nhóm Vận hành / Nội dung / Hệ thống, vùng nav `min-h-0 flex-1 overflow-y-auto`, footer cố định |
| Ngoài plan | — | **21/11/2026 (D10.2):** thêm route `/admin/account` + `server/auth/admin-users.ts#changeOwnPassword`; không migration/capability mới. `changeOwnPassword` là luồng riêng, **không** thay `resetAdminPassword` (owner reset người khác). Test +2, tổng **226/226**; coverage **86.84 / 88.67 / 93.93** (giữ gate 84/88/92 vì chỉ nhích 0.09 so với D10.1) |
| Ngoài plan | — | **21/11/2026 (D10.2):** page dùng `requireAdminPage` trực tiếp phải tự `await connection()` — nếu không, `jwtVerify` chạm `new Date()` và `cacheComponents` ném `unstable value new Date()` khi prerender. Chỉ `requireCapabilityPage` có sẵn `connection()` |
| Ngoài plan | — | **21/11/2026 (D10.3):** entity thật là `tour_departure` và `setting` (số ít), không phải `departure`/`settings`; tổng **39 action**. Migration `20261121100000_admin_audit_indexes` chỉ thêm 4 index. Test +14 (audit 8 + labels 4 + time 2), tổng **240/240**; coverage **87.13 / 88.79 / 94.01** → ratchet gate full lines **84 → 85** |
| Ngoài plan | — | **21/11/2026 (D10.3):** lọc ngày dùng `vnDayStart` (00:00 VN) + `to + 1 ngày` exclusive; ngày sai bị bỏ qua thay vì báo lỗi. Bộ lọc admin **không** có option “hệ thống/đã xoá”; bản ghi `adminId = null` vẫn hiện nhãn “Hệ thống / đã xoá” trong bảng |
| Ngoài plan | — | **21/11/2026 (D10.4):** `Media.public_id` (migration `20261121110000_media_public_id`) đã áp **dev/test**, **chưa áp production** — phải `prisma migrate deploy` trước khi deploy code, nếu không mọi query `media` sẽ ném `P2022 unknown column public_id`. Đã quét read-only dev + production: 0 URL ảnh ngoài `/images`/Cloudinary |
| Ngoài plan | — | **21/11/2026 (D10.4):** route upload trả **201** cho `editor` vì ma trận D6 cấp `content:write` cho editor; không có role thật nào bị 403 ở route này (chỉ 401 khi chưa đăng nhập). `next.config.ts` mở `remotePatterns` hẹp cho `res.cloudinary.com`; `toLocalImage` đã đổi tên thành `toImageAsset` và nhận cả Cloudinary |
| Ngoài plan | — | **21/11/2026 (D10.4):** media có `publicId` **không cho sửa URL/loại** (`409 MEDIA_MANAGED_URL`) để tránh lệch asset; media nhập tay vẫn sửa tự do. Xoá media kiểm 4 bảng cover trước khi destroy; Cloudinary lỗi khi destroy giữ nguyên row và trả 502 |
| Ngoài plan | — | **21/11/2026 (E2):** trần upload hạ 8 MB → **4 MB** (`lib/media/limits.ts`), body route **4.5 MB**, client nén khi ảnh >**3.5 MB** (`lib/media/resize-for-upload.ts`, WebP q0.8 → fallback JPEG). Ảnh media cũ lớn hơn 4 MB vẫn đọc/render bình thường — giới hạn chỉ áp cho upload mới |
| Ngoài plan | — | **21/11/2026 (E3):** route cron export thêm `handle*Cron(request)` vì `GET` có `await connection()` — gọi `GET` trong `node --test` sẽ ném “khoá request store”; test chỉ bỏ 2 dòng `GET`. CLI đổi `.mjs` → `.mts` (`node --import tsx`), `tsx` sang `dependencies`; note hết hạn đọc `holdHours` từ settings; `vercel.json` dùng `*/5` nên **Hobby sẽ fail deploy** (dùng Pro hoặc scheduler ngoài) |
| Ngoài plan | — | **21/11/2026 (D10.5):** `/admin/audit` cột “Chi tiết” thôi in JSON thô — `lib/audit/meta.ts` + `components/admin/audit-meta.tsx` render nhãn tiếng Việt, thumbnail ảnh (local + Cloudinary), `from → to` theo entity, diff `settings.booking.update`, giá VND; JSON gốc vẫn còn sau toggle. Khoá lạ giữ nguyên key, khoá `password/hash/token/secret` bị che. Test +17, tổng **286**; coverage **87.38 / 88.26 / 93.54** |

---

## 12. TRACK E — Deploy Vercel

> **Trạng thái 21/11/2026 (sau E2+E3):** Track A–D và **E2, E3 đã xong**, local gate xanh
> (`tsc` · `lint` · `build` · **269 test** · coverage **86.96 / 88.26 / 93.42**).
> **Chưa được deploy production ngay** vì còn E0 (push + migration production), E1 (project/env),
> E4 (pool/rate limit) và E5–E7 (Preview smoke → cutover → docs).

### 12.0 Bằng chứng hiện trạng

| Kiểm tra | Kết quả |
|---|---|
| `git status -sb` | `main...origin/main [ahead 9]` + nhiều file `M/??` của D10.2–D10.4 và E2/E3 **chưa commit** |
| `git ls-files sources/.env` | Không track; `.gitignore` có `.env*`, giữ `.env.example` |
| `prisma migrate status` (prod) | **2 migration chưa áp:** `20261121100000_admin_audit_indexes`, `20261121110000_media_public_id` |
| Vercel request body | Giới hạn **4.5 MB** cho Function → E2 đã hạ trần ảnh về **4 MB** + nén client (ngưỡng 3.5 MB) |
| Vercel Cron | **Hobby chỉ 1 lần/ngày**; Pro mới chạy mỗi phút. Repo **đã có** `/api/jobs/*` + `vercel.json` (E3) |
| Rate limit | In-memory (`lib/rate-limit.ts`) → mỗi lambda một bucket, cold start reset (E4 chưa làm) |
| DB pool | `DATABASE_URL` đang `connection_limit=5`; Vercel autoscale có thể vượt `max_connections` Aiven |
| Repo size | `sources/assets/images-originals/` ~119 MB tracked (không serve, nhưng làm clone/build nặng) |
| Ảnh ngoài | Quét read-only dev + prod: **0 URL** ngoài `/images` hoặc Cloudinary |

### E0 · Chốt mã nguồn + migration production (bắt buộc trước mọi thứ)

| | |
|---|---|
| **Mục tiêu** | Vercel thấy đúng code D10 và DB production không thiếu cột/index |
| **Việc** | Commit + push toàn bộ D10.2–D10.4 · backup bảng bị ảnh hưởng · chạy migration production · xác nhận `up to date` |
| **Backup** | `media` (nhỏ), `_prisma_migrations`, `admin_audit_logs` (nếu muốn); lưu ngoài repo, ví dụ `%TEMP%\xmsn-deploy-backup-*` |
| **Lệnh** | `node scripts/with-db.mjs prod npx prisma migrate deploy` → `node scripts/with-db.mjs prod npx prisma migrate status` |
| **Bẫy** | `media.public_id` là cột mới; deploy code trước migration → `P2022 unknown column public_id` ở `/admin/media`, upload, `media.create` |
| **Done khi** | `origin/main` chứa D10.4 · `migrate status` báo up to date · backup có timestamp · không chạy `db:seed` production |

> Migration D10.3 chỉ thêm index (an toàn, có thể chậm vài giây); D10.4 thêm cột nullable +
> unique index (an toàn với code cũ vì code cũ không select cột này). Rollback code không cần
> rollback DB.

### E1 · Tạo project Vercel + biến môi trường

| | |
|---|---|
| **Mục tiêu** | Build được trên Linux, kết nối đúng DB/Cloudinary, Preview tách khỏi Production |
| **Root Directory** | **`sources`** — repo root không có `package.json`; không đặt root là repo root |
| **Framework** | Next.js; Install `npm ci`; Build `npm run build`; Node **22.x** |
| **Region** | Chọn gần Aiven MySQL (Singapore/Đông Nam Á nếu có) để giảm latency |
| **Preview** | Nếu vẫn cho admin thao tác, dùng **DB preview riêng**; tuyệt đối không trỏ Preview vào production DB |

| Biến | Build | Runtime | Ghi chú |
|---|:--:|:--:|---|
| `DATABASE_URL` | ✅ | ✅ | Production DB; build cần vì `generateStaticParams` đọc DB. Cân nhắc `connection_limit=1` hoặc `2` |
| `AUTH_SECRET` | ✅ | ✅ | **≥32 ký tự**, giá trị mới; không dùng mẫu |
| `IP_HASH_SALT` | — | ✅ | Muối băm IP; khác `AUTH_SECRET` |
| `CLOUDINARY_URL` | ✅ | ✅ | Build dùng parse `remotePatterns`; runtime upload/xoá |
| `NEXT_PUBLIC_SITE_URL` | ✅ | ✅ | Thêm để hết warning `metadataBase`; dùng URL thật |
| `CRON_SECRET` | — | ✅ | Chỉ cần từ E3 |

- **Aiven:** Vercel egress IP động. Nếu Aiven đang giới hạn IP, phải allow public hoặc dùng
  static egress; kiểm tra bằng cách chạy build Preview trước.
- **Build env:** `DATABASE_URL`, `CLOUDINARY_URL` phải có ở **Build** (không chỉ Runtime), nếu
  không `generateStaticParams`/`remotePatterns` sẽ fallback/lỗi.
- **Sensitive:** đặt `DATABASE_URL`, `AUTH_SECRET`, `CLOUDINARY_URL`, `CRON_SECRET` dạng
  encrypted/sensitive; không log.
- **Done khi:** Preview build xanh · `/admin/login` mở được · `GET /api/admin/me` trả 401 khi
  chưa login (không phải 500 do DB) · log không có `P1001`/`P2022`.

### E2 · Sửa upload cho giới hạn 4.5 MB của Vercel — **đã xong 21/11/2026**

| | |
|---|---|
| **Vấn đề** | Vercel Function nhận tối đa **4.5 MB** request body; vượt → `413 FUNCTION_PAYLOAD_TOO_LARGE` **trước khi** vào route. Ảnh điện thoại 5–15 MB sẽ fail dù route cho 8 MB |
| **Hướng chọn** | **Nén ở client** trước khi gửi + hạ trần server về 4 MB. Giữ sharp server-side làm lớp kiểm tra/resize cuối |
| **Tạo mới** | `lib/media/limits.ts` (hằng số dùng chung: 4 MB trần ảnh, 4.5 MB trần body, ngưỡng nén 3.5 MB, edge 1920, q78) + `lib/media/resize-for-upload.ts` — `prepareImageForUpload(file)` dùng `createImageBitmap` + `<canvas>` + `toBlob("image/webp", 0.8)`; fallback JPEG; không hỗ trợ thì trả file gốc để server báo lỗi rõ |
| **Sửa** | `components/admin/media-upload-form.tsx` — nén trước khi gửi, nút hiện “Đang nén ảnh…” → “Đang tải ảnh…”, lỗi `ImageUploadError` hiện nguyên văn |
| **Sửa** | `server/media/upload-media.ts` — dùng `MAX_UPLOAD_BYTES` từ `lib/media/limits` (4 MB), message “Ảnh tối đa 4 MB” |
| **Sửa** | `app/api/admin/media/upload/route.ts` — `MAX_REQUEST_BODY_BYTES = 4.5 MB`, `export const maxDuration = 60` |
| **Sửa** | Copy UI `/admin/media`: “tối đa 4 MB · ảnh lớn được tự nén trước khi gửi” |
| **Bẫy** | `canvas.toBlob` là async; Safari cũ có thể không trả WebP → fallback JPEG; client không tin `file.size` sau nén (thử q thấp hơn rồi mới báo lỗi); server vẫn validate bằng sharp |
| **Test** | `scripts/tests/unit/image-upload.test.ts` — ngưỡng nén, `fitWithinEdge`, `formatBytes`, `fileNameForType`, ảnh nhỏ trả nguyên file. Live: upload ảnh >4 MB qua UI Preview (E5) |
| **Done khi** | Upload ảnh 5–10 MB từ UI thành công (đã nén) · request thô >4.5 MB bị chặn thân thiện · ảnh lưu Cloudinary vẫn WebP ≤1920 |

### E3 · Job định kỳ trên Vercel — **đã xong 21/11/2026**

| | |
|---|---|
| **Vấn đề** | `scripts/expire-holds.mjs` và `scripts/reconcile-seats.mjs` chỉ là CLI; Vercel không chạy. Đơn giữ chỗ quá hạn sẽ không tự nhả ghế |
| **Nguồn sự thật** | Tách logic vào `server/jobs/expire-holds.ts` và `server/jobs/reconcile-seats.ts`; nhận `now`/`dryRun`/`fix`/`all`/`batchSize` để test |
| **Route** | `app/api/jobs/expire-holds/route.ts` · `app/api/jobs/reconcile-seats/route.ts` — `GET` gọi `await connection()` rồi `handle*Cron(request)`; trả counts, `maxDuration = 60`, `cache-control: no-store` |
| **Bảo mật** | `lib/jobs/cron-auth.ts`: thiếu `CRON_SECRET` → 503 `CRON_DISABLED`; sai/thiếu Bearer → 401; so sánh `crypto.timingSafeEqual`; không log secret |
| **vercel.json** | `sources/vercel.json`: `expire-holds` `*/5 * * * *`, `reconcile-seats` `0 3 * * *` |
| **CLI** | `scripts/expire-holds.mts` + `scripts/reconcile-seats.mts` (thin wrapper, `process.loadEnvFile` rồi dynamic import service); `jobs:expire`/`jobs:reconcile` đổi sang `node --import tsx`; `tsx` chuyển sang **dependencies** để image `npm prune --omit=dev` vẫn chạy được |
| **Sửa note** | Note lịch sử đọc `holdHours` từ `getBookingSettings()` qua `holdExpiryNote()` — không còn hardcode “sau 24 giờ” |
| **Plan Vercel** | **Hobby chỉ cron 1 lần/ngày**; `*/5` sẽ fail deploy. Chọn **Pro** hoặc scheduler ngoài (GitHub Actions/cron-job.org) gọi route kèm secret |
| **Test** | `scripts/tests/jobs-route.test.mts` (503/401/200 + idempotent + `?fix=1`) gọi `handle*Cron` vì `connection()` ném lỗi ngoài request context Next; `scripts/tests/unit/cron-auth.test.ts`; `jobs.test.mjs` vẫn chạy CLI `.mts` |
| **Done khi** | `curl` route với secret trả `{ ok, expired, seatsReleased }` · tạo đơn `new` quá hạn → job route chuyển `expired`, `seats_taken` giảm · cron hiện trong Vercel dashboard/log |

`vercel.json` đặt trong `sources/`:

```json
{
  "crons": [
    { "path": "/api/jobs/expire-holds", "schedule": "*/5 * * * *" },
    { "path": "/api/jobs/reconcile-seats", "schedule": "0 3 * * *" }
  ]
}
```

- Hobby sẽ **fail deploy** với `*/5` (chỉ 1 lần/ngày). Khi đó dùng Pro hoặc bỏ `vercel.json`
  và gọi route bằng scheduler ngoài.
- Cron của Vercel chạy theo **UTC**: `0 3 * * *` = 10:00 giờ Việt Nam.
- Envelope thực tế: expire-holds trả
  `{ ok, scanned, expired, skipped, seatsReleased, remaining, orders }` (tối đa 100 order
  trong `orders`); reconcile-seats trả
  `{ ok, checked, mismatches, fixed, skipped, overbooked, staleHolds, items }`.
- `reconcile-seats` chỉ sửa khi query `?fix=1` (nhận `1/true/yes/on`), mặc định read-only
  (giống CLI `--fix`); `?all=1` gồm cả ngày đã qua.
- `GET` phải `await connection()` trước khi đọc header (Next 16 + `cacheComponents`), nên route
  export thêm `handle*Cron(request)` để test gọi trực tiếp ngoài request context.
- CLI `.mts` cần `tsx`; package đã chuyển `tsx` sang `dependencies` để image `npm prune --omit=dev`
  vẫn chạy `npm run jobs:expire`.

### E4 · Connection pool + rate limit phân tán

| | |
|---|---|
| **Mục tiêu** | Không làm cạn connection Aiven và không mất tác dụng rate limit khi Vercel scale |
| **DB** | Đổi `connection_limit` trong `DATABASE_URL` production về **1–2** (hoặc Prisma Accelerate/Aiven pooler); `connect_timeout=20`; theo dõi `Too many connections` |
| **Rate limit** | In-memory hiện tại chỉ đúng trên 1 process. Nếu mở public traffic, thay `lib/rate-limit.ts` bằng adapter Redis (Upstash `@upstash/ratelimit` + `@upstash/redis`), hàm async; cập nhật 8 call site (login action/route, orders, lookup, cancel, contact, reviews, media upload) |
| **Tối thiểu trước go-live** | Ghi nhận giới hạn per-instance; admin login vẫn nên có thêm giới hạn theo email + theo dõi log |
| **Test** | Nếu đổi async: mock Redis, test allowed/blocked/retryAfter; route tests reset state |
| **Done khi** | Chạy tải nhẹ 10–20 request đồng thời không lỗi connection · rate limit hoạt động qua 2 lambda (kiểm bằng log/2 request) |

### E5 · Preview deploy + smoke test

| | |
|---|---|
| **Mục tiêu** | Bắt lỗi Vercel/Linux/DB trước khi promote Production |
| **Deploy** | Tạo Preview từ nhánh/PR sau khi E0–E3 xong; bật Deployment Protection nếu cần |
| **Public smoke** | `/`, `/dat-tour`, `/tour/[slug]`, `/diem-den`, `/diem-den/[slug]`, `/am-thuc`, `/am-thuc/[slug]`, `/kinh-nghiem`, `/kinh-nghiem/[slug]`, `/lien-he` → 200; ảnh local + Cloudinary render |
| **Booking smoke** | Chọn chuyến → đặt 2 người lớn + 1 em bé → DB có row, mã `XMSN-YYYY-NNNN`, `seats_taken` +3; tra cứu đúng; huỷ → nhả chỗ |
| **Admin smoke** | Login owner; dashboard KPI; orders list/detail/confirm/cancel; users; account đổi mật khẩu → logout; audit; messages đổi trạng thái; settings lưu; CRUD nội dung → public đổi ngay (cache `updateTag`) |
| **Media smoke** | Upload ảnh >4 MB từ điện thoại → nén → 201; ảnh trong datalist; xoá ảnh không dùng → asset mất; xoá ảnh đang dùng → 409 |
| **Cron smoke** | Gọi route bằng secret; xem log Vercel; xác nhận `vercel.json` schedule |
| **Bẫy** | Preview trỏ production DB → cấm thao tác ghi; kiểm tra `DATABASE_URL` theo environment trước khi bấm |
| **Done khi** | Toàn bộ checklist trên xanh trên Preview; không có lỗi `P2022`, `P1001`, `413`, `FUNCTION_PAYLOAD_TOO_LARGE` trong log |

### E6 · Production cutover + rollback

| | |
|---|---|
| **Trước cutover** | E0 migration up to date · backup xong · E2/E3 đã deploy Preview xanh · env Production đủ |
| **Deploy** | Promote Preview hoặc merge `main`; theo dõi build/log 15 phút |
| **Sau deploy** | Smoke nhanh 6 route public + login admin + 1 upload + 1 đơn; kiểm cron chạy; kiểm `migrate status` |
| **Nội dung go-live** | Đổi mật khẩu admin mặc định · thay hotline/Zalo placeholder trong `settings` · kiểm tra `AUTH_SECRET`/`IP_HASH_SALT`/`CLOUDINARY_URL` là giá trị thật |
| **Rollback** | Vercel “Instant Rollback” về deployment trước; DB migration additive nên code cũ chạy được; không rollback migration trừ khi buộc |
| **Theo dõi** | Vercel Function errors, duration, Aiven connections, Cloudinary quota; đặt cảnh báo chi phí Image Optimization |
| **Done khi** | Production 200 các route chính · đặt/huỷ đơn thật · upload/xoá media · cron chạy · không có lỗi 5xx trong 24h |

### E7 · Docs + dọn repo cho Vercel

| | |
|---|---|
| **Sửa** | `sources/README.md`: thay mục “Triển khai (VPS / Docker)” bằng **Vercel** (Root `sources`, env, migration trước deploy, cron Hobby/Pro, preview DB); giữ VPS/Docker ở phụ lục nếu vẫn hỗ trợ |
| **Sửa** | `sources/README.md` bảng test/coverage cập nhật 257 case; thêm `test:audit`, `test:media` |
| **Thêm** | `sources/vercel.json` (cron); `sources/.vercelignore` loại `assets/images-originals/`, `coverage/`, `scripts/tests/` khỏi upload nếu không cần build |
| **Sửa** | `app/layout.tsx` (hoặc layout gốc) thêm `metadataBase` từ `NEXT_PUBLIC_SITE_URL` để hết warning build |
| **Tuỳ chọn** | Chuyển `sources/assets/images-originals/` ra ngoài repo/Git LFS; thêm `engines.node = "22.x"` để khoá version Vercel |
| **Done khi** | README không còn hướng dẫn VPS là mặc định · `vercel.json` hợp lệ · build không còn warning `metadataBase` · repo nhẹ hơn (nếu dọn assets) |

### 12.1 Thứ tự thực thi

```
E0 (push + migrate prod)
  └─▶ E1 (Vercel project + env)
        └─▶ E2 (upload ≤4.5 MB) ──▶ E3 (cron route + vercel.json)
              └─▶ E4 (pool/rate limit — khuyến nghị)
                    └─▶ E5 (Preview smoke)
                          └─▶ E6 (Production cutover)
                                └─▶ E7 (docs/cleanup)
```

- **E0 trước tất cả** — không có code trên GitHub/main thì Vercel deploy bản cũ.
- **E2 và E3 phải xong trước E5** — nếu không, upload ảnh thật và job hết hạn sẽ fail trên Vercel.
- **E4 có thể làm song song E2/E3** nhưng nên xong trước khi mở traffic public.
- **E6 chỉ sau khi E5 xanh**; không promote trực tiếp từ local.

### 12.2 Cổng chất lượng sau mỗi phase code

```sh
cd sources
npx tsc --noEmit && npm run lint && npm run build
npm test
npm run test:coverage
# riêng E2/E3:
npm run test:media
npm run test:jobs-route
npm run test:jobs          # CLI .mts thật, cần test DB
```

- Coverage gate hiện tại: full **85 / 88 / 92**, unit **96 / 92 / 93**. Sau E2/E3 đo được
  **86.96 / 88.26 / 93.42** (269 test) — chưa ratchet vì lines nhích <1 điểm; lần sau đo lại
  và chỉ nâng, không hạ.
- Live smoke trên **Preview** dùng DB preview; không dùng `DATABASE_URL` production từ local
  trừ E0 migration có backup.

### 12.3 Rủi ro riêng của Track E

| Rủi ro | Giảm thiểu |
|---|---|
| Deploy code trước migration → `P2022 public_id` | E0 bắt buộc `migrate deploy` + `status` trước khi promote |
| Vercel 4.5 MB → 413 với ảnh điện thoại | E2 nén client + trần server 4 MB + test ảnh >4 MB |
| Hobby cron 1 lần/ngày, `*/5` fail deploy | Dùng Pro hoặc scheduler ngoài; ghi rõ trong README |
| Job không chạy → giữ chỗ vô hạn | E3 route + `vercel.json` + test job route + theo dõi log |
| Autoscale làm cạn connection Aiven | `connection_limit=1–2`, region gần DB, theo dõi `max_connections`, cân nhắc Accelerate |
| Rate limit in-memory mất tác dụng | E4 Redis hoặc chấp nhận có ghi chú + giới hạn login theo email |
| Preview ghi vào production DB | DB preview riêng; kiểm tra env theo môi trường; Deployment Protection |
| Build không kết nối được Aiven do IP allowlist | Kiểm tra allowlist trước; allow Vercel hoặc static egress |
| `metadataBase` warning/SEO social | E7 thêm `NEXT_PUBLIC_SITE_URL` + `metadataBase` |
| Repo 119 MB assets làm build chậm | E7 `.vercelignore`/Git LFS/move out |
| Rollback code sau migration | Migration additive; Vercel Instant Rollback; không drop cột/index |
| Cloudinary lỗi/timeout khi upload | Adapter đã retry 1 lần; route trả 502; UI báo thử lại; không tạo row dở |

