# 个人财务管理系统 - Docker 部署文档

## 1. 项目架构

```mermaid
flowchart LR
    Browser[浏览器] -->|HTTP:80| Nginx[Nginx 反向代理]
    Nginx -->|静态资源| Frontend[Vue 前端 SPA]
    Nginx -->|/api 代理| Backend[NestJS 后端 :3000]
    Backend -->|JDBC| MySQL[(MySQL 8.0 :3306)]
```

**架构说明：**

| 层级 | 技术栈 | 服务名 | 端口 | 说明 |
|------|--------|--------|------|------|
| 入口层 | Nginx Alpine | frontend | 80 | 静态资源托管 + API 反向代理 |
| 应用层 | NestJS 10 + Node.js 18 | backend | 3000 | RESTful API + JWT 认证 + Swagger 文档 |
| 数据层 | MySQL 8.0 | mysql | 3306 | 关系型数据库，Prisma ORM |

## 2. 目录结构

```
B-2521/
├── Dockerfile              # 前端多阶段构建 Dockerfile
├── .dockerignore           # 构建排除规则
├── docker-compose.yml      # 生产环境编排
├── docker-compose.dev.yml  # 开发环境编排
├── DEPLOYMENT.md           # 本部署文档
├── nginx/
│   └── nginx.conf          # Nginx 配置文件
├── src/                    # Vue 前端源码
├── backend/
│   ├── Dockerfile          # 后端 Dockerfile
│   ├── docker-entrypoint.sh
│   ├── src/                # NestJS 后端源码
│   └── prisma/             # Prisma Schema & 迁移
└── ...
```

## 3. 生产环境部署

### 3.1 前置要求

- Docker Engine 20.10+
- Docker Compose v2.0+
- 服务器至少 2C4G 配置
- 80 端口未被占用

### 3.2 三步部署

#### 第一步：构建镜像

```bash
cd /path/to/B-2521
docker compose build
```

> 首次构建会拉取 node:18-alpine、nginx:alpine、mysql:8.0 基础镜像，请耐心等待。使用了 npmmirror 国内镜像源加速 npm 安装。

#### 第二步：启动服务

```bash
docker compose up -d
```

启动顺序：mysql → backend → frontend，后端会等待 MySQL 健康检查通过后再启动。

#### 第三步：访问应用

- **前端首页**：http://服务器IP/
- **API 文档**：http://服务器IP/docs
- **健康检查**：http://服务器IP/api

### 3.3 验证启动状态

```bash
# 查看所有容器状态
docker compose ps

# 查看启动日志
docker compose logs -f
```

预期输出：

| NAME | STATUS | PORTS |
|------|--------|-------|
| finance-mysql | Up (healthy) | 0.0.0.0:3306->3306/tcp |
| finance-backend | Up (healthy) | 0.0.0.0:3000->3000/tcp |
| finance-frontend | Up | 0.0.0.0:80->80/tcp |

## 4. 开发环境启动

开发环境使用热更新模式，代码修改后自动重载。

```bash
cd /path/to/B-2521
docker compose -f docker-compose.dev.yml up
```

访问地址：

- **前端 Vite 开发服务器**：http://localhost:5173
- **后端 API**：http://localhost:3000/api
- **Swagger 文档**：http://localhost:3000/docs
- **MySQL**：localhost:3306

> 开发环境使用独立 volume `mysql_dev_data`，不会与生产数据冲突。

## 5. 环境变量说明

### 5.1 MySQL 服务

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `MYSQL_ROOT_PASSWORD` | finance@2026 | root 用户密码（**生产必须修改**） |
| `MYSQL_DATABASE` | finance_db | 初始数据库名 |
| `MYSQL_USER` | finance | 业务用户 |
| `MYSQL_PASSWORD` | finance_pass | 业务用户密码（**生产必须修改**） |
| `TZ` | Asia/Shanghai | 时区设置 |

### 5.2 Backend 服务

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DATABASE_URL` | mysql://finance:finance_pass@mysql:3306/finance_db | Prisma 连接串 |
| `JWT_SECRET` | finance_super_secret_change_in_production_2026! | JWT 签名密钥（**生产必须修改，建议 32+ 随机字符**） |
| `JWT_EXPIRES_IN` | 7d | Token 过期时间 |
| `PORT` | 3000 | 监听端口 |
| `TZ` | Asia/Shanghai | 时区设置 |
| `NODE_ENV` | production | 运行模式 |

### 5.3 Frontend 服务

生产环境前端为纯静态资源，无运行时环境变量（构建时注入）。

## 6. 常用运维命令

### 6.1 基础操作

```bash
# 查看所有服务状态
docker compose ps

# 查看实时日志（指定服务）
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f mysql

# 查看最近 200 行日志
docker compose logs --tail=200 backend
```

### 6.2 启停操作

```bash
# 停止所有服务
docker compose stop

# 启动已停止的服务
docker compose start

# 重启所有服务
docker compose restart

# 重启单个服务
docker compose restart backend
```

### 6.3 重建与更新

```bash
# 拉取最新代码后，重新构建并启动
docker compose down
docker compose build --no-cache
docker compose up -d

# 仅重建后端（前端代码未变更时）
docker compose up -d --build backend

# 清理未使用的镜像和构建缓存
docker system prune -af
```

### 6.4 进入容器

```bash
# 进入后端容器
docker compose exec backend sh

