#!/bin/sh
set -e

echo "📦 正在部署 Prisma 数据库迁移..."
npx prisma migrate deploy
echo "✅ 数据库迁移完成"

echo "🚀 启动 NestJS 服务..."
exec node dist/main.js
