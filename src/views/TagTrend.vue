<template>
  <div class="tag-trend-wrapper">
    <div class="filter-bar glass-card">
      <div class="filter-left">
        <div class="filter-group">
          <span class="filter-label">统计粒度</span>
          <el-radio-group v-model="granularity" size="default" @change="loadTrend">
            <el-radio-button value="day">按日</el-radio-button>
            <el-radio-button value="week">按周</el-radio-button>
            <el-radio-button value="month">按月</el-radio-button>
          </el-radio-group>
        </div>
        <div class="filter-group">
          <span class="filter-label">标签选择</span>
          <el-select
            v-model="selectedTagId"
            placeholder="全部标签"
            clearable
            size="default"
            @change="loadTrend"
            style="width: 160px"
          >
            <el-option
              v-for="tag in allTags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            />
          </el-select>
        </div>
      </div>
      <div class="filter-right">
        <div class="filter-group">
          <span class="filter-label">周期数</span>
          <el-input-number
            v-model="periods"
            :min="2"
            :max="30"
            size="default"
            @change="loadTrend"
          />
        </div>
      </div>
    </div>

    <div class="chart-section glass-card">
      <div class="section-header">
        <div class="section-title">
          <lucide-icon name="TrendingUp" :size="20" />
          <span>标签金额趋势</span>
        </div>
        <el-radio-group v-model="chartType" size="small">
          <el-radio-button value="expense">支出</el-radio-button>
          <el-radio-button value="income">收入</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="loading" class="chart-loading">
        <el-icon class="is-loading" :size="28"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else ref="lineChartRef" class="chart-box"></div>
    </div>

    <div class="trend-cards" v-if="trendData && trendData.trends.length > 0">
      <div
        v-for="trend in trendData.trends"
        :key="trend.tagId"
        class="trend-card glass-card"
      >
        <div class="card-header">
          <div class="tag-info">
            <div
              class="tag-icon"
              :style="{
                backgroundColor: getTagColor(trend.tagId) + '20',
              }"
            >
              <lucide-icon
                :name="getTagIcon(trend.tagId)"
                :size="18"
                :color="getTagColor(trend.tagId)"
              />
            </div>
            <span class="tag-name">{{ trend.tagName }}</span>
          </div>
          <div class="change-badges">
            <div
              class="change-badge"
              :class="trend.expenseChange >= 0 ? 'up' : 'down'"
            >
              <lucide-icon
                :name="trend.expenseChange >= 0 ? 'ArrowUpRight' : 'ArrowDownRight'"
                :size="12"
              />
              支出 {{ trend.expenseChange }}%
            </div>
            <div
              class="change-badge"
              :class="trend.incomeChange >= 0 ? 'up' : 'down'"
            >
              <lucide-icon
                :name="trend.incomeChange >= 0 ? 'ArrowUpRight' : 'ArrowDownRight'"
                :size="12"
              />
              收入 {{ trend.incomeChange }}%
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="amount-row">
            <div class="amount-item">
              <span class="amount-label">本期支出</span>
              <span class="amount-value expense">
                ¥{{ trend.expense[trend.expense.length - 1]?.toFixed(2) || "0.00" }}
              </span>
            </div>
            <div class="amount-item">
              <span class="amount-label">本期收入</span>
              <span class="amount-value income">
                ¥{{ trend.income[trend.income.length - 1]?.toFixed(2) || "0.00" }}
              </span>
            </div>
            <div class="amount-item">
              <span class="amount-label">交易笔数</span>
              <span class="amount-value">
                {{ trend.count[trend.count.length - 1] || 0 }} 笔
              </span>
            </div>
          </div>
          <div class="mini-chart" :ref="(el: any) => setMiniChartRef(trend.tagId, el)"></div>
        </div>
      </div>
    </div>

    <el-empty
      v-if="!loading && (!trendData || trendData.trends.length === 0)"
      description="暂无标签趋势数据"
      :image-size="100"
      class="empty-state"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { tagsApi } from "../api/tags";
import { TagTrendResponse, Tag } from "../types";
import LucideIcon from "../components/LucideIcon.vue";
import { Loading } from "@element-plus/icons-vue";
import * as echarts from "echarts";

const loading = ref(false);
const granularity = ref<"day" | "week" | "month">("week");
const selectedTagId = ref<number | undefined>();
const periods = ref(8);
const chartType = ref<"income" | "expense">("expense");

const allTags = ref<Tag[]>([]);
const trendData = ref<TagTrendResponse | null>(null);

const lineChartRef = ref<HTMLElement | null>(null);
let lineChart: echarts.ECharts | null = null;
const miniCharts = new Map<number, echarts.ECharts | null>();

const setMiniChartRef = (tagId: number, el: any) => {
  if (el && trendData.value) {
    nextTick(() => {
      initMiniChart(tagId, el);
    });
  }
};

const getTagColor = (tagId: number): string => {
  const tag = allTags.value.find((t) => t.id === tagId);
  return tag?.color || "#6366f1";
};

const getTagIcon = (tagId: number): string => {
  const tag = allTags.value.find((t) => t.id === tagId);
  return tag?.icon || "Tag";
};

const loadTags = async () => {
  try {
    allTags.value = await tagsApi.findAll();
  } catch (e) {
    console.error("加载标签列表失败", e);
  }
};

