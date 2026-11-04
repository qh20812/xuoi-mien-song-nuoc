import type { PublicOrder } from "@/lib/contracts/order";
import { addDaysToDateString, todayVN } from "@/lib/time";

const MOCK_CODE = "XMSN-2026-0001";
const MOCK_PHONE = "0918345678";
let mockCancelled = false;

export function createMockOrder(): PublicOrder {
  const now = Date.now();
  const today = todayVN();
  const departureDate = addDaysToDateString(today, 7);
  const returnDate = addDaysToDateString(today, 10);
  const deadline = addDaysToDateString(today, 4);
  const cancelled = mockCancelled;

  return {
    code: MOCK_CODE,
    status: cancelled ? "cancelled" : "new",
    statusLabel: cancelled ? "Đã huỷ" : "Chờ xác nhận",
    contactName: "Nguyễn Hoàng Nam",
    phoneMasked: "0918***678",
    email: "hoangnam@example.com",
    pickupPoint: "Trung tâm Quận 1",
    customerNote: "Một người lớn ăn kiêng đồ cay.",
    guests: {
      adults: 2,
      children: 1,
      infants: 0,
      seats: 3,
    },
    pricing: {
      currency: "VND",
      unitPriceAdult: 4_190_000,
      unitPriceChild: 2_930_000,
      surcharge: 0,
      totalAmount: 11_310_000,
    },
    tour: {
      code: "XMSN-4N3D",
      name: "Sài Gòn – Cần Thơ – U Minh Hạ – Đất Mũi (4N3Đ)",
      slug: "sai-gon-can-tho-u-minh-ha-dat-mui-4n3d",
      durationDays: 4,
      durationNights: 3,
      coverImageUrl:
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Chu%E1%BB%91i_t%E1%BA%A1i_r%E1%BB%ABng_U_Minh_h%E1%BA%A1.jpg/1920px-Chu%E1%BB%91i_t%E1%BA%A1i_r%E1%BB%ABng_U_Minh_h%E1%BA%A1.jpg",
    },
    departure: {
      date: departureDate,
      returnDate,
      meetingPoint: "Trung tâm Quận 1 hoặc Bến xe Miền Tây",
    },
    passengers: [
      {
        fullName: "Nguyễn Hoàng Nam",
        type: "adult",
        typeLabel: "Người lớn",
        birthYear: 1985,
        note: null,
      },
      {
        fullName: "Lê Thị Thu Thảo",
        type: "adult",
        typeLabel: "Người lớn",
        birthYear: 1988,
        note: null,
      },
      {
        fullName: "Nguyễn Minh Khang",
        type: "child",
        typeLabel: "Trẻ em",
        birthYear: 2018,
        note: null,
      },
    ],
    cancellation: {
      cutoffDays: 3,
      deadline,
      canCancel: !cancelled,
      policy:
        "Hủy miễn phí trước 3 ngày khởi hành. Sát ngày hơn, vui lòng liên hệ hotline để được hỗ trợ.",
      note: cancelled
        ? "Đơn đã được huỷ."
        : `Có thể tự huỷ đến hết ngày ${deadline}.`,
    },
    holdExpiresAt: cancelled ? null : new Date(now + 23 * 3_600_000).toISOString(),
    createdAt: new Date(now - 2 * 3_600_000).toISOString(),
    confirmedAt: null,
    cancelledAt: cancelled ? new Date(now).toISOString() : null,
    cancelReason: cancelled ? "Thay đổi kế hoạch cá nhân" : null,
    ...(cancelled ? { alreadyCancelled: true } : {}),
  };
}

export function mockOrderCredentials() {
  return { code: MOCK_CODE, phone: MOCK_PHONE };
}

export function setMockCancelled(value: boolean) {
  mockCancelled = value;
}
