# Design System: Quản trị — Xuôi Miền Sông Nước

> Nguồn sự thật cho 5 màn admin: đăng nhập, tổng quan, danh sách đơn, chi tiết đơn, 404.
> Áp dụng cho `sources/app/admin/**` và `sources/components/admin/**`.
> **Không** áp dụng cho storefront — storefront dùng `sources/DESIGN.md`.
>
> Tài liệu này thay thế bản Stitch. Bản Stitch chỉ còn giá trị tham chiếu thị giác;
> mọi class trong đó phải đối chiếu bảng §11 trước khi dùng.

---

## 0. Phạm vi

| Có | Không |
|---|---|
| 5 màn đang tồn tại | Module khách hàng, lịch trình, tin nhắn, thanh toán |
| Bảng dữ liệu vận hành | Biểu đồ, dashboard phân tích, xuất file |
| Form đăng nhập + hành động đơn | Phân quyền, nhật ký hệ thống, in ấn |

Mọi con số hiển thị phải đến từ query (`countOrdersByStatus`, `listAdminOrders`,
`getAdminOrderById`). Không copy dữ liệu mẫu từ bản thiết kế vào code.

---

## 1. Nguyên tắc

Admin là **công cụ làm việc**, không phải trang marketing.

- Mật độ cao: bảng thay cho card trên desktop, số liệu căn phải, không khoảng trắng trang trí.
- Không ảnh, không minh hoạ, không gradient, không hero.
- Thương hiệu đến từ màu, kiểu chữ và logo ở sidebar — không phải từ hiệu ứng.
- Mỗi màn có đúng một hành động chính. Hành động nguy hiểm luôn tách khỏi hành động chính.
- Trạng thái rỗng, lỗi, đang xử lý là một phần của thiết kế, không phải phần thêm sau.

---

## 2. Token

Chỉ dùng các token đã khai báo trong `app/globals.css` (`@theme`).

| Token | Giá trị | Dùng cho |
|---|---|---|
| `canvas` | `#F6F1E6` | Nền trang |
| `surface` | `#FFFDF7` | Nền card, input |
| `surface-warm` | `#EFE6D5` | Header bảng, hover hàng, chip trung tính |
| `ink` | `#17332B` | Chữ chính, nền sidebar |
| `sage` | `#5F6D65` | Chữ phụ, label, meta |
| `clay` | `#A84A2B` | Hành động chính, mục nav đang chọn, focus ring |
| `clay-hover` | `#8C3A21` | Hover của hành động chính |
| `clay-soft` | `#EAD2C5` | Nền nhấn nhẹ (dùng hạn chế) |
| `contrast-on-accent` | `#FFF9F0` | Chữ trên nền `ink` và nền `clay` |
| `line` | `rgba(23,51,43,0.16)` | Viền, đường phân cách |
| `success` | `#2F6A4C` | Đã xác nhận |
| `warning` | `#8A5B16` | Chờ xác nhận |
| `danger` | `#A23B32` | Đã huỷ, lỗi, quá hạn |

Không dùng `#000`, `#fff`, xanh dương, hay token shadcn (`accent`, `primary`, `secondary`,
`muted`) trong khu vực admin — chúng là thang xám, không phải palette thương hiệu.

---

## 3. Kiểu chữ

| Vai trò | Class | Ghi chú |
|---|---|---|
| H1 trang | `font-display text-[26px] sm:text-[28px] leading-tight font-medium tracking-[-0.02em] text-ink` | Fraunces. Chỉ dùng cho tiêu đề trang |
| H2 khối | `text-[16px] font-semibold text-ink` | Be Vietnam Pro |
| Thân | `text-[14px] leading-relaxed text-ink` | |
| Bảng | `text-[13px]` | |
| Label | `text-[12px] font-semibold tracking-[0.02em] text-sage` | Nhãn field, tiêu đề cột |
| Meta | `text-[12px] text-sage` | Thời gian, ghi chú phụ |
| Mã đơn / tour | `font-mono text-[13px]` | Không đổi chữ, không viết hoa lại |
| Số KPI | `font-display text-[32px] leading-none font-medium tabular-nums` | |

Quy tắc:

- `font-display` **chỉ** cho H1 và số KPI. Không dùng trong bảng, nút, label.
- Không dùng `font-serif` — đó là Georgia mặc định, không phải Fraunces.
- Mọi con số trong bảng dùng `tabular-nums`.
- Không dùng quá 3 cỡ chữ trong một khối.

---

## 4. Bố cục

