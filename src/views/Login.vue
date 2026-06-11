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
          <el-input v-model="form.name" placeholder="用户名">
            <template #prefix>
              <lucide-icon name="User" :size="16" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-input v-model="form.email" placeholder="邮箱地址">
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

        <div v-if="isLogin" class="form-options">
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          <el-button link class="forgot-pwd" @click="handleForgotPassword">
            忘记密码？
          </el-button>
        </div>

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

    <!-- Forgot Password Dialog -->
    <el-dialog
      v-model="forgotPwdVisible"
      title="重置密码"
      :width="dialogWidth"
      center
      class="forgot-dialog"
    >
      <div class="forgot-content">
        <lucide-icon name="MailCheck" :size="48" color="#6366f1" class="mb-4" />
        <p>请输入您的注册邮箱，我们将向您发送重置链接。</p>
        <el-input
          v-model="forgotEmail"
          placeholder="example@mail.com"
          class="mt-4"
        >
          <template #prefix>
            <lucide-icon name="Mail" :size="16" />
          </template>
        </el-input>
      </div>
      <template #footer>
        <el-button @click="forgotPwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetLoading" @click="submitReset">
          发送重置邮件
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import LucideIcon from "../components/LucideIcon.vue";
import { ElMessage, ElMessageBox } from "element-plus";

const router = useRouter();
const isLogin = ref(true);
const loading = ref(false);
const rememberMe = ref(false);

const forgotPwdVisible = ref(false);
const forgotEmail = ref("");
const resetLoading = ref(false);
const dialogWidth = ref("400px");

const updateWidth = () => {
  dialogWidth.value = window.innerWidth < 480 ? "90%" : "400px";
};

window.addEventListener("resize", updateWidth);
setTimeout(updateWidth, 0);

const form = reactive({
  name: "",
  email: "demo@example.com",
  password: "password",
});

const handleAuth = () => {
  // Validate basic fields
  if (!form.email || !form.password) {
    ElMessage.warning("请输入邮箱和密码");
    return;
  }

  // Validate username specifically for registration
  if (!isLogin.value && !form.name.trim()) {
    ElMessage.warning("请输入用户名以完成注册");
    return;
  }

  loading.value = true;
  // Mock login/register
  setTimeout(() => {
    const user = {
      name: isLogin.value ? form.name || "Demo User" : form.name,
      email: form.email,
    };
    localStorage.setItem("totoro_user", JSON.stringify(user));
    loading.value = false;
    ElMessage.success(isLogin.value ? "登录成功" : "注册成功");
    router.push("/dashboard");
  }, 1000);
};

const handleForgotPassword = () => {
  forgotPwdVisible.value = true;
  forgotEmail.value = form.email;
};

const submitReset = () => {
  if (!forgotEmail.value) {
    ElMessage.warning("请输入邮箱地址");
    return;
  }

  resetLoading.value = true;
  setTimeout(() => {
    resetLoading.value = false;
    forgotPwdVisible.value = false;
    ElMessageBox.alert(
      "重置密码链接已发送至您的邮箱，请检查收件箱（包括垃圾邮件）。",
      "发送成功",
      { confirmButtonText: "我知道了" },
    );
  }, 1500);
};
</script>

<style scoped>
/* Previous styles... */
.forgot-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px 0;
}

.mb-4 {
  margin-bottom: 16px;
}
.mt-4 {
  margin-top: 16px;
}

.forgot-dialog :deep(.el-dialog) {
  border-radius: 20px;
}

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
  min-height: 560px;
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

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.forgot-pwd {
  font-size: 0.85rem;
  color: var(--primary);
}
</style>

<style scoped>
/* Responsive Adjustments */
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

  :deep(.el-dialog) {
    --el-dialog-width: 90%;
  }
}
</style>
