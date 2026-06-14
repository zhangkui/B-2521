<template>
  <div class="reports-wrapper">
    <el-tabs v-model="activeTab" class="reports-tabs">
      <el-tab-pane label="历史报表" name="history">
        <div class="report-history">
          <div class="toolbar glass-card">
            <div class="toolbar-left">
              <el-select
                v-model="filterPeriod"
                placeholder="全部周期"
                size="default"
                @change="loadReports"
                style="width: 140px"
              >
                <el-option label="全部周期" value="" />
                <el-option label="周报" value="WEEKLY" />
                <el-option label="月报" value="MONTHLY" />
              </el-select>
            </div>
            <div class="toolbar-right">
              <el-button type="primary" @click="showGenerateDialog = true">
                <lucide-icon name="FilePlus" :size="16" />
                <span class="ml-2">生成报表</span>
              </el-button>
            </div>
          </div>

          <div class="report-list" v-loading="loading">
            <div
              v-for="report in reports"
              :key="report.id"
              class="report-card glass-card"
              @click="viewReport(report.id)"
            >
              <div class="card-icon" :class="report.period.toLowerCase()">
                <lucide-icon name="FileText" :size="24" />
              </div>
              <div class="card-info">
                <h4 class="card-title">{{ report.title }}</h4>
                <div class="card-meta">
                  <span class="period-tag" :class="report.period.toLowerCase()">
                    {{ report.period === "WEEKLY" ? "周报" : "月报" }}
                  </span>
                  <span class="date">
                    {{ formatDate(report.startDate) }} - {{ formatDate(report.endDate) }}
                  </span>
                </div>
                <div class="card-stats">
                  <div class="stat-item">
                    <span class="stat-label">收入</span>
                    <span class="stat-value income">¥{{ report.content?.summary?.totalIncome?.toFixed(2) || "0.00" }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">支出</span>
                    <span class="stat-value expense">¥{{ report.content?.summary?.totalExpense?.toFixed(2) || "0.00" }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">结余</span>
                    <span class="stat-value">¥{{ report.content?.summary?.netBalance?.toFixed(2) || "0.00" }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">笔数</span>
                    <span class="stat-value">{{ report.content?.summary?.transactionCount || 0 }}</span>
                  </div>
                </div>
              </div>
              <div class="card-actions">
                <el-button type="primary" link @click.stop="viewReport(report.id)">
                  查看详情
                </el-button>
                <el-button type="danger" link @click.stop="deleteReport(report.id)">
                  删除
                </el-button>
              </div>
            </div>

            <el-empty
              v-if="!loading && reports.length === 0"
              description="暂无报表记录"
              :image-size="100"
            />
          </div>

          <div class="pagination-bar" v-if="totalPages > 1">
            <el-pagination
              v-model:current-page="page"
              :page-size="pageSize"
              :total="total"
              layout="prev, pager, next, total"
              @current-change="loadReports"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="定时订阅" name="subscription">
        <div class="subscription-section">
          <div class="intro-card glass-card">
            <div class="intro-icon">
              <lucide-icon name="BellRing" :size="28" />
            </div>
            <div class="intro-content">
              <h3>定时报表订阅</h3>
              <p>设置后系统将自动按周/月为您生成财务报表，随时掌握财务状况变化。</p>
            </div>
          </div>

          <div class="subscription-list">
            <div class="sub-card glass-card" v-for="periodType in periodOptions" :key="periodType.value">
              <div class="sub-left">
                <div class="sub-icon" :class="periodType.value.toLowerCase()">
                  <lucide-icon :name="periodType.icon" :size="22" />
                </div>
                <div class="sub-info">
                  <h4 class="sub-title">{{ periodType.label }}报表订阅</h4>
                  <p class="sub-desc">{{ periodType.desc }}</p>
                </div>
              </div>
              <div class="sub-right">
                <div v-if="getSubscription(periodType.value)" class="sub-status">
                  <el-switch
                    v-model="subscriptionsMap[periodType.value]!.isActive"
                    @change="(val: boolean) => toggleSubscription(periodType.value, val)"
                  />
                  <span class="status-text">
                    {{ subscriptionsMap[periodType.value]?.isActive ? "已启用" : "已停用" }}
                  </span>
                  <span class="last-gen" v-if="subscriptionsMap[periodType.value]?.lastGeneratedAt">
                    上次生成：{{ formatDate(subscriptionsMap[periodType.value]!.lastGeneratedAt!) }}
                  </span>
                </div>
                <div v-else class="sub-action">
                  <el-button type="primary" @click="createSubscription(periodType.value)">
                    <lucide-icon name="Plus" :size="16" />
                    <span class="ml-2">开通订阅</span>
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <div class="tips-card glass-card">
            <div class="tips-header">
              <lucide-icon name="Lightbulb" :size="18" />
              <span>温馨提示</span>
            </div>
            <ul class="tips-list">
              <li>周报将在每周一自动生成上一周的财务报表</li>
              <li>月报将在每月1日自动生成上一月的财务报表</li>
              <li>您可以随时在「历史报表」中查看和管理所有已生成的报表</li>
              <li>也可以点击上方「生成报表」按钮手动创建任意周期的报表</li>
            </ul>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="showGenerateDialog"
      title="生成报表"
      width="480px"
      :close-on-click-modal="false"
    >
      <div class="generate-form">
        <el-form label-position="top">
          <el-form-item label="报表周期">
            <el-radio-group v-model="generatePeriod" size="default">
              <el-radio-button value="WEEKLY">周报</el-radio-button>
              <el-radio-button value="MONTHLY">月报</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="generatePeriod === 'MONTHLY'" label="选择月份">
            <el-date-picker
              v-model="generateMonth"
              type="month"
              placeholder="选择月份"
              value-format="YYYY-MM"
              size="default"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item v-else label="选择周">
            <el-select v-model="generateWeek" placeholder="选择周" size="default" style="width: 100%">
              <el-option
                v-for="week in weekOptions"
                :key="week.value"
                :label="week.label"
                :value="week.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showGenerateDialog = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="handleGenerate">
          生成报表
        </el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="showDetailDrawer"
      :title="currentReport?.title || '报表详情'"
      size="80%"
      direction="rtl"
    >
      <div class="report-detail" v-if="currentReport">
        <div class="detail-summary">
          <div class="summary-item income">
            <span class="label">总收入</span>
            <span class="value">¥{{ currentReport.content?.summary?.totalIncome?.toFixed(2) || "0.00" }}</span>
          </div>
          <div class="summary-item expense">
            <span class="label">总支出</span>
            <span class="value">¥{{ currentReport.content?.summary?.totalExpense?.toFixed(2) || "0.00" }}</span>
          </div>
          <div class="summary-item balance">
            <span class="label">结余</span>
            <span class="value">¥{{ currentReport.content?.summary?.netBalance?.toFixed(2) || "0.00" }}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">
            <lucide-icon name="PieChart" :size="18" />
            支出分类排行
          </h4>
          <div class="category-list">
            <div
              v-for="(item, index) in expenseByCategory"
              :key="item.category?.id || index"
              class="category-item"
            >
              <div class="rank">{{ index + 1 }}</div>
              <div class="cat-name">{{ item.category?.name || "未分类" }}</div>
              <div class="cat-amount">¥{{ item.totalAmount.toFixed(2) }}</div>
              <div class="cat-bar">
                <el-progress
                  :percentage="item.percentage"
                  :show-text="false"
                  :stroke-width="6"
                  :color="item.category?.color || '#6366f1'"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">
            <lucide-icon name="Tag" :size="18" />
            标签汇总
          </h4>
          <div class="tag-summary-list">
            <div
              v-for="item in currentReport.content?.tagSummary || []"
              :key="item.tag?.id"
              class="tag-summary-item"
            >
              <div class="tag-info">
                <span
                  class="tag-dot"
                  :style="{ backgroundColor: item.tag?.color || '#6366f1' }"
                ></span>
                <span class="tag-name">{{ item.tag?.name }}</span>
              </div>
              <div class="tag-stats">
                <span class="income">+¥{{ item.income.amount.toFixed(2) }}</span>
                <span class="expense">-¥{{ item.expense.amount.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { reportsApi } from "../api/reports";
import {
  Report,
  ReportSubscription,
  ReportPeriod,
  ReportListResponse,
} from "../types";
import LucideIcon from "../components/LucideIcon.vue";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

const router = useRouter();

const activeTab = ref("history");
const loading = ref(false);
const generating = ref(false);

const reports = ref<Report[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const filterPeriod = ref("");

const subscriptions = ref<ReportSubscription[]>([]);
const subscriptionsMap = reactive<Record<string, ReportSubscription>>({});

const showGenerateDialog = ref(false);
const generatePeriod = ref<ReportPeriod>("MONTHLY");
const generateMonth = ref(dayjs().format("YYYY-MM"));
const generateWeek = ref("");

const showDetailDrawer = ref(false);
const currentReport = ref<Report | null>(null);

const periodOptions = [
  {
    value: "WEEKLY",
    label: "每周",
    icon: "Calendar",
    desc: "每周一自动生成上周财务报表",
  },
  {
    value: "MONTHLY",
    label: "每月",
    icon: "CalendarDays",
    desc: "每月1日自动生成上月财务报表",
  },
];

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

const weekOptions = computed(() => {
  const options = [];
  const now = dayjs();
  for (let i = 0; i < 12; i++) {
    const date = now.subtract(i, "week");
    const weekNum = date.isoWeek();
    const year = date.isoWeekYear();
    const weekStart = date.startOf("isoWeek");
    const weekEnd = date.endOf("isoWeek");
    options.push({
      value: `${year}-W${String(weekNum).padStart(2, "0")}`,
      label: `${year}年第${weekNum}周 (${weekStart.format("MM/DD")}-${weekEnd.format("MM/DD")})`,
    });
  }
  return options;
});

const expenseByCategory = computed(() => {
  return currentReport.value?.content?.expenseByCategory || [];
});

const formatDate = (date: string | Date) => {
  return dayjs(date).format("YYYY-MM-DD");
};

const loadReports = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
    };
    if (filterPeriod.value) {
      params.period = filterPeriod.value;
    }
    const result: ReportListResponse = await reportsApi.getReports(params);
    reports.value = result.list;
    total.value = result.pagination.total;
  } catch (e) {
    console.error("加载报表列表失败", e);
  } finally {
    loading.value = false;
  }
};

const loadSubscriptions = async () => {
  try {
    subscriptions.value = await reportsApi.getSubscriptions();
    subscriptions.value.forEach((sub) => {
      subscriptionsMap[sub.period] = sub;
    });
  } catch (e) {
    console.error("加载订阅列表失败", e);
  }
};

const getSubscription = (period: string): ReportSubscription | undefined => {
  return subscriptionsMap[period];
};

const createSubscription = async (period: string) => {
  try {
    const sub = await reportsApi.createSubscription({
      period: period as ReportPeriod,
    });
    subscriptionsMap[period] = sub;
    ElMessage.success("订阅成功");
  } catch (e: any) {
    ElMessage.error(e.message || "订阅失败");
  }
};

const toggleSubscription = async (period: string, isActive: boolean) => {
  const sub = subscriptionsMap[period];
  if (!sub) return;

  try {
    await reportsApi.updateSubscription(sub.id, { isActive });
    ElMessage.success(isActive ? "已启用订阅" : "已停用订阅");
  } catch (e: any) {
    subscriptionsMap[period].isActive = !isActive;
    ElMessage.error(e.message || "操作失败");
  }
};

const viewReport = async (id: number) => {
  try {
    currentReport.value = await reportsApi.getReportDetail(id);
    showDetailDrawer.value = true;
  } catch (e: any) {
    ElMessage.error(e.message || "加载报表详情失败");
  }
};

const deleteReport = (id: number) => {
  ElMessageBox.confirm("确定要删除这张报表吗？删除后无法恢复。", "提示", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        await reportsApi.deleteReport(id);
        ElMessage.success("删除成功");
        loadReports();
      } catch (e: any) {
        ElMessage.error(e.message || "删除失败");
      }
    })
    .catch(() => {});
};

const handleGenerate = async () => {
  if (generatePeriod.value === "MONTHLY" && !generateMonth.value) {
    ElMessage.warning("请选择月份");
    return;
  }
  if (generatePeriod.value === "WEEKLY" && !generateWeek.value) {
    ElMessage.warning("请选择周");
    return;
  }

  generating.value = true;
  try {
    const periodKey =
      generatePeriod.value === "MONTHLY" ? generateMonth.value : generateWeek.value;

    const report = await reportsApi.generateReport({
      period: generatePeriod.value,
      periodKey,
    });

    ElMessage.success("报表生成成功");
    showGenerateDialog.value = false;
    loadReports();
    currentReport.value = report;
    showDetailDrawer.value = true;
  } catch (e: any) {
    ElMessage.error(e.message || "生成失败");
  } finally {
    generating.value = false;
  }
};

onMounted(() => {
  if (weekOptions.value.length > 0) {
    generateWeek.value = weekOptions.value[0].value;
  }
  loadReports();
  loadSubscriptions();
});
</script>

<style scoped>
.reports-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.reports-tabs :deep(.el-tabs__header) {
  margin: 0 0 20px 0;
}

.reports-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: var(--border);
}

