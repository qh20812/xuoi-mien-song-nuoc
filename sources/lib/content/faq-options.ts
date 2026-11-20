import type { FaqPlacement } from "@/lib/contracts/faq";

export const FAQ_CATEGORIES = [
  "general",
  "booking",
  "transport",
  "food",
  "safety",
  "weather",
] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export const FAQ_CATEGORY_LABELS: Record<FaqCategory, string> = {
  general: "Chung",
  booking: "Đặt chỗ",
  transport: "Di chuyển",
  food: "Ăn uống",
  safety: "An toàn",
  weather: "Thời tiết",
};

export const FAQ_PLACEMENT_LABELS: Record<FaqPlacement, string> = {
  home: "Trang chủ",
  contact: "Liên hệ",
  both: "Cả hai",
};

export function normalizeFaqCategory(
  value: string | null | undefined,
): FaqCategory {
  return (FAQ_CATEGORIES as readonly string[]).includes(value ?? "")
    ? (value as FaqCategory)
    : "general";
}
