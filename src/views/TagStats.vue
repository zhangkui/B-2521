<template>
  <div class="tag-stats-wrapper">
    <div class="top-section">
      <div class="summary-cards">
        <div class="summary-card glass-card">
          <div class="card-icon income">
            <lucide-icon name="TrendingUp" :size="20" />
          </div>
          <div class="card-content">
            <span class="label">标签总收入</span>
            <h3 class="value">¥{{ stats.summary?.incomeTotal?.toFixed(2) || "0.00" }}</h3>
          </div>
        </div>

        <div class="summary-card glass-card">
          <div class="card-icon expense">
            <lucide-icon name="TrendingDown" :size="20" />
          </div>
          <div class="card-content">
            <span class="label">标签总支出</span>
            <h3 class="value">¥{{ stats.summary?.expenseTotal?.toFixed(2) || "0.00" }}</h3>
          </div>
        </div>

        <div class="summary-card glass-card">
          <div class="card-icon balance">
            <lucide-icon name="Wallet" :size="20" />
          </div>
          <div class="card-content">
            <span class="label">标签结余</span>
            <h3 class="value">¥{{ stats.summary?.netTotal?.toFixed(2) || "0.00" }}</h3>
          </div>
        </div>

        <div class="summary-card glass-card">
          <div class="card-icon count">
            <lucide-icon name="List" :size="20" />
          </div>
          <div class="card-content">
            <span class="label">交易笔数</span>
            <h3 class="value">{{ stats.summary?.transactionCount || 0 }}</h3>
          </div>
        </div>
      </div>

      <div class="filter-bar glass-card">
        <div class="filter-group">
          <span class="filter-label">时间范围</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            size="default"
            @change="loadStats"
          />
        </div>
        <div class="filter-group">
          <span class="filter-label">类型</span>
          <el-select v-model="filterType" placeholder="全部" size="default" @change="loadStats" style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="收入" value="INCOME" />
            <el-option label="支出" value="EXPENSE" />
          </el-select>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div class="chart-panel glass-card">
        <div class="section-header">
          <div class="section-title">
            <lucide-icon name="PieChart" :size="20" />
            <span>支出标签占比</span>
          </div>
        </div>
        <div ref="pieChartRef" class="chart-box"></div>
      </div>

      <div class="list-panel glass-card">
        <div class="section-header">
          <div class="section-title">
            <lucide-icon name="BarChart3" :size="20" />
            <span>标签明细排行</span>
          </div>
          <el-radio-group v-model="listType" size="small" @change="handleListTypeChange">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </div>

        <div class="tag-list" v-loading="loading">
          <div
            v-for="(item, index) in displayStats"
            :key="item.tag.id"
            class="tag-item"
          >
            <div class="rank-num">{{ index + 1 }}</div>
            <div
              class="tag-icon"
              :style="{ backgroundColor: (item.tag.color || '#6366f1') + '20' }"
            >
              <lucide-icon
                :name="item.tag.icon || 'Tag'"
                :size="20"
                :color="item.tag.color || '#6366f1'"
              />
            </div>
            <div class="tag-info">
              <div class="tag-name-row">
                <span class="tag-name">{{ item.tag.name }}</span>
                <span class="tag-amount" :class="listType">
                  {{ listType === "income" ? "+" : "-" }}¥{{
                    listType === "income"
                      ? item.income.amount.toFixed(2)
                      : item.expense.amount.toFixed(2)
                  }}
                </span>
              </div>
              <div class="tag-meta">
                <span class="count">{{
                  listType === "income" ? item.income.count : item.expense.count
                }} 笔</span>
                <span class="percentage">
                  占比 {{ (listType === "income"
                    ? item.income.percentage
                    : item.expense.percentage
                  ).toFixed(1) }}%
                </span>
              </div>
              <div class="progress-bar">
                <el-progress
                  :percentage="
                    listType === 'income'
                      ? item.income.percentage
                      : item.expense.percentage
                  "
                  :show-text="false"
                  :color="item.tag.color || '#6366f1'"
                  :stroke-width="6"
                />
              </div>
            </div>
          </div>
          <el-empty
            v-if="!loading && displayStats.length === 0"
            description="暂无标签数据"
            :image-size="80"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { tagsApi } from "../api/tags";
import { TagStatsResponse } from "../types";
import LucideIcon from "../components/LucideIcon.vue";
import * as echarts from "echarts";
import dayjs from "dayjs";

const loading = ref(false);
const stats = ref<TagStatsResponse>({
  summary: { incomeTotal: 0, expenseTotal: 0, netTotal: 0, transactionCount: 0 },
  stats: [],
});

const dateRange = ref<string[]>([
  dayjs().startOf("month").format("YYYY-MM-DD"),
  dayjs().endOf("month").format("YYYY-MM-DD"),
]);
const filterType = ref("");
const listType = ref<"income" | "expense">("expense");

