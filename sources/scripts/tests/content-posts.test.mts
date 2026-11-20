/**
 * D9.3 · Bài viết: loader public + CRUD admin (DB test).
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { PostInput } from "@/server/content/admin-posts";

const {
  cleanupTour,
  createTestAdmin,
  createTestTour,
  uniqueSuffix,
} = await import("@/scripts/tests/helpers/factories");
const { default: prisma } = await import("@/lib/prisma");
const { AppError } = await import("@/server/errors");
const {
  queryPublicPostBySlug,
  queryPublicPosts,
  queryRelatedPosts,
  queryToursForPost,
} = await import("@/server/content/posts-query");
const {
  createPost,
  deletePost,
  getAdminPost,
  listAdminPosts,
  listPostTourCodes,
  updatePost,
} = await import("@/server/content/admin-posts");

let prefix = "";
let publishedTourCode = "";
let publishedTourSlug = "";
let draftTourCode = "";
let adminId = 0;
const tourIds: number[] = [];

let aSlug = "";
let bSlug = "";
let draftSlug = "";
let futureSlug = "";

const IMAGE = "/images/63-mui-ghe-dtc-kenh-beo.webp";

async function cleanup() {
  if (prefix) {
    await prisma.post.deleteMany({ where: { slug: { startsWith: prefix } } });
  }
  if (adminId) {
    await prisma.adminAuditLog.deleteMany({ where: { adminId } });
    await prisma.adminUser.deleteMany({ where: { id: adminId } });
  }
  for (const tourId of tourIds) await cleanupTour(prisma, tourId);
  tourIds.length = 0;
}

before(async () => {
  prefix = `qa-post-${uniqueSuffix()}`;
  await cleanup();

  const suffix = uniqueSuffix().toUpperCase();
  const publishedTour = await createTestTour(prisma, {
    name: `QA Tour bài viết ${suffix}`,
    code: `QA${suffix}`.slice(0, 20),
    coverImageUrl: IMAGE,
  });
  publishedTourCode = publishedTour.code;
  publishedTourSlug = publishedTour.slug;
  tourIds.push(publishedTour.id);

  const draftTour = await createTestTour(prisma, {
    name: `QA Tour nháp ${suffix}`,
    code: `QB${suffix}`.slice(0, 20),
    status: "draft",
  });
  draftTourCode = draftTour.code;
  tourIds.push(draftTour.id);

  const admin = await createTestAdmin(prisma);
  adminId = admin.id;

  aSlug = `${prefix}-a`;
  bSlug = `${prefix}-b`;
  draftSlug = `${prefix}-draft`;
  futureSlug = `${prefix}-future`;

  await prisma.post.create({
    data: {
      slug: aSlug,
      title: "QA Bài viết A",
      excerpt: "Tóm tắt A",
      content: "Nội dung A đủ dài để tính phút đọc.",
      coverImageUrl: IMAGE,
      category: "kinh-nghiem",
      tags: ["u-minh-ha", "hanh-ly"],
      topic: "hanh-ly",
      relatedTourCodes: [publishedTourCode, draftTourCode],
      checklist: ["Kem chống muỗi", "Nước uống"],
      status: "published",
      publishedAt: new Date("2026-11-10T00:00:00.000Z"),
      isFeatured: true,
    },
  });

  await prisma.post.create({
    data: {
      slug: bSlug,
      title: "QA Bài viết B",
      excerpt: "Tóm tắt B",
      content: "Nội dung B.",
      coverImageUrl: IMAGE,
      category: "kinh-nghiem",
      tags: [],
      topic: "dat-mui",
      relatedTourCodes: [publishedTourCode],
      status: "published",
      publishedAt: new Date("2026-11-05T00:00:00.000Z"),
      isFeatured: false,
    },
  });

  await prisma.post.create({
    data: {
      slug: draftSlug,
      title: "QA Bài viết nháp",
      category: "kinh-nghiem",
      topic: "thoi-tiet",
      status: "draft",
      publishedAt: new Date("2026-11-08T00:00:00.000Z"),
    },
  });

  await prisma.post.create({
    data: {
      slug: futureSlug,
      title: "QA Bài viết tương lai",
      category: "kinh-nghiem",
      topic: "thoi-tiet",
      status: "published",
      publishedAt: new Date("2999-01-01T00:00:00.000Z"),
    },
  });
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

function adminInput(overrides: Partial<PostInput> = {}): PostInput {
  return {
    slug: `${prefix}-admin`,
    title: "QA Bài viết Admin",
    excerpt: "Tóm tắt admin",
    content: "Nội dung admin đủ dài.",
    coverImageUrl: IMAGE,
    tags: ["qa", "bai-viet"],
    topic: "hanh-ly",
    relatedTourCodes: [publishedTourCode],
    checklist: ["Mục một", "Mục hai"],
    status: "published",
    publishedAt: "2026-11-01",
    seoTitle: "SEO title",
    seoDescription: "SEO description",
    isFeatured: true,
    ...overrides,
  };
}

test("queryPublicPosts: chỉ published + publishedAt <= now, đúng thứ tự", async () => {
  const rows = await queryPublicPosts();
  const ours = rows.filter((post) => post.slug.startsWith(prefix));

  assert.deepEqual(
    ours.map((post) => post.slug),
    [aSlug, bSlug],
  );
  assert.equal(rows.some((post) => post.slug === draftSlug), false);
  assert.equal(rows.some((post) => post.slug === futureSlug), false);

  const a = rows.find((post) => post.slug === aSlug)!;
  assert.equal(a.topic, "hanh-ly");
  assert.equal(a.topicLabel, "Hành lý & an toàn");
  assert.equal(a.isFeatured, true);
  assert.deepEqual(a.tags, ["u-minh-ha", "hanh-ly"]);
  assert.deepEqual(a.checklist, ["Kem chống muỗi", "Nước uống"]);
  assert.equal(a.publishedDate, "2026-11-10");
  assert.ok(a.readingMinutes >= 1);
});

test("queryPublicPostBySlug: draft/tương lai trả null", async () => {
  assert.equal((await queryPublicPostBySlug(aSlug))?.title, "QA Bài viết A");
  assert.equal(await queryPublicPostBySlug(draftSlug), null);
  assert.equal(await queryPublicPostBySlug(futureSlug), null);
  assert.equal(await queryPublicPostBySlug("khong-ton-tai"), null);
});

test("queryRelatedPosts: loại bài hiện tại", async () => {
  const related = await queryRelatedPosts(aSlug, 2);
  assert.equal(related.some((post) => post.slug === aSlug), false);
  assert.ok(related.length <= 2);
});

test("queryToursForPost: chỉ tour published, giữ thứ tự mã", async () => {
  const tours = await queryToursForPost([publishedTourCode, draftTourCode]);

  assert.equal(tours.length, 1);
  assert.equal(tours[0]!.code, publishedTourCode);
  assert.equal(tours[0]!.slug, publishedTourSlug);
  assert.equal(tours[0]!.coverImage.src, IMAGE);
  assert.equal(tours[0]!.priceAdult, 4_190_000);
});

test("admin: tạo bài viết, gắn metadata và ghi audit", async () => {
  const input = adminInput();
  const row = await createPost(input, adminId);

  assert.equal(row.slug, input.slug);
  assert.equal(row.topic, "hanh-ly");
  assert.equal(row.isFeatured, true);
  assert.deepEqual(row.relatedTourCodes, [publishedTourCode]);

  const audit = await prisma.adminAuditLog.findFirst({
    where: {
      adminId,
      entity: "post",
      entityId: row.id,
      action: "post.create",
    },
  });
  assert.ok(audit);

  assert.equal((await queryPublicPostBySlug(input.slug))?.title, input.title);
});

test("admin: slug trùng, topic/ảnh/ngày sai bị chặn", async () => {
  await assert.rejects(
    () => createPost(adminInput({ slug: aSlug }), adminId),
    (error: unknown) =>
      error instanceof AppError && error.code === "POST_SLUG_TAKEN",
  );

  await assert.rejects(
    () =>
      createPost(
        adminInput({
          slug: `${prefix}-bad-topic`,
          topic: "khong-hop-le" as PostInput["topic"],
        }),
        adminId,
      ),
    (error: unknown) =>
      error instanceof AppError && error.code === "INVALID_POST",
  );

  await assert.rejects(
    () =>
      createPost(
        adminInput({
          slug: `${prefix}-bad-image`,
          coverImageUrl: "https://example.com/a.jpg",
        }),
        adminId,
      ),
    (error: unknown) =>
      error instanceof AppError && error.code === "INVALID_POST",
  );

  await assert.rejects(
    () =>
      createPost(
        adminInput({
          slug: `${prefix}-bad-date`,
          publishedAt: "2026-02-31",
        }),
        adminId,
      ),
    (error: unknown) =>
      error instanceof AppError && error.code === "INVALID_POST",
  );
});

test("admin: sửa/ẩn bài viết, audit và 404", async () => {
  const input = adminInput({ slug: `${prefix}-edit` });
  const created = await createPost(input, adminId);

  const updated = await updatePost(
    created.id,
    {
      ...input,
      title: "QA Bài viết đã sửa",
      status: "draft",
      topic: "dat-mui",
      isFeatured: false,
      relatedTourCodes: [],
      checklist: [],
    },
    adminId,
  );

  assert.equal(updated.title, "QA Bài viết đã sửa");
  assert.equal(updated.status, "draft");
  assert.equal(updated.topic, "dat-mui");
  assert.equal(updated.isFeatured, false);
  assert.deepEqual(updated.checklist, []);
  assert.equal(await queryPublicPostBySlug(input.slug), null);

  const audit = await prisma.adminAuditLog.findFirst({
    where: {
      adminId,
      entity: "post",
      entityId: created.id,
      action: "post.update",
    },
  });
  assert.ok(audit);

  const list = await listAdminPosts();
  assert.ok(list.some((post) => post.id === created.id && post.status === "draft"));

  await deletePost(created.id, adminId);
  await assert.rejects(
    () => getAdminPost(created.id),
    (error: unknown) =>
      error instanceof AppError && error.code === "POST_NOT_FOUND",
  );

  await assert.rejects(
    () => updatePost(999_999_999, adminInput(), adminId),
    (error: unknown) =>
      error instanceof AppError && error.code === "POST_NOT_FOUND",
  );

  await assert.rejects(
    () => deletePost(999_999_999, adminId),
    (error: unknown) =>
      error instanceof AppError && error.code === "POST_NOT_FOUND",
  );
});

test("admin: checklist rỗng và ngày đăng trống xử lý đúng", async () => {
  const created = await createPost(
    adminInput({
      slug: `${prefix}-empty`,
      excerpt: "",
      content: "",
      coverImageUrl: "",
      tags: [],
      relatedTourCodes: [],
      checklist: [],
      status: "draft",
      publishedAt: null,
      seoTitle: "",
      seoDescription: "",
      isFeatured: false,
    }),
    adminId,
  );

  assert.equal(created.excerpt, null);
  assert.equal(created.content, null);
  assert.equal(created.coverImageUrl, null);
  assert.equal(created.publishedAt, null);
  assert.deepEqual(created.checklist, []);
  assert.deepEqual(created.tags, []);
});

test("admin: danh sách mã tour chỉ gồm tour published", async () => {
  const codes = await listPostTourCodes();
  assert.ok(codes.some((tour) => tour.code === publishedTourCode));
  assert.equal(codes.some((tour) => tour.code === draftTourCode), false);
});
