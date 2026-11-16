import type { CuisineData, DestinationData } from "@/lib/contracts/home";
import type { TourDetailData } from "@/lib/contracts/tour";

const IMG = {
  // Điểm đến tải từ Wikimedia Commons (nguồn & giấy phép: public/images/CREDITS.md)
  vinhTrang: "/images/chua-vinh-trang.webp",
  thoiSon: "/images/cu-lao-thoi-son.webp",
  caiRang: "/images/cho-noi-cai-rang.webp",
  binhThuy: "/images/nha-co-binh-thuy.webp",
  chuaDoi: "/images/chua-doi-soc-trang.webp",
  congTu: "/images/nha-cong-tu-bac-lieu.webp",
  dienGio: "/images/canh-dong-dien-gio-bac-lieu.webp",
  tacSay: "/images/nha-tho-tac-say.webp",
  // Điểm đến & gallery — ảnh chụp trong chuyến Cà Mau – Đất Mũi
  uMinh: "/images/65-mui-ghe-dtc-kenh-rung-tram.webp",
  muiCaMau: "/images/50-cot-moc-mui-ca-mau-co-do.webp",
  cotCo: "/images/69-tuong-cua-bien-ca-mau.webp",
  gacKeo: "/images/66-dan-ong-mat-tren-gian-tre.webp",
  gheRungDuoc: "/images/71-khach-tren-ghe-may-rung-duoc.webp",
  loiKenh: "/images/79-nhom-tre-ngam-minh-duoi-kenh.webp",
  hoangHon: "/images/47-du-khach-ghe-may-hoang-hon.webp",
  tuongMe: "/images/51-tuong-dai-me-mui-ca-mau.webp",
  kenhNho: "/images/58-kenh-nho-in-bong-cay.webp",
  ongCanh: "/images/55-dan-ong-mat-bu-tren-canh.webp",
  nhaSan: "/images/62-xuong-go-ben-nha-san-beo.webp",
  gheHang: "/images/21-ghe-cho-hang-tren-kenh-2.webp",
  xuongMay: "/images/23-xuong-may-tren-kenh-phu-sa.webp",
};

