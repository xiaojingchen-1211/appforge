# ---------- 构建阶段 ----------
FROM node:22-slim AS builder
WORKDIR /app

# 仅复制依赖描述文件，利用 Docker 缓存
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# 复制源码并构建
COPY . .
RUN npm run build

# ---------- 运行阶段 ----------
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# 创建数据目录（持久化挂载点）
RUN mkdir -p /app/data

# 复制 Next.js standalone 产物
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 暴露端口（Sealos 会自动探测）
EXPOSE 3000

# 非 root 运行
RUN chown -R node:node /app
USER node

CMD ["node", "server.js"]
