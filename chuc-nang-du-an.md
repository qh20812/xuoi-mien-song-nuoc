# Xuôi Miền Sông Nước — Danh Sách Chức Năng Dự Kiến

> Chủ đề: Tour du lịch miền Tây (Sài Gòn – U Minh Hạ – Đất Mũi Cà Mau)
> Mục đích: Quảng bá tour + cho phép **đặt giữ chỗ (không thanh toán online)**
> Trạng thái: File kế hoạch chức năng — chưa chốt code.

## 1. Tổng quan

Website giới thiệu hành trình sông nước miền Tây, tập trung vào 2 điểm nhấn:
- **Rừng U Minh Hạ** (trải nghiệm rừng tràm, xuồng, câu cá, ăn ong rừng)
- **Đất Mũi Cà Mau** (mốc tọa độ quốc gia, cột cờ, rừng đước, hải sản)

Đối tượng: khách lẻ, gia đình, nhóm bạn từ Sài Gòn muốn đi tour trọn gói.

---

## 2. Nhóm A — Quảng bá / Giới thiệu (bắt buộc)

### 2.1. Trang chủ (Home)
- [ ] Hero banner: ảnh sông nước + slogan + 2 nút CTA (Đặt tour ngay / Xem hành trình)
- [ ] Thanh hotline / Zalo nổi bật
- [ ] Điểm nổi bật: vì sao chọn tour này (3-4 USP)
- [ ] Hành trình tóm tắt dạng timeline ngang
- [ ] 3 tour nổi bật + giá
- [ ] Đánh giá khách hàng tóm tắt
- [ ] Gallery ảnh + video ngắn
- [ ] FAQ ngắn + footer liên hệ

### 2.2. Trang Hành trình (Sài Gòn → Đất Mũi)
- [ ] Timeline chi tiết theo chặng:
  - Sài Gòn → Mỹ Tho (chùa Vĩnh Tràng, cù lao Thới Sơn)
  - Mỹ Tho → Cần Thơ (chợ nổi Cái Răng, nhà cổ Bình Thủy)
  - Cần Thơ → Sóc Trăng → Bạc Liêu (chùa Dơi, nhà công tử Bạc Liêu, cánh đồng quạt gió)
  - Bạc Liêu → U Minh Hạ (rừng tràm, xuồng xuyên rừng, ăn ong)
  - U Minh Hạ → Đất Mũi (mốc tọa độ, cột cờ, rừng đước, ngắm hoàng hôn)
- [ ] Mỗi chặng: ảnh, mô tả, món ăn gợi ý, thời gian di chuyển
- [ ] Bản đồ minh họa hành trình (nhúng Google Maps)

### 2.3. Điểm đến nổi bật
- [ ] Chợ nổi Cái Răng
- [ ] Rừng U Minh Hạ
- [ ] Mốc tọa độ Đất Mũi + Cột cờ Hà Nội tại Cà Mau
- [ ] Nhà thờ Tắc Sậy
- [ ] Cánh đồng điện gió Bạc Liêu

### 2.4. Ẩm thực miền Tây
- [ ] Lẩu mắm U Minh, cua Cà Mau, ba khía muối, vọp nướng, bánh xèo, đuông chà là
- [ ] Mỗi món: ảnh + mô tả + quán/tour nào được ăn

### 2.5. Thư viện (Gallery)
- [ ] Lưới ảnh responsive + lightbox xem lớn
- [ ] Video YouTube nhúng (nếu có)

---

## 3. Nhóm B — Tour & Đặt giữ chỗ (trọng tâm)

### 3.1. Danh sách tour
- [ ] Tour 4N3Đ: Sài Gòn – Cần Thơ – U Minh Hạ – Đất Mũi (tour chủ lực)
- [ ] Tour 3N2Đ: Sài Gòn – Cần Thơ – Đất Mũi (gọn)
- [ ] Tour trải nghiệm U Minh Hạ 2N1Đ
- [ ] Mỗi tour: ảnh, thời lượng, giá người lớn/trẻ em, số chỗ còn lại, nút đặt

### 3.2. Chi tiết tour (`/tour/:id`)
- [ ] Lịch trình từng ngày (sáng/chiều/tối)
- [ ] Bảng giá + chính sách (bao gồm / không bao gồm / phụ thu lễ Tết)
- [ ] Chính sách hủy / hoàn
- [ ] Lưu ý mang theo (đi rừng, đi xuồng)
- [ ] Đánh giá riêng của tour đó

