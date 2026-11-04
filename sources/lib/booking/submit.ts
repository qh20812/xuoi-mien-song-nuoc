import type { BookingRequestInput } from "@/lib/contracts/booking";

export type SubmitBookingResult = {
  code: string;
  holdExpiresAt: string;
};

/**
 * Adapter tạm cho giai đoạn frontend-first.
 * Khi nối backend, thay phần thân bằng POST /api/orders với cùng input.
 */
export async function submitBookingRequest(
  input: BookingRequestInput,
  holdHours: number,
): Promise<SubmitBookingResult> {
  void input;
  await new Promise((resolve) => setTimeout(resolve, 800));

  const year = new Date().getFullYear();
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  const holdExpiresAt = new Date(
    Date.now() + holdHours * 60 * 60 * 1000,
  ).toISOString();

  return {
    code: `XMSN-${year}-${suffix}`,
    holdExpiresAt,
  };
}
