import assert from "node:assert/strict";
import { test } from "node:test";
import { createCloudinaryStorage } from "@/server/media/cloudinary";

type UploadResult = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
};

function fakeClient(options: { failFirstUpload?: boolean } = {}) {
  const calls = {
    config: [] as Record<string, unknown>[],
    uploads: 0,
    destroys: [] as string[],
    url: [] as { publicId: string; options: Record<string, unknown> }[],
  };

  const uploadResult: UploadResult = {
    public_id: "xmsn/media/anh",
    secure_url: "https://res.cloudinary.com/demo/image/upload/v1/xmsn/media/anh.webp",
    width: 800,
    height: 600,
  };

  const client = {
    config(value: Record<string, unknown>) {
      calls.config.push(value);
      return {};
    },
    uploader: {
      upload_stream(
        _options: Record<string, unknown>,
        callback: (error: unknown, result?: UploadResult) => void,
      ) {
        calls.uploads += 1;
        const current = calls.uploads;
        return {
          end() {
            if (options.failFirstUpload && current === 1) {
              callback(new Error("network"));
              return;
            }
            callback(null, uploadResult);
          },
        };
      },
      async destroy(publicId: string) {
        calls.destroys.push(publicId);
        return { result: "ok" };
      },
    },
    url(publicId: string, urlOptions: Record<string, unknown>) {
      calls.url.push({ publicId, options: urlOptions });
      return `https://res.cloudinary.com/demo/image/upload/w_320/${publicId}`;
    },
  };

  return { calls, client: client as unknown as typeof import("cloudinary").v2 };
}

const ENV = { CLOUDINARY_URL: "cloudinary://api-key:api-secret@demo" };

test("thiếu hoặc sai CLOUDINARY_URL trả MEDIA_NOT_CONFIGURED 503", async () => {
  const missing = fakeClient();
  const storage = createCloudinaryStorage(missing.client, {});
  await assert.rejects(
    () => storage.upload(Buffer.from("x")),
    (error: { code?: string; status?: number }) =>
      error.code === "MEDIA_NOT_CONFIGURED" && error.status === 503,
  );

  const invalid = fakeClient();
  const badStorage = createCloudinaryStorage(invalid.client, {
    CLOUDINARY_URL: "khong-phai-url",
  });
  await assert.rejects(
    () => badStorage.upload(Buffer.from("x")),
    (error: { code?: string }) => error.code === "MEDIA_NOT_CONFIGURED",
  );
});

test("upload: cấu hình SDK một lần, map kết quả và mặc định folder", async () => {
  const fake = fakeClient();
  const storage = createCloudinaryStorage(fake.client, ENV);

  const result = await storage.upload(Buffer.from("anh"));
  assert.deepEqual(result, {
    publicId: "xmsn/media/anh",
    url: "https://res.cloudinary.com/demo/image/upload/v1/xmsn/media/anh.webp",
    width: 800,
    height: 600,
  });
  assert.equal(fake.calls.uploads, 1);
  assert.deepEqual(fake.calls.config[0], {
    cloud_name: "demo",
    api_key: "api-key",
    api_secret: "api-secret",
    secure: true,
  });

  await storage.upload(Buffer.from("anh 2"));
  assert.equal(fake.calls.config.length, 1, "config chỉ gọi lần đầu");
});

test("upload retry đúng 1 lần khi lần đầu lỗi", async () => {
  const fake = fakeClient({ failFirstUpload: true });
  const storage = createCloudinaryStorage(fake.client, ENV);

  const result = await storage.upload(Buffer.from("anh"));
  assert.equal(result.publicId, "xmsn/media/anh");
  assert.equal(fake.calls.uploads, 2);
});

test("destroy chấp nhận ok/not found và từ chối kết quả khác", async () => {
  const fake = fakeClient();
  const storage = createCloudinaryStorage(fake.client, ENV);

  assert.equal(await storage.destroy("xmsn/media/anh"), "ok");
  assert.deepEqual(fake.calls.destroys, ["xmsn/media/anh"]);

  const notFound = {
    ...fake.client,
    uploader: {
      ...fake.client.uploader,
      async destroy() {
        return { result: "not found" };
      },
    },
  } as unknown as typeof import("cloudinary").v2;
  const storage2 = createCloudinaryStorage(notFound, ENV);
  assert.equal(await storage2.destroy("missing"), "not found");

  const failed = {
    ...fake.client,
    uploader: {
      ...fake.client.uploader,
      async destroy() {
        return { result: "error" };
      },
    },
  } as unknown as typeof import("cloudinary").v2;
  const storage3 = createCloudinaryStorage(failed, ENV);
  await assert.rejects(
    () => storage3.destroy("x"),
    (error: { code?: string; status?: number }) =>
      error.code === "MEDIA_DELETE_FAILED" && error.status === 502,
  );
});

test("thumbnailUrl dùng transformation 320x320", async () => {
  const fake = fakeClient();
  const storage = createCloudinaryStorage(fake.client, ENV);

  const url = storage.thumbnailUrl("xmsn/media/anh");
  assert.equal(url, "https://res.cloudinary.com/demo/image/upload/w_320/xmsn/media/anh");
  assert.equal(fake.calls.url.length, 1);
  const options = fake.calls.url[0]!.options;
  assert.equal(options.secure, true);
  assert.deepEqual(options.transformation, [
    {
      width: 320,
      height: 320,
      crop: "fill",
      quality: "auto",
      fetch_format: "auto",
    },
  ]);
});
