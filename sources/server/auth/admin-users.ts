/**
 * Quản lý tài khoản quản trị (P3).
 *
 * Quy tắc an toàn:
 * - Không tự vô hiệu hoá chính mình (khoá cửa bên ngoài).
 * - Không thể làm mất **chủ sở hữu hoạt động cuối cùng** (demote/deactivate/delete)
 *   — nếu không sẽ không còn ai vào được khu quản trị.
 * - Mọi thao tác ghi `admin_audit_log`, không bao giờ ghi mật khẩu vào meta.
 */
import bcrypt from "bcryptjs";
import { Prisma, type AdminRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { AppError } from "@/server/errors";

export const ADMIN_ROLES = ["owner", "admin", "editor"] as const;

export type AdminRoleValue = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: unknown): value is AdminRoleValue {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value);
}

export const ROLE_LABEL: Record<AdminRoleValue, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị",
  editor: "Biên tập",
};

export const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_ROUNDS = 10;

export type AdminUserRow = {
  id: number;
  email: string;
  name: string;
  role: AdminRoleValue;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  isSelf: boolean;
};

export type CreateAdminUserInput = {
  email: string;
  name: string;
  password: string;
  role: AdminRoleValue;
};

export type UpdateAdminUserInput = {
  name: string;
  role: AdminRoleValue;
  isActive: boolean;
};

export type ChangeOwnPasswordInput = {
  currentPassword: string;
  newPassword: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertPassword(password: string): string {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      "WEAK_PASSWORD",
      `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`,
      400,
    );
  }
  if (password.length > 200) {
    throw new AppError("WEAK_PASSWORD", "Mật khẩu quá dài", 400);
  }
  return password;
}

function toRow(
  row: {
    id: number;
    email: string;
    name: string;
    role: AdminRole;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  },
  actorId: number,
): AdminUserRow {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.isActive,
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    isSelf: row.id === actorId,
  };
}

export async function listAdminUsers(actorId: number): Promise<AdminUserRow[]> {
  const rows = await prisma.adminUser.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return rows.map((row) => toRow(row, actorId));
}

/**
 * Chặn trường hợp làm mất chủ sở hữu hoạt động cuối cùng.
 * Gọi bên trong transaction để tránh race giữa hai admin cùng thao tác.
 */
async function assertKeepsAnOwner(
  tx: Prisma.TransactionClient,
  targetId: number,
): Promise<void> {
  const target = await tx.adminUser.findUnique({
    where: { id: targetId },
    select: { role: true, isActive: true },
  });
  if (!target || target.role !== "owner" || !target.isActive) return;

  const otherOwners = await tx.adminUser.count({
    where: { role: "owner", isActive: true, id: { not: targetId } },
  });

  if (otherOwners === 0) {
    throw new AppError(
      "ADMIN_LAST_OWNER",
      "Đây là chủ sở hữu hoạt động duy nhất — hãy tạo hoặc kích hoạt một chủ sở hữu khác trước",
      409,
    );
  }
}

export async function createAdminUser(
  input: CreateAdminUserInput,
  actorId: number,
): Promise<AdminUserRow> {
  const email = normalizeEmail(input.email);
  const passwordHash = await bcrypt.hash(assertPassword(input.password), BCRYPT_ROUNDS);

  const existing = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    throw new AppError("ADMIN_EMAIL_TAKEN", "Email này đã có tài khoản", 409);
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.adminUser.create({
        data: {
          email,
          name: input.name.trim(),
          passwordHash,
          role: input.role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: actorId,
          action: "admin.create",
          entity: "admin_user",
          entityId: row.id,
          meta: { email: row.email, role: row.role },
        },
      });

      return row;
    });

    return toRow(created, actorId);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("ADMIN_EMAIL_TAKEN", "Email này đã có tài khoản", 409);
    }
    throw error;
  }
}

