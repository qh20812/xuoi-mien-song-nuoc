import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireCapabilityPage } from "@/lib/auth/session";
import { formatDateVN } from "@/lib/format";
import {
  ADMIN_ROLES,
  ROLE_LABEL,
  listAdminUsers,
} from "@/server/auth/admin-users";
import {
  createAdminUserAction,
  deleteAdminUserAction,
  resetAdminPasswordAction,
  updateAdminUserAction,
} from "./actions";

export const instant = false;

export const metadata = {
  title: "Tài khoản quản trị | Quản trị Xuôi Miền Sông Nước",
};

const OK_MESSAGE: Record<string, string> = {
  created: "Đã tạo tài khoản.",
  updated: "Đã lưu thay đổi.",
  password: "Đã đặt lại mật khẩu.",
  deleted: "Đã xoá tài khoản.",
};

const fieldClass =
  "h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";
const labelClass = "text-[12px] font-semibold text-sage";
const primaryButtonClass =
  "h-10 rounded-[10px] bg-clay px-4 text-[13px] font-semibold text-contrast-on-accent transition-colors hover:bg-clay-hover focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none";
const ghostButtonClass =
  "h-9 rounded-[10px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-clay hover:text-clay focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:outline-none";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const admin = await requireCapabilityPage("users:manage", "/admin/users");

  if (!admin) {
    return (
      <AccessDenied
        title="Chỉ chủ sở hữu quản lý được tài khoản"
        description="Tài khoản của bạn có quyền quản trị nội dung và đơn hàng, nhưng không có quyền thêm/xoá người dùng."
      />
    );
  }

  const query = await searchParams;
  const users = await listAdminUsers(admin.id);
  const okMessage = query.ok ? OK_MESSAGE[query.ok] : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Quản trị", href: "/admin" }, { label: "Tài khoản" }]}
        title="Tài khoản quản trị"
        description="Thêm người dùng, đổi vai trò, đặt lại mật khẩu. Không thể tự vô hiệu hoá mình hoặc bỏ chủ sở hữu cuối cùng."
        actions={<span className="text-[13px] text-sage">{users.length} tài khoản</span>}
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
        <h2 className="text-[15px] font-semibold text-ink">Thêm tài khoản</h2>

        <form
          action={createAdminUserAction}
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-email" className={labelClass}>
              Email *
            </label>
            <input
              id="new-email"
              name="email"
              type="email"
              required
              maxLength={160}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-name" className={labelClass}>
              Tên hiển thị *
            </label>
            <input
              id="new-name"
              name="name"
              required
              maxLength={120}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-role" className={labelClass}>
              Vai trò
            </label>
            <select id="new-role" name="role" defaultValue="editor" className={fieldClass}>
              {ADMIN_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className={labelClass}>
              Mật khẩu *
            </label>
            <input
              id="new-password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={200}
              autoComplete="new-password"
              className={fieldClass}
            />
          </div>

          <div className="md:col-span-4">
            <button type="submit" className={primaryButtonClass}>
              Tạo tài khoản
            </button>
          </div>
        </form>
      </section>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface-warm">
              <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                Tài khoản
              </th>
              <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                Vai trò
              </th>
              <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                Trạng thái
              </th>
              <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                Đăng nhập gần nhất
              </th>
              <th scope="col" className="px-4 py-3 text-[12px] font-semibold text-sage">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-line align-top last:border-b-0">
                <td className="px-4 py-3">
                  <span className="block font-medium text-ink">
                    {user.name}
                    {user.isSelf ? (
                      <span className="ml-2 rounded bg-surface-warm px-1.5 py-0.5 text-[11px] text-sage">
                        bạn
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[12px] text-sage">{user.email}</span>
                </td>

                <td className="px-4 py-3 text-ink">{ROLE_LABEL[user.role]}</td>

                <td className="px-4 py-3">
                  <span
                    className={
                      user.isActive
                        ? "inline-flex rounded-full bg-success/10 px-2.5 py-1 text-[12px] font-medium text-success"
                        : "inline-flex rounded-full bg-danger/10 px-2.5 py-1 text-[12px] font-medium text-danger"
                    }
                  >
                    {user.isActive ? "Hoạt động" : "Đã khoá"}
                  </span>
                </td>

                <td className="px-4 py-3 text-sage">
                  {user.lastLoginAt ? formatDateVN(user.lastLoginAt.slice(0, 10)) : "—"}
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <details className="rounded-[10px] border border-line bg-surface-warm/60">
                      <summary className="cursor-pointer px-3 py-2 text-[12px] font-semibold text-ink">
                        Sửa
                      </summary>

                      <form action={updateAdminUserAction} className="grid grid-cols-2 gap-3 p-3">
                        <input type="hidden" name="userId" value={user.id} />

                        <div className="col-span-1 flex flex-col gap-1">
                          <label
                            htmlFor={`name-${user.id}`}
                            className="text-[11px] font-semibold text-sage"
                          >
                            Tên
                          </label>
                          <input
                            id={`name-${user.id}`}
                            name="name"
                            required
                            maxLength={120}
                            defaultValue={user.name}
                            className={fieldClass}
                          />
                        </div>

                        <div className="col-span-1 flex flex-col gap-1">
                          <label
                            htmlFor={`role-${user.id}`}
                            className="text-[11px] font-semibold text-sage"
                          >
                            Vai trò
                          </label>
                          <select
                            id={`role-${user.id}`}
                            name="role"
                            defaultValue={user.role}
                            className={fieldClass}
                          >
                            {ADMIN_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABEL[role]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <label className="col-span-2 flex items-center gap-2 text-[12px] text-ink">
                          <input
                            type="checkbox"
                            name="isActive"
                            defaultChecked={user.isActive}
                            disabled={user.isSelf}
                            className="size-4 rounded border-line"
                          />
                          Đang hoạt động
                          {user.isSelf ? (
                            <span className="text-[11px] text-sage">
                              (không tự khoá được)
                            </span>
                          ) : null}
                        </label>

                        <div className="col-span-2">
                          <button type="submit" className={primaryButtonClass}>
                            Lưu
                          </button>
                        </div>
                      </form>
                    </details>

                    <details className="rounded-[10px] border border-line bg-surface-warm/60">
                      <summary className="cursor-pointer px-3 py-2 text-[12px] font-semibold text-ink">
                        Đặt lại mật khẩu
                      </summary>

                      <form
                        action={resetAdminPasswordAction}
                        className="flex flex-col gap-2 p-3"
                      >
                        <input type="hidden" name="userId" value={user.id} />
                        <label
                          htmlFor={`password-${user.id}`}
                          className="text-[11px] font-semibold text-sage"
                        >
                          Mật khẩu mới (≥ 8 ký tự)
                        </label>
                        <input
                          id={`password-${user.id}`}
                          name="password"
                          type="password"
                          required
                          minLength={8}
                          maxLength={200}
                          autoComplete="new-password"
                          className={fieldClass}
                        />
                        <button type="submit" className={ghostButtonClass}>
                          Đặt lại
                        </button>
                      </form>
                    </details>

                    {user.isSelf ? null : (
                      <form action={deleteAdminUserAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button
                          type="submit"
                          className="h-9 rounded-[10px] border border-danger/30 px-3 text-[12px] font-semibold text-danger transition-colors hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:outline-none"
                        >
                          Xoá tài khoản
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
