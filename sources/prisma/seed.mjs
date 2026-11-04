/**
 * Seed dữ liệu THẬT cho Xuôi Miền Sông Nước.
 *
 * Nguồn dữ liệu (truy cập 21/10/2026):
 * - Toạ độ điểm đến: Wikidata / OpenStreetMap (Nominatim)
 * - Khoảng cách & thời gian di chuyển: OSRM (router.project-osrm.org), đường bộ thực tế
 * - Giá vé Mũi Cà Mau: camautourism.vn + muicamau.camau.gov.vn (30.000đ NL / 15.000đ TE 6–12 tuổi)
 * - Giá vé U Minh Hạ: bangoaihomestay.vn (10.000đ NL / 5.000đ TE; xuồng 150.000đ/khách)
 * - Nhà công tử Bạc Liêu: congtubaclieu.com.vn + các nguồn du lịch (30.000đ NL / 20.000đ TE)
 * - Nhà cổ Bình Thủy: canthotourism.vn (144 Bùi Hữu Nghĩa; vé 15.000–20.000đ)
 * - Chợ nổi Cái Răng: họp 4h–8h sáng
 * - Nhà thờ Tắc Sậy: ấp 2, QL1A, xã Phong Thạnh, Cà Mau; mở 4h–21h
 * - Giá tour 4N3Đ Sài Gòn – Cà Mau: tham khảo Viet Fun Travel (từ 4.190.000đ/khách)
 * - Ảnh: Wikimedia Commons (giấy phép tự do), URL gốc của từng file
 *
 * Chạy: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

process.loadEnvFile(".env");

const prisma = new PrismaClient({ log: ["warn", "error"] });

// ---------------------------------------------------------------------------
// Ảnh thật từ Wikimedia Commons
// ---------------------------------------------------------------------------
const IMG = {
  vinhTrang:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Ch%C3%B9a_V%C4%A9nh_Tr%C3%A0ng_%E1%BB%9F_M%E1%BB%B9_Tho.jpg/1920px-Ch%C3%B9a_V%C4%A9nh_Tr%C3%A0ng_%E1%BB%9F_M%E1%BB%B9_Tho.jpg",
  thoiSon:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/T%C3%A0u_du_l%E1%BB%8Bch_gh%C3%A9_c%E1%BB%93n_L%C3%A2n.jpg/1920px-T%C3%A0u_du_l%E1%BB%8Bch_gh%C3%A9_c%E1%BB%93n_L%C3%A2n.jpg",
  caiRang:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/M%E1%BB%99t_c%E1%BA%A3nh_%E1%BB%9F_ch%E1%BB%A3_n%E1%BB%95i_C%C3%A1i_R%C4%83ng.jpg/1920px-M%E1%BB%99t_c%E1%BA%A3nh_%E1%BB%9F_ch%E1%BB%A3_n%E1%BB%95i_C%C3%A1i_R%C4%83ng.jpg",
  binhThuy:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/Nh%C3%A0_c%E1%BB%95_B%C3%ACnh_Th%E1%BB%A7y_1.jpg/1920px-Nh%C3%A0_c%E1%BB%95_B%C3%ACnh_Th%E1%BB%A7y_1.jpg",
  chuaDoi:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/Ch%C3%B9a_D%C6%A1i_%2845715215502%29.jpg/1920px-Ch%C3%B9a_D%C6%A1i_%2845715215502%29.jpg",
  congTu:
    "https://upload.wikimedia.org/wikipedia/commons/0/02/Nh%C3%A0_C%C3%B4ng_t%E1%BB%AD_B%E1%BA%A1c_Li%C3%AAu.jpg",
  dienGio:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/B%E1%BA%A1c_Li%C3%AAu_windpower_farm.jpg/1920px-B%E1%BA%A1c_Li%C3%AAu_windpower_farm.jpg",
  uMinh:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Chu%E1%BB%91i_t%E1%BA%A1i_r%E1%BB%ABng_U_Minh_h%E1%BA%A1.jpg/1920px-Chu%E1%BB%91i_t%E1%BA%A1i_r%E1%BB%ABng_U_Minh_h%E1%BA%A1.jpg",
  muiCaMau:
    "https://upload.wikimedia.org/wikipedia/commons/7/7b/Tuongdaimuicamau.jpg",
};

const gallery = (items) => items.map(([url, alt]) => ({ url, alt }));

// ---------------------------------------------------------------------------
// Helpers ngày tháng
// ---------------------------------------------------------------------------
const utcDate = (d) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

/** Ngày (UTC) của thứ `weekday` (0=CN … 6=T7) sắp tới, tính từ hôm nay. */
function nextWeekday(weekday, from = new Date()) {
  const d = utcDate(new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())));
  const diff = (weekday - d.getUTCDay() + 7) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/** Chuỗi ngày khởi hành cách nhau `stepWeeks` tuần. */
function weeklyDates(weekday, weeks, stepWeeks = 1) {
  const first = nextWeekday(weekday);
  return Array.from({ length: weeks }, (_, i) => {
    const d = new Date(first);
    d.setUTCDate(d.getUTCDate() + i * 7 * stepWeeks);
    return d;
  });
}

