/**
 * D9.2 · Điểm đến: loader public + CRUD admin (DB test).
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { DestinationInput } from "@/server/content/admin-destinations";

const {
  cleanupTour,
  createTestAdmin,
  createTestTour,
  uniqueSuffix,
} = await import("@/scripts/tests/helpers/factories");
const { default: prisma } = await import("@/lib/prisma");
const { AppError } = await import("@/server/errors");
const {
  queryDestinationsForTour,
  queryHomeDestinations,
  queryPublicDestinationBySlug,
  queryPublicDestinations,
} = await import("@/server/content/destinations-query");
const {
  createDestination,
  deleteDestination,
  getAdminDestination,
  listAdminDestinations,
  listTourOptions,
  updateDestination,
} = await import("@/server/content/admin-destinations");

let prefix = "";
let tourId = 0;
let tourCode = "";
let tourSlug = "";
let adminId = 0;
let aSlug = "";
let bSlug = "";
let draftSlug = "";

const IMAGE = "/images/cho-noi-cai-rang.webp";

async function cleanup() {
  if (prefix) {
    await prisma.destination.deleteMany({
      where: { slug: { startsWith: prefix } },
    });
  }
  if (adminId) {
    await prisma.adminAuditLog.deleteMany({ where: { adminId } });
    await prisma.adminUser.deleteMany({ where: { id: adminId } });
  }
  if (tourId) await cleanupTour(prisma, tourId);
}

before(async () => {
  prefix = `qa-dest-${uniqueSuffix()}`;
  await cleanup();

  const tour = await createTestTour(prisma, {
    name: `QA Tour ${prefix}`,
    code: `QA-${uniqueSuffix()}`,
  });
  tourId = tour.id;
  tourCode = tour.code;
  tourSlug = tour.slug;

  const admin = await createTestAdmin(prisma);
  adminId = admin.id;

  aSlug = `${prefix}-a`;
  bSlug = `${prefix}-b`;
  draftSlug = `${prefix}-draft`;

  await prisma.destination.create({
    data: {
      slug: aSlug,
      name: "QA Điểm đến A",
      province: "Cần Thơ",
      category: "cho-noi",
      shortDesc: "Mô tả A",
      description: "Mô tả chi tiết A",
      bestSeason: "Tháng 5–8",
      travelNote: "Đi sớm",
      coverImageUrl: IMAGE,
      lat: 10.005,
      lng: 105.746,
      status: "published",
      sortOrder: 900,
      tours: { create: [{ tourId }] },
    },
  });

  await prisma.destination.create({
    data: {
      slug: bSlug,
      name: "QA Điểm đến B",
      province: "Cà Mau",
      category: "bien",
      shortDesc: "Mô tả B",
      description: "Mô tả chi tiết B",
      coverImageUrl: IMAGE,
      status: "published",
      sortOrder: 901,
    },
  });

  await prisma.destination.create({
    data: {
      slug: draftSlug,
      name: "QA Điểm đến nháp",
      province: "Đồng Tháp",
      category: "kien-truc",
      shortDesc: "Nháp",
      status: "draft",
      sortOrder: 899,
    },
  });
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

function adminInput(overrides: Partial<DestinationInput> = {}): DestinationInput {
  return {
    slug: `${prefix}-admin`,
    name: "QA Điểm đến Admin",
    province: "Cần Thơ",
    category: "cho-noi",
    shortDesc: "Mô tả admin",
    description: "Mô tả chi tiết admin",
    bestSeason: null,
    travelNote: null,
    coverImageUrl: IMAGE,
    lat: 10.01,
    lng: 105.75,
    status: "published",
    sortOrder: 902,
    tourIds: [tourId],
    ...overrides,
  };
}

test("queryPublicDestinations: chỉ published, đúng thứ tự và tourRefs", async () => {
  const rows = await queryPublicDestinations();
  const ours = rows.filter((row) => row.slug.startsWith(prefix));

  assert.deepEqual(
    ours.map((row) => row.slug),
    [aSlug, bSlug],
  );

  const a = rows.find((row) => row.slug === aSlug)!;
  assert.equal(a.shortDescription, "Mô tả A");
  assert.equal(a.provinceSlug, "can-tho");
  assert.equal(a.categoryLabel, "Chợ nổi");
  assert.equal(a.image?.src, IMAGE);
  assert.deepEqual(
    a.tourRefs.map((tour) => tour.code),
    [tourCode],
  );

  const b = rows.find((row) => row.slug === bSlug)!;
  assert.deepEqual(b.tourRefs, []);
  assert.equal(rows.some((row) => row.slug === draftSlug), false);
});

test("queryPublicDestinationBySlug: published trả dữ liệu, draft/không tồn tại trả null", async () => {
  assert.equal((await queryPublicDestinationBySlug(aSlug))?.name, "QA Điểm đến A");
  assert.equal(await queryPublicDestinationBySlug(draftSlug), null);
  assert.equal(await queryPublicDestinationBySlug("khong-ton-tai"), null);
});

test("queryDestinationsForTour: chỉ điểm đến gắn tour, có ảnh", async () => {
  const rows = await queryDestinationsForTour(tourSlug);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.slug, aSlug);
  assert.equal(rows[0]!.image.src, IMAGE);
  assert.equal(rows[0]!.shortDescription, "Mô tả A");
});

test("queryHomeDestinations: giới hạn số lượng và bỏ ảnh null", async () => {
  const rows = await queryHomeDestinations(2);
  assert.ok(rows.length <= 2);
  assert.ok(rows.every((row) => row.image.src.startsWith("/images/")));
});

test("admin: tạo điểm đến, gắn tour và ghi audit", async () => {
  const input = adminInput();
  const row = await createDestination(input, adminId);

  assert.equal(row.slug, input.slug);
  assert.deepEqual(row.tourIds, [tourId]);
  assert.equal(row.status, "published");

  const audit = await prisma.adminAuditLog.findFirst({
    where: {
      adminId,
      entity: "destination",
      entityId: row.id,
      action: "destination.create",
    },
  });
  assert.ok(audit);

  const publicRow = await queryPublicDestinationBySlug(input.slug);
  assert.equal(publicRow?.name, input.name);
});

test("admin: slug trùng và ảnh ngoài bị chặn", async () => {
  await assert.rejects(
    () => createDestination(adminInput({ slug: aSlug }), adminId),
    (error: unknown) =>
      error instanceof AppError && error.code === "DESTINATION_SLUG_TAKEN",
  );

  await assert.rejects(
    () =>
      createDestination(
        adminInput({
          slug: `${prefix}-bad-image`,
          coverImageUrl: "https://example.com/a.jpg",
        }),
        adminId,
      ),
    (error: unknown) =>
      error instanceof AppError && error.code === "INVALID_DESTINATION",
  );
});

test("admin: sửa trạng thái/tour, ẩn khỏi public và ghi audit", async () => {
  const input = adminInput({ slug: `${prefix}-edit` });
  const created = await createDestination(input, adminId);

  const updated = await updateDestination(
    created.id,
    {
      ...input,
      name: "QA Điểm đến đã sửa",
      status: "draft",
      tourIds: [],
    },
    adminId,
  );

  assert.equal(updated.name, "QA Điểm đến đã sửa");
  assert.equal(updated.status, "draft");
  assert.deepEqual(updated.tourIds, []);
  assert.equal(await queryPublicDestinationBySlug(input.slug), null);

  const audit = await prisma.adminAuditLog.findFirst({
    where: {
      adminId,
      entity: "destination",
      entityId: created.id,
      action: "destination.update",
    },
  });
  assert.ok(audit);

  const list = await listAdminDestinations();
  assert.ok(list.some((row) => row.id === created.id && row.status === "draft"));

  await deleteDestination(created.id, adminId);
  await assert.rejects(
    () => getAdminDestination(created.id),
    (error: unknown) =>
      error instanceof AppError && error.code === "DESTINATION_NOT_FOUND",
  );

  const afterDelete = await listAdminDestinations();
  assert.equal(afterDelete.some((row) => row.id === created.id), false);
});

test("admin: danh sách tour khả dụng chỉ gồm tour published", async () => {
  const options = await listTourOptions();
  assert.ok(options.some((option) => option.id === tourId));
});

test("admin: validate slug/tên/tỉnh/category/status/sort/tour/lat/lng", async () => {
  const cases: Array<[string, Partial<DestinationInput>]> = [
    ["name", { name: "A" }],
    ["province", { province: "A" }],
    ["category", { category: "khong-hop-le" as DestinationInput["category"] }],
    ["status", { status: "archived" as DestinationInput["status"] }],
    ["sortOrder", { sortOrder: -1 }],
    ["tourIds", { tourIds: [0] }],
    ["lat", { lat: 100 }],
    ["lng", { lng: -200 }],
  ];

  await assert.rejects(
    () => createDestination(adminInput({ slug: "Bad Slug" }), adminId),
    (error: unknown) =>
      error instanceof AppError && error.code === "INVALID_DESTINATION",
  );

  for (const [label, overrides] of cases) {
    await assert.rejects(
      () =>
        createDestination(
          adminInput({ ...overrides, slug: `${prefix}-bad-${label}` }),
          adminId,
        ),
      (error: unknown) =>
        error instanceof AppError && error.code === "INVALID_DESTINATION",
      label,
    );
  }
});

test("admin: ô rỗng thành null và toạ độ null", async () => {
  const created = await createDestination(
    adminInput({
      slug: `${prefix}-empty`,
      shortDesc: "",
      description: "   ",
      bestSeason: "",
      travelNote: "",
      coverImageUrl: "",
      lat: null,
      lng: null,
      tourIds: [],
    }),
    adminId,
  );

  assert.equal(created.shortDesc, null);
  assert.equal(created.description, null);
  assert.equal(created.bestSeason, null);
  assert.equal(created.travelNote, null);
  assert.equal(created.coverImageUrl, null);
  assert.equal(created.lat, null);
  assert.equal(created.lng, null);
});

test("admin: update/delete 404, slug clash và tour FK sai", async () => {
  await assert.rejects(
    () => updateDestination(999_999_999, adminInput(), adminId),
    (error: unknown) =>
      error instanceof AppError && error.code === "DESTINATION_NOT_FOUND",
  );

  await assert.rejects(
    () => deleteDestination(999_999_999, adminId),
    (error: unknown) =>
      error instanceof AppError && error.code === "DESTINATION_NOT_FOUND",
  );

  const first = await createDestination(
    adminInput({ slug: `${prefix}-clash-a` }),
    adminId,
  );
  const second = await createDestination(
    adminInput({ slug: `${prefix}-clash-b` }),
    adminId,
  );

  await assert.rejects(
    () =>
      updateDestination(
        second.id,
        adminInput({ slug: first.slug }),
        adminId,
      ),
    (error: unknown) =>
      error instanceof AppError && error.code === "DESTINATION_SLUG_TAKEN",
  );

  await assert.rejects(
    () =>
      createDestination(
        adminInput({
          slug: `${prefix}-bad-tour`,
          tourIds: [999_999_999],
        }),
        adminId,
      ),
    (error: unknown) =>
      error instanceof AppError && error.code === "INVALID_DESTINATION",
  );

  await assert.rejects(
    () =>
      updateDestination(
        second.id,
        adminInput({
          slug: second.slug,
          tourIds: [999_999_999],
        }),
        adminId,
      ),
    (error: unknown) =>
      error instanceof AppError && error.code === "INVALID_DESTINATION",
  );
});
