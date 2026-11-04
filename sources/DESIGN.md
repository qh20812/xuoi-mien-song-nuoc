# Design System: Xuôi Miền Sông Nước

> Tài liệu nguồn cho Google Stitch khi thiết kế giao diện khách hàng.
> Phạm vi: storefront public. Không bao gồm `/admin`.
> Khi bắt đầu một phiên Stitch, dùng câu lệnh:
> “Use this `DESIGN.md` as the visual source of truth. Follow its colors, typography, layout rules, business constraints, and anti-patterns exactly.”

---

## 0. Cấu hình Stitch

| Dial | Mức | Định hướng |
|---|---:|---|
| Creativity | 7 | Editorial, có cá tính, không chạy theo template du lịch phổ thông |
| Density | 4 | Thoáng, đủ nội dung, ưu tiên ảnh và khoảng thở |
| Variance | 7 | Bố cục bất đối xứng có kiểm soát, không lặp grid đều nhau |
| Motion intent | 5 | Chuyển động nhẹ, chậm, không gây mất tập trung |
| Primary viewport | 1440px | Desktop |
| Mobile viewport | 390px | Kiểm tra thêm 375px |
| Ngôn ngữ | Tiếng Việt | Luôn có dấu, không dùng lorem ipsum |

---

## 1. Visual Theme & Atmosphere

**“Buổi sớm trên bến sông Nam Bộ.”**

Giao diện mang cảm giác tĩnh, ấm và đáng tin cậy: nắng nhẹ trên mặt kênh, rừng tràm còn sương, một chiếc xuồng đi qua vùng nước rộng. Đây là một website du lịch có chiều sâu địa phương, không phải landing page nghỉ dưỡng nhiệt đới chung chung và cũng không phải ứng dụng SaaS.

Ảnh thật đóng vai trò chính. Chữ có chất editorial, rõ ràng và tiết chế. Màu đất nung chỉ xuất hiện ở hành động quan trọng. Đường nét mảnh, nhịp dọc của hành trình và các khoảng trắng lớn tạo cảm giác bình tĩnh nhưng vẫn thôi thúc đặt tour.

**Tính cách cần đạt:**

- Tự nhiên, mộc mạc có chọn lọc — không thô, không “quê” theo kiểu hàng lưu niệm.
- Đáng tin cậy, cụ thể, minh bạch về giá và chính sách.
- Sang nhưng gần gũi; không xa xỉ, không phô trương.
- Mobile-first vì phần lớn khách truy cập bằng điện thoại.

**Không khí cần tránh:**

- Resort nhiệt đới bóng bẩy, cọ dừa, hoa lá trang trí rải rác.
- Giao diện AI tím, glassmorphism, gradient màn hình.
- Bố cục đối xứng cứng nhắc hoặc mọi section đều là một hàng card giống nhau.
- Nội dung giật tít kiểu “thiên đường”, “trải nghiệm tuyệt vời”, “nâng tầm hành trình”.

---

## 2. Color Palette & Roles

| Tên | Token | HEX | Vai trò |
|---|---|---|---|
| Rice Paper | `--canvas` | `#F6F1E6` | Nền chính toàn site |
| Palm Leaf Surface | `--surface` | `#FFFDF7` | Nền card, form, modal |
| River Ink | `--ink` | `#17332B` | Chữ chính, heading, border đậm |
| Sedge Green | `--muted` | `#5F6D65` | Mô tả, metadata, chữ phụ |
| Clay Accent | `--accent` | `#A84A2B` | CTA, link đang hoạt động, focus ring |
| Clay Hover | `--accent-hover` | `#8C3A21` | Hover/pressed của CTA |
| Clay Tint | `--accent-soft` | `#EAD2C5` | Nền chọn nhẹ, highlight không tương tác |
| River Border | `--border` | `rgba(23, 51, 43, 0.16)` | Đường phân cách 1px |
| Warm Highlight | `--surface-warm` | `#EFE6D5` | Dải thông tin hoặc section xen kẽ |
| Success | `--success` | `#2F6A4C` | Trạng thái thành công, còn chỗ |
| Warning | `--warning` | `#8A5B16` | Sắp hết chỗ, lưu ý |
| Danger | `--danger` | `#A23B32` | Lỗi, hủy đơn, quá hạn |

