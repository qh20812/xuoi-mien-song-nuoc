/**
 * Chuyển `meta` JSON của nhật ký thao tác thành các dòng dễ đọc (D10.5).
 *
 * Hàm thuần — không Prisma, không React — dùng được ở server component và unit test.
 * Nguyên tắc: **không bỏ dữ liệu**. Khoá lạ vẫn hiện với key gốc, giá trị phức tạp
 * được tóm tắt; JSON đầy đủ luôn còn sau nút "JSON gốc" ở component.
 */
import { ORDER_STATUS_LABELS } from "@/lib/booking/status-labels";
import { formatDateVN, formatVndDisplay } from "@/lib/format";
import { isManagedImageUrl } from "@/lib/media/image-url";

export type AuditMetaEntry =
  | { kind: "text"; label: string; value: string; mono?: boolean }
  | { kind: "image"; label: string; url: string }
  | { kind: "change"; label: string; from: string; to: string };

export type FormatAuditMetaInput = {
  entity: string;
  action: string;
  meta: unknown;
};

const SETTINGS_ACTION = "settings.booking.update";

const KEY_LABELS: Record<string, string> = {
  slug: "Đường dẫn",
  name: "Tên",
  title: "Tiêu đề",
  question: "Câu hỏi",
  authorName: "Tên khách",
  email: "Email",
  role: "Vai trò",
  status: "Trạng thái",
  type: "Loại",
  url: "Đường dẫn ảnh",
  coverImageUrl: "Ảnh bìa",
  thumbnailUrl: "Ảnh thu nhỏ",
  publicId: "Cloudinary ID",
  width: "Rộng",
  height: "Cao",
  tags: "Thẻ",
  tourIds: "Tour áp dụng",
  tourSlug: "Tour",
  departureDate: "Ngày khởi hành",
  capacityTotal: "Sức chứa",
  previousCapacityTotal: "Sức chứa trước",
  placement: "Vị trí",
  isActive: "Đang hiển thị",
  isFeatured: "Nổi bật",
  hasReply: "Phản hồi",
  note: "Ghi chú",
  reason: "Lý do",
  basePriceAdult: "Giá người lớn",
  preservedKeys: "Khoá giữ nguyên",
};

const SETTINGS_KEY_LABELS: Record<string, string> = {
  holdHours: "Giữ chỗ (giờ)",
  cancelCutoffDays: "Chặn huỷ trước (ngày)",
  maxGuestsPerOrder: "Khách tối đa mỗi đơn",
  minDaysAhead: "Đặt trước tối thiểu (ngày)",
  cancellationPolicy: "Chính sách huỷ",
};

const MONO_KEYS = new Set(["slug", "publicId", "tourSlug"]);

const PRICE_KEYS = new Set([
  "basePriceAdult",
  "unitPriceAdult",
  "unitPriceChild",
  "totalAmount",
  "surcharge",
  "amount",
  "price",
]);

const SENSITIVE_KEY = /^(password|passwordhash|newpassword|token|secret)$/i;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const PLACEMENT_LABELS: Record<string, string> = {
  home: "Trang chủ",
  contact: "Trang liên hệ",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị",
  editor: "Biên tập",
};

const MEDIA_TYPE_LABELS: Record<string, string> = {
  image: "Ảnh",
};

/** Nhãn trạng thái theo từng entity — `new` của đơn khác `new` của hộp thư. */
const STATUS_LABELS_BY_ENTITY: Record<string, Record<string, string>> = {
  order: ORDER_STATUS_LABELS,
  tour: { draft: "Nháp", published: "Đang bán", archived: "Lưu trữ" },
  tour_departure: { open: "Đang mở", closed: "Đã đóng", cancelled: "Đã huỷ" },
  contact_message: { new: "Mới", read: "Đã đọc", replied: "Đã phản hồi", spam: "Spam" },
  review: {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    hidden: "Đang ẩn",
  },
  post: { draft: "Nháp", published: "Đã đăng" },
  destination: { draft: "Nháp", published: "Đang hiển thị" },
};

const GENERIC_STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  published: "Đang hiển thị",
  archived: "Lưu trữ",
  active: "Đang hiển thị",
  inactive: "Đang ẩn",
  hidden: "Đang ẩn",
  open: "Đang mở",
  closed: "Đã đóng",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function labelFor(key: string): string {
  return KEY_LABELS[key] ?? key;
}

function statusValue(entity: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value !== "string") return String(value);

  const map = STATUS_LABELS_BY_ENTITY[entity];
  return map?.[value] ?? GENERIC_STATUS_LABELS[value] ?? value;
}

function assigneeValue(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return `#${value}`;
  return "Chưa phân công";
}

function formatString(key: string, value: string, entity: string): string {
  if (key === "status") return statusValue(entity, value);
  if (key === "placement") return PLACEMENT_LABELS[value] ?? value;
  if (key === "role") return ROLE_LABELS[value] ?? value;
  if (key === "type") return MEDIA_TYPE_LABELS[value] ?? value;
  if (key === "departureDate" && DATE_ONLY.test(value)) return formatDateVN(value);
  return value;
}

function formatNumber(key: string, value: number): string {
  if (PRICE_KEYS.has(key)) return formatVndDisplay(value);
  if (key === "capacityTotal" || key === "previousCapacityTotal") {
    return `${value.toLocaleString("vi-VN")} chỗ`;
  }
  if (key === "width" || key === "height") return `${value.toLocaleString("vi-VN")} px`;
  return value.toLocaleString("vi-VN");
}

