import { connection } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/session";
import { handleApiError, jsonResponse } from "@/lib/http";
import {
  ADMIN_ORDER_STATUSES,
  listAdminOrders,
  type AdminOrderStatus,
} from "@/server/booking/admin-queries";


const querySchema = z.object({
  status: z.enum([...ADMIN_ORDER_STATUSES]).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

export async function GET(request: Request) {
  await connection();
  try {
    await requireAdminApi();

    const url = new URL(request.url);
    const query = querySchema.parse({
      status: url.searchParams.get("status") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      page: url.searchParams.get("page") ?? 1,
    });

    const result = await listAdminOrders({
      status: query.status as AdminOrderStatus | undefined,
      q: query.q,
      page: query.page,
    });

    return jsonResponse({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/orders");
  }
}