// ---------------------------------------------------------------------------
// ĐIỂM ĐẾN (toạ độ thật)
// ---------------------------------------------------------------------------
const DESTINATIONS = [
  {
    slug: "chua-vinh-trang",
    name: "Chùa Vĩnh Tràng",
    province: "Đồng Tháp",
    category: "kien-truc",
    shortDesc:
      "Ngôi chùa cổ nổi tiếng của Mỹ Tho, kiến trúc pha trộn Á – Âu, điểm dừng đầu tiên trên hành trình xuôi về miền Tây.",
    description:
      "Chùa Vĩnh Tràng toạ lạc trên đường Nguyễn Trung Trực, TP Mỹ Tho (nay thuộc tỉnh Đồng Tháp sau sáp nhập 2025). Chùa được xây dựng từ thế kỷ 19, nổi bật với sự kết hợp kiến trúc Việt – Hoa – Khmer và các chi tiết trang trí kiểu Pháp: cổng tam quan, sân chùa rợp bóng cây, chánh điện có hệ cột gỗ và tượng Phật lớn. Đây là điểm dừng chân quen thuộc của các tour Sài Gòn – miền Tây.",
    bestSeason: "Cả năm; đẹp nhất vào mùa khô (tháng 12 – tháng 4)",
    lat: 10.362809,
    lng: 106.373749,
    travelNote: "Cách trung tâm Sài Gòn khoảng 72 km, đi cao tốc Trung Lương mất khoảng 1 giờ 30 phút.",
    coverImageUrl: IMG.vinhTrang,
    sortOrder: 1,
  },
  {
    slug: "cu-lao-thoi-son",
    name: "Cù lao Thới Sơn (cồn Lân)",
    province: "Đồng Tháp",
    category: "song-nuoc",
    shortDesc:
      "Cồn nổi giữa sông Tiền, nơi du khách đi xuồng, nghe đờn ca tài tử và thưởng thức trái cây miệt vườn.",
    description:
      "Cù lao Thới Sơn (cồn Lân) thuộc phường Thới Sơn, TP Mỹ Tho, cách trung tâm thành phố khoảng 3 km. Du khách qua cồn bằng thuyền/xuồng, tham quan vườn trái cây, thử mật ong, nghe đờn ca tài tử – loại hình nghệ thuật được UNESCO công nhận là di sản văn hoá phi vật thể đại diện của nhân loại.",
    bestSeason: "Mùa trái cây tháng 5 – tháng 8",
    lat: 10.332361,
    lng: 106.330139,
    travelNote: "Từ chùa Vĩnh Tràng ra bến thuyền khoảng 10 phút; thời gian tham quan cồn khoảng 2 giờ.",
    coverImageUrl: IMG.thoiSon,
    sortOrder: 2,
  },
  {
    slug: "cho-noi-cai-rang",
    name: "Chợ nổi Cái Răng",
    province: "Cần Thơ",
    category: "cho-noi",
    shortDesc:
      "Chợ nổi lớn nhất miền Tây, họp từ 4–5 giờ sáng trên sông Cần Thơ, chuyên trái cây và rau củ.",
    description:
      "Chợ nổi Cái Răng nằm trên sông Cần Thơ, thuộc phường Cái Răng, TP Cần Thơ. Chợ họp từ khoảng 4–5 giờ sáng và đông nhất từ 5–8 giờ; ghe thuyền bán trái cây, rau củ và đồ ăn sáng. Du khách thường thuê tàu nhỏ từ bến Ninh Kiều hoặc bến Cái Răng để len giữa các ghe hàng, ăn hủ tiếu/bún riêu ngay trên sông.",
    bestSeason: "Cả năm; mùa trái cây (tháng 5 – tháng 8) nhộn nhịp nhất",
    lat: 10.005,
    lng: 105.746,
    travelNote: "Cách trung tâm Cần Thơ khoảng 6 km; nên khởi hành từ 5 giờ sáng để kịp chợ đông.",
    coverImageUrl: IMG.caiRang,
    sortOrder: 3,
  },
  {
    slug: "nha-co-binh-thuy",
    name: "Nhà cổ Bình Thủy",
    province: "Cần Thơ",
    category: "kien-truc",
    shortDesc:
      "Dinh thự họ Dương xây cuối thế kỷ 19, kiến trúc Đông Dương, điểm tham quan đẹp nhất nhì Cần Thơ.",
    description:
      "Nhà cổ Bình Thủy (Phủ thờ họ Dương) tại số 144 đường Bùi Hữu Nghĩa, phường Bình Thủy, TP Cần Thơ. Ngôi nhà được xây dựng từ cuối thế kỷ 19, là công trình tiêu biểu cho phong cách kiến trúc Đông Dương ở Nam Kỳ: mặt tiền cổ điển Pháp, nội thất gỗ truyền thống Việt – Hoa. Vé tham quan khoảng 15.000–20.000đ/người; mở cửa 8:00–12:00 và 14:00–18:00.",
    bestSeason: "Cả năm",
    lat: 10.066996,
    lng: 105.749631,
    travelNote: "Từ chợ nổi Cái Răng khoảng 30 phút xe; tham quan khoảng 45–60 phút.",
    coverImageUrl: IMG.binhThuy,
    sortOrder: 4,
  },
  {
    slug: "chua-doi",
    name: "Chùa Dơi (Mahatup)",
    province: "Cần Thơ",
    category: "kien-truc",
    shortDesc:
      "Ngôi chùa Khmer cổ ở Sóc Trăng với hàng vạn con dơi quạ trú ngụ, kiến trúc Việt – Khmer độc đáo.",
    description:
      "Chùa Dơi (tên Khmer: Mahatup, người Kinh đọc thành Mã Tộc) nằm trên đường Văn Ngọc Chính, phường Phú Lợi, TP Sóc Trăng (nay thuộc TP Cần Thơ). Chùa có kiến trúc hoà trộn Việt – Khmer, xung quanh là rừng sao, dầu – nơi trú ngụ của hàng vạn con dơi quạ nặng 1–1,5 kg, sải cánh rộng. Chiều đến, dơi bay kín sân chùa, là điểm tham quan miễn phí nổi tiếng của Sóc Trăng.",
    bestSeason: "Cả năm; buổi chiều dơi về nhiều nhất",
    lat: 9.582919,
    lng: 105.976713,
    travelNote: "Cách Cần Thơ khoảng 64 km (1 giờ 15 phút) theo QL1A.",
    coverImageUrl: IMG.chuaDoi,
    sortOrder: 5,
  },
  {
    slug: "nha-cong-tu-bac-lieu",
    name: "Nhà công tử Bạc Liêu",
    province: "Cà Mau",
    category: "kien-truc",
    shortDesc:
      "Dinh thự của công tử Trần Trinh Huy, xây 1917–1919, biểu tượng giàu có của đất Bạc Liêu.",
    description:
      "Nhà công tử Bạc Liêu tại số 13 đường Điện Biên Phủ, phường Bạc Liêu, tỉnh Cà Mau (sau sáp nhập 2025). Ngôi nhà được xây dựng từ năm 1917 đến 1919, kiến trúc Pháp cổ, gắn với giai thoại về công tử Trần Trinh Huy. Vé tham quan khoảng 30.000đ/người lớn và 20.000đ/trẻ em; mở cửa khoảng 7:00–18:00 hằng ngày.",
    bestSeason: "Cả năm",
    lat: 9.284123,
    lng: 105.723353,
    travelNote: "Từ Sóc Trăng khoảng 50 km (1 giờ); từ đây ra cánh đồng điện gió khoảng 15 phút.",
    coverImageUrl: IMG.congTu,
    sortOrder: 6,
  },
  {
    slug: "canh-dong-dien-gio-bac-lieu",
    name: "Cánh đồng quạt gió Bạc Liêu",
    province: "Cà Mau",
    category: "bien",
    shortDesc:
      "Nhà máy điện gió ven biển đầu tiên của Việt Nam (2010), hàng chục trụ tuabin giữa đồng bãi bồi.",
    description:
      "Nhà máy điện gió Bạc Liêu toạ lạc tại khóm Biển Đông A, phường Hiệp Thành, tỉnh Cà Mau. Đây là nhà máy điện gió ven biển đầu tiên của Việt Nam, khởi công từ năm 2010; những trụ tuabin cao hàng chục mét giữa bãi bồi tạo nên khung cảnh check-in nổi tiếng, đặc biệt lúc hoàng hôn.",
    bestSeason: "Tháng 12 – tháng 4 (trời khô, nắng đẹp)",
    lat: 9.2212,
    lng: 105.8009,
    travelNote: "Cách trung tâm Bạc Liêu khoảng 15–20 phút xe; nên đi cuối chiều để ngắm hoàng hôn.",
    coverImageUrl: IMG.dienGio,
    sortOrder: 7,
  },
  {
    slug: "vuon-quoc-gia-u-minh-ha",
    name: "Vườn quốc gia U Minh Hạ",
    province: "Cà Mau",
    category: "rung",
    shortDesc:
      "Rừng tràm trên đất than bùn hơn 8.000 ha, nơi đi xuồng xuyên kênh, câu cá và ăn ong rừng.",
    description:
      "Vườn quốc gia U Minh Hạ thuộc các xã Khánh Lâm, Khánh An và Đá Bạc, tỉnh Cà Mau; thành lập năm 2006 trên cơ sở nâng cấp khu bảo tồn thiên nhiên Vồ Dơi, diện tích hơn 8.000 ha. Đây là hệ sinh thái đất ngập nước trên lớp than bùn đặc trưng với rừng tràm, chim nước, cá đồng và nghề gác kèo ong lâu đời. Vé vào cổng khoảng 10.000đ/người lớn, 5.000đ/trẻ em; thuê xuồng máy khoảng 150.000đ/khách (đoàn từ 3 khách).",
    bestSeason: "Mùa khô tháng 12 – tháng 4; mùa nước nổi tháng 9 – tháng 11",
    lat: 9.251389,
    lng: 104.945278,
    travelNote: "Cách TP Cà Mau khoảng 35 km; từ Bạc Liêu khoảng 95 km (1 giờ 45 phút).",
    coverImageUrl: IMG.uMinh,
    sortOrder: 8,
  },
  {
    slug: "mui-ca-mau",
    name: "Mũi Cà Mau – Mốc toạ độ quốc gia",
    province: "Cà Mau",
    category: "bien",
    shortDesc:
      "Cực Nam trên đất liền Việt Nam: mốc toạ độ quốc gia, cột cờ Hà Nội và rừng đước Năm Căn.",
    description:
      "Mũi Cà Mau thuộc xã Đất Mũi, tỉnh Cà Mau – cực Nam trên đất liền của Việt Nam. Khu du lịch Mũi Cà Mau có mốc toạ độ quốc gia, Cột cờ Hà Nội (khánh thành 10/12/2019, cao hơn 41 m, mô phỏng Cột cờ Hà Nội cổ), đường xuyên rừng đước và bãi bồi. Vé vào cổng 30.000đ/người lớn, 15.000đ/trẻ em 6–12 tuổi, miễn phí dưới 6 tuổi; xe điện trung chuyển 10.000–15.000đ/lượt. Có thể thuê cano/xuồng tham quan rừng ngập mặn.",
    bestSeason: "Tháng 12 – tháng 4; hoàng hôn đẹp nhất khoảng 17:30–18:00",
    lat: 8.60723,
    lng: 104.720412,
    travelNote: "Cách TP Cà Mau khoảng 100 km (2 giờ 30 phút); từ U Minh Hạ khoảng 136 km.",
    coverImageUrl: IMG.muiCaMau,
    sortOrder: 9,
  },
  {
    slug: "cot-co-ha-noi-mui-ca-mau",
    name: "Cột cờ Hà Nội tại Mũi Cà Mau",
    province: "Cà Mau",
    category: "kien-truc",
    shortDesc:
      "Công trình mô phỏng Cột cờ Hà Nội, cao hơn 41 m, khánh thành 10/12/2019 trong khu du lịch Mũi Cà Mau.",
    description:
      "Cột cờ Hà Nội tại Mũi Cà Mau nằm trong Khu du lịch quốc gia Mũi Cà Mau, ấp Mũi, xã Đất Mũi, tỉnh Cà Mau. Công trình khởi công năm 2016, khánh thành ngày 10/12/2019, mô phỏng kiến trúc Cột cờ Hà Nội cổ, tổng chiều cao hơn 41 m tính cả cán cờ. Lễ chào cờ và thượng cờ được tổ chức định kỳ 7:30 sáng thứ Hai hằng tuần.",
    bestSeason: "Cả năm",
    lat: 8.6075,
    lng: 104.7208,
    travelNote: "Nằm trong cùng khuôn viên với mốc toạ độ Đất Mũi, đi bộ hoặc xe điện từ cổng.",
    coverImageUrl: IMG.muiCaMau,
    sortOrder: 10,
  },
  {
    slug: "nha-tho-tac-say",
    name: "Nhà thờ Tắc Sậy",
    province: "Cà Mau",
    category: "kien-truc",
    shortDesc:
      "Trung tâm hành hương lớn nhất miền Tây, gắn với Cha Phanxicô Xaviê Trương Bửu Diệp.",
    description:
      "Nhà thờ Tắc Sậy (Trung tâm Hành hương Tắc Sậy) tại ấp 2, QL1A, xã Phong Thạnh, tỉnh Cà Mau (trước thuộc huyện Giá Rai, Bạc Liêu). Đây là nơi an nghỉ của Cha Phanxicô Xaviê Trương Bửu Diệp, thu hút hàng triệu lượt khách hành hương mỗi năm. Khuôn viên mở cửa khoảng 4:00–21:00 hằng ngày; thánh lễ thường vào 5:00, 9:00 và 17:00.",
    bestSeason: "Cả năm; đông nhất vào tháng 12 và dịp lễ Cha Diệp (tháng 3 âm lịch)",
    lat: null,
    lng: null,
    travelNote: "Nằm trên QL1A, cách TP Bạc Liêu khoảng 40 km; thuận tiện dừng trên đường Sóc Trăng – Cà Mau.",
    coverImageUrl: null,
    sortOrder: 11,
  },
];

