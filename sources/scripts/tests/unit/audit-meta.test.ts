import assert from "node:assert/strict";
import { test } from "node:test";
import { formatAuditMeta, type AuditMetaEntry } from "@/lib/audit/meta";
import { formatVndDisplay } from "@/lib/format";

function first(entries: AuditMetaEntry[], label: string): AuditMetaEntry | undefined {
  return entries.find((entry) => entry.label === label);
}

function textValue(entries: AuditMetaEntry[], label: string): string | undefined {
  const entry = first(entries, label);
  return entry?.kind === "text" ? entry.value : undefined;
}

function changeTo(entries: AuditMetaEntry[], label: string): string | undefined {
  const entry = first(entries, label);
  return entry?.kind === "change" ? entry.to : undefined;
}

test("chuyển trạng thái đơn: from → to + ghi chú", () => {
  const entries = formatAuditMeta({
    entity: "order",
    action: "order.confirm",
    meta: { from: "new", to: "confirmed", note: "Khách xác nhận qua Zalo" },
  });

  assert.deepEqual(entries[0], {
    kind: "change",
    label: "Trạng thái",
    from: "Chờ xác nhận",
    to: "Đã xác nhận",
  });
  assert.equal(textValue(entries, "Ghi chú"), "Khách xác nhận qua Zalo");
});

test("nhãn trạng thái phụ thuộc entity (new của hộp thư khác đơn)", () => {
  const entries = formatAuditMeta({
    entity: "contact_message",
    action: "contact.status",
    meta: { from: "new", to: "replied" },
  });

  assert.deepEqual(entries[0], {
    kind: "change",
    label: "Trạng thái",
    from: "Mới",
    to: "Đã phản hồi",
  });
});

test("order.assign: from/to là id admin", () => {
  const entries = formatAuditMeta({
    entity: "order",
    action: "order.assign",
    meta: { from: null, to: 3 },
  });

  assert.deepEqual(entries[0], {
    kind: "change",
    label: "Người phụ trách",
    from: "Chưa phân công",
    to: "#3",
  });
});

test("cấu hình đặt tour: chỉ hiện khoá đổi, dạng cũ → mới", () => {
  const entries = formatAuditMeta({
    entity: "setting",
    action: "settings.booking.update",
    meta: {
      from: { holdHours: 24, maxGuestsPerOrder: 20 },
      to: { holdHours: 48 },
      preservedKeys: ["cancelCutoffDays"],
    },
  });

  assert.deepEqual(entries, [
    {
      kind: "change",
      label: "Giữ chỗ (giờ)",
      from: "24",
      to: "48",
    },
    {
      kind: "text",
      label: "Khoá giữ nguyên",
      value: "cancelCutoffDays",
    },
  ]);
});

test("cấu hình không đổi: báo rõ thay vì bảng rỗng", () => {
  const entries = formatAuditMeta({
    entity: "setting",
    action: "settings.booking.update",
    meta: { from: { holdHours: 24 }, to: { holdHours: 24 } },
  });

  assert.equal(textValue(entries, "Thay đổi"), "Không có thay đổi");
});

test("media: URL Cloudinary thành entry ảnh, số đo có đơn vị", () => {
  const entries = formatAuditMeta({
    entity: "media",
    action: "media.upload",
    meta: {
      url: "https://res.cloudinary.com/duj1xyanj/image/upload/v1/xmsn/media/a.webp",
      publicId: "xmsn/media/a",
      width: 1920,
      height: 1080,
    },
  });

  assert.deepEqual(entries[0], {
    kind: "image",
    label: "Đường dẫn ảnh",
    url: "https://res.cloudinary.com/duj1xyanj/image/upload/v1/xmsn/media/a.webp",
  });
  assert.equal(textValue(entries, "Rộng"), "1.920 px");
  assert.equal(textValue(entries, "Cao"), "1.080 px");
  assert.deepEqual(first(entries, "Cloudinary ID"), {
    kind: "text",
    label: "Cloudinary ID",
    value: "xmsn/media/a",
    mono: true,
  });
});

