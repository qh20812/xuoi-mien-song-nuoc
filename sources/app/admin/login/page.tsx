import { sanitizeNextPath } from "@/lib/auth/next-path";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Đăng nhập quản trị | Xuôi Miền Sông Nước",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Xuôi Miền Sông Nước</h1>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">Đăng nhập khu vực quản trị</p>
        <LoginForm next={sanitizeNextPath(next)} />
      </div>
    </main>
  );
}