// ---------------------------------------------------------------------------
// HÀNH TRÌNH LỚN (khoảng cách thật từ OSRM)
// ---------------------------------------------------------------------------
const JOURNEY_LEGS = [
  {
    sortOrder: 1,
    fromPlace: "Sài Gòn",
    toPlace: "Mỹ Tho",
    title: "Rời phố thị, chạm sông Tiền",
    description:
      "Khởi hành từ trung tâm TP.HCM, theo cao tốc Trung Lương về Mỹ Tho. Ghé chùa Vĩnh Tràng và cù lao Thới Sơn trước khi tiếp tục xuôi về Cần Thơ.",
    durationText: "khoảng 1 giờ 30 phút",
    distanceKm: 72,
    foodNote: "Hủ tiếu Mỹ Tho, bánh mì kẹp thịt, trái cây miệt vườn ở cồn Lân",
    imageUrl: IMG.vinhTrang,
  },
  {
    sortOrder: 2,
    fromPlace: "Mỹ Tho",
    toPlace: "Cần Thơ",
    title: "Qua những vườn dừa, về Tây Đô",
    description:
      "Tiếp tục theo QL1A, băng qua địa phận Vĩnh Long và Vĩnh Long – Cần Thơ. Chiều đến nhận phòng, dạo bến Ninh Kiều và chợ đêm Cần Thơ.",
    durationText: "khoảng 2 giờ",
    distanceKm: 109,
    foodNote: "Lẩu mắm, bánh xèo, nem nướng Cần Thơ",
    imageUrl: IMG.caiRang,
  },
  {
    sortOrder: 3,
    fromPlace: "Cần Thơ",
    toPlace: "Sóc Trăng",
    title: "Sang miền đất chùa Khmer",
    description:
      "Sáng sớm đi chợ nổi Cái Răng, sau đó theo QL1A về Sóc Trăng. Tham quan chùa Dơi (Mahatup) và tìm hiểu văn hoá Khmer Nam Bộ.",
    durationText: "khoảng 1 giờ 15 phút",
    distanceKm: 64,
    foodNote: "Bún nước lèo, bánh pía, bánh cống Sóc Trăng",
    imageUrl: IMG.chuaDoi,
  },
  {
    sortOrder: 4,
    fromPlace: "Sóc Trăng",
    toPlace: "Bạc Liêu",
    title: "Đất của công tử và điện gió",
    description:
      "Đi thêm 50 km là tới Bạc Liêu. Ghé nhà công tử Bạc Liêu, sau đó ra cánh đồng quạt gió ngắm hoàng hôn trên bãi bồi.",
    durationText: "khoảng 1 giờ",
    distanceKm: 50,
    foodNote: "Ba khía, bánh xèo, nem nướng Bạc Liêu",
    imageUrl: IMG.congTu,
  },
  {
    sortOrder: 5,
    fromPlace: "Bạc Liêu",
    toPlace: "U Minh Hạ",
    title: "Vào rừng tràm",
    description:
      "Rẽ khỏi QL1A về hướng U Minh Hạ. Đổi xe lớn lấy xuồng máy, len qua những kênh tràm thẳng tắp, thử câu cá và ăn ong rừng.",
    durationText: "khoảng 1 giờ 45 phút",
    distanceKm: 95,
    foodNote: "Lẩu mắm U Minh, ong rừng, cá đồng nướng",
    imageUrl: IMG.uMinh,
  },
  {
    sortOrder: 6,
    fromPlace: "U Minh Hạ",
    toPlace: "Đất Mũi",
    title: "Tới cực Nam Tổ quốc",
    description:
      "Chặng dài nhất: về TP Cà Mau rồi theo đường Năm Căn ra Đất Mũi. Kết thúc bằng mốc toạ độ quốc gia, cột cờ Hà Nội và rừng đước.",
    durationText: "khoảng 2 giờ 30 phút",
    distanceKm: 136,
    foodNote: "Cua Cà Mau, vọp nướng, ba khía muối",
    imageUrl: IMG.muiCaMau,
  },
];

