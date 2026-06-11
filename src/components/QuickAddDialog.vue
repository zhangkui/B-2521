<template>
  <el-dialog
    v-model="visible"
    :title="editData ? '编辑交易' : '记一笔'"
    :width="isMobile ? '90%' : '460px'"
    @closed="handleClosed"
    append-to-body
    align-center
    class="quick-add-dialog"
  >
    <div class="dialog-scroll-content">
      <el-tabs v-model="form.type" stretch class="type-tabs">
        <el-tab-pane label="支出" name="expense"></el-tab-pane>
        <el-tab-pane label="收入" name="income"></el-tab-pane>
      </el-tabs>

      <el-form :model="form" label-position="top" class="mt-4">
        <el-form-item label="金额">
          <el-input-number
            v-model="form.amount"
            :precision="2"
            :step="1"
            :min="0"
            controls-position="right"
            class="w-full"
          />
        </el-form-item>

        <div class="form-grid">
          <el-form-item label="分类">
            <el-select v-model="form.categoryId" class="w-full">
              <el-option
                v-for="cat in filteredCategories"
                :key="cat.id"
                :label="cat.name"
                :value="cat.id"
              >
                <div class="flex items-center gap-2">
                  <LucideIcon :name="cat.icon" :size="16" :color="cat.color" />
                  <span>{{ cat.name }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="账户">
            <el-select v-model="form.accountId" class="w-full">
              <el-option
                v-for="acc in financeStore.accounts"
                :key="acc.id"
                :label="acc.name"
                :value="acc.id"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="日期">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="选择日期"
            class="w-full"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="3"
            maxlength="100"
            show-word-limit
            placeholder="写点什么..."
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import { useFinanceStore } from "../store/finance";
import { Transaction } from "../types";
import LucideIcon from "./LucideIcon.vue";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";

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

const props = defineProps<{
  modelValue: boolean;
  editData?: any; // Using any to avoid type import issues for now, or use Transaction
}>();

const emit = defineEmits(["update:modelValue"]);

const financeStore = useFinanceStore();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const form = reactive({
  amount: 0,
  type: "expense" as "income" | "expense",
  categoryId: "",
  accountId: financeStore.accounts[0]?.id || "",
  date: dayjs().format("YYYY-MM-DD"),
  note: "",
});

const filteredCategories = computed(() =>
  financeStore.categories.filter((c) => c.type === form.type),
);

watch(
  () => form.type,
  (newType) => {
    // Only auto-switch category if we are NOT populating from existing data
    // OR if the current category doesn't match the new type (manual switch)
    if (
      !props.editData ||
      (props.editData.type !== newType && !form.categoryId)
    ) {
      const defaultCat = financeStore.categories.find(
        (c) => c.type === newType,
      );
      if (defaultCat) form.categoryId = defaultCat.id;
    } else if (props.editData && props.editData.type !== newType) {
      // If user switched type manually while editing, we should reset category to default of new type
      const defaultCat = financeStore.categories.find(
        (c) => c.type === newType,
      );
      if (defaultCat) form.categoryId = defaultCat.id;
    }
  },
);

// Watch for dialog opening to populate form
watch(
  () => props.modelValue,
  (val) => {
    if (val && props.editData) {
      form.amount = props.editData.amount;
      form.type = props.editData.type;
      form.categoryId = props.editData.categoryId;
      form.accountId = props.editData.accountId;
      form.date = props.editData.date;
      form.note = props.editData.note;
    } else if (val) {
      // Reset to defaults for new entry
      form.amount = 0;
      form.type = "expense";
      form.date = dayjs().format("YYYY-MM-DD");
      form.note = "";
      form.categoryId =
        financeStore.categories.find((c) => c.type === "expense")?.id || "";
      form.accountId = financeStore.accounts[0]?.id || "";
    }
  },
);

const isFormValid = computed(
  () => form.amount > 0 && form.categoryId && form.accountId,
);

const handleSubmit = () => {
  if (props.editData) {
    financeStore.updateTransaction({
      ...props.editData,
      ...form,
    });
    ElMessage.success("已更新");
  } else {
    financeStore.addTransaction({ ...form });
    ElMessage.success("已保存");
  }
  visible.value = false;
};

const handleClosed = () => {
  form.amount = 0;
  form.note = "";
  // Reset other fields if necessary
};
</script>

<style scoped>
.quick-add-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
}

.quick-add-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
}

.dialog-scroll-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 4px;
}

/* 简洁滚动条 */
.dialog-scroll-content::-webkit-scrollbar {
  width: 5px;
}
.dialog-scroll-content::-webkit-scrollbar-track {
  background: transparent;
}
.dialog-scroll-content::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 10px;
}

.type-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.w-full {
  width: 100%;
}

.mt-4 {
  margin-top: 16px;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 8px;
}

@media (max-width: 1024px) {
  .quick-add-dialog :deep(.el-dialog) {
    margin: 20px auto;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .mt-4 {
    margin-top: 12px;
  }
}
</style>