const loadTrend = async () => {
  loading.value = true;
  try {
    const params: any = {
      granularity: granularity.value,
      periods: periods.value,
    };
    if (selectedTagId.value) {
      params.tagId = selectedTagId.value;
    }

    trendData.value = await tagsApi.getTagTrend(params);
    await nextTick();
    updateMainChart();
    updateMiniCharts();
  } catch (e) {
    console.error("加载标签趋势失败", e);
  } finally {
    loading.value = false;
  }
};

const initMainChart = () => {
  if (!lineChartRef.value) return;
  lineChart = echarts.init(lineChartRef.value);
  updateMainChart();
};

const updateMainChart = () => {
  if (!lineChart || !trendData.value) return;

  const isDark = document.documentElement.classList.contains("dark");
  const labels = trendData.value.labels.map((l) => l.label);
  const series: any[] = [];

  trendData.value.trends.forEach((trend) => {
    const color = getTagColor(trend.tagId);
    const data = chartType.value === "income" ? trend.income : trend.expense;
    series.push({
      name: trend.tagName,
      type: "line",
      smooth: true,
      data,
      itemStyle: { color },
      lineStyle: { width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + "30" },
          { offset: 1, color: color + "00" },
        ]),
      },
    });
  });

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: isDark ? "#1e293b" : "#fff",
      borderColor: isDark ? "#334155" : "#e2e8f0",
      textStyle: { color: isDark ? "#f1f5f9" : "#1e293b" },
      padding: [10, 14],
      borderRadius: 8,
      valueFormatter: (value: number) => `¥${value.toFixed(2)}`,
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: {
        color: isDark ? "#94a3b8" : "#64748b",
        fontSize: 12,
      },
    },
    grid: {
      top: "15%",
      bottom: "10%",
      left: "3%",
      right: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: isDark ? "#334155" : "#e2e8f0" } },
      axisLabel: {
        color: isDark ? "#94a3b8" : "#64748b",
      },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: {
        lineStyle: { type: "dashed", color: isDark ? "#334155" : "#e2e8f0" },
      },
      axisLabel: {
        color: isDark ? "#94a3b8" : "#64748b",
        formatter: (value: number) =>
          value >= 10000 ? `${(value / 10000).toFixed(1)}万` : value,
      },
    },
    series,
  };

  lineChart.setOption(option, true);
};

const initMiniChart = (tagId: number, el: HTMLElement) => {
  const existing = miniCharts.get(tagId);
  if (existing) {
    existing.dispose();
  }

  const chart = echarts.init(el);
  miniCharts.set(tagId, chart);

  const trend = trendData.value?.trends.find((t) => t.tagId === tagId);
  if (!trend || !trendData.value) return;

  const color = getTagColor(tagId);
  const data = chartType.value === "income" ? trend.income : trend.expense;
  const labels = trendData.value.labels.map((l) => l.label);

  chart.setOption({
    backgroundColor: "transparent",
    grid: { top: 5, bottom: 0, left: 0, right: 0 },
    xAxis: {
      type: "category",
      show: false,
      data: labels,
    },
    yAxis: {
      type: "value",
      show: false,
    },
    series: [
      {
        type: "line",
        smooth: true,
        data,
        symbol: "none",
        lineStyle: { width: 2, color },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color + "40" },
            { offset: 1, color: color + "05" },
          ]),
        },
      },
    ],
  });
};

const updateMiniCharts = () => {
  miniCharts.forEach((chart, tagId) => {
    const trend = trendData.value?.trends.find((t) => t.tagId === tagId);
    if (chart && trend && trendData.value) {
      const color = getTagColor(tagId);
      const data = chartType.value === "income" ? trend.income : trend.expense;
      chart.setOption({
        series: [
          {
            data,
            lineStyle: { width: 2, color },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: color + "40" },
                { offset: 1, color: color + "05" },
              ]),
            },
          },
        ],
      });
    }
  });
};

const handleResize = () => {
  lineChart?.resize();
  miniCharts.forEach((chart) => chart?.resize());
};

onMounted(async () => {
  await loadTags();
  await loadTrend();
  initMainChart();
  setTimeout(() => {
    lineChart?.resize();
  }, 100);
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  lineChart?.dispose();
  miniCharts.forEach((chart) => chart?.dispose());
});
</script>

<style scoped>
.tag-trend-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-bar {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-left,
.filter-right {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.chart-section {
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.05rem;
  font-weight: 600;
}

.chart-box {
  height: 360px;
  width: 100%;
}

.chart-loading {
  height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-muted);
}

.trend-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.trend-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tag-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.change-badges {
  display: flex;
  gap: 8px;
}

.change-badge {
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
}

.change-badge.up {
  background: #fef2f2;
  color: #ef4444;
}

.change-badge.down {
  background: #ecfdf5;
  color: #10b981;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.amount-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.amount-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.amount-label {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.amount-value {
  font-size: 0.95rem;
  font-weight: 700;
}

.amount-value.income {
  color: #10b981;
}
.amount-value.expense {
  color: var(--text-main);
}

.mini-chart {
  height: 60px;
  width: 100%;
}

.empty-state {
  padding: 40px;
}

@media (max-width: 640px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 14px 16px;
  }

  .filter-left,
  .filter-right {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .chart-section {
    padding: 16px;
  }

  .chart-box {
    height: 260px;
  }

  .trend-cards {
    grid-template-columns: 1fr;
  }
}
</style>
