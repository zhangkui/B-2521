<template>
  <div class="budget-wrapper">
    <div class="summary-section glass-card">
      <div class="header">
        <h3>预算总览</h3>
        <el-button
          type="primary"
          link
          :loading="isAnalyzing"
          @click="goToAnalysis"
        >
          查看历史分析
        </el-button>
      </div>
      <div class="budget-stats">
        <div class="stat-main">
          <div class="circle-progress">
            <el-progress
              type="circle"
              :percentage="budgetSummary?.percentage || 0"
              :width="120"
              :color="progressColor"
              :stroke-width="8"
            >
              <template #default="{ percentage }">
                <div class="progress-info">
                  <span class="pct">{{ percentage }}%</span>
                  <span class="lbl">已用</span>
                </div>
              </template>
            </el-progress>
          </div>
          <div class="stat-info">
            <div class="stat-card total">
              <div class="icon-box">
                <lucide-icon name="Wallet" :size="20" />
              </div>
              <div class="content">
                <span class="label">总预算</span>
                <span class="value">¥ {{ formatAmount(budgetSummary?.totalBudget || 0) }}</span>
              </div>
            </div>
            <div class="stat-card expense">
              <div class="icon-box">
                <lucide-icon name="ArrowUpRight" :size="20" />
              </div>
              <div class="content">
                <span class="label">已支出</span>
                <span class="value">¥ {{ formatAmount(budgetSummary?.totalSpent || 0) }}</span>
              </div>
            </div>
            <div class="stat-card remaining">
              <div class="icon-box">
                <lucide-icon name="PiggyBank" :size="20" />
              </div>
              <div class="content">
                <span class="label">剩余</span>
                <span class="value">¥ {{ formatAmount(budgetSummary?.totalRemaining || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="category-budgets">
      <div class="section-title">
        <lucide-icon name="Shapes" :size="20" />
        <span>分类预算明细</span>
      </div>
      <div class="budget-grid">
        <div
          v-for="item in budgetItemsWithCategories"
          :key="item.categoryId"
          class="budget-card glass-card"
        >
          <div class="card-header">
            <div class="cat-info">
              <div
                class="cat-icon"
                :style="{ backgroundColor: (item.category?.color || '#6366f1') + '20' }"
              >
                <lucide-icon :name="item.category?.icon || 'HelpCircle'" :size="20" :color="item.category?.color || '#6366f1'" />
              </div>
              <span class="cat-name">{{ item.category?.name || '未知分类' }}</span>
            </div>
            <el-button link size="small" @click="openBudgetDialog(item)">{{ item.hasBudget ? '编辑' : '设置' }}</el-button>
          </div>

          <div class="budget-values">
            <div class="val-row">
              <span class="lbl">已用 ¥{{ formatAmount(item.spent) }}</span>
              <span class="lbl">{{ item.hasBudget ? `预算 ¥${formatAmount(item.amount)}` : '未设置预算' }}</span>
            </div>
            <el-progress
              v-if="item.hasBudget"
              :percentage="item.percentage"
              :color="getProgressColor(item.percentage, item.category?.color)"
              :show-text="false"
            />
            <div v-else class="no-budget-tip">点击"设置"添加预算</div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="budgetDialogVisible"
      :title="dialogMode === 'create' ? '设置预算' : '编辑预算'"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="budgetForm" label-width="80px">
        <el-form-item label="分类">
          <span>{{ currentCategory?.name }}</span>
        </el-form-item>
        <el-form-item label="预算金额">
          <el-input-number
            v-model="budgetForm.amount"
            :min="0.01"
            :precision="2"
            :step="100"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="budgetDialogVisible = false">取消</el-button>
        <el-button v-if="dialogMode === 'edit'" type="danger" @click="handleDeleteBudget">删除</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmitBudget">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useFinanceStore } from "../store/finance";
import LucideIcon from "../components/LucideIcon.vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { ref, computed, onMounted } from "vue";
import dayjs from "dayjs";

const financeStore = useFinanceStore();
const router = useRouter();
const isAnalyzing = ref(false);
const budgetDialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const submitting = ref(false);
const currentCategory = ref<any>(null);
const currentBudgetId = ref<number | null>(null);
const budgetForm = ref({ amount: 1000 });

const budgetSummary = computed(() => financeStore.budgetSummary);

const progressColor = computed(() => {
  const pct = budgetSummary.value?.percentage || 0;
  if (pct >= 90) return "#ef4444";
  if (pct >= 70) return "#f59e0b";
  return "#6366f1";
});

const budgetItemsWithCategories = computed(() => {
  const expenseCategories = financeStore.categories.filter(
    (c) => c.type === "expense",
  );
  const items = budgetSummary.value?.items || [];

  const budgetMap = new Map(items.map((i) => [i.categoryId, i]));

  return expenseCategories.map((cat) => {
    const budgetItem = budgetMap.get(cat.id);
    if (budgetItem) {
      const percentage =
        budgetItem.amount > 0
          ? Math.min(
              Math.round((budgetItem.spent / budgetItem.amount) * 100),
              100,
            )
          : 0;
      return {
        categoryId: cat.id,
        category: cat,
        hasBudget: true,
        amount: budgetItem.amount,
        spent: budgetItem.spent,
        percentage,
        budgetId: budgetItem.id,
      };
    }
    return {
      categoryId: cat.id,
      category: cat,
      hasBudget: false,
      amount: 0,
      spent: 0,
      percentage: 0,
      budgetId: null,
    };
  });
});

const formatAmount = (val: number) => {
  return Number(val).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getProgressColor = (percentage: number, color?: string | null) => {
  if (percentage >= 90) return "#ef4444";
  if (percentage >= 70) return "#f59e0b";
  return color || "#6366f1";
};

const goToAnalysis = () => {
  isAnalyzing.value = true;
  setTimeout(() => {
    isAnalyzing.value = false;
    router.push("/analysis");
  }, 500);
};

const openBudgetDialog = (item: any) => {
  currentCategory.value = item.category;
  if (item.hasBudget) {
    dialogMode.value = "edit";
    currentBudgetId.value = item.budgetId;
    budgetForm.value.amount = item.amount;
  } else {
    dialogMode.value = "create";
    currentBudgetId.value = null;
    budgetForm.value.amount = 1000;
  }
  budgetDialogVisible.value = true;
};

const handleSubmitBudget = async () => {
  if (!budgetForm.value.amount || budgetForm.value.amount <= 0) {
    ElMessage.warning("请输入有效的预算金额");
    return;
  }

  submitting.value = true;
  try {
    const month = dayjs().format("YYYY-MM");
    if (dialogMode.value === "create") {
      await financeStore.setBudget({
        categoryId: currentCategory.value.id,
        amount: budgetForm.value.amount,
        month,
      });
      ElMessage.success("预算设置成功");
    } else if (dialogMode.value === "edit" && currentBudgetId.value) {
      await financeStore.updateBudget(currentBudgetId.value, {
        amount: budgetForm.value.amount,
      });
      ElMessage.success("预算更新成功");
    }
    budgetDialogVisible.value = false;
  } catch (e: any) {
    ElMessage.error(e?.message || "操作失败");
  } finally {
    submitting.value = false;
  }
};

const handleDeleteBudget = async () => {
  if (!currentBudgetId.value) return;
  submitting.value = true;
  try {
    await financeStore.deleteBudget(currentBudgetId.value);
    ElMessage.success("预算已删除");
    budgetDialogVisible.value = false;
  } catch (e: any) {
    ElMessage.error(e?.message || "删除失败");
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  try {
    await Promise.all([
      financeStore.loadCategories(),
      financeStore.loadBudgetSummary(),
    ]);
  } catch (e) {
    console.error("Failed to load budget data", e);
  }
});
</script>

<style scoped>
.budget-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-section {
  padding: 24px;
}

.summary-section .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.budget-stats {
  display: flex;
  justify-content: center;
}

.stat-main {
  display: flex;
  align-items: center;
  gap: 60px;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-info .pct {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
}
.progress-info .lbl {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.stat-info {
  display: flex;
  gap: 24px;
  flex: 1;
}

.stat-card {
  flex: 1;
  padding: 20px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  background: rgba(255, 255, 255, 0.6);
}

.stat-card .icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card.total .icon-box {
  background: var(--primary-light);
  color: var(--primary);
}

.stat-card.expense .icon-box {
  background: #fef2f2;
  color: #ef4444;
}

.stat-card.remaining .icon-box {
  background: #ecfdf5;
  color: #10b981;
}

.stat-card .content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-card .label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
}

.stat-card .value {
  font-size: 1.15rem;
  font-weight: 700;
  font-family: "JetBrains Mono", monospace;
  color: var(--text-main);
}

.stat-card.expense .value {
  color: #ef4444;
}

.stat-card.remaining .value {
  color: #10b981;
}

.category-budgets {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 600;
}

.budget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.budget-card {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.cat-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-name {
  font-weight: 600;
}

.budget-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.val-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.no-budget-tip {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: center;
  padding: 8px 0;
  opacity: 0.6;
}

/* Responsive Overrides */
@media (max-width: 1024px) {
  .stat-main {
    flex-direction: column;
    gap: 32px;
  }

  .stat-info {
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
  }

  .stat-card {
    min-width: 240px;
  }
}

@media (max-width: 640px) {
  .summary-section {
    padding: 16px;
  }

  .summary-section .header h3 {
    font-size: 1.1rem;
  }

  .stat-info {
    flex-direction: column;
    gap: 12px;
  }

  .stat-card {
    width: 100%;
    min-width: 0;
    padding: 16px;
  }

  .stat-card .icon-box {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
  }

  .stat-card .value {
    font-size: 1rem;
  }

  .budget-grid {
    grid-template-columns: 1fr;
  }

  .budget-card {
    padding: 16px;
  }
}
</style>
