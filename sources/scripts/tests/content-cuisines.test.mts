/**
 * D9.4 · Món ăn: loader public + CRUD admin (DB test).
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { CuisineInput } from "@/server/content/admin-cuisines";

const {
  cleanupTour,
  createTestAdmin,
  createTestTour,
  uniqueSuffix,
} = await import("@/scripts/tests/helpers/factories");
const { default: prisma } = await import("@/lib/prisma");
const { AppError } = await import("@/server/errors");
const {
  queryCuisinesForTour,
  queryHomeCuisines,
  queryPublicCuisineBySlug,
  queryPublicCuisines,
} = await import("@/server/content/cuisines-query");
const {
  createCuisine,
  deleteCuisine,
  getAdminCuisine,
  listAdminCuisines,
  updateCuisine,
} = await import("@/server/content/admin-cuisines");

let prefix = "";
let tourId = 0;
let tourCode = "";
let tourSlug = "";
let draftTourId = 0;
let draftTourSlug = "";
let adminId = 0;
let aSlug = "";
let bSlug = "";
let draftLinkSlug = "";
let homeSlug = "";

const IMAGE = "/images/cho-noi-cai-rang.webp";

async function cleanup() {
  if (prefix) {
    await prisma.cuisine.deleteMany({ where: { slug: { startsWith: prefix } } });
  }
  if (adminId) {
    await prisma.adminAuditLog.deleteMany({ where: { adminId } });
    await prisma.adminUser.deleteMany({ where: { id: adminId } });
  }
  if (tourId) await cleanupTour(prisma, tourId);
  if (draftTourId) await cleanupTour(prisma, draftTourId);
}

before(async () => {
  prefix = `qa-cuisine-${uniqueSuffix()}`;
  await cleanup();

  const tour = await createTestTour(prisma, {
    name: `QA Tour món ăn ${prefix}`,
    code: `QA-${uniqueSuffix()}`,
  });
  tourId = tour.id;
  tourCode = tour.code;
  tourSlug = tour.slug;

  const draftTour = await createTestTour(prisma, {
    name: `QA Tour nháp ${prefix}`,
    code: `QA-${uniqueSuffix()}`,
    status: "draft",
  });
  draftTourId = draftTour.id;
  draftTourSlug = draftTour.slug;

  const admin = await createTestAdmin(prisma);
  adminId = admin.id;

  aSlug = `${prefix}-a`;
  bSlug = `${prefix}-b`;
  draftLinkSlug = `${prefix}-draft-link`;
  homeSlug = `${prefix}-home`;

  await prisma.cuisine.create({
    data: {
      slug: aSlug,
      name: "QA Món A",
      description: "Mô tả A",
      whereToEat: "U Minh Hạ",
      province: "Cà Mau",
      imageUrl: IMAGE,
      sortOrder: 900,
      tours: { create: [{ tourId }] },
    },
  });

  await prisma.cuisine.create({
    data: {
      slug: bSlug,
      name: "QA Món B",
      description: null,
      whereToEat: null,
      province: "Cần Thơ",
      imageUrl: null,
      sortOrder: 901,
    },
  });

  // Gắn tour nháp: public phải bỏ liên kết này.
  await prisma.cuisine.create({
    data: {
      slug: draftLinkSlug,
      name: "QA Món gắn tour nháp",
      description: "Nháp",
      province: "Cà Mau",
      sortOrder: 902,
      tours: { create: [{ tourId: draftTourId }] },
    },
  });

  await prisma.cuisine.create({
    data: {
      slug: homeSlug,
      name: "QA Món trang chủ",
      description: "Món đầu trang chủ",
      whereToEat: "Năm Căn",
      province: "Cà Mau",
      sortOrder: 0,
    },
  });
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

function cuisineInput(overrides: Partial<CuisineInput> = {}): CuisineInput {
  return {
    slug: `${prefix}-admin`,
    name: "QA Món Admin",
    description: "Mô tả admin",
    whereToEat: "Chợ cua Cà Mau",
    province: "Cà Mau",
    imageUrl: IMAGE,
    sortOrder: 903,
    tourIds: [tourId],
    ...overrides,
  };
}

test("queryPublicCuisines: đúng thứ tự, chỉ tour published, null thành rỗng", async () => {
  const rows = await queryPublicCuisines();
  const ours = rows.filter((row) => row.slug.startsWith(prefix));

  assert.deepEqual(
    ours.map((row) => row.slug),
    [homeSlug, aSlug, bSlug, draftLinkSlug],
  );

  const a = rows.find((row) => row.slug === aSlug)!;
  assert.equal(a.description, "Mô tả A");
  assert.equal(a.whereToEat, "U Minh Hạ");
  assert.equal(a.provinceSlug, "ca-mau");
  assert.equal(a.image?.src, IMAGE);
  assert.deepEqual(
    a.tourRefs.map((tour) => tour.code),
    [tourCode],
  );

  const b = rows.find((row) => row.slug === bSlug)!;
  assert.equal(b.description, "");
  assert.equal(b.whereToEat, "");
  assert.equal(b.image, null);
  assert.deepEqual(b.tourRefs, []);

  const draftLink = rows.find((row) => row.slug === draftLinkSlug)!;
  assert.deepEqual(draftLink.tourRefs, []);
});

test("queryPublicCuisineBySlug: có dữ liệu hoặc null", async () => {
  assert.equal((await queryPublicCuisineBySlug(aSlug))?.name, "QA Món A");
  assert.equal(await queryPublicCuisineBySlug("khong-ton-tai"), null);
});

test("queryCuisinesForTour: chỉ tour published, đúng món liên kết", async () => {
  const rows = await queryCuisinesForTour(tourSlug);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.slug, aSlug);
  assert.equal(rows[0]!.description, "Mô tả A");
  assert.equal(rows[0]!.whereToEat, "U Minh Hạ");

  assert.deepEqual(await queryCuisinesForTour(draftTourSlug), []);
});

test("queryHomeCuisines: giới hạn số lượng và map dữ liệu", async () => {
  const rows = await queryHomeCuisines(3);
  assert.equal(rows.length, 3);
  assert.ok(rows.every((row) => row.slug.length > 0 && row.name.length > 0));

  const all = await queryHomeCuisines(100);
  const home = all.find((row) => row.slug === homeSlug);
  assert.equal(home?.whereToEat, "Năm Căn");
  assert.equal(home?.province, "Cà Mau");

  assert.deepEqual(await queryHomeCuisines(0), []);
});

test("admin: tạo món, gắn tour và ghi audit", async () => {
  const input = cuisineInput();
  const row = await createCuisine(input, adminId);

  assert.equal(row.slug, input.slug);
  assert.equal(row.imageUrl, IMAGE);
  assert.deepEqual(row.tourIds, [tourId]);

  const audit = await prisma.adminAuditLog.findFirst({
    where: {
      adminId,
      entity: "cuisine",
      entityId: row.id,
      action: "cuisine.create",
    },
  });
  assert.ok(audit);

  const publicRow = await queryPublicCuisineBySlug(input.slug);
  assert.equal(publicRow?.name, input.name);
});

test("admin: slug trùng, ảnh ngoài, thứ tự và tour sai bị chặn", async () => {
  await assert.rejects(
    () => createCuisine(cuisineInput({ slug: aSlug }), adminId),
    (error: unknown) =>
      error instanceof AppError && error.code === "CUISINE_SLUG_TAKEN",
  );

  const invalid: Array<Partial<CuisineInput>> = [
    { slug: "Bad Slug" },
    { name: "A" },
    { imageUrl: "https://example.com/a.jpg" },
    { sortOrder: -1 },
    { tourIds: [0] },
    { tourIds: [999_999_999] },
  ];

  for (const [index, overrides] of invalid.entries()) {
    const input = { ...overrides };
    if (!input.slug) input.slug = `${prefix}-bad-${index}`;

    await assert.rejects(
      () => createCuisine(cuisineInput(input), adminId),
      (error: unknown) =>
        error instanceof AppError && error.code === "INVALID_CUISINE",
      `case ${index}`,
    );
  }
});

test("admin: sửa món, bỏ liên kết tour và ghi audit", async () => {
  const input = cuisineInput({ slug: `${prefix}-edit` });
  const created = await createCuisine(input, adminId);

  const updated = await updateCuisine(
    created.id,
    {
      ...input,
      name: "QA Món đã sửa",
      description: "   ",
      whereToEat: "",
      province: "",
      imageUrl: "",
      tourIds: [],
    },
    adminId,
  );

  assert.equal(updated.name, "QA Món đã sửa");
  assert.equal(updated.description, null);
  assert.equal(updated.whereToEat, null);
  assert.equal(updated.province, null);
  assert.equal(updated.imageUrl, null);
  assert.deepEqual(updated.tourIds, []);

  const audit = await prisma.adminAuditLog.findFirst({
    where: {
      adminId,
      entity: "cuisine",
      entityId: created.id,
      action: "cuisine.update",
    },
  });
  assert.ok(audit);

  const list = await listAdminCuisines();
  assert.ok(list.some((row) => row.id === created.id));
});

test("admin: xoá món, 404 và audit", async () => {
  const input = cuisineInput({ slug: `${prefix}-delete` });
  const created = await createCuisine(input, adminId);

  await deleteCuisine(created.id, adminId);

  await assert.rejects(
    () => getAdminCuisine(created.id),
    (error: unknown) =>
      error instanceof AppError && error.code === "CUISINE_NOT_FOUND",
  );

  await assert.rejects(
    () => deleteCuisine(created.id, adminId),
    (error: unknown) =>
      error instanceof AppError && error.code === "CUISINE_NOT_FOUND",
  );

  const audit = await prisma.adminAuditLog.findFirst({
    where: {
      adminId,
      entity: "cuisine",
      entityId: created.id,
      action: "cuisine.delete",
    },
  });
  assert.ok(audit);
});

test("admin: update 404 và slug clash", async () => {
  await assert.rejects(
    () => updateCuisine(999_999_999, cuisineInput(), adminId),
    (error: unknown) =>
      error instanceof AppError && error.code === "CUISINE_NOT_FOUND",
  );

  const first = await createCuisine(
    cuisineInput({ slug: `${prefix}-clash-a` }),
    adminId,
  );
  const second = await createCuisine(
    cuisineInput({ slug: `${prefix}-clash-b` }),
    adminId,
  );

  await assert.rejects(
    () =>
      updateCuisine(
        second.id,
        cuisineInput({ slug: first.slug }),
        adminId,
      ),
    (error: unknown) =>
      error instanceof AppError && error.code === "CUISINE_SLUG_TAKEN",
  );
});
