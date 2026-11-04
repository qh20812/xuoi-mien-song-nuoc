/**
 * Tra cứu đơn bằng mã đơn + số điện thoại.
 *
 * Luôn trả cùng một lỗi chung khi không khớp để tránh dò mã đơn / số điện thoại.
 */
import { timingSafeEqual } from "node:crypto";
import prisma from "@/lib/prisma";
import { getBookingSettings } from "@/lib/settings";
import { lookupOrderSchema } from "@/lib/validation/order";
import { ORDER_INCLUDE, toOrderDto, type OrderDto } from "@/server/booking/dto";
import { BookingError } from "@/server/booking/errors";

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

const NOT_FOUND_MESSAGE =
  "Không tìm thấy đơn phù hợp với mã đơn và số điện thoại đã nhập";

export async function lookupOrder(rawInput: unknown): Promise<OrderDto> {
  const input = lookupOrderSchema.parse(rawInput);

  const order = await prisma.order.findUnique({
    where: { code: input.code },
    include: ORDER_INCLUDE,
  });

  if (!order || !safeEqual(order.phone, input.phone)) {
    throw new BookingError("ORDER_NOT_FOUND", NOT_FOUND_MESSAGE, 404);
  }

  const settings = await getBookingSettings();
  return toOrderDto(order, settings);
}