// ---------------------------------------------------------------------------
// ẨM THỰC
// ---------------------------------------------------------------------------
const CUISINES = [
  {
    slug: "lau-mam-u-minh",
    name: "Lẩu mắm U Minh",
    description:
      "Món lẩu đặc trưng của vùng U Minh với mắm cá linh, cá sặc rằn nấu cùng nước dừa, ăn kèm cá đồng, tôm, rau đồng và bún. Vị mặn ngọt đậm đà, thường dùng trong bữa tối ở homestay trong rừng tràm.",
    whereToEat: "Các homestay và quán ăn trong Vườn quốc gia U Minh Hạ, TP Cà Mau",
    province: "Cà Mau",
    imageUrl: null, // chờ ảnh món thật
  },
  {
    slug: "cua-ca-mau",
    name: "Cua Cà Mau",
    description:
      "Cua biển Năm Căn nổi tiếng chắc thịt, ngọt tự nhiên, thường hấp bia hoặc nấu lẩu. Mùa cua ngon nhất vào khoảng tháng 10 âm lịch đến tháng 3 âm lịch.",
    whereToEat: "Năm Căn, Đất Mũi, chợ cua Cà Mau",
    province: "Cà Mau",
    imageUrl: null, // chờ ảnh món thật
  },
  {
    slug: "ba-khia-muoi",
    name: "Ba khía muối",
    description:
      "Ba khía (một loại còng biển) muối mặn, trộn với tỏi, ớt, chanh, đường và rau thơm. Món nhậu dân dã nổi tiếng của vùng Rạch Gốc – Ngọc Hiển.",
    whereToEat: "Rạch Gốc, Ngọc Hiển, chợ đêm Cà Mau",
    province: "Cà Mau",
    imageUrl: null, // chờ ảnh món thật
  },
  {
    slug: "vop-nuong",
    name: "Vọp nướng",
    description:
      "Vọp (một loại sò nước lợ) nướng trên than hồng, chấm muối tiêu chanh. Món ăn vặt phổ biến ở vùng biển Đất Mũi và Bạc Liêu.",
    whereToEat: "Đất Mũi, bãi biển Bạc Liêu",
    province: "Cà Mau",
    imageUrl: null, // chờ ảnh món thật
  },
  {
    slug: "banh-xeo-mien-tay",
    name: "Bánh xèo miền Tây",
    description:
      "Bánh xèo cỡ lớn, vỏ giòn rụm từ bột gạo nghệ, nhân tôm, thịt, giá đỗ, ăn cuốn với rau rừng và nước mắm chua ngọt. Mỗi địa phương có cách pha bột và nhân khác nhau.",
    whereToEat: "Cần Thơ, Bạc Liêu, Cà Mau",
    province: "Cần Thơ",
    imageUrl: null, // chờ ảnh món thật
  },
  {
    slug: "bun-nuoc-leo-soc-trang",
    name: "Bún nước lèo Sóc Trăng",
    description:
      "Bún nước lèo của người Khmer với nước dùng nấu từ mắm bò hóc, cá lóc, tôm khô, ăn kèm bún, rau sống, bắp chuối và chả cá. Hương vị đậm đà, khác hẳn bún nước lèo Trà Vinh.",
    whereToEat: "TP Sóc Trăng (nay thuộc Cần Thơ)",
    province: "Cần Thơ",
    imageUrl: null, // chờ ảnh món thật
  },
  {
    slug: "banh-pia-soc-trang",
    name: "Bánh pía Sóc Trăng",
    description:
      "Bánh nướng có vỏ nhiều lớp, nhân đậu xanh, mỡ, trứng muối và sầu riêng – đặc sản của người Hoa ở Sóc Trăng, thường mua làm quà.",
    whereToEat: "Các lò bánh pía ở TP Sóc Trăng",
    province: "Cần Thơ",
    imageUrl: null, // chờ ảnh món thật
  },
  {
    slug: "duong-cha-la",
    name: "Đuông chà là",
    description:
      "Ấu trùng của bọ cánh cứng sống trong ngọn chà là, thường chiên bơ hoặc nướng. Là đặc sản hiếm và đắt của miền Tây, mùa chà là ra hoa mới có.",
    whereToEat: "Một số quán đặc sản miền Tây (Bến Tre, Trà Vinh, Cà Mau)",
    province: "Miền Tây",
    imageUrl: null, // chờ ảnh món thật
  },
];

