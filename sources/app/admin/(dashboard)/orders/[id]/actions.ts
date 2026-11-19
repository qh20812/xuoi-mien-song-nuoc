"use server";

import { redirect } from "next/navigation";
import { requireCapabilityAction } from "@/lib/auth/session";
import { isAppError } from "@/server/errors";
import {
  assignOrder,
  updateOrderAdminNote,
} from "@/server/booking/admin-order-notes";
import {
  updateOrderByAdmin,
  type AdminOrderAction,
} from "@/server/booking/admin-update-order";
import { BookingError } from "@/server/booking/errors";

const ACTIONS: AdminOrderAction[] = ["pending", "confirm", "complete", "cancel"];

export async function updateOrderAction(formData: FormData) {
  const admin = await requireCapabilityAction("orders:write", "/admin/orders");

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

function orderPath(orderId: number, error?: unknown): string {
  if (error === undefined) return `/admin/orders/${orderId}`;
  const message = isAppError(error) ? error.message : "Không lưu được, vui lòng thử lại";
  return `/admin/orders/${orderId}?error=${encodeURIComponent(message)}`;
}

export async function saveAdminNoteAction(formData: FormData) {
  const admin = await requireCapabilityAction("orders:write", "/admin/orders");

  const orderId = Number(formData.get("orderId"));
  const note = String(formData.get("adminNote") ?? "");

  if (!Number.isInteger(orderId) || orderId <= 0) redirect("/admin/orders");

  let target: string;
  try {
    await updateOrderAdminNote(orderId, note, admin.id);
    target = orderPath(orderId);
  } catch (error) {
    target = orderPath(orderId, error);
  }

  redirect(target);
}

export async function assignOrderAction(formData: FormData) {
  const admin = await requireCapabilityAction("orders:write", "/admin/orders");

  const orderId = Number(formData.get("orderId"));
  const raw = String(formData.get("assigneeId") ?? "").trim();
  const assigneeId = raw === "" ? null : Number(raw);

  if (!Number.isInteger(orderId) || orderId <= 0) redirect("/admin/orders");
  if (assigneeId !== null && (!Number.isInteger(assigneeId) || assigneeId <= 0)) {
    redirect(orderPath(orderId, new Error("Người phụ trách không hợp lệ")));
  }

  let target: string;
  try {
    await assignOrder(orderId, assigneeId, admin.id);
    target = orderPath(orderId);
  } catch (error) {
    target = orderPath(orderId, error);
  }

  redirect(target);
}
