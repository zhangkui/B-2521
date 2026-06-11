# 个人财务管理系统 - 后端 API

基于 **NestJS + TypeScript + Prisma + MySQL + JWT** 构建的个人财务管理系统后端服务。

## ✨ 功能特性

### 1. 用户认证模块
- ✅ 用户注册（自动初始化默认账户和分类）
- ✅ 用户登录（JWT Token 认证）
- ✅ 用户退出登录
- ✅ Token 过期验证

### 2. 用户账户管理
- ✅ 创建账户（现金/银行卡/信用卡/支付宝/微信/投资等）
- ✅ 查询账户列表 / 单个账户详情
- ✅ 更新账户信息（余额自动联动计算）
- ✅ 删除账户（校验关联交易记录）
- ✅ 账户汇总统计

### 3. 用户分类管理
- ✅ 创建自定义分类（支持父子层级）
- ✅ 按类型查询分类（收入/支出）
- ✅ 更新分类信息（系统分类受保护）
- ✅ 删除分类（校验子分类和关联交易）
- ✅ 系统预设分类（注册时自动生成）

### 4. 交易记录管理
- ✅ 创建交易记录（自动更新账户余额）
- ✅ 分页查询交易记录（多条件筛选 + 关键词搜索）
- ✅ 更新交易记录（跨账户变更时自动调账）
- ✅ 删除交易记录（自动回滚账户余额）
- ✅ 统计分析（按分类汇总 / 收支净额）

### 5. 用户数据隔离
- ✅ 所有业务操作均校验 `userId` 归属
- ✅ 通过 JWT 自动注入当前用户上下文
- ✅ 跨用户访问返回 403 Forbidden
- ✅ Prisma 查询均包含 `userId` 条件

---

## 🛠️ 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js | >= 18.x |
| 框架 | NestJS | ^10.3.0 |
| 语言 | TypeScript | ^5.3.3 |
| ORM | Prisma | ^5.8.1 |
| 数据库 | MySQL | >= 5.7 / 8.0 |
| 认证 | JWT (passport-jwt) | ^4.0.1 |
| 密码加密 | bcrypt | ^5.1.1 |
| 数据校验 | class-validator | ^0.14.1 |
| API 文档 | Swagger (@nestjs/swagger) | ^7.2.0 |

---

## 📦 快速开始

### 1. 环境准备

确保已安装以下软件：
- **Node.js** >= 18.0.0
- **MySQL** >= 5.7 或 8.0
- **npm** 或 **yarn** 或 **pnpm**

### 2. 安装依赖

```bash
cd backend
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
# 数据库连接字符串
# 格式: mysql://用户名:密码@主机:端口/数据库名
DATABASE_URL="mysql://root:your_password@localhost:3306/finance_db"

# JWT 密钥（生产环境请使用复杂随机字符串）
JWT_SECRET="change-this-to-a-very-long-random-string"

# Token 有效期
JWT_EXPIRES_IN="7d"

# 服务端口
PORT=3000
```

### 4. 初始化数据库

创建数据库（如果不存在）：

```sql
CREATE DATABASE finance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

运行数据库迁移：

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行迁移（开发环境）
npm run prisma:migrate
```

### 5. 启动服务

```bash
# 开发模式（热重载）
npm run start:dev

# 生产构建
npm run build
npm run start:prod
```

启动成功后：
- API 服务: `http://localhost:3000`
- Swagger 文档: `http://localhost:3000/docs`

---

## 📚 API 接口概览

所有接口前缀: `/api`

### 🔐 认证模块 `Public`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/register` | 用户注册 |
| POST | `/auth/login` | 用户登录 |
| POST | `/auth/logout` | 用户退出 |

### 👤 用户模块 `Bearer Auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/users/profile` | 获取当前用户信息 |
| PUT | `/users/profile` | 更新用户信息 |
| PATCH | `/users/password` | 修改密码 |

### 💰 账户模块 `Bearer Auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/accounts` | 创建账户 |
| GET | `/accounts` | 获取账户列表 |
| GET | `/accounts/summary` | 获取账户汇总 |
| GET | `/accounts/:id` | 获取账户详情 |
| PATCH | `/accounts/:id` | 更新账户 |
| DELETE | `/accounts/:id` | 删除账户 |

