"use server";

import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/session";
import {
  updateOrderByAdmin,
  type AdminOrderAction,
} from "@/server/booking/admin-update-order";
import { BookingError } from "@/server/booking/errors";

const ACTIONS: AdminOrderAction[] = ["pending", "confirm", "complete", "cancel"];

export async function updateOrderAction(formData: FormData) {
  const admin = await requireAdminPage("/admin/orders");

  const orderId = Number(formData.get("orderId"));
  const action = String(formData.get("action") ?? "") as AdminOrderAction;
  const reason = String(formData.get("reason") ?? "").trim() || undefined;

  if (!Number.isInteger(orderId) || orderId <= 0 || !ACTIONS.includes(action)) {
    redirect("/admin/orders");
  }

  try {
    await updateOrderByAdmin(orderId, action, admin.id, reason);
  } catch (error) {
    if (error instanceof BookingError) {
      redirect(`/admin/orders/${orderId}?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }

  redirect(`/admin/orders/${orderId}`);
}
