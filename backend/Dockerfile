# ================== 构建阶段 ==================
FROM node:18-alpine AS builder

WORKDIR /app

# 先复制 package.json 和 package-lock.json，利用 Docker 缓存
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci --registry=https://registry.npmmirror.com

# 复制源文件
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建项目
RUN npm run build

# ================== 运行阶段 ==================
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001

# 复制 package.json 和生成的 lock 文件
COPY package.json package-lock.json ./

# 仅安装生产依赖
RUN npm install --omit=dev --registry=https://registry.npmmirror.com

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 复制 Prisma schema 和迁移文件（用于部署时执行迁移）
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 复制启动脚本
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# 赋予权限
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/docs || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
