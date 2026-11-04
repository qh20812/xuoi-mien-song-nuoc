import type { ContactTopic } from "@/lib/contracts/contact";

export const CONTACT_TOPICS: Array<{
  value: ContactTopic;
  label: string;
}> = [
  { value: "tour", label: "Tư vấn tour" },
  { value: "booking", label: "Hỗ trợ đơn giữ chỗ" },
  { value: "private-group", label: "Thiết kế đoàn riêng" },
  { value: "other", label: "Câu hỏi khác" },
];

export function contactSubjectLabel(topic: ContactTopic | "") {
  return CONTACT_TOPICS.find((item) => item.value === topic)?.label ?? "";
}