test("tour.update: ảnh bìa, giá VND, slug mono", () => {
  const entries = formatAuditMeta({
    entity: "tour",
    action: "tour.update",
    meta: {
      slug: "sai-gon-can-tho",
      name: "Sài Gòn – Cần Thơ",
      basePriceAdult: 1200000,
      coverImageUrl: "/images/tour-cover.webp",
    },
  });

  assert.equal(first(entries, "Ảnh bìa")?.kind, "image");
  assert.equal(textValue(entries, "Giá người lớn"), formatVndDisplay(1200000));
  assert.deepEqual(first(entries, "Đường dẫn"), {
    kind: "text",
    label: "Đường dẫn",
    value: "sai-gon-can-tho",
    mono: true,
  });
});

test("ghi chú nội bộ gộp hasNote + length thành một dòng", () => {
  const withNote = formatAuditMeta({
    entity: "order",
    action: "order.note",
    meta: { hasNote: true, length: 120 },
  });
  assert.deepEqual(withNote, [
    { kind: "text", label: "Ghi chú nội bộ", value: "Có (120 ký tự)" },
  ]);

  const cleared = formatAuditMeta({
    entity: "order",
    action: "order.note",
    meta: { hasNote: false, length: 0 },
  });
  assert.deepEqual(cleared, [{ kind: "text", label: "Ghi chú nội bộ", value: "Không" }]);
});

test("boolean, mảng id và ngày khởi hành được đọc đúng", () => {
  const entries = formatAuditMeta({
    entity: "destination",
    action: "destination.update",
    meta: {
      slug: "chua-vinh-trang",
      name: "Chùa Vĩnh Tràng",
      status: "published",
      tourIds: [1, 2, 3, 4, 5, 6],
    },
  });

  assert.equal(textValue(entries, "Trạng thái"), "Đang hiển thị");
  assert.equal(textValue(entries, "Tour áp dụng"), "#1, #2, #3, #4, #5 +1");

  const departure = formatAuditMeta({
    entity: "tour_departure",
    action: "departure.create",
    meta: { tourSlug: "x", departureDate: "2027-01-09", capacityTotal: 24 },
  });
  assert.equal(textValue(departure, "Ngày khởi hành"), "09/01/2027");
  assert.equal(textValue(departure, "Sức chứa"), "24 chỗ");
});

test("khoá lạ vẫn hiện, khoá nhạy cảm bị che", () => {
  const entries = formatAuditMeta({
    entity: "order",
    action: "order.confirm",
    meta: { fooBar: "giữ nguyên", passwordHash: "abc123", nested: { a: 1, b: 2 } },
  });

  assert.equal(textValue(entries, "fooBar"), "giữ nguyên");
  assert.equal(textValue(entries, "passwordHash"), "•••");
  assert.equal(textValue(entries, "nested"), "Đối tượng gồm 2 trường");
});

test("meta rỗng hoặc không phải object", () => {
  assert.deepEqual(formatAuditMeta({ entity: "order", action: "order.confirm", meta: null }), []);
  assert.deepEqual(formatAuditMeta({ entity: "order", action: "order.confirm", meta: {} }), []);

  assert.deepEqual(
    formatAuditMeta({ entity: "order", action: "order.confirm", meta: "chuỗi thô" }),
    [{ kind: "text", label: "Giá trị", value: "chuỗi thô" }],
  );

  assert.deepEqual(
    formatAuditMeta({ entity: "order", action: "order.confirm", meta: ["a", "b"] }),
    [{ kind: "text", label: "Giá trị", value: "a, b" }],
  );
});

