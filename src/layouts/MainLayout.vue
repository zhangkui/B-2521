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
        </el-menu>

        <div class="sidebar-footer">
          <div class="user-block" v-if="!isCollapse">
            <div class="avatar-wrapper">
              <el-avatar
                :size="42"
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                class="user-avatar"
              />
            </div>
            <div class="user-info-text">
              <span class="user-name">{{ username }}</span>
              <div class="user-badge">Premium Elite</div>
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
          <el-popover
            placement="bottom-end"
            :width="320"
            trigger="click"
            popper-class="notification-popper"
          >
            <template #reference>
              <el-badge :value="2" class="notif-badge" :hidden="!hasUnread">
                <el-button circle class="icon-btn">
                  <el-icon><lucide-icon name="Bell" /></el-icon>
                </el-button>
              </el-badge>
            </template>
            <div class="notif-content">
              <div class="notif-header">
                <span>消息通知</span>
                <el-button link type="primary" size="small" @click="clearNotifs"
                  >全部已读</el-button
                >
              </div>
              <div class="notif-list" v-if="notifications.length">
                <div v-for="n in notifications" :key="n.id" class="notif-item">
                  <div class="notif-icon" :class="n.type">
                    <lucide-icon :name="n.icon" :size="14" />
                  </div>
                  <div class="notif-info">
                    <p class="notif-text">{{ n.text }}</p>
                    <span class="notif-time">{{ n.time }}</span>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无新通知" :image-size="60" />
            </div>
          </el-popover>
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

  <!-- Mobile Sidebar Drawer -->
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
      </el-menu>
      <div class="sidebar-footer mobile-footer">
        <div class="user-block">
          <div class="avatar-wrapper">
            <el-avatar
              :size="42"
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              class="user-avatar"
            />
          </div>
          <div class="user-info-text">
            <span class="user-name">{{ username }}</span>
            <div class="user-badge">Premium Elite</div>
          </div>
        </div>
        <el-button link @click="handleLogout" class="logout-btn">
          <el-icon><lucide-icon name="LogOut" /></el-icon>
          <span>退出登录</span>
        </el-button>
      </div>
    </div>
  </el-drawer>

  <!-- Quick Add Dialog -->
  <QuickAddDialog v-model="quickAddVisible" />
  <!-- Settings Dialog -->
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
import { ElMessage } from "element-plus";
import LucideIcon from "../components/LucideIcon.vue";
import QuickAddDialog from "../components/QuickAddDialog.vue";
import SettingsDialog from "../components/SettingsDialog.vue";

const route = useRoute();
const router = useRouter();
const isCollapse = ref(localStorage.getItem("sidebarCollapse") === "true");
const isDarkMode = ref(localStorage.getItem("darkMode") === "true");
const quickAddVisible = ref(false);
const settingsVisible = ref(false);
const mobileMenuVisible = ref(false);
const isMobile = ref(false);
const hasUnread = ref(true);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 1024;
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
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

// Apply saved dark mode on initial load
if (isDarkMode.value) {
  document.documentElement.classList.add("dark");
}

const handleSettingsApplied = (settings: {
  darkMode: boolean;
  sidebarCollapse: boolean;
}) => {
  isCollapse.value = settings.sidebarCollapse;
  isDarkMode.value = settings.darkMode;

  // Persist to localStorage
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

const notifications = ref([
  {
    id: 1,
    text: "您的2月预算已使用超过80%",
    time: "10分钟前",
    type: "warning",
    icon: "AlertTriangle",
  },
  {
    id: 2,
    text: "发现一笔异常的大额支出记录",
    time: "2小时前",
    type: "error",
    icon: "Zap",
  },
  {
    id: 3,
    text: "欢迎使用智慧记账！",
    time: "昨天",
    type: "info",
    icon: "PartyPopper",
  },
]);

const activeRoute = computed(() => route.path);
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    "/dashboard": "仪表盘概览",
    "/transactions": "收支明细",
    "/analysis": "收支分析",
    "/budget": "预算管理",
    "/accounts": "账户管理",
  };
  return titles[route.path] || "智慧记账";
});

const username = ref(
  JSON.parse(localStorage.getItem("totoro_user") || '{"name": "Guest"}').name,
);

const handleLogout = () => {
  localStorage.removeItem("totoro_user");
  router.push("/login");
};

const openQuickAdd = () => {
  quickAddVisible.value = true;
};

const clearNotifs = () => {
  hasUnread.value = false;
  notifications.value = [];
  ElMessage.success("已清除所有通知");
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
  gap: 30px;
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

.premium-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

html.dark .user-avatar,
html.dark .premium-badge {
  border-color: #1e293b;
}

html.dark .user-avatar {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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

/* Transition */
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
/* Notification Styles */
.notif-badge :deep(.el-badge__content) {
  top: 6px;
  right: 6px;
  border: none;
  background: var(--danger);
}

.notif-content {
  padding: 4px;
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-main);
}

.notif-item {
  display: flex;
  gap: 12px;
  padding: 12px 8px;
  border-radius: 8px;
  transition: background 0.2s;
  cursor: pointer;
}

.notif-item:hover {
  background: #f8fafc;
}

.notif-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notif-icon.info {
  background: #e0f2fe;
  color: #0ea5e9;
}
.notif-icon.warning {
  background: #fff7ed;
  color: #f59e0b;
}
.notif-icon.error {
  background: #fef2f2;
  color: #ef4444;
}

.notif-info {
  flex: 1;
}

.notif-text {
  font-size: 0.85rem;
  color: var(--text-main);
  margin-bottom: 4px;
  line-height: 1.4;
}

.notif-time {
  font-size: 0.75rem;
  color: var(--text-muted);
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
    gap: 20px;
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
