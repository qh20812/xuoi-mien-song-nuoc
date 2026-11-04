import type { ContactRequest } from "@/lib/contracts/contact";

export type ContactSubmitResult = {
  ok: true;
};

/**
 * Adapter frontend-first. Khi nối backend, thay phần thân bằng POST /api/contact.
 */
export async function submitContactMessage(
  input: ContactRequest,
): Promise<ContactSubmitResult> {
  void input;
  await new Promise((resolve) => setTimeout(resolve, 700));
  return { ok: true };
}