const DESTINATIONS = {
  vinhTrang: {
    slug: "chua-vinh-trang",
    name: "Chùa Vĩnh Tràng",
    province: "Đồng Tháp",
    shortDescription:
      "Ngôi chùa cổ của Mỹ Tho với kiến trúc pha trộn Việt – Hoa – Khmer và nhiều chi tiết trang trí kiểu Pháp.",
    image: { src: IMG.vinhTrang, alt: "Chùa Vĩnh Tràng ở Mỹ Tho" },
  },
  thoiSon: {
    slug: "cu-lao-thoi-son",
    name: "Cù lao Thới Sơn",
    province: "Đồng Tháp",
    shortDescription:
      "Cồn nổi giữa sông Tiền, nơi du khách đi xuồng, nghe đờn ca tài tử và thưởng thức trái cây miệt vườn.",
    image: { src: IMG.thoiSon, alt: "Xuồng chở khách qua kênh rừng nước ở cù lao Thới Sơn" },
  },
  caiRang: {
    slug: "cho-noi-cai-rang",
    name: "Chợ nổi Cái Răng",
    province: "Cần Thơ",
    shortDescription:
      "Chợ nổi lớn nhất miền Tây, họp từ sáng sớm trên sông Cần Thơ với ghe trái cây, rau củ và đồ ăn sáng.",
    image: { src: IMG.caiRang, alt: "Ghe thuyền bán trái cây trên chợ nổi Cái Răng" },
  },
  binhThuy: {
    slug: "nha-co-binh-thuy",
    name: "Nhà cổ Bình Thủy",
    province: "Cần Thơ",
    shortDescription:
      "Dinh thự họ Dương xây cuối thế kỷ 19, tiêu biểu cho kiến trúc Đông Dương và nội thất gỗ truyền thống.",
    image: { src: IMG.binhThuy, alt: "Nhà cổ Bình Thủy ở Cần Thơ" },
  },
  chuaDoi: {
    slug: "chua-doi",
    name: "Chùa Dơi (Mahatup)",
    province: "Cần Thơ",
    shortDescription:
      "Ngôi chùa Khmer cổ với kiến trúc Việt – Khmer và đàn dơi quạ trú ngụ trong khuôn viên rợp bóng cây.",
    image: { src: IMG.chuaDoi, alt: "Chùa Dơi (Mahatup) ở Sóc Trăng" },
  },
  congTu: {
    slug: "nha-cong-tu-bac-lieu",
    name: "Nhà công tử Bạc Liêu",
    province: "Cà Mau",
    shortDescription:
      "Dinh thự của công tử Trần Trinh Huy, xây từ năm 1917 đến 1919, mang kiến trúc Pháp cổ.",
    image: { src: IMG.congTu, alt: "Dinh thự nhà công tử Bạc Liêu" },
  },
  dienGio: {
    slug: "canh-dong-dien-gio-bac-lieu",
    name: "Cánh đồng quạt gió Bạc Liêu",
    province: "Cà Mau",
    shortDescription:
      "Những trụ tuabin điện gió ven biển nổi bật giữa bãi bồi, đẹp nhất vào cuối ngày khi nắng đổ xuống.",
    image: { src: IMG.dienGio, alt: "Các trụ tuabin điện gió trên bãi bồi Bạc Liêu" },
  },
  uMinh: {
    slug: "vuon-quoc-gia-u-minh-ha",
    name: "Vườn quốc gia U Minh Hạ",
    province: "Cà Mau",
    shortDescription:
      "Rừng tràm trên đất than bùn với hệ sinh thái đất ngập nước, nghề gác kèo ong và những tuyến kênh nhỏ.",
    image: { src: IMG.uMinh, alt: "Kênh rừng tràm nhìn từ mũi ghe" },
  },
  muiCaMau: {
    slug: "mui-ca-mau",
    name: "Mũi Cà Mau",
    province: "Cà Mau",
    shortDescription:
      "Cực Nam trên đất liền Việt Nam với mốc tọa độ quốc gia, cột cờ Hà Nội và rừng đước Năm Căn.",
    image: { src: IMG.muiCaMau, alt: "Cột mốc Mũi Cà Mau với cờ đỏ sao vàng" },
  },
  cotCo: {
    slug: "cot-co-ha-noi-mui-ca-mau",
    name: "Cột cờ Hà Nội tại Mũi Cà Mau",
    province: "Cà Mau",
    shortDescription:
      "Công trình mô phỏng Cột cờ Hà Nội, cao hơn 41 m, nằm trong khu du lịch quốc gia Mũi Cà Mau.",
    image: { src: IMG.cotCo, alt: "Tượng cua biển và cột cờ trong khu du lịch Mũi Cà Mau" },
  },
} satisfies Record<string, DestinationData>;

const CUISINES = {
  lauMam: {
    slug: "lau-mam-u-minh",
    name: "Lẩu mắm U Minh",
    description:
      "Mắm cá linh, cá sặc rằn nấu cùng nước dừa, ăn kèm cá đồng, tôm, rau đồng và bún.",
    whereToEat: "Homestay và quán ăn trong Vườn quốc gia U Minh Hạ",
    province: "Cà Mau",
  },
  cua: {
    slug: "cua-ca-mau",
    name: "Cua Cà Mau",
    description:
      "Cua biển Năm Căn chắc thịt, ngọt tự nhiên, thường hấp bia hoặc nấu lẩu.",
    whereToEat: "Năm Căn, Đất Mũi, chợ cua Cà Mau",
    province: "Cà Mau",
  },
  baKhia: {
    slug: "ba-khia-muoi",
    name: "Ba khía muối",
    description:
      "Ba khía muối mặn trộn tỏi, ớt, chanh, đường và rau thơm, món dân dã của vùng Rạch Gốc – Ngọc Hiển.",
    whereToEat: "Rạch Gốc, Ngọc Hiển, chợ đêm Cà Mau",
    province: "Cà Mau",
  },
  vop: {
    slug: "vop-nuong",
    name: "Vọp nướng",
    description:
      "Vọp nước lợ nướng trên than hồng, chấm muối tiêu chanh, phổ biến ở vùng biển Đất Mũi và Bạc Liêu.",
    whereToEat: "Đất Mũi, bãi biển Bạc Liêu",
    province: "Cà Mau",
  },
  banhXeo: {
    slug: "banh-xeo-mien-tay",
    name: "Bánh xèo miền Tây",
    description:
      "Vỏ giòn từ bột gạo nghệ, nhân tôm thịt và giá đỗ, cuốn cùng rau rừng và nước mắm chua ngọt.",
    whereToEat: "Cần Thơ, Bạc Liêu, Cà Mau",
    province: "Cần Thơ",
  },
  bunNuocLeo: {
    slug: "bun-nuoc-leo-soc-trang",
    name: "Bún nước lèo Sóc Trăng",
    description:
      "Nước dùng nấu từ mắm bò hóc, cá lóc và tôm khô, ăn cùng bún, rau sống và chả cá.",
    whereToEat: "TP Sóc Trăng",
    province: "Cần Thơ",
  },
  banhPia: {
    slug: "banh-pia-soc-trang",
    name: "Bánh pía Sóc Trăng",
    description:
      "Bánh nướng nhiều lớp với nhân đậu xanh, mỡ, trứng muối và sầu riêng, thường mua làm quà.",
    whereToEat: "Các lò bánh pía ở TP Sóc Trăng",
    province: "Cần Thơ",
  },
} satisfies Record<string, CuisineData>;