### Quy tắc màu

- Chỉ có **một accent thương hiệu**: Clay Accent. Không thêm xanh dương, tím hoặc cam neon.
- `--accent` chỉ dùng cho CTA chính, link active, focus ring và điểm nhấn có chủ đích.
- Màu semantic chỉ dùng cho trạng thái, không dùng trang trí.
- Không dùng `#000000`; chữ đậm nhất là River Ink.
- Không dùng cool gray. Toàn bộ neutral phải ấm và cùng họ với Rice Paper.
- Không dùng gradient làm nền hoặc chữ. Chuyển sắc chỉ có thể đến từ ảnh thật.
- Chữ trên nền accent dùng `#FFF9F0`; kiểm tra tương phản tối thiểu WCAG AA.

---

## 3. Typography Rules

### Cặp font

| Vai trò | Font | Nguồn |
|---|---|---|
| Display / heading | **Fraunces** | Google Fonts, có Vietnamese subset |
| Body / UI | **Be Vietnam Pro** | Google Fonts, có Vietnamese subset |
| Mã đơn / mã tour | **JetBrains Mono** | Chỉ dùng cho mã và số cần đối chiếu |

Fraunces dùng optical size lớn, `SOFT` thấp, `WONK = 0`. Không dùng italic mặc định cho toàn bộ heading.

### Scale

| Vai trò | Size | Weight | Line-height | Tracking |
|---|---|---|---|---|
| Hero H1 | `clamp(2.75rem, 6.2vw, 5.75rem)` | 500 | 0.98–1.04 | -0.03em |
| H1 trang con | `clamp(2.5rem, 4.8vw, 4.25rem)` | 500 | 1.04 | -0.025em |
| H2 section | `clamp(2rem, 3.2vw, 3rem)` | 500 | 1.08 | -0.02em |
| H3 card | `1.375rem` | 600 | 1.25 | -0.01em |
| Body lớn / intro | `1.125rem` | 400 | 1.65 | 0 |
| Body | `1rem` | 400 | 1.65 | 0 |
| UI label | `0.875rem` | 600 | 1.35 | 0 |
| Metadata | `0.8125rem` | 500 | 1.45 | 0.01em |
| Eyebrow | `0.75rem` | 600 | 1.3 | 0.14em, uppercase |

### Quy tắc chữ

- Body tối đa `65ch`; không kéo dòng quá rộng.
- Không dùng body nhỏ hơn `14px`; input mobile tối thiểu `16px`.
- Heading tiếng Việt cần line-height đủ thoáng để dấu không chạm dòng trên/dưới.
- Chỉ dùng uppercase cho eyebrow ngắn, không dùng cho đoạn văn hoặc heading dài.
- Giá hiển thị dạng `4.190.000 ₫`, dùng `font-variant-numeric: tabular-nums`.
- Ngày hiển thị dạng `Thứ Bảy, 24/10/2026`.
- Mã đơn dùng JetBrains Mono, ví dụ `XMSN-2026-0012`.
- Không dùng chữ nghiêng để nhấn mạnh; dùng weight hoặc màu.

---

## 4. Shape, Spacing & Grid

### Spacing

