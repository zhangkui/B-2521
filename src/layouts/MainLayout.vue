<template>
  <el-container class="layout-container">
    <el-aside
      v-if="!isMobile"
      :width="isCollapse ? '64px' : '240px'"
      class="sidebar"
      :class="{ 'is-collapsed': isCollapse }"
    >
      <div class="sidebar-content">
        <div class="logo" @click="isCollapse = !isCollapse">
          <div class="logo-icon">
            <lucide-icon name="Wallet" :size="24" color="white" />
          </div>
          <span v-if="!isCollapse" class="logo-text">智慧记账</span>
        </div>

        <el-menu
          :default-active="activeRoute"
          class="side-menu"
          :collapse="isCollapse"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><lucide-icon name="LayoutDashboard" /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/transactions">
            <el-icon><lucide-icon name="History" /></el-icon>
            <span>明细查询</span>
          </el-menu-item>
          <el-menu-item index="/analysis">
            <el-icon><lucide-icon name="PieChart" /></el-icon>
            <span>统计分析</span>
          </el-menu-item>
          <el-menu-item index="/budget">
            <el-icon><lucide-icon name="Target" /></el-icon>
            <span>预算管理</span>
          </el-menu-item>
          <el-menu-item index="/accounts">
            <el-icon><lucide-icon name="CreditCard" /></el-icon>
            <span>资产管理</span>
          </el-menu-item>
          <el-menu-item index="/categories">
            <el-icon><lucide-icon name="Tags" /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
          <el-sub-menu index="tags-menu">
            <template #title>
              <el-icon><lucide-icon name="Bookmark" /></el-icon>
              <span>标签分析</span>
            </template>
            <el-menu-item index="/tag-stats">
              <el-icon><lucide-icon name="PieChart" /></el-icon>
              <span>标签统计</span>
            </el-menu-item>
            <el-menu-item index="/tag-trend">
              <el-icon><lucide-icon name="TrendingUp" /></el-icon>
              <span>趋势分析</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/reports">
            <el-icon><lucide-icon name="FileText" /></el-icon>
            <span>报表中心</span>
          </el-menu-item>
          <el-sub-menu index="reports-menu">
            <template #title>
              <el-icon><lucide-icon name="BookOpen" /></el-icon>
              <span>报表管理</span>
            </template>
            <el-menu-item index="/report-history">
              <el-icon><lucide-icon name="FileArchive" /></el-icon>
              <span>历史报表</span>
            </el-menu-item>
            <el-menu-item index="/report-subscription">
              <el-icon><lucide-icon name="BellRing" /></el-icon>
              <span>定时订阅</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>

        <div class="sidebar-footer">
          <div class="user-block" v-if="!isCollapse">
            <div class="avatar-wrapper">
              <el-avatar
                :size="42"
                :src="avatarSrc"
                class="user-avatar"
              />
            </div>
            <div class="user-info-text">
              <span class="user-name">{{ username }}</span>
              <div class="user-badge">已登录</div>
            </div>
          </div>
          <el-button link @click="handleLogout" class="logout-btn">
            <el-icon><lucide-icon name="LogOut" /></el-icon>
            <span v-if="!isCollapse">退出登录</span>
          </el-button>
        </div>
      </div>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button link @click="toggleSidebar">
            <el-icon :size="20">
              <lucide-icon
                :name="isCollapse && !isMobile ? 'Menu' : 'ChevronLeft'"
              />
            </el-icon>
          </el-button>
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <el-button circle class="icon-btn" @click="settingsVisible = true">
            <el-icon><lucide-icon name="Settings" /></el-icon>
          </el-button>
          <el-button type="primary" class="add-btn" @click="openQuickAdd">
            <lucide-icon name="Plus" :size="18" />
            <span class="ml-2">记一笔</span>
          </el-button>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>

  <el-drawer
    v-model="mobileMenuVisible"
    direction="ltr"
    size="240px"
    :with-header="false"
    class="mobile-drawer"
  >
    <div class="mobile-sidebar-inner">
      <div class="logo">
        <div class="logo-icon">
          <lucide-icon name="Wallet" :size="24" color="white" />
        </div>
        <span class="logo-text">智慧记账</span>
      </div>
      <el-menu
        :default-active="activeRoute"
        class="side-menu"
        router
        @select="mobileMenuVisible = false"
      >
        <el-menu-item index="/dashboard">
          <el-icon><lucide-icon name="LayoutDashboard" /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/transactions">
          <el-icon><lucide-icon name="History" /></el-icon>
          <span>收支明细</span>
        </el-menu-item>
        <el-menu-item index="/analysis">
          <el-icon><lucide-icon name="PieChart" /></el-icon>
          <span>收支分析</span>
        </el-menu-item>
        <el-menu-item index="/budget">
          <el-icon><lucide-icon name="Target" /></el-icon>
          <span>预算管理</span>
        </el-menu-item>
        <el-menu-item index="/accounts">
          <el-icon><lucide-icon name="CreditCard" /></el-icon>
          <span>资产管理</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><lucide-icon name="Tags" /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-sub-menu index="tags-menu">
          <template #title>
            <el-icon><lucide-icon name="Bookmark" /></el-icon>
            <span>标签分析</span>
          </template>
          <el-menu-item index="/tag-stats">
            <el-icon><lucide-icon name="PieChart" /></el-icon>
            <span>标签统计</span>
          </el-menu-item>
          <el-menu-item index="/tag-trend">
            <el-icon><lucide-icon name="TrendingUp" /></el-icon>
            <span>趋势分析</span>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/reports">
          <el-icon><lucide-icon name="FileText" /></el-icon>
          <span>报表中心</span>
        </el-menu-item>
        <el-sub-menu index="reports-menu">
          <template #title>
            <el-icon><lucide-icon name="BookOpen" /></el-icon>
            <span>报表管理</span>
          </template>
          <el-menu-item index="/report-history">
            <el-icon><lucide-icon name="FileArchive" /></el-icon>
            <span>历史报表</span>
          </el-menu-item>
          <el-menu-item index="/report-subscription">
            <el-icon><lucide-icon name="BellRing" /></el-icon>
            <span>定时订阅</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
      <div class="sidebar-footer mobile-footer">
        <div class="user-block">
          <div class="avatar-wrapper">
            <el-avatar
              :size="42"
              :src="avatarSrc"
              class="user-avatar"
            />
          </div>
          <div class="user-info-text">
            <span class="user-name">{{ username }}</span>
            <div class="user-badge">已登录</div>
          </div>
        </div>
        <el-button link @click="handleLogout" class="logout-btn">
          <el-icon><lucide-icon name="LogOut" /></el-icon>
          <span>退出登录</span>
        </el-button>
      </div>
    </div>
  </el-drawer>

  <QuickAddDialog v-model="quickAddVisible" />
  <SettingsDialog
    v-model="settingsVisible"
    :initial-sidebar-collapse="isCollapse"
    :initial-dark-mode="isDarkMode"
    @settings-applied="handleSettingsApplied"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import LucideIcon from "../components/LucideIcon.vue";
