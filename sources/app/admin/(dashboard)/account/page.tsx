import { connection } from "next/server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { requireAdminPage } from "@/lib/auth/session";
import { ROLE_LABEL, isAdminRole } from "@/server/auth/admin-users";
import { changePasswordAction } from "./actions";

export const instant = false;

export const metadata = {
  title: "Tài khoản của tôi | Quản trị Xuôi Miền Sông Nước",
};

export default async function AdminAccountPage() {
  // Chặn prerender trước khi đọc cookie/JWT: `jwtVerify` dùng thời gian hiện tại.
  await connection();

  const admin = await requireAdminPage("/admin/account");

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[
          { label: "Quản trị", href: "/admin" },
          { label: "Tài khoản của tôi" },
        ]}
        title="Tài khoản của tôi"
        description="Đổi mật khẩu đăng nhập. Sau khi lưu, mọi phiên đang mở của tài khoản này bị đăng xuất."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-line bg-surface p-4 md:p-5">
          <h2 className="text-[15px] font-semibold text-ink">Thông tin tài khoản</h2>

          <dl className="mt-4 flex flex-col gap-3 text-[13px]">
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] font-semibold text-sage">Tên hiển thị</dt>
              <dd className="text-ink">{admin.name}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] font-semibold text-sage">Email</dt>
              <dd className="break-all text-ink">{admin.email}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] font-semibold text-sage">Vai trò</dt>
              <dd className="text-ink">
                {isAdminRole(admin.role) ? ROLE_LABEL[admin.role] : admin.role}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-line bg-surface p-4 md:p-5 lg:col-span-2">
          <h2 className="text-[15px] font-semibold text-ink">Đổi mật khẩu</h2>
          <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-sage">
            Nhập mật khẩu hiện tại để xác nhận. Đổi xong bạn sẽ được đưa về trang đăng
            nhập và phải đăng nhập lại bằng mật khẩu mới.
          </p>

          <div className="mt-5 max-w-[440px]">
            <ChangePasswordForm action={changePasswordAction} />
          </div>
        </section>
      </div>
    </div>
  );
}
