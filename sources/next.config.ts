import type { NextConfig } from "next";

// Cho phép giảm số worker khi build trong container ít RAM (Docker/VPS).
// Local không đặt biến này thì Next dùng mặc định theo số CPU.
const buildCpus = Number(process.env.NEXT_BUILD_CPUS);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/**",
      },
      {
        protocol: "https",
        hostname: "thumb.wikimedia.org",
        pathname: "/wikipedia/**",
      },
    ],
  },
  ...(Number.isInteger(buildCpus) && buildCpus > 0
    ? { experimental: { cpus: buildCpus } }
    : {}),
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
