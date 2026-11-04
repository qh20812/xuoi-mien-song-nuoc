import { BusFront, Clock3, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/container";

const promises = [
  {
    icon: BusFront,
    title: "Đón tại TP.HCM",
    description:
      "Trung tâm Quận 1 và Bến xe Miền Tây, khởi hành đúng lịch trình đã xác nhận.",
  },
  {
    icon: Clock3,
    title: "Giữ chỗ 24 giờ",
    description:
      "Chưa thu tiền online. Nhân viên liên hệ hướng dẫn cọc để xác nhận chuyến đi.",
  },
  {
    icon: MessageCircle,
    title: "Hỗ trợ Zalo 24/7",
    description:
      "Tư vấn hành lý, khẩu vị và nhu cầu riêng của gia đình trước ngày khởi hành.",
  },
];

export function PromiseStrip() {
  return (
    <section className="border-y border-line bg-surface-warm">
      <Container>
        <div className="grid grid-cols-1 divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
          {promises.map(({ icon: Icon, title, description }, index) => (
            <div
              key={title}
              className={
                index === 0
                  ? "py-6 md:pr-8"
                  : index === 1
                    ? "py-6 md:px-8"
                    : "py-6 md:pl-8"
              }
            >
              <div className="mb-2 flex items-center gap-2.5">
                <Icon aria-hidden="true" className="size-5 text-ink" />
                <h2 className="text-sm font-semibold text-ink">{title}</h2>
              </div>
              <p className="text-sm leading-6 text-sage">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
