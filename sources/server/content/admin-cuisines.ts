/**
 * CRUD món ăn cho admin (D9.4).
 *
 * Slug bất biến sau khi tạo. Mọi mutation ghi `admin_audit_log` trong cùng
 * transaction, kể cả thay đổi liên kết tour.
 */
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { AppError } from "@/server/errors";

export type AdminCuisineRow = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  whereToEat: string | null;
  province: string | null;
  imageUrl: string | null;
  sortOrder: number;
  tourIds: number[];
};

export type CuisineInput = {
  slug: string;
  name: string;
  description: string | null;
  whereToEat: string | null;
  province: string | null;
  imageUrl: string | null;
  sortOrder: number;
  tourIds: number[];
};

export type CuisineTourOption = {
  id: number;
  code: string;
  name: string;
  status: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOCAL_IMAGE = /^\/images\/[\w./-]+\.(webp|jpe?g|png|avif)$/i;

const ADMIN_CUISINE_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  whereToEat: true,
  province: true,
  imageUrl: true,
  sortOrder: true,
  tours: { select: { tourId: true } },
} satisfies Prisma.CuisineSelect;

type CuisineRecord = Prisma.CuisineGetPayload<{
  select: typeof ADMIN_CUISINE_SELECT;
}>;

function toRow(row: CuisineRecord): AdminCuisineRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    whereToEat: row.whereToEat,
    province: row.province,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
    tourIds: row.tours.map((tour) => tour.tourId),
  };
}

function text(value: string | null, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function normalize(input: CuisineInput) {
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG.test(slug) || slug.length > 160) {
    throw new AppError(
      "INVALID_CUISINE",
      "Slug chỉ gồm chữ thường, số và dấu gạch nối",
      400,
    );
  }

  const name = input.name.trim();
  if (name.length < 2 || name.length > 200) {
    throw new AppError("INVALID_CUISINE", "Tên phải 2–200 ký tự", 400);
  }

  const imageUrl = input.imageUrl?.trim() ? input.imageUrl.trim() : null;
  if (imageUrl && !LOCAL_IMAGE.test(imageUrl)) {
    throw new AppError(
      "INVALID_CUISINE",
      "Ảnh phải là đường dẫn nội bộ /images/…",
      400,
    );
  }

  if (
    !Number.isInteger(input.sortOrder) ||
    input.sortOrder < 0 ||
    input.sortOrder > 999
  ) {
    throw new AppError("INVALID_CUISINE", "Thứ tự phải trong khoảng 0–999", 400);
  }

  const tourIds = Array.from(new Set(input.tourIds));
  if (tourIds.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new AppError("INVALID_CUISINE", "Tour liên kết không hợp lệ", 400);
  }

  return {
    slug,
    name,
    description: text(input.description, 60_000),
    whereToEat: text(input.whereToEat, 500),
    province: text(input.province, 120),
    imageUrl,
    sortOrder: input.sortOrder,
    tourIds,
  };
}

function isUniqueError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isForeignKeyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}

async function assertToursPublished(tourIds: number[]): Promise<void> {
  if (tourIds.length === 0) return;

  const count = await prisma.tour.count({
    where: { id: { in: tourIds }, status: "published" },
  });

  if (count !== tourIds.length) {
    throw new AppError(
      "INVALID_CUISINE",
      "Tour liên kết không tồn tại hoặc chưa được mở bán",
      400,
    );
  }
}

export async function listAdminCuisines(): Promise<AdminCuisineRow[]> {
  const rows = await prisma.cuisine.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: ADMIN_CUISINE_SELECT,
  });

  return rows.map(toRow);
}

export async function getAdminCuisine(id: number): Promise<AdminCuisineRow> {
  const row = await prisma.cuisine.findUnique({
    where: { id },
    select: ADMIN_CUISINE_SELECT,
  });

  if (!row) {
    throw new AppError("CUISINE_NOT_FOUND", "Không tìm thấy món ăn", 404);
  }

  return toRow(row);
}

export async function listCuisineTourOptions(): Promise<CuisineTourOption[]> {
  return prisma.tour.findMany({
    where: { status: "published" },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, code: true, name: true, status: true },
  });
}

export async function createCuisine(
  input: CuisineInput,
  adminId: number,
): Promise<AdminCuisineRow> {
  const data = normalize(input);

  const existing = await prisma.cuisine.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (existing) {
    throw new AppError("CUISINE_SLUG_TAKEN", "Slug món ăn đã tồn tại", 409);
  }

  await assertToursPublished(data.tourIds);

  try {
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.cuisine.create({
        data: {
          slug: data.slug,
          name: data.name,
          description: data.description,
          whereToEat: data.whereToEat,
          province: data.province,
          imageUrl: data.imageUrl,
          sortOrder: data.sortOrder,
          tours: {
            create: data.tourIds.map((tourId) => ({ tourId })),
          },
        },
        select: ADMIN_CUISINE_SELECT,
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "cuisine.create",
          entity: "cuisine",
          entityId: created.id,
          meta: { slug: data.slug, name: data.name, tourIds: data.tourIds },
        },
      });

      return created;
    });

    return toRow(row);
  } catch (error) {
    if (isUniqueError(error)) {
      throw new AppError("CUISINE_SLUG_TAKEN", "Slug món ăn đã tồn tại", 409);
    }
    if (isForeignKeyError(error)) {
      throw new AppError("INVALID_CUISINE", "Tour liên kết không tồn tại", 400);
    }
    throw error;
  }
}

export async function updateCuisine(
  id: number,
  input: CuisineInput,
  adminId: number,
): Promise<AdminCuisineRow> {
  const data = normalize(input);

  const existing = await prisma.cuisine.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!existing) {
    throw new AppError("CUISINE_NOT_FOUND", "Không tìm thấy món ăn", 404);
  }

  if (data.slug !== existing.slug) {
    const clash = await prisma.cuisine.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (clash) {
      throw new AppError("CUISINE_SLUG_TAKEN", "Slug món ăn đã tồn tại", 409);
    }
  }

  await assertToursPublished(data.tourIds);

  try {
    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.cuisine.update({
        where: { id },
        data: {
          slug: data.slug,
          name: data.name,
          description: data.description,
          whereToEat: data.whereToEat,
          province: data.province,
          imageUrl: data.imageUrl,
          sortOrder: data.sortOrder,
          tours: {
            deleteMany: {},
            create: data.tourIds.map((tourId) => ({ tourId })),
          },
        },
        select: ADMIN_CUISINE_SELECT,
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "cuisine.update",
          entity: "cuisine",
          entityId: id,
          meta: { slug: data.slug, name: data.name, tourIds: data.tourIds },
        },
      });

      return updated;
    });

    return toRow(row);
  } catch (error) {
    if (isUniqueError(error)) {
      throw new AppError("CUISINE_SLUG_TAKEN", "Slug món ăn đã tồn tại", 409);
    }
    if (isForeignKeyError(error)) {
      throw new AppError("INVALID_CUISINE", "Tour liên kết không tồn tại", 400);
    }
    throw error;
  }
}

export async function deleteCuisine(
  id: number,
  adminId: number,
): Promise<void> {
  const existing = await prisma.cuisine.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true },
  });
  if (!existing) {
    throw new AppError("CUISINE_NOT_FOUND", "Không tìm thấy món ăn", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.cuisine.delete({ where: { id } });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "cuisine.delete",
        entity: "cuisine",
        entityId: id,
        meta: { slug: existing.slug, name: existing.name },
      },
    });
  });
}
