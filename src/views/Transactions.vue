<template>
  <div class="transactions-wrapper">
    <div class="filter-header glass-card">
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索交易备注..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <lucide-icon name="Search" :size="16" />
          </template>
        </el-input>
      </div>
      <div class="filters">
        <el-select
          v-model="filterType"
          placeholder="类型"
          clearable
          class="filter-select"
        >
          <el-option label="收入" value="income" />
          <el-option label="支出" value="expense" />
        </el-select>

        <el-select
          v-model="filterAccountId"
          placeholder="账户"
          clearable
          class="filter-select"
        >
          <el-option
            v-for="acc in financeStore.accounts"
            :key="acc.id"
            :label="acc.name"
            :value="acc.id"
          />
        </el-select>

        <el-select
          v-model="filterCategoryId"
          placeholder="分类"
          clearable
          class="filter-select"
        >
          <el-option
            v-for="cat in filteredCategories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          >
            <div class="flex items-center gap-2">
              <lucide-icon :name="cat.icon || 'HelpCircle'" :size="14" :color="cat.color || undefined" />
              <span>{{ cat.name }}</span>
            </div>
          </el-option>
        </el-select>

        <el-select
          v-model="filterTagIds"
          multiple
          placeholder="标签"
          clearable
          class="filter-select filter-tag-select"
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

        <el-select
          v-if="filterTagIds.length > 1"
          v-model="filterTagMode"
          placeholder="匹配"
          class="filter-select tag-mode-select"
          size="small"
        >
          <el-option label="任一" value="OR" />
          <el-option label="全部" value="AND" />
        </el-select>

        <template v-if="!isMobile">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="date-picker"
            value-format="YYYY-MM-DD"
          />
        </template>
        <div v-else class="mobile-date-pickers">
          <el-date-picker
            v-model="mobileStartDate"
            type="date"
            placeholder="开始日期"
            class="mobile-date-item"
            value-format="YYYY-MM-DD"
          />
          <span class="date-sep">-</span>
          <el-date-picker
            v-model="mobileEndDate"
            type="date"
            placeholder="结束日期"
            class="mobile-date-item"
            value-format="YYYY-MM-DD"
          />
        </div>
        <el-button-group>
          <el-button @click="resetFilters">
            <template #icon>
              <lucide-icon name="RotateCcw" :size="16" />
            </template>
            重置
          </el-button>
          <el-button :loading="isRefreshing" @click="handleRefresh">
            <template #icon>
              <lucide-icon name="RefreshCw" :size="16" />
            </template>
            刷新
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="table-card glass-card">
      <!-- Desktop Tablet View -->
      <el-table
        v-if="!isMobile"
        v-loading="serverSideLoading"
        :data="paginatedTransactions"
        style="width: 100%"
        height="530"
        class="custom-table"
      >
        <el-table-column label="交易日期" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-secondary">{{ dayjs(row.transactionDate || row.createdAt).format('YYYY-MM-DD') }}</span>
          </template>
        </el-table-column>

        <el-table-column label="分类" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <div
                class="cat-icon"
                :style="{
                  backgroundColor: (getCategory(Number(row.categoryId))?.color || '#6366f1') + '20',
                }"
              >
                <lucide-icon
                  :name="getCategory(Number(row.categoryId))?.icon || 'HelpCircle'"
                  :size="16"
                  :color="getCategory(Number(row.categoryId))?.color || '#6366f1'"
                />
              </div>
              <span class="font-medium">{{
                getCategory(Number(row.categoryId))?.name
              }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="账户" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{
              getAccount(Number(row.accountId))?.name
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="备注与标签" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="note-tags-cell">
              <span class="text-hint">{{ row.note || row.description || "-" }}</span>
              <div v-if="row.tags && row.tags.length > 0" class="tag-list">
                <el-tag
                  v-for="tag in row.tags"
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
          </template>
        </el-table-column>

        <el-table-column label="金额" width="150" align="right">
          <template #default="{ row }">
            <span :class="['amount-cell', row.type]">
              {{ row.type === "income" ? "+" : "-" }} ¥{{
                Number(row.amount).toFixed(2)
              }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="记录时间" width="120" align="center">
          <template #default="{ row }">
            <span class="text-secondary">{{
              row.createdAt ? dayjs(row.createdAt).format("HH:mm:ss") : "-"
            }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              circle
              size="small"
              @click="handleEdit(row)"
            >
              <lucide-icon name="SquarePen" :size="14" />
            </el-button>
            <el-button
              type="danger"
              circle
              size="small"
              @click="handleDelete(row.id)"
            >
              <lucide-icon name="Trash2" :size="14" />
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="没有找到相关的交易记录" :image-size="120">
            <el-button
              v-if="
                searchQuery || filterType || (dateRange && dateRange.length)
              "
              type="primary"
              @click="resetFilters"
            >
              重置筛选
            </el-button>
          </el-empty>
        </template>
      </el-table>

      <!-- Mobile List View -->
      <div v-else class="mobile-list" v-loading="serverSideLoading">
        <div
          v-for="tx in paginatedTransactions"
          :key="tx.id"
          class="mobile-card"
          @click="showDetail(tx)"
        >
          <div class="mobile-card-main">
            <div
              class="cat-icon"
              :style="{
                backgroundColor: (getCategory(Number(tx.categoryId))?.color || '#6366f1') + '20',
              }"
            >
              <lucide-icon
                :name="getCategory(Number(tx.categoryId))?.icon || 'HelpCircle'"
                :size="18"
                :color="getCategory(Number(tx.categoryId))?.color || '#6366f1'"
              />
            </div>
            <div class="mobile-card-info">
              <div class="mobile-info-top">
                <span class="mobile-cat-name">{{
                  getCategory(Number(tx.categoryId))?.name
                }}</span>
                <span :class="['mobile-amount', tx.type]">
                  {{ tx.type === "income" ? "+" : "-"
                  }}{{ Number(tx.amount).toFixed(2) }}
                </span>
              </div>
              <div class="mobile-info-bottom">
                <span class="mobile-note">{{ tx.note || tx.description || "-" }}</span>
                <span class="mobile-time">{{ dayjs(tx.transactionDate || tx.createdAt).format('YYYY-MM-DD') }}</span>
              </div>
              <div v-if="tx.tags && tx.tags.length > 0" class="mobile-tag-list">
                <el-tag
                  v-for="tag in tx.tags.slice(0, 3)"
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
                <span v-if="tx.tags.length > 3" class="more-tags">
                  +{{ tx.tags.length - 3 }}
                </span>
              </div>
            </div>
          </div>
          <div class="mobile-card-actions">
            <span class="mobile-account-tag">{{
              getAccount(Number(tx.accountId))?.name
            }}</span>
            <div class="flex gap-2">
              <el-button type="primary" link @click.stop="handleEdit(tx)">
                <lucide-icon name="SquarePen" :size="16" />
              </el-button>
              <el-button type="danger" link @click.stop="handleDelete(tx.id)">
                <lucide-icon name="Trash2" :size="16" />
              </el-button>
            </div>
          </div>
        </div>
        <el-empty
          v-if="paginatedTransactions.length === 0"
          description="暂无交易记录"
          :image-size="80"
        />
      </div>

      <div class="pagination-container">
        <div class="pagination-summary">
          <span class="summary-text">
            共 <strong>{{ financeStore.transactionPagination.total }}</strong> 条记录
            <span v-if="financeStore.transactionSummary.totalIncome > 0 || financeStore.transactionSummary.totalExpense > 0" class="summary-stats">
              收入: <span class="income">¥{{ financeStore.transactionSummary.totalIncome.toFixed(2) }}</span>
              支出: <span class="expense">¥{{ financeStore.transactionSummary.totalExpense.toFixed(2) }}</span>
              结余: <span :class="financeStore.transactionSummary.netBalance >= 0 ? 'income' : 'expense'">
                ¥{{ financeStore.transactionSummary.netBalance.toFixed(2) }}
              </span>
            </span>
          </span>
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          layout="total, prev, pager, next"
          :total="financeStore.transactionPagination.total"
          :page-size="pageSize"
          :size="isMobile ? 'small' : 'default'"
          :page-count="financeStore.transactionPagination.totalPages"
        />
      </div>
    </div>

    <QuickAddDialog v-model="quickAddVisible" :editData="editingTransaction" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

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
import { useFinanceStore } from "../store/finance";
import LucideIcon from "../components/LucideIcon.vue";
import QuickAddDialog from "../components/QuickAddDialog.vue";
import { ElMessageBox, ElMessage } from "element-plus";
import dayjs from "dayjs";

const financeStore = useFinanceStore();

const searchQuery = ref("");
const filterType = ref("");
const filterAccountId = ref<number | null>(null);
const filterCategoryId = ref<number | null>(null);
const filterTagIds = ref<number[]>([]);
const filterTagMode = ref<'AND' | 'OR'>('OR');
const dateRange = ref<[string, string] | null>(null);
const currentPage = ref(1);
const pageSize = ref(10);
const isRefreshing = ref(false);
const quickAddVisible = ref(false);
const editingTransaction = ref<any>(null);
const serverSideLoading = ref(false);

const getCategory = (id: number) =>
  financeStore.categories.find((c) => c.id === Number(id));
const getAccount = (id: number) =>
  financeStore.accounts.find((a) => a.id === Number(id));

const filteredCategories = computed(() => {
  if (filterType.value) {
    return financeStore.categories.filter((c) => c.type === filterType.value);
  }
  return financeStore.categories;
});

const filteredTransactions = computed(() => financeStore.transactions);

const paginatedTransactions = computed(() => {
  return filteredTransactions.value;
});

const loadFilteredTransactions = async () => {
  serverSideLoading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
    };

    if (filterType.value) {
      params.type = filterType.value.toUpperCase();
    }
    if (filterAccountId.value !== null) {
      params.accountId = filterAccountId.value;
    }
    if (filterCategoryId.value !== null) {
      params.categoryId = filterCategoryId.value;
    }
    if (searchQuery.value.trim()) {
      params.keyword = searchQuery.value.trim();
    }
    if (filterTagIds.value.length > 0) {
      params.tagIds = filterTagIds.value;
      params.tagMode = filterTagMode.value;
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }

    await financeStore.loadTransactions(params);
  } catch (error: any) {
    console.error('加载交易记录失败:', error);
  } finally {
    serverSideLoading.value = false;
  }
};

const handleDelete = (id: number) => {
  ElMessageBox.confirm("确定要删除这条交易记录吗？", "提示", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning",
    confirmButtonClass: "el-button--danger",
  })
    .then(async () => {
      try {
        await financeStore.deleteTransaction(Number(id));
        ElMessage.success("已删除");
      } catch (error: any) {
        ElMessage.error(error.message || "删除失败");
      }
    })
    .catch(() => {});
};

