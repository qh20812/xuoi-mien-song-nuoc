/**
 * Nhãn tiếng Việt cho nhật ký thao tác quản trị.
 *
 * Hàm thuần — không Prisma, không React — dùng được ở server component và unit test.
 * Giá trị lạ rơi về nguyên văn để không che dữ liệu cũ/chưa khai báo.
 */

export const AUDIT_ENTITY_LABELS = {
  order: "Đơn hàng",
  contact_message: "Hộp thư",
  tour: "Tour",
  tour_departure: "Chuyến khởi hành",
  destination: "Điểm đến",
  cuisine: "Món ăn",
  post: "Bài viết",
  faq: "FAQ",
  review: "Đánh giá",
  media: "Thư viện ảnh",
  admin_user: "Người dùng",
  setting: "Cấu hình",
} as const;

export type AuditEntityValue = keyof typeof AUDIT_ENTITY_LABELS;

export const AUDIT_ENTITY_OPTIONS = (
  Object.keys(AUDIT_ENTITY_LABELS) as AuditEntityValue[]
).map((value) => ({ value, label: AUDIT_ENTITY_LABELS[value] }));

export function isAuditEntity(value: unknown): value is AuditEntityValue {
  return typeof value === "string" && value in AUDIT_ENTITY_LABELS;
}

export function auditEntityLabel(entity: string): string {
  const label = (AUDIT_ENTITY_LABELS as Record<string, string>)[entity];
  return label ?? entity;
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "order.pending": "Chuyển sang đã liên hệ",
  "order.confirm": "Xác nhận đơn",
  "order.complete": "Hoàn thành đơn",
  "order.cancel": "Huỷ đơn",
  "order.note": "Cập nhật ghi chú",
  "order.assign": "Phân công đơn",

  "contact.status": "Đổi trạng thái tin",
  "contact.delete": "Xoá tin liên hệ",

  "tour.update": "Sửa nội dung tour",
  "tour.status": "Đổi trạng thái tour",

  "departure.create": "Thêm chuyến khởi hành",
  "departure.update": "Sửa chuyến khởi hành",
  "departure.status": "Đổi trạng thái chuyến",
  "departure.delete": "Xoá chuyến khởi hành",

  "destination.create": "Thêm điểm đến",
  "destination.update": "Sửa điểm đến",
  "destination.delete": "Xoá điểm đến",

  "cuisine.create": "Thêm món ăn",
  "cuisine.update": "Sửa món ăn",
  "cuisine.delete": "Xoá món ăn",

  "post.create": "Thêm bài viết",
  "post.update": "Sửa bài viết",
  "post.delete": "Xoá bài viết",

  "faq.create": "Thêm FAQ",
  "faq.update": "Sửa FAQ",
  "faq.delete": "Xoá FAQ",

  "review.status": "Đổi trạng thái đánh giá",
  "review.featured": "Bật/tắt nổi bật",
  "review.reply": "Phản hồi đánh giá",
  "review.delete": "Xoá đánh giá",

  "media.create": "Thêm media",
  "media.upload": "Tải ảnh lên",
  "media.update": "Sửa media",
  "media.delete": "Xoá media",

  "admin.create": "Tạo tài khoản",
  "admin.update": "Sửa tài khoản",
  "admin.password": "Đặt lại mật khẩu",
  "admin.password_self": "Tự đổi mật khẩu",
  "admin.delete": "Xoá tài khoản",

  "settings.booking.update": "Cập nhật cấu hình đặt tour",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}