// ---------------------------------------------------------------------------
// TOUR + LỊCH TRÌNH
// ---------------------------------------------------------------------------
const TOURS = [
  {
    code: "XMSN-4N3D",
    slug: "sai-gon-can-tho-u-minh-ha-dat-mui-4n3d",
    name: "Sài Gòn – Cần Thơ – U Minh Hạ – Đất Mũi (4N3Đ)",
    tagline: "Trọn vẹn miền Tây: chợ nổi, rừng tràm, cực Nam Tổ quốc",
    summary:
      "Tour chủ lực 4 ngày 3 đêm đi qua 5 tỉnh/thành: Sài Gòn – Mỹ Tho – Cần Thơ – Sóc Trăng – Bạc Liêu – U Minh Hạ – Đất Mũi. Đi xuồng xuyên rừng tràm, ăn ong rừng, ngắm hoàng hôn ở mũi Cà Mau.",
    description:
      "Hành trình dành cho khách muốn đi một lần trọn miền Tây Nam Bộ. Ngày 1 rời Sài Gòn về Mỹ Tho – Cần Thơ; ngày 2 đi chợ nổi Cái Răng, nhà cổ Bình Thủy, chùa Dơi Sóc Trăng và nhà công tử Bạc Liêu; ngày 3 vào rừng tràm U Minh Hạ bằng xuồng máy; ngày 4 ra Đất Mũi chạm mốc toạ độ quốc gia và cột cờ Hà Nội trước khi về lại Sài Gòn. Xe du lịch đời mới, hướng dẫn viên tiếng Việt, lưu trú khách sạn 3 sao tại Cần Thơ – Bạc Liêu – Cà Mau.",
    durationDays: 4,
    durationNights: 3,
    basePriceAdult: 4190000,
    basePriceChild: 2930000,
    childAgeNote: "Trẻ em 5–10 tuổi: 70% giá người lớn; dưới 5 tuổi miễn phí nhưng vẫn tính 1 chỗ ngồi.",
    highlights: [
      "Chợ nổi Cái Răng lúc 5–7 giờ sáng",
      "Xuồng máy xuyên rừng tràm U Minh Hạ, câu cá, ăn ong rừng",
      "Mốc toạ độ quốc gia và cột cờ Hà Nội tại Mũi Cà Mau",
      "Nhà công tử Bạc Liêu và cánh đồng quạt gió",
    ],
    includes: [
      "Xe du lịch đời mới có máy lạnh suốt tuyến",
      "3 đêm khách sạn 3 sao (2 khách/phòng)",
      "Các bữa ăn theo chương trình (3 sáng, 4 trưa, 3 tối)",
      "Vé tham quan, xuồng máy U Minh Hạ, cano/xe điện Đất Mũi",
      "Hướng dẫn viên tiếng Việt, bảo hiểm du lịch",
      "Nước uống, khăn lạnh hằng ngày",
    ],
    excludes: [
      "Chi phí cá nhân, đồ uống ngoài chương trình",
      "Phụ thu phòng đơn (nếu ở 1 mình)",
      "Phụ thu lễ, Tết theo bảng giá của đơn vị lưu trú",
      "VAT (nếu khách cần hoá đơn)",
    ],
    cancellationPolicy:
      "Huỷ miễn phí trước 3 ngày khởi hành. Sát ngày hơn, vui lòng liên hệ hotline để được hỗ trợ. Trường hợp bất khả kháng (thiên tai, dịch bệnh, lệnh cấm đi lại) được bảo lưu hoặc hoàn theo thoả thuận.",
    packingNotes:
      "Giày bám tốt hoặc dép quai hậu, áo chống nắng, mũ rộng vành, kem chống muỗi, thuốc say sóng, pin dự phòng. Nên mang áo mưa mỏng vì miền Tây mưa rào bất chợt.",
    coverImageUrl: IMG.uMinh,
    gallery: gallery([
      [IMG.caiRang, "Chợ nổi Cái Răng"],
      [IMG.uMinh, "Rừng tràm U Minh Hạ"],
      [IMG.muiCaMau, "Mũi Cà Mau"],
      [IMG.congTu, "Nhà công tử Bạc Liêu"],
    ]),
    seoTitle: "Tour Sài Gòn – Cần Thơ – U Minh Hạ – Đất Mũi 4N3Đ",
    seoDescription:
      "Tour 4 ngày 3 đêm Sài Gòn – Cần Thơ – U Minh Hạ – Đất Mũi: chợ nổi Cái Răng, rừng tràm, mốc toạ độ quốc gia. Giá từ 4.190.000đ/khách.",
    isFeatured: true,
    sortOrder: 1,
    itinerary: [
      {
        dayNumber: 1,
        title: "Sài Gòn – Mỹ Tho – Cần Thơ",
        meals: { breakfast: "Tự túc", lunch: "Hủ tiếu Mỹ Tho", dinner: "Lẩu mắm Cần Thơ" },
        hotel: "Khách sạn 3 sao tại Cần Thơ",
        items: [
          {
            slot: "morning",
            title: "Đón khách và khởi hành",
            content:
              "Xe và hướng dẫn viên đón khách tại trung tâm TP.HCM từ 6:00, theo cao tốc Trung Lương về Mỹ Tho (72 km, khoảng 1 giờ 30 phút).",
          },
          {
            slot: "afternoon",
            title: "Chùa Vĩnh Tràng – cù lao Thới Sơn",
            content:
              "Tham quan chùa Vĩnh Tràng, sau đó ra bến thuyền qua cồn Lân. Đi xuồng nhỏ trong mương vườn, nghe đờn ca tài tử, thưởng thức trái cây và mật ong.",
          },
          {
            slot: "evening",
            title: "Về Cần Thơ, dạo bến Ninh Kiều",
            content:
              "Tiếp tục 109 km về Cần Thơ (khoảng 2 giờ). Nhận phòng, ăn tối đặc sản và tự do dạo bến Ninh Kiều, chợ đêm.",
          },
        ],
      },
      {
        dayNumber: 2,
        title: "Cần Thơ – Sóc Trăng – Bạc Liêu",
        meals: { breakfast: "Hủ tiếu trên sông", lunch: "Bún nước lèo Sóc Trăng", dinner: "Hải sản Bạc Liêu" },
        hotel: "Khách sạn 3 sao tại Bạc Liêu",
        items: [
          {
            slot: "morning",
            title: "Chợ nổi Cái Răng lúc bình minh",
            content:
              "Khởi hành 5:15, lên tàu nhỏ len giữa các ghe trái cây, rau củ. Ăn sáng hủ tiếu/bún riêu ngay trên sông rồi ghé nhà cổ Bình Thủy (vé 15.000–20.000đ).",
          },
          {
            slot: "afternoon",
            title: "Chùa Dơi Sóc Trăng",
            content:
              "Di chuyển 64 km (khoảng 1 giờ 15 phút) tới Sóc Trăng. Tham quan chùa Dơi (Mahatup) – ngôi chùa Khmer với hàng vạn con dơi quạ, tìm hiểu văn hoá Khmer Nam Bộ.",
          },
          {
            slot: "evening",
            title: "Nhà công tử Bạc Liêu – cánh đồng quạt gió",
            content:
              "Tiếp tục 50 km tới Bạc Liêu. Tham quan nhà công tử Bạc Liêu (vé 30.000đ), ra cánh đồng điện gió ngắm hoàng hôn. Ăn tối hải sản, nghỉ đêm tại Bạc Liêu.",
          },
        ],
      },
      {
        dayNumber: 3,
        title: "Bạc Liêu – U Minh Hạ – Cà Mau",
        meals: { breakfast: "Tại khách sạn", lunch: "Cơm đồng quê U Minh", dinner: "Lẩu mắm U Minh" },
        hotel: "Khách sạn 3 sao tại TP Cà Mau",
        items: [
          {
            slot: "morning",
            title: "Vào rừng tràm U Minh Hạ",
            content:
              "Rời Bạc Liêu 95 km (khoảng 1 giờ 45 phút) tới Vườn quốc gia U Minh Hạ. Đổi sang xuồng máy, xuyên kênh tràm, nghe kể chuyện gác kèo ong và nghề làm mật ong rừng.",
          },
          {
            slot: "afternoon",
            title: "Câu cá, ăn ong rừng",
            content:
              "Câu cá đồng trên kênh, thử mật ong rừng nguyên chất, ăn trưa với cá lóc nướng và rau rừng. Thời gian tự do chụp ảnh dưới tán tràm.",
          },
          {
            slot: "evening",
            title: "Về TP Cà Mau",
            content:
              "Khoảng 35 km về TP Cà Mau. Ăn tối lẩu mắm, dạo chợ đêm Cà Mau và nghỉ đêm.",
          },
        ],
      },
      {
        dayNumber: 4,
        title: "Cà Mau – Đất Mũi – Sài Gòn",
        meals: { breakfast: "Tại khách sạn", lunch: "Hải sản Đất Mũi", dinner: "Tự túc trên đường về" },
        hotel: null,
        items: [
          {
            slot: "morning",
            title: "Mốc toạ độ quốc gia – cột cờ Hà Nội",
            content:
              "Đi khoảng 100 km ra Đất Mũi. Tham quan mốc toạ độ quốc gia, cột cờ Hà Nội (hơn 41 m), đi bộ xuyên rừng đước hoặc thuê cano ra bãi bồi. Vé vào cổng 30.000đ/người lớn.",
          },
          {
            slot: "afternoon",
            title: "Hải sản Đất Mũi và lên đường về",
            content:
              "Ăn trưa hải sản (cua, vọp nướng, ba khía). Khởi hành về Sài Gòn, dự kiến 6–7 giờ di chuyển, có dừng nghỉ giữa đường.",
          },
          {
            slot: "evening",
            title: "Về lại Sài Gòn",
            content:
              "Dự kiến có mặt tại TP.HCM khoảng 20:00–21:00. Kết thúc tour, chia tay đoàn.",
          },
        ],
      },
    ],
    departures: { weekday: 6, weeks: 10, capacity: 24 },
  },
  {
    code: "XMSN-3N2D",
    slug: "sai-gon-can-tho-dat-mui-3n2d",
    name: "Sài Gòn – Cần Thơ – Đất Mũi (3N2Đ)",
    tagline: "Bản gọn của hành trình, vẫn đủ chợ nổi và cực Nam",
    summary:
      "3 ngày 2 đêm cho khách có ít thời gian: chợ nổi Cái Răng, Sóc Trăng, Bạc Liêu và Đất Mũi. Bỏ chặng rừng tràm U Minh Hạ.",
    description:
      "Tour 3N2Đ lược bớt chặng U Minh Hạ để phù hợp khách gia đình hoặc khách đi cuối tuần. Ngày 1 Sài Gòn – Mỹ Tho – Cần Thơ; ngày 2 chợ nổi Cái Răng – Sóc Trăng – Bạc Liêu – Cà Mau; ngày 3 Đất Mũi rồi về Sài Gòn.",
    durationDays: 3,
    durationNights: 2,
    basePriceAdult: 3190000,
    basePriceChild: 2230000,
    childAgeNote: "Trẻ em 5–10 tuổi: 70% giá người lớn; dưới 5 tuổi miễn phí nhưng vẫn tính 1 chỗ ngồi.",
    highlights: [
      "Chợ nổi Cái Răng",
      "Chùa Dơi và nhà công tử Bạc Liêu",
      "Mốc toạ độ quốc gia và cột cờ Hà Nội",
    ],
    includes: [
      "Xe du lịch máy lạnh",
      "2 đêm khách sạn 3 sao",
      "Các bữa ăn theo chương trình",
      "Vé tham quan, tàu chợ nổi, xe điện Đất Mũi",
      "Hướng dẫn viên, bảo hiểm du lịch",
    ],
    excludes: ["Chi phí cá nhân", "Phụ thu phòng đơn", "Phụ thu lễ Tết", "VAT"],
    cancellationPolicy:
      "Huỷ miễn phí trước 3 ngày khởi hành. Sát ngày hơn, vui lòng liên hệ hotline để được hỗ trợ.",
    packingNotes:
      "Áo chống nắng, mũ, kem chống muỗi, thuốc say sóng, giày bám tốt. Mang theo áo mưa mỏng.",
    coverImageUrl: IMG.caiRang,
    gallery: gallery([
      [IMG.caiRang, "Chợ nổi Cái Răng"],
      [IMG.chuaDoi, "Chùa Dơi Sóc Trăng"],
      [IMG.muiCaMau, "Mũi Cà Mau"],
    ]),
    seoTitle: "Tour Sài Gòn – Cần Thơ – Đất Mũi 3N2Đ",
    seoDescription:
      "Tour 3 ngày 2 đêm Sài Gòn – Cần Thơ – Đất Mũi: chợ nổi Cái Răng, nhà công tử Bạc Liêu, mốc toạ độ quốc gia. Giá từ 3.190.000đ/khách.",
    isFeatured: true,
    sortOrder: 2,
    itinerary: [
      {
        dayNumber: 1,
        title: "Sài Gòn – Mỹ Tho – Cần Thơ",
        meals: { breakfast: "Tự túc", lunch: "Đặc sản Mỹ Tho", dinner: "Lẩu mắm Cần Thơ" },
        hotel: "Khách sạn 3 sao tại Cần Thơ",
        items: [
          { slot: "morning", title: "Khởi hành về Mỹ Tho", content: "Đón khách 6:00, đi cao tốc Trung Lương 72 km." },
          { slot: "afternoon", title: "Chùa Vĩnh Tràng – cồn Lân", content: "Tham quan chùa và cù lao Thới Sơn, nghe đờn ca tài tử." },
          { slot: "evening", title: "Cần Thơ về đêm", content: "Nhận phòng, ăn tối, dạo bến Ninh Kiều." },
        ],
      },
      {
        dayNumber: 2,
        title: "Cần Thơ – Sóc Trăng – Bạc Liêu – Cà Mau",
        meals: { breakfast: "Hủ tiếu trên sông", lunch: "Bún nước lèo", dinner: "Hải sản Cà Mau" },
        hotel: "Khách sạn 3 sao tại TP Cà Mau",
        items: [
          { slot: "morning", title: "Chợ nổi Cái Răng", content: "Đi tàu từ 5:15, ăn sáng trên sông, ghé nhà cổ Bình Thủy." },
          { slot: "afternoon", title: "Chùa Dơi – nhà công tử Bạc Liêu", content: "64 km tới Sóc Trăng, sau đó 50 km tới Bạc Liêu." },
          { slot: "evening", title: "Điện gió Bạc Liêu – Cà Mau", content: "Ngắm hoàng hôn ở cánh đồng quạt gió, ăn tối và về Cà Mau nghỉ." },
        ],
      },
      {
        dayNumber: 3,
        title: "Đất Mũi – Sài Gòn",
        meals: { breakfast: "Tại khách sạn", lunch: "Hải sản Đất Mũi", dinner: "Tự túc" },
        hotel: null,
        items: [
          { slot: "morning", title: "Mốc toạ độ – cột cờ Hà Nội", content: "100 km ra Đất Mũi, tham quan mốc toạ độ, cột cờ, rừng đước." },
          { slot: "afternoon", title: "Ăn trưa và về Sài Gòn", content: "Ăn hải sản, khởi hành về TP.HCM." },
          { slot: "evening", title: "Kết thúc tour", content: "Dự kiến về TP.HCM 20:00–21:00." },
        ],
      },
    ],
    departures: { weekday: 5, weeks: 10, capacity: 20 },
  },
  {
    code: "XMSN-2N1D",
    slug: "trai-nghiem-u-minh-ha-2n1d",
    name: "Trải nghiệm U Minh Hạ (2N1Đ)",
    tagline: "Một đêm giữa rừng tràm, xuồng, cá đồng và mật ong rừng",
    summary:
      "Tour ngắn tập trung vào rừng tràm U Minh Hạ: xuồng máy xuyên kênh, câu cá, ăn ong rừng, ngủ homestay trong rừng. Phù hợp khách thích sinh thái, tránh ồn ào.",
    description:
      "Tour 2N1Đ dành riêng cho U Minh Hạ. Ngày 1 từ Sài Gòn về Cà Mau rồi vào rừng, đi xuồng, câu cá, ăn tối trong rừng và nghỉ homestay. Ngày 2 tiếp tục đi kênh nhỏ, thử mật ong rừng, ăn trưa với cá đồng rồi về lại Sài Gòn.",
    durationDays: 2,
    durationNights: 1,
    basePriceAdult: 1890000,
    basePriceChild: 1320000,
    childAgeNote: "Trẻ em 5–10 tuổi: 70% giá người lớn; dưới 5 tuổi miễn phí nhưng vẫn tính 1 chỗ ngồi.",
    highlights: [
      "Xuồng máy xuyên rừng tràm",
      "Câu cá đồng, ăn ong rừng",
      "Ngủ homestay trong rừng",
    ],
    includes: [
      "Xe du lịch khứ hồi Sài Gòn – Cà Mau",
      "1 đêm homestay trong rừng",
      "3 bữa chính, 1 bữa sáng",
      "Vé vào cổng, xuồng máy, hướng dẫn viên",
    ],
    excludes: ["Đồ uống", "Chi phí cá nhân", "Phụ thu lễ Tết"],
    cancellationPolicy:
      "Huỷ miễn phí trước 3 ngày khởi hành. Sát ngày hơn, vui lòng liên hệ hotline để được hỗ trợ.",
    packingNotes:
      "Quần áo dài tay, kem chống muỗi, đèn pin, dép quai hậu, thuốc dị ứng. Rừng tràm ẩm và nhiều muỗi vào chiều tối.",
    coverImageUrl: IMG.uMinh,
    gallery: gallery([
      [IMG.uMinh, "Rừng tràm U Minh Hạ"],
      [IMG.muiCaMau, "Rừng đước Cà Mau"],
    ]),
    seoTitle: "Tour trải nghiệm U Minh Hạ 2N1Đ",
    seoDescription:
      "Tour 2 ngày 1 đêm U Minh Hạ: xuồng xuyên rừng tràm, câu cá, ăn ong rừng, ngủ homestay. Giá từ 1.890.000đ/khách.",
    isFeatured: true,
    sortOrder: 3,
    itinerary: [
      {
        dayNumber: 1,
        title: "Sài Gòn – U Minh Hạ",
        meals: { breakfast: "Tự túc", lunch: "Cơm đồng quê", dinner: "Lẩu mắm U Minh" },
        hotel: "Homestay trong Vườn quốc gia U Minh Hạ",
        items: [
          { slot: "morning", title: "Khởi hành đi Cà Mau", content: "Đón khách 5:30, đi khoảng 6 giờ theo QL1A." },
          { slot: "afternoon", title: "Vào rừng tràm", content: "Tới U Minh Hạ, nhận phòng homestay, lên xuồng máy xuyên kênh tràm." },
          { slot: "evening", title: "Đêm trong rừng", content: "Câu cá, ăn tối lẩu mắm, nghe kể chuyện gác kèo ong, ngắm đom đóm." },
        ],
      },
      {
        dayNumber: 2,
        title: "U Minh Hạ – Sài Gòn",
        meals: { breakfast: "Tại homestay", lunch: "Cá đồng nướng", dinner: "Tự túc" },
        hotel: null,
        items: [
          { slot: "morning", title: "Kênh nhỏ và mật ong rừng", content: "Đi xuồng kênh nhỏ, thử mật ong rừng, chụp ảnh dưới tán tràm." },
          { slot: "afternoon", title: "Về TP Cà Mau", content: "Ăn trưa với cá đồng, ghé chợ Cà Mau mua đặc sản." },
          { slot: "evening", title: "Về Sài Gòn", content: "Khởi hành về TP.HCM, dự kiến 20:00." },
        ],
      },
    ],
    departures: { weekday: 6, weeks: 6, capacity: 16, stepWeeks: 2 },
  },
];

