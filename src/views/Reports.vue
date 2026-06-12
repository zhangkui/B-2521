<template>
  <div class="reports-page">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><lucide-icon name="FileText" /></el-icon>
        <span>月度复盘</span>
      </h2>
      <div class="header-actions">
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="选择月份"
          format="YYYY年MM月"
          value-format="YYYY-MM"
          :clearable="false"
          class="month-picker"
        />
        <el-button :icon="ArrowLeft" circle @click="prevMonth" />
        <el-button :icon="ArrowRight" circle @click="nextMonth" />
      </div>
    </div>

    <div v-if="loading" class="loading-wrap">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else class="report-content">
      <div class="summary-cards">
        <div class="summary-card income-card glass-card">
          <div class="card-icon">
            <lucide-icon name="TrendingUp" :size="24" />
          </div>
          <div class="card-info">
            <span class="card-label">本月收入</span>
            <span class="card-value">¥{{ report.summary.totalIncome.toFixed(2) }}</span>
            <span class="card-sub">共 {{ report.summary.incomeCount }} 笔</span>
          </div>
          <div class="card-change" :class="report.comparison.incomeChange >= 0 ? 'up' : 'down'">
            <lucide-icon :name="report.comparison.incomeChange >= 0 ? 'TrendingUp' : 'TrendingDown'" :size="14" />
            {{ Math.abs(report.comparison.incomeChange) }}%
          </div>
        </div>

        <div class="summary-card expense-card glass-card">
          <div class="card-icon">
            <lucide-icon name="TrendingDown" :size="24" />
          </div>
          <div class="card-info">
            <span class="card-label">本月支出</span>
            <span class="card-value">¥{{ report.summary.totalExpense.toFixed(2) }}</span>
            <span class="card-sub">共 {{ report.summary.expenseCount }} 笔</span>
          </div>
          <div class="card-change" :class="report.comparison.expenseChange <= 0 ? 'up' : 'down'">
            <lucide-icon :name="report.comparison.expenseChange <= 0 ? 'TrendingDown' : 'TrendingUp'" :size="14" />
            {{ Math.abs(report.comparison.expenseChange) }}%
          </div>
        </div>

        <div class="summary-card savings-card glass-card">
          <div class="card-icon">
            <lucide-icon name="PiggyBank" :size="24" />
          </div>
          <div class="card-info">
            <span class="card-label">本月结余</span>
            <span class="card-value" :class="report.summary.netSavings >= 0 ? 'positive' : 'negative'">
              {{ report.summary.netSavings >= 0 ? '+' : '' }}¥{{ report.summary.netSavings.toFixed(2) }}
            </span>
            <span class="card-sub">储蓄率 {{ report.summary.savingsRate }}%</span>
          </div>
        </div>

        <div class="summary-card budget-card glass-card">
          <div class="card-icon">
            <lucide-icon name="Target" :size="24" />
          </div>
          <div class="card-info">
            <span class="card-label">预算执行</span>
            <span class="card-value">
              {{ report.budget.percentage }}%
            </span>
            <span class="card-sub">
              ¥{{ report.budget.totalSpent.toFixed(2) }} / ¥{{ report.budget.totalBudget.toFixed(2) }}
            </span>
          </div>
          <div class="budget-ring">
            <el-progress
              type="dashboard"
              :percentage="Math.min(report.budget.percentage, 100)"
              :color="budgetColor"
              :width="60"
              :stroke-width="6"
              :show-text="false"
            />
          </div>
        </div>
      </div>

      <div class="chart-row">
        <div class="chart-card glass-card">
          <div class="card-title">
            <lucide-icon name="BarChart3" :size="18" />
            <span>每日收支趋势</span>
          </div>
          <div ref="dailyChartRef" class="chart-box"></div>
        </div>
      </div>

      <div class="two-col-row">
        <div class="chart-card glass-card">
          <div class="card-title">
            <lucide-icon name="PieChart" :size="18" />
            <span>支出分类占比</span>
          </div>
          <div ref="expensePieRef" class="chart-box pie-chart"></div>
        </div>

        <div class="chart-card glass-card">
          <div class="card-title">
            <lucide-icon name="PieChart" :size="18" />
            <span>收入分类占比</span>
          </div>
          <div ref="incomePieRef" class="chart-box pie-chart"></div>
        </div>
      </div>

      <div class="two-col-row">
        <div class="chart-card glass-card">
          <div class="card-title">
            <lucide-icon name="ListOrdered" :size="18" />
            <span>支出排行 (Top 5)</span>
          </div>
          <div class="ranking-list">
            <div
              v-for="(item, index) in topExpenseCategories"
              :key="item.category.id"
              class="ranking-item"
            >
              <div class="rank-num">{{ Number(index) + 1 }}</div>
              <div
                class="rank-icon"
                :style="{ backgroundColor: (item.category.color || '#6366f1') + '20' }"
              >
                <lucide-icon
                  :name="item.category.icon || 'HelpCircle'"
                  :size="20"
                  :color="item.category.color || '#6366f1'"
                />
              </div>
              <div class="rank-info">
                <div class="rank-name-row">
                  <span class="name">{{ item.category.name }}</span>
                  <span class="amount">¥{{ item.totalAmount.toFixed(2) }}</span>
                </div>
                <div class="progress-container">
                  <el-progress
                    :percentage="item.percentage"
                    :color="item.category.color || '#6366f1'"
                    :show-text="false"
                    :stroke-width="6"
                  />
                </div>
              </div>
            </div>
            <el-empty
              v-if="topExpenseCategories.length === 0"
              description="暂无支出数据"
              :image-size="80"
            />
          </div>
        </div>

        <div class="chart-card glass-card">
          <div class="card-title">
            <lucide-icon name="Target" :size="18" />
            <span>预算执行情况</span>
          </div>
          <div class="budget-list">
            <div
              v-for="item in report.budget.items"
              :key="item.id"
              class="budget-item"
            >
              <div class="budget-item-header">
                <div class="budget-cat">
                  <div
                    class="cat-icon-sm"
                    :style="{ backgroundColor: (item.category.color || '#6366f1') + '20' }"
                  >
                    <lucide-icon
                      :name="item.category.icon || 'HelpCircle'"
                      :size="14"
                      :color="item.category.color || '#6366f1'"
                    />
                  </div>
                  <span class="cat-name">{{ item.category.name }}</span>
                </div>
                <span class="budget-amount">
                  ¥{{ item.spent.toFixed(2) }} / ¥{{ item.amount.toFixed(2) }}
                </span>
              </div>
              <el-progress
                :percentage="item.percentage"
                :color="getBudgetItemColor(item.percentage)"
                :show-text="false"
                :stroke-width="4"
              />
            </div>
            <el-empty
              v-if="report.budget.items.length === 0"
              description="暂无预算设置"
              :image-size="80"
            >
              <template #description>
                <div class="empty-tip">
                  <p>还没有设置预算</p>
                  <router-link to="/budget" class="link">去设置</router-link>
                </div>
              </template>
            </el-empty>
          </div>
        </div>
      </div>

      <div class="highlights-card glass-card">
        <div class="card-title">
          <lucide-icon name="Sparkles" :size="18" />
          <span>本月亮点</span>
        </div>
        <div class="highlights-grid">
          <div v-if="report.highlights.topExpenseCategory" class="highlight-item">
            <div class="highlight-label">最大支出类目</div>
            <div class="highlight-content">
              <div
                class="highlight-icon"
                :style="{ backgroundColor: (report.highlights.topExpenseCategory.category.color || '#6366f1') + '20' }"
              >
                <lucide-icon
                  :name="report.highlights.topExpenseCategory.category.icon || 'HelpCircle'"
                  :size="20"
                  :color="report.highlights.topExpenseCategory.category.color || '#6366f1'"
                />
              </div>
              <div class="highlight-text">
                <span class="highlight-name">{{ report.highlights.topExpenseCategory.category.name }}</span>
                <span class="highlight-value">
                  ¥{{ report.highlights.topExpenseCategory.totalAmount.toFixed(2) }}
                  ({{ report.highlights.topExpenseCategory.percentage }}%)
                </span>
              </div>
            </div>
          </div>

          <div v-if="report.highlights.topIncomeCategory" class="highlight-item">
            <div class="highlight-label">最大收入来源</div>
            <div class="highlight-content">
              <div
                class="highlight-icon"
                :style="{ backgroundColor: (report.highlights.topIncomeCategory.category.color || '#10b981') + '20' }"
              >
                <lucide-icon
                  :name="report.highlights.topIncomeCategory.category.icon || 'HelpCircle'"
                  :size="20"
                  :color="report.highlights.topIncomeCategory.category.color || '#10b981'"
                />
              </div>
              <div class="highlight-text">
                <span class="highlight-name">{{ report.highlights.topIncomeCategory.category.name }}</span>
                <span class="highlight-value">
                  ¥{{ report.highlights.topIncomeCategory.totalAmount.toFixed(2) }}
                  ({{ report.highlights.topIncomeCategory.percentage }}%)
                </span>
              </div>
            </div>
          </div>

          <div class="highlight-item">
            <div class="highlight-label">储蓄情况</div>
            <div class="highlight-content">
              <div class="highlight-icon savings-icon">
                <lucide-icon name="PiggyBank" :size="20" />
              </div>
              <div class="highlight-text">
                <span class="highlight-name">
                  {{ report.summary.savingsRate >= 20 ? '储蓄良好' : report.summary.savingsRate >= 10 ? '储蓄一般' : '需要加油' }}
                </span>
                <span class="highlight-value">
                  储蓄率 {{ report.summary.savingsRate }}%
                  {{ report.summary.savingsRate >= 20 ? '✓' : '' }}
                </span>
              </div>
            </div>
          </div>

          <div class="highlight-item">
            <div class="highlight-label">上月对比</div>
            <div class="highlight-content">
              <div class="highlight-icon compare-icon">
                <lucide-icon
                  :name="report.summary.netSavings >= report.comparison.prevIncome - report.comparison.prevExpense ? 'TrendingUp' : 'TrendingDown'"
                  :size="20"
                />
              </div>
              <div class="highlight-text">
                <span class="highlight-name">
                  {{ report.summary.netSavings >= report.comparison.prevIncome - report.comparison.prevExpense ? '结余增加' : '结余减少' }}
                </span>
                <span class="highlight-value">
                  上月结余 ¥{{ (report.comparison.prevIncome - report.comparison.prevExpense).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { ElMessage } from "element-plus";
import LucideIcon from "../components/LucideIcon.vue";
import { reportsApi } from "../api/reports";
import { MonthlyReport } from "../types";
import * as echarts from "echarts";
import dayjs from "dayjs";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";

const selectedMonth = ref(dayjs().format("YYYY-MM"));
const loading = ref(false);
const report = ref<MonthlyReport>({
  month: "",
  summary: {
    totalIncome: 0,
    totalExpense: 0,
    netSavings: 0,
    savingsRate: 0,
    incomeCount: 0,
    expenseCount: 0,
  },
  comparison: {
    prevIncome: 0,
    prevExpense: 0,
    incomeChange: 0,
    expenseChange: 0,
  },
  expenseByCategory: [],
  incomeByCategory: [],
  expenseByAccount: [],
  incomeByAccount: [],
  budget: {
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    percentage: 0,
    items: [],
  },
  highlights: {
    topExpenseCategory: null,
    topIncomeCategory: null,
  },
  dailyStats: {
    labels: [],
    income: [],
    expense: [],
  },
});

const dailyChartRef = ref<HTMLElement | null>(null);
const expensePieRef = ref<HTMLElement | null>(null);
const incomePieRef = ref<HTMLElement | null>(null);

let dailyChart: echarts.ECharts | null = null;
let expensePieChart: echarts.ECharts | null = null;
let incomePieChart: echarts.ECharts | null = null;

const topExpenseCategories = computed(() =>
  report.value.expenseByCategory.slice(0, 5)
);

const budgetColor = computed(() => {
  const p = report.value.budget.percentage;
  if (p < 60) return "#10b981";
  if (p < 80) return "#f59e0b";
  if (p < 100) return "#f97316";
  return "#ef4444";
});

const getBudgetItemColor = (percentage: number) => {
  if (percentage < 60) return "#10b981";
  if (percentage < 80) return "#f59e0b";
  if (percentage < 100) return "#f97316";
  return "#ef4444";
};

const prevMonth = () => {
  selectedMonth.value = dayjs(selectedMonth.value)
    .subtract(1, "month")
    .format("YYYY-MM");
};

const nextMonth = () => {
  const next = dayjs(selectedMonth.value).add(1, "month");
  if (next.isBefore(dayjs().add(1, "day"))) {
    selectedMonth.value = next.format("YYYY-MM");
  }
};

const loadReport = async () => {
  loading.value = true;
  try {
    const data = await reportsApi.getMonthlyReport(selectedMonth.value);
    report.value = data as MonthlyReport;
    await nextTick();
    initCharts();
  } catch (err: any) {
    console.error("加载月度报告失败:", err);
    ElMessage.error(err?.response?.data?.message || "加载失败");
  } finally {
    loading.value = false;
  }
};

const isDark = () => document.documentElement.classList.contains("dark");

const initCharts = () => {
  initDailyChart();
  initExpensePie();
  initIncomePie();
};

const initDailyChart = () => {
  if (!dailyChartRef.value) return;
  if (dailyChart) dailyChart.dispose();

  dailyChart = echarts.init(dailyChartRef.value);

  const textColor = isDark() ? "#94a3b8" : "#64748b";
  const axisColor = isDark() ? "#334155" : "#e2e8f0";

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: isDark() ? "#1e293b" : "#fff",
      borderColor: isDark() ? "#334155" : "#e2e8f0",
      textStyle: { color: isDark() ? "#f1f5f9" : "#1e293b" },
      padding: [10, 14],
      borderRadius: 8,
    },
    legend: {
      data: ["收入", "支出"],
      top: 0,
      right: 0,
      textStyle: { color: textColor, fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: 40,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: report.value.dailyStats.labels,
      axisLine: { lineStyle: { color: axisColor } },
      axisLabel: { color: textColor, fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: axisColor, type: "dashed" } },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        formatter: (val: number) => {
          if (val >= 1000) return (val / 1000).toFixed(1) + "k";
          return val;
        },
      },
    },
    series: [
      {
        name: "收入",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        data: report.value.dailyStats.income,
        lineStyle: { color: "#10b981", width: 2 },
        itemStyle: { color: "#10b981" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(16, 185, 129, 0.25)" },
            { offset: 1, color: "rgba(16, 185, 129, 0.02)" },
          ]),
        },
      },
      {
        name: "支出",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        data: report.value.dailyStats.expense,
        lineStyle: { color: "#6366f1", width: 2 },
        itemStyle: { color: "#6366f1" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(99, 102, 241, 0.25)" },
            { offset: 1, color: "rgba(99, 102, 241, 0.02)" },
          ]),
        },
      },
    ],
  };

  dailyChart.setOption(option);
};