Base unit: `4px`.

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128`

- Padding ngang: `20px` mobile, `32px` tablet, `64px` desktop.
- Khoảng cách section: `clamp(72px, 9vw, 144px)`.
- Khoảng cách trong card: `20px` mobile, `24–32px` desktop.
- Khoảng giữa label và input: `8px`; giữa input và error: `6px`.

### Layout

- Max content width: `1320px`.
- Grid desktop: 12 cột, gutter `24px`.
- Tablet: 8 cột; mobile: 4 cột.
- Dùng CSS Grid cho cấu trúc; không dùng phép tính phần trăm flexbox.
- Section có thể full-bleed ảnh nhưng nội dung vẫn nằm trong container.
- Không đặt chữ đè lên ảnh. Mọi thành phần có vùng không gian riêng.
- Section toàn màn hình dùng `min-height: 100dvh`, không dùng `100vh`.

### Radius

- Button, input: `10px`.
- Media, gallery item: `16px`.
- Card, panel: `20–24px`.
- Badge/status: pill.
- Không bo tròn mọi thứ. Chỉ card và control mới dùng radius.

### Border & Shadow

- Border mặc định `1px solid rgba(23, 51, 43, 0.16)`.
- Shadow chỉ dùng cho lớp nổi: dropdown, modal, sticky bar.
- Shadow: `0 18px 48px -24px rgba(23, 51, 43, 0.22)`.
- Không dùng shadow phát sáng hoặc shadow đen đậm.

---

## 5. Component Stylings

### Wordmark

- Dùng wordmark chữ “Xuôi Miền Sông Nước”, không tự tạo logo phức tạp.
- Có thể thêm một nét mảnh gợi dòng sông bằng SVG, nhưng không dùng icon lá, thuyền, nón lá làm logo.
- Trên mobile chỉ cần wordmark gọn hoặc chữ “XMSN” nếu không đủ chỗ.

### Header

- Cao `80px` desktop, `64px` mobile.
- Nền Rice Paper hoặc trong suốt trên hero nếu độ tương phản đủ; khi sticky chuyển sang `--surface`.
- Trái: wordmark. Giữa: Tour, Hành trình, Điểm đến, Ẩm thực, Kinh nghiệm. Phải: hotline dạng text link nhỏ và CTA “Đặt tour”.
- Mobile: wordmark, nút gọi/Zalo dạng icon có label ẩn, menu mở toàn màn hình.
- Không dùng hamburger quá nhỏ; touch target tối thiểu `44 × 44px`.
- Không có dropdown phức tạp ở phiên bản đầu.

### Button

- Primary: nền Clay Accent, chữ `#FFF9F0`, cao `48px`, padding ngang `24px`, radius `10px`, weight 600.
- Hover: `--accent-hover`; active: dịch xuống `1px`; focus ring accent 2px, offset 2px.
- Secondary: nền trong suốt, border River Ink, chữ River Ink.
- Ghost: chỉ dùng cho hành động phụ trong form hoặc modal.
- Disabled: giảm opacity, giữ nguyên contrast chữ, `cursor: not-allowed`.
- Mobile: CTA trong form full-width. Không dùng pill cho CTA chính.
- Mỗi khu vực chỉ có một CTA primary. Hero có thể có thêm một text link “Xem hành trình”, không phải button thứ hai ngang hàng.

### Link

- Màu River Ink, gạch chân khi hover/focus.
- Link trong nội dung có underline mặc định để dễ nhận biết.
- Không dùng accent cho toàn bộ đoạn văn.

### Tour Card

- Ảnh tỉ lệ `4:3`, radius `16px`, không chứa chữ trong ảnh.
- Bên dưới: thời lượng, tên tour, tagline ngắn, giá từ, lịch khởi hành gần nhất, số chỗ còn lại.
- Toàn card là một link có focus state rõ ràng; không đặt nhiều nút cạnh tranh bên trong.
- Nền Palm Leaf Surface, border 1px, không shadow mặc định; hover nâng nhẹ bằng transform và border đậm hơn.
- Không dùng badge “HOT”, “BEST SELLER” nếu dữ liệu không xác nhận.
- Trạng thái hết chỗ dùng text rõ ràng và ảnh giảm nhẹ độ tương phản, không chỉ đổi màu.

### Departure Selector

- Mỗi ngày khởi hành là một hàng chọn được, cao tối thiểu `56px`.
- Trái: ngày, thứ; giữa: số chỗ còn lại; phải: giá nếu khác giá cơ bản.
- Selected: border accent 2px, nền `--accent-soft`, checkmark rõ ràng.
- Disabled/hết chỗ: nền warm, chữ muted, ghi “Hết chỗ”.
- Không dùng dropdown ẩn nếu có ít hơn 8 lựa chọn; hiển thị trực tiếp dễ so sánh hơn.

