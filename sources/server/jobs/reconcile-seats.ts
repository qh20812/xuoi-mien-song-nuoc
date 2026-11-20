/**
 * Nghiệp vụ "đối soát seats_taken" — dùng chung cho CLI và cron route.
 *
 * So tổng khách của các đơn còn giữ chỗ (new | pending | confirmed) với
 * `tour_departures.seats_taken`. Mặc định chỉ báo cáo; khi `fix = true` mới ghi,
 * và chỉ ghi nếu giá trị đọc được vẫn còn đúng — tránh đè một booking vừa phát
 * sinh trong lúc đối soát.
 */
import prisma from "@/lib/prisma";
import { dateOnly, parseDateOnly, todayVN } from "@/lib/time";

export const ACTIVE_ORDER_STATUSES = ["new", "pending", "confirmed"] as const;

export type ReconcileSeatsOptions = {
  fix?: boolean;
  all?: boolean;
  now?: Date;
};

export type ReconcileSeatsItem = {
  departureId: number;
  tourCode: string;
  departureDate: string;
  capacity: number;
  actual: number;
  expected: number;
  overbooked: boolean;
  fixed: boolean;
  skipped: boolean;
};

export type ReconcileSeatsResult = {
  checked: number;
  mismatches: number;
  fixed: number;
  skipped: number;
  overbooked: number;
  staleHolds: number;
  items: ReconcileSeatsItem[];
};

export async function reconcileSeats(
  options: ReconcileSeatsOptions = {},
): Promise<ReconcileSeatsResult> {
  const fix = options.fix ?? false;
  const now = options.now ?? new Date();

  const departures = await prisma.tourDeparture.findMany({
    where: options.all
      ? {}
      : { departureDate: { gte: parseDateOnly(todayVN(now)) } },
    orderBy: { departureDate: "asc" },
    select: {
      id: true,
      departureDate: true,
      capacityTotal: true,
      seatsTaken: true,
      tour: { select: { code: true } },
    },
  });

  const sums = await prisma.order.groupBy({
    by: ["departureId"],
    where: {
      status: { in: [...ACTIVE_ORDER_STATUSES] },
      departureId: { in: departures.map((departure) => departure.id) },
    },
    _sum: { adults: true, children: true, infants: true },
  });

  const expectedByDeparture = new Map(
    sums.map((sum) => [
      sum.departureId,
      (sum._sum.adults ?? 0) + (sum._sum.children ?? 0) + (sum._sum.infants ?? 0),
    ]),
  );

  let mismatches = 0;
  let fixed = 0;
  let skipped = 0;
  let overbooked = 0;
  const items: ReconcileSeatsItem[] = [];

  for (const departure of departures) {
    const expected = expectedByDeparture.get(departure.id) ?? 0;
    const actual = departure.seatsTaken;
    const isOverbooked = expected > departure.capacityTotal;

    if (isOverbooked) overbooked += 1;
    if (expected === actual && !isOverbooked) continue;

    if (expected !== actual) mismatches += 1;

    let wasFixed = false;
    let wasSkipped = false;

    if (fix && expected !== actual) {
      const updated = await prisma.tourDeparture.updateMany({
        where: { id: departure.id, seatsTaken: actual },
        data: { seatsTaken: expected },
      });

      if (updated.count === 1) {
        fixed += 1;
        wasFixed = true;
      } else {
        skipped += 1;
        wasSkipped = true;
      }
    }

    items.push({
      departureId: departure.id,
      tourCode: departure.tour.code,
      departureDate: dateOnly(departure.departureDate),
      capacity: departure.capacityTotal,
      actual,
      expected,
      overbooked: isOverbooked,
      fixed: wasFixed,
      skipped: wasSkipped,
    });
  }

  const staleHolds = await prisma.order.count({
    where: { status: "new", holdExpiresAt: { lt: now } },
  });

  return {
    checked: departures.length,
    mismatches,
    fixed,
    skipped,
    overbooked,
    staleHolds,
    items,
  };
}