export async function updateAdminUser(
  targetId: number,
  input: UpdateAdminUserInput,
  actorId: number,
): Promise<AdminUserRow> {
  if (targetId === actorId && !input.isActive) {
    throw new AppError(
      "ADMIN_SELF_DISABLE",
      "Không thể tự vô hiệu hoá tài khoản đang đăng nhập",
      409,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const target = await tx.adminUser.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) {
      throw new AppError("ADMIN_NOT_FOUND", "Không tìm thấy tài khoản", 404);
    }

    const losingOwner = input.role !== "owner" || !input.isActive;
    if (losingOwner) {
      await assertKeepsAnOwner(tx, targetId);
    }

    const row = await tx.adminUser.update({
      where: { id: targetId },
      data: {
        name: input.name.trim(),
        role: input.role,
        isActive: input.isActive,
        // Khoá tài khoản ⇒ vô hiệu hoá mọi phiên đang mở của người đó.
        ...(input.isActive ? {} : { tokenVersion: { increment: 1 } }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId: actorId,
        action: "admin.update",
        entity: "admin_user",
        entityId: targetId,
        meta: { name: row.name, role: row.role, isActive: row.isActive },
      },
    });

    return row;
  });

  return toRow(updated, actorId);
}

export async function resetAdminPassword(
  targetId: number,
  password: string,
  actorId: number,
): Promise<void> {
  const passwordHash = await bcrypt.hash(assertPassword(password), BCRYPT_ROUNDS);

  const target = await prisma.adminUser.findUnique({
    where: { id: targetId },
    select: { id: true, email: true },
  });
  if (!target) {
    throw new AppError("ADMIN_NOT_FOUND", "Không tìm thấy tài khoản", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.adminUser.update({
      where: { id: targetId },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    await tx.adminAuditLog.create({
      data: {
        adminId: actorId,
        action: "admin.password",
        entity: "admin_user",
        entityId: targetId,
        meta: { email: target.email },
      },
    });
  });
}

/**
 * Tự đổi mật khẩu (mọi vai trò).
 *
 * Xác minh mật khẩu hiện tại bằng bcrypt, đổi hash và tăng `tokenVersion` trong
 * cùng transaction ⇒ mọi JWT cũ mất hiệu lực ngay. Không ghi mật khẩu vào audit.
 */
export async function changeOwnPassword(
  actorId: number,
  input: ChangeOwnPasswordInput,
): Promise<void> {
  const actor = await prisma.adminUser.findUnique({
    where: { id: actorId },
    select: { id: true, email: true, passwordHash: true, isActive: true },
  });

  if (!actor?.isActive) {
    throw new AppError("ADMIN_NOT_FOUND", "Không tìm thấy tài khoản", 404);
  }

  const matches = await bcrypt.compare(input.currentPassword, actor.passwordHash);
  if (!matches) {
    throw new AppError(
      "INVALID_CURRENT_PASSWORD",
      "Mật khẩu hiện tại không đúng.",
      400,
    );
  }

  assertPassword(input.newPassword);

  if (await bcrypt.compare(input.newPassword, actor.passwordHash)) {
    throw new AppError(
      "PASSWORD_UNCHANGED",
      "Mật khẩu mới phải khác mật khẩu hiện tại.",
      400,
    );
  }

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);

  await prisma.$transaction(async (tx) => {
    await tx.adminUser.update({
      where: { id: actorId },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId: actorId,
        action: "admin.password_self",
        entity: "admin_user",
        entityId: actorId,
        meta: { email: actor.email },
      },
    });
  });
}

export async function deleteAdminUser(targetId: number, actorId: number): Promise<void> {
  if (targetId === actorId) {
    throw new AppError(
      "ADMIN_SELF_DELETE",
      "Không thể xoá tài khoản đang đăng nhập",
      409,
    );
  }

  await prisma.$transaction(async (tx) => {
    const target = await tx.adminUser.findUnique({
      where: { id: targetId },
      select: { id: true, email: true },
    });
    if (!target) {
      throw new AppError("ADMIN_NOT_FOUND", "Không tìm thấy tài khoản", 404);
    }

    await assertKeepsAnOwner(tx, targetId);

    await tx.adminUser.delete({ where: { id: targetId } });

    await tx.adminAuditLog.create({
      data: {
        adminId: actorId,
        action: "admin.delete",
        entity: "admin_user",
        entityId: targetId,
        meta: { email: target.email },
      },
    });
  });
}
