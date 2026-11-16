/**
 * Test P0/P1: CRUD chuyến khởi hành và cấu hình đặt tour.
 *
 *   node --import tsx --test scripts/tests/admin-content.test.mts
 *
 * Yêu cầu: TEST_DATABASE_URL trong .env, đã migrate + seed DB test.
 * Suite này tạo rồi dọn sạch chuyến/đơn của chính nó, và **khôi phục** cấu hình
 * booking về giá trị ban đầu vì các suite khác dùng chung một database.
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

const { default: prisma } = await import("@/lib/prisma");
const {
  createDeparture,
  deleteDeparture,
  getAdminTourDepartures,
  listAdminTours,
  setDepartureStatus,
  updateDeparture,
} = await import("@/server/catalog/admin-departures");
const { updateBookingSettings } = await import(
  "@/server/settings/update-booking-settings"
);
const { getBookingSettings } = await import("@/server/settings/get-booking-settings");
const { getAdminTour, setTourStatus, updateAdminTour } = await import(
  "@/server/catalog/admin-tours"
);

const TOUR_SLUG = "sai-gon-can-tho-u-minh-ha-dat-mui-4n3d";
const TEST_DATE = "2031-03-11";
const TEST_DATE_2 = "2031-03-12";

let adminId = 0;
let departureId = 0;
let originalSettings: Awaited<ReturnType<typeof getBookingSettings>>;
let tourSnapshot: Awaited<ReturnType<typeof getAdminTour>>;

function input(overrides: Record<string, unknown> = {}) {
  return {
    departureDate: TEST_DATE,
    returnDate: null,
    capacityTotal: 12,
    priceAdult: 4_500_000,
    priceChild: null,
    holidaySurcharge: 0,
    meetingPoint: "Quận 1",
    note: "chuyến test",
    ...overrides,
  };
}

before(async () => {
  const admin = await prisma.adminUser.findFirstOrThrow({ select: { id: true } });
  adminId = admin.id;
  originalSettings = await getBookingSettings();
  tourSnapshot = await getAdminTour(TOUR_SLUG);

  // Dọn dữ liệu của lần chạy trước nếu có.
  const tour = await prisma.tour.findUniqueOrThrow({
    where: { slug: TOUR_SLUG },
    select: { id: true },
  });
  await prisma.order.deleteMany({
    where: { tourId: tour.id, code: { startsWith: "TEST-DEP-" } },
  });
  await prisma.tourDeparture.deleteMany({
    where: { tourId: tour.id, departureDate: { gte: new Date("2031-01-01") } },
  });
  await prisma.contactMessage.deleteMany({
    where: { phone: { startsWith: "0911000" } },
  });
  await prisma.adminUser.deleteMany({
    where: { email: { endsWith: "@admin-ops.test" } },
  });
  await prisma.media.deleteMany({
    where: { title: { startsWith: "QA Media" } },
  });
  await prisma.review.deleteMany({
    where: { authorName: { startsWith: "QA Reviewer" } },
  });
});

after(async () => {
  const tour = await prisma.tour.findUniqueOrThrow({
    where: { slug: TOUR_SLUG },
    select: { id: true },
  });
  await prisma.order.deleteMany({
    where: { tourId: tour.id, code: { startsWith: "TEST-DEP-" } },
  });
  await prisma.tourDeparture.deleteMany({
    where: { tourId: tour.id, departureDate: { gte: new Date("2031-01-01") } },
  });
  await prisma.contactMessage.deleteMany({
    where: { phone: { startsWith: "0911000" } },
  });
  await prisma.adminUser.deleteMany({
    where: { email: { endsWith: "@admin-ops.test" } },
  });
  await prisma.media.deleteMany({
    where: { title: { startsWith: "QA Media" } },
  });
  await prisma.review.deleteMany({
    where: { authorName: { startsWith: "QA Reviewer" } },
  });
  await updateBookingSettings(originalSettings, adminId);

  // Trả tour về đúng trạng thái ban đầu vì các suite khác dùng chung DB.
  await updateAdminTour(
    TOUR_SLUG,
    {
      name: tourSnapshot.name,
      tagline: tourSnapshot.tagline,
      summary: tourSnapshot.summary,
      description: tourSnapshot.description,
      durationDays: tourSnapshot.durationDays,
      durationNights: tourSnapshot.durationNights,
      basePriceAdult: tourSnapshot.basePriceAdult,
      basePriceChild: tourSnapshot.basePriceChild,
      childAgeNote: tourSnapshot.childAgeNote,
      cancellationPolicy: tourSnapshot.cancellationPolicy,
      packingNotes: tourSnapshot.packingNotes,
      coverImageUrl: tourSnapshot.coverImageUrl,
      seoTitle: tourSnapshot.seoTitle,
      seoDescription: tourSnapshot.seoDescription,
      isFeatured: tourSnapshot.isFeatured,
      sortOrder: tourSnapshot.sortOrder,
    },
    adminId,
  );
  await setTourStatus(TOUR_SLUG, tourSnapshot.status, adminId);
});

test("listAdminTours trả tour cùng số chuyến đang mở", async () => {
  const tours = await listAdminTours();

  assert.ok(tours.length >= 3);
  const tour = tours.find((item) => item.slug === TOUR_SLUG);
  assert.ok(tour);
  assert.equal(typeof tour.openDepartureCount, "number");
  assert.equal(typeof tour.departureCount, "number");
});

test("tạo chuyến: mặc định mở bán, tính đúng chỗ còn lại", async () => {
  const created = await createDeparture(TOUR_SLUG, input(), adminId);
  departureId = created.id;

  assert.equal(created.status, "open");
  assert.equal(created.capacityTotal, 12);
  assert.equal(created.seatsTaken, 0);
  assert.equal(created.seatsRemaining, 12);
  assert.equal(created.departureDate, TEST_DATE);

  const detail = await getAdminTourDepartures(TOUR_SLUG);
  assert.ok(detail.departures.some((item) => item.id === created.id));
});

test("trùng ngày khởi hành bị chặn với thông báo thân thiện", async () => {
  await assert.rejects(
    () => createDeparture(TOUR_SLUG, input(), adminId),
    (error: { code?: string; status?: number }) =>
      error.code === "DEPARTURE_EXISTS" && error.status === 409,
  );
});

test("không hạ số chỗ xuống dưới số khách đã đặt", async () => {
  await prisma.tourDeparture.update({
    where: { id: departureId },
    data: { seatsTaken: 5 },
  });

  await assert.rejects(
    () => updateDeparture(departureId, input({ capacityTotal: 4 }), adminId),
    (error: { code?: string }) => error.code === "CAPACITY_BELOW_TAKEN",
  );

  const updated = await updateDeparture(
    departureId,
    input({ capacityTotal: 9, priceAdult: null }),
    adminId,
  );
  assert.equal(updated.capacityTotal, 9);
  assert.equal(updated.priceAdult, null);
  assert.equal(updated.seatsRemaining, 4);
});

test("ngày về trước ngày khởi hành bị chặn", async () => {
  await assert.rejects(
    () =>
      createDeparture(TOUR_SLUG, input({ departureDate: TEST_DATE_2, returnDate: "2031-03-01" }), adminId),
    (error: { code?: string }) => error.code === "INVALID_DATE_RANGE",
  );
});

test("đổi trạng thái chuyến và ghi audit", async () => {
  const closed = await setDepartureStatus(departureId, "closed", adminId);
  assert.equal(closed.status, "closed");

  const reopened = await setDepartureStatus(departureId, "open", adminId);
  assert.equal(reopened.status, "open");

  const audits = await prisma.adminAuditLog.count({
    where: { entity: "tour_departure", entityId: departureId },
  });
  assert.ok(audits >= 3, "phải có audit cho create + 2 lần đổi trạng thái");
});

test("không xoá chuyến đã có đơn", async () => {
  const tour = await prisma.tour.findUniqueOrThrow({
    where: { slug: TOUR_SLUG },
    select: { id: true },
  });

  const order = await prisma.order.create({
    data: {
      code: `TEST-DEP-${randomUUID().slice(0, 8)}`,
      tourId: tour.id,
      departureId,
      contactName: "Khách test",
      phone: "0900000000",
      adults: 1,
      unitPriceAdult: 1_000,
      totalAmount: 1_000,
      lookupToken: randomUUID().replace(/-/g, "").slice(0, 24),
    },
    select: { id: true },
  });

  await assert.rejects(
    () => deleteDeparture(departureId, adminId),
    (error: { code?: string }) => error.code === "DEPARTURE_HAS_ORDERS",
  );

  await prisma.order.delete({ where: { id: order.id } });
});

test("xoá chuyến không có đơn", async () => {
  await deleteDeparture(departureId, adminId);

  const remaining = await prisma.tourDeparture.count({ where: { id: departureId } });
  assert.equal(remaining, 0);
});

test("isAdminDepartureStatus chỉ nhận ba trạng thái hợp lệ", async () => {
  const { isAdminDepartureStatus } = await import(
    "@/server/catalog/admin-departures"
  );

  assert.equal(isAdminDepartureStatus("open"), true);
  assert.equal(isAdminDepartureStatus("closed"), true);
  assert.equal(isAdminDepartureStatus("cancelled"), true);
  assert.equal(isAdminDepartureStatus("deleted"), false);
  assert.equal(isAdminDepartureStatus(null), false);
  assert.equal(isAdminDepartureStatus(1), false);
});

test("tour hoặc chuyến không tồn tại báo lỗi 404", async () => {
  await assert.rejects(
    () => getAdminTourDepartures("khong-ton-tai"),
    (error: { code?: string; status?: number }) =>
      error.code === "TOUR_NOT_FOUND" && error.status === 404,
  );

  await assert.rejects(
    () => createDeparture("khong-ton-tai", input(), adminId),
    (error: { code?: string }) => error.code === "TOUR_NOT_FOUND",
  );

  await assert.rejects(
    () => updateDeparture(999_999_999, input(), adminId),
    (error: { code?: string; status?: number }) =>
      error.code === "DEPARTURE_NOT_FOUND" && error.status === 404,
  );

  await assert.rejects(
    () => setDepartureStatus(999_999_999, "closed", adminId),
    (error: { code?: string }) => error.code === "DEPARTURE_NOT_FOUND",
  );

  await assert.rejects(
    () => deleteDeparture(999_999_999, adminId),
    (error: { code?: string }) => error.code === "DEPARTURE_NOT_FOUND",
  );
});

test("dữ liệu nhập sai bị chặn trước khi chạm database", async () => {
  await assert.rejects(
    () => createDeparture(TOUR_SLUG, input({ departureDate: "2031-13-45" }), adminId),
    (error: { code?: string }) => error.code === "INVALID_DATE",
  );

  await assert.rejects(
    () => createDeparture(TOUR_SLUG, input({ capacityTotal: 0 }), adminId),
    (error: { code?: string }) => error.code === "INVALID_CAPACITY",
  );

  await assert.rejects(
    () => createDeparture(TOUR_SLUG, input({ priceAdult: -1 }), adminId),
    (error: { code?: string }) => error.code === "INVALID_PRICE",
  );
});

test("đặt lại đúng trạng thái hiện tại là no-op", async () => {
  const created = await createDeparture(
    TOUR_SLUG,
    input({ departureDate: TEST_DATE_2 }),
    adminId,
  );

  const same = await setDepartureStatus(created.id, "open", adminId);
  assert.equal(same.status, "open");

  await prisma.tourDeparture.delete({ where: { id: created.id } });
});

test("cấu hình booking ghi được và được chuẩn hoá khi đọc lại", async () => {  const saved = await updateBookingSettings(
    {
      minDaysAhead: 2,
      maxGuestsPerOrder: 15,
      holdHours: 8,
      cancelCutoffDays: 5,
    },
    adminId,
  );

  assert.deepEqual(saved, {
    minDaysAhead: 2,
    maxGuestsPerOrder: 15,
    holdHours: 8,
    cancelCutoffDays: 5,
  });

  const reread = await getBookingSettings();
  assert.equal(reread.holdHours, 8);
  assert.equal(reread.cancelCutoffDays, 5);

  // Giá trị vượt biên bị kẹp về khoảng an toàn.
  const clamped = await updateBookingSettings(
    { minDaysAhead: 999, maxGuestsPerOrder: 0, holdHours: 0, cancelCutoffDays: 999 },
    adminId,
  );
  assert.deepEqual(clamped, {
    minDaysAhead: 60,
    maxGuestsPerOrder: 1,
    holdHours: 1,
    cancelCutoffDays: 30,
  });
});

// ---------------------------------------------------------------------------
// P2 · Hộp thư liên hệ
// ---------------------------------------------------------------------------

test("hộp thư: liệt kê, lọc và đếm theo trạng thái", async () => {
  const { countContactMessagesByStatus, isAdminContactStatus, listAdminContactMessages } =
    await import("@/server/contact/admin-messages");

  assert.equal(isAdminContactStatus("new"), true);
  assert.equal(isAdminContactStatus("replied"), true);
  assert.equal(isAdminContactStatus("deleted"), false);
  assert.equal(isAdminContactStatus(undefined), false);

  const created = await prisma.contactMessage.create({
    data: {
      name: "Khách test hộp thư",
      phone: "0911000001",
      email: "inbox@admin-ops.test",
      subject: "Hỏi lịch khởi hành",
      message: "Cho mình hỏi lịch tháng 12.",
    },
    select: { id: true },
  });

  const list = await listAdminContactMessages({ status: "new", q: "0911000001" });
  assert.ok(list.messages.some((item) => item.id === created.id));

  const counts = await countContactMessagesByStatus();
  assert.ok((counts.new ?? 0) >= 1);
});

test("hộp thư: đổi trạng thái ghi audit, xoá và báo 404 sau khi xoá", async () => {
  const { deleteContactMessage, setContactMessageStatus } = await import(
    "@/server/contact/admin-messages"
  );

  const created = await prisma.contactMessage.create({
    data: {
      name: "Khách test trạng thái",
      phone: "0911000002",
      message: "Nội dung cần xử lý",
    },
    select: { id: true },
  });

  const replied = await setContactMessageStatus(created.id, "replied", adminId);
  assert.equal(replied.status, "replied");

  const same = await setContactMessageStatus(created.id, "replied", adminId);
  assert.equal(same.status, "replied");

  const audits = await prisma.adminAuditLog.count({
    where: { entity: "contact_message", entityId: created.id },
  });
  assert.ok(audits >= 1);

  await deleteContactMessage(created.id, adminId);
  assert.equal(await prisma.contactMessage.count({ where: { id: created.id } }), 0);

  await assert.rejects(
    () => setContactMessageStatus(created.id, "read", adminId),
    (error: { code?: string; status?: number }) =>
      error.code === "CONTACT_NOT_FOUND" && error.status === 404,
  );
});

// ---------------------------------------------------------------------------
// P3 · Tài khoản quản trị
// ---------------------------------------------------------------------------

test("tài khoản: tạo, đăng nhập, đổi vai trò, đặt lại mật khẩu", async () => {
  const {
    createAdminUser,
    isAdminRole,
    resetAdminPassword,
    updateAdminUser,
  } = await import("@/server/auth/admin-users");
  const { authenticateAdmin } = await import("@/server/auth/authenticate");

  assert.equal(isAdminRole("owner"), true);
  assert.equal(isAdminRole("editor"), true);
  assert.equal(isAdminRole("root"), false);

  const email = "qa-editor@admin-ops.test";
  const created = await createAdminUser(
    { email, name: "QA Editor", password: "QaTest#2026", role: "editor" },
    adminId,
  );

  assert.equal(created.role, "editor");
  assert.equal(created.isActive, true);
  assert.equal(created.isSelf, false);

  assert.ok(await authenticateAdmin(email, "QaTest#2026"));

  await assert.rejects(
    () =>
      createAdminUser(
        { email, name: "Trùng email", password: "QaTest#2026", role: "editor" },
        adminId,
      ),
    (error: { code?: string; status?: number }) =>
      error.code === "ADMIN_EMAIL_TAKEN" && error.status === 409,
  );

  await assert.rejects(
    () =>
      createAdminUser(
        { email: "qa-weak@admin-ops.test", name: "Yếu", password: "123", role: "editor" },
        adminId,
      ),
    (error: { code?: string }) => error.code === "WEAK_PASSWORD",
  );

  const updated = await updateAdminUser(
    created.id,
    { name: "QA Editor 2", role: "admin", isActive: true },
    adminId,
  );
  assert.equal(updated.role, "admin");
  assert.equal(updated.name, "QA Editor 2");

  await resetAdminPassword(created.id, "NewPass#2026", adminId);
  assert.equal(await authenticateAdmin(email, "QaTest#2026"), null);
  assert.ok(await authenticateAdmin(email, "NewPass#2026"));

  const disabled = await updateAdminUser(
    created.id,
    { name: "QA Editor 2", role: "admin", isActive: false },
    adminId,
  );
  assert.equal(disabled.isActive, false);
  assert.equal(await authenticateAdmin(email, "NewPass#2026"), null);
});

test("tài khoản: không tự khoá và giữ chủ sở hữu cuối cùng", async () => {
  const { deleteAdminUser, updateAdminUser } = await import(
    "@/server/auth/admin-users"
  );

  await assert.rejects(
    () => updateAdminUser(adminId, { name: "Tự khoá", role: "owner", isActive: false }, adminId),
    (error: { code?: string }) => error.code === "ADMIN_SELF_DISABLE",
  );

  await assert.rejects(
    () => deleteAdminUser(adminId, adminId),
    (error: { code?: string }) => error.code === "ADMIN_SELF_DELETE",
  );

  const activeOwners = await prisma.adminUser.count({
    where: { role: "owner", isActive: true },
  });

  if (activeOwners === 1) {
    await assert.rejects(
      () => updateAdminUser(adminId, { name: "Hạ quyền", role: "admin", isActive: true }, adminId),
      (error: { code?: string }) => error.code === "ADMIN_LAST_OWNER",
    );
  }
});

test("tài khoản: xoá tài khoản khác", async () => {  const { createAdminUser, deleteAdminUser, listAdminUsers } = await import(
    "@/server/auth/admin-users"
  );

  const email = "qa-temp@admin-ops.test";
  const created = await createAdminUser(
    { email, name: "QA Temp", password: "QaTest#2026", role: "editor" },
    adminId,
  );

  const before = await listAdminUsers(adminId);
  assert.ok(before.some((user) => user.id === created.id));

  await deleteAdminUser(created.id, adminId);

  assert.equal(await prisma.adminUser.count({ where: { email } }), 0);
  await assert.rejects(
    () => deleteAdminUser(created.id, adminId),
    (error: { code?: string; status?: number }) =>
      error.code === "ADMIN_NOT_FOUND" && error.status === 404,
  );
});

// ---------------------------------------------------------------------------
// P4 · Nội dung tour + thư viện media
// ---------------------------------------------------------------------------

function tourInputFrom(tour: Awaited<ReturnType<typeof getAdminTour>>) {
  return {
    name: tour.name,
    tagline: tour.tagline,
    summary: tour.summary,
    description: tour.description,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    basePriceAdult: tour.basePriceAdult,
    basePriceChild: tour.basePriceChild,
    childAgeNote: tour.childAgeNote,
    cancellationPolicy: tour.cancellationPolicy,
    packingNotes: tour.packingNotes,
    coverImageUrl: tour.coverImageUrl,
    seoTitle: tour.seoTitle,
    seoDescription: tour.seoDescription,
    isFeatured: tour.isFeatured,
    sortOrder: tour.sortOrder,
  };
}

test("tour: sửa tên/giá/ảnh bìa và đổi trạng thái bán", async () => {
  const before = await getAdminTour(TOUR_SLUG);

  const updated = await updateAdminTour(
    TOUR_SLUG,
    {
      ...tourInputFrom(before),
      name: `${before.name} (QA)`,
      basePriceAdult: 4_990_000,
      coverImageUrl: "/images/47-du-khach-ghe-may-hoang-hon.webp",
    },
    adminId,
  );

  assert.equal(updated.name, `${before.name} (QA)`);
  assert.equal(updated.basePriceAdult, 4_990_000);
  assert.equal(updated.coverImageUrl, "/images/47-du-khach-ghe-may-hoang-hon.webp");

  const draft = await setTourStatus(TOUR_SLUG, "draft", adminId);
  assert.equal(draft.status, "draft");
  const published = await setTourStatus(TOUR_SLUG, "published", adminId);
  assert.equal(published.status, "published");

  await updateAdminTour(TOUR_SLUG, tourInputFrom(before), adminId);
});

test("tour: chặn ảnh bìa ngoài, thời lượng sai và slug lạ", async () => {
  const before = await getAdminTour(TOUR_SLUG);

  await assert.rejects(
    () =>
      updateAdminTour(
        TOUR_SLUG,
        { ...tourInputFrom(before), coverImageUrl: "https://example.com/x.jpg" },
        adminId,
      ),
    (error: { code?: string; status?: number }) =>
      error.code === "INVALID_TOUR" && error.status === 400,
  );

  await assert.rejects(
    () => updateAdminTour(TOUR_SLUG, { ...tourInputFrom(before), durationDays: 0 }, adminId),
    (error: { code?: string }) => error.code === "INVALID_TOUR",
  );

  await assert.rejects(
    () => getAdminTour("khong-ton-tai"),
    (error: { code?: string; status?: number }) =>
      error.code === "TOUR_NOT_FOUND" && error.status === 404,
  );
});

test("media: tạo, sửa, xoá và chặn URL không hợp lệ", async () => {
  const { MEDIA_TYPE_LABEL, isMediaType, listMediaImageUrls } = await import(
    "@/server/media/admin-media"
  );

  assert.equal(isMediaType("image"), true);
  assert.equal(isMediaType("youtube"), true);
  assert.equal(isMediaType("video"), false);
  assert.equal(MEDIA_TYPE_LABEL.image, "Ảnh");

  const base = {
    type: "image" as const,
    url: "/images/23-xuong-may-tren-kenh-phu-sa.webp",
    title: "QA Media ảnh",
    alt: "Ảnh test",
    tags: ["qa", "test"],
    sortOrder: 5,
    isActive: true,
  };

  const { createMedia, deleteMedia, updateMedia } = await import(
    "@/server/media/admin-media"
  );
  const created = await createMedia(base, adminId);

  assert.equal(created.title, "QA Media ảnh");
  assert.deepEqual(created.tags, ["qa", "test"]);

  const urls = await listMediaImageUrls();
  assert.ok(urls.includes(base.url));

  await assert.rejects(
    () => createMedia({ ...base, url: "https://example.com/a.jpg" }, adminId),
    (error: { code?: string }) => error.code === "MEDIA_INVALID_URL",
  );
  await assert.rejects(
    () => createMedia({ ...base, type: "youtube", url: "/images/x.webp" }, adminId),
    (error: { code?: string }) => error.code === "MEDIA_INVALID_URL",
  );

  const updated = await updateMedia(
    created.id,
    { ...base, title: "QA Media sửa", isActive: false },
    adminId,
  );
  assert.equal(updated.title, "QA Media sửa");
  assert.equal(updated.isActive, false);

  await deleteMedia(created.id, adminId);
  await assert.rejects(
    () => deleteMedia(created.id, adminId),
    (error: { code?: string; status?: number }) =>
      error.code === "MEDIA_NOT_FOUND" && error.status === 404,
  );
});

// ---------------------------------------------------------------------------
// P5 · Kiểm duyệt đánh giá + dữ liệu export
// ---------------------------------------------------------------------------

test("đánh giá: duyệt, nổi bật, phản hồi rồi xoá", async () => {
  const {
    countReviewsByStatus,
    deleteReview,
    isAdminReviewStatus,
    listAdminReviews,
    setReviewFeatured,
    setReviewReply,
    setReviewStatus,
  } = await import("@/server/reviews/admin-reviews");

  assert.equal(isAdminReviewStatus("approved"), true);
  assert.equal(isAdminReviewStatus("published"), false);

  const tour = await prisma.tour.findUniqueOrThrow({
    where: { slug: TOUR_SLUG },
    select: { id: true },
  });

  const review = await prisma.review.create({
    data: {
      tourId: tour.id,
      authorName: "QA Reviewer",
      rating: 5,
      comment: "Chuyến đi rất tốt.",
    },
    select: { id: true },
  });

  const list = await listAdminReviews({ status: "pending" });
  assert.ok(list.reviews.some((item) => item.id === review.id));

  const approved = await setReviewStatus(review.id, "approved", adminId);
  assert.equal(approved.status, "approved");
  assert.ok(approved.approvedAt);

  const featured = await setReviewFeatured(review.id, true, adminId);
  assert.equal(featured.isFeatured, true);

  const replied = await setReviewReply(review.id, "Cảm ơn bạn đã đi cùng chúng tôi!", adminId);
  assert.equal(replied.adminReply, "Cảm ơn bạn đã đi cùng chúng tôi!");

  const counts = await countReviewsByStatus();
  assert.ok((counts.approved ?? 0) >= 1);

  await deleteReview(review.id, adminId);

  await assert.rejects(
    () => setReviewStatus(review.id, "hidden", adminId),
    (error: { code?: string }) => error.code === "REVIEW_NOT_FOUND",
  );
});

test("export đơn: trả dòng phẳng đủ cột cho CSV", async () => {  const { listAdminOrdersForExport } = await import("@/server/booking/admin-queries");

  const rows = await listAdminOrdersForExport({ limit: 5 });
  assert.ok(Array.isArray(rows));

  for (const row of rows) {
    assert.equal(typeof row.code, "string");
    assert.equal(typeof row.contactName, "string");
    assert.equal(typeof row.totalAmount, "number");
    assert.equal(typeof row.tourName, "string");
    assert.ok(
      row.departureDate === null || /^\d{4}-\d{2}-\d{2}$/.test(row.departureDate),
      "departureDate phải là YYYY-MM-DD",
    );
  }
});

test("P4/P5: ô rỗng thành null và các nhánh 404", async () => {
  const { isAdminTourStatus } = await import("@/server/catalog/admin-tours");
  const { updateMedia } = await import("@/server/media/admin-media");
  const { deleteReview } = await import("@/server/reviews/admin-reviews");

  assert.equal(isAdminTourStatus("published"), true);
  assert.equal(isAdminTourStatus("deleted"), false);

  // Ô rỗng phải lưu thành NULL thay vì chuỗi rỗng.
  const before = await getAdminTour(TOUR_SLUG);
  const cleared = await updateAdminTour(
    TOUR_SLUG,
    {
      ...tourInputFrom(before),
      tagline: "",
      summary: "",
      description: "",
      childAgeNote: "",
      cancellationPolicy: "",
      packingNotes: "",
      seoTitle: "",
      seoDescription: "",
      coverImageUrl: "",
    },
    adminId,
  );

  assert.equal(cleared.tagline, null);
  assert.equal(cleared.summary, null);
  assert.equal(cleared.coverImageUrl, null);

  await updateAdminTour(TOUR_SLUG, tourInputFrom(before), adminId);

  await assert.rejects(
    () => setTourStatus("khong-ton-tai", "published", adminId),
    (error: { code?: string }) => error.code === "TOUR_NOT_FOUND",
  );

  await assert.rejects(
    () => updateAdminTour("khong-ton-tai", tourInputFrom(before), adminId),
    (error: { code?: string }) => error.code === "TOUR_NOT_FOUND",
  );

  const { createMedia } = await import("@/server/media/admin-media");
  const media = await createMedia(
    {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=abc",
      title: "",
      alt: "",
      tags: [],
      sortOrder: 0,
      isActive: true,
    },
    adminId,
  );
  assert.equal(media.title, null);
  assert.equal(media.alt, null);

  await assert.rejects(
    () => updateMedia(999_999_999, {
      type: "image",
      url: "/images/23-xuong-may-tren-kenh-phu-sa.webp",
      title: null,
      alt: null,
      tags: [],
      sortOrder: 0,
      isActive: true,
    }, adminId),
    (error: { code?: string; status?: number }) =>
      error.code === "MEDIA_NOT_FOUND" && error.status === 404,
  );

  const { deleteMedia } = await import("@/server/media/admin-media");
  await deleteMedia(media.id, adminId);

  await assert.rejects(
    () => deleteReview(999_999_999, adminId),
    (error: { code?: string; status?: number }) =>
      error.code === "REVIEW_NOT_FOUND" && error.status === 404,
  );
});