### Form và Input

- Label luôn nằm trên input; placeholder chỉ là ví dụ, không thay label.
- Input, select cao `48px`, radius `10px`, nền surface, border 1px.
- Focus: border accent, ring 2px accent với offset 2px.
- Error: border danger, thông báo ngay dưới, có icon chữ không dùng emoji.
- Helper text màu muted, tối đa 2 dòng.
- Không dùng floating label.
- Các trường bắt buộc đánh dấu bằng chữ “Bắt buộc” hoặc dấu `*` kèm ghi chú; không chỉ dùng màu đỏ.
- Không hiển thị mật khẩu, token hoặc mã kỹ thuật trong UI.

### Quantity Stepper

- Dùng cho người lớn, trẻ em, em bé.
- Nút `−` và `+` tối thiểu `44 × 44px`, số ở giữa rõ ràng.
- Luôn hiển thị đơn giá và tổng số chỗ ngay cạnh nhóm.
- Em bé ghi rõ “Miễn phí · vẫn tính 1 chỗ”.
- Không cho giảm dưới 0 hoặc vượt giới hạn; disable nút và giải thích ngắn.

### Timeline Hành Trình

- Dùng một đường dọc mảnh như dòng kênh, các chặng là điểm dừng.
- Mỗi chặng gồm: ngày/chặng, tên địa điểm, mô tả ngắn, khoảng cách/thời gian nếu có.
- Desktop có thể so le nội dung hai bên đường; mobile chuyển thành một cột, không chồng chữ lên ảnh.
- Không dùng zig-zag trang trí quá dày hoặc icon phương tiện nhiều màu.

### Status Badge

Luôn có text, không truyền đạt chỉ bằng màu.

| Trạng thái | Nhãn UI | Màu |
|---|---|---|
| `new` | Chờ xác nhận | Clay Tint / River Ink |
| `pending` | Đang liên hệ | Warning nhạt |
| `confirmed` | Đã xác nhận | Success nhạt |
| `completed` | Hoàn thành | Success nhạt, đậm hơn |
| `cancelled` | Đã hủy | Danger nhạt |
| `expired` | Hết hạn | Neutral |

### Gallery

- Desktop: ảnh chính lớn + 2–4 ảnh phụ, bố cục không đều.
- Mobile: ảnh chính + dải thumbnail cuộn ngang có snap.
- Không tự động phát carousel.
- Ảnh phải có alt text mô tả địa điểm thật.
- Không dùng ảnh stock không đúng địa danh.

### Accordion / FAQ

- Header cao tối thiểu `52px`, chữ trái, dấu `+ / −` đơn giản bên phải.
- Mở một mục không làm layout nhảy mạnh.
- Dùng button ngữ nghĩa, hỗ trợ bàn phím và `aria-expanded`.
- Không dùng accordion cho nội dung bắt buộc phải đọc trước khi đặt tour.

### Modal / Dialog

- Chỉ dùng cho xác nhận hủy đơn hoặc thông tin phụ.
- Nền overlay `rgba(23, 51, 43, 0.48)`, panel surface radius `20px`.
- Mobile: panel gần full-width, nút xếp dọc.
- Không dùng modal cho form đặt tour chính.

### Loading, Empty & Error

- Loading: skeleton đúng kích thước ảnh/card/field, shimmer nhẹ; không dùng spinner tròn.
- Empty: minh họa bằng nét mảnh hoặc bố cục ảnh, kèm hành động tiếp theo.
- Error toàn trang: tiêu đề rõ, mô tả ngắn, nút thử lại hoặc về trang tour.
- Lỗi form: inline tại trường; lỗi gửi form hiển thị summary phía trên nút submit.
- Thành công đặt chỗ: mã đơn nổi bật, nút sao chép, thông báo chờ xác nhận, link tra cứu.

