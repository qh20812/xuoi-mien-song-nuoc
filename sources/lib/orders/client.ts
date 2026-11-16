/**
 * Adapter tra cứu / huỷ đơn của khách.
 *
 * Trước đây trả dữ liệu giả từ `lib/fixtures/order.ts`; nay gọi API thật:
 *   POST /api/orders/lookup  { code, phone }
 *   POST /api/orders/cancel  { code, phone, reason? }
 *
 * `OrderApiError` giữ nguyên shape cũ để `components/lookup/order-lookup.tsx`
 * không phải sửa.
 */
import { apiRequest, isApiError } from "@/lib/api/client";
import type {
  OrderCancelInput,
  OrderLookupInput,
  PublicOrder,
} from "@/lib/contracts/order";

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

type OrderResponse = { ok: true; order: PublicOrder };

function rethrowAsOrderApiError(error: unknown): never {
  if (isApiError(error)) {
    throw new OrderApiError(error.message, error.status, error.code);
  }
  throw error;
}

export async function lookupOrder(
  input: OrderLookupInput,
): Promise<PublicOrder> {
  try {
    const payload = await apiRequest<OrderResponse>("/api/orders/lookup", {
      method: "POST",
      body: input,
    });
    return payload.order;
  } catch (error) {
    return rethrowAsOrderApiError(error);
  }
}

export async function cancelOrder(
  input: OrderCancelInput,
): Promise<PublicOrder> {
  try {
    const payload = await apiRequest<OrderResponse>("/api/orders/cancel", {
      method: "POST",
      body: input,
    });
    return payload.order;
  } catch (error) {
    return rethrowAsOrderApiError(error);
  }
}
