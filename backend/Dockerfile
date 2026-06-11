# ================== 构建阶段 ==================
FROM node:18-alpine AS builder

WORKDIR /app

ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

RUN apk add --no-cache openssl wget make gcc g++ python3

COPY package.json package-lock.json ./

RUN npm ci --registry=https://registry.npmmirror.com

COPY . .

RUN npx prisma generate

RUN npm run build

# ================== 运行阶段 ==================
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache openssl wget

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/auth/login',(r)=>process.exit(r.statusCode===404||r.statusCode===405?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
