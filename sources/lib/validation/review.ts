/**
 * Schema đầu vào cho API đánh giá của khách.
 *
 * `orderCode` + `phone` là **tùy chọn**: có thì hệ thống đối chiếu với đơn đã
 * hoàn thành để gắn huy hiệu "đã đi tour"; không có thì là đánh giá chung.
 * `website` là honeypot — bot điền vào là bị loại.
 */
import { z } from "zod";
import { normalizePhone } from "@/lib/validation/order";

const optionalPhone = z
  .preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z
      .string()
      .trim()
      .min(8, "Số điện thoại quá ngắn")
      .max(20, "Số điện thoại quá dài")
      .transform(normalizePhone)
      .refine((value) => /^0\d{9}$/.test(value), "Số điện thoại không hợp lệ")
      .optional(),
  )
  .transform((value) => value ?? null);

const optionalCode = z
  .preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z
      .string()
      .trim()
      .max(24, "Mã đơn quá dài")
      .transform((value) => value.toUpperCase())
      .optional(),
  )
  .transform((value) => value ?? null);

export const createReviewSchema = z
  .object({
    authorName: z
      .string()
      .trim()
      .min(2, "Vui lòng nhập tên hiển thị")
      .max(120, "Tên tối đa 120 ký tự"),
    rating: z.coerce
      .number()
      .int("Điểm phải là số nguyên")
      .min(1, "Vui lòng chọn số sao")
      .max(5, "Điểm tối đa là 5"),
    comment: z
      .string()
      .trim()
      .min(10, "Vui lòng chia sẻ ít nhất 10 ký tự")
      .max(1000, "Nội dung tối đa 1.000 ký tự"),
    orderCode: optionalCode,
    phone: optionalPhone,
    tourSlug: z
      .preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
        z.string().trim().max(160).optional(),
      )
      .transform((value) => value ?? null),
    /** Honeypot: phải để trống. */
    website: z.string().max(200).optional(),
  })
  .strict();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
