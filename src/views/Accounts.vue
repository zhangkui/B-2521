<template>
  <div class="accounts-wrapper">
    <div class="header-action">
      <div class="title-section">
        <h3>我的账户 ({{ visibleAccounts.length }})</h3>
        <el-checkbox v-model="showHidden" class="ml-4">
          显示已隐藏账户
        </el-checkbox>
      </div>
      <el-button type="primary" @click="handleAddAccount">
        <lucide-icon name="Plus" :size="18" class="mr-2" />
        添加账户
      </el-button>
    </div>

    <div class="accounts-grid">
      <div
        v-for="acc in visibleAccounts"
        :key="acc.id"
        class="account-card"
        :class="{ 'is-hidden': acc.visible === false }"
        :style="{ '--account-color': acc.color || '#6366f1' }"
      >
        <div class="card-bg"></div>
        <div class="card-content">
          <div class="card-header">
            <div class="type-icon">
              <lucide-icon :name="getAccountIcon(acc.type)" :size="20" />
            </div>
            <span class="type-label">{{ getAccountLabel(acc.type) }}</span>
            <el-dropdown trigger="click">
              <el-button link class="more-btn">
                <lucide-icon name="MoreVertical" :size="18" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleEdit(acc)">
                    <lucide-icon name="Pencil" :size="14" class="mr-2" />
                    编辑账户
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleHide(acc.id)">
                    <lucide-icon
                      :name="acc.visible === false ? 'Eye' : 'EyeOff'"
                      :size="14"
                      class="mr-2"
                    />
                    {{ acc.visible === false ? "显示账户" : "隐藏账户" }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    @click="handleDelete(acc.id)"
                    style="color: var(--danger)"
                  >
                    <lucide-icon name="Trash2" :size="14" class="mr-2" />
                    彻底删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <div class="account-info">
            <h4 class="account-name">{{ acc.name }}</h4>
            <div class="account-balance">
              <span class="currency">¥</span>
              <span class="amount">{{
                Number(acc.balance).toLocaleString("zh-CN", {
                  minimumFractionDigits: 2,
                })
              }}</span>
            </div>
          </div>

          <div class="card-footer">
            <span class="status">
              {{ acc.visible === false ? "账户已隐藏" : "正常使用中" }}
            </span>
            <lucide-icon
              name="ShieldCheck"
              :size="16"
              color="rgba(255,255,255,0.7)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Account Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑账户' : '添加账户'"
      width="400px"
      align-center
    >
      <el-form :model="form" label-position="top" ref="accountForm">
        <el-form-item
          label="账户名称"
          required
          prop="name"
          :rules="[
            { required: true, message: '请输入账户名称', trigger: 'blur' },
          ]"
        >
          <el-input v-model="form.name" placeholder="请输入账户名称" />
        </el-form-item>
        <el-form-item label="账户类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="储蓄卡" value="BANK_CARD" />
            <el-option label="现金" value="CASH" />
            <el-option label="支付宝" value="ALIPAY" />
            <el-option label="微信支付" value="WECHAT" />
            <el-option label="信用卡" value="CREDIT_CARD" />
            <el-option label="投资账户" value="INVESTMENT" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="初始金额">
          <el-input-number
            v-model="form.initialBalance"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="标识颜色">
          <el-color-picker v-model="form.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveAccount">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { useFinanceStore } from "../store/finance";
import LucideIcon from "../components/LucideIcon.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { AccountType } from "../types";

const financeStore = useFinanceStore();
const dialogVisible = ref(false);
const isEdit = ref(false);
const showHidden = ref(false);
const saving = ref(false);

const visibleAccounts = computed(() => {
  if (showHidden.value) return financeStore.accounts;
  return financeStore.accounts.filter((acc) => acc.visible !== false);
});
const currentId = ref<number>(0);
const accountForm = ref();

const form = reactive({
  name: "",
  type: "BANK_CARD" as AccountType,
  initialBalance: 0,
  color: "#6366f1" as string | null,
});

const getAccountIcon = (type: AccountType) => {
  switch (type) {
    case "CASH":
      return "Banknote";
    case "BANK_CARD":
      return "Building2";
    case "CREDIT_CARD":
      return "CreditCard";
    case "ALIPAY":
      return "Wallet";
    case "WECHAT":
      return "MessageCircle";
    case "INVESTMENT":
      return "TrendingUp";
    case "OTHER":
    default:
      return "Wallet";
  }
};

