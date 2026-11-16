/**
 * Schema đầu vào cho API liên hệ.
 *
 * Khớp với `ContactRequest` mà `lib/contact/client.ts` gửi lên.
 * `subject` là **nhãn tiếng Việt** của chủ đề (xem `lib/contact/topics.ts`),
 * không phải slug.
 */
import { z } from "zod";
import { normalizePhone } from "@/lib/validation/order";

const phoneSchema = z
  .string()
  .trim()
  .min(8, "Số điện thoại quá ngắn")
  .max(20, "Số điện thoại quá dài")
  .transform(normalizePhone)
  .refine((value) => /^0\d{9}$/.test(value), "Số điện thoại không hợp lệ");

const optionalEmail = z
  .preprocess(
    (value) =>
      value === null || (typeof value === "string" && value.trim() === "")
        ? undefined
        : value,
    z.string().trim().email("Email không hợp lệ").max(160).optional(),
  )
  .transform((value) => (value ? value.toLowerCase() : null));

export const createContactMessageSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Vui lòng nhập họ tên")
      .max(120, "Họ tên tối đa 120 ký tự"),
    phone: phoneSchema,
    email: optionalEmail,
    subject: z
      .string()
      .trim()
      .min(1, "Vui lòng chọn chủ đề")
      .max(255, "Chủ đề tối đa 255 ký tự"),
    message: z
      .string()
      .trim()
      .min(10, "Vui lòng mô tả nội dung cần hỗ trợ")
      .max(2000, "Nội dung tối đa 2.000 ký tự"),
  })
  .strict();

export type CreateContactMessageInput = z.infer<
  typeof createContactMessageSchema
>;
