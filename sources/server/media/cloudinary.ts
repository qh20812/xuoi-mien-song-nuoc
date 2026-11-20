/**
 * Adapter Cloudinary cho media (D10.4).
 *
 * Cấu hình một lần từ `CLOUDINARY_URL` (`cloudinary://<api_key>:<api_secret>@<cloud_name>`).
 * Upload có 1 lần retry; xoá idempotent (`ok` hoặc `not found`).
 *
 * `createCloudinaryStorage` nhận SDK + env để unit-test bằng client giả, không gọi mạng.
 */
import { v2 as cloudinary } from "cloudinary";
import { AppError } from "@/server/errors";

export type MediaStorage = {
  upload: (
    buffer: Buffer,
    options?: { folder?: string },
  ) => Promise<{ publicId: string; url: string; width: number; height: number }>;
  destroy: (publicId: string) => Promise<"ok" | "not found">;
  thumbnailUrl: (publicId: string) => string;
};

const TIMEOUT_MS = 30_000;

export function createCloudinaryStorage(
  client: typeof cloudinary = cloudinary,
  env: { CLOUDINARY_URL?: string } = process.env as { CLOUDINARY_URL?: string },
): MediaStorage {
  let configured = false;

  function configure(): void {
    if (configured) return;

    const raw = env.CLOUDINARY_URL;
    if (!raw) {
      throw new AppError(
        "MEDIA_NOT_CONFIGURED",
        "Thiếu CLOUDINARY_URL nên chưa tải ảnh lên được",
        503,
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      throw new AppError(
        "MEDIA_NOT_CONFIGURED",
        "CLOUDINARY_URL không hợp lệ",
        503,
      );
    }

    client.config({
      cloud_name: parsed.hostname,
      api_key: decodeURIComponent(parsed.username),
      api_secret: decodeURIComponent(parsed.password),
      secure: true,
    });
    configured = true;
  }

  function uploadOnce(
    buffer: Buffer,
    folder: string,
  ): Promise<{ publicId: string; url: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const stream = client.uploader.upload_stream(
        {
          resource_type: "image",
          folder,
          format: "webp",
          timeout: TIMEOUT_MS,
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary trả kết quả rỗng"));
            return;
          }

          resolve({
            publicId: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
          });
        },
      );

      stream.end(buffer);
    });
  }

  return {
    async upload(buffer, options = {}) {
      configure();
      const folder = options.folder ?? "xmsn/media";

      try {
        return await uploadOnce(buffer, folder);
      } catch {
        // 1 retry theo plan; lỗi thứ hai để upload service map sang 502.
        return uploadOnce(buffer, folder);
      }
    },

    async destroy(publicId) {
      configure();
      const result = await client.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: "image",
      });

      if (result.result === "ok" || result.result === "not found") {
        return result.result;
      }

      throw new AppError(
        "MEDIA_DELETE_FAILED",
        "Cloudinary không xác nhận đã xoá ảnh, vui lòng thử lại",
        502,
      );
    },

    thumbnailUrl(publicId) {
      configure();
      return client.url(publicId, {
        secure: true,
        transformation: [
          {
            width: 320,
            height: 320,
            crop: "fill",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      });
    },
  };
}

export const cloudinaryStorage = createCloudinaryStorage();
