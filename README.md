# 智慧记账管理平台

智慧记账是一款基于 Vue 3 + Vite 的现代化财务管理应用。它提供了直观的仪表盘、详细的交易记录、深度的收支分析、科学的预算管理以及全面的资产监控，旨在为用户提供产品级的财务管理体验。

## 🚀 快速启动

### 方式一：Docker 一键部署 (推荐)

如果您已安装 Docker 和 Docker Compose，可以使用以下命令快速启动：

```bash
docker-compose up
```

启动后访问：`http://localhost:5173`

### 方式二：本地开发环境 (NPM/Node)

1. **安装依赖**

   ```bash
   npm install
   ```

2. **启动开发服务器**

   ```bash
   npm run dev
   ```

3. **生产环境构建**

   ```bash
   npm run build
   ```

## ✨ 核心亮点

- **💾 本地数据持久化**：采用 `LocalStorage` 结合 `Mock` 数据实现，无需后端服务器即可体验完整的增删改查及数据分析功能。
- **📱 全设备响应式**：针对手机、平板及桌面端进行了深度适配，确保在任何屏幕上都具备极佳的交互体验。
- **📈 数据可视化**：集成 ECharts，提供清晰的收支结构分析与支出排行，让财务状况一目了然。
- **✨ 深度美学设计**：采用毛玻璃效果 与动态渐变背景，支持深色/浅色模式无缝切换。
- **🏦 多维度资产管理**：支持银行卡、现金、第三方支付等多种账户类型，内置账户隐藏功能，保护隐私。
- **🎯 科学预算体系**：提供总预算与分类预算明细，实时监控超支风险。

## 🛠️ 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **状态管理**: Pinia
- **UI 组件库**: Element Plus
- **图标库**: Lucide Vue Next
- **图表库**: ECharts
- **样式**: CSS Variables & Sass
- **语言**: TypeScript

## 📁 项目结构

```text
src/
├── components/         # 通用交互组件 (记一笔、设置、图标封装)
├── layouts/            # 核心布局框架 (响应式侧边栏、移动端抽屉)
├── store/              # 财务数据状态管理 (Pinia)
├── views/              # 功能模块页面
│   ├── Dashboard.vue   # 仪表盘概览
│   ├── Transactions.vue# 账单交易明细
│   ├── Analysis.vue    # 数据统计分析
│   ├── Budget.vue      # 预算管控
│   └── Accounts.vue    # 资产账户管理
└── App.vue             # 应用入口
```
