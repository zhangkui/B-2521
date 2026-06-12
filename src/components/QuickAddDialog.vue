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
                  <LucideIcon :name="cat.icon || 'HelpCircle'" :size="16" :color="cat.color || undefined" />
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

        <el-form-item label="标签">
          <el-select
            v-model="form.tagIds"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或创建标签"
            class="w-full"
            @create="handleCreateTag"
          >
            <el-option
              v-for="tag in financeStore.tags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            >
              <div class="flex items-center gap-2">
                <span
                  class="tag-dot"
                  :style="{ backgroundColor: tag.color || '#6366f1' }"
                ></span>
                <span>{{ tag.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!isFormValid"
          :loading="submitting"
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
  editData?: any;
}>();

const emit = defineEmits(["update:modelValue"]);

const financeStore = useFinanceStore();

const submitting = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const defaultCategoryId = computed(() => 
  financeStore.categories.find((c) => c.type === form.type)?.id ?? 0
);

const defaultAccountId = computed(() => 
  financeStore.accounts[0]?.id ?? 0
);

const form = reactive({
  amount: 0,
  type: "expense" as "income" | "expense",
  categoryId: 0 as number,
  accountId: 0 as number,
  date: dayjs().format("YYYY-MM-DD"),
  note: "",
  tagIds: [] as number[],
});

const filteredCategories = computed(() =>
  financeStore.categories.filter((c) => c.type === form.type),
);

watch(
  () => form.type,
  (newType) => {
    if (
      !props.editData ||
      (props.editData.type !== newType && !form.categoryId)
    ) {
      const defaultCat = financeStore.categories.find(
        (c) => c.type === newType,
      );
      if (defaultCat) form.categoryId = defaultCat.id;
    } else if (props.editData && props.editData.type !== newType) {
      const defaultCat = financeStore.categories.find(
        (c) => c.type === newType,
      );
      if (defaultCat) form.categoryId = defaultCat.id;
    }
  },
);

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.editData) {
      form.amount = props.editData.amount;
      form.type = props.editData.type;
      form.categoryId = Number(props.editData.categoryId);
      form.accountId = Number(props.editData.accountId);
      form.date = props.editData.date || dayjs(props.editData.transactionDate || props.editData.createdAt).format("YYYY-MM-DD");
      form.note = props.editData.note || props.editData.description || "";
      form.tagIds = props.editData.tags?.map((t: any) => t.id) || [];
    } else if (val) {
      form.amount = 0;
      form.type = "expense";
      form.date = dayjs().format("YYYY-MM-DD");
      form.note = "";
      form.tagIds = [];
      form.categoryId =
        financeStore.categories.find((c) => c.type === "expense")?.id ?? 0;
      form.accountId = financeStore.accounts[0]?.id ?? 0;
    }
  },
);

const isFormValid = computed(
  () => form.amount > 0 && form.categoryId && form.accountId,
);

const handleCreateTag = async (tagName: string) => {
  try {
    const newTag = await financeStore.addTag({ name: tagName });
    form.tagIds.push(newTag.id);
  } catch (error: any) {
    ElMessage.error(error.message || "创建标签失败");
  }
};

const handleSubmit = async () => {
  try {
    submitting.value = true;
    if (props.editData) {
      await financeStore.updateTransaction({
        ...props.editData,
        ...form,
        date: form.date,
        tagIds: form.tagIds,
      });
      ElMessage.success("已更新");
    } else {
      await financeStore.addTransaction({
        amount: form.amount,
        type: form.type,
        categoryId: Number(form.categoryId),
        accountId: Number(form.accountId),
        date: form.date,
        note: form.note,
        tagIds: form.tagIds,
      });
      ElMessage.success("已保存");
    }
    visible.value = false;
  } catch (error: any) {
    ElMessage.error(error.message || "保存失败");
  } finally {
    submitting.value = false;
  }
};

const handleClosed = () => {
  form.amount = 0;
  form.note = "";
  form.tagIds = [];
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

.tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
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