// ---------------------------------------------------------------------------
// BÀI VIẾT
// ---------------------------------------------------------------------------
const POSTS = [
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
    coverImageUrl: IMG.uMinh,
    publishedAt: new Date("2026-09-15T08:00:00Z"),
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
    coverImageUrl: IMG.uMinh,
    publishedAt: new Date("2026-09-28T08:00:00Z"),
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
    coverImageUrl: IMG.muiCaMau,
    publishedAt: new Date("2026-10-10T08:00:00Z"),
  },
];

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------
const FAQS = [
  {
    question: "Tour có bao gồm vé máy bay hoặc tàu không?",
    answer:
      "Không. Tất cả tour đều khởi hành từ TP.HCM bằng xe du lịch. Khách ở tỉnh khác tự túc di chuyển đến điểm hẹn.",
    category: "transport",
    sortOrder: 1,
  },
  {
    question: "Trẻ em mấy tuổi được miễn phí?",
    answer:
      "Trẻ dưới 5 tuổi miễn phí khi ngồi cùng bố mẹ (không tính suất ăn và giường riêng). Trẻ 5–10 tuổi tính 70% giá người lớn. Từ 11 tuổi tính như người lớn.",
    category: "booking",
    sortOrder: 2,
  },
  {
    question: "Đi U Minh Hạ có nguy hiểm cho trẻ nhỏ không?",
    answer:
      "Đường xuồng an toàn nếu trẻ mặc áo phao (đơn vị cung cấp) và ngồi yên. Tuy nhiên rừng ẩm, nhiều muỗi, nên cân nhắc với trẻ dưới 3 tuổi hoặc trẻ dễ say sóng.",
    category: "safety",
    sortOrder: 3,
  },
  {
    question: "Đi chợ nổi Cái Răng có say sóng không?",
    answer:
      "Tàu nhỏ đi trên sông êm, ít say. Chặng dễ say nhất là cano ra Đất Mũi nếu biển động. Mang thuốc say sóng nếu bạn nhạy cảm.",
    category: "safety",
    sortOrder: 4,
  },
  {
    question: "Nên đi vào mùa mưa hay mùa khô?",
    answer:
      "Mùa khô (tháng 12–4) dễ chịu nhất. Mùa nước nổi (tháng 9–11) đẹp và nhiều cá nhưng có mưa rào. Mùa mưa (tháng 5–8) vắng khách, giá mềm hơn.",
    category: "weather",
    sortOrder: 5,
  },
  {
    question: "Đặt tour có cần thanh toán trước không?",
    answer:
      "Không. Website chỉ giữ chỗ, không thu tiền online. Sau khi gửi đơn, nhân viên gọi/Zalo xác nhận và hướng dẫn thanh toán theo thoả thuận.",
    category: "booking",
    sortOrder: 6,
  },
  {
    question: "Có thể huỷ đơn đã đặt không?",
    answer:
      "Có. Vào trang Tra cứu đơn, nhập mã đơn và số điện thoại để huỷ. Bạn có thể tự huỷ trước 3 ngày khởi hành; sát ngày hơn vui lòng gọi hotline. Vì chưa thanh toán online, việc hoàn cọc (nếu có) do bộ phận đặt tour xử lý.",
    category: "booking",
    sortOrder: 7,
  },
  {
    question: "Tour có phụ thu lễ, Tết không?",
    answer:
      "Có. Các ngày lễ lớn và Tết Nguyên đán thường phụ thu 10–20% do giá khách sạn và dịch vụ tăng. Mức phụ thu được ghi rõ khi xác nhận đơn.",
    category: "booking",
    sortOrder: 8,
  },
];