```
≥1024px                      <1024px
┌──────────┬──────────────┐  ┌──────────────────────┐
│ sidebar  │ content      │  │ top bar 56px         │
│ 248px    │ max 1200px   │  ├──────────────────────┤
│ sticky   │ padding 32   │  │ content              │
│ h-dvh    │              │  │ padding 16 → 24      │
└──────────┴──────────────┘  └──────────────────────┘
```

- Sidebar: `bg-ink`, `lg:sticky lg:top-0 lg:h-dvh lg:w-[248px]`, chứa logo 40px, wordmark,
  nhãn `QUẢN TRỊ`, 2 mục nav, footer tên admin + đăng xuất.
- Nav item: `min-h-11` (44px), `rounded-md`, icon 18px. Mục đang chọn có nền
  `contrast-on-accent/10`, thanh `bg-clay` 3px bên trái và `aria-current="page"`.
- Content: `max-w-[1200px]`, padding `px-4 py-6 sm:px-6 lg:px-8 lg:py-8`.
- Mobile: top bar `h-14` + drawer `w-[300px] max-w-[85vw]`, đóng bằng Escape, bằng nút X,
  và tự đóng khi chuyển trang; khoá `body` overflow khi mở.
- **Chỉ một vùng cuộn: document.** Không đặt `overflow-y-auto` + `h-dvh` cho content.
- Khoảng cách giữa các khối trong trang: `gap-6` (24px); trong card: `gap-4`.
- Card: `rounded-xl border border-line bg-surface p-5 sm:p-6`, **không shadow**.
  Shadow chỉ cho dialog và card đăng nhập.

---

## 5. Thành phần

### Nút

| Loại | Class |
|---|---|
| Chính | `h-10 rounded-[10px] bg-clay px-4 text-[13px] font-semibold text-contrast-on-accent hover:bg-clay-hover` |
| Phụ | `h-10 rounded-[10px] border border-line px-4 text-[13px] font-semibold text-ink hover:bg-ink/5` |
| Nguy hiểm | `h-10 rounded-[10px] border border-danger/40 px-4 text-[13px] font-semibold text-danger hover:bg-danger/10` |
| Link | `text-[13px] font-medium text-sage underline-offset-4 hover:text-ink hover:underline` |

- Chiều cao 40px desktop, 44px trên thiết bị cảm ứng.
- Mỗi khối hành động chỉ có **một** nút chính.
- Nút nguy hiểm đặt cuối, có khoảng cách, và input lý do ngay trên nó.
- Trạng thái đang gửi: `disabled` + `opacity-60` + đổi nhãn, không đổi kích thước.

### Input / select

`h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink`,
label `text-[12px] font-semibold text-sage` phía trên, placeholder `text-sage`.
Lỗi: `border-danger` + `aria-invalid="true"` + câu lỗi 12px `text-danger` phía dưới.

### Chip trạng thái

Nền: `inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none`.
Chi tiết màu ở §6. Chip luôn có **chữ**; không dùng màu làm tín hiệu duy nhất.

### Bảng

- Header: `bg-surface-warm`, chữ 12px `font-semibold text-sage`, cao 44px.
- Hàng: cao 52px, phân cách `divide-y divide-line`, hover `bg-surface-warm/50`.
- Số và tiền căn phải; chữ căn trái; trạng thái căn trái (không căn giữa).
- Mã đơn là link duy nhất trong hàng; cả hàng không click được.
- Bọc bảng trong `overflow-x-auto` khi có từ 7 cột.
- `<th>` luôn có `scope="col"`.

### KPI card

`rounded-xl border border-line bg-surface p-5`, label 13px `text-sage`, số 32px `font-display`,
mũi tên 16px góc phải. Là link thật tới danh sách đã lọc. Hover đổi viền sang `border-clay`.

### Timeline trạng thái

Cột thời gian 160px `text-[12px] text-sage`, đường dọc 1px `border-line`, chấm 7px `bg-ink`
(chấm đầu tiên `bg-clay`). Nội dung: chip trạng thái + `from → to` + ghi chú + `changedBy`.

### Trạng thái rỗng

Khối `py-12 text-center`: dòng 13px `text-sage` + link hành động 13px `text-clay`.
Không dùng minh hoạ.

---

## 6. Hệ thống trạng thái

Nguồn duy nhất: `lib/booking/status-labels.ts` (tạo ở A2). `server/booking/dto.ts` và mọi
trang admin phải import từ đó, không tự khai báo lại.

| Key | Nhãn | Chip |
|---|---|---|
| `new` | Chờ xác nhận | `bg-warning/15 text-warning` |
| `pending` | Đang liên hệ | `bg-surface-warm text-ink` |
| `confirmed` | Đã xác nhận | `bg-success/15 text-success` |
| `completed` | Đã hoàn thành | `bg-ink/10 text-ink` |
| `cancelled` | Đã huỷ | `bg-danger/15 text-danger` |
| `expired` | Hết hạn giữ chỗ | `bg-sage/15 text-sage` |

