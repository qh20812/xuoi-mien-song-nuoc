/**
 * Tạo đơn giữ chỗ.
 *
 * Quy tắc:
 * - Mỗi khách (người lớn + trẻ em + em bé) chiếm 1 chỗ.
 * - Em bé miễn phí.
 * - Không thanh toán online: đơn ở trạng thái "new" và giữ chỗ `holdHours` giờ.
 * - Giá do server tính từ ngày khởi hành + tour, không nhận từ client.
 * - `clientRequestId` bảo đảm bấm gửi 2 lần / retry mạng không tạo 2 đơn.
 */
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getBookingSettings } from "@/lib/settings";
import { hashIp } from "@/lib/http";
import {
  addHours,
  daysUntilDeparture,
} from "@/lib/time";
import {
  createOrderSchema,
  type CreateOrderInput,
  type PassengerInput,
} from "@/lib/validation/order";
import { allocateOrderCode } from "@/server/booking/code";
import { ORDER_INCLUDE, toOrderDto, type OrderDto } from "@/server/booking/dto";
import { BookingError } from "@/server/booking/errors";
import { calculatePricing } from "@/server/booking/pricing";

export type CreateOrderContext = {
  ip?: string;
  userAgent?: string;
};

type PassengerCreate = {
  fullName: string | null;
  type: "adult" | "child" | "infant";
  birthYear: number | null;
  note: string | null;
  sortOrder: number;
};

function buildPassengers(input: CreateOrderInput): PassengerCreate[] {
  const fallbackType = (index: number): PassengerCreate["type"] => {
    if (index < input.adults) return "adult";
    if (index < input.adults + input.children) return "child";
    return "infant";
  };

  if (input.passengers && input.passengers.length > 0) {
    return input.passengers.map((passenger: PassengerInput, index: number) => ({
      fullName: passenger.fullName,
      type: passenger.type ?? fallbackType(index),
      birthYear: passenger.birthYear ?? null,
      note: passenger.note,
      sortOrder: index,
    }));
  }

  const rows: PassengerCreate[] = [];
  for (let index = 0; index < input.adults; index++) {
    rows.push({
      fullName: null,
      type: "adult",
      birthYear: null,
      note: null,
      sortOrder: rows.length,
    });
  }
  for (let index = 0; index < input.children; index++) {
    rows.push({
      fullName: null,
      type: "child",
      birthYear: null,
      note: null,
      sortOrder: rows.length,
    });
  }
  for (let index = 0; index < input.infants; index++) {
    rows.push({
      fullName: null,
      type: "infant",
      birthYear: null,
      note: null,
      sortOrder: rows.length,
    });
  }
  return rows;
}

function isP2002On(error: unknown, column: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  const fields = Array.isArray(target) ? target.map(String) : [String(target ?? "")];
  return fields.some((field) => field.includes(column));
}

function isRetryableTransactionError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  return error.code === "P2034" || isP2002On(error, "code");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findExistingOrder(clientRequestId: string): Promise<{
  order: { phone: string };
  dto: OrderDto;
} | null> {
  const existing = await prisma.order.findUnique({
    where: { clientRequestId },
    include: ORDER_INCLUDE,
  });
  if (!existing) return null;
  const settings = await getBookingSettings();
  return { order: existing, dto: toOrderDto(existing, settings) };
}

