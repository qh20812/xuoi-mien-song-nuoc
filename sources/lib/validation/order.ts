/**
 * Schema đầu vào cho API đặt chỗ / tra cứu / huỷ.
 *
 * Giá, tourId và trạng thái KHÔNG nhận từ client — server tự tính từ
 * ngày khởi hành và tour trong database.
 */
import { z } from "zod";

/** Chuẩn hoá số điện thoại Việt Nam về dạng 0xxxxxxxxx. */
export function normalizePhone(raw: string): string {
  let phone = raw.replace(/[\s.\-()]/g, "");
  if (phone.startsWith("+84")) phone = `0${phone.slice(3)}`;
  else if (phone.startsWith("84") && phone.length === 11) phone = `0${phone.slice(2)}`;
  return phone;
}

const phoneSchema = z
  .string()
  .trim()
  .min(8, "Số điện thoại quá ngắn")
  .max(20, "Số điện thoại quá dài")
  .transform(normalizePhone)
  .refine((value) => /^0\d{9}$/.test(value), "Số điện thoại không hợp lệ");

const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().email("Email không hợp lệ").max(160).optional(),
).transform((value) => (value ? value.toLowerCase() : null));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Nội dung tối đa ${max} ký tự`)
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null));

const passengerSchema = z
  .object({
    fullName: optionalText(120),
    type: z.enum(["adult", "child", "infant"]).optional(),
    birthYear: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear())
      .optional()
      .nullable(),
    note: optionalText(255),
  })
  .strict();

export const createOrderSchema = z
  .object({
    departureId: z.coerce
      .number()
      .int("Ngày khởi hành không hợp lệ")
      .positive("Ngày khởi hành không hợp lệ"),
    contactName: z
      .string()
      .trim()
      .min(2, "Vui lòng nhập họ tên")
      .max(120, "Họ tên tối đa 120 ký tự"),
    phone: phoneSchema,
    email: optionalEmail,
    pickupPoint: optionalText(255),
    customerNote: optionalText(2000),
    adults: z.coerce
      .number()
      .int()
      .min(1, "Cần ít nhất 1 người lớn")
      .max(50, "Số khách quá lớn"),
    children: z.coerce.number().int().min(0).max(50).default(0),
    infants: z.coerce.number().int().min(0).max(50).default(0),
    clientRequestId: z
      .string()
      .trim()
      .uuid("Mã yêu cầu không hợp lệ")
      .transform((value) => value.toLowerCase()),
    passengers: z.array(passengerSchema).max(50).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const seats = value.adults + value.children + value.infants;
    if (value.infants > value.adults + value.children + 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["infants"],
        message: "Số em bé không hợp lý so với người lớn/trẻ em",
      });
    }
    if (value.passengers && value.passengers.length !== seats) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passengers"],
        message: `Cần thông tin cho đủ ${seats} khách`,
      });
    }
  });

export const orderCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^XMSN-\d{4}-\d{4,8}$/, "Mã đơn không hợp lệ");

export const lookupOrderSchema = z
  .object({
    code: orderCodeSchema,
    phone: phoneSchema,
  })
  .strict();

export const cancelOrderSchema = z
  .object({
    code: orderCodeSchema,
    phone: phoneSchema,
    reason: optionalText(500),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type LookupOrderInput = z.infer<typeof lookupOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type PassengerInput = z.infer<typeof passengerSchema>;