const handleEdit = (tx: any) => {
  editingTransaction.value = {
    ...JSON.parse(JSON.stringify(tx)),
    date: dayjs(tx.transactionDate || tx.createdAt).format('YYYY-MM-DD')
  };
  quickAddVisible.value = true;
};

const resetFilters = () => {
  searchQuery.value = "";
  filterType.value = "";
  filterAccountId.value = null;
  filterCategoryId.value = null;
  filterTagIds.value = [];
  filterTagMode.value = "OR";
  dateRange.value = null;
  currentPage.value = 1;
  loadFilteredTransactions();
};

const handleRefresh = async () => {
  try {
    isRefreshing.value = true;
    await loadFilteredTransactions();
    ElMessage({
      message: "数据已更新",
      type: "success",
      duration: 1000,
    });
  } catch (error: any) {
    ElMessage.error(error.message || "刷新失败");
  } finally {
    isRefreshing.value = false;
  }
};

const showDetail = (tx: any) => {
};

watch(
  [searchQuery, filterType, filterAccountId, filterCategoryId, filterTagIds, filterTagMode, dateRange],
  () => {
    currentPage.value = 1;
    loadFilteredTransactions();
  }
);

watch(currentPage, () => {
  loadFilteredTransactions();
});

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  loadFilteredTransactions();
});

