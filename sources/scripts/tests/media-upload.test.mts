/**
 * D10.4 — upload ảnh Cloudinary (storage giả) + xoá media.
 *
 *   node --import tsx --test scripts/tests/media-upload.test.mts
 *
 * Không gọi Cloudinary thật: `MediaStorage` được inject. DB dùng test DB, dọn
 * media/audit/tour của chính suite này trong `after`.
 */
import "./helpers/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import sharp from "sharp";

const { default: prisma } = await import("@/lib/prisma");
const { createTestTour, cleanupTour } = await import(
  "@/scripts/tests/helpers/factories"
);
const { uploadMedia, MAX_UPLOAD_BYTES } = await import(
  "@/server/media/upload-media"
);
const { deleteMedia, updateMedia } = await import("@/server/media/admin-media");

let cachedAdminId = 0;

async function getAdminId(): Promise<number> {
  if (cachedAdminId === 0) {
    const admin = await prisma.adminUser.findFirstOrThrow({ select: { id: true } });
    cachedAdminId = admin.id;
  }
  return cachedAdminId;
}

const mediaIds: number[] = [];
const tourIds: number[] = [];

function fakeStorage() {
  const uploads: Buffer[] = [];
  const destroyed: string[] = [];
  const publicId = `xmsn/test/${randomUUID()}`;
  const url = `https://res.cloudinary.com/duj1xyanj/image/upload/v1/${publicId}.webp`;

  return {
    uploads,
    destroyed,
    publicId,
    url,
    storage: {
      async upload(buffer: Buffer) {
        uploads.push(Buffer.from(buffer));
        const meta = await sharp(buffer).metadata();
        return {
          publicId,
          url,
          width: meta.width ?? 0,
          height: meta.height ?? 0,
        };
      },
      async destroy(id: string) {
        destroyed.push(id);
        return "ok" as const;
      },
      thumbnailUrl(id: string) {
        return `https://res.cloudinary.com/duj1xyanj/image/upload/c_fill,w_320,h_320/${id}.webp`;
      },
    },
  };
}

async function png(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 168, g: 74, b: 43 },
    },
  })
    .png()
    .toBuffer();
}

async function createMediaRow(input: {
  url: string;
  publicId?: string | null;
  title?: string;
}) {
  const row = await prisma.media.create({
    data: {
      type: "image",
      url: input.url,
      publicId: input.publicId ?? null,
      title: input.title ?? "QA media",
      tags: ["qa"],
      sortOrder: 0,
      isActive: true,
    },
    select: { id: true },
  });
  mediaIds.push(row.id);
  return row.id;
}

after(async () => {
  if (tourIds.length > 0) {
    for (const id of tourIds) await cleanupTour(prisma, id);
  }
  if (mediaIds.length > 0) {
    await prisma.adminAuditLog.deleteMany({
      where: { entity: "media", entityId: { in: mediaIds } },
    });
    await prisma.media.deleteMany({ where: { id: { in: mediaIds } } });
  }
  await prisma.$disconnect();
});

test("upload: resize ≤1920, chuyển WebP, lưu row + audit", async () => {
  const adminId = await getAdminId();
  const fake = fakeStorage();
  const source = await png(2400, 1200);

  const media = await uploadMedia(
    {
      buffer: source,
      mimeType: "image/png",
      size: source.byteLength,
      title: "  Ảnh QA  ",
      alt: "Alt QA",
      tags: [" du lịch ", "du lịch", "miền tây", ""],
    },
    adminId,
    { storage: fake.storage },
  );
  mediaIds.push(media.id);

  assert.equal(media.type, "image");
  assert.equal(media.publicId, fake.publicId);
  assert.equal(media.url, fake.url);
  assert.equal(media.title, "Ảnh QA");
  assert.deepEqual(media.tags, ["du lịch", "miền tây"]);
  assert.ok(media.thumbnailUrl?.includes(fake.publicId));

  const uploaded = fake.uploads[0];
  assert.ok(uploaded);
  const meta = await sharp(uploaded).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 1920);
  assert.equal(meta.height, 960);
  assert.equal(media.width, 1920);
  assert.equal(media.height, 960);

  const audit = await prisma.adminAuditLog.findFirstOrThrow({
    where: { entity: "media", entityId: media.id, action: "media.upload" },
    select: { adminId: true, meta: true },
  });
  assert.equal(audit.adminId, adminId);
  assert.equal((audit.meta as { publicId?: string }).publicId, fake.publicId);
});

