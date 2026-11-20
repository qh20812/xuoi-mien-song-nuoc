import type { NextConfig } from "next";

// Cho phép giảm số worker khi build trong container ít RAM (Docker/VPS).
// Local không đặt biến này thì Next dùng mặc định theo số CPU.
const buildCpus = Number(process.env.NEXT_BUILD_CPUS);

/**
 * D10.4 mở lại `remotePatterns` **hẹp** cho Cloudinary. Ưu tiên pathname theo đúng
 * cloud_name trong `CLOUDINARY_URL`; nếu lúc build thiếu env thì fallback `/**` trên
 * cùng host để ảnh vẫn render (validator runtime vẫn chặn host khác).
 */
function cloudinaryCloudName(): string | null {
  const url = process.env.CLOUDINARY_URL;
  if (!url) return null;

  try {
    return new URL(url).hostname || null;
  } catch {
    return null;
  }
}

const cloudName = cloudinaryCloudName();

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // SDK/native binary không bundle vào server chunk.
  serverExternalPackages: ["cloudinary", "sharp"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: cloudName ? `/${cloudName}/image/upload/**` : "/**",
      },
    ],
  },
  experimental: {
    agentUpgrade: "security",
    ...(Number.isInteger(buildCpus) && buildCpus > 0 ? { cpus: buildCpus } : {}),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
