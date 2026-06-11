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
              :percentage="72"
              :width="120"
              color="#6366f1"
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
                <span class="value">¥ 5,000.00</span>
              </div>
            </div>
            <div class="stat-card expense">
              <div class="icon-box">
                <lucide-icon name="ArrowUpRight" :size="20" />
              </div>
              <div class="content">
                <span class="label">已支出</span>
                <span class="value">¥ 3,600.00</span>
              </div>
            </div>
            <div class="stat-card remaining">
              <div class="icon-box">
                <lucide-icon name="PiggyBank" :size="20" />
              </div>
              <div class="content">
                <span class="label">剩余</span>
                <span class="value">¥ 1,400.00</span>
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
          v-for="cat in financeStore.categories.filter(
            (c) => c.type === 'expense',
          )"
          :key="cat.id"
          class="budget-card glass-card"
        >
          <div class="card-header">
            <div class="cat-info">
              <div
                class="cat-icon"
                :style="{ backgroundColor: cat.color + '20' }"
              >
                <lucide-icon :name="cat.icon" :size="20" :color="cat.color" />
              </div>
              <span class="cat-name">{{ cat.name }}</span>
            </div>
            <el-button link size="small" @click="editBudget(cat)"
              >设置</el-button
            >
          </div>

          <div class="budget-values">
            <div class="val-row">
              <span class="lbl"
                >已用 ¥{{ (Math.random() * 500).toFixed(0) }}</span
              >
              <span class="lbl">预算 ¥1,000</span>
            </div>
            <el-progress
              :percentage="Math.floor(Math.random() * 90)"
              :color="cat.color"
              :show-text="false"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFinanceStore } from "../store/finance";
import LucideIcon from "../components/LucideIcon.vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { ref } from "vue";

const financeStore = useFinanceStore();
const router = useRouter();
const isAnalyzing = ref(false);

const goToAnalysis = () => {
  isAnalyzing.value = true;
  setTimeout(() => {
    isAnalyzing.value = false;
    router.push("/analysis");
  }, 500);
};

const editBudget = (cat: any) => {
  ElMessage.info(`正在为 ${cat.name} 设置预算功能开发中`);
};
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