import QuickAddDialog from "../components/QuickAddDialog.vue";
import SettingsDialog from "../components/SettingsDialog.vue";
import { useAuthStore } from "../store/auth";
import { useFinanceStore } from "../store/finance";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const financeStore = useFinanceStore();

const isCollapse = ref(localStorage.getItem("sidebarCollapse") === "true");
const isDarkMode = ref(localStorage.getItem("darkMode") === "true");
const quickAddVisible = ref(false);
const settingsVisible = ref(false);
const mobileMenuVisible = ref(false);
const isMobile = ref(false);
const isLoaded = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 1024;
};

onMounted(async () => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  try {
    await financeStore.initialize();
    await financeStore.loadTransactions();
    isLoaded.value = true;
  } catch (err) {
    console.error("初始化数据失败:", err);
    ElMessage.error("加载数据失败，请刷新重试");
    isLoaded.value = true;
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});

const toggleSidebar = () => {
  if (isMobile.value) {
    mobileMenuVisible.value = true;
  } else {
    isCollapse.value = !isCollapse.value;
  }
};

if (isDarkMode.value) {
  document.documentElement.classList.add("dark");
}

const handleSettingsApplied = (settings: {
  darkMode: boolean;
  sidebarCollapse: boolean;
}) => {
  isCollapse.value = settings.sidebarCollapse;
  isDarkMode.value = settings.darkMode;
  localStorage.setItem("sidebarCollapse", String(settings.sidebarCollapse));
  localStorage.setItem("darkMode", String(settings.darkMode));
};

watch(isDarkMode, (val) => {
  if (val) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
});