### Footer

- Nền River Ink, chữ kem.
- Cột: thương hiệu + mô tả ngắn; liên kết khám phá; thông tin liên hệ; chính sách.
- Hotline/Zalo rõ nhưng không tạo cảm giác khẩn cấp.
- Không đặt CTA accent lớn trong footer; footer là nơi kết thúc, không cạnh tranh với booking.

---

## 6. Hero & Visual Signatures

### Hero trang chủ

- Bố cục bất đối xứng: text `52%` bên trái, ảnh dọc `48%` bên phải; không đặt chữ đè ảnh.
- Nền Rice Paper, có thể có đường kẻ mảnh ngăn cách hai vùng.
- Eyebrow: `SÀI GÒN · U MINH HẠ · ĐẤT MŨI CÀ MAU`.
- H1: “Xuôi về **miền sông nước**”.
- Signature: một ảnh nhỏ tỉ lệ dọc `1:2.4` chen trực tiếp giữa các từ trong H1 như dấu chấm câu thị giác; ảnh không che chữ và có alt rỗng nếu chỉ trang trí.
- Trên mobile, ảnh inline chuyển xuống dưới H1 thành dải ảnh ngắn; không cố giữ inline.
- Một CTA primary “Đặt tour ngay”; text link “Xem hành trình”.
- Dưới hero là dải thông tin theo đường kẻ mảnh, không phải 3 card nổi: “Khởi hành từ TP.HCM”, “Giữ chỗ tối đa 24 giờ”, “Tư vấn qua điện thoại/Zalo”.
- Không dùng overlay tối trên ảnh, không dùng chữ căn giữa toàn bộ hero, không có “scroll to explore”.

### Signature xuyên suốt

- Đường nét mảnh uốn như kênh rạch dùng làm timeline hoặc divider có chủ đích.
- Ảnh thật của địa danh, không dùng ảnh resort nhiệt đới chung chung.
- Các con số quan trọng (giá, số chỗ, thời lượng) được đặt như thông tin thực dụng, không trang trí.
- Nhịp bất đối xứng giữa ảnh lớn và khối chữ nhỏ; tránh lặp lại cùng một tỉ lệ ở mọi section.

---

## 7. Page Blueprints

### 7.1 Trang chủ `/`

1. Header.
2. Hero bất đối xứng.
3. Promise strip bằng border, không card.
4. Tour nổi bật: một tour chính lớn + hai tour phụ xếp lệch; không dùng 3 card bằng nhau.
5. Hành trình lớn: timeline theo tuyến Sài Gòn → Mỹ Tho → Cần Thơ → Sóc Trăng → Bạc Liêu → U Minh Hạ → Đất Mũi.
6. Điểm đến: collage ảnh bất đối xứng, mỗi ảnh có caption ngắn.
7. Ẩm thực: danh sách editorial 2 cột, ảnh xen kẽ; không dùng grid 3 card.
8. Đánh giá: chỉ hiển thị khi có dữ liệu đã duyệt thật; nếu chưa có thì bỏ section.
9. FAQ ngắn 4 câu.
10. CTA cuối: một dải ảnh lớn tách biệt với khối chữ, CTA “Đặt tour ngay”.
11. Footer.

### 7.2 Danh sách tour `/tour`

- Tiêu đề ngắn + mô tả 1–2 câu.
- Filter dạng hàng ngang trên desktop; drawer hoặc disclosure trên mobile.
- Kết quả dạng 2 cột so le, card ngang/dọc xen kẽ; không grid 3 cột đều.
- Mỗi card có giá từ, thời lượng, ngày gần nhất, số chỗ.
- Empty state khi filter không có kết quả, có nút xóa filter.
- Pagination rõ ràng; không infinite scroll im lặng.

### 7.3 Chi tiết tour `/tour/[slug]`

