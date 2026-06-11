<template>
  <div class="categories-page">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><lucide-icon name="Tags" /></el-icon>
        <span>分类管理</span>
      </h2>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><lucide-icon name="Plus" /></el-icon>
        <span>新建分类</span>
      </el-button>
    </div>

    <el-tabs v-model="activeTab" class="category-tabs">
      <el-tab-pane label="支出分类" name="expense">
        <div class="category-grid">
          <el-card
            v-for="category in expenseCategories"
            :key="category.id"
            class="category-card"
            shadow="hover"
          >
            <div class="category-content">
              <div
                class="category-icon"
                :style="{ background: (category.color || '#6366f1') + '20', color: category.color || '#6366f1' }"
              >
                <span class="icon-emoji">{{ getCategoryIcon(category.icon) }}</span>
              </div>
              <div class="category-info">
                <span class="category-name">{{ category.name }}</span>
                <span class="category-tag" v-if="category.isSystem">系统分类</span>
              </div>
              <div class="category-actions">
                <el-button
                  link
                  size="small"
                  @click="openEditDialog(category)"
                  :disabled="category.isSystem"
                >
                  <el-icon><lucide-icon name="Edit2" /></el-icon>
                </el-button>
                <el-button
                  link
                  size="small"
                  type="danger"
                  @click="handleDelete(category)"
                  :disabled="category.isSystem"
                >
                  <el-icon><lucide-icon name="Trash2" /></el-icon>
                </el-button>
              </div>
            </div>
          </el-card>

          <el-empty
            v-if="expenseCategories.length === 0 && !loading"
            description="暂无支出分类"
            class="empty-state"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="收入分类" name="income">
        <div class="category-grid">
          <el-card
            v-for="category in incomeCategories"
            :key="category.id"
            class="category-card"
            shadow="hover"
          >
            <div class="category-content">
              <div
                class="category-icon"
                :style="{ background: (category.color || '#10b981') + '20', color: category.color || '#10b981' }"
              >
                <span class="icon-emoji">{{ getCategoryIcon(category.icon) }}</span>
              </div>
              <div class="category-info">
                <span class="category-name">{{ category.name }}</span>
                <span class="category-tag" v-if="category.isSystem">系统分类</span>
              </div>
              <div class="category-actions">
                <el-button
                  link
                  size="small"
                  @click="openEditDialog(category)"
                  :disabled="category.isSystem"
                >
                  <el-icon><lucide-icon name="Edit2" /></el-icon>
                </el-button>
                <el-button
                  link
                  size="small"
                  type="danger"
                  @click="handleDelete(category)"
                  :disabled="category.isSystem"
                >
                  <el-icon><lucide-icon name="Trash2" /></el-icon>
                </el-button>
              </div>
            </div>
          </el-card>

          <el-empty
            v-if="incomeCategories.length === 0 && !loading"
            description="暂无收入分类"
            class="empty-state"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新建分类'"
      width="480px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        label-position="right"
      >
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type" :disabled="isEdit">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入分类名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="图标">
          <el-input
            v-model="form.icon"
            placeholder="输入emoji或文字，如 🍜 或 Utensils"
            maxlength="10"
          />
          <div class="icon-preview">
            <span>预览：</span>
            <span class="preview-icon">{{ getCategoryIcon(form.icon) }}</span>
          </div>
        </el-form-item>

        <el-form-item label="颜色">
          <el-color-picker
            v-model="form.color"
            show-alpha
            predefine="predefineColors"
            size="default"
          />
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
import { Category, TransactionType } from "../types";

const financeStore = useFinanceStore();

const activeTab = ref<TransactionType>("expense");
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const editingId = ref<number | null>(null);

const form = ref({
  name: "",
  type: "expense" as TransactionType,
  icon: "",
  color: "#6366f1",
});

const predefineColors = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#0ea5e9", "#3b82f6", "#6366f1", "#64748b",
];

const rules: FormRules = {
  name: [
    { required: true, message: "请输入分类名称", trigger: "blur" },
    { min: 1, max: 20, message: "名称长度在 1 到 20 个字符", trigger: "blur" },
  ],
  type: [{ required: true, message: "请选择类型", trigger: "change" }],
};

const loading = computed(() => financeStore.loading);
const expenseCategories = computed(() =>
  financeStore.expenseCategories.sort((a, b) => a.sortOrder - b.sortOrder)
);
const incomeCategories = computed(() =>
  financeStore.incomeCategories.sort((a, b) => a.sortOrder - b.sortOrder)
);

onMounted(async () => {
  try {
    if (financeStore.categories.length === 0) {
      await financeStore.loadCategories();
    }
  } catch (err) {
    console.error("加载分类失败:", err);
    ElMessage.error("加载分类失败");
  }
});

const getCategoryIcon = (icon: string | null): string => {
  if (!icon) return "📁";
  if (/^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F600}-\u{1F64F}]/u.test(icon)) {
    return icon;
  }
  return "📁";
};

const openAddDialog = () => {
  isEdit.value = false;
  editingId.value = null;
  form.value = {
    name: "",
    type: activeTab.value,
    icon: "",
    color: activeTab.value === "expense" ? "#6366f1" : "#10b981",
  };
  dialogVisible.value = true;
};

const openEditDialog = (category: Category) => {
  if (category.isSystem) {
    ElMessage.info("系统分类不可编辑");
    return;
  }
  isEdit.value = true;
  editingId.value = category.id;
  form.value = {
    name: category.name,
    type: category.type,
    icon: category.icon || "",
    color: category.color || "#6366f1",
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
        await financeStore.updateCategory(editingId.value, {
          name: form.value.name,
          icon: form.value.icon || null,
          color: form.value.color || null,
        });
        ElMessage.success("更新成功");
      } else {
        await financeStore.addCategory({
          name: form.value.name,
          type: form.value.type,
          icon: form.value.icon || null,
          color: form.value.color || null,
          sortOrder: 100,
        });
        ElMessage.success("创建成功");
      }
      dialogVisible.value = false;
    } catch (err: any) {
      console.error("保存分类失败:", err);
      ElMessage.error(err?.response?.data?.message || "保存失败");
    } finally {
      submitting.value = false;
    }
  });
};

const handleDelete = (category: Category) => {
  if (category.isSystem) {
    ElMessage.info("系统分类不可删除");
    return;
  }
  ElMessageBox.confirm(
    `确定要删除分类「${category.name}」吗？\n删除后已使用该分类的交易记录不会被删除，但后续将无法再选择此分类。`,
    "删除确认",
    {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning",
      confirmButtonClass: "el-button--danger",
    }
  )
    .then(async () => {
      try {
        await financeStore.deleteCategory(category.id);
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
.categories-page {
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

.category-tabs {
  flex: 1;
}

.category-tabs :deep(.el-tabs__content) {
  height: calc(100% - 50px);
  overflow-y: auto;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  padding: 8px 0;
}

.category-card {
  border-radius: 12px;
  border: 1px solid var(--border);
  transition: all 0.3s;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.category-content {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px;
}

.category-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-emoji {
  font-size: 1.5rem;
}

.category-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.category-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-tag {
  font-size: 0.7rem;
  color: var(--text-muted);
  background: var(--background);
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

.category-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.icon-preview {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.preview-icon {
  font-size: 1.4rem;
  background: var(--background);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 60px 0;
}

@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