### 3.3. Đặt tour giữ chỗ (không thanh toán)
- [ ] Form 3 bước:
  - Bước 1: chọn tour + ngày khởi hành + số lượng (người lớn / trẻ em)
  - Bước 2: nhập thông tin liên hệ (họ tên, SĐT, email, ghi chú, điểm đón)
  - Bước 3: xác nhận + hiện mã đơn (VD: XMSN-2026-XXXX)
- [ ] Validate SĐT Việt Nam, ngày khởi hành phải > hôm nay
- [ ] Lưu đơn vào localStorage (giai đoạn 1), sau nâng lên backend/Google Sheet
- [ ] Trang kết quả: tóm tắt đơn + dặn khách chờ xác nhận qua điện thoại/Zalo

### 3.4. Tra cứu đơn
- [ ] Nhập SĐT hoặc mã đơn để xem trạng thái: Mới / Chờ xác nhận / Đã xác nhận / Đã hủy
- [ ] Cho phép hủy đơn (chuyển trạng thái Hủy)

---

## 4. Nhóm C — Tạo tin tưởng & Tương tác

- [ ] Đánh giá sao (1-5) + bình luận + ảnh thực tế của khách
- [ ] Blog / Kinh nghiệm:
  - Mùa nào đi U Minh Hạ đẹp nhất?
  - Mang gì khi vào rừng tràm?
  - Kinh nghiệm check-in Đất Mũi trong ngày
- [ ] FAQ: đi lại, ăn ở, an toàn trẻ em, say sóng, mưa nắng
- [ ] Liên hệ: form + Zalo/Facebook chat bubble + hotline click-to-call + Google Maps nhúng

---

## 5. Nhóm D — Admin mini (quản lý đơn giữ chỗ)

- [ ] Danh sách đơn: mã đơn, tên, SĐT, tour, ngày đi, số người, trạng thái, ngày tạo
- [ ] Lọc theo tour / ngày / trạng thái + tìm kiếm theo SĐT
- [ ] Xem chi tiết + đổi trạng thái (Xác nhận / Hủy) + ghi chú nội bộ
- [ ] Thống kê nhanh: tổng đơn, đơn mới, tổng khách dự kiến

---

## 6. Nhóm E — Kỹ thuật chung

- [ ] Responsive mobile-first (ưu tiên xem trên điện thoại)
- [ ] SEO cơ bản: title, meta description, Open Graph, sitemap
- [ ] Tốc độ nhanh, ảnh nén, lazy-load
- [ ] Nút gọi nhanh + Zalo nổi trên mobile
- [ ] Hỗ trợ tiếng Việt chuẩn, có thể mở rộng Việt-Anh sau

---

## 7. Đề xuất công nghệ

**Khuyên dùng: Vite + React + Tailwind CSS + React Router**

- Dữ liệu mẫu: file JSON (`tours.json`, `destinations.json`, `posts.json`)
- Lưu đơn giai đoạn đầu: `localStorage`
- Deploy free: Vercel / Netlify
- Nâng cấp sau: Google Sheet / Supabase / Node.js làm backend thật

**Cấu trúc trang dự kiến:**

```text
/                   → Trang chủ
/hanh-trinh         → Sài Gòn → U Minh Hạ → Đất Mũi
/tour               → Danh sách tour
/tour/:id           → Chi tiết tour
/dat-tour           → Form đặt giữ chỗ
/tra-cuu-don        → Tra cứu / hủy đơn
/am-thuc            → Ẩm thực miền Tây
/kinh-nghiem        → Blog kinh nghiệm
/lien-he            → Liên hệ
/admin/don-dat      → Quản lý đơn (admin mini)
```

## 8. Lộ trình làm (MVP)

**Giai đoạn 1 (làm trước):**
1. Trang chủ + Hành trình + 3 tour mẫu
2. Form đặt giữ chỗ + trang tra cứu
3. Admin mini quản lý đơn

**Giai đoạn 2 (làm sau):**
4. Blog, đánh giá, FAQ
5. Kết nối backend thật
6. Bản tiếng Anh + tối ưu SEO