const pieChartRef = ref<HTMLElement | null>(null);
let pieChart: echarts.ECharts | null = null;

const displayStats = computed(() => {
  if (!stats.value?.stats) return [];
  const sorted = [...stats.value.stats].sort((a, b) => {
    if (listType.value === "income") {
      return b.income.amount - a.income.amount;
    }
    return b.expense.amount - a.expense.amount;
  });
  return sorted.filter((s) => {
    if (listType.value === "income") return s.income.count > 0;
    return s.expense.count > 0;
  });
});

const loadStats = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (dateRange.value?.[0]) params.startDate = dateRange.value[0];
    if (dateRange.value?.[1]) params.endDate = dateRange.value[1];
    if (filterType.value) params.type = filterType.value;

    stats.value = await tagsApi.getTagStats(params);
    await nextTick();
    updatePieChart();
  } catch (e) {
    console.error("加载标签统计失败", e);
  } finally {
    loading.value = false;
  }
};

const handleListTypeChange = () => {
  updatePieChart();
};

const initPieChart = () => {
  if (!pieChartRef.value) return;
  pieChart = echarts.init(pieChartRef.value);
  updatePieChart();
};

const updatePieChart = () => {
  if (!pieChart) return;

  const data = displayStats.value.map((s) => ({
    name: s.tag.name,
    value: listType.value === "income" ? s.income.amount : s.expense.amount,
    itemStyle: { color: s.tag.color || "#6366f1" },
  }));

  const isDark = document.documentElement.classList.contains("dark");

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: isDark ? "#1e293b" : "#fff",
      borderColor: isDark ? "#334155" : "#e2e8f0",
      textStyle: { color: isDark ? "#f1f5f9" : "#1e293b" },
      padding: [10, 14],
      borderRadius: 8,
      formatter: "{b}: ¥{c} ({d}%)",
    },
    legend: {
      bottom: "2%",
      left: "center",
      width: "90%",
      orient: "horizontal",
      icon: "rect",
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 20,
      textStyle: {
        color: isDark ? "#94a3b8" : "#64748b",
        fontSize: 12,
      },
    },
    series: [
      {
        name: listType.value === "income" ? "收入" : "支出",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "42%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: isDark ? "#1e293b" : "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: "700",
            formatter: "{b}\n{d}%",
            color: isDark ? "#f1f5f9" : "#1e293b",
          },
          itemStyle: {
            shadowBlur: 15,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },
        labelLine: { show: false },
        data,
      },
    ],
  };

  pieChart.setOption(option, true);
};

onMounted(async () => {
  await loadStats();
  initPieChart();
  setTimeout(() => {
    pieChart?.resize();
  }, 100);
  window.addEventListener("resize", () => pieChart?.resize());
});

onUnmounted(() => {
  window.removeEventListener("resize", () => pieChart?.resize());
  pieChart?.dispose();
});
</script>

<style scoped>
.tag-stats-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.top-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.card-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon.income {
  background: #ecfdf5;
  color: #10b981;
}
.card-icon.expense {
  background: #fef2f2;
  color: #ef4444;
}
.card-icon.balance {
  background: #eef2ff;
  color: #6366f1;
}
.card-icon.count {
  background: #f0fdf4;
  color: #059669;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.label {
  font-size: 0.8rem;
  color: var(--text-muted);
  display: block;
  margin-bottom: 4px;
}

.value {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
}

.filter-bar {
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.content-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.chart-panel,
.list-panel {
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.05rem;
  font-weight: 600;
}

.chart-box {
  height: 400px;
  width: 100%;
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.tag-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px;
  border-radius: 12px;
  transition: background 0.2s;
}

.tag-item:hover {
  background: var(--background);
}

.rank-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--border);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 8px;
}

.tag-item:nth-child(1) .rank-num {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
}
.tag-item:nth-child(2) .rank-num {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  color: white;
}
.tag-item:nth-child(3) .rank-num {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
}

.tag-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tag-info {
  flex: 1;
  min-width: 0;
}

.tag-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.tag-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.tag-amount {
  font-weight: 700;
  font-size: 1rem;
}

.tag-amount.income {
  color: #10b981;
}
.tag-amount.expense {
  color: var(--text-main);
}

.tag-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
}

@media (max-width: 1024px) {
  .content-section {
    grid-template-columns: 1fr;
  }

  .chart-box {
    height: 300px;
  }

  .tag-list {
    max-height: 300px;
  }
}

@media (max-width: 640px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .summary-card {
    padding: 14px;
  }

  .value {
    font-size: 1.1rem;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 14px 16px;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .chart-panel,
  .list-panel {
    padding: 16px;
  }
}
</style>
