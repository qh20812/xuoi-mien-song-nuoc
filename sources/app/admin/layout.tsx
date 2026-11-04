/**
 * Khu vực quản trị đọc phiên đăng nhập và tham số truy vấn, nên cho phép
 * chặn (blocking) khi điều hướng thay vì bắt buộc có static shell.
 */
export const instant = false;
export const metadata = {
  title: "Quản trị | Xuôi Miền Sông Nước",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
