import Link from "next/link";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FaqForm } from "@/components/admin/faq-form";
import { requireCapabilityPage } from "@/lib/auth/session";
import {
  FAQ_CATEGORY_LABELS,
  FAQ_PLACEMENT_LABELS,
} from "@/lib/content/faq-options";
import { listAdminFaqs } from "@/server/content/admin-faqs";
import { createFaqAction } from "./actions";

export const instant = false;

export const metadata = {
  title: "Câu hỏi thường gặp | Quản trị Xuôi Miền Sông Nước",
};

const OK_MESSAGE: Record<string, string> = {
  created: "Đã thêm câu hỏi.",
  deleted: "Đã xoá câu hỏi.",
};

const linkClass =
  "inline-flex min-h-9 items-center rounded-[8px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";

export default async function AdminFaqsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const admin = await requireCapabilityPage("content:write", "/admin/faqs");
  if (!admin) return <AccessDenied title="Không có quyền quản lý câu hỏi" />;

  const query = await searchParams;
  const faqs = await listAdminFaqs();
  const okMessage = query.ok ? OK_MESSAGE[query.ok] : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Quản trị", href: "/admin" }, { label: "FAQ" }]}
        title="Câu hỏi thường gặp"
        description="Thêm, sửa hoặc ẩn câu hỏi. Thay đổi áp dụng ngay cho trang chủ và /lien-he theo vị trí hiển thị."
        actions={<span className="text-[13px] text-sage">{faqs.length} câu hỏi</span>}
      />

      {okMessage ? (
        <p
          role="status"
          className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-[13px] text-success"
        >
          {okMessage}
        </p>
      ) : null}

      {query.error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger"
        >
          {query.error}
        </p>
      ) : null}

      <details className="rounded-xl border border-line bg-surface p-4 md:p-5">
        <summary className="cursor-pointer text-[15px] font-semibold text-ink">
          Thêm câu hỏi
        </summary>
        <div className="mt-4">
          <FaqForm action={createFaqAction} submitLabel="Thêm câu hỏi" />
        </div>
      </details>

      {faqs.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface py-12 text-center">
          <p className="text-[13px] text-sage">Chưa có câu hỏi nào trong database.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-warm">
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Câu hỏi
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Chủ đề
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Hiển thị
                </th>
                <th scope="col" className="px-4 py-3 text-right text-[12px] font-semibold text-sage">
                  Thứ tự
                </th>
                <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                  Trạng thái
                </th>
                <th scope="col" className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq) => (
                <tr key={faq.id} className="border-b border-line last:border-b-0">
                  <td className="max-w-md px-4 py-3">
                    <span className="block font-medium text-ink">{faq.question}</span>
                  </td>
                  <td className="px-4 py-3 text-sage">
                    {FAQ_CATEGORY_LABELS[faq.category]}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {faq.placement ? FAQ_PLACEMENT_LABELS[faq.placement] : "Không đặt"}
                  </td>
                  <td className="px-4 py-3 text-right text-ink tabular-nums">
                    {faq.sortOrder}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        faq.isActive
                          ? "inline-flex rounded-full bg-success/10 px-2.5 py-1 text-[12px] font-medium text-success"
                          : "inline-flex rounded-full bg-surface-warm px-2.5 py-1 text-[12px] font-medium text-sage"
                      }
                    >
                      {faq.isActive ? "Đang hiển thị" : "Đang ẩn"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/faqs/${faq.id}`} className={linkClass}>
                      Sửa
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
