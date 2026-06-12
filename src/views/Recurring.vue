<template>
  <div class="recurring-page">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><lucide-icon name="Repeat" /></el-icon>
        <span>周期记账</span>
      </h2>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><lucide-icon name="Plus" /></el-icon>
        <span>新建周期账单</span>
      </el-button>
    </div>

    <div class="filter-bar">
      <el-tabs v-model="activeTab" class="status-tabs">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="进行中" name="active" />
        <el-tab-pane label="已停用" name="inactive" />
      </el-tabs>
      <div class="filter-right">
        <el-select
          v-model="filterType"
          placeholder="类型"
          clearable
          size="default"
          style="width: 100px"
        >
          <el-option label="收入" value="income" />
          <el-option label="支出" value="expense" />
        </el-select>
        <el-select
          v-model="filterFrequency"
          placeholder="频率"
          clearable
          size="default"
          style="width: 120px"
        >
          <el-option label="每天" value="DAILY" />
          <el-option label="每周" value="WEEKLY" />
          <el-option label="每两周" value="BIWEEKLY" />
          <el-option label="每月" value="MONTHLY" />
          <el-option label="每季度" value="QUARTERLY" />
          <el-option label="每年" value="YEARLY" />
        </el-select>
      </div>
    </div>

    <div class="recurring-list">
      <div v-if="loading" class="loading-wrap">
        <el-skeleton :rows="4" animated />
      </div>

      <div v-else-if="filteredList.length === 0" class="empty-wrap">
        <el-empty description="暂无周期账单">
          <el-button type="primary" @click="openAddDialog">创建第一个</el-button>
        </el-empty>
      </div>

      <div v-else class="card-list">
        <div
          v-for="item in filteredList"
          :key="item.id"
          class="recurring-card"
          :class="{ 'is-inactive': !item.isActive }"
        >
          <div class="card-header">
            <div class="card-title-wrap">
              <div
                class="cat-icon"
                :style="{
                  backgroundColor: (getCategory(item.categoryId)?.color || '#6366f1') + '20',
                }"
              >
                <lucide-icon
                  :name="getCategory(item.categoryId)?.icon || 'HelpCircle'"
                  :size="18"
                  :color="getCategory(item.categoryId)?.color || '#6366f1'"
                />
              </div>
              <div class="card-title">
                <span class="cat-name">{{ getCategory(item.categoryId)?.name || '未分类' }}</span>
                <span class="recurring-frequency">
                  <lucide-icon name="Repeat" :size="12" />
                  {{ getFrequencyLabel(item.frequency) }}
                </span>
              </div>
            </div>
            <div class="card-amount" :class="item.type">
              {{ item.type === 'income' ? '+' : '-' }}¥{{ Number(item.amount).toFixed(2) }}
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="info-label">账户</span>
              <span class="info-value">{{ getAccount(item.accountId)?.name || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">开始日期</span>
              <span class="info-value">{{ formatDate(item.startDate) }}</span>
            </div>
            <div class="info-row" v-if="item.endDate">
              <span class="info-label">结束日期</span>
              <span class="info-value">{{ formatDate(item.endDate) }}</span>
            </div>
            <div class="info-row" v-if="item.lastGeneratedDate">
              <span class="info-label">上次生成</span>
              <span class="info-value">{{ formatDate(item.lastGeneratedDate) }}</span>
            </div>
            <div class="info-row" v-if="item.note">
              <span class="info-label">备注</span>
              <span class="info-value note">{{ item.note }}</span>
            </div>
            <div class="info-row" v-if="item.tags && item.tags.length > 0">
              <span class="info-label">标签</span>
              <div class="tag-list">
                <el-tag
                  v-for="tag in item.tags"
                  :key="tag.id"
                  size="small"
                  :style="{
                    backgroundColor: (tag.color || '#6366f1') + '15',
                    borderColor: (tag.color || '#6366f1') + '30',
                    color: tag.color || '#6366f1',
                  }"
                  effect="plain"
                >
                  {{ tag.name }}
                </el-tag>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="status-badge" :class="{ active: item.isActive, inactive: !item.isActive }">
              {{ item.isActive ? '进行中' : '已停用' }}
            </div>
            <div class="card-actions">
              <el-button
                size="small"
                @click="handleGenerate(item)"
                :disabled="!item.isActive"
              >
                生成账单
              </el-button>
              <el-button size="small" @click="handlePreview(item)">
                预览
              </el-button>
              <el-button size="small" @click="openEditDialog(item)">
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleToggleActive(item)"
              >
                {{ item.isActive ? '停用' : '启用' }}
              </el-button>
              <el-button
                size="small"
                type="danger"
                text
                @click="handleDelete(item)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑周期账单' : '新建周期账单'"
      width="520px"
      destroy-on-close
      align-center
      class="recurring-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        label-position="right"
      >
        <el-form-item label="收支类型">
          <el-radio-group v-model="form.type">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :precision="2"
            :step="10"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" style="width: 100%">
            <el-option
              v-for="cat in filteredCategories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            >
              <div class="flex items-center gap-2">
                <lucide-icon :name="cat.icon || 'HelpCircle'" :size="16" :color="cat.color || undefined" />
                <span>{{ cat.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="账户" prop="accountId">
          <el-select v-model="form.accountId" style="width: 100%">
            <el-option
              v-for="acc in financeStore.accounts"
              :key="acc.id"
              :label="acc.name"
              :value="acc.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="频率" prop="frequency">
          <el-select v-model="form.frequency" style="width: 100%">
            <el-option label="每天" value="DAILY" />
            <el-option label="每周" value="WEEKLY" />
            <el-option label="每两周" value="BIWEEKLY" />
            <el-option label="每月" value="MONTHLY" />
            <el-option label="每季度" value="QUARTERLY" />
            <el-option label="每年" value="YEARLY" />
          </el-select>
        </el-form-item>

        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="form.startDate"
            type="date"
            placeholder="选择开始日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="结束日期">
          <el-date-picker
            v-model="form.endDate"
            type="date"
            placeholder="不设置则无限期"
            clearable
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="2"
            maxlength="100"
            show-word-limit
            placeholder="可选"
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="form.tagIds"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或创建标签"
            style="width: 100%"
            @create="handleCreateTag"
          >
            <el-option
              v-for="tag in financeStore.tags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            >
              <div class="flex items-center gap-2">
                <span
                  class="tag-dot"
                  :style="{ backgroundColor: tag.color || '#6366f1' }"
                ></span>
                <span>{{ tag.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" title="周期预览" width="400px" align-center>
      <div v-if="previewData" class="preview-content">
        <div class="preview-amount" :class="previewData.type">
          {{ previewData.type === 'INCOME' ? '+' : '-' }}¥{{ Number(previewData.amount).toFixed(2) }}
        </div>
        <div class="preview-frequency">
          <lucide-icon name="Repeat" :size="16" />
          {{ getFrequencyLabel(previewData.frequency) }}
        </div>
        <div class="preview-dates">
          <div class="preview-label">未来 5 次日期：</div>
          <div class="dates-list">
            <div
              v-for="(date, idx) in previewData.previewDates"
              :key="idx"
              class="date-item"
            >
              {{ formatDate(date) }}
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="generateVisible"
      title="生成周期账单"
      width="420px"
      align-center
      @closed="generateForm.resetFields"
    >
      <el-form
        ref="generateFormRef"
        :model="generateForm"
        :rules="generateRules"
        label-width="100px"
      >
        <el-form-item label="生成至" prop="untilDate">
          <el-date-picker
            v-model="generateForm.untilDate"
            type="date"
            placeholder="选择截止日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-alert
          v-if="generatingItem"
          type="info"
          :closable="false"
          show-icon
        >
          将为「{{ getCategory(generatingItem.categoryId)?.name }}」生成从
          {{ formatDate(generatingItem.lastGeneratedDate || generatingItem.startDate) }}
          到截止日期的账单
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="generateVisible = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="confirmGenerate">
          确认生成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import LucideIcon from "../components/LucideIcon.vue";
import { useFinanceStore } from "../store/finance";
import { RecurringTransaction, RecurringFrequency, Category, Account } from "../types";
import { recurringApi } from "../api/recurring";
import dayjs from "dayjs";

const financeStore = useFinanceStore();

const loading = ref(false);
const submitting = ref(false);
const generating = ref(false);
const dialogVisible = ref(false);
const previewVisible = ref(false);
const generateVisible = ref(false);
const isEdit = ref(false);
const editingId = ref<number | null>(null);
const activeTab = ref("all");
const filterType = ref("");
const filterFrequency = ref<RecurringFrequency | "">("");
const previewData = ref<any>(null);
const generatingItem = ref<RecurringTransaction | null>(null);

const formRef = ref<FormInstance>();
const generateFormRef = ref<FormInstance>();

const form = reactive({
  type: "expense" as "income" | "expense",
  amount: 0,
  categoryId: 0 as number,
  accountId: 0 as number,
  frequency: "MONTHLY" as RecurringFrequency,
  startDate: dayjs().format("YYYY-MM-DD"),
  endDate: "",
  note: "",
  tagIds: [] as number[],
});

const generateForm = reactive({
  untilDate: dayjs().format("YYYY-MM-DD"),
});

const rules: FormRules = {
  amount: [
    { required: true, message: "请输入金额", trigger: "blur" },
    { type: "number", min: 0.01, message: "金额必须大于 0", trigger: "blur" },
  ],
  categoryId: [{ required: true, message: "请选择分类", trigger: "change" }],
  accountId: [{ required: true, message: "请选择账户", trigger: "change" }],
  frequency: [{ required: true, message: "请选择频率", trigger: "change" }],
  startDate: [{ required: true, message: "请选择开始日期", trigger: "change" }],
};

const generateRules: FormRules = {
  untilDate: [{ required: true, message: "请选择截止日期", trigger: "change" }],
};

const filteredCategories = computed(() =>
  financeStore.categories.filter((c) => c.type === form.type)
);

const filteredList = computed(() => {
  let list = financeStore.recurringTransactions;

  if (activeTab.value === "active") {
    list = list.filter((item) => item.isActive);
  } else if (activeTab.value === "inactive") {
    list = list.filter((item) => !item.isActive);
  }

  if (filterType.value) {
    list = list.filter((item) => item.type === filterType.value);
  }

  if (filterFrequency.value) {
    list = list.filter((item) => item.frequency === filterFrequency.value);
  }

  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

const getCategory = (id: number): Category | undefined =>
  financeStore.categories.find((c) => c.id === Number(id));

const getAccount = (id: number): Account | undefined =>
  financeStore.accounts.find((a) => a.id === Number(id));

const getFrequencyLabel = (freq: RecurringFrequency): string => {
  const map: Record<RecurringFrequency, string> = {
    DAILY: "每天",
    WEEKLY: "每周",
    BIWEEKLY: "每两周",
    MONTHLY: "每月",
    QUARTERLY: "每季度",
    YEARLY: "每年",
  };
  return map[freq] || freq;
};

const formatDate = (date: string | Date): string => {
  return dayjs(date).format("YYYY-MM-DD");
};

const loadData = async () => {
  loading.value = true;
  try {
    await financeStore.loadRecurring();
  } catch (err) {
    console.error("加载周期账单失败:", err);
    ElMessage.error("加载失败");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (financeStore.categories.length === 0) {
    await financeStore.loadCategories();
  }
  if (financeStore.accounts.length === 0) {
    await financeStore.loadAccounts();
  }
  await loadData();
});

watch(
  () => form.type,
  () => {
    const defaultCat = financeStore.categories.find((c) => c.type === form.type);
    if (defaultCat) form.categoryId = defaultCat.id;
  }
);

const openAddDialog = () => {
  isEdit.value = false;
  editingId.value = null;
  Object.assign(form, {
    type: "expense" as const,
    amount: 0,
    categoryId: financeStore.expenseCategories[0]?.id || 0,
    accountId: financeStore.accounts[0]?.id || 0,
    frequency: "MONTHLY" as const,
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: "",
    note: "",
    tagIds: [],
  });
  dialogVisible.value = true;
};

const openEditDialog = (item: RecurringTransaction) => {
  isEdit.value = true;
  editingId.value = item.id;
  Object.assign(form, {
    type: item.type as "income" | "expense",
    amount: Number(item.amount),
    categoryId: Number(item.categoryId),
    accountId: Number(item.accountId),
    frequency: item.frequency,
    startDate: dayjs(item.startDate).format("YYYY-MM-DD"),
    endDate: item.endDate ? dayjs(item.endDate).format("YYYY-MM-DD") : "",
    note: item.note || "",
    tagIds: item.tags?.map((t: any) => t.id) || [],
  });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const payload = {
        ...form,
        type: form.type.toUpperCase(),
        amount: Number(form.amount),
        endDate: form.endDate || undefined,
        tagIds: form.tagIds,
      };

      if (isEdit.value && editingId.value) {
        await financeStore.updateRecurring(editingId.value, payload);
        ElMessage.success("更新成功");
      } else {
        await financeStore.addRecurring(payload);
        ElMessage.success("创建成功");
      }
      dialogVisible.value = false;
    } catch (err: any) {
      console.error("保存失败:", err);
      ElMessage.error(err?.response?.data?.message || "保存失败");
    } finally {
      submitting.value = false;
    }
  });
};

const handleCreateTag = async (tagName: string) => {
  try {
    const newTag = await financeStore.addTag({ name: tagName });
    form.tagIds.push(newTag.id);
  } catch (error: any) {
    ElMessage.error(error.message || "创建标签失败");
  }
};

const handleToggleActive = async (item: RecurringTransaction) => {
  const action = item.isActive ? "停用" : "启用";
  ElMessageBox.confirm(`确定要${action}这个周期账单吗？`, "提示", {
    confirmButtonText: `确定${action}`,
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        await financeStore.updateRecurring(item.id, {
          isActive: !item.isActive,
        });
        ElMessage.success(`${action}成功`);
      } catch (err: any) {
        console.error("操作失败:", err);
        ElMessage.error(err?.response?.data?.message || "操作失败");
      }
    })
    .catch(() => {});
};

const handleDelete = (item: RecurringTransaction) => {
  ElMessageBox.confirm(
    `确定要删除周期账单「${getCategory(item.categoryId)?.name || ''}」吗？\n删除后不会影响已生成的交易记录。`,
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
        await financeStore.deleteRecurring(item.id);
        ElMessage.success("删除成功");
      } catch (err: any) {
        console.error("删除失败:", err);
        ElMessage.error(err?.response?.data?.message || "删除失败");
      }
    })
    .catch(() => {});
};

const handlePreview = async (item: RecurringTransaction) => {
  try {
    const data = await recurringApi.getPreview(item.id, 5);
    previewData.value = data;
    previewVisible.value = true;
  } catch (err: any) {
    console.error("获取预览失败:", err);
    ElMessage.error(err?.response?.data?.message || "获取预览失败");
  }
};

const handleGenerate = (item: RecurringTransaction) => {
  generatingItem.value = item;
  generateForm.untilDate = dayjs().format("YYYY-MM-DD");
  generateVisible.value = true;
};

const confirmGenerate = async () => {
  if (!generatingItem.value) return;
  if (!generateFormRef.value) return;

  await generateFormRef.value.validate(async (valid) => {
    if (!valid) return;
    generating.value = true;
    try {
      const result = await financeStore.generateRecurring(
        generatingItem.value.id,
        generateForm.untilDate
      );
      ElMessage.success(`成功生成 ${result.generatedCount} 笔账单`);
      generateVisible.value = false;
    } catch (err: any) {
      console.error("生成失败:", err);
      ElMessage.error(err?.response?.data?.message || "生成失败");
    } finally {
      generating.value = false;
    }
  });
};
</script>

<style scoped>
.recurring-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.status-tabs {
  margin-bottom: 0;
}

.filter-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.recurring-list {
  flex: 1;
  overflow-y: auto;
}

.loading-wrap {
  padding: 20px;
}

.empty-wrap {
  padding: 60px 0;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}

.recurring-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
  transition: all 0.3s;
}

