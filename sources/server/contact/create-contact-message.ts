/**
 * Ghi lời nhắn liên hệ của khách vào `contact_messages`.
 *
 * Không gửi email hay thông báo đẩy — admin đọc trực tiếp trong database.
 * Trang `/admin/messages` (đọc + đánh dấu `read`/`replied`) sẽ làm ở phase sau.
 */
import prisma from "@/lib/prisma";
import { createContactMessageSchema } from "@/lib/validation/contact";

export type CreatedContactMessage = {
  id: number;
  createdAt: string;
};

export async function createContactMessage(
  rawInput: unknown,
): Promise<CreatedContactMessage> {
  const input = createContactMessageSchema.parse(rawInput);

  const created = await prisma.contactMessage.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      subject: input.subject,
      message: input.message,
    },
    select: { id: true, createdAt: true },
  });

  return { id: created.id, createdAt: created.createdAt.toISOString() };
}
