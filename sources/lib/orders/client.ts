import { normalizePhone } from "@/lib/booking/validation";
import type {
  OrderCancelInput,
  OrderLookupInput,
  PublicOrder,
} from "@/lib/contracts/order";
import {
  createMockOrder,
  mockOrderCredentials,
  setMockCancelled,
} from "@/lib/fixtures/order";

export class OrderApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "ERROR") {
    super(message);
    this.name = "OrderApiError";
    this.status = status;
    this.code = code;
  }
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function matchesMockOrder(input: OrderLookupInput) {
  const expected = mockOrderCredentials();
  return (
    input.code.trim().toUpperCase() === expected.code &&
    normalizePhone(input.phone) === expected.phone
  );
}

/**
 * Adapter frontend-first. Khi nối backend, thay phần thân bằng POST /api/orders/lookup.
 */
export async function lookupOrder(input: OrderLookupInput): Promise<PublicOrder> {
  await wait(500);

  if (!matchesMockOrder(input)) {
    throw new OrderApiError(
      "Không tìm thấy đơn phù hợp với mã đơn và số điện thoại đã nhập.",
      404,
      "ORDER_NOT_FOUND",
    );
  }

  return createMockOrder();
}

/**
 * Adapter frontend-first. Khi nối backend, thay phần thân bằng POST /api/orders/cancel.
 */
export async function cancelOrder(input: OrderCancelInput): Promise<PublicOrder> {
  await wait(600);

  if (!matchesMockOrder(input)) {
    throw new OrderApiError(
      "Không tìm thấy đơn phù hợp với mã đơn và số điện thoại đã nhập.",
      404,
      "ORDER_NOT_FOUND",
    );
  }

  const current = createMockOrder();
  if (current.status === "cancelled") {
    return { ...current, alreadyCancelled: true };
  }

  if (!current.cancellation.canCancel) {
    throw new OrderApiError(
      "Đã quá hạn tự huỷ. Vui lòng liên hệ hotline để được hỗ trợ.",
      409,
      "CANCEL_TOO_LATE",
    );
  }

  setMockCancelled(true);
  return createMockOrder();
}
