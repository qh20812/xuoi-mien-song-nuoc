/**
 * Factory dữ liệu test.
 *
 * Mỗi file test tự tạo tour/chuyến/admin riêng trong `before()` rồi xoá trong
 * `after()` — không phụ thuộc seed và không phụ thuộc ngày chạy. Nhờ vậy test
 * lọc theo `minDaysAhead` vẫn ổn định bất kể hôm nay là ngày nào.
 *
 * File test phải `import "./helpers/env"` trước khi import module này.
 */
import { randomBytes } from "node:crypto";
import type { OrderStatus, Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDaysToDateString, parseDateOnly, todayVN } from "@/lib/time";

type Db = PrismaClient | Prisma.TransactionClient;

/** Mật khẩu mặc định của admin do factory tạo. */
export const TEST_ADMIN_PASSWORD = "TestAdmin#2026";

let counter = 0;

/** Hậu tố duy nhất trong một lần chạy test (slug/code/email). */
export function uniqueSuffix(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter.toString(36)}`;
}

// ---------------------------------------------------------------------------
// Tour + chuyến khởi hành
// ---------------------------------------------------------------------------

export type TestTourOverrides = Partial<Prisma.TourUncheckedCreateInput>;

export async function createTestTour(
  db: Db,
  overrides: TestTourOverrides = {},
) {
  const suffix = uniqueSuffix();

  return db.tour.create({
    data: {
      slug: `test-tour-${suffix}`,
      code: `TEST-${suffix}`,
      name: `Tour kiểm thử ${suffix}`,
      durationDays: 4,
      durationNights: 3,
      basePriceAdult: 4_190_000,
      basePriceChild: 2_930_000,
      status: "published",
      coverImageUrl: "/images/23-xuong-may-tren-kenh-phu-sa.webp",
      cancellationPolicy: "Huỷ trước 3 ngày khởi hành.",
      ...overrides,
    },
  });
}

export type TestDepartureOptions = {
  /** Số ngày kể từ hôm nay (theo lịch VN). Âm = đã qua. */
  daysFromToday?: number;
  capacityTotal?: number;
  seatsTaken?: number;
  status?: "open" | "closed" | "cancelled";
  holidaySurcharge?: number;
  priceAdult?: number | null;
  priceChild?: number | null;
  meetingPoint?: string | null;
};

export async function createTestDeparture(
  db: Db,
  tourId: number,
  options: TestDepartureOptions = {},
) {
  const {
    daysFromToday = 14,
    capacityTotal = 24,
    seatsTaken = 0,
    status = "open",
    holidaySurcharge = 0,
    priceAdult = null,
    priceChild = null,
    meetingPoint = "Trung tâm TP.HCM (Quận 1)",
  } = options;

  return db.tourDeparture.create({
    data: {
      tourId,
      departureDate: parseDateOnly(
        addDaysToDateString(todayVN(), daysFromToday),
      ),
      capacityTotal,
      seatsTaken,
      status,
      holidaySurcharge,
      priceAdult,
      priceChild,
      meetingPoint,
    },
  });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export type BookingSettingsRow = {
  key: string;
  value: Prisma.JsonValue;
};

/** Đọc nguyên row `settings.booking` để khôi phục sau test. */
export async function readBookingSettings(
  db: Db,
): Promise<BookingSettingsRow | null> {
  return db.setting.findUnique({
    where: { key: "booking" },
    select: { key: true, value: true },
  });
}

/** Ghi đè `settings.booking` (upsert, giữ các field khác nếu truyền object đầy đủ). */
export async function createTestSettings(
  db: Db,
  value: Record<string, unknown>,
) {
  const json = value as Prisma.InputJsonValue;

  return db.setting.upsert({
    where: { key: "booking" },
    update: { value: json },
    create: { key: "booking", value: json },
  });
}

/** Khôi phục `settings.booking` về trạng thái trước test. */
export async function restoreBookingSettings(
  db: Db,
  row: BookingSettingsRow | null,
) {
  if (row) {
    await db.setting.update({
      where: { key: row.key },
      data: { value: row.value as Prisma.InputJsonValue },
    });
    return;
  }

  await db.setting.deleteMany({ where: { key: "booking" } });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export type TestAdminOptions = Partial<
  Omit<Prisma.AdminUserUncheckedCreateInput, "passwordHash">
> & {
  /** Mật khẩu thật (sẽ được băm bằng bcrypt). Mặc định `TEST_ADMIN_PASSWORD`. */
  password?: string;
};

export async function createTestAdmin(
  db: Db,
  { password = TEST_ADMIN_PASSWORD, ...overrides }: TestAdminOptions = {},
) {
  const suffix = uniqueSuffix();

  return db.adminUser.create({
    data: {
      email: `test-admin-${suffix}@xuoiemiensongnuoc.test`,
      name: `Admin kiểm thử ${suffix}`,
      role: "admin",
      isActive: true,
      passwordHash: await bcrypt.hash(password, 10),
      ...overrides,
    },
  });
}

// ---------------------------------------------------------------------------
// Đơn hàng
// ---------------------------------------------------------------------------

export type TestOrderOptions = {
  departureId: number;
  status?: OrderStatus;
  adults?: number;
  children?: number;
  infants?: number;
  holdExpiresAt?: Date | null;
  contactName?: string;
  phone?: string;
  clientRequestId?: string | null;
};

/**
 * Tạo đơn trực tiếp trong DB (bỏ qua API).
 *
 * `Order.lookupToken` là bắt buộc + unique + không có default, nên factory phải
 * tự sinh. `code` dùng tiền tố `TEST-` — không tra cứu được qua API vì zod chỉ
 * chấp nhận `XMSN-YYYY-NNNN`, nhưng đủ cho test đọc/ghi trực tiếp.
 */
export async function createTestOrder(
  db: Db,
  {
    departureId,
    status = "new",
    adults = 1,
    children = 0,
    infants = 0,
    holdExpiresAt = null,
    contactName = "Khách kiểm thử",
    phone = "0901234567",
    clientRequestId = null,
  }: TestOrderOptions,
) {
  const departure = await db.tourDeparture.findUniqueOrThrow({
    where: { id: departureId },
    select: {
      id: true,
      tourId: true,
      priceAdult: true,
      priceChild: true,
      holidaySurcharge: true,
    },
  });

  const unitPriceAdult = departure.priceAdult ?? 1_000_000;
  const unitPriceChild = departure.priceChild ?? 700_000;
  const billed = adults + children;

  return db.order.create({
    data: {
      code: `TEST-${uniqueSuffix()}`.slice(0, 24),
      tourId: departure.tourId,
      departureId: departure.id,
      contactName,
      phone,
      adults,
      children,
      infants,
      unitPriceAdult,
      unitPriceChild,
      surcharge: departure.holidaySurcharge,
      totalAmount:
        adults * unitPriceAdult +
        children * unitPriceChild +
        billed * departure.holidaySurcharge,
      status,
      holdExpiresAt,
      lookupToken: randomBytes(12).toString("hex"),
      clientRequestId,
    },
  });
}

// ---------------------------------------------------------------------------
// Dọn dẹp
// ---------------------------------------------------------------------------

/**
 * Xoá tour và mọi dữ liệu phụ thuộc.
 *
 * Thứ tự bắt buộc: `Order` **không** cascade từ `Tour` (FK mặc định là Restrict),
 * nên phải xoá đơn trước. `Review` là `SetNull` nên xoá riêng để không để lại
 * rác trong database test.
 */
export async function cleanupTour(db: Db, tourId: number) {
  await db.review.deleteMany({ where: { tourId } });
  await db.order.deleteMany({ where: { tourId } });
  await db.tour.delete({ where: { id: tourId } });
}