test("isFeatured/isActive hiển thị Có/Không", () => {
  const featured = formatAuditMeta({
    entity: "review",
    action: "review.featured",
    meta: { isFeatured: true },
  });
  assert.deepEqual(featured, [{ kind: "text", label: "Nổi bật", value: "Có" }]);

  const inactive = formatAuditMeta({
    entity: "faq",
    action: "faq.update",
    meta: { question: "Đi mùa nào?", placement: "contact", isActive: false },
  });
  assert.equal(textValue(inactive, "Vị trí"), "Trang liên hệ");
  assert.equal(textValue(inactive, "Đang hiển thị"), "Không");
});

test("giá trị null, số, chuỗi lạ và mảng hỗn hợp", () => {
  const entries = formatAuditMeta({
    entity: "order",
    action: "order.cancel",
    meta: {
      reason: null,
      note: "Huỷ theo yêu cầu",
      sortOrder: 3,
      tags: ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
      items: [{ a: 1 }, { b: 2 }],
      empty: {},
      role: "owner",
      type: "image",
      placement: "khong-ton-tai",
      departureDate: "09/01/2027",
    },
  });

  assert.equal(textValue(entries, "Lý do"), "—");
  assert.equal(textValue(entries, "sortOrder"), "3");
  assert.equal(textValue(entries, "Thẻ"), "a, b, c, d, e, f, g, h … (+1)");
  assert.equal(textValue(entries, "items"), "2 mục");
  assert.equal(textValue(entries, "empty"), "—");
  assert.equal(textValue(entries, "Vai trò"), "Chủ sở hữu");
  assert.equal(textValue(entries, "Loại"), "Ảnh");
  assert.equal(textValue(entries, "Vị trí"), "khong-ton-tai");
  assert.equal(textValue(entries, "Ngày khởi hành"), "09/01/2027");
});

test("trạng thái không phải chuỗi và id phân công lạ", () => {
  const mixed = formatAuditMeta({
    entity: "order",
    action: "order.confirm",
    meta: { from: 5, to: "confirmed" },
  });
  assert.deepEqual(mixed[0], {
    kind: "change",
    label: "Trạng thái",
    from: "5",
    to: "Đã xác nhận",
  });

  const noFrom = formatAuditMeta({
    entity: "order",
    action: "order.confirm",
    meta: { from: null, to: "confirmed" },
  });
  assert.equal(noFrom[0]?.kind === "change" ? noFrom[0].from : null, "—");

  const assign = formatAuditMeta({
    entity: "order",
    action: "order.assign",
    meta: { from: "abc", to: 7 },
  });
  assert.equal(assign[0]?.kind === "change" ? assign[0].from : null, "Chưa phân công");
  assert.equal(assign[0]?.kind === "change" ? assign[0].to : null, "#7");
});

test("mảng id ngắn giữ nguyên chuỗi", () => {
  const entries = formatAuditMeta({
    entity: "cuisine",
    action: "cuisine.update",
    meta: { tourIds: [2, 4] },
  });
  assert.equal(textValue(entries, "Tour áp dụng"), "#2, #4");
});

test("cấu hình: giá trị chuỗi/mảng/object trong diff", () => {
  const entries = formatAuditMeta({
    entity: "setting",
    action: "settings.booking.update",
    meta: {
      from: { cancellationPolicy: { days: 3 }, note: "cũ" },
      to: { cancellationPolicy: { days: 5 }, note: "mới", flags: ["hot"] },
    },
  });

  assert.equal(changeTo(entries, "Chính sách huỷ"), '{"days":5}');
  assert.equal(changeTo(entries, "note"), "mới");
  assert.equal(changeTo(entries, "flags"), "hot");
});

test("meta dạng boolean hoặc số", () => {
  assert.deepEqual(
    formatAuditMeta({ entity: "order", action: "order.confirm", meta: true }),
    [{ kind: "text", label: "Giá trị", value: "Có" }],
  );
  assert.deepEqual(
    formatAuditMeta({ entity: "order", action: "order.confirm", meta: 1200000 }),
    [{ kind: "text", label: "Giá trị", value: "1.200.000" }],
  );
});