.recurring-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.recurring-card.is-inactive {
  opacity: 0.6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cat-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-main);
}

.recurring-frequency {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.card-amount {
  font-weight: 700;
  font-size: 1.25rem;
  font-family: "JetBrains Mono", monospace;
}

.card-amount.income {
  color: #10b981;
}

.card-amount.expense {
  color: var(--text-main);
}

.card-body {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
  margin-bottom: 12px;
  padding: 12px 0;
  border-top: 1px dashed var(--border);
  border-bottom: 1px dashed var(--border);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.info-label {
  color: var(--text-muted);
  flex-shrink: 0;
}

.info-value {
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-value.note {
  white-space: normal;
  line-height: 1.4;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge.inactive {
  background: var(--background);
  color: var(--text-muted);
}

.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 8px;
}

.preview-content {
  text-align: center;
  padding: 10px 0;
}

.preview-amount {
  font-size: 2rem;
  font-weight: 700;
  font-family: "JetBrains Mono", monospace;
  margin-bottom: 8px;
}

.preview-amount.income {
  color: #10b981;
}

.preview-amount.expense {
  color: var(--text-main);
}

.preview-frequency {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.preview-dates {
  text-align: left;
}

.preview-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.dates-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-item {
  padding: 8px 12px;
  background: var(--background);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--text-main);
}

.recurring-dialog :deep(.el-dialog__body) {
  max-height: 60vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-right {
    justify-content: space-between;
  }

  .card-body {
    grid-template-columns: 1fr;
  }

  .card-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .card-actions {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .recurring-dialog :deep(.el-dialog) {
    width: 90% !important;
    margin: 10vh auto;
  }
}
</style>
