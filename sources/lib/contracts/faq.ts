export const FAQ_PLACEMENTS = ["home", "contact", "both"] as const;

export type FaqPlacement = (typeof FAQ_PLACEMENTS)[number];

export type FaqRecord = {
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
};

export type PublicFaqRecord = FaqRecord & {
  placement: FaqPlacement | null;
  isActive: boolean;
};

export function isFaqPlacement(value: unknown): value is FaqPlacement {
  return (
    typeof value === "string" &&
    (FAQ_PLACEMENTS as readonly string[]).includes(value)
  );
}
