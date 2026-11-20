import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FaqForm } from "@/components/admin/faq-form";
import { requireCapabilityPage } from "@/lib/auth/session";
import { FAQ_CATEGORY_LABELS, FAQ_PLACEMENT_LABELS } from "@/lib/content/faq-options";
import { getAdminFaq } from "@/server/content/admin-faqs";
import { isAppError } from "@/server/errors";
import { deleteFaqAction, updateFaqAction } from "../actions";

export const instant = false;

export const metadata = {
  title: "Sửa câu hỏi | Quản trị Xuôi Miền Sông Nước",
};

const OK_MESSAGE: Record<string, string> = {
  updated: "Đã lưu câu hỏi.",
};

const ghostButtonClass =
  "h-9 rounded-[10px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";

export default async function AdminFaqEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const admin = await requireCapabilityPage("content:write", `/admin/faqs/${rawId}`);
  if (!admin) return <AccessDenied title="Không có quyền quản lý câu hỏi" />;

  const faq = await getAdminFaq(id).catch((error: unknown) => {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  });

  const query = await searchParams;
  const okMessage = query.ok ? OK_MESSAGE[query.ok] : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[
          { label: "Quản trị", href: "/admin" },
          { label: "FAQ", href: "/admin/faqs" },
          { label: "Sửa câu hỏi" },
        ]}
        title="Sửa câu hỏi"
        description={`${FAQ_CATEGORY_LABELS[faq.category]} · ${
          faq.placement ? FAQ_PLACEMENT_LABELS[faq.placement] : "Không đặt"
        } · ${faq.isActive ? "Đang hiển thị" : "Đang ẩn"}`}
        actions={
          <Link href="/admin/faqs" className={ghostButtonClass}>
            Về danh sách
          </Link>
        }
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

      <section className="rounded-xl border border-line bg-surface p-4 md:p-5">
        <FaqForm
          action={updateFaqAction}
          faq={faq}
          submitLabel="Lưu thay đổi"
        />
      </section>

      <details className="rounded-xl border border-danger/30 bg-danger/5 p-4">
        <summary className="cursor-pointer text-[13px] font-semibold text-danger">
          Xoá câu hỏi
        </summary>
        <p className="mt-2 text-[13px] leading-6 text-sage">
          Xoá vĩnh viễn câu hỏi này khỏi database. Hành động không thể hoàn tác.
        </p>
        <form action={deleteFaqAction} className="mt-3">
          <input type="hidden" name="id" value={faq.id} />
          <button
            type="submit"
            className="h-9 rounded-[10px] bg-danger px-3 text-[12px] font-semibold text-white transition-colors hover:bg-danger/90 focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:outline-none"
          >
            Xoá câu hỏi
          </button>
        </form>
      </details>
    </div>
  );
}
