<template>
  <div class="dashboard-wrapper">
    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card glass-card">
        <div class="card-icon balance">
          <lucide-icon name="Wallet" :size="20" />
        </div>
        <div class="card-content">
          <span class="label">当前总余额</span>
          <h3 class="value">
            ¥ {{ Number(overview?.totalBalance || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </h3>
          <span class="trend" :class="balanceTrend.isUp ? 'up' : 'down'">
            <lucide-icon :name="balanceTrend.isUp ? 'ArrowUpRight' : 'ArrowDownRight'" :size="14" />
            {{ balanceTrend.text }} 从上月
          </span>
        </div>
      </div>

      <div class="summary-card glass-card">
        <div class="card-icon income">
          <lucide-icon name="TrendingUp" :size="20" />
        </div>
        <div class="card-content">
          <span class="label">本月总收入</span>
          <h3 class="value">
            ¥ {{ Number(overview?.currentMonth?.income || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </h3>
          <span class="trend" :class="incomeTrend.isUp ? 'up' : 'down'">
            <lucide-icon :name="incomeTrend.isUp ? 'ArrowUpRight' : 'ArrowDownRight'" :size="14" />
            {{ incomeTrend.text }} 从上月
          </span>
        </div>
      </div>

      <div class="summary-card glass-card">
        <div class="card-icon expense">
          <lucide-icon name="TrendingDown" :size="20" />
        </div>
        <div class="card-content">
          <span class="label">本月总支出</span>
          <h3 class="value">
            ¥ {{ Number(overview?.currentMonth?.expense || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </h3>
          <span class="trend" :class="expenseTrend.isUp ? 'down' : 'up'">
            <lucide-icon :name="expenseTrend.isUp ? 'ArrowUpRight' : 'ArrowDownRight'" :size="14" />
            {{ expenseTrend.text }} 从上月
          </span>
        </div>
      </div>

      <div class="summary-card glass-card">
        <div class="card-icon budget">
          <lucide-icon name="Target" :size="20" />
        </div>
        <div class="card-content">
          <span class="label">预算余额</span>
          <h3 class="value">¥ {{ Number(overview?.budget?.totalRemaining || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</h3>
          <div class="budget-progress">
            <el-progress
              :percentage="overview?.budget?.percentage || 0"
              :show-text="false"
              :stroke-width="4"
              :color="budgetProgressColor"
            />
            <span class="progress-label">已使用 {{ overview?.budget?.percentage || 0 }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts and Recent Transactions -->
    <div class="content-grid">
      <div class="chart-section glass-card">
        <div class="section-header">
          <h4>收支走势</h4>
          <el-radio-group v-model="chartPeriod" size="small">
            <el-radio-button value="week">周</el-radio-button>
            <el-radio-button value="month">月</el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="chartLoading" class="chart-loading">
          <el-icon class="is-loading" :size="24"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
        <div v-else ref="lineChartRef" class="chart-container"></div>
      </div>

      <div class="recent-transactions glass-card">
        <div class="section-header">
          <h4>最近交易</h4>
          <el-button link @click="$router.push('/transactions')"
            >查看全部</el-button
          >
        </div>
        <div class="transaction-list">
          <div
            v-for="tx in financeStore.recentTransactions"
            :key="tx.id"
            class="tx-item"
          >
            <div
              class="tx-icon"
              :style="{
                backgroundColor: (getCategory(Number(tx.categoryId))?.color || '#6366f1') + '15',
              }"
            >
              <lucide-icon
                :name="getCategory(Number(tx.categoryId))?.icon || 'HelpCircle'"
                :size="18"
                :color="getCategory(Number(tx.categoryId))?.color || '#6366f1'"
              />
            </div>
            <div class="tx-info">
              <span class="tx-name">{{
                getCategory(Number(tx.categoryId))?.name
              }}</span>
              <span class="tx-date">{{ dayjs(tx.transactionDate || tx.createdAt).format('YYYY-MM-DD') }}</span>
            </div>
            <div class="tx-amount" :class="tx.type">
              {{ tx.type === "income" ? "+" : "-" }}¥{{ Number(tx.amount).toFixed(2) }}
            </div>
          </div>
          <el-empty
            v-if="financeStore.recentTransactions.length === 0"
            description="暂无交易记录"
            :image-size="60"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useFinanceStore } from "../store/finance";
import { dashboardApi } from "../api/dashboard";
import { DashboardOverview, DashboardChartData } from "../types";
import LucideIcon from "../components/LucideIcon.vue";
import { Loading } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import dayjs from "dayjs";

const financeStore = useFinanceStore();
const chartPeriod = ref<"week" | "month">("week");
const lineChartRef = ref<HTMLElement | null>(null);
const chartLoading = ref(false);
let lineChart: echarts.ECharts | null = null;

const overview = ref<DashboardOverview | null>(null);
const chartData = ref<DashboardChartData | null>(null);

const budgetProgressColor = computed(() => {
  const pct = overview.value?.budget?.percentage || 0;
  if (pct >= 90) return "#ef4444";
  if (pct >= 70) return "#f59e0b";
  return "#6366f1";
});

const formatTrend = (change: number) => {
  if (change === 0) return { isUp: true, text: "0%" };
  const isUp = change > 0;
  return { isUp, text: `${isUp ? "+" : ""}${change}%` };
};

const balanceTrend = computed(() => {
  if (!overview.value) return { isUp: true, text: "+0%" };
  const curr = overview.value.currentMonth.income - overview.value.currentMonth.expense;
  const prev = overview.value.prevMonth.income - overview.value.prevMonth.expense;
  if (prev === 0) return { isUp: curr >= 0, text: curr >= 0 ? "+0%" : "0%" };
  const change = Math.round(((curr - prev) / Math.abs(prev)) * 10000) / 100;
  return formatTrend(change);
});

const incomeTrend = computed(() => formatTrend(overview.value?.incomeChange || 0));

const expenseTrend = computed(() => formatTrend(overview.value?.expenseChange || 0));

const getCategory = (id: number) =>
  financeStore.categories.find((c) => c.id === Number(id));

const loadChartData = async (period: "week" | "month") => {
  chartLoading.value = true;
  try {
    chartData.value = await dashboardApi.getChartData(period);
  } catch (e) {
    console.error("Failed to load chart data", e);
  } finally {
    chartLoading.value = false;
  }
};

const updateChart = () => {
  if (!lineChart || !chartData.value) return;

  lineChart.setOption({
    xAxis: {
      data: chartData.value.labels,
    },
    series: [
      { name: "收入", data: chartData.value.income },
      { name: "支出", data: chartData.value.expense },
    ],
  });
};

const initChart = () => {
  if (!lineChartRef.value || !chartData.value) return;
  lineChart = echarts.init(lineChartRef.value);

  const option = {
    tooltip: { trigger: "axis" },
    grid: {
      top: "15%",
      bottom: "10%",
      left: "2%",
      right: "2%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: chartData.value.labels,
      axisLine: { lineStyle: { color: "#e2e8f0" } },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { type: "dashed" } },
    },
    series: [
      {
        name: "收入",
        type: "line",
        smooth: true,
        data: chartData.value.income,
        itemStyle: { color: "#10b981" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(16, 185, 129, 0.2)" },
            { offset: 1, color: "rgba(16, 185, 129, 0)" },
          ]),
        },
      },
      {
        name: "支出",
        type: "line",
        smooth: true,
        data: chartData.value.expense,
        itemStyle: { color: "#ef4444" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(239, 68, 68, 0.2)" },
            { offset: 1, color: "rgba(239, 68, 68, 0)" },
          ]),
        },
      },
    ],
  };

  lineChart.setOption(option);
};

watch(chartPeriod, async (newPeriod) => {
  await loadChartData(newPeriod);
  updateChart();
});

onMounted(async () => {
  try {
    const [overviewResult] = await Promise.all([
      dashboardApi.getOverview(),
      financeStore.initialize(),
      financeStore.loadTransactions(),
    ]);
    overview.value = overviewResult;

    await loadChartData(chartPeriod.value);

    initChart();
    setTimeout(() => {
      lineChart?.resize();
    }, 100);
  } catch (e) {
    console.error("Failed to load dashboard data", e);
  }

  window.addEventListener("resize", () => lineChart?.resize());
});

onUnmounted(() => {
  window.removeEventListener("resize", () => lineChart?.resize());
});
</script>

<style scoped>
.dashboard-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.summary-card {
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon.balance {
  background: #eef2ff;
  color: #6366f1;
}
.card-icon.income {
  background: #ecfdf5;
  color: #10b981;
}
.card-icon.expense {
  background: #fef2f2;
  color: #ef4444;
}
.card-icon.budget {
  background: #fffbeb;
  color: #f59e0b;
}

.card-content {
  flex: 1;
}

.label {
  font-size: 0.85rem;
  color: var(--text-muted);
  display: block;
  margin-bottom: 4px;
}

.value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.trend {
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend.up {
  color: #10b981;
}
.trend.down {
  color: #ef4444;
}

.budget-progress {
  margin-top: 8px;
}

.progress-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 4px;
  display: block;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.chart-loading {
  height: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .summary-card,
  .chart-section,
  .recent-transactions {
    padding: 16px;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
}

.chart-section {
  padding: 24px;
}

.chart-container {
  height: 480px;
  width: 100%;
}

.recent-transactions {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.transaction-list {
  flex: 1;
}

.tx-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.tx-item:last-child {
  border-bottom: none;
}

.tx-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.tx-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tx-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.tx-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.tx-amount {
  font-weight: 700;
  font-size: 1rem;
}

.tx-amount.income {
  color: #10b981;
}
.tx-amount.expense {
  color: var(--text-main);
}
</style>
