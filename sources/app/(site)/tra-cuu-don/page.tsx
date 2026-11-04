import type { Metadata } from "next";
import { OrderLookup } from "@/components/lookup/order-lookup";
import { Container } from "@/components/ui/container";
import { siteSettings } from "@/lib/fixtures/site";

export const metadata: Metadata = {
  title: "Tra cứu đơn giữ chỗ",
  description:
    "Tra cứu trạng thái đơn giữ chỗ bằng mã đơn và số điện thoại, xem lịch khởi hành và yêu cầu hủy khi đủ điều kiện.",
};

export default function OrderLookupPage() {
  return (
    <Container className="py-8 md:py-12">
      <OrderLookup settings={siteSettings} />
    </Container>
  );
}
