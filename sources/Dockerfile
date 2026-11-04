# syntax=docker/dockerfile:1

# Ảnh runtime dùng chung. Prisma 6.19 hỗ trợ Node 18/20/22.
FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
# Prisma engine + TLS tới Aiven cần openssl/ca-certificates.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ---- Cài dependency đầy đủ + generate Prisma Client ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- Build Next.js ----
FROM base AS builder
ENV NODE_ENV=production
# Giảm worker để build vừa RAM trên VPS/CI nhỏ.
ARG NEXT_BUILD_CPUS=2
ENV NEXT_BUILD_CPUS=${NEXT_BUILD_CPUS}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Chỉ giữ dependency runtime ----
FROM deps AS prod-deps
RUN npm prune --omit=dev --ignore-scripts

# ---- Image chạy app ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=prod-deps /app/node_modules ./node_modules
# Prisma Client đã generate ở stage deps; prune có thể bỏ .prisma nên copy lại.
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY package.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["npm", "run", "start"]

# ---- Image chạy migration (có Prisma CLI) ----
FROM deps AS migrate
ENV NODE_ENV=production
CMD ["npx", "prisma", "migrate", "deploy"]