1. Breadcrumb.
2. Tên tour, thời lượng, tagline, gallery.
3. Cột trái: tổng quan, điểm nhấn, lịch trình từng ngày, bao gồm/không bao gồm, chính sách, chuẩn bị.
4. Cột phải sticky trên desktop: giá, chọn ngày khởi hành, số chỗ, CTA “Đặt giữ chỗ”.
5. Mobile: CTA sticky đáy màn hình, không che footer hoặc nội dung; có safe-area padding.
6. Không hiển thị thanh toán, mã giảm giá hoặc giỏ hàng.

### 7.4 Đặt giữ chỗ `/dat-tour`

Luồng 3 bước, hiển thị stepper nhưng không biến thành dashboard:

1. **Chọn chuyến**: tour, ngày khởi hành, số người lớn/trẻ em/em bé, tóm tắt chỗ.
2. **Thông tin liên hệ**: họ tên, số điện thoại bắt buộc; email, điểm đón, ghi chú tùy chọn; thông tin hành khách tùy chọn.
3. **Xem lại**: thông tin khách, chuyến đi, bảng giá read-only, tổng tiền, chính sách giữ chỗ, nút “Xác nhận giữ chỗ”.

Quy tắc UI:

- Không yêu cầu tạo tài khoản.
- Không hiển thị `clientRequestId`; giá trị này do hệ thống xử lý.
- Chống submit lặp: disable nút khi đang gửi, giữ nguyên dữ liệu nếu lỗi.
- Em bé hiển thị “Miễn phí · vẫn tính chỗ”.
- Tổng tiền chỉ đọc; nếu giá thay đổi, hiển thị thông báo rõ và yêu cầu xem lại, không tự sửa im lặng.
- Thành công: mã đơn, nút sao chép, thời hạn giữ chỗ, hướng dẫn chờ xác nhận qua điện thoại/Zalo, link tra cứu.
- Không dùng chữ “Thanh toán thành công” hoặc biểu tượng thẻ tín dụng.

### 7.5 Tra cứu / hủy đơn `/tra-cuu-don`

- Form gồm **mã đơn và số điện thoại**, cả hai đều bắt buộc.
- Kết quả: tour, ngày khởi hành, người liên hệ, số khách, tổng tiền, trạng thái, hạn giữ chỗ.
- Nút “Hủy đơn” chỉ hiện khi đủ điều kiện; nếu không đủ, giải thích ngắn thay vì ẩn hoàn toàn.
- Hủy đơn mở dialog xác nhận, có lý do tùy chọn và trạng thái đang xử lý.
- Lỗi tra cứu dùng thông báo chung, không tiết lộ mã đơn hoặc số điện thoại có tồn tại hay không.
- Không dùng màu xanh success cho đơn mới nếu chưa được xác nhận.

### 7.6 Trang nội dung

Áp dụng cho `/hanh-trinh`, `/diem-den`, `/am-thuc`, `/kinh-nghiem`, `/lien-he`:

- Giữ nhịp editorial, tối đa `65ch` cho nội dung đọc.
- Ảnh lớn có caption thật, không dùng ảnh trang trí vô nghĩa.
- CTA đặt tour xuất hiện sau nội dung, không chen vào mọi đoạn.
- Bài viết có ngày cập nhật, tác giả/nhà điều hành nếu có dữ liệu thật.
- Trang liên hệ có form ngắn, hotline/Zalo và địa chỉ thật khi được cung cấp.

---

## 8. Responsive & Accessibility

### Breakpoints

- `< 768px`: mobile, một cột.
- `768–1023px`: tablet, 8 cột, giảm kích thước heading.
- `>= 1024px`: desktop, 12 cột.
- `>= 1440px`: giữ max-width, tăng khoảng thở.

### Bắt buộc

