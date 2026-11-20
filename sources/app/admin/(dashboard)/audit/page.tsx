import Link from "next/link";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AuditMetaDetails } from "@/components/admin/audit-meta";
import {
  AUDIT_ENTITY_OPTIONS,
  auditActionLabel,
  auditEntityLabel,
  isAuditEntity,
} from "@/lib/audit/labels";
import { requireCapabilityPage } from "@/lib/auth/session";
import { formatDateTimeVN } from "@/lib/format";
import { isDateOnly } from "@/lib/time";
import {
  listAdminAuditLogs,
  listAuditAdminOptions,
  type AdminAuditRow,
} from "@/server/audit/admin-audit";

export const instant = false;

export const metadata = {
  title: "Nhật ký thao tác | Quản trị Xuôi Miền Sông Nước",
};

const fieldClass =
  "h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const labelClass = "text-[12px] font-semibold text-sage";
const ghostButtonClass =
  "h-9 rounded-[10px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";

type Filter = {
  entity?: string;
  action?: string;
  adminId?: number;
  from?: string;
  to?: string;
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    entity?: string;
    action?: string;
    adminId?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const admin = await requireCapabilityPage("audit:read", "/admin/audit");
  if (!admin) {
    return (
      <AccessDenied
        title="Chỉ chủ sở hữu xem được nhật ký"
        description="Nhật ký thao tác chứa toàn bộ lịch sử vận hành của hệ thống nên chỉ chủ sở hữu mới mở được."
      />
    );
  }

  const params = await searchParams;
  const entity = isAuditEntity(params.entity) ? params.entity : undefined;
  const action =
    typeof params.action === "string" ? params.action.trim().slice(0, 60) : "";
  const adminId =
    params.adminId && /^\d+$/.test(params.adminId) && Number(params.adminId) > 0
      ? Number(params.adminId)
      : undefined;
  const from = isDateOnly(params.from) ? params.from : "";
  const to = isDateOnly(params.to) ? params.to : "";
  const page = Math.max(1, Number(params.page) || 1);

  const filter: Filter = {
    entity,
    action: action || undefined,
    adminId,
    from: from || undefined,
    to: to || undefined,
  };
  const hasFilter = Boolean(entity || action || adminId || from || to);

  const [result, admins] = await Promise.all([
    listAdminAuditLogs({ ...filter, page }),
    listAuditAdminOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Quản trị", href: "/admin" }, { label: "Nhật ký" }]}
        title="Nhật ký thao tác"
        description="Lịch sử thao tác của quản trị viên trên toàn hệ thống. Chỉ đọc — bản ghi được tạo tự động khi thao tác."
        actions={
          <span className="text-[13px] text-sage">{result.pagination.total} bản ghi</span>
        }
      />

      <form
        method="get"
        className="rounded-xl border border-line bg-surface p-4"
        aria-label="Lọc nhật ký"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-entity" className={labelClass}>
              Đối tượng
            </label>
            <select
              id="filter-entity"
              name="entity"
              defaultValue={entity ?? ""}
              className={`${fieldClass} px-3`}
            >
              <option value="">Tất cả</option>
              {AUDIT_ENTITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-action" className={labelClass}>
              Hành động
            </label>
            <input
              id="filter-action"
              name="action"
              defaultValue={action}
              maxLength={60}
              placeholder="vd: order."
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-admin" className={labelClass}>
              Người thực hiện
            </label>
            <select
              id="filter-admin"
              name="adminId"
              defaultValue={adminId ? String(adminId) : ""}
              className={`${fieldClass} px-3`}
            >
              <option value="">Tất cả</option>
              {admins.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.isActive ? "" : " (đã khoá)"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-from" className={labelClass}>
              Từ ngày
            </label>
            <input
              id="filter-from"
              name="from"
              type="date"
              defaultValue={from}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-to" className={labelClass}>
              Đến ngày
            </label>
            <input
              id="filter-to"
              name="to"
              type="date"
              defaultValue={to}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            className="h-10 rounded-[10px] bg-clay px-4 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
          >
            Lọc
          </button>
          <Link
            href="/admin/audit"
            className="text-[13px] font-medium text-sage transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
          >
            Xoá lọc
          </Link>
        </div>
      </form>

      {result.rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface py-12 text-center">
          {hasFilter ? (
            <>
              <p className="text-[13px] text-sage">Không có bản ghi phù hợp.</p>
              <Link
                href="/admin/audit"
                className="mt-2 inline-block text-[13px] font-medium text-clay underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none"
              >
                Xoá bộ lọc
              </Link>
            </>
          ) : (
            <p className="text-[13px] text-sage">Chưa có bản ghi nào.</p>
          )}
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface xl:block">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line bg-surface-warm">
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                    Thời gian
                  </th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                    Người thực hiện
                  </th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                    Hành động
                  </th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                    Đối tượng
                  </th>
                  <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.rows.map((row) => (
                  <tr key={row.id} className="align-top transition-colors hover:bg-surface-warm/50">
                    <td className="px-4 py-3 text-sage tabular-nums">
                      {formatDateTimeVN(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <AdminCell row={row} />
                    </td>
                    <td className="px-4 py-3">
                      <ActionCell row={row} />
                    </td>
                    <td className="px-4 py-3">
                      <EntityCell row={row} />
                    </td>
                    <td className="px-4 py-3">
                      <AuditMetaDetails
                        entity={row.entity}
                        action={row.action}
                        meta={row.meta}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-3 xl:hidden">
            {result.rows.map((row) => (
              <li key={row.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] text-sage tabular-nums">
                      {formatDateTimeVN(row.createdAt)}
                    </p>
                    <p className="mt-1 text-[14px] font-semibold text-ink">
                      {auditActionLabel(row.action)}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-sage">{row.action}</p>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full bg-surface-warm px-2.5 py-1 text-[12px] font-medium text-sage">
                    {auditEntityLabel(row.entity)}
                  </span>
                </div>

                <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-[12px]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sage">Người thực hiện</span>
                    <span className="text-right">
                      <AdminCell row={row} />
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sage">Đối tượng</span>
                    <EntityCell row={row} />
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="text-sage">Chi tiết</span>
                    <AuditMetaDetails
                      entity={row.entity}
                      action={row.action}
                      meta={row.meta}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Pagination
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        filter={filter}
      />
    </div>
  );
}

function AdminCell({ row }: { row: AdminAuditRow }) {
  if (!row.admin) {
    return <span className="text-sage">Hệ thống / đã xoá</span>;
  }

  return (
    <span className="flex min-w-0 flex-col">
      <span className="font-medium text-ink">{row.admin.name}</span>
      <span className="text-[12px] break-all text-sage">{row.admin.email}</span>
    </span>
  );
}

function ActionCell({ row }: { row: AdminAuditRow }) {
  return (
    <span className="flex flex-col">
      <span className="font-medium text-ink">{auditActionLabel(row.action)}</span>
      <span className="font-mono text-[11px] text-sage">{row.action}</span>
    </span>
  );
}

function EntityCell({ row }: { row: AdminAuditRow }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="rounded-full bg-surface-warm px-2.5 py-1 text-[12px] font-medium text-sage">
        {auditEntityLabel(row.entity)}
      </span>
      {row.entityId !== null ? (
        <span className="font-mono text-[11px] text-sage">#{row.entityId}</span>
      ) : null}
    </span>
  );
}

function buildQuery(filter: Filter, page?: number): string {
  const search = new URLSearchParams();
  if (filter.entity) search.set("entity", filter.entity);
  if (filter.action) search.set("action", filter.action);
  if (filter.adminId) search.set("adminId", String(filter.adminId));
  if (filter.from) search.set("from", filter.from);
  if (filter.to) search.set("to", filter.to);
  if (page && page > 1) search.set("page", String(page));

  const qs = search.toString();
  return `/admin/audit${qs ? `?${qs}` : ""}`;
}

function Pagination({
  page,
  totalPages,
  filter,
}: {
  page: number;
  totalPages: number;
  filter: Filter;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-sage">
        Trang {page} / {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={buildQuery(filter, page - 1)} className={ghostButtonClass}>
            Trước
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link href={buildQuery(filter, page + 1)} className={ghostButtonClass}>
            Sau
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
