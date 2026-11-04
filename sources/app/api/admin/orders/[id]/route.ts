import { connection } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/session";
import { handleApiError, jsonResponse, readJsonLimited } from "@/lib/http";
import {
  getAdminOrderById,
  updateOrderByAdmin,
} from "@/server/booking/admin-update-order";
import { BookingError } from "@/server/booking/errors";


const patchSchema = z
  .object({
    action: z.enum(["pending", "confirm", "complete", "cancel"]),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BookingError("ORDER_NOT_FOUND", "Không tìm thấy đơn", 404);
  }
  return id;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await connection();
  try {
    await requireAdminApi();
    const { id } = await context.params;
    const order = await getAdminOrderById(parseId(id));
    return jsonResponse({ ok: true, order });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/orders/[id]");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminApi();
    const { id } = await context.params;
    const orderId = parseId(id);
    const body = patchSchema.parse(await readJsonLimited(request));

    const order = await updateOrderByAdmin(orderId, body.action, admin.id, body.reason);
    return jsonResponse({ ok: true, order });
  } catch (error) {
    return handleApiError(error, "PATCH /api/admin/orders/[id]");
  }
}
