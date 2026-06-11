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
            ¥ {{ financeStore.totalBalance.toLocaleString() }}
          </h3>
          <span class="trend up">
            <lucide-icon name="ArrowUpRight" :size="14" />
            +2.4% 从上月
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
            ¥ {{ financeStore.totalIncome.toLocaleString() }}
          </h3>
          <span class="trend up">
            <lucide-icon name="ArrowUpRight" :size="14" />
            +12% 从上月
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
            ¥ {{ financeStore.totalExpense.toLocaleString() }}
          </h3>
          <span class="trend down">
            <lucide-icon name="ArrowDownRight" :size="14" />
            -4.2% 从上月
          </span>
        </div>
      </div>

      <div class="summary-card glass-card">
        <div class="card-icon budget">
          <lucide-icon name="Target" :size="20" />
        </div>
        <div class="card-content">
          <span class="label">预算余额</span>
          <h3 class="value">¥ 4,200.00</h3>
          <div class="budget-progress">
            <el-progress
              :percentage="65"
              :show-text="false"
              :stroke-width="4"
            />
            <span class="progress-label">已使用 65%</span>
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
        <div ref="lineChartRef" class="chart-container"></div>
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
                backgroundColor: getCategory(tx.categoryId)?.color + '15',
              }"
            >
              <lucide-icon
                :name="getCategory(tx.categoryId)?.icon || 'HelpCircle'"
                :size="18"
                :color="getCategory(tx.categoryId)?.color"
              />
            </div>
            <div class="tx-info">
              <span class="tx-name">{{
                getCategory(tx.categoryId)?.name
              }}</span>
              <span class="tx-date">{{ tx.date }}</span>
            </div>
            <div class="tx-amount" :class="tx.type">
              {{ tx.type === "income" ? "+" : "-" }}¥{{ tx.amount.toFixed(2) }}
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
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useFinanceStore } from "../store/finance";
import LucideIcon from "../components/LucideIcon.vue";
import * as echarts from "echarts";

const financeStore = useFinanceStore();
const chartPeriod = ref("week");
const lineChartRef = ref<HTMLElement | null>(null);
let lineChart: echarts.ECharts | null = null;

const getCategory = (id: string) =>
  financeStore.categories.find((c) => c.id === id);

const chartData = {
  week: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    income: [1200, 1500, 900, 1800, 2000, 1600, 2200],
    expense: [800, 1200, 600, 1500, 1200, 2100, 1300],
  },
  month: {
    labels: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
    income: Array.from({ length: 30 }, () =>
      Math.floor(Math.random() * 2000 + 1000),
    ),
    expense: Array.from({ length: 30 }, () =>
      Math.floor(Math.random() * 1500 + 500),
    ),
  },
};

const updateChart = () => {
  if (!lineChart) return;
  const current = chartData[chartPeriod.value as keyof typeof chartData];

  lineChart.setOption({
    xAxis: {
      data: current.labels,
    },
    series: [
      { name: "收入", data: current.income },
      { name: "支出", data: current.expense },
    ],
  });
};

const initChart = () => {
  if (!lineChartRef.value) return;
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
      data: chartData.week.labels,
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
        data: chartData.week.income,
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
        data: chartData.week.expense,
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
  if (chartPeriod.value === "month") updateChart();
};

watch(chartPeriod, () => {
  updateChart();
});

onMounted(() => {
  initChart();
  // Ensure chart takes correct dimensions after layout is settled
  setTimeout(() => {
    lineChart?.resize();
  }, 100);
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
