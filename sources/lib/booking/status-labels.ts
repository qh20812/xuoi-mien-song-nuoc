/**
 * Nhãn trạng thái đơn — nguồn duy nhất cho admin và API công khai.
 * Hàm thuần, không phụ thuộc Prisma hay React.
 */

export const ORDER_STATUSES = [
  "new",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "expired",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Chờ xác nhận",
  pending: "Đang liên hệ",
  confirmed: "Đã xác nhận",
  completed: "Đã hoàn thành",
  cancelled: "Đã huỷ",
  expired: "Hết hạn giữ chỗ",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

/** Trả nhãn tiếng Việt; giá trị lạ rơi về nguyên văn để không che lỗi dữ liệu. */
export function statusLabel(status: string): string {
  return isOrderStatus(status) ? ORDER_STATUS_LABELS[status] : status;
}
