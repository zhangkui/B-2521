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

        <el-table-column label="备注" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-hint">{{ row.note || row.description || "-" }}</span>
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
      <div v-else class="mobile-list">
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
        <el-pagination
          v-model:current-page="currentPage"
          layout="total, prev, pager, next"
          :total="filteredTransactions.length"
          :page-size="pageSize"
          :size="isMobile ? 'small' : 'default'"
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
const dateRange = ref<[string, string] | null>(null);
const currentPage = ref(1);
const pageSize = ref(10);
const isRefreshing = ref(false);
const quickAddVisible = ref(false);
const editingTransaction = ref<any>(null);

const getCategory = (id: number) =>
  financeStore.categories.find((c) => c.id === Number(id));
const getAccount = (id: number) =>
  financeStore.accounts.find((a) => a.id === Number(id));

const filteredTransactions = computed(() => {
  return financeStore.transactions
    .filter((tx) => {
      const txNote = (tx.note || tx.description || "").toLowerCase();
      const catName = getCategory(Number(tx.categoryId))?.name || "";
      const matchesSearch =
        txNote.includes(searchQuery.value.toLowerCase()) ||
        catName.includes(searchQuery.value);
      const matchesType = !filterType.value || tx.type === filterType.value;

      let matchesDate = true;
      if (dateRange.value && dateRange.value.length === 2) {
        const start = dayjs(dateRange.value[0]).startOf('day').valueOf();
        const end = dayjs(dateRange.value[1]).endOf('day').valueOf();
        const txDate = dayjs(tx.transactionDate || tx.createdAt).valueOf();
        matchesDate = txDate >= start && txDate <= end;
      }

      return matchesSearch && matchesType && matchesDate;
    })
    .sort((a, b) => {
      const dateA = dayjs(a.transactionDate || a.createdAt).valueOf();
      const dateB = dayjs(b.transactionDate || b.createdAt).valueOf();
      if (dateA !== dateB) return dateB - dateA;
      return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
    });
});

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredTransactions.value.slice(start, end);
});

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
  dateRange.value = null;
  currentPage.value = 1;
};

const handleRefresh = async () => {
  try {
    isRefreshing.value = true;
    await financeStore.loadTransactions();
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

watch([searchQuery, filterType, dateRange], () => {
  currentPage.value = 1;
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