export async function createOrder(
  rawInput: unknown,
  context: CreateOrderContext = {},
): Promise<OrderDto> {
  const input = createOrderSchema.parse(rawInput);
  const settings = await getBookingSettings();

  // 1. Idempotency: cùng clientRequestId -> trả lại đơn cũ, không giữ thêm chỗ.
  const existing = await prisma.order.findUnique({
    where: { clientRequestId: input.clientRequestId },
    include: ORDER_INCLUDE,
  });
  if (existing) {
    if (existing.phone !== input.phone) {
      throw new BookingError("IDEMPOTENCY_MISMATCH", "Yêu cầu không hợp lệ", 409);
    }
    return toOrderDto(existing, settings);
  }

  // 2. Đọc ngày khởi hành + tour.
  const departure = await prisma.tourDeparture.findUnique({
    where: { id: input.departureId },
    include: { tour: true },
  });

  if (!departure) {
    throw new BookingError("DEPARTURE_NOT_FOUND", "Không tìm thấy ngày khởi hành", 404);
  }
  if (departure.status !== "open" || departure.tour.status !== "published") {
    throw new BookingError(
      "DEPARTURE_CLOSED",
      "Ngày khởi hành này đã đóng, vui lòng chọn ngày khác",
      409,
    );
  }

  const daysLeft = daysUntilDeparture(departure.departureDate);
  if (daysLeft < settings.minDaysAhead) {
    throw new BookingError(
      "DEPARTURE_TOO_SOON",
      `Ngày khởi hành phải còn ít nhất ${settings.minDaysAhead} ngày để đặt chỗ`,
      409,
      { minDaysAhead: settings.minDaysAhead },
    );
  }

  const seats = input.adults + input.children + input.infants;
  if (seats > settings.maxGuestsPerOrder) {
    throw new BookingError(
      "TOO_MANY_GUESTS",
      `Mỗi đơn tối đa ${settings.maxGuestsPerOrder} khách`,
      400,
      { maxGuestsPerOrder: settings.maxGuestsPerOrder },
    );
  }

  const pricing = calculatePricing(
    {
      basePriceAdult: departure.tour.basePriceAdult,
      basePriceChild: departure.tour.basePriceChild,
      priceAdult: departure.priceAdult,
      priceChild: departure.priceChild,
      holidaySurcharge: departure.holidaySurcharge,
    },
    { adults: input.adults, children: input.children },
  );

  const now = new Date();
  const holdExpiresAt = addHours(now, settings.holdHours);
  const lookupToken = randomBytes(18).toString("base64url");
  const passengers = buildPassengers(input);
  const ipHash =
    context.ip && context.ip !== "unknown" ? hashIp(context.ip) : null;
  const userAgent = context.userAgent ? context.userAgent.slice(0, 500) : null;

  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      const order = await prisma.$transaction(
        async (tx) => {
          // Giữ chỗ nguyên tử: chỉ thành công nếu còn đủ chỗ và ngày còn mở.
          const updated = await tx.$executeRaw`
            UPDATE tour_departures
               SET seats_taken = seats_taken + ${seats}
             WHERE id = ${departure.id}
               AND status = 'open'
               AND seats_taken + ${seats} <= capacity_total`;

          if (updated === 0) {
            const current = await tx.tourDeparture.findUnique({
              where: { id: departure.id },
              select: { status: true, seatsTaken: true, capacityTotal: true },
            });
            if (!current || current.status !== "open") {
              throw new BookingError(
                "DEPARTURE_CLOSED",
                "Ngày khởi hành này đã đóng, vui lòng chọn ngày khác",
                409,
              );
            }
            throw new BookingError(
              "DEPARTURE_FULL",
              "Ngày khởi hành này không còn đủ chỗ, vui lòng chọn ngày khác",
              409,
              { remaining: Math.max(0, current.capacityTotal - current.seatsTaken) },
            );
          }

          const { code } = await allocateOrderCode(tx);

          return tx.order.create({
            data: {
              code,
              tourId: departure.tourId,
              departureId: departure.id,
              contactName: input.contactName,
              phone: input.phone,
              email: input.email,
              pickupPoint: input.pickupPoint,
              adults: input.adults,
              children: input.children,
              infants: input.infants,
              unitPriceAdult: pricing.unitPriceAdult,
              unitPriceChild: pricing.unitPriceChild,
              surcharge: pricing.surcharge,
              totalAmount: pricing.totalAmount,
              status: "new",
              holdExpiresAt,
              clientRequestId: input.clientRequestId,
              source: "web",
              customerNote: input.customerNote,
              lookupToken,
              ipHash,
              userAgent,
              passengers: { create: passengers },
              statusHistory: {
                create: {
                  toStatus: "new",
                  note: "Đơn giữ chỗ được tạo từ website",
                },
              },
            },
            include: ORDER_INCLUDE,
          });
        },
        {
          timeout: 20_000,
          maxWait: 10_000,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );

      return toOrderDto(order, settings);
    } catch (error) {
      if (error instanceof BookingError) throw error;

      // Hai request cùng clientRequestId: request thua trả về đơn đã tạo.
      if (isP2002On(error, "client_request_id")) {
        const existingOrder = await findExistingOrder(input.clientRequestId);
        if (existingOrder) {
          if (existingOrder.order.phone !== input.phone) {
            throw new BookingError("IDEMPOTENCY_MISMATCH", "Yêu cầu không hợp lệ", 409);
          }
          return existingOrder.dto;
        }
      }

      if (isRetryableTransactionError(error) && attempt < 3) {
        await sleep(40 * attempt + Math.floor(Math.random() * 60));
        continue;
      }

      if (isRetryableTransactionError(error)) {
        throw new BookingError(
          "CONFLICT",
          "Hệ thống đang bận, vui lòng thử lại sau ít giây",
          503,
        );
      }

      throw error;
    }
  }
}
