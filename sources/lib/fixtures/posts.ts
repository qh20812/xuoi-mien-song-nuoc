import type { PostRecord } from "@/lib/contracts/post";

const IMG = {
  uMinh:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Chu%E1%BB%91i_t%E1%BA%A1i_r%E1%BB%ABng_U_Minh_h%E1%BA%A1.jpg/1920px-Chu%E1%BB%91i_t%E1%BA%A1i_r%E1%BB%ABng_U_Minh_h%E1%BA%A1.jpg",
  muiCaMau:
    "https://upload.wikimedia.org/wikipedia/commons/7/7b/Tuongdaimuicamau.jpg",
};

export const posts: PostRecord[] = [
  {
    slug: "mua-nao-di-u-minh-ha-dep-nhat",
    title: "Mùa nào đi U Minh Hạ đẹp nhất?",
    excerpt:
      "Mùa khô cho bạn rừng tràm khô ráo, mùa nước nổi cho bạn kênh đầy cá. Mỗi mùa một kiểu đẹp – chọn theo thứ bạn muốn trải nghiệm.",
    content: `U Minh Hạ có hai mùa rõ rệt, và mỗi mùa cho một trải nghiệm khác hẳn.

**Mùa khô (tháng 12 – tháng 4)** là thời điểm dễ đi nhất. Trời ít mưa, kênh rạch cạn hơn, đường vào rừng thuận tiện. Đây cũng là mùa ong rừng cho mật, nên các homestay thường tổ chức hoạt động gác kèo ong, thử mật. Nếu bạn sợ muỗi và ẩm, đây là lựa chọn tốt hơn.

**Mùa nước nổi (tháng 9 – tháng 11)** biến U Minh Hạ thành một vùng nước mênh mông. Kênh đầy cá, cảnh quan xanh mướt, nhưng một số tuyến xuồng có thể thay đổi lịch trình. Đi mùa này nhớ mang áo mưa và giày chống trượt.

**Mùa mưa (tháng 5 – tháng 8)** ít khách hơn, giá dịch vụ dễ chịu hơn, nhưng mưa rào thường đến buổi chiều. Nếu đi, hãy xếp hoạt động ngoài trời vào buổi sáng.

Một lưu ý thực tế: rừng tràm rất ẩm và nhiều muỗi vào chiều tối. Bất kể mùa nào, kem chống muỗi và quần áo dài tay là thứ không thể thiếu.`,
    category: "kinh-nghiem",
    tags: ["u-minh-ha", "mua-nao", "sinh-thai"],
    topic: "thoi-tiet",
    coverImage: { src: IMG.uMinh, alt: "Vườn chuối trong vùng rừng tràm U Minh Hạ" },
    publishedAt: "2026-09-15T08:00:00Z",
    relatedTourCodes: ["XMSN-4N3D", "XMSN-2N1D"],
  },
  {
    slug: "mang-gi-khi-vao-rung-tram",
    title: "Mang gì khi vào rừng tràm U Minh Hạ?",
    excerpt:
      "Danh sách thực dụng từ người đi thật: chống muỗi, chống nước, chống nắng và một chút pin dự phòng.",
    content: `Rừng tràm không phải nơi để mặc đẹp. Đây là danh sách tối thiểu nên có trong balo.

**Chống muỗi là ưu tiên số 1.** Kem chống muỗi (có DEET hoặc picaridin), quần dài, áo dài tay sáng màu. Rừng tràm ẩm quanh năm, muỗi hoạt động mạnh nhất lúc chiều tối và sáng sớm.

**Chống nước.** Dép quai hậu hoặc giày bám tốt, một bộ quần áo khô để thay, túi chống nước cho điện thoại. Xuồng nhỏ có thể té nước khi qua kênh hẹp.

**Chống nắng.** Mũ rộng vành, áo chống nắng, kính râm. Trên kênh gần như không có bóng râm vào giữa trưa.

**Y tế cơ bản.** Thuốc say sóng (nếu đi cano ra Đất Mũi), thuốc dị ứng, băng cá nhân, men tiêu hoá. Trong rừng không có hiệu thuốc gần.

**Thiết bị.** Pin dự phòng, đèn pin nhỏ, túi rác để mang rác ra ngoài. Sóng điện thoại trong rừng yếu, nên tải trước bản đồ offline.

Cuối cùng: mang theo tiền mặt. Nhiều homestay và quán nhỏ trong vùng không quét thẻ.`,
    category: "kinh-nghiem",
    tags: ["u-minh-ha", "hanh-ly", "an-toan"],
    topic: "hanh-ly",
    coverImage: { src: IMG.uMinh, alt: "Vườn chuối trong vùng rừng tràm U Minh Hạ" },
    publishedAt: "2026-09-28T08:00:00Z",
    relatedTourCodes: ["XMSN-4N3D", "XMSN-2N1D"],
    checklist: [
      "Kem chống muỗi có DEET hoặc picaridin",
      "Quần dài và áo dài tay sáng màu",
      "Dép quai hậu hoặc giày bám tốt",
      "Một bộ quần áo khô và túi chống nước",
      "Mũ rộng vành, áo chống nắng, kính râm",
      "Thuốc say sóng, thuốc dị ứng, băng cá nhân",
      "Pin dự phòng, đèn pin nhỏ, bản đồ offline",
      "Tiền mặt cho homestay và quán nhỏ",
    ],
  },
  {
    slug: "kinh-nghiem-check-in-dat-mui-trong-ngay",
    title: "Kinh nghiệm check-in Đất Mũi trong ngày",
    excerpt:
      "Đi – ăn – chụp ảnh – về trong một ngày: vé 30.000đ, cano 800.000đ/chuyến và khung giờ hoàng hôn đẹp nhất.",
    content: `Đất Mũi nằm ở xã Đất Mũi, cách TP Cà Mau khoảng 100 km. Nếu chỉ có một ngày, bạn vẫn đi được nếu xuất phát sớm.

**Lịch trình gợi ý.** 5:30 rời Cà Mau, 8:00 tới khu du lịch. Tham quan mốc toạ độ quốc gia, cột cờ Hà Nội (cao hơn 41 m), đi bộ hoặc xe điện ra bãi bồi. Ăn trưa hải sản, 14:00 lên đường về, 17:00 có mặt lại TP Cà Mau.

**Chi phí thực tế.** Vé vào cổng 30.000đ/người lớn, 15.000đ/trẻ em 6–12 tuổi, miễn phí dưới 6 tuổi. Xe điện trung chuyển 10.000–15.000đ/lượt. Nếu muốn ra bãi bồi hoặc xuyên rừng đước, thuê cano khoảng 800.000–1.200.000đ/chuyến (6–10 khách) cho tuyến ngắn.

**Chụp ảnh.** Buổi sáng ánh sáng mềm, ít người. Hoàng hôn khoảng 17:30–18:00 rất đẹp nhưng về Cà Mau sẽ muộn – nếu ở lại, nên ngủ một đêm.

**Lưu ý.** Nắng và gió biển mạnh, không có nhiều bóng râm. Mang nước, mũ, kem chống nắng. Cuối tuần đông hơn ngày thường, nên đi sớm để tránh xếp hàng mua vé.`,
    category: "kinh-nghiem",
    tags: ["dat-mui", "ca-mau", "mot-ngay"],
    topic: "dat-mui",
    coverImage: { src: IMG.muiCaMau, alt: "Tượng đài và mốc tọa độ tại Mũi Cà Mau" },
    publishedAt: "2026-10-10T08:00:00Z",
    relatedTourCodes: ["XMSN-4N3D", "XMSN-3N2D"],
  },
];