- "Quá hạn giữ chỗ" (`holdExpired`) là **nhãn chữ** 12px `text-danger` dưới mã đơn,
  không phải chip và không thay thế chip trạng thái.
- Nhãn phải khớp bản khách hàng nhìn thấy (tra cứu đơn, xác nhận đặt tour). Sai lệch giữa
  admin và storefront là lỗi.

---

## 7. Định dạng dữ liệu

| Loại | Hàm | Kết quả |
|---|---|---|
| Tiền | `formatVndDisplay` | `8.380.000 ₫` (có khoảng trắng trước ₫) |
| Ngày | `formatDateVN` | `05/11/2026` |
| Ngày + giờ | `formatDateTimeVN` | `05/11/2026 08:42` |
| Mã đơn | nguyên văn | `XMSN-2026-0187` |
| Số khách | số nguyên | `3` — không kèm chữ "khách" trong ô số |

- Tiền luôn căn phải và `tabular-nums`.
- Không tự nhân đơn giá × số khách trong UI trừ khi công thức giống `server/booking`.
  Ưu tiên hiển thị đúng 4 số server đã lưu: `unitPriceAdult`, `unitPriceChild`,
  `surcharge`, `totalAmount`.
- `null`/rỗng hiển thị `—` màu `text-sage`, không để trống ô.

> Đã chuẩn hoá ở A2: `formatDateTimeVN` trả `dd/MM/yyyy HH:mm` (trước là `08:42 5/11/26`),
> và `formatVnd` (`…đ`) đã bị xoá — admin và storefront dùng chung `formatVndDisplay` (`… ₫`).

---

## 8. Responsive

| Ngưỡng | Thay đổi |
|---|---|
| `<768px` | Danh sách đơn và bảng tổng quan đều dùng card; bộ lọc xếp dọc, nút full width; hành động full width, cao 44px |
| `768–1023px` | Ẩn sidebar, dùng top bar + drawer. Tổng quan (6 cột) dùng bảng; danh sách đơn (8 cột) vẫn dùng card |
| `≥1024px` | Sidebar cố định 248px. Danh sách đơn vẫn dùng card: 8 cột cần ~821px trong khi vùng nội dung ở 1024 chỉ còn ~710px |
| `≥1280px` | Danh sách đơn chuyển sang bảng (vùng nội dung ~966px) |

Kiểm tra bắt buộc: `scrollWidth === innerWidth` ở 375 / 390 / 768 / 1024 / 1280 / 1440.

---

## 9. Chuyển động

- Chỉ hover/focus: `transition-colors` 120–160ms.
- Không animation khi tải trang, không parallax, không pulse.
- Tôn trọng `prefers-reduced-motion` (đã xử lý ở `globals.css`).

---

## 10. Tiếp cận

- Mọi link/nút/card-link có `focus-visible:ring-2 focus-visible:ring-clay/40
  focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none`.
  Không bao giờ `outline-none` mà không có ring thay thế.
- Vùng chạm tối thiểu 44×44px trên mobile (`min-h-11`).
- Không dùng `sage` trên nền `ink` (2.4:1). Trên nền tối dùng `text-contrast-on-accent`
  với độ mờ 60–70%.
- Lỗi form: `role="alert"` + `aria-invalid` trên field liên quan.
- Bảng: `scope="col"`; nav: `aria-current="page"`; drawer: `role="dialog" aria-modal`.
- Không truyền đạt trạng thái chỉ bằng màu — chip luôn kèm nhãn chữ.

---

## 11. Đối chiếu bản Stitch (chỉ để tra, **không dùng** các class bên trái)

| Class trong bản Stitch | Thay bằng |
|---|---|
| `bg-accent`, `text-accent` | `bg-clay`, `text-clay` |
| `bg-accent-soft` | `bg-clay-soft` |
| `border-hairline`, `divide-hairline` | `border-line`, `divide-line` |
| `text-muted` | `text-sage` |
| `bg-surface-container*` | `bg-surface-warm` hoặc bỏ nền |
| `font-serif` | `font-display` |
| `font-code-id`, `text-code-id` | `font-mono` + cỡ thật |
| `font-label-md`, `font-metadata`, `font-headline-sm`, `font-eyebrow`, `font-body-md` | bỏ, dùng `text-[Npx] font-semibold` |
| `bg-danger-bg` | `bg-danger/10` |
| `shadow-sm` trên card | bỏ shadow, dùng `border-line` |
| `md:` cho bố cục 2 cột | `lg:` |