- Kiểm tra tại `375px`, `390px`, `768px`, `1024px`, `1440px`.
- Không có horizontal scroll ở bất kỳ màn hình nào.
- Tất cả multi-column collapse thành một cột dưới `768px`.
- Touch target tối thiểu `44 × 44px`.
- Input mobile dùng font tối thiểu `16px` để tránh iOS zoom.
- Heading dùng `clamp()`; body không nhỏ hơn `14px`.
- Ảnh giữ tỉ lệ, dùng `object-fit: cover`, có alt text mô tả đúng địa danh.
- Sticky CTA mobile có padding safe-area, không che nội dung cuối trang.
- Focus ring luôn hiển thị, không phụ thuộc hover.
- Form có label liên kết đúng, error có `aria-live`, dialog trap focus và đóng bằng Escape.
- Tôn trọng `prefers-reduced-motion`.
- Không dùng màu làm tín hiệu duy nhất.

---

## 9. Motion & Interaction

> Stitch tạo màn hình tĩnh. Phần này quy định hành vi cho giai đoạn code.

- Spring mặc định: `stiffness: 100`, `damping: 20`; không dùng linear cho interaction.
- Hover ảnh: scale `1.02` trong `400ms`, chỉ transform.
- Card hover: dịch lên `2px`, border đậm hơn, không glow.
- Button active: dịch xuống `1px` hoặc scale `0.99`.
- Section reveal: opacity + translateY `16px`, stagger `60ms`, không mount toàn bộ cùng lúc.
- Không dùng animation vô hạn gây phân tâm trên hero, giá hoặc CTA.
- Chỉ animate `transform` và `opacity`; không animate `top`, `left`, `width`, `height`.
- Tôn trọng giảm chuyển động: tắt stagger, parallax và shimmer phức tạp.

---

## 10. Content & Business Accuracy

### Giọng điệu

- Cụ thể, bình tĩnh, giàu hình ảnh nhưng không phóng đại.
- Dùng tiếng Việt tự nhiên; không dịch máy, không trộn tiếng Anh không cần thiết.
- Ưu tiên động từ và địa danh thật: “Đi xuồng xuyên rừng tràm”, “Ăn sáng trên sông”, “Chạm mốc tọa độ Đất Mũi”.
- Tránh: “trải nghiệm tuyệt vời”, “thiên đường”, “hành trình đáng nhớ”, “nâng tầm”, “seamless”, “elevate”.

### Dữ liệu mẫu

Khi Stitch cần nội dung, dùng dữ liệu thật từ `prisma/seed.mjs`, không tự bịa:

- `XMSN-4N3D` — Sài Gòn – Cần Thơ – U Minh Hạ – Đất Mũi (4N3Đ), giá từ `4.190.000 ₫`.
- `XMSN-3N2D` — Sài Gòn – Cần Thơ – Đất Mũi (3N2Đ), giá từ `3.190.000 ₫`.
- `XMSN-2N1D` — Trải nghiệm U Minh Hạ (2N1Đ), giá từ `1.890.000 ₫`.
- Điểm đến tiêu biểu: Chợ nổi Cái Răng, Vườn quốc gia U Minh Hạ, Mũi Cà Mau, Nhà công tử Bạc Liêu, Chùa Dơi, Cánh đồng quạt gió Bạc Liêu.
- Không tự tạo review, rating, số lượt khách, giải thưởng hoặc hotline nếu chưa có dữ liệu.

### Nghiệp vụ không được thiết kế sai

- Đây là **đặt giữ chỗ**, không phải mua vé online.
- Người lớn, trẻ em và em bé đều chiếm chỗ; em bé miễn phí.
- Giá và tổng tiền do server tính; UI không cho sửa.
- Đơn `new` giữ chỗ tối đa 24 giờ theo cấu hình; khách chờ xác nhận qua điện thoại/Zalo.
- Khách tự hủy khi còn ít nhất 3 ngày trước khởi hành.
- Tra cứu bắt buộc cả mã đơn và số điện thoại.
- Không hiển thị `lookupToken`, `clientRequestId`, `ipHash`, ID nội bộ hoặc audit log.
- Không đưa UI về trạng thái “đã thanh toán”.

---

## 11. Anti-Patterns (Banned)