const initExpensePie = () => {
  if (!expensePieRef.value) return;
  if (expensePieChart) expensePieChart.dispose();

  expensePieChart = echarts.init(expensePieRef.value);

  const data = report.value.expenseByCategory.map((item) => ({
    value: item.totalAmount,
    name: item.category.name,
    itemStyle: { color: item.category.color || "#6366f1" },
  }));

  const textColor = isDark() ? "#94a3b8" : "#64748b";

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: isDark() ? "#1e293b" : "#fff",
      borderColor: isDark() ? "#334155" : "#e2e8f0",
      textStyle: { color: isDark() ? "#f1f5f9" : "#1e293b" },
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
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 12,
      textStyle: { color: textColor, fontSize: 11 },
      type: "scroll",
    },
    series: [
      {
        name: "支出分类",
        type: "pie",
        radius: ["45%", "70%"],
        center: ["50%", "42%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: isDark() ? "#1e293b" : "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "600",
            formatter: "{b}\n{d}%",
            color: isDark() ? "#f1f5f9" : "#1e293b",
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },
        labelLine: { show: false },
        data: data,
      },
    ],
  };

  expensePieChart.setOption(option);
};

const initIncomePie = () => {
  if (!incomePieRef.value) return;
  if (incomePieChart) incomePieChart.dispose();

  incomePieChart = echarts.init(incomePieRef.value);

  const data = report.value.incomeByCategory.map((item) => ({
    value: item.totalAmount,
    name: item.category.name,
    itemStyle: { color: item.category.color || "#10b981" },
  }));

  const textColor = isDark() ? "#94a3b8" : "#64748b";

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: isDark() ? "#1e293b" : "#fff",
      borderColor: isDark() ? "#334155" : "#e2e8f0",
      textStyle: { color: isDark() ? "#f1f5f9" : "#1e293b" },
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
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 12,
      textStyle: { color: textColor, fontSize: 11 },
      type: "scroll",
    },
    series: [
      {
        name: "收入分类",
        type: "pie",
        radius: ["45%", "70%"],
        center: ["50%", "42%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: isDark() ? "#1e293b" : "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "600",
            formatter: "{b}\n{d}%",
            color: isDark() ? "#f1f5f9" : "#1e293b",
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },
        labelLine: { show: false },
        data: data,
      },
    ],
  };

  incomePieChart.setOption(option);
};

