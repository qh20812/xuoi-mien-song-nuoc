/**
 * Cấp mã đơn tuần tự theo năm, chống trùng khi nhiều request đồng thời.
 *
 * Dùng bảng booking_sequences + LAST_INSERT_ID() trong cùng transaction với
 * việc tạo đơn: MySQL khoá dòng sequence, các request xếp hàng và nhận số
 * khác nhau. Rollback sẽ để lại khoảng trống — chấp nhận được.
 */
import type { Prisma } from "@prisma/client";
import { currentYearVN } from "@/lib/time";

export type AllocatedCode = {
  year: number;
  seq: number;
  code: string;
};

export async function allocateOrderCode(tx: Prisma.TransactionClient): Promise<AllocatedCode> {
  const year = currentYearVN();

  await tx.$executeRaw`
    INSERT INTO booking_sequences (year, last_seq)
    VALUES (${year}, LAST_INSERT_ID(1))
    ON DUPLICATE KEY UPDATE last_seq = LAST_INSERT_ID(last_seq + 1)`;

  const rows = await tx.$queryRaw<Array<{ seq: bigint | number }>>`
    SELECT LAST_INSERT_ID() AS seq`;

  const seq = Number(rows[0]?.seq ?? 0);
  if (!Number.isInteger(seq) || seq <= 0) {
    throw new Error("Không cấp được mã đơn");
  }

  return {
    year,
    seq,
    code: `XMSN-${year}-${String(seq).padStart(4, "0")}`,
  };
}
