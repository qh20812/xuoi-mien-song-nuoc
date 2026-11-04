import type { DestinationRecord } from "@/lib/contracts/destination";

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

export const destinations: DestinationRecord[] = [
  {
    slug: "chua-vinh-trang",
    name: "Chùa Vĩnh Tràng",
    province: "Đồng Tháp",
    category: "kien-truc",
    shortDescription:
      "Ngôi chùa cổ nổi tiếng của Mỹ Tho, kiến trúc pha trộn Á – Âu, điểm dừng đầu tiên trên hành trình xuôi về miền Tây.",
    description:
      "Chùa Vĩnh Tràng tọa lạc trên đường Nguyễn Trung Trực, TP Mỹ Tho (nay thuộc tỉnh Đồng Tháp sau sáp nhập 2025). Chùa được xây dựng từ thế kỷ 19, nổi bật với sự kết hợp kiến trúc Việt – Hoa – Khmer và các chi tiết trang trí kiểu Pháp.",
    bestSeason: "Cả năm; đẹp nhất vào mùa khô (tháng 12 – tháng 4)",
    travelNote:
      "Cách trung tâm Sài Gòn khoảng 72 km, đi cao tốc Trung Lương mất khoảng 1 giờ 30 phút.",
    image: { src: IMG.vinhTrang, alt: "Chùa Vĩnh Tràng ở Mỹ Tho" },
    lat: 10.362809,
    lng: 106.373749,
    sortOrder: 1,
  },
  {
    slug: "cu-lao-thoi-son",
    name: "Cù lao Thới Sơn (cồn Lân)",
    province: "Đồng Tháp",
    category: "song-nuoc",
    shortDescription:
      "Cồn nổi giữa sông Tiền, nơi du khách đi xuồng, nghe đờn ca tài tử và thưởng thức trái cây miệt vườn.",
    description:
      "Cù lao Thới Sơn (cồn Lân) thuộc phường Thới Sơn, TP Mỹ Tho, cách trung tâm thành phố khoảng 3 km. Du khách qua cồn bằng thuyền/xuồng, tham quan vườn trái cây, thử mật ong và nghe đờn ca tài tử.",
    bestSeason: "Mùa trái cây tháng 5 – tháng 8",
    travelNote:
      "Từ chùa Vĩnh Tràng ra bến thuyền khoảng 10 phút; thời gian tham quan cồn khoảng 2 giờ.",
    image: { src: IMG.thoiSon, alt: "Tàu du lịch ghé cồn Lân" },
    lat: 10.332361,
    lng: 106.330139,
    sortOrder: 2,
  },
  {
    slug: "cho-noi-cai-rang",
    name: "Chợ nổi Cái Răng",
    province: "Cần Thơ",
    category: "cho-noi",
    shortDescription:
      "Chợ nổi lớn nhất miền Tây, họp từ 4–5 giờ sáng trên sông Cần Thơ, chuyên trái cây và rau củ.",
    description:
      "Chợ nổi Cái Răng nằm trên sông Cần Thơ, thuộc phường Cái Răng, TP Cần Thơ. Chợ họp từ khoảng 4–5 giờ sáng và đông nhất từ 5–8 giờ; ghe thuyền bán trái cây, rau củ và đồ ăn sáng.",
    bestSeason: "Cả năm; mùa trái cây (tháng 5 – tháng 8) nhộn nhịp nhất",
    travelNote:
      "Cách trung tâm Cần Thơ khoảng 6 km; nên khởi hành từ 5 giờ sáng để kịp chợ đông.",
    image: { src: IMG.caiRang, alt: "Ghe thuyền bán trái cây trên chợ nổi Cái Răng" },
    lat: 10.005,
    lng: 105.746,
    sortOrder: 3,
  },
  {
    slug: "nha-co-binh-thuy",
    name: "Nhà cổ Bình Thủy",
    province: "Cần Thơ",
    category: "kien-truc",
    shortDescription:
      "Dinh thự họ Dương xây cuối thế kỷ 19, kiến trúc Đông Dương, điểm tham quan đẹp nhất nhì Cần Thơ.",
    description:
      "Nhà cổ Bình Thủy (Phủ thờ họ Dương) tại số 144 đường Bùi Hữu Nghĩa, phường Bình Thủy, TP Cần Thơ. Ngôi nhà được xây dựng từ cuối thế kỷ 19, là công trình tiêu biểu cho phong cách kiến trúc Đông Dương ở Nam Kỳ.",
    bestSeason: "Cả năm",
    travelNote:
      "Từ chợ nổi Cái Răng khoảng 30 phút xe; tham quan khoảng 45–60 phút.",
    image: { src: IMG.binhThuy, alt: "Nhà cổ Bình Thủy ở Cần Thơ" },
    lat: 10.066996,
    lng: 105.749631,
    sortOrder: 4,
  },
  {
    slug: "chua-doi",
    name: "Chùa Dơi (Mahatup)",
    province: "Cần Thơ",
    category: "kien-truc",
    shortDescription:
      "Ngôi chùa Khmer cổ ở Sóc Trăng với hàng vạn con dơi quạ trú ngụ, kiến trúc Việt – Khmer độc đáo.",
    description:
      "Chùa Dơi (tên Khmer: Mahatup) nằm trên đường Văn Ngọc Chính, phường Phú Lợi, TP Sóc Trăng (nay thuộc TP Cần Thơ). Chùa có kiến trúc hòa trộn Việt – Khmer, xung quanh là rừng sao, dầu – nơi trú ngụ của hàng vạn con dơi quạ.",
    bestSeason: "Cả năm; buổi chiều dơi về nhiều nhất",
    travelNote: "Cách Cần Thơ khoảng 64 km (1 giờ 15 phút) theo QL1A.",
    image: { src: IMG.chuaDoi, alt: "Chùa Dơi (Mahatup) ở Sóc Trăng" },
    lat: 9.582919,
    lng: 105.976713,
    sortOrder: 5,
  },
  {
    slug: "nha-cong-tu-bac-lieu",
    name: "Nhà công tử Bạc Liêu",
    province: "Cà Mau",
    category: "kien-truc",
    shortDescription:
      "Dinh thự của công tử Trần Trinh Huy, xây 1917–1919, biểu tượng giàu có của đất Bạc Liêu.",
    description:
      "Nhà công tử Bạc Liêu tại số 13 đường Điện Biên Phủ, phường Bạc Liêu, tỉnh Cà Mau (sau sáp nhập 2025). Ngôi nhà được xây dựng từ năm 1917 đến 1919, kiến trúc Pháp cổ, gắn với giai thoại về công tử Trần Trinh Huy.",
    bestSeason: "Cả năm",
    travelNote:
      "Từ Sóc Trăng khoảng 50 km (1 giờ); từ đây ra cánh đồng điện gió khoảng 15 phút.",
    image: { src: IMG.congTu, alt: "Dinh thự nhà công tử Bạc Liêu" },
    lat: 9.284123,
    lng: 105.723353,
    sortOrder: 6,
  },
  {
    slug: "canh-dong-dien-gio-bac-lieu",
    name: "Cánh đồng quạt gió Bạc Liêu",
    province: "Cà Mau",
    category: "bien",
    shortDescription:
      "Nhà máy điện gió ven biển đầu tiên của Việt Nam (2010), hàng chục trụ tuabin giữa đồng bãi bồi.",
    description:
      "Nhà máy điện gió Bạc Liêu tọa lạc tại khóm Biển Đông A, phường Hiệp Thành, tỉnh Cà Mau. Đây là nhà máy điện gió ven biển đầu tiên của Việt Nam, khởi công từ năm 2010; những trụ tuabin cao hàng chục mét giữa bãi bồi tạo nên khung cảnh nổi tiếng, đặc biệt lúc hoàng hôn.",
    bestSeason: "Tháng 12 – tháng 4 (trời khô, nắng đẹp)",
    travelNote:
      "Cách trung tâm Bạc Liêu khoảng 15–20 phút xe; nên đi cuối chiều để ngắm hoàng hôn.",
    image: { src: IMG.dienGio, alt: "Các trụ tuabin điện gió Bạc Liêu" },
    lat: 9.2212,
    lng: 105.8009,
    sortOrder: 7,
  },
  {
    slug: "vuon-quoc-gia-u-minh-ha",
    name: "Vườn quốc gia U Minh Hạ",
    province: "Cà Mau",
    category: "rung",
    shortDescription:
      "Rừng tràm trên đất than bùn hơn 8.000 ha, nơi đi xuồng xuyên kênh, câu cá và ăn ong rừng.",
    description:
      "Vườn quốc gia U Minh Hạ thuộc các xã Khánh Lâm, Khánh An và Đá Bạc, tỉnh Cà Mau; thành lập năm 2006 trên cơ sở nâng cấp khu bảo tồn thiên nhiên Vồ Dơi, diện tích hơn 8.000 ha. Đây là hệ sinh thái đất ngập nước trên lớp than bùn đặc trưng với rừng tràm, chim nước, cá đồng và nghề gác kèo ong lâu đời.",
    bestSeason: "Mùa khô tháng 12 – tháng 4; mùa nước nổi tháng 9 – tháng 11",
    travelNote:
      "Cách TP Cà Mau khoảng 35 km; từ Bạc Liêu khoảng 95 km (1 giờ 45 phút).",
    image: { src: IMG.uMinh, alt: "Vườn chuối trong vùng rừng tràm U Minh Hạ" },
    lat: 9.251389,
    lng: 104.945278,
    sortOrder: 8,
  },
  {
    slug: "mui-ca-mau",
    name: "Mũi Cà Mau – Mốc tọa độ quốc gia",
    province: "Cà Mau",
    category: "bien",
    shortDescription:
      "Cực Nam trên đất liền Việt Nam: mốc tọa độ quốc gia, cột cờ Hà Nội và rừng đước Năm Căn.",
    description:
      "Mũi Cà Mau thuộc xã Đất Mũi, tỉnh Cà Mau – cực Nam trên đất liền của Việt Nam. Khu du lịch Mũi Cà Mau có mốc tọa độ quốc gia, Cột cờ Hà Nội, đường xuyên rừng đước và bãi bồi.",
    bestSeason: "Tháng 12 – tháng 4; hoàng hôn đẹp nhất khoảng 17:30–18:00",
    travelNote:
      "Cách TP Cà Mau khoảng 100 km (2 giờ 30 phút); từ U Minh Hạ khoảng 136 km.",
    image: { src: IMG.muiCaMau, alt: "Tượng đài và mốc tọa độ tại Mũi Cà Mau" },
    lat: 8.60723,
    lng: 104.720412,
    sortOrder: 9,
  },
  {
    slug: "cot-co-ha-noi-mui-ca-mau",
    name: "Cột cờ Hà Nội tại Mũi Cà Mau",
    province: "Cà Mau",
    category: "kien-truc",
    shortDescription:
      "Công trình mô phỏng Cột cờ Hà Nội, cao hơn 41 m, khánh thành 10/12/2019 trong khu du lịch Mũi Cà Mau.",
    description:
      "Cột cờ Hà Nội tại Mũi Cà Mau nằm trong Khu du lịch quốc gia Mũi Cà Mau, ấp Mũi, xã Đất Mũi, tỉnh Cà Mau. Công trình khởi công năm 2016, khánh thành ngày 10/12/2019, mô phỏng kiến trúc Cột cờ Hà Nội cổ, tổng chiều cao hơn 41 m tính cả cán cờ.",
    bestSeason: "Cả năm",
    travelNote:
      "Nằm trong cùng khuôn viên với mốc tọa độ Đất Mũi, đi bộ hoặc xe điện từ cổng.",
    image: { src: IMG.muiCaMau, alt: "Cột cờ Hà Nội tại Mũi Cà Mau" },
    lat: 8.6075,
    lng: 104.7208,
    sortOrder: 10,
  },
  {
    slug: "nha-tho-tac-say",
    name: "Nhà thờ Tắc Sậy",
    province: "Cà Mau",
    category: "kien-truc",
    shortDescription:
      "Trung tâm hành hương lớn nhất miền Tây, gắn với Cha Phanxicô Xaviê Trương Bửu Diệp.",
    description:
      "Nhà thờ Tắc Sậy (Trung tâm Hành hương Tắc Sậy) tại ấp 2, QL1A, xã Phong Thạnh, tỉnh Cà Mau. Đây là nơi an nghỉ của Cha Phanxicô Xaviê Trương Bửu Diệp, thu hút nhiều khách hành hương mỗi năm.",
    bestSeason: "Cả năm; đông nhất vào tháng 12 và dịp lễ Cha Diệp (tháng 3 âm lịch)",
    travelNote:
      "Nằm trên QL1A, cách TP Bạc Liêu khoảng 40 km; thuận tiện dừng trên đường Sóc Trăng – Cà Mau.",
    image: null,
    lat: null,
    lng: null,
    sortOrder: 11,
  },
];