// ---------------------------------------------------------------------------
// THƯ VIỆN ẢNH
// ---------------------------------------------------------------------------
const MEDIA = [
  { url: IMG.caiRang, title: "Chợ nổi Cái Răng", alt: "Ghe thuyền bán trái cây trên chợ nổi Cái Răng", tags: ["cho-noi", "can-tho"], sortOrder: 1 },
  { url: IMG.uMinh, title: "Rừng tràm U Minh Hạ", alt: "Kênh tràm trong Vườn quốc gia U Minh Hạ", tags: ["u-minh-ha", "rung"], sortOrder: 2 },
  { url: IMG.muiCaMau, title: "Mũi Cà Mau", alt: "Tượng đài và mốc toạ độ tại Mũi Cà Mau", tags: ["dat-mui", "ca-mau"], sortOrder: 3 },
  { url: IMG.vinhTrang, title: "Chùa Vĩnh Tràng", alt: "Chùa Vĩnh Tràng ở Mỹ Tho", tags: ["my-tho", "chua"], sortOrder: 4 },
  { url: IMG.thoiSon, title: "Cù lao Thới Sơn", alt: "Tàu du lịch ghé cồn Lân", tags: ["my-tho", "cu-lao"], sortOrder: 5 },
  { url: IMG.binhThuy, title: "Nhà cổ Bình Thủy", alt: "Nhà cổ Bình Thủy ở Cần Thơ", tags: ["can-tho", "kien-truc"], sortOrder: 6 },
  { url: IMG.chuaDoi, title: "Chùa Dơi", alt: "Chùa Dơi (Mahatup) ở Sóc Trăng", tags: ["soc-trang", "chua"], sortOrder: 7 },
  { url: IMG.congTu, title: "Nhà công tử Bạc Liêu", alt: "Dinh thự nhà công tử Bạc Liêu", tags: ["bac-lieu", "kien-truc"], sortOrder: 8 },
  { url: IMG.dienGio, title: "Cánh đồng quạt gió Bạc Liêu", alt: "Các trụ tuabin điện gió Bạc Liêu", tags: ["bac-lieu", "dien-gio"], sortOrder: 9 },
];

// ---------------------------------------------------------------------------
// CẤU HÌNH SITE (thay hotline/Zalo thật trước khi go-live)
// ---------------------------------------------------------------------------
const SETTINGS = {
  site: {
    name: "Xuôi Miền Sông Nước",
    slogan: "Xuôi dòng về miền Tây, chạm cực Nam Tổ quốc",
    hotline: "0900 000 000",
    zalo: "0900000000",
    email: "hello@xuoiemiensongnuoc.vn",
    address: "TP. Hồ Chí Minh",
    workingHours: "08:00 – 20:00 hằng ngày",
  },
  social: {
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  },
  seo: {
    titleTemplate: "%s | Xuôi Miền Sông Nước",
    defaultTitle: "Xuôi Miền Sông Nước – Tour miền Tây, U Minh Hạ, Đất Mũi",
    defaultDescription:
      "Tour miền Tây từ Sài Gòn: chợ nổi Cái Răng, rừng tràm U Minh Hạ, mốc toạ độ Đất Mũi. Đặt giữ chỗ online, xác nhận qua điện thoại/Zalo.",
    ogImage: IMG.muiCaMau,
  },
  booking: {
    minDaysAhead: 3,
    maxGuestsPerOrder: 20,
    holdHours: 24,
    cancelCutoffDays: 3,
    cancellationPolicy:
      "Huỷ miễn phí trước 3 ngày khởi hành. Sát ngày hơn, vui lòng liên hệ hotline để được hỗ trợ. Trường hợp bất khả kháng được bảo lưu hoặc hoàn theo thoả thuận.",
  },
};

