/**
 * CRUD chuyến khởi hành cho admin (P0).
 *
 * Nghiệp vụ nằm ở đây, page/server action chỉ là wrapper mỏng. Mọi thay đổi đều
 * ghi `admin_audit_log` trong cùng transaction để truy vết.
 *
 * Bất biến quan trọng:
 * - `[tourId, departureDate]` là unique — trùng ngày phải báo lỗi thân thiện,
 *   không để Prisma ném P2002 thô ra UI.
 * - Không được hạ `capacityTotal` xuống dưới `seatsTaken` (sẽ làm âm chỗ trống
 *   và lệch với `UPDATE ... WHERE seats_taken + n <= capacity_total`).
 * - Không xoá chuyến đã có đơn — đơn tham chiếu chuyến, xoá sẽ mất dữ liệu.
 */
import { Prisma, type DepartureStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { dateOnly, parseDateOnly, todayVN } from "@/lib/time";
import { AppError } from "@/server/errors";

export const ADMIN_DEPARTURE_STATUSES = [
  "open",
  "closed",
  "cancelled",
] as const satisfies readonly DepartureStatus[];

export type AdminDepartureStatus = (typeof ADMIN_DEPARTURE_STATUSES)[number];

export function isAdminDepartureStatus(value: unknown): value is AdminDepartureStatus {
  return (
    typeof value === "string" &&
    (ADMIN_DEPARTURE_STATUSES as readonly string[]).includes(value)
  );
}

export const DEPARTURE_STATUS_LABEL: Record<AdminDepartureStatus, string> = {
  open: "Đang mở",
  closed: "Đã đóng",
  cancelled: "Đã huỷ",
};

export type AdminDepartureRow = {
  id: number;
  departureDate: string;
  returnDate: string | null;
  capacityTotal: number;
  seatsTaken: number;
  seatsRemaining: number;
  priceAdult: number | null;
  priceChild: number | null;
  holidaySurcharge: number;
  meetingPoint: string | null;
  status: AdminDepartureStatus;
  note: string | null;
  orderCount: number;
  isPast: boolean;
};

export type AdminTourSummary = {
  id: number;
  slug: string;
  code: string;
  name: string;
  status: string;
  basePriceAdult: number;
  basePriceChild: number;
  departureCount: number;
  openDepartureCount: number;
  nextDepartureDate: string | null;
  seatsTaken: number;
  capacityTotal: number;
};

export type AdminTourDepartures = {
  tour: {
    id: number;
    slug: string;
    code: string;
    name: string;
    durationDays: number;
    durationNights: number;
    basePriceAdult: number;
    basePriceChild: number;
    status: string;
  };
  departures: AdminDepartureRow[];
};

export type DepartureInput = {
  departureDate: string;
  returnDate: string | null;
  capacityTotal: number;
  priceAdult: number | null;
  priceChild: number | null;
  holidaySurcharge: number;
  meetingPoint: string | null;
  note: string | null;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function assertDate(value: string, label: string): string {
  if (!DATE_PATTERN.test(value)) {
    throw new AppError("INVALID_DATE", `${label} không hợp lệ (định dạng YYYY-MM-DD)`, 400);
  }

  const parsed = parseDateOnly(value);
  if (Number.isNaN(parsed.getTime()) || dateOnly(parsed) !== value) {
    throw new AppError("INVALID_DATE", `${label} không tồn tại`, 400);
  }

  return value;
}

function toRow(departure: {
  id: number;
  departureDate: Date;
  returnDate: Date | null;
  capacityTotal: number;
  seatsTaken: number;
  priceAdult: number | null;
  priceChild: number | null;
  holidaySurcharge: number;
  meetingPoint: string | null;
  status: DepartureStatus;
  note: string | null;
  _count?: { orders: number };
}): AdminDepartureRow {
  const departureDate = dateOnly(departure.departureDate);

  return {
    id: departure.id,
    departureDate,
    returnDate: departure.returnDate ? dateOnly(departure.returnDate) : null,
    capacityTotal: departure.capacityTotal,
    seatsTaken: departure.seatsTaken,
    seatsRemaining: Math.max(0, departure.capacityTotal - departure.seatsTaken),
    priceAdult: departure.priceAdult,
    priceChild: departure.priceChild,
    holidaySurcharge: departure.holidaySurcharge,
    meetingPoint: departure.meetingPoint,
    status: departure.status,
    note: departure.note,
    orderCount: departure._count?.orders ?? 0,
    isPast: departureDate < todayVN(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function listAdminTours(): Promise<AdminTourSummary[]> {
  const tours = await prisma.tour.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      slug: true,
      code: true,
      name: true,
      status: true,
      basePriceAdult: true,
      basePriceChild: true,
      departures: {
        orderBy: { departureDate: "asc" },
        select: {
          departureDate: true,
          status: true,
          seatsTaken: true,
          capacityTotal: true,
        },
      },
    },
  });

  const today = todayVN();

  return tours.map((tour) => {
    const upcoming = tour.departures.filter(
      (departure) => dateOnly(departure.departureDate) >= today,
    );

    return {
      id: tour.id,
      slug: tour.slug,
      code: tour.code,
      name: tour.name,
      status: tour.status,
      basePriceAdult: tour.basePriceAdult,
      basePriceChild: tour.basePriceChild,
      departureCount: tour.departures.length,
      openDepartureCount: upcoming.filter((d) => d.status === "open").length,
      nextDepartureDate: upcoming[0] ? dateOnly(upcoming[0].departureDate) : null,
      seatsTaken: upcoming.reduce((sum, d) => sum + d.seatsTaken, 0),
      capacityTotal: upcoming.reduce((sum, d) => sum + d.capacityTotal, 0),
    };
  });
}

export async function getAdminTourDepartures(
  slug: string,
): Promise<AdminTourDepartures> {
  const tour = await prisma.tour.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      code: true,
      name: true,
      durationDays: true,
      durationNights: true,
      basePriceAdult: true,
      basePriceChild: true,
      status: true,
      departures: {
        orderBy: { departureDate: "asc" },
        include: { _count: { select: { orders: true } } },
      },
    },
  });

  if (!tour) {
    throw new AppError("TOUR_NOT_FOUND", "Không tìm thấy tour", 404);
  }

  return {
    tour: {
      id: tour.id,
      slug: tour.slug,
      code: tour.code,
      name: tour.name,
      durationDays: tour.durationDays,
      durationNights: tour.durationNights,
      basePriceAdult: tour.basePriceAdult,
      basePriceChild: tour.basePriceChild,
      status: tour.status,
    },
    departures: tour.departures.map(toRow),
  };
}

