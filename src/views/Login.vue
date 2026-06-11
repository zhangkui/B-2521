<template>
  <div class="login-container">
    <div class="login-card animate-fade-in">
      <div class="login-header">
        <div class="logo">
          <lucide-icon name="Wallet" :size="32" color="white" />
        </div>
        <h1>{{ isLogin ? "欢迎回来" : "创建账户" }}</h1>
        <p>
          {{ isLogin ? "请登录您的智慧记账管理平台" : "开始您的智慧财务之旅" }}
        </p>
      </div>

      <el-form :model="form" class="login-form">
        <el-form-item v-if="!isLogin">
          <el-input v-model="form.username" placeholder="用户名">
            <template #prefix>
              <lucide-icon name="User" :size="16" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-input v-model="form.account" placeholder="用户名或邮箱">
            <template #prefix>
              <lucide-icon name="Mail" :size="16" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            show-password
          >
            <template #prefix>
              <lucide-icon name="Lock" :size="16" />
            </template>
          </el-input>
        </el-form-item>

        <el-button
          type="primary"
          class="submit-btn"
          :loading="loading"
          @click="handleAuth"
        >
          {{ isLogin ? "立即登录" : "注册并开始" }}
        </el-button>
      </el-form>

      <div class="login-footer">
        <span>{{ isLogin ? "没有账户？" : "已有账户？" }}</span>
        <el-button link @click="isLogin = !isLogin">
          {{ isLogin ? "立即注册" : "立即登录" }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import LucideIcon from "../components/LucideIcon.vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../store/auth";
import { useFinanceStore } from "../store/finance";

const router = useRouter();
const authStore = useAuthStore();
const financeStore = useFinanceStore();
const isLogin = ref(true);
const loading = ref(false);

const form = reactive({
  username: "",
  account: "",
  password: "",
});

const handleAuth = async () => {
  if (!form.account || !form.password) {
    ElMessage.warning("请输入账号和密码");
    return;
  }

  if (!isLogin.value && !form.username.trim()) {
    ElMessage.warning("请输入用户名以完成注册");
    return;
  }

  loading.value = true;
  try {
    if (isLogin.value) {
      await authStore.login({
        username: form.account,
        password: form.password,
      });
    } else {
      await authStore.register({
        username: form.username,
        email: form.account,
        password: form.password,
      });
    }
    ElMessage.success(isLogin.value ? "登录成功" : "注册成功");
    await financeStore.initialize();
    await financeStore.loadTransactions();
    router.push("/dashboard");
  } catch (err: any) {
    console.error("Auth error:", err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.login-container::before {
  content: "";
  position: absolute;
  width: 600px;
  height: 600px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  top: -200px;
  right: -200px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  min-height: 480px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  padding: 40px;
  border-radius: 24px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.05),
    0 8px 10px -6px rgba(0, 0, 0, 0.05);
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  width: 64px;
  height: 64px;
  background: var(--primary);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
}

.login-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

.login-header p {
  color: var(--text-muted);
}

.login-form :deep(.el-input__wrapper) {
  padding: 8px 12px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.submit-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
  margin-top: 12px;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (max-width: 480px) {
  .login-card {
    padding: 24px;
    border-radius: 20px;
  }

  .login-header {
    margin-bottom: 24px;
  }

  .login-header h1 {
    font-size: 1.5rem;
  }

  .logo {
    width: 56px;
    height: 56px;
    margin-bottom: 12px;
  }

  .submit-btn {
    height: 44px;
    font-size: 0.95rem;
  }
}
</style>