const activeRoute = computed(() => route.path);
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    "/dashboard": "仪表盘概览",
    "/transactions": "收支明细",
    "/analysis": "收支分析",
    "/budget": "预算管理",
    "/accounts": "账户管理",
    "/categories": "分类管理",
    "/tag-stats": "标签统计总览",
    "/tag-trend": "标签趋势分析",
    "/reports": "历史报表中心",
    "/report-history": "历史报表中心",
    "/report-subscription": "定时报表订阅",
  };
  return titles[route.path] || "智慧记账";
});

const username = computed(() => authStore.displayName);
const avatarSrc = computed(() => {
  const seed = authStore.user?.username || "user";
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
});

const handleLogout = async () => {
  ElMessageBox.confirm("确定要退出登录吗？", "提示", {
    confirmButtonText: "确定退出",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      await authStore.logout();
      ElMessage.success("已退出登录");
      router.push("/login");
    })
    .catch(() => {});
};

const openQuickAdd = () => {
  quickAddVisible.value = true;
};
</script>

<style scoped>
.layout-container {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.02);
  z-index: 10;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.logo:hover .logo-icon {
  transform: scale(1.05);
}

.sidebar.is-collapsed .logo {
  padding: 0;
  justify-content: center;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-text {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text-main);
  white-space: nowrap;
}

.side-menu {
  border-right: none;
  flex: 1;
  background: transparent;
}

.side-menu :deep(.el-menu-item) {
  height: 54px;
  margin: 4px 8px;
  border-radius: 10px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.side-menu:not(.el-menu--collapse) :deep(.el-menu-item) {
  justify-content: flex-start;
}

.side-menu.el-menu--collapse :deep(.el-menu-item) {
  margin: 8px 10px;
  height: 44px;
  border-radius: 12px;
  padding: 0;
}

.side-menu :deep(.el-menu-item.is-active) {
  background: var(--primary-light);
  color: white;
  font-weight: 600;
}

html.dark .side-menu :deep(.el-menu-item.is-active) {
  background: var(--primary);
}

.sidebar-footer {
  padding: 24px 20px;
  border-top: 1px solid var(--border);
  transition: padding 0.3s;
}

.sidebar.is-collapsed .sidebar-footer {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.user-block {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
  padding: 0 4px;
}

.user-info-text {
  flex: 1;
  overflow: hidden;
  text-align: left;
}

.user-name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-main);
  display: block;
  margin-bottom: 2px;
}

.user-badge {
  font-size: 0.75rem;
  color: var(--primary);
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: 6px;
  display: inline-block;
}

.logout-btn {
  width: 100%;
  justify-content: flex-start;
  padding: 12px 16px;
  transition: all 0.3s;
  font-size: 1.05rem;
  font-weight: 600;
  height: auto;
  min-height: 48px;
  border-radius: 12px;
  color: var(--text-muted);
  margin-top: 12px;
  background: #f8fafc;
}

.logout-btn :deep(.el-icon) {
  font-size: 20px;
  margin-right: 12px;
}

.sidebar.is-collapsed .logout-btn {
  justify-content: center;
  padding: 12px 0;
  border-radius: 12px;
  margin-top: 12px;
}

.sidebar.is-collapsed .logout-btn :deep(.el-icon) {
  margin-right: 0;
}

.logout-btn:hover {
  color: var(--danger);
  background: #fef2f2;
}

.header {
  height: 64px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  transition: background 0.3s;
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right :deep(.el-button + .el-button) {
  margin-left: 0;
}

.icon-btn {
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.avatar-wrapper {
  position: relative;
  display: flex;
}

.user-avatar {
  border: 2px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.add-btn {
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  padding: 0 16px;
}

.main-content {
  background: var(--background);
  padding: 24px;
  overflow-y: auto;
}

.ml-2 {
  margin-left: 8px;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-15px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(15px);
}

.mobile-sidebar-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mobile-sidebar-inner .logo {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.mobile-footer .logout-btn {
  font-size: 1.05rem;
  font-weight: 600;
  height: 48px;
  width: 100%;
}

.mobile-footer .logout-btn :deep(.el-icon) {
  font-size: 20px;
  margin-right: 10px;
}

@media (max-width: 1024px) {
  .header {
    padding: 0 12px;
  }

  .header-right {
    gap: 12px;
  }

  .page-title {
    font-size: 0.95rem;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .add-btn span {
    display: none;
  }

  .add-btn {
    padding: 0 10px;
    width: 38px;
    height: 38px;
    border-radius: 50%;
  }

  .icon-btn {
    padding: 8px;
    width: 36px;
    height: 36px;
  }

  .main-content {
    padding: 16px;
  }
}
</style>