# 进入 MySQL 命令行
docker compose exec mysql mysql -ufinance -pfinance_pass finance_db

# 进入 Nginx 容器
docker compose exec frontend sh
```

## 7. 端口清单

| 端口 | 服务 | 协议 | 生产暴露 | 开发暴露 | 说明 |
|------|------|------|----------|----------|------|
| 80 | Nginx | TCP | ✅ 是 | ❌ 否 | 前端访问入口 |
| 3000 | NestJS | TCP | ⚠️ 映射（可关闭） | ✅ 是 | 后端 API，生产可仅内部通信 |
| 3306 | MySQL | TCP | ⚠️ 映射（建议关闭） | ✅ 是 | 数据库端口，生产建议注释掉 ports |
| 5173 | Vite | TCP | ❌ 否 | ✅ 是 | 仅开发环境 HMR |

> **生产安全建议**：编辑 `docker-compose.yml`，注释掉 mysql 和 backend 的 `ports` 段，仅通过 Nginx 对外暴露 80 端口。

## 8. 数据备份与恢复

### 8.1 备份数据库

```bash
# 备份整个数据库到宿主机当前目录
docker compose exec mysql mysqldump \
  -uroot -pfinance@2026 \
  --single-transaction \
  --routines \
  --triggers \
  finance_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份并压缩
docker compose exec mysql mysqldump \
  -uroot -pfinance@2026 \
  --single-transaction \
  finance_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 8.2 恢复数据库

```bash
# 从 SQL 文件恢复
docker compose exec -T mysql mysql \
  -uroot -pfinance@2026 \
  finance_db < backup_20260611_120000.sql

# 从压缩包恢复
gunzip -c backup_20260611_120000.sql.gz | \
  docker compose exec -T mysql mysql \
  -uroot -pfinance@2026 finance_db
```

### 8.3 迁移 Volume 数据（完整迁移）

```bash
# 备份 volume 到 tar
docker run --rm \
  -v finance-mysql-data:/source \
  -v $(pwd):/backup \
  alpine tar czf /backup/mysql_volume_backup.tar.gz -C /source .

# 恢复 volume
docker run --rm \
  -v finance-mysql-data:/target \
  -v $(pwd):/backup \
  alpine sh -c "cd /target && tar xzf /backup/mysql_volume_backup.tar.gz"
```

## 9. 故障排查

### 9.1 服务启动失败

#### 检查 MySQL 是否正常

```bash
# 查看 MySQL 日志
docker compose logs mysql

# 手动健康检查
docker compose exec mysql mysqladmin ping -h localhost -u root -pfinance@2026
```

**常见问题**：
- `mbind: Operation not permitted`：在 docker-compose.yml 的 mysql 服务下添加 `security_opt: [ seccomp:unconfined ]`
- 数据卷权限问题：删除 volume 重新初始化 `docker volume rm finance-mysql-data`

#### 检查后端连接数据库

```bash
# 查看后端启动日志
docker compose logs backend --tail=100

# 检查后端能否解析 mysql 主机名
docker compose exec backend getent hosts mysql

# 手动测试数据库连接
docker compose exec backend wget -qO- http://localhost:3000/api
```

**常见问题**：
- `P1001 Can't reach database server`：MySQL 尚未就绪，等待 healthcheck 通过后自动重试
- `Access denied`：检查 `DATABASE_URL` 中的用户名密码是否与 MySQL 配置一致
- Prisma 迁移未执行：手动执行 `docker compose exec backend npx prisma migrate deploy`

#### 检查 Nginx / 前端

```bash
# 测试 Nginx 配置语法
docker compose exec frontend nginx -t

# 重载 Nginx 配置（修改 nginx.conf 后）
docker compose exec frontend nginx -s reload

# 检查后端代理连通性
docker compose exec frontend wget -qO- http://backend:3000/api
```

**常见问题**：
- 502 Bad Gateway：后端服务未就绪或 service 名称不匹配
- 404 刷新路由：确认 `try_files $uri $uri/ /index.html;` 配置存在
- 静态资源 404：检查 dist 目录是否正确复制到 `/usr/share/nginx/html`

### 9.2 性能问题排查

```bash
# 查看容器资源占用
docker stats

# 查看 MySQL 慢查询
docker compose exec mysql mysql -uroot -pfinance@2026 -e "SHOW PROCESSLIST;"

# 查看后端内存使用
docker compose exec backend node -e "console.log(process.memoryUsage())"
```

## 10. 生产环境加固建议

### 10.1 修改敏感配置

```yaml
# docker-compose.yml 必须修改：
mysql:
  environment:
    MYSQL_ROOT_PASSWORD: <强随机密码>
    MYSQL_PASSWORD: <另一个强随机密码>

backend:
  environment:
    JWT_SECRET: <至少 64 位随机字符串>
```

生成强密码：
```bash
openssl rand -hex 32
```

### 10.2 关闭不必要的端口映射

编辑 `docker-compose.yml`，注释或删除：
```yaml
# mysql:
#   ports:
#     - "3306:3306"   # 生产不对外暴露数据库

# backend:
#   ports:
#     - "3000:3000"   # 仅通过 Nginx /api 访问
```

### 10.3 配置 HTTPS（推荐）

在 Nginx 配置中增加 SSL，或前置 Traefik / Cloudflare 做 TLS 终止。

---

**文档版本**：v1.0
**最后更新**：2026-06-11