const mobileStartDate = computed({
  get: () => (dateRange.value ? dateRange.value[0] : null),
  set: (val: any) => {
    if (val) {
      const end =
        dateRange.value && dateRange.value[1]
          ? dateRange.value[1]
          : val;
      dateRange.value = [val, end];
    } else {
      dateRange.value = null;
    }
  },
});

const mobileEndDate = computed({
  get: () => (dateRange.value ? dateRange.value[1] : null),
  set: (val: any) => {
    if (val) {
      const start =
        dateRange.value && dateRange.value[0]
          ? dateRange.value[0]
          : val;
      dateRange.value = [start, val];
    } else {
      dateRange.value = null;
    }
  },
});
</script>

<style scoped>
.transactions-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.search-bar {
  flex: 1;
  min-width: 300px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 12px;
}

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  width: 120px;
}
.date-picker {
  width: 320px;
}

.table-card {
  padding: 8px;
}

.custom-table {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: var(--background);
}

.cat-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.amount-cell {
  font-weight: 700;
  font-family: "JetBrains Mono", monospace;
}

.amount-cell.income {
  color: #10b981;
}
.amount-cell.expense {
  color: var(--text-main);
}

.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
}

.text-secondary {
  color: var(--text-muted);
}
.text-hint {
  color: #94a3b8;
  font-size: 0.9rem;
}
.font-medium {
  font-weight: 500;
}
.gap-3 {
  gap: 12px;
}
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}