test("upload: chặn MIME lạ, tệp quá lớn và ảnh hỏng", async () => {
  const adminId = await getAdminId();
  const fake = fakeStorage();
  const source = await png(10, 10);

  await assert.rejects(
    () =>
      uploadMedia(
        { buffer: source, mimeType: "image/gif", size: source.byteLength },
        adminId,
        { storage: fake.storage },
      ),
    (error: { code?: string }) => error.code === "MEDIA_INVALID_TYPE",
  );

  await assert.rejects(
    () =>
      uploadMedia(
        {
          buffer: source,
          mimeType: "image/png",
          size: MAX_UPLOAD_BYTES + 1,
        },
        adminId,
        { storage: fake.storage },
      ),
    (error: { code?: string }) => error.code === "MEDIA_TOO_LARGE",
  );

  await assert.rejects(
    () =>
      uploadMedia(
        {
          buffer: Buffer.from("day-khong-phai-anh"),
          mimeType: "image/png",
          size: 18,
        },
        adminId,
        { storage: fake.storage },
      ),
    (error: { code?: string }) => error.code === "MEDIA_INVALID_FILE",
  );

  assert.equal(fake.uploads.length, 0);
});

test("upload: storage lỗi trả MEDIA_UPLOAD_FAILED và không tạo row", async () => {
  const adminId = await getAdminId();
  const source = await png(20, 20);
  const before = await prisma.media.count();

  const failing = {
    async upload() {
      throw new Error("cloudinary down");
    },
    async destroy() {
      return "ok" as const;
    },
    thumbnailUrl() {
      return "https://res.cloudinary.com/x/image/upload/a.webp";
    },
  };

  await assert.rejects(
    () =>
      uploadMedia(
        { buffer: source, mimeType: "image/png", size: source.byteLength },
        adminId,
        { storage: failing },
      ),
    (error: { code?: string; status?: number }) =>
      error.code === "MEDIA_UPLOAD_FAILED" && error.status === 502,
  );

  assert.equal(await prisma.media.count(), before);
});

test("xoá media Cloudinary gọi destroy rồi xoá row + audit", async () => {
  const adminId = await getAdminId();
  const fake = fakeStorage();
  const id = await createMediaRow({
    url: fake.url,
    publicId: fake.publicId,
  });

  await deleteMedia(id, adminId, { storage: fake.storage });

  assert.deepEqual(fake.destroyed, [fake.publicId]);
  assert.equal(await prisma.media.findUnique({ where: { id } }), null);

  const audit = await prisma.adminAuditLog.findFirstOrThrow({
    where: { entity: "media", entityId: id, action: "media.delete" },
    select: { meta: true },
  });
  assert.equal((audit.meta as { publicId?: string }).publicId, fake.publicId);
});

test("xoá media đang dùng làm ảnh bìa bị chặn 409, không destroy asset", async () => {
  const adminId = await getAdminId();
  const fake = fakeStorage();
  const id = await createMediaRow({
    url: fake.url,
    publicId: fake.publicId,
  });
  const tour = await createTestTour(prisma, { coverImageUrl: fake.url });
  tourIds.push(tour.id);

  await assert.rejects(
    () => deleteMedia(id, adminId, { storage: fake.storage }),
    (error: { code?: string; status?: number }) =>
      error.code === "MEDIA_IN_USE" && error.status === 409,
  );
  assert.deepEqual(fake.destroyed, []);

  await cleanupTour(prisma, tour.id);
  tourIds.pop();

  await deleteMedia(id, adminId, { storage: fake.storage });
  assert.deepEqual(fake.destroyed, [fake.publicId]);
});

test("xoá media nhập tay (không publicId) không gọi Cloudinary", async () => {
  const adminId = await getAdminId();
  const fake = fakeStorage();
  const id = await createMediaRow({ url: "/images/05-du-khach-tren-ghe.webp" });

  await deleteMedia(id, adminId, { storage: fake.storage });

  assert.deepEqual(fake.destroyed, []);
  assert.equal(await prisma.media.findUnique({ where: { id } }), null);
});

test("update: ảnh Cloudinary không cho đổi URL/loại, nhưng sửa title được", async () => {
  const adminId = await getAdminId();
  const fake = fakeStorage();
  const id = await createMediaRow({
    url: fake.url,
    publicId: fake.publicId,
  });

  await assert.rejects(
    () =>
      updateMedia(
        id,
        {
          type: "image",
          url: "/images/khac.webp",
          title: null,
          alt: null,
          tags: [],
          sortOrder: 0,
          isActive: true,
        },
        adminId,
      ),
    (error: { code?: string; status?: number }) =>
      error.code === "MEDIA_MANAGED_URL" && error.status === 409,
  );

  const updated = await updateMedia(
    id,
    {
      type: "image",
      url: fake.url,
      title: "Đã sửa",
      alt: "Alt",
      tags: ["qa"],
      sortOrder: 2,
      isActive: false,
    },
    adminId,
  );
  assert.equal(updated.title, "Đã sửa");
  assert.equal(updated.publicId, fake.publicId);
  assert.equal(updated.isActive, false);
});
