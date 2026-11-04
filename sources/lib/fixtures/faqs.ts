export type FaqRecord = {
  question: string;
  answer: string;
  category: "transport" | "booking" | "safety" | "weather";
  sortOrder: number;
};

export const faqs: FaqRecord[] = [
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
      "Trẻ dưới 5 tuổi được miễn phí và vẫn được xếp một chỗ ngồi riêng. Trẻ 5–10 tuổi tính 70% giá người lớn; từ 11 tuổi tính như người lớn.",
    category: "booking",
    sortOrder: 2,
  },
  {
    question: "Đi U Minh Hạ có nguy hiểm cho trẻ nhỏ không?",
    answer:
      "Đường xuồng an toàn nếu trẻ mặc áo phao do đơn vị cung cấp và ngồi yên. Rừng ẩm và nhiều muỗi, nên cân nhắc với trẻ dưới 3 tuổi hoặc trẻ dễ say sóng.",
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
      "Mùa khô (tháng 12–4) dễ chịu nhất. Mùa nước nổi (tháng 9–11) đẹp và nhiều cá nhưng có mưa rào. Mùa mưa (tháng 5–8) vắng khách hơn.",
    category: "weather",
    sortOrder: 5,
  },
  {
    question: "Đặt tour có cần thanh toán trước không?",
    answer:
      "Không thu tiền trực tuyến. Website giữ chỗ trong 24 giờ; sau khi gửi đơn, nhân viên gọi hoặc nhắn Zalo để xác nhận và hướng dẫn đặt cọc theo thỏa thuận.",
    category: "booking",
    sortOrder: 6,
  },
  {
    question: "Có thể hủy đơn đã đặt không?",
    answer:
      "Có. Bạn có thể tự hủy trước 3 ngày khởi hành qua trang tra cứu đơn. Sát ngày hơn, vui lòng liên hệ hotline. Tiền cọc được xử lý theo chính sách hoàn cọc.",
    category: "booking",
    sortOrder: 7,
  },
  {
    question: "Tour có phụ thu lễ, Tết không?",
    answer:
      "Có. Các ngày lễ lớn và Tết Nguyên đán có thể phụ thu do giá khách sạn và dịch vụ tăng. Mức phụ thu được thông báo trước khi xác nhận đơn.",
    category: "booking",
    sortOrder: 8,
  },
];
