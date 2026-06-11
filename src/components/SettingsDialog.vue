<template>
  <el-dialog
    v-model="visible"
    title="系统设置"
    :width="isMobile ? '88%' : '480px'"
    destroy-on-close
    class="settings-dialog"
    align-center
  >
    <div class="settings-body">
      <div class="setting-group">
        <h3 class="group-title">个性化</h3>
        <div class="setting-item">
          <div class="item-info">
            <span class="item-label">深色模式</span>
            <span class="item-desc">开启后界面将切换至护眼深色主题</span>
          </div>
          <el-switch v-model="settings.darkMode" @change="toggleDarkMode" />
        </div>
        <div class="setting-item">
          <div class="item-info">
            <span class="item-label">侧边栏折叠</span>
            <span class="item-desc">默认开启以获得更大的操作空间</span>
          </div>
          <el-switch v-model="settings.sidebarCollapse" />
        </div>
      </div>

      <div class="setting-group">
        <h3 class="group-title">数据管理</h3>
        <div class="setting-item danger">
          <div class="item-info">
            <span class="item-label">清空所有数据</span>
            <span class="item-desc"
              >警告：此操作不可逆，将清除本地所有账单</span
            >
          </div>
          <el-button type="danger" size="small" @click="handleClearData"
            >清空</el-button
          >
        </div>
      </div>

      <div class="setting-group">
        <h3 class="group-title">关于</h3>
        <div class="about-info">
          <div class="info-row">
            <span>当前版本</span>
            <span>v1.2.0 (Stable)</span>
          </div>
          <div class="info-row">
            <span>更新日志</span>
            <el-link type="primary" underline="never" @click="handleShowLogs"
              >查看详情</el-link
            >
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="handleSave">保存设置</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

const isMobile = ref(false);
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

const props = defineProps<{
  modelValue: boolean;
  initialSidebarCollapse: boolean;
  initialDarkMode: boolean;
}>();

const emit = defineEmits(["update:modelValue", "settings-applied"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const settings = reactive({
  darkMode: props.initialDarkMode,
  sidebarCollapse: props.initialSidebarCollapse,
});

watch(visible, (val) => {
  if (val) {
    settings.darkMode = props.initialDarkMode;
    settings.sidebarCollapse = props.initialSidebarCollapse;
  }
});

const toggleDarkMode = (val: boolean) => {
  if (val) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

const handleClearData = () => {
  ElMessageBox.confirm(
    "确定要清空所有交易记录吗？此操作无法恢复！",
    "极端危险操作提示",
    {
      confirmButtonText: "确定清空",
      cancelButtonText: "取消",
      type: "error",
      confirmButtonClass: "el-button--danger",
    },
  ).then(() => {
    localStorage.clear();
    ElMessage.success("数据已重置，请刷新页面");
    setTimeout(() => location.reload(), 1500);
  });
};

const handleShowLogs = () => {
  const logs = `
    <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
      <div style="margin-bottom: 20px;">
        <h4 style="margin-bottom: 8px; color: var(--primary);">v1.2.0 (2026-02-08)</h4>
        <ul style="padding-left: 20px; font-size: 0.9rem; color: var(--text-main); line-height: 1.6;">
          <li>✨ 深度适配全站深色模式，色彩更和谐</li>
          <li>🎯 优化侧边栏折叠后的绝对居中对齐</li>
          <li>💾 侧边栏折叠状态支持本地持久化存储</li>
          <li>🎨 重构设置对话框 UI，提升视觉高级感</li>
        </ul>
      </div>
      <div>
        <h4 style="margin-bottom: 8px; color: var(--text-muted);">v1.1.0 (2026-01-20)</h4>
        <ul style="padding-left: 20px; font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
          <li>🚀 初始版本上线</li>
          <li>📊 支持多维度收支统计与排行</li>
          <li>📅 快捷记账功能优化</li>
        </ul>
      </div>
    </div>
  `;

  ElMessageBox.alert(logs, "更新日志", {
    dangerouslyUseHTMLString: true,
    confirmButtonText: "我知道了",
    customClass: "update-log-box",
  });
};

const handleSave = () => {
  ElMessage.success("设置已保存");
  visible.value = false;
  emit("settings-applied", { ...settings });
};
</script>

<style scoped>
.settings-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-height: 55vh;
  overflow-y: auto;
  padding-right: 8px; /* Extra padding for scrollbar */
}

.group-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 12px;
  padding-left: 4px;
  border-left: 3px solid var(--primary);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.setting-item :deep(.el-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  height: 28px;
  font-size: 0.8rem;
  line-height: 1;
  border-radius: 8px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
}

.item-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.danger .item-label {
  color: var(--danger);
}

.about-info {
  background: var(--background);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

html.dark .about-info {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border);
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-main);
}
@media (max-width: 1024px) {
  :deep(.el-dialog) {
    margin: 20px auto;
  }

  .settings-body {
    padding-right: 4px;
    gap: 16px;
  }

  .setting-item {
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }

  .item-info {
    flex: 1;
  }

  .item-info {
    width: 100%;
  }
}
</style>
