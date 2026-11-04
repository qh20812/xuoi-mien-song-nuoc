export type OrderStatus =
  | "new"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "expired";

export type PublicOrderPassenger = {
  fullName: string | null;
  type: "adult" | "child" | "infant";
  typeLabel: string;
  birthYear: number | null;
  note: string | null;
};

export type PublicOrder = {
  code: string;
  status: OrderStatus;
  statusLabel: string;
  contactName: string;
  phoneMasked: string;
  email: string | null;
  pickupPoint: string | null;
  customerNote: string | null;
  guests: {
    adults: number;
    children: number;
    infants: number;
    seats: number;
  };
  pricing: {
    currency: "VND";
    unitPriceAdult: number;
    unitPriceChild: number;
    surcharge: number;
    totalAmount: number;
  };
  tour: {
    code: string;
    name: string;
    slug: string;
    durationDays: number;
    durationNights: number;
    coverImageUrl: string | null;
  };
  departure: {
    date: string;
    returnDate: string | null;
    meetingPoint: string | null;
  };
  passengers: PublicOrderPassenger[];
  cancellation: {
    cutoffDays: number;
    deadline: string;
    canCancel: boolean;
    policy: string;
    note: string;
  };
  holdExpiresAt: string | null;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  alreadyCancelled?: boolean;
};

export type OrderLookupInput = {
  code: string;
  phone: string;
};

export type OrderCancelInput = {
  code: string;
  phone: string;
  reason?: string;
};
