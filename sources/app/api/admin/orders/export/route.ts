import { connection } from "next/server";
import { statusLabel } from "@/lib/booking/status-labels";
import { toCsv } from "@/lib/csv";
import { requireCapabilityApi } from "@/lib/auth/session";
import { handleApiError } from "@/lib/http";
import {
  isAdminOrderAssignee,
  isAdminOrderStatus,
  listAdminOrdersForExport,
} from "@/server/booking/admin-queries";
import { todayVN } from "@/lib/time";

const HEADER = [
  "Mã đơn",
  "Trạng thái",
  "Mã tour",
  "Tour",
  "Ngày khởi hành",
  "Khách",
  "Điện thoại",
  "Email",
  "Người lớn",
  "Trẻ em",
  "Em bé",
  "Tổng tiền (đ)",
  "Tạo lúc",
];

export async function GET(request: Request) {
  await connection();

  try {
    const admin = await requireCapabilityApi("orders:export");

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const status = isAdminOrderStatus(statusParam) ? statusParam : undefined;
    const assigneeParam = url.searchParams.get("assignee");
    const assignee = isAdminOrderAssignee(assigneeParam) ? assigneeParam : undefined;
    const q = url.searchParams.get("q")?.trim() || undefined;

    const rows = await listAdminOrdersForExport({
      status,
      q,
      assignee,
      viewerId: admin.id,
    });

    const csv = toCsv([
      HEADER,
      ...rows.map((row) => [
        row.code,
        statusLabel(row.status),
        row.tourCode,
        row.tourName,
        row.departureDate,
        row.contactName,
        row.phone,
        row.email,
        row.adults,
        row.children,
        row.infants,
        row.totalAmount,
        row.createdAt.slice(0, 16).replace("T", " "),
      ]),
    ]);

    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="don-dat-cho-${todayVN()}.csv"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/orders/export");
  }
}
