import type { HomePageData } from "@/lib/contracts/home";

const IMG = {
  // Ảnh bìa tour
  tour4n3d: "/images/23-xuong-may-tren-kenh-phu-sa.webp",
  tour3n2d: "/images/21-ghe-cho-hang-tren-kenh-2.webp",
  tour2n1d: "/images/62-xuong-go-ben-nha-san-beo.webp",
};

// Ngày chỉ dùng cho fixture frontend; backend sẽ thay bằng departure thật.
export const homePageData: HomePageData = {
  tours: [
    {
      code: "XMSN-4N3D",
      slug: "sai-gon-can-tho-u-minh-ha-dat-mui-4n3d",
      name: "Sài Gòn – Cần Thơ – U Minh Hạ – Đất Mũi (4N3Đ)",
      summary:
        "Hành trình trọn miền Tây qua chợ nổi Cái Răng, rừng tràm U Minh Hạ và mốc tọa độ cực Nam Tổ quốc.",
      durationDays: 4,
      durationNights: 3,
      priceFrom: 4_190_000,
      image: { src: IMG.tour4n3d, alt: "Xuồng máy chạy trên kênh nước phù sa" },
      nextDeparture: { date: "2026-11-07", seatsRemaining: 24 },
      highlights: ["Xuồng máy xuyên rừng tràm", "Khách sạn 3 sao & xe máy lạnh"],
    },
    {
      code: "XMSN-3N2D",
      slug: "sai-gon-can-tho-dat-mui-3n2d",
      name: "Sài Gòn – Cần Thơ – Đất Mũi (3N2Đ)",
      summary:
        "Bản gọn cho những ngày cuối tuần dài: chợ nổi Cái Răng, Chùa Dơi, Bạc Liêu và mốc tọa độ Đất Mũi.",
      durationDays: 3,
      durationNights: 2,
      priceFrom: 3_190_000,
      image: { src: IMG.tour3n2d, alt: "Ghe chở hàng trên kênh rộng ven rặng dừa nước" },
      nextDeparture: { date: "2026-11-13", seatsRemaining: 20 },
      highlights: ["Chợ nổi Cái Răng", "Chùa Dơi & nhà công tử Bạc Liêu"],
    },
    {
      code: "XMSN-2N1D",
      slug: "trai-nghiem-u-minh-ha-2n1d",
      name: "Trải nghiệm U Minh Hạ (2N1Đ)",
      summary:
        "Một đêm giữa rừng tràm: đi xuồng kênh nhỏ, câu cá, thử mật ong rừng và nghỉ homestay.",
      durationDays: 2,
      durationNights: 1,
      priceFrom: 1_890_000,
      image: { src: IMG.tour2n1d, alt: "Xuồng gỗ đậu bên nhà sàn giữa ao bèo" },
      nextDeparture: { date: "2026-11-14", seatsRemaining: 16 },
      highlights: ["Homestay trong rừng", "Xuồng máy & ăn ong rừng"],
    },
  ],
  journey: [
    {
      sortOrder: 1,
      fromPlace: "Sài Gòn",
      toPlace: "Mỹ Tho",
      title: "Rời phố thị, chạm sông Tiền",
      description:
        "Khởi hành từ trung tâm TP.HCM, theo cao tốc Trung Lương về Mỹ Tho. Ghé chùa Vĩnh Tràng và cù lao Thới Sơn trước khi tiếp tục xuôi về Cần Thơ.",
      durationText: "khoảng 1 giờ 30 phút",
      distanceKm: 72,
      foodNote: "Hủ tiếu Mỹ Tho, trái cây miệt vườn ở cồn Lân",
    },
    {
      sortOrder: 2,
      fromPlace: "Mỹ Tho",
      toPlace: "Cần Thơ",
      title: "Qua những vườn dừa, về Tây Đô",
      description:
        "Tiếp tục theo QL1A qua Vĩnh Long. Chiều đến nhận phòng, dạo bến Ninh Kiều và chợ đêm Cần Thơ.",
      durationText: "khoảng 2 giờ",
      distanceKm: 109,
      foodNote: "Lẩu mắm, bánh xèo, nem nướng Cần Thơ",
    },
    {
      sortOrder: 3,
      fromPlace: "Cần Thơ",
      toPlace: "Sóc Trăng",
      title: "Sang miền đất chùa Khmer",
      description:
        "Sáng sớm đi chợ nổi Cái Răng, sau đó theo QL1A về Sóc Trăng. Tham quan chùa Dơi và tìm hiểu văn hóa Khmer Nam Bộ.",
      durationText: "khoảng 1 giờ 15 phút",
      distanceKm: 64,
      foodNote: "Bún nước lèo, bánh pía, bánh cống Sóc Trăng",
    },
    {
      sortOrder: 4,
      fromPlace: "Sóc Trăng",
      toPlace: "Bạc Liêu",
      title: "Đất của công tử và điện gió",
      description:
        "Ghé nhà công tử Bạc Liêu, sau đó ra cánh đồng quạt gió ngắm hoàng hôn trên bãi bồi.",
      durationText: "khoảng 1 giờ",
      distanceKm: 50,
      foodNote: "Ba khía, bánh xèo, nem nướng Bạc Liêu",
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
    },
    {
      sortOrder: 6,
      fromPlace: "U Minh Hạ",
      toPlace: "Đất Mũi",
      title: "Tới cực Nam Tổ quốc",
      description:
        "Chặng dài nhất: về TP Cà Mau rồi theo đường Năm Căn ra Đất Mũi. Kết thúc bằng mốc tọa độ quốc gia, cột cờ Hà Nội và rừng đước.",
      durationText: "khoảng 2 giờ 30 phút",
      distanceKm: 136,
      foodNote: "Cua Cà Mau, vọp nướng, ba khía muối",
    },
  ],
};