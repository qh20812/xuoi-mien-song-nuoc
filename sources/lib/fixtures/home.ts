import type { HomePageData } from "@/lib/contracts/home";

const IMG = {
  // Điểm đến — ảnh tải từ Wikimedia Commons (nguồn & giấy phép: public/images/CREDITS.md)
  vinhTrang: "/images/chua-vinh-trang.webp",
  thoiSon: "/images/cu-lao-thoi-son.webp",
  caiRang: "/images/cho-noi-cai-rang.webp",
  binhThuy: "/images/nha-co-binh-thuy.webp",
  chuaDoi: "/images/chua-doi-soc-trang.webp",
  congTu: "/images/nha-cong-tu-bac-lieu.webp",
  dienGio: "/images/canh-dong-dien-gio-bac-lieu.webp",
  // Điểm đến — ảnh chụp trong chuyến Cà Mau – Đất Mũi
  uMinh: "/images/65-mui-ghe-dtc-kenh-rung-tram.webp",
  muiCaMau: "/images/50-cot-moc-mui-ca-mau-co-do.webp",
  cotCo: "/images/69-tuong-cua-bien-ca-mau.webp",
  tacSay: "/images/nha-tho-tac-say.webp",
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
  destinations: [
    {
      slug: "vuon-quoc-gia-u-minh-ha",
      name: "Vườn quốc gia U Minh Hạ",
      province: "Cà Mau",
      shortDescription:
        "Dòng kênh nhuộm màu tràm và hệ sinh thái đất ngập nước quý giá, nơi những tổ ong gác kèo treo dưới tán rừng.",
      image: { src: IMG.uMinh, alt: "Kênh rừng tràm nhìn từ mũi ghe" },
    },
    {
      slug: "mui-ca-mau",
      name: "Mũi Cà Mau",
      province: "Ngọc Hiển · Cà Mau",
      shortDescription:
        "Nơi cuối trời phương Nam với mốc tọa độ quốc gia, cột cờ Hà Nội và rừng đước giữ chặt bãi triều.",
      image: { src: IMG.muiCaMau, alt: "Cột mốc Mũi Cà Mau với cờ đỏ sao vàng" },
    },
    {
      slug: "cho-noi-cai-rang",
      name: "Chợ nổi Cái Răng",
      province: "Cần Thơ",
      shortDescription:
        "Nếp sinh hoạt thương hồ trăm năm trên ngã ba sông, họp từ sáng sớm với ghe trái cây và rau củ.",
      image: { src: IMG.caiRang, alt: "Ghe bán trái cây và đồ uống trên chợ nổi Cái Răng" },
    },
    {
      slug: "canh-dong-dien-gio-bac-lieu",
      name: "Cánh đồng quạt gió Bạc Liêu",
      province: "Bạc Liêu",
      shortDescription:
        "Những trụ tuabin ven biển đứng giữa bãi bồi, nổi bật nhất vào cuối ngày khi nắng đổ xuống cánh đồng.",
      image: { src: IMG.dienGio, alt: "Các trụ tuabin điện gió trên bãi bồi Bạc Liêu" },
    },
  ],
  cuisines: [
    {
      slug: "lau-mam-u-minh",
      name: "Lẩu mắm U Minh",
      description:
        "Mắm cá linh, cá sặc rằn nấu cùng nước dừa, ăn kèm cá đồng, tôm, rau đồng và bún.",
      whereToEat: "Homestay và quán ăn trong Vườn quốc gia U Minh Hạ",
      province: "Cà Mau",
    },
    {
      slug: "cua-ca-mau",
      name: "Cua Cà Mau",
      description:
        "Cua biển Năm Căn chắc thịt, ngọt tự nhiên, thường hấp bia hoặc nấu lẩu.",
      whereToEat: "Năm Căn, Đất Mũi, chợ cua Cà Mau",
      province: "Cà Mau",
    },
    {
      slug: "banh-xeo-mien-tay",
      name: "Bánh xèo miền Tây",
      description:
        "Vỏ giòn từ bột gạo nghệ, nhân tôm thịt và giá đỗ, cuốn cùng rau rừng và nước mắm chua ngọt.",
      whereToEat: "Cần Thơ, Bạc Liêu, Cà Mau",
      province: "Cần Thơ",
    },
    {
      slug: "bun-nuoc-leo-soc-trang",
      name: "Bún nước lèo Sóc Trăng",
      description:
        "Nước dùng nấu từ mắm bò hóc, cá lóc và tôm khô, ăn cùng bún, rau sống và chả cá.",
      whereToEat: "TP Sóc Trăng",
      province: "Cần Thơ",
    },
  ],
  faqs: [
    {
      question: "Quy trình giữ chỗ và đặt cọc diễn ra như thế nào?",
      answer:
        "Bạn điền thông tin liên hệ và chọn chuyến mong muốn; website chưa thu tiền online. Trong thời gian giữ chỗ 24 giờ, nhân viên sẽ gọi hoặc nhắn Zalo để xác nhận và hướng dẫn đặt cọc. Đơn được xác nhận sau khi hoàn tất bước này.",
    },
    {
      question: "Trẻ em mấy tuổi được miễn phí?",
      answer:
        "Trẻ dưới 5 tuổi được miễn phí và vẫn được xếp một chỗ ngồi riêng. Khi đặt, bạn ghi rõ nhu cầu ăn uống và ngủ nghỉ của bé để được tư vấn.",
    },
    {
      question: "Có thể hủy hoặc dời lịch không?",
      answer:
        "Bạn có thể tự hủy trước 3 ngày khởi hành hoặc liên hệ hotline nếu sát ngày. Việc dời lịch được hỗ trợ miễn phí; nhân viên sẽ kiểm tra chỗ trống và hướng dẫn thủ tục.",
    },
    {
      question: "Đón khách ở đâu?",
      answer:
        "Khách được đón tại trung tâm Quận 1 hoặc Bến xe Miền Tây. Điểm đón cụ thể sẽ được xác nhận qua điện thoại/Zalo trước ngày khởi hành.",
    },
  ],
};