function formatArray(key: string, value: unknown[]): string {
  if (value.length === 0) return "—";

  if (key.endsWith("Ids")) {
    const shown = value
      .slice(0, 5)
      .map((item) => `#${String(item)}`)
      .join(", ");
    return value.length > 5 ? `${shown} +${value.length - 5}` : shown;
  }

  const primitive = value.every(
    (item) => typeof item === "string" || typeof item === "number",
  );
  if (!primitive) return `${value.length} mục`;

  const shown = value.slice(0, 8).map(String).join(", ");
  return value.length > 8 ? `${shown} … (+${value.length - 8})` : shown;
}

function formatObject(value: Record<string, unknown>): string {
  const count = Object.keys(value).length;
  return count === 0 ? "—" : `Đối tượng gồm ${count} trường`;
}

function formatLoose(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (Array.isArray(value)) return formatArray("", value);
  if (isRecord(value)) return formatObject(value);
  return String(value);
}

function formatEntry(key: string, value: unknown, entity: string): AuditMetaEntry[] {
  const label = labelFor(key);

  if (SENSITIVE_KEY.test(key)) return [{ kind: "text", label, value: "•••" }];
  if (value === null || value === undefined) return [{ kind: "text", label, value: "—" }];

  if (typeof value === "string") {
    if (isManagedImageUrl(value)) return [{ kind: "image", label, url: value }];
    return [
      {
        kind: "text",
        label,
        value: formatString(key, value, entity),
        mono: MONO_KEYS.has(key),
      },
    ];
  }

  if (typeof value === "number") {
    return [{ kind: "text", label, value: formatNumber(key, value) }];
  }

  if (typeof value === "boolean") {
    return [{ kind: "text", label, value: value ? "Có" : "Không" }];
  }

  if (Array.isArray(value)) {
    return [{ kind: "text", label, value: formatArray(key, value) }];
  }

  if (isRecord(value)) {
    return [{ kind: "text", label, value: formatObject(value) }];
  }

  return [{ kind: "text", label, value: String(value) }];
}

function sameJson(left: unknown, right: unknown): boolean {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

function settingsValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return formatArray("", value);
  if (isRecord(value)) {
    const text = JSON.stringify(value);
    return text.length > 80 ? `${text.slice(0, 77)}…` : text;
  }
  return String(value);
}

function formatSettingsDiff(
  from: Record<string, unknown>,
  to: Record<string, unknown>,
  preserved: unknown,
): AuditMetaEntry[] {
  const entries: AuditMetaEntry[] = [];
  // `to` chỉ chứa khoá admin gửi lên; giá trị còn lại được merge giữ nguyên
  // (`preservedKeys`), nên chỉ diff những khoá thực sự được ghi.
  const keys = Object.keys(to);

  for (const key of keys) {
    const before = from[key];
    const after = to[key];
    if (sameJson(before, after)) continue;

    entries.push({
      kind: "change",
      label: SETTINGS_KEY_LABELS[key] ?? key,
      from: settingsValue(before),
      to: settingsValue(after),
    });
  }

  if (entries.length === 0) {
    entries.push({ kind: "text", label: "Thay đổi", value: "Không có thay đổi" });
  }

  if (Array.isArray(preserved) && preserved.length > 0) {
    entries.push({
      kind: "text",
      label: "Khoá giữ nguyên",
      value: preserved.map(String).join(", "),
    });
  }

  return entries;
}

export function formatAuditMeta({
  entity,
  action,
  meta,
}: FormatAuditMetaInput): AuditMetaEntry[] {
  if (meta === null || meta === undefined) return [];
  if (!isRecord(meta)) return [{ kind: "text", label: "Giá trị", value: formatLoose(meta) }];

  const record = meta;
  if (Object.keys(record).length === 0) return [];

  if (action === SETTINGS_ACTION && isRecord(record.from) && isRecord(record.to)) {
    return formatSettingsDiff(record.from, record.to, record.preservedKeys);
  }

  const entries: AuditMetaEntry[] = [];
  const handled = new Set<string>();

  if ("hasNote" in record) {
    handled.add("hasNote").add("length");
    const length = typeof record.length === "number" ? record.length : null;
    const hasNote = record.hasNote === true;
    entries.push({
      kind: "text",
      label: "Ghi chú nội bộ",
      value: hasNote ? (length ? `Có (${length} ký tự)` : "Có") : "Không",
    });
  }

  if ("hasReply" in record) {
    handled.add("hasReply");
    entries.push({
      kind: "text",
      label: "Phản hồi",
      value: record.hasReply === true ? "Có" : "Không",
    });
  }

  if ("from" in record || "to" in record) {
    handled.add("from").add("to");
    const isAssign = action === "order.assign";
    entries.unshift({
      kind: "change",
      label: isAssign ? "Người phụ trách" : "Trạng thái",
      from: isAssign ? assigneeValue(record.from) : statusValue(entity, record.from),
      to: isAssign ? assigneeValue(record.to) : statusValue(entity, record.to),
    });
  }

  for (const [key, value] of Object.entries(record)) {
    if (handled.has(key)) continue;
    entries.push(...formatEntry(key, value, entity));
  }

  return entries;
}