- Không emoji trong UI, nội dung, alt text hoặc code.
- Không font `Inter`; không `Times New Roman`, `Georgia`, `Garamond`, `Palatino`.
- Không pure black `#000000`.
- Không accent tím, xanh neon, glow hoặc gradient AI.
- Không glassmorphism, backdrop blur trang trí.
- Không chữ đè ảnh, chồng layer, parallax chữ.
- Không hero căn giữa.
- Không hàng 3 card bằng nhau cho feature hoặc tour.
- Không card cho mọi đoạn nội dung; ưu tiên border, khoảng trắng và nhịp editorial.
- Không pill cho mọi button/badge.
- Không spinner tròn; dùng skeleton.
- Không carousel tự động.
- Không “Scroll to explore”, mũi tên nhún, “Khám phá ngay” lặp lại.
- Không icon minh họa quá nhiều màu hoặc icon mang phong cách sticker.
- Không dùng ảnh resort, biển, cọ dừa không đúng địa danh.
- Không bịa review, số liệu, giải thưởng, khách hàng tiêu biểu.
- Không dùng tên chung “Nguyễn Văn A”, “Công ty ABC” trong nội dung mẫu hiển thị.
- Không dùng `height: 100vh`; dùng `min-height: 100dvh`.
- Không dùng `z-index` tùy tiện; chỉ cho header sticky, overlay, modal.
- Không hiển thị nút thanh toán, ví điện tử hoặc checkout.

---

## 12. Stitch Prompt Starter

Dùng cấu trúc sau cho từng màn hình:

```text
Use DESIGN.md as the single visual source of truth for Xuôi Miền Sông Nước.

Create the [TÊN MÀN HÌNH] at 1440px desktop and 390px mobile.
The audience is Vietnamese travelers booking a Mekong Delta tour from Ho Chi Minh City.
This is a reservation-hold flow, not an online payment flow.

Requirements:
- Vietnamese copy with full diacritics.
- Use the exact colors, Fraunces/Be Vietnam Pro typography, spacing, radii, and components from DESIGN.md.
- Editorial travel atmosphere, asymmetric layout, real destination imagery, restrained motion cues.
- One primary CTA per section; no overlapping text and images.
- Include loading, empty, validation, error, and success states where relevant.
- Keep all prices and totals read-only.
- Lookup requires both order code and phone number.
- Adults, children, and infants all occupy seats; infants are free.
- Do not invent reviews, ratings, phone numbers, or customer counts.
- No payment UI, no checkout, no glassmorphism, no purple gradients, no emojis.

Generate [số màn hình] screens only. Preserve the same design language across all screens.
```

Thứ tự tạo đề xuất:

1. Trang chủ.
2. Chi tiết tour.
3. Đặt giữ chỗ 3 bước + trạng thái thành công.
4. Tra cứu và hủy đơn.
5. Danh sách tour.
6. Các trang nội dung.

Sau khi trang chủ được duyệt, dùng chính trang chủ làm visual reference cho các màn hình tiếp theo. Không tạo lại design system ở mỗi lần generate.

---

## 13. Pre-flight Checklist

- [ ] Đúng một accent thương hiệu, không có màu AI tím/neon.
- [ ] Không có chữ đè ảnh hoặc layer chồng nhau.
- [ ] Không có 3 card bằng nhau.
- [ ] Mobile 375px/390px không tràn ngang.
- [ ] Touch target tối thiểu 44px.
- [ ] Form có label, helper, error và trạng thái disabled.
- [ ] Có loading, empty, error, success.
- [ ] Giá và tổng tiền read-only.
- [ ] Không có UI thanh toán.
- [ ] Tra cứu yêu cầu cả mã đơn và số điện thoại.
- [ ] Em bé được ghi rõ miễn phí nhưng vẫn tính chỗ.
- [ ] Không bịa review, rating, hotline hoặc số liệu.
- [ ] Ảnh đúng địa danh, có alt text.
- [ ] Tiếng Việt có dấu, không lorem ipsum.
- [ ] Font hỗ trợ đầy đủ dấu tiếng Việt.
- [ ] Focus ring hiển thị rõ và có thể dùng bàn phím.
