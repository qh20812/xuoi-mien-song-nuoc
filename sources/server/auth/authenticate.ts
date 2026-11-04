/**
 * Xác thực admin dùng chung cho API route và server action của trang đăng nhập.
 */
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// Hash giả để thời gian phản hồi khi email không tồn tại tương đương khi có.
const DUMMY_HASH = "$2b$10$3pS1GWCNodYlm2FUDS.QaOC.PssGopPZtJgyWWpEle3vkJ8twZNP.";

export type AuthenticatedAdmin = {
  id: number;
  email: string;
  name: string;
  role: string;
};

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AuthenticatedAdmin | null> {
  const admin = await prisma.adminUser.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
  });

  const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !admin.isActive || !valid) return null;

  prisma.adminUser
    .update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
    .catch((error) => console.error("[admin login] lastLoginAt", error));

  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
}
