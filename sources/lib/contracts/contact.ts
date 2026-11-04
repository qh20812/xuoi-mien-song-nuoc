export type ContactTopic =
  | "tour"
  | "booking"
  | "private-group"
  | "other";

export type ContactFormValues = {
  name: string;
  phone: string;
  email: string;
  topic: ContactTopic | "";
  message: string;
};

export type ContactRequest = {
  name: string;
  phone: string;
  email: string | null;
  subject: string;
  message: string;
};
