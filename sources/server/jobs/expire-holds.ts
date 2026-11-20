/**
 * Nghiệp vụ "hết hạn giữ chỗ" — nguồn sự thật duy nhất cho cả CLI và cron route.
 *
 * Quy tắc:
 * - Chỉ đơn `status = "new"` mới hết hạn tự động; admin chuyển sang
 *   pending/confirmed thì không bị huỷ.
 * - Mỗi đơn xử lý trong một transaction: `UPDATE ... WHERE status = 'new'` có
 *   điều kiện (idempotent) → nhả chỗ → ghi lịch sử. Hai tiến trình chạy song song
 *   không nhả chỗ hai lần.
 */
import prisma from "@/lib/prisma";
import { getBookingSettings } from "@/server/settings/get-booking-settings";

export const DEFAULT_BATCH_SIZE = 100;
export const DEFAULT_MAX_ORDERS = 1000;
const MAX_BATCH_SIZE = 500;
const MAX_REPORTED_ORDERS = 100;

export type ExpireHoldsOptions = {
  now?: Date;
  dryRun?: boolean;
  batchSize?: number;
  maxOrders?: number;
};

export type ExpireHoldsOrder = {
  code: string;
  seats: number;
  holdExpiresAt: string | null;
  status: "expired" | "skipped";
};

export type ExpireHoldsResult = {
  scanned: number;
  expired: number;
  skipped: number;
  seatsReleased: number;
  remaining: number;
  orders: ExpireHoldsOrder[];
};

/** Ghi chú lịch sử đọc đúng số giờ admin cấu hình, không hardcode 24. */
export function holdExpiryNote(holdHours: number): string {
  return `Tự động hết hạn giữ chỗ sau ${holdHours} giờ`;
}

function clampInt(value: number | undefined, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value as number)));
}

type ExpiringOrder = {
  id: number;
  code: string;
  departureId: number;
  adults: number;
  children: number;
  infants: number;
  holdExpiresAt: Date | null;
};

async function expireOne(
  order: ExpiringOrder,
  seats: number,
  now: Date,
  note: string,
): Promise<"expired" | "skipped"> {
  return prisma.$transaction(
    async (tx) => {
      const changed = await tx.$executeRaw`
        UPDATE orders
           SET status = 'expired',
               updated_at = NOW(3)
         WHERE id = ${order.id}
           AND status = 'new'
           AND hold_expires_at IS NOT NULL
           AND hold_expires_at < ${now}`;

      if (changed === 0) return "skipped";

      await tx.$executeRaw`
        UPDATE tour_departures
           SET seats_taken = GREATEST(CAST(seats_taken AS SIGNED) - ${seats}, 0)
         WHERE id = ${order.departureId}`;

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: "new",
          toStatus: "expired",
          note,
        },
      });

      return "expired";
    },
    { timeout: 15000, maxWait: 10000 },
  );
}

export async function expireHolds(
  options: ExpireHoldsOptions = {},
): Promise<ExpireHoldsResult> {
  const now = options.now ?? new Date();
  const dryRun = options.dryRun ?? false;
  const batchSize = clampInt(options.batchSize, 1, MAX_BATCH_SIZE, DEFAULT_BATCH_SIZE);
  const maxOrders = clampInt(options.maxOrders, 1, 100_000, DEFAULT_MAX_ORDERS);

  const { holdHours } = await getBookingSettings();
  const note = holdExpiryNote(holdHours);

  let scanned = 0;
  let expired = 0;
  let skipped = 0;
  let seatsReleased = 0;
  const orders: ExpireHoldsOrder[] = [];

  while (scanned < maxOrders) {
    const batch: ExpiringOrder[] = await prisma.order.findMany({
      where: { status: "new", holdExpiresAt: { lt: now } },
      orderBy: { holdExpiresAt: "asc" },
      take: Math.min(batchSize, maxOrders - scanned),
      select: {
        id: true,
        code: true,
        departureId: true,
        adults: true,
        children: true,
        infants: true,
        holdExpiresAt: true,
      },
    });

    if (batch.length === 0) break;

    for (const order of batch) {
      scanned += 1;
      const seats = order.adults + order.children + order.infants;

      if (dryRun) {
        expired += 1;
        seatsReleased += seats;
        if (orders.length < MAX_REPORTED_ORDERS) {
          orders.push({
            code: order.code,
            seats,
            holdExpiresAt: order.holdExpiresAt?.toISOString() ?? null,
            status: "expired",
          });
        }
        continue;
      }

      const result = await expireOne(order, seats, now, note);
      if (result === "expired") {
        expired += 1;
        seatsReleased += seats;
      } else {
        skipped += 1;
      }

      if (orders.length < MAX_REPORTED_ORDERS) {
        orders.push({
          code: order.code,
          seats,
          holdExpiresAt: order.holdExpiresAt?.toISOString() ?? null,
          status: result,
        });
      }
    }

    if (dryRun) break;
    if (batch.length < batchSize) break;
  }

  const remaining = await prisma.order.count({
    where: { status: "new", holdExpiresAt: { lt: now } },
  });

  return { scanned, expired, skipped, seatsReleased, remaining, orders };
}