const getAccountLabel = (type: AccountType) => {
  switch (type) {
    case "CASH":
      return "现金资产";
    case "BANK_CARD":
      return "储蓄卡";
    case "CREDIT_CARD":
      return "信用负债";
    case "ALIPAY":
      return "支付宝";
    case "WECHAT":
      return "微信支付";
    case "INVESTMENT":
      return "投资账户";
    case "OTHER":
    default:
      return "其他";
  }
};

const handleAddAccount = () => {
  isEdit.value = false;
  form.name = "";
  form.initialBalance = 0;
  form.type = "BANK_CARD";
  form.color = "#6366f1";
  dialogVisible.value = true;
};

const handleEdit = (acc: any) => {
  isEdit.value = true;
  currentId.value = acc.id;
  form.name = acc.name;
  form.initialBalance = acc.initialBalance ?? acc.balance ?? 0;
  form.type = acc.type;
  form.color = acc.color || "#6366f1";
  dialogVisible.value = true;
};

const saveAccount = async () => {
  if (!accountForm.value) return;

  try {
    const valid = await accountForm.value.validate().catch(() => false);
    if (!valid) return;

    saving.value = true;
    if (isEdit.value) {
      await financeStore.updateAccount({
        ...form,
        id: currentId.value,
        color: form.color || undefined,
      } as any);
      ElMessage.success("已更新");
    } else {
      await financeStore.addAccount({
        ...form,
        color: form.color || undefined,
      });
      ElMessage.success("已保存");
    }
    dialogVisible.value = false;
  } catch (error: any) {
    ElMessage.error(error.message || "操作失败");
  } finally {
    saving.value = false;
  }
};

const handleHide = (id: number) => {
  const account = financeStore.accounts.find((a) => a.id === id);
  const isCurrentlyVisible = account?.visible !== false;

  ElMessageBox.confirm(
    isCurrentlyVisible
      ? "隐藏后账户将不再默认显示，资产也不计入总额。确定隐藏吗？"
      : "确定重新显示此账户吗？",
    "提示",
    {
      confirmButtonText: isCurrentlyVisible ? "确定隐藏" : "确定显示",
      cancelButtonText: "取消",
      type: "info",
    },
  ).then(() => {
    financeStore.toggleAccountVisibility(id);
    ElMessage.success(isCurrentlyVisible ? "已隐藏" : "已重新显示");
  });
};

const handleDelete = (id: number) => {
  ElMessageBox.confirm(
    "彻底删除后，该账户及其关联的账单流水（可选）将无法恢复，确定吗？",
    "严重警告",
    {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "error",
      confirmButtonClass: "el-button--danger",
    },
  ).then(async () => {
    try {
      await financeStore.deleteAccount(Number(id));
      ElMessage.success("账户已彻底删除");
    } catch (error: any) {
      ElMessage.error(error.message || "删除失败");
    }
  });
};
</script>

<style scoped>
.accounts-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}
.account-card.is-hidden {
  filter: grayscale(0.8) opacity(0.6);
  transform: scale(0.95);
  cursor: not-allowed;
}

.account-card.is-hidden:hover {
  transform: scale(0.95);
  box-shadow: none;
}

.account-card {
  position: relative;
  height: 190px;
  border-radius: 24px;
  overflow: hidden;
  color: white;
  transition: transform 0.3s;
}

.account-card:hover {
  transform: translateY(-5px);
}

.card-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--account-color);
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(0, 0, 0, 0.1) 100%
  );
  z-index: 1;
}

.card-bg::after {
  content: "";
  position: absolute;
  top: -20%;
  right: -10%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.card-content {
  position: relative;
  z-index: 2;
  height: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-icon {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-label {
  font-size: 0.85rem;
  opacity: 0.8;
  flex: 1;
}

.more-btn {
  color: white;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.more-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2);
}

.account-info {
  margin-top: 10px;
}

.account-name {
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0.9;
  margin-bottom: 4px;
}

.account-balance {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.currency {
  font-size: 1.25rem;
  font-weight: 400;
}
.amount {
  font-size: 2rem;
  font-weight: 700;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status {
  font-size: 0.75rem;
  opacity: 0.6;
}

.mr-2 {
  margin-right: 8px;
}
</style>
