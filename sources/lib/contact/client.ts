/**
 * Adapter gửi lời nhắn liên hệ.
 *
 * Trước đây giả lập thành công sau 700ms mà không lưu gì; nay gọi
 * `POST /api/contact` để ghi vào bảng `contact_messages`.
 */
import { apiRequest } from "@/lib/api/client";
import type { ContactRequest } from "@/lib/contracts/contact";

export type ContactSubmitResult = {
  ok: true;
};

export async function submitContactMessage(
  input: ContactRequest,
): Promise<ContactSubmitResult> {
  return apiRequest<ContactSubmitResult>("/api/contact", {
    method: "POST",
    body: input,
  });
}
