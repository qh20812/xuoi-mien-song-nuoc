import type { Prisma } from "@prisma/client";
import type { FaqPlacement, PublicFaqRecord } from "@/lib/contracts/faq";
import { toPublicFaqRecord } from "@/lib/content/mappers";
import prisma from "@/lib/prisma";

const FAQ_SELECT = {
  question: true,
  answer: true,
  category: true,
  placement: true,
  sortOrder: true,
  isActive: true,
} satisfies Prisma.FaqSelect;

type FaqQueryRow = Prisma.FaqGetPayload<{ select: typeof FAQ_SELECT }>;

async function queryActiveFaqs(
  placements: FaqPlacement[],
): Promise<PublicFaqRecord[]> {
  const rows: FaqQueryRow[] = await prisma.faq.findMany({
    where: {
      isActive: true,
      placement: { in: placements },
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: FAQ_SELECT,
  });

  return rows.map(toPublicFaqRecord);
}

/** Query thô, không cache — dùng trong loader `"use cache"` và test DB. */
export async function queryHomeFaqs(): Promise<PublicFaqRecord[]> {
  return queryActiveFaqs(["home", "both"]);
}

/** Query thô, không cache. */
export async function queryContactFaqs(): Promise<PublicFaqRecord[]> {
  return queryActiveFaqs(["contact", "both"]);
}
