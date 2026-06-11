<template>
  <div class="analysis-wrapper">
    <div class="top-row">
      <div class="summary-box glass-card">
        <div class="section-title">
          <lucide-icon name="Activity" :size="20" />
          <span>支出结构分析</span>
        </div>
        <div ref="pieChartRef" class="chart-box"></div>
      </div>

      <div class="summary-box glass-card">
        <div class="section-title">
          <lucide-icon name="BarChart3" :size="20" />
          <span>本月收支平衡</span>
        </div>
        <div class="balance-stats">
          <div class="stat-item">
            <span class="label">收入</span>
            <span class="value income"
              >¥{{ financeStore.totalIncome.toFixed(2) }}</span
            >
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="label">支出</span>
            <span class="value expense"
              >¥{{ financeStore.totalExpense.toFixed(2) }}</span
            >
          </div>
          <div class="net-value">
            <span class="label">结余</span>
            <span class="amount" :class="{ positive: balance >= 0 }">
              {{ balance >= 0 ? "+" : "" }}¥{{ balance.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-row glass-card">
      <div class="section-header">
        <div class="section-title">
          <lucide-icon name="ListOrdered" :size="20" />
          <span>支出排行 (Top 5)</span>
        </div>
      </div>
      <div class="ranking-list">
        <div
          v-for="(item, index) in categoryRanking"
          :key="index"
          class="ranking-item"
        >
          <div class="rank-num">{{ Number(index) + 1 }}</div>
          <div
            class="rank-icon"
            :style="{ backgroundColor: item.color + '20' }"
          >
            <lucide-icon :name="item.icon" :size="20" :color="item.color" />
          </div>
          <div class="rank-info">
            <div class="rank-name-row">
              <span class="name">{{ item.name }}</span>
              <span class="amount">¥{{ item.total.toFixed(2) }}</span>
            </div>
            <div class="progress-container">
              <el-progress
                :percentage="item.percentage"
                :color="item.color"
                :show-text="false"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useFinanceStore } from "../store/finance";
import LucideIcon from "../components/LucideIcon.vue";
import * as echarts from "echarts";

const financeStore = useFinanceStore();
const pieChartRef = ref<HTMLElement | null>(null);
let pieChart: echarts.ECharts | null = null;

const balance = computed(
  () => financeStore.totalIncome - financeStore.totalExpense,
);

const expenseByCategory = computed(() => {
  const map = new Map<string, number>();
  financeStore.transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cat = financeStore.categories.find((c) => c.id === t.categoryId);
      if (cat) {
        map.set(cat.id, (map.get(cat.id) || 0) + t.amount);
      }
    });
  return Array.from(map.entries()).map(([id, total]) => {
    const cat = financeStore.categories.find((c) => c.id === id)!;
    return { name: cat.name, value: total, color: cat.color, icon: cat.icon };
  });
});

const categoryRanking = computed(() => {
  const sorted = [...expenseByCategory.value].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((acc, curr) => acc + curr.value, 0);
  return sorted.slice(0, 5).map((item) => ({
    ...item,
    total: item.value,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
  }));
});

const initPieChart = () => {
  if (!pieChartRef.value) return;
  pieChart = echarts.init(pieChartRef.value);

  const data = expenseByCategory.value;
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
      shadowBlur: 10,
      shadowColor: "rgba(0,0,0,0.1)",
    },
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
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
        name: "支出分类",
        type: "pie",
        radius: window.innerWidth < 640 ? ["45%", "70%"] : ["50%", "75%"],
        center: ["50%", window.innerWidth < 640 ? "42%" : "45%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 2,
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
        data: data.map((d) => ({
          value: d.value,
          name: d.name,
          itemStyle: { color: d.color },
        })),
      },
    ],
  };

  pieChart.setOption(option);
};

onMounted(() => {
  initPieChart();
  // Ensure chart takes correct dimensions after layout is settled
  setTimeout(() => {
    pieChart?.resize();
  }, 100);
  window.addEventListener("resize", () => pieChart?.resize());
});

onUnmounted(() => {
  window.removeEventListener("resize", () => pieChart?.resize());
});
</script>

<style scoped>
.analysis-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.top-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.summary-box {
  padding: 24px;
  height: 420px;
  display: flex;
  flex-direction: column;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 24px;
}

.chart-box {
  width: 100%;
  height: 350px;
  display: block;
  margin: 0 auto;
}

.balance-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stat-item .label {
  color: var(--text-muted);
  font-size: 1rem;
}
.stat-item .value {
  font-size: 1.5rem;
  font-weight: 700;
}
.stat-item .income {
  color: #10b981;
}
.stat-item .expense {
  color: #ef4444;
}

.stat-divider {
  height: 1px;
  background: var(--border);
  margin: 10px 0 30px;
}

.net-value {
  text-align: center;
  background: rgba(255, 255, 255, 0.4);
  padding: 16px;
  border-radius: 16px;
  border: 1px solid var(--border);
  width: 100%;
}

html.dark .net-value {
  background: rgba(30, 41, 59, 0.4);
}

.net-value .amount {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  margin-top: 4px;
  word-break: break-all;
}

.net-value .amount.positive {
  color: var(--primary);
}

.bottom-row {
  padding: 24px;
}

.ranking-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 20px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rank-num {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--border);
  width: 24px;
}

.rank-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-name-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.rank-name-row .name {
  font-weight: 600;
}
.rank-name-row .amount {
  font-weight: 600;
  color: var(--text-muted);
}

/* Responsive Overrides */
@media (max-width: 1024px) {
  .top-row {
    grid-template-columns: 1fr;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .summary-box {
    height: auto;
    min-height: unset;
    padding: 20px;
  }

  .balance-stats {
    padding: 10px 0;
  }

  .chart-box {
    height: 320px;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .analysis-wrapper {
    gap: 16px;
  }

  .summary-box {
    padding: 16px;
  }

  .net-value .amount {
    font-size: 1.6rem;
  }

  .ranking-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    grid-template-columns: none;
  }

  .ranking-item {
    gap: 12px;
  }

  .rank-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .rank-icon :deep(svg) {
    width: 18px;
    height: 18px;
  }

  .rank-num {
    width: 20px;
    font-size: 1rem;
  }

  .rank-name-row {
    margin-bottom: 4px;
  }

  .rank-name-row .name {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 8px;
  }

  .rank-name-row .amount {
    flex-shrink: 0;
    font-weight: 700;
    color: var(--text-main);
  }
}
</style>
