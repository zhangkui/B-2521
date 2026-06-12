<template>
  <div class="tags-page">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><lucide-icon name="Tag" /></el-icon>
        <span>标签管理</span>
      </h2>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><lucide-icon name="Plus" /></el-icon>
        <span>新建标签</span>
      </el-button>
    </div>

    <div class="tags-content">
      <div v-if="loading" class="loading-wrap">
        <el-skeleton :rows="5" animated />
      </div>
      <div v-else class="tag-grid">
        <div
          v-for="tag in sortedTags"
          :key="tag.id"
          class="tag-card"
        >
          <div class="tag-card-content">
            <div
              class="tag-color"
              :style="{ backgroundColor: tag.color || '#6366f1' }"
            ></div>
            <div class="tag-info">
              <span class="tag-name">{{ tag.name }}</span>
              <span class="tag-count">已使用 {{ getTagUsageCount(tag.id) }} 次</span>
            </div>
            <div class="tag-actions">
              <el-button
                link
                size="small"
                @click="openEditDialog(tag)"
              >
                <el-icon><lucide-icon name="Edit2" /></el-icon>
              </el-button>
              <el-button
                link
                size="small"
                type="danger"
                @click="handleDelete(tag)"
              >
                <el-icon><lucide-icon name="Trash2" /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <el-empty
          v-if="sortedTags.length === 0"
          description="暂无标签"
          class="empty-state"
        >
          <el-button type="primary" @click="openAddDialog">创建第一个标签</el-button>
        </el-empty>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑标签' : '新建标签'"
      width="420px"
      destroy-on-close
      align-center
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        label-position="right"
      >
        <el-form-item label="标签名" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入标签名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="颜色">
          <div class="color-picker-wrap">
            <el-color-picker
              v-model="form.color"
              show-alpha
              :predefine="predefineColors"
              size="default"
            />
            <div class="color-preview" :style="{ backgroundColor: form.color }">
              {{ form.name || '标签预览' }}
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import LucideIcon from "../components/LucideIcon.vue";
import { useFinanceStore } from "../store/finance";
import { Tag } from "../types";

const financeStore = useFinanceStore();

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<number | null>(null);

const form = ref({
  name: "",
  color: "#6366f1",
});

const predefineColors = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#0ea5e9", "#3b82f6", "#64748b", "#78716c",
];

const rules: FormRules = {
  name: [
    { required: true, message: "请输入标签名称", trigger: "blur" },
    { min: 1, max: 20, message: "名称长度在 1 到 20 个字符", trigger: "blur" },
  ],
};

const sortedTags = computed(() =>
  [...financeStore.tags].sort((a, b) => a.sortOrder - b.sortOrder)
);

const getTagUsageCount = (tagId: number): number => {
  return financeStore.transactions.filter((tx) =>
    tx.tags?.some((t) => t.id === tagId)
  ).length;
};

onMounted(async () => {
  loading.value = true;
  try {
    if (financeStore.tags.length === 0) {
      await financeStore.loadTags();
    }
  } catch (err) {
    console.error("加载标签失败:", err);
    ElMessage.error("加载标签失败");
  } finally {
    loading.value = false;
  }
});

const openAddDialog = () => {
  isEdit.value = false;
  editingId.value = null;
  form.value = {
    name: "",
    color: "#6366f1",
  };
  dialogVisible.value = true;
};

const openEditDialog = (tag: Tag) => {
  isEdit.value = true;
  editingId.value = tag.id;
  form.value = {
    name: tag.name,
    color: tag.color || "#6366f1",
  };
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (isEdit.value && editingId.value) {
        await financeStore.updateTag(editingId.value, {
          name: form.value.name,
          color: form.value.color,
        });
        ElMessage.success("更新成功");
      } else {
        await financeStore.addTag({
          name: form.value.name,
          color: form.value.color,
          sortOrder: financeStore.tags.length + 1,
        });
        ElMessage.success("创建成功");
      }
      dialogVisible.value = false;
    } catch (err: any) {
      console.error("保存标签失败:", err);
      ElMessage.error(err?.response?.data?.message || "保存失败");
    } finally {
      submitting.value = false;
    }
  });
};

const handleDelete = (tag: Tag) => {
  const usageCount = getTagUsageCount(tag.id);
  const msg = usageCount > 0
    ? `确定要删除标签「${tag.name}」吗？\n该标签已被 ${usageCount} 笔交易使用，删除后将从所有交易中移除。`
    : `确定要删除标签「${tag.name}」吗？`;

  ElMessageBox.confirm(msg, "删除确认", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning",
    confirmButtonClass: "el-button--danger",
  })
    .then(async () => {
      try {
        await financeStore.deleteTag(tag.id);
        ElMessage.success("删除成功");
      } catch (err: any) {
        console.error("删除失败:", err);
        ElMessage.error(err?.response?.data?.message || "删除失败");
      }
    })
    .catch(() => {});
};
</script>

<style scoped>
.tags-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
}

.tags-content {
  flex: 1;
  overflow-y: auto;
}

.loading-wrap {
  padding: 20px;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  padding: 8px 0;
}

.tag-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s;
}

.tag-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.tag-card-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.tag-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.tag-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.color-picker-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
}

.color-preview {
  padding: 6px 16px;
  border-radius: 20px;
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 60px 0;
}

@media (max-width: 768px) {
  .tag-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