const handleResize = () => {
  dailyChart?.resize();
  expensePieChart?.resize();
  incomePieChart?.resize();
};

watch(selectedMonth, () => {
  loadReport();
});

onMounted(() => {
  loadReport();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  dailyChart?.dispose();
  expensePieChart?.dispose();
  incomePieChart?.dispose();
});
</script>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.month-picker {
  width: 160px;
}

.loading-wrap {
  padding: 20px;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  overflow: hidden;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.income-card .card-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.expense-card .card-icon {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

.savings-card .card-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.budget-card .card-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.card-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-main);
  font-family: "JetBrains Mono", monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-value.positive {
  color: #10b981;
}

.card-value.negative {
  color: #ef4444;
}

.card-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.card-change {
  position: absolute;
  top: 12px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
}

.card-change.up {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.card-change.down {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.budget-ring {
  position: absolute;
  top: 10px;
  right: 10px;
}

.chart-row {
  width: 100%;
}

.chart-card {
  padding: 20px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-main);
}

.chart-box {
  width: 100%;
  height: 280px;
}

.pie-chart {
  height: 260px;
}

.two-col-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rank-num {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--border);
  width: 20px;
  flex-shrink: 0;
}

.rank-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 10px;
}

.rank-name-row .name {
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-name-row .amount {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-main);
  flex-shrink: 0;
  font-family: "JetBrains Mono", monospace;
}

.budget-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.budget-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.budget-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-cat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cat-icon-sm {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-name {
  font-weight: 500;
  font-size: 0.9rem;
}

.budget-amount {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-family: "JetBrains Mono", monospace;
}

.highlights-card {
  padding: 20px;
}

.highlights-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.highlight-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: var(--background);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.highlight-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.highlight-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.highlight-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-main);
}

.savings-icon {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.compare-icon {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}

.highlight-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.highlight-name {
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.highlight-value {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.empty-tip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.empty-tip p {
  color: var(--text-muted);
  margin: 0;
}

.empty-tip .link {
  color: var(--primary);
  cursor: pointer;
  text-decoration: none;
}

@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .two-col-row {
    grid-template-columns: 1fr;
  }

  .highlights-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .chart-box {
    height: 220px;
  }

  .pie-chart {
    height: 240px;
  }

  .highlights-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    width: 100%;
  }

  .month-picker {
    flex: 1;
  }
}
</style>