function normalizeInput(input: DepartureInput) {
  const departureDate = assertDate(input.departureDate, "Ngày khởi hành");
  const returnDate = input.returnDate
    ? assertDate(input.returnDate, "Ngày về")
    : null;

  if (returnDate && returnDate < departureDate) {
    throw new AppError(
      "INVALID_DATE_RANGE",
      "Ngày về phải sau hoặc bằng ngày khởi hành",
      400,
    );
  }

  if (!Number.isInteger(input.capacityTotal) || input.capacityTotal < 1) {
    throw new AppError("INVALID_CAPACITY", "Số chỗ phải là số nguyên dương", 400);
  }

  if (input.capacityTotal > 200) {
    throw new AppError("INVALID_CAPACITY", "Số chỗ tối đa là 200", 400);
  }

  for (const [value, label] of [
    [input.priceAdult, "Giá người lớn"],
    [input.priceChild, "Giá trẻ em"],
    [input.holidaySurcharge, "Phụ thu lễ"],
  ] as const) {
    if (value !== null && (!Number.isInteger(value) || value < 0)) {
      throw new AppError("INVALID_PRICE", `${label} không hợp lệ`, 400);
    }
  }

  return {
    departureDate,
    returnDate,
    capacityTotal: input.capacityTotal,
    priceAdult: input.priceAdult,
    priceChild: input.priceChild,
    holidaySurcharge: input.holidaySurcharge,
    meetingPoint: input.meetingPoint?.trim() ? input.meetingPoint.trim() : null,
    note: input.note?.trim() ? input.note.trim() : null,
  };
}

export async function createDeparture(
  tourSlug: string,
  input: DepartureInput,
  adminId: number,
): Promise<AdminDepartureRow> {
  const data = normalizeInput(input);

  const tour = await prisma.tour.findUnique({
    where: { slug: tourSlug },
    select: { id: true, slug: true },
  });
  if (!tour) {
    throw new AppError("TOUR_NOT_FOUND", "Không tìm thấy tour", 404);
  }

  const clash = await prisma.tourDeparture.findUnique({
    where: {
      tourId_departureDate: {
        tourId: tour.id,
        departureDate: parseDateOnly(data.departureDate),
      },
    },
    select: { id: true },
  });
  if (clash) {
    throw new AppError(
      "DEPARTURE_EXISTS",
      `Tour đã có chuyến khởi hành ngày ${data.departureDate}`,
      409,
    );
  }

  try {
    const departure = await prisma.$transaction(async (tx) => {
      const created = await tx.tourDeparture.create({
        data: {
          tourId: tour.id,
          departureDate: parseDateOnly(data.departureDate),
          returnDate: data.returnDate ? parseDateOnly(data.returnDate) : null,
          capacityTotal: data.capacityTotal,
          priceAdult: data.priceAdult,
          priceChild: data.priceChild,
          holidaySurcharge: data.holidaySurcharge,
          meetingPoint: data.meetingPoint,
          note: data.note,
          status: "open",
        },
        include: { _count: { select: { orders: true } } },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "departure.create",
          entity: "tour_departure",
          entityId: created.id,
          meta: {
            tourSlug: tour.slug,
            departureDate: data.departureDate,
            capacityTotal: data.capacityTotal,
          },
        },
      });

      return created;
    });

    return toRow(departure);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(
        "DEPARTURE_EXISTS",
        `Tour đã có chuyến khởi hành ngày ${data.departureDate}`,
        409,
      );
    }
    throw error;
  }
}