function pickDestinations(
  keys: Array<keyof typeof DESTINATIONS>,
): DestinationData[] {
  return keys.map((key) => DESTINATIONS[key]);
}

function pickCuisines(keys: Array<keyof typeof CUISINES>): CuisineData[] {
  return keys.map((key) => CUISINES[key]);
}

const arrivalPoint = "Trung tâm Quận 1 hoặc Bến xe Miền Tây";

const FOUR_DAY_DESTINATIONS = pickDestinations([
  "vinhTrang",
  "thoiSon",
  "caiRang",
  "binhThuy",
  "chuaDoi",
  "congTu",
  "dienGio",
  "uMinh",
  "muiCaMau",
  "cotCo",
]);

const THREE_DAY_DESTINATIONS = pickDestinations([
  "vinhTrang",
  "thoiSon",
  "caiRang",
  "binhThuy",
  "chuaDoi",
  "congTu",
  "dienGio",
  "muiCaMau",
  "cotCo",
]);

export const tourDetails: TourDetailData[] = [
  {
    code: "XMSN-4N3D",
    slug: "sai-gon-can-tho-u-minh-ha-dat-mui-4n3d",
    name: "Sài Gòn – Cần Thơ – U Minh Hạ – Đất Mũi (4N3Đ)",
    tagline: "Trọn vẹn miền Tây: chợ nổi, rừng tràm, cực Nam Tổ quốc",
    summary:
      "Tour chủ lực 4 ngày 3 đêm đi qua Sài Gòn – Mỹ Tho – Cần Thơ – Sóc Trăng – Bạc Liêu – U Minh Hạ – Đất Mũi.",
    description:
      "Hành trình dành cho khách muốn đi một lần trọn miền Tây Nam Bộ. Ngày 1 rời Sài Gòn về Mỹ Tho – Cần Thơ; ngày 2 đi chợ nổi Cái Răng, nhà cổ Bình Thủy, chùa Dơi Sóc Trăng và nhà công tử Bạc Liêu; ngày 3 vào rừng tràm U Minh Hạ bằng xuồng máy; ngày 4 ra Đất Mũi chạm mốc tọa độ quốc gia và cột cờ Hà Nội trước khi về lại Sài Gòn.",
    durationDays: 4,
    durationNights: 3,
    priceAdult: 4_190_000,
    priceChild: 2_930_000,
    childAgeNote:
      "Trẻ em 5–10 tuổi: 70% giá người lớn; dưới 5 tuổi miễn phí nhưng vẫn tính 1 chỗ ngồi.",
    highlights: [
      "Chợ nổi Cái Răng lúc 5–7 giờ sáng",
      "Xuồng máy xuyên rừng tràm U Minh Hạ, câu cá, ăn ong rừng",
      "Mốc tọa độ quốc gia và cột cờ Hà Nội tại Mũi Cà Mau",
      "Nhà công tử Bạc Liêu và cánh đồng quạt gió",
    ],
    includes: [
      "Xe du lịch đời mới có máy lạnh suốt tuyến",
      "3 đêm khách sạn 3 sao (2 khách/phòng)",
      "Các bữa ăn theo chương trình: 3 sáng, 4 trưa, 3 tối",
      "Vé tham quan, xuồng máy U Minh Hạ, cano/xe điện Đất Mũi",
      "Hướng dẫn viên tiếng Việt, bảo hiểm du lịch",
      "Nước uống, khăn lạnh hằng ngày",
    ],
    excludes: [
      "Chi phí cá nhân, đồ uống ngoài chương trình",
      "Phụ thu phòng đơn (nếu ở 1 mình), báo giá khi xác nhận",
      "Phụ thu lễ, Tết theo bảng giá của đơn vị lưu trú",
      "VAT nếu khách cần hóa đơn",
      "Tip cho hướng dẫn viên và tài xế (không bắt buộc)",
    ],
    cancellationPolicy:
      "Hủy miễn phí trước 3 ngày khởi hành. Sát ngày hơn, vui lòng liên hệ hotline để được hỗ trợ. Trường hợp bất khả kháng được bảo lưu hoặc hoàn theo thỏa thuận.",
    packingNotes:
      "Giày bám tốt hoặc dép quai hậu, áo chống nắng, mũ rộng vành, kem chống muỗi, thuốc say sóng, pin dự phòng. Nên mang áo mưa mỏng vì miền Tây mưa rào bất chợt.",
    coverImage: { src: IMG.xuongMay, alt: "Xuồng máy chạy trên kênh nước phù sa" },
    gallery: [
      { src: IMG.muiCaMau, alt: "Cột mốc Mũi Cà Mau với cờ đỏ sao vàng" },
      { src: IMG.gacKeo, alt: "Giàn ong gác kèo trong rừng tràm" },
      { src: IMG.gheRungDuoc, alt: "Đoàn khách mặc đồ bà ba trên ghe máy giữa rừng đước" },
      { src: IMG.loiKenh, alt: "Nhóm bạn trẻ ngâm mình dưới kênh rừng đước" },
    ],
    itineraryDays: [
      {
        dayNumber: 1,
        title: "Sài Gòn – Mỹ Tho – Cần Thơ",
        meals: {
          breakfast: "Tự túc",
          lunch: "Hủ tiếu Mỹ Tho",
          dinner: "Lẩu mắm Cần Thơ",
        },
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
        meals: {
          breakfast: "Hủ tiếu trên sông",
          lunch: "Bún nước lèo Sóc Trăng",
          dinner: "Hải sản Bạc Liêu",
        },
        hotel: "Khách sạn 3 sao tại Bạc Liêu",
        items: [
          {
            slot: "morning",
            title: "Chợ nổi Cái Răng lúc bình minh",
            content:
              "Khởi hành 5:15, lên tàu nhỏ len giữa các ghe trái cây, rau củ. Ăn sáng hủ tiếu/bún riêu ngay trên sông rồi ghé nhà cổ Bình Thủy.",
          },
          {
            slot: "afternoon",
            title: "Chùa Dơi Sóc Trăng",
            content:
              "Di chuyển 64 km (khoảng 1 giờ 15 phút) tới Sóc Trăng. Tham quan chùa Dơi (Mahatup) và tìm hiểu văn hóa Khmer Nam Bộ.",
          },
          {
            slot: "evening",
            title: "Nhà công tử Bạc Liêu – cánh đồng quạt gió",
            content:
              "Tiếp tục 50 km tới Bạc Liêu. Tham quan nhà công tử Bạc Liêu, ra cánh đồng điện gió ngắm hoàng hôn. Ăn tối hải sản, nghỉ đêm tại Bạc Liêu.",
          },
        ],
      },
      {
        dayNumber: 3,
        title: "Bạc Liêu – U Minh Hạ – Cà Mau",
        meals: {
          breakfast: "Tại khách sạn",
          lunch: "Cơm đồng quê U Minh",
          dinner: "Lẩu mắm U Minh",
        },
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
        meals: {
          breakfast: "Tại khách sạn",
          lunch: "Hải sản Đất Mũi",
          dinner: "Tự túc trên đường về",
        },
        hotel: null,
        items: [
          {
            slot: "morning",
            title: "Mốc tọa độ quốc gia – cột cờ Hà Nội",
            content:
              "Đi khoảng 100 km ra Đất Mũi. Tham quan mốc tọa độ quốc gia, cột cờ Hà Nội, đi bộ xuyên rừng đước hoặc thuê cano ra bãi bồi.",
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
    destinations: FOUR_DAY_DESTINATIONS,
    cuisines: pickCuisines([
      "lauMam",
      "cua",
      "baKhia",
      "vop",
      "banhXeo",
      "bunNuocLeo",
      "banhPia",
    ]),
    departures: [
      {
        id: 4101,
        date: "2026-11-07",
        seatsRemaining: 24,
        priceAdult: 4_190_000,
        priceChild: 2_930_000,
        holidaySurcharge: 0,
        meetingPoint: arrivalPoint,
      },
      {
        id: 4102,
        date: "2026-11-14",
        seatsRemaining: 24,
        priceAdult: 4_190_000,
        priceChild: 2_930_000,
        holidaySurcharge: 0,
        meetingPoint: arrivalPoint,
      },
      {
        id: 4103,
        date: "2026-11-21",
        seatsRemaining: 24,
        priceAdult: 4_190_000,
        priceChild: 2_930_000,
        holidaySurcharge: 0,
        meetingPoint: arrivalPoint,
      },
    ],
  },
  {
    code: "XMSN-3N2D",
    slug: "sai-gon-can-tho-dat-mui-3n2d",
    name: "Sài Gòn – Cần Thơ – Đất Mũi (3N2Đ)",
    tagline: "Bản gọn của hành trình, vẫn đủ chợ nổi và cực Nam",
    summary:
      "3 ngày 2 đêm cho khách có ít thời gian: chợ nổi Cái Răng, Sóc Trăng, Bạc Liêu và Đất Mũi.",
    description:
      "Tour 3N2Đ lược bớt chặng U Minh Hạ để phù hợp khách gia đình hoặc khách đi cuối tuần. Ngày 1 Sài Gòn – Mỹ Tho – Cần Thơ; ngày 2 chợ nổi Cái Răng – Sóc Trăng – Bạc Liêu – Cà Mau; ngày 3 Đất Mũi rồi về Sài Gòn.",
    durationDays: 3,
    durationNights: 2,
    priceAdult: 3_190_000,
    priceChild: 2_230_000,
    childAgeNote:
      "Trẻ em 5–10 tuổi: 70% giá người lớn; dưới 5 tuổi miễn phí nhưng vẫn tính 1 chỗ ngồi.",
    highlights: [
      "Chợ nổi Cái Răng",
      "Chùa Dơi và nhà công tử Bạc Liêu",
      "Mốc tọa độ quốc gia và cột cờ Hà Nội",
    ],
    includes: [
      "Xe du lịch máy lạnh",
      "2 đêm khách sạn 3 sao",
      "Các bữa ăn theo chương trình",
      "Vé tham quan, tàu chợ nổi, xe điện Đất Mũi",
      "Hướng dẫn viên, bảo hiểm du lịch",
    ],
    excludes: [
      "Chi phí cá nhân",
      "Phụ thu phòng đơn, báo giá khi xác nhận",
      "Phụ thu lễ Tết",
      "VAT nếu cần hóa đơn",
      "Tip cho hướng dẫn viên và tài xế (không bắt buộc)",
    ],
    cancellationPolicy:
      "Hủy miễn phí trước 3 ngày khởi hành. Sát ngày hơn, vui lòng liên hệ hotline để được hỗ trợ.",
    packingNotes:
      "Áo chống nắng, mũ, kem chống muỗi, thuốc say sóng, giày bám tốt. Mang theo áo mưa mỏng.",
    coverImage: { src: IMG.gheHang, alt: "Ghe chở hàng trên kênh rộng ven rặng dừa nước" },
    gallery: [
      { src: IMG.tuongMe, alt: "Tượng đài Mẹ tại khu du lịch Mũi Cà Mau" },
      { src: IMG.hoangHon, alt: "Đoàn khách trên ghe máy lúc hoàng hôn" },
      { src: IMG.cotCo, alt: "Tượng cua biển và cột cờ trong khu du lịch Mũi Cà Mau" },
    ],
    itineraryDays: [
      {
        dayNumber: 1,
        title: "Sài Gòn – Mỹ Tho – Cần Thơ",
        meals: {
          breakfast: "Tự túc",
          lunch: "Đặc sản Mỹ Tho",
          dinner: "Lẩu mắm Cần Thơ",
        },
        hotel: "Khách sạn 3 sao tại Cần Thơ",
        items: [
          {
            slot: "morning",
            title: "Khởi hành về Mỹ Tho",
            content: "Đón khách 6:00, đi cao tốc Trung Lương 72 km.",
          },
          {
            slot: "afternoon",
            title: "Chùa Vĩnh Tràng – cồn Lân",
            content: "Tham quan chùa và cù lao Thới Sơn, nghe đờn ca tài tử.",
          },
          {
            slot: "evening",
            title: "Cần Thơ về đêm",
            content: "Nhận phòng, ăn tối, dạo bến Ninh Kiều.",
          },
        ],
      },
      {
        dayNumber: 2,
        title: "Cần Thơ – Sóc Trăng – Bạc Liêu – Cà Mau",
        meals: {
          breakfast: "Hủ tiếu trên sông",
          lunch: "Bún nước lèo",
          dinner: "Hải sản Cà Mau",
        },
        hotel: "Khách sạn 3 sao tại TP Cà Mau",
        items: [
          {
            slot: "morning",
            title: "Chợ nổi Cái Răng",
            content: "Đi tàu từ 5:15, ăn sáng trên sông, ghé nhà cổ Bình Thủy.",
          },
          {
            slot: "afternoon",
            title: "Chùa Dơi – nhà công tử Bạc Liêu",
            content: "64 km tới Sóc Trăng, sau đó 50 km tới Bạc Liêu.",
          },
          {
            slot: "evening",
            title: "Điện gió Bạc Liêu – Cà Mau",
            content: "Ngắm hoàng hôn ở cánh đồng quạt gió, ăn tối và về Cà Mau nghỉ.",
          },
        ],
      },
      {
        dayNumber: 3,
        title: "Đất Mũi – Sài Gòn",
        meals: {
          breakfast: "Tại khách sạn",
          lunch: "Hải sản Đất Mũi",
          dinner: "Tự túc",
        },
        hotel: null,
        items: [
          {
            slot: "morning",
            title: "Mốc tọa độ – cột cờ Hà Nội",
            content:
              "100 km ra Đất Mũi, tham quan mốc tọa độ, cột cờ và rừng đước.",
          },
          {
            slot: "afternoon",
            title: "Ăn trưa và về Sài Gòn",
            content: "Ăn hải sản, khởi hành về TP.HCM.",
          },
          {
            slot: "evening",
            title: "Kết thúc tour",
            content: "Dự kiến về TP.HCM 20:00–21:00.",
          },
        ],
      },
    ],
    destinations: THREE_DAY_DESTINATIONS,
    cuisines: pickCuisines([
      "cua",
      "vop",
      "banhXeo",
      "bunNuocLeo",
      "banhPia",
    ]),
    departures: [
      {
        id: 3201,
        date: "2026-11-13",
        seatsRemaining: 20,
        priceAdult: 3_190_000,
        priceChild: 2_230_000,
        holidaySurcharge: 0,
        meetingPoint: arrivalPoint,
      },
      {
        id: 3202,
        date: "2026-11-20",
        seatsRemaining: 20,
        priceAdult: 3_190_000,
        priceChild: 2_230_000,
        holidaySurcharge: 0,
        meetingPoint: arrivalPoint,
      },
      {
        id: 3203,
        date: "2026-11-27",
        seatsRemaining: 20,
        priceAdult: 3_190_000,
        priceChild: 2_230_000,
        holidaySurcharge: 0,
        meetingPoint: arrivalPoint,
      },
    ],
  },
  {
    code: "XMSN-2N1D",
    slug: "trai-nghiem-u-minh-ha-2n1d",
    name: "Trải nghiệm U Minh Hạ (2N1Đ)",
    tagline: "Một đêm giữa rừng tràm, xuồng, cá đồng và mật ong rừng",
    summary:
      "Tour ngắn tập trung vào rừng tràm U Minh Hạ: xuồng máy xuyên kênh, câu cá, ăn ong rừng, ngủ homestay trong rừng.",
    description:
      "Tour 2N1Đ dành riêng cho U Minh Hạ. Ngày 1 từ Sài Gòn về Cà Mau rồi vào rừng, đi xuồng, câu cá, ăn tối trong rừng và nghỉ homestay. Ngày 2 tiếp tục đi kênh nhỏ, thử mật ong rừng, ăn trưa với cá đồng rồi về lại Sài Gòn.",
    durationDays: 2,
    durationNights: 1,
    priceAdult: 1_890_000,
    priceChild: 1_320_000,
    childAgeNote:
      "Trẻ em 5–10 tuổi: 70% giá người lớn; dưới 5 tuổi miễn phí nhưng vẫn tính 1 chỗ ngồi.",
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
    excludes: [
      "Đồ uống",
      "Chi phí cá nhân",
      "Phụ thu lễ Tết",
      "Tip cho hướng dẫn viên và tài xế (không bắt buộc)",
    ],
    cancellationPolicy:
      "Hủy miễn phí trước 3 ngày khởi hành. Sát ngày hơn, vui lòng liên hệ hotline để được hỗ trợ.",
    packingNotes:
      "Quần áo dài tay, kem chống muỗi, đèn pin, dép quai hậu, thuốc dị ứng. Rừng tràm ẩm và nhiều muỗi vào chiều tối.",
    coverImage: { src: IMG.nhaSan, alt: "Xuồng gỗ đậu bên nhà sàn giữa ao bèo" },
    gallery: [
      { src: IMG.uMinh, alt: "Kênh rừng tràm nhìn từ mũi ghe" },
      { src: IMG.kenhNho, alt: "Kênh nhỏ in bóng cây" },
      { src: IMG.ongCanh, alt: "Đàn ong mật bám trên cành" },
    ],
    itineraryDays: [
      {
        dayNumber: 1,
        title: "Sài Gòn – U Minh Hạ",
        meals: {
          breakfast: "Tự túc",
          lunch: "Cơm đồng quê",
          dinner: "Lẩu mắm U Minh",
        },
        hotel: "Homestay trong Vườn quốc gia U Minh Hạ",
        items: [
          {
            slot: "morning",
            title: "Khởi hành đi Cà Mau",
            content: "Đón khách 5:30, đi khoảng 6 giờ theo QL1A.",
          },
          {
            slot: "afternoon",
            title: "Vào rừng tràm",
            content:
              "Tới U Minh Hạ, nhận phòng homestay, lên xuồng máy xuyên kênh tràm.",
          },
          {
            slot: "evening",
            title: "Đêm trong rừng",
            content:
              "Câu cá, ăn tối lẩu mắm, nghe kể chuyện gác kèo ong, ngắm đom đóm.",
          },
        ],
      },
      {
        dayNumber: 2,
        title: "U Minh Hạ – Sài Gòn",
        meals: {
          breakfast: "Tại homestay",
          lunch: "Cá đồng nướng",
          dinner: "Tự túc",
        },
        hotel: null,
        items: [
          {
            slot: "morning",
            title: "Kênh nhỏ và mật ong rừng",
            content:
              "Đi xuồng kênh nhỏ, thử mật ong rừng, chụp ảnh dưới tán tràm.",
          },
          {
            slot: "afternoon",
            title: "Về TP Cà Mau",
            content: "Ăn trưa với cá đồng, ghé chợ Cà Mau mua đặc sản.",
          },
          {
            slot: "evening",
            title: "Về Sài Gòn",
            content: "Khởi hành về TP.HCM, dự kiến 20:00.",
          },
        ],
      },
    ],
    destinations: pickDestinations(["uMinh"]),
    cuisines: pickCuisines(["lauMam", "cua", "baKhia"]),
    departures: [
      {
        id: 2101,
        date: "2026-11-14",
        seatsRemaining: 16,
        priceAdult: 1_890_000,
        priceChild: 1_320_000,
        holidaySurcharge: 0,
        meetingPoint: arrivalPoint,
      },
      {
        id: 2102,
        date: "2026-11-28",
        seatsRemaining: 16,
        priceAdult: 1_890_000,
        priceChild: 1_320_000,
        holidaySurcharge: 0,
        meetingPoint: arrivalPoint,
      },
      {
        id: 2103,
        date: "2026-12-12",
        seatsRemaining: 16,
        priceAdult: 1_890_000,
        priceChild: 1_320_000,
        holidaySurcharge: 0,
        meetingPoint: arrivalPoint,
      },
    ],
  },
];

export function getTourDetailBySlug(slug: string) {
  return tourDetails.find((tour) => tour.slug === slug);
}
