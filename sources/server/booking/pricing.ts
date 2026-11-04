/**
 * Tính giá phía server. Không bao giờ tin giá do client gửi lên.
 *
 * - Người lớn: giá riêng của ngày khởi hành, nếu không có thì giá tour.
 * - Trẻ em: tương tự.
 * - Em bé (< 2 tuổi): miễn phí nhưng vẫn chiếm 1 chỗ ngồi.
 * - Phụ thu lễ/Tết: tính trên mỗi người lớn + trẻ em (em bé miễn).
 */
export type PricingSource = {
  basePriceAdult: number;
  basePriceChild: number;
  priceAdult: number | null;
  priceChild: number | null;
  holidaySurcharge: number;
};

export type PricingResult = {
  unitPriceAdult: number;
  unitPriceChild: number;
  surcharge: number;
  totalAmount: number;
};

export function calculatePricing(
  source: PricingSource,
  guests: { adults: number; children: number },
): PricingResult {
  const unitPriceAdult = Math.max(0, source.priceAdult ?? source.basePriceAdult);
  const unitPriceChild = Math.max(0, source.priceChild ?? source.basePriceChild);
  const surchargePerGuest = Math.max(0, source.holidaySurcharge);

  const surcharge = surchargePerGuest * (guests.adults + guests.children);
  const totalAmount =
    guests.adults * unitPriceAdult + guests.children * unitPriceChild + surcharge;

  return { unitPriceAdult, unitPriceChild, surcharge, totalAmount };
}