// ---------------------------------------------------------------------------
// SEED
// ---------------------------------------------------------------------------
async function seedSettings() {
  // Mặc định chỉ tạo khoá mới, không ghi đè giá trị admin đã sửa.
  // SEED_FORCE_SETTINGS=1 dùng khi cần đồng bộ lại toàn bộ giá trị mặc định.
  const force = process.env.SEED_FORCE_SETTINGS === "1";
  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: force ? { value } : {},
      create: { key, value },
    });
  }
}

async function seedDestinations() {
  for (const d of DESTINATIONS) {
    await prisma.destination.upsert({
      where: { slug: d.slug },
      update: { ...d },
      create: { ...d },
    });
  }
}

async function seedJourneyLegs() {
  await prisma.journeyLeg.deleteMany();
  await prisma.journeyLeg.createMany({ data: JOURNEY_LEGS });
}

async function seedCuisines() {
  for (const c of CUISINES) {
    await prisma.cuisine.upsert({
      where: { slug: c.slug },
      update: { ...c },
      create: { ...c },
    });
  }
}

async function seedTours() {
  for (const t of TOURS) {
    const { itinerary, departures, ...tourData } = t;

    const tour = await prisma.tour.upsert({
      where: { code: t.code },
      update: { ...tourData, status: "published" },
      create: { ...tourData, status: "published" },
    });

    // Lịch trình: xoá và tạo lại (cascade items)
    await prisma.tourItineraryDay.deleteMany({ where: { tourId: tour.id } });
    for (const day of itinerary) {
      await prisma.tourItineraryDay.create({
        data: {
          tourId: tour.id,
          dayNumber: day.dayNumber,
          title: day.title,
          meals: day.meals,
          hotel: day.hotel,
          items: {
            create: day.items.map((item, index) => ({
              slot: item.slot,
              title: item.title,
              content: item.content,
              sortOrder: index,
            })),
          },
        },
      });
    }

    // Ngày khởi hành: 10 tuần tới (tour 2N1Đ cách 2 tuần)
    const dates = weeklyDates(departures.weekday, departures.weeks, departures.stepWeeks ?? 1);
    for (const departureDate of dates) {
      await prisma.tourDeparture.upsert({
        where: { tourId_departureDate: { tourId: tour.id, departureDate } },
        update: {
          capacityTotal: departures.capacity,
          status: "open",
        },
        create: {
          tourId: tour.id,
          departureDate,
          returnDate: new Date(departureDate.getTime() + (t.durationDays - 1) * 86400000),
          capacityTotal: departures.capacity,
          seatsTaken: 0, // site mới, chưa có khách thật — không seed số chỗ ảo
          holidaySurcharge: 0,
          meetingPoint: "Trung tâm TP.HCM (Quận 1)",
          status: "open",
        },
      });
    }

    // Gắn điểm đến & món ăn theo lịch trình
    const destSlugs = {
      "XMSN-4N3D": [
        "chua-vinh-trang",
        "cu-lao-thoi-son",
        "cho-noi-cai-rang",
        "nha-co-binh-thuy",
        "chua-doi",
        "nha-cong-tu-bac-lieu",
        "canh-dong-dien-gio-bac-lieu",
        "vuon-quoc-gia-u-minh-ha",
        "mui-ca-mau",
        "cot-co-ha-noi-mui-ca-mau",
      ],
      "XMSN-3N2D": [
        "chua-vinh-trang",
        "cu-lao-thoi-son",
        "cho-noi-cai-rang",
        "nha-co-binh-thuy",
        "chua-doi",
        "nha-cong-tu-bac-lieu",
        "canh-dong-dien-gio-bac-lieu",
        "mui-ca-mau",
        "cot-co-ha-noi-mui-ca-mau",
      ],
      "XMSN-2N1D": ["vuon-quoc-gia-u-minh-ha"],
    }[t.code];

    const destinations = await prisma.destination.findMany({
      where: { slug: { in: destSlugs } },
      select: { id: true, slug: true },
    });
    await prisma.tourDestination.deleteMany({ where: { tourId: tour.id } });
    await prisma.tourDestination.createMany({
      data: destSlugs
        .map((slug) => destinations.find((d) => d.slug === slug))
        .filter(Boolean)
        .map((d, index) => ({ tourId: tour.id, destinationId: d.id, sortOrder: index })),
    });

    const cuisineSlugs = {
      "XMSN-4N3D": [
        "lau-mam-u-minh",
        "cua-ca-mau",
        "ba-khia-muoi",
        "vop-nuong",
        "banh-xeo-mien-tay",
        "bun-nuoc-leo-soc-trang",
        "banh-pia-soc-trang",
      ],
      "XMSN-3N2D": ["cua-ca-mau", "vop-nuong", "banh-xeo-mien-tay", "bun-nuoc-leo-soc-trang", "banh-pia-soc-trang"],
      "XMSN-2N1D": ["lau-mam-u-minh", "cua-ca-mau", "ba-khia-muoi"],
    }[t.code];

    const cuisines = await prisma.cuisine.findMany({
      where: { slug: { in: cuisineSlugs } },
      select: { id: true },
    });
    await prisma.tourCuisine.deleteMany({ where: { tourId: tour.id } });
    await prisma.tourCuisine.createMany({
      data: cuisines.map((c) => ({ tourId: tour.id, cuisineId: c.id })),
    });

    console.log(
      `  ✓ ${t.code} — ${dates.length} ngày khởi hành (từ ${dates[0].toISOString().slice(0, 10)})`,
    );
  }
}

async function seedPosts() {
  for (const p of POSTS) {
    await prisma.post.upsert({
      where: { slug: p.slug },
      update: { ...p, status: "published" },
      create: { ...p, status: "published" },
    });
  }
}

async function seedFaqs() {
  await prisma.faq.deleteMany();
  await prisma.faq.createMany({ data: FAQS });
}

async function seedMedia() {
  await prisma.media.deleteMany();
  await prisma.media.createMany({ data: MEDIA });
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@xuoiemiensongnuoc.vn";
  const password = process.env.ADMIN_PASSWORD ?? "Xmsn@2026";

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`  ✓ admin ${email} đã tồn tại — giữ nguyên mật khẩu`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.create({
    data: { email, passwordHash, name: "Quản trị viên", role: "owner" },
  });

  console.log(`  ✓ tạo admin ${email} (mật khẩu: ${password})`);
}

async function main() {
  // Chặn seed nhầm vào production: seed sẽ ghi đè nội dung tour/blog/FAQ.
  if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PROD !== "1") {
    console.error(
      "✗ Từ chối seed khi NODE_ENV=production.\n" +
        "  Nếu thực sự muốn seed production, chạy: SEED_ALLOW_PROD=1 node prisma/seed.mjs",
    );
    process.exit(1);
  }

  console.log("→ Seed dữ liệu Xuôi Miền Sông Nước...");
  await seedSettings();
  console.log("  ✓ settings");
  await seedDestinations();
  console.log(`  ✓ ${DESTINATIONS.length} điểm đến`);
  await seedJourneyLegs();
  console.log(`  ✓ ${JOURNEY_LEGS.length} chặng hành trình`);
  await seedCuisines();
  console.log(`  ✓ ${CUISINES.length} món ăn`);
  await seedTours();
  console.log(`  ✓ ${TOURS.length} tour`);
  await seedPosts();
  console.log(`  ✓ ${POSTS.length} bài viết`);
  await seedFaqs();
  console.log(`  ✓ ${FAQS.length} FAQ`);
  await seedMedia();
  console.log(`  ✓ ${MEDIA.length} ảnh thư viện`);
  await seedAdmin();

  const counts = {
    tours: await prisma.tour.count(),
    departures: await prisma.tourDeparture.count(),
    destinations: await prisma.destination.count(),
    cuisines: await prisma.cuisine.count(),
    posts: await prisma.post.count(),
    faqs: await prisma.faq.count(),
    media: await prisma.media.count(),
  };
  console.log("\n✓ Hoàn tất:", counts);
}

main()
  .catch((error) => {
    console.error("✗ Seed thất bại:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