### 🏷️ 分类模块 `Bearer Auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/categories` | 创建分类 |
| GET | `/categories` | 获取分类列表（可按 type 筛选） |
| GET | `/categories/type/:type` | 按类型获取分类 |
| GET | `/categories/:id` | 获取分类详情 |
| PATCH | `/categories/:id` | 更新分类 |
| DELETE | `/categories/:id` | 删除分类 |

### 💸 交易记录模块 `Bearer Auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/transactions` | 创建交易记录 |
| GET | `/transactions` | 分页查询交易记录 |
| GET | `/transactions/statistics` | 获取交易统计 |
| GET | `/transactions/:id` | 获取交易详情 |
| PATCH | `/transactions/:id` | 更新交易记录 |
| DELETE | `/transactions/:id` | 删除交易记录 |

---

## 🔑 认证流程

### 1. 注册

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "password": "password123",
    "nickname": "张三"
  }'
```

响应：
```json
{
  "user": {
    "id": 1,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "nickname": "张三",
    "avatar": null,
    "createdAt": "..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. 登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "zhangsan",
    "password": "password123"
  }'
```

### 3. 调用受保护接口

在请求头中携带 Token：

```bash
curl -X GET http://localhost:3000/api/accounts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📁 项目结构

```
backend/
├── prisma/
│   └── schema.prisma          # Prisma 数据模型定义
├── src/
│   ├── main.ts                # 应用入口
│   ├── app.module.ts          # 根模块
│   ├── prisma/                # Prisma 模块
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── auth/                  # 认证模块
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       └── login.dto.ts
│   ├── users/                 # 用户模块
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   └── users.service.ts
│   ├── accounts/              # 账户模块
│   │   ├── accounts.module.ts
│   │   ├── accounts.controller.ts
│   │   ├── accounts.service.ts
│   │   └── dto/
│   │       └── accounts.dto.ts
│   ├── categories/            # 分类模块
│   │   ├── categories.module.ts
│   │   ├── categories.controller.ts
│   │   ├── categories.service.ts
│   │   └── dto/
│   │       └── categories.dto.ts
│   ├── transactions/          # 交易记录模块
│   │   ├── transactions.module.ts
│   │   ├── transactions.controller.ts
│   │   ├── transactions.service.ts
│   │   └── dto/
│   │       └── transactions.dto.ts
│   └── common/                # 公共模块
│       ├── decorators/
│       │   ├── get-user.decorator.ts
│       │   └── public.decorator.ts
│       ├── filters/
│       │   └── all-exceptions.filter.ts
│       └── interfaces/
│           └── jwt-payload.interface.ts
├── .env.example               # 环境变量示例
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 🔒 数据隔离设计

系统通过以下机制确保用户数据严格隔离：

### 1. 数据库层
- 所有业务表都有 `userId` 外键
- `ON DELETE: Cascade` 删除用户时自动清理所有数据

### 2. 应用层
- `JwtAuthGuard` 全局守卫：校验 Token 并注入 `request.user`
- `@GetUser()` 装饰器：便捷获取当前用户 ID
- 每个 Service 方法都校验 `userId` 归属：
  ```typescript
  const account = await this.prisma.account.findUnique({ where: { id } });
  if (account.userId !== userId) {
    throw new ForbiddenException('无权访问此账户');
  }
  ```
- 所有查询均带 `{ where: { userId } }` 条件

### 3. 公开接口
- `@Public()` 装饰器标记无需认证的接口
- 仅 `/auth/register` 和 `/auth/login` 公开

---

## 📝 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run start:dev` | 启动开发服务器（热重载） |
| `npm run build` | 编译 TypeScript 到 dist/ |
| `npm run start:prod` | 启动生产服务器 |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:migrate` | 创建并应用迁移（开发） |
| `npm run prisma:deploy` | 部署迁移到生产 |
| `npm run prisma:studio` | 打开 Prisma Studio 可视化工具 |

---

## ⚠️ 常见问题

### 1. 数据库连接失败
- 检查 MySQL 是否启动
- 确认 `.env` 中 `DATABASE_URL` 用户名密码正确
- 确认数据库 `finance_db` 已创建

### 2. Prisma 迁移失败
- 先执行 `npm run prisma:generate`
- 删除 `prisma/migrations/` 后重新 `prisma:migrate`

### 3. Token 未生效
- Swagger UI 中点击右上角 **Authorize** 按钮
- 输入 `Bearer <your_token>` 格式
- 或请求头添加 `Authorization: Bearer <token>`

---

## 📄 License

MIT
