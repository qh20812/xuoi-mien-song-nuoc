/**
 * Khách gửi đánh giá (D8).
 *
 * Hai chế độ:
 * 1. **Có `orderCode` + `phone`** → phải khớp một đơn `completed`; gắn `orderId`
 *    (unique) và `tourId` ⇒ admin thấy huy hiệu "đã đi tour".
 * 2. **Không có** → đánh giá chung hoặc theo `tourSlug`, không xác thực.
 *
 * Chống dò đơn: mã sai và SĐT sai trả **cùng một** `ORDER_NOT_FOUND` (giống B3).
 * `reviews.phone` được lưu để đối soát nhưng **không** trả ra ngoài DTO nào.
 */
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { createReviewSchema } from "@/lib/validation/review";
import { AppError } from "@/server/errors";

export type CreatedReview = {
  id: number;
};

export async function createReview(rawInput: unknown): Promise<CreatedReview> {
  const input = createReviewSchema.parse(rawInput);

  // Honeypot: người thật không thấy field này.
  if (input.website && input.website.trim() !== "") {
    throw new AppError("SPAM", "Yêu cầu không hợp lệ", 400);
  }

  let tourId: number | null = null;
  let orderId: number | null = null;

  if (input.orderCode && input.phone) {
    const order = await prisma.order.findFirst({
      where: {
        code: input.orderCode,
        phone: input.phone,
        status: "completed",
      },
      select: { id: true, tourId: true },
    });

    if (!order) {
      throw new AppError(
        "ORDER_NOT_FOUND",
        "Mã đơn hoặc số điện thoại không khớp đơn đã hoàn thành",
        404,
      );
    }

    orderId = order.id;
    tourId = order.tourId;
  } else if (input.tourSlug) {
    const tour = await prisma.tour.findUnique({
      where: { slug: input.tourSlug },
      select: { id: true },
    });

    if (!tour) {
      throw new AppError("TOUR_NOT_FOUND", "Không tìm thấy tour", 404);
    }
    tourId = tour.id;
  }

  // Pre-check để không in `prisma:error` cho một thao tác bình thường (khách
  // bấm gửi lần 2). Nhánh P2002 bên dưới vẫn giữ để chống race.
  if (orderId !== null) {
    const existing = await prisma.review.findUnique({
      where: { orderId },
      select: { id: true },
    });
    if (existing) {
      throw new AppError("REVIEW_EXISTS", "Đơn này đã được đánh giá rồi", 409);
    }
  }

  try {
    const created = await prisma.review.create({
      data: {
        tourId,
        orderId,
        authorName: input.authorName,
        phone: input.phone,
        rating: input.rating,
        comment: input.comment,
        status: "pending",
      },
      select: { id: true },
    });

    return { id: created.id };
  } catch (error) {
    // `reviews.order_id` là @unique → một đơn chỉ được đánh giá một lần.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("REVIEW_EXISTS", "Đơn này đã được đánh giá rồi", 409);
    }
    throw error;
  }
}