.toolbar {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ml-2 {
  margin-left: 6px;
}

.report-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.report-card {
  padding: 20px;
  display: flex;
  gap: 18px;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.card-icon.weekly {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}
.card-icon.monthly {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.period-tag {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.period-tag.weekly {
  background: #eef2ff;
  color: #6366f1;
}
.period-tag.monthly {
  background: #fef3c7;
  color: #d97706;
}

.date {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 700;
}

.stat-value.income {
  color: #10b981;
}
.stat-value.expense {
  color: var(--text-main);
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.pagination-bar {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.subscription-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.intro-card {
  padding: 24px;
  display: flex;
  gap: 20px;
  align-items: center;
  background: linear-gradient(135deg, #6366f115, #8b5cf615);
  border: 1px solid #6366f130;
}

.intro-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.intro-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 6px 0;
}

.intro-content p {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

.subscription-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sub-card {
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sub-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sub-icon.weekly {
  background: #ecfdf5;
  color: #10b981;
}
.sub-icon.monthly {
  background: #fef3c7;
  color: #d97706;
}

.sub-info h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.sub-info p {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

.sub-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sub-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-text {
  font-size: 0.85rem;
  color: var(--text-muted);
  min-width: 50px;
}

.last-gen {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.tips-card {
  padding: 20px 24px;
  background: var(--background);
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  color: #d97706;
  margin-bottom: 12px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 2;
}

.report-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.summary-item {
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.summary-item .label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.summary-item .value {
  font-size: 1.4rem;
  font-weight: 700;
}

.summary-item.income .value {
  color: #10b981;
}
.summary-item.expense .value {
  color: #ef4444;
}
.summary-item.balance .value {
  color: #6366f1;
}

.detail-section h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 14px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: grid;
  grid-template-columns: 24px 1fr auto 120px;
  gap: 12px;
  align-items: center;
}

.category-item .rank {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
}

.category-item .cat-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.category-item .cat-amount {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
}

.tag-summary-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.tag-summary-item {
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.tag-name {
  font-size: 0.85rem;
  font-weight: 500;
}

.tag-stats {
  display: flex;
  gap: 10px;
  font-size: 0.8rem;
}

.tag-stats .income {
  color: #10b981;
}
.tag-stats .expense {
  color: #ef4444;
}

.generate-form {
  padding: 10px 0;
}

@media (max-width: 1024px) {
  .card-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .detail-summary {
    grid-template-columns: 1fr;
  }

  .tag-summary-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 14px 16px;
  }

  .report-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 16px;
  }

  .card-actions {
    flex-direction: row;
    width: 100%;
    justify-content: flex-end;
  }

  .intro-card {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .sub-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 18px;
  }

  .sub-right {
    width: 100%;
    justify-content: space-between;
  }

  .category-item {
    grid-template-columns: 20px 1fr auto;
  }

  .cat-bar {
    grid-column: 1 / -1;
  }
}
</style>