export async function updateDeparture(
  departureId: number,
  input: DepartureInput,
  adminId: number,
): Promise<AdminDepartureRow> {
  const data = normalizeInput(input);

  const existing = await prisma.tourDeparture.findUnique({
    where: { id: departureId },
    select: { id: true, tourId: true, seatsTaken: true, capacityTotal: true },
  });
  if (!existing) {
    throw new AppError("DEPARTURE_NOT_FOUND", "Không tìm thấy chuyến", 404);
  }

  const clash = await prisma.tourDeparture.findUnique({
    where: {
      tourId_departureDate: {
        tourId: existing.tourId,
        departureDate: parseDateOnly(data.departureDate),
      },
    },
    select: { id: true },
  });
  if (clash && clash.id !== departureId) {
    throw new AppError(
      "DEPARTURE_EXISTS",
      `Tour đã có chuyến khởi hành ngày ${data.departureDate}`,
      409,
    );
  }

  if (data.capacityTotal < existing.seatsTaken) {
    throw new AppError(
      "CAPACITY_BELOW_TAKEN",
      `Đã có ${existing.seatsTaken} khách đặt, không thể hạ số chỗ xuống ${data.capacityTotal}`,
      409,
      { seatsTaken: existing.seatsTaken },
    );
  }

  try {
    const departure = await prisma.$transaction(async (tx) => {
      const updated = await tx.tourDeparture.update({
        where: { id: departureId },
        data: {
          departureDate: parseDateOnly(data.departureDate),
          returnDate: data.returnDate ? parseDateOnly(data.returnDate) : null,
          capacityTotal: data.capacityTotal,
          priceAdult: data.priceAdult,
          priceChild: data.priceChild,
          holidaySurcharge: data.holidaySurcharge,
          meetingPoint: data.meetingPoint,
          note: data.note,
        },
        include: { _count: { select: { orders: true } } },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "departure.update",
          entity: "tour_departure",
          entityId: departureId,
          meta: {
            departureDate: data.departureDate,
            capacityTotal: data.capacityTotal,
            previousCapacityTotal: existing.capacityTotal,
          },
        },
      });

      return updated;
    });

    return toRow(departure);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(
        "DEPARTURE_EXISTS",
        `Tour đã có chuyến khởi hành ngày ${data.departureDate}`,
        409,
      );
    }
    throw error;
  }
}

export async function setDepartureStatus(
  departureId: number,
  status: AdminDepartureStatus,
  adminId: number,
  note?: string | null,
): Promise<AdminDepartureRow> {
  const existing = await prisma.tourDeparture.findUnique({
    where: { id: departureId },
    select: { id: true, status: true },
  });
  if (!existing) {
    throw new AppError("DEPARTURE_NOT_FOUND", "Không tìm thấy chuyến", 404);
  }

  if (existing.status === status) {
    const current = await prisma.tourDeparture.findUniqueOrThrow({
      where: { id: departureId },
      include: { _count: { select: { orders: true } } },
    });
    return toRow(current);
  }

  const departure = await prisma.$transaction(async (tx) => {
    const updated = await tx.tourDeparture.update({
      where: { id: departureId },
      data: { status },
      include: { _count: { select: { orders: true } } },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "departure.status",
        entity: "tour_departure",
        entityId: departureId,
        meta: {
          from: existing.status,
          to: status,
          note: note?.trim() ? note.trim().slice(0, 500) : null,
        },
      },
    });

    return updated;
  });

  return toRow(departure);
}

export async function deleteDeparture(
  departureId: number,
  adminId: number,
): Promise<void> {
  const existing = await prisma.tourDeparture.findUnique({
    where: { id: departureId },
    select: {
      id: true,
      departureDate: true,
      _count: { select: { orders: true } },
    },
  });
  if (!existing) {
    throw new AppError("DEPARTURE_NOT_FOUND", "Không tìm thấy chuyến", 404);
  }

  if (existing._count.orders > 0) {
    throw new AppError(
      "DEPARTURE_HAS_ORDERS",
      `Chuyến đã có ${existing._count.orders} đơn, hãy chuyển sang "Đã huỷ" thay vì xoá`,
      409,
      { orderCount: existing._count.orders },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.tourDeparture.delete({ where: { id: departureId } });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "departure.delete",
        entity: "tour_departure",
        entityId: departureId,
        meta: { departureDate: dateOnly(existing.departureDate) },
      },
    });
  });
}