Kiểm tra trước khi merge:

```sh
grep -rn "bg-accent\|text-accent\|surface-container\|font-serif\|bg-danger-bg\|hairline" \
  components/admin app/admin
```

Kết quả phải rỗng.

---

## 12. Không làm

- Không thêm mục nav ngoài "Tổng quan" và "Đơn hàng".
- Không hiển thị dữ liệu không có trong schema: tàu, khoang, số ghế, giờ trễ, mã khách hàng,
  trạng thái thanh toán, Zalo ZNS.
- Không hardcode mã đơn, tên khách, số tiền hay "đồng bộ máy chủ" trong JSX.
- Không tự viết lại câu lỗi của server (đăng nhập, đặt tour).
- Không dùng `shadow` cho card, không gradient, không ảnh.
- Không thêm nút "mô phỏng", "demo", "xem trạng thái" vào UI.

---

## 13. Checklist trước khi merge một màn admin

```sh
npx tsc --noEmit && npm run lint && npm run build
```

- [ ] Không có class ngoài §2/§3 (đặc biệt `accent`, `primary`, `muted`, `font-serif`).
- [ ] Mọi số liệu đến từ query, không có dữ liệu mẫu trong JSX.
- [ ] 375 / 390 / 768 / 1024 / 1280 / 1440 không tràn ngang.
- [ ] Tab đi hết màn hình, focus ring hiển thị rõ.
- [ ] Có trạng thái rỗng và trạng thái lỗi.
- [ ] Hành động hợp lệ theo trạng thái đơn (xem §6 và A6).

---

## 14. Đã triển khai (A0–A8)

### Route ↔ file

| Màn | Route | File |
|---|---|---|
| Đăng nhập | `/admin/login` | `app/admin/login/page.tsx` · `login-form.tsx` |
| Tổng quan | `/admin` | `app/admin/(dashboard)/page.tsx` |
| Danh sách đơn | `/admin/orders` | `app/admin/(dashboard)/orders/page.tsx` |
| Chi tiết đơn | `/admin/orders/[id]` | `app/admin/(dashboard)/orders/[id]/page.tsx` |
| 404 trong shell | — | `app/admin/(dashboard)/not-found.tsx` |
| 404 fallback | — | `app/admin/not-found.tsx` |

### Component dùng chung

| File | Vai trò |
|---|---|
| `components/admin/admin-sidebar.tsx` | Cột 248px desktop, logo 40px, footer admin |
| `components/admin/admin-mobile-nav.tsx` | Top bar 56px + drawer 300px (Escape, khoá scroll) |
| `components/admin/admin-nav-links.tsx` | 2 nav, `usePathname`, `aria-current`, thanh clay |
| `components/admin/admin-page-header.tsx` | Breadcrumb + H1 + mô tả + actions; `titleClassName` cho mã đơn |
| `components/admin/status-badge.tsx` | 6 chip + `HoldExpiredLabel` |
| `components/admin/order-actions.tsx` | Form hành động theo trạng thái, `useFormStatus` |
| `lib/booking/status-labels.ts` | Nguồn nhãn duy nhất, dùng cả ở `server/booking/dto.ts` |

### Hành vi đã chốt

- Chi tiết đơn chỉ hiện hành động hợp lệ; huỷ bắt buộc nhập lý do.
- Danh sách đơn: lọc `status`/`q` bằng GET, phân trang giữ filter; card ở `<768`.
- Tổng quan: 4 KPI là link thật, số 0 vẫn hiển thị (màu `sage`).
- Tiền/ngày theo §7; nguồn đơn map `web|zalo|phone|facebook`.

### Sai lệch đã biết

1. **404 admin trả HTTP 200**, không phải 404. `/admin/orders/[id]` là `◐` (partial prerender)
   nên shell được gửi trước khi `notFound()` chạy; Next gắn `noindex`. Muốn 404 thật phải
   kiểm tra tồn tại đơn ở `proxy.ts` — chưa làm.
2. **Login reset form sau khi action chạy** (React 19 tự reset). Đã thử 3 cách giữ giá trị,
   đều vướng `react-hooks/set-state-in-effect` hoặc vẫn bị reset; giữ hành vi chuẩn.

### Kiểm chứng tự động

```sh
npx tsc --noEmit && npm run lint && npm run build
npm run test:unit          # gồm status-labels.test.ts + format.test.ts
```

`scripts/tests/unit/status-labels.test.ts` khoá 6 nhãn, thứ tự enum, và fallback nguyên văn
cho giá trị lạ. `scripts/tests/unit/format.test.ts` khoá `dd/MM/yyyy HH:mm` và `… ₫`.