@media (max-width: 1024px) {
  .filter-header {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-bar {
    min-width: unset;
  }

  .filters {
    flex-wrap: wrap;
    gap: 12px;
  }

  .filter-select {
    flex: 1;
    width: auto;
  }

  .date-picker {
    width: 100%;
  }

  :deep(.date-picker.el-range-editor.el-input__wrapper) {
    width: 100%;
    box-sizing: border-box;
  }

  .filters :deep(.el-button-group) {
    display: flex;
    width: 100%;
  }

  .filters :deep(.el-button-group .el-button) {
    flex: 1;
  }

  .mobile-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 4px;
  }

  .mobile-card {
    background: rgba(255, 255, 255, 0.5);
    border-radius: 12px;
    padding: 12px;
    border: 1px solid var(--border);
    transition: all 0.2s;
  }

  html.dark .mobile-card {
    background: rgba(30, 41, 59, 0.4);
  }

  .mobile-card:active {
    scale: 0.98;
    background: rgba(255, 255, 255, 0.8);
  }

  .mobile-card-main {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 10px;
  }

  .mobile-card-info {
    flex: 1;
    min-width: 0;
  }

  .mobile-info-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    gap: 12px;
  }

  .mobile-cat-name {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text-main);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-amount {
    font-weight: 700;
    font-family: "JetBrains Mono", monospace;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .mobile-amount.income {
    color: #10b981;
  }

  .mobile-amount.expense {
    color: var(--text-main);
  }

  .mobile-info-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 0.8rem;
    color: var(--text-muted);
    gap: 12px;
  }

  .mobile-note {
    white-space: normal;
    word-break: break-all;
    line-height: 1.4;
    flex: 1;
  }

  .mobile-card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 8px;
    border-top: 1px dashed var(--border);
  }

  .mobile-account-tag {
    font-size: 0.75rem;
    padding: 2px 8px;
    background: var(--background);
    border-radius: 4px;
    color: var(--text-muted);
    border: 1px solid var(--border);
  }

  .pagination-container {
    padding: 12px 8px;
    justify-content: center;
  }

  .mobile-date-pickers {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    box-sizing: border-box;
  }

  .mobile-date-item {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  :deep(.mobile-date-item.el-input) {
    width: 100%;
    --el-date-editor-width: 100%;
  }

  :deep(.mobile-date-item .el-input__wrapper) {
    padding: 0 8px;
    box-sizing: border-box;
  }

  .date-sep {
    color: var(--text-muted);
    font-size: 0.9rem;
    flex-shrink: 0;
  }
}
</style>
