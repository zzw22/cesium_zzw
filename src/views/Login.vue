<template>
  <div class="login-page">
    <!-- Background Shapes -->
    <div class="login-bg">
      <div class="login-blob login-blob--1 animate-blob"></div>
      <div class="login-blob login-blob--2 animate-blob animation-delay-2000"></div>
      <div class="login-blob login-blob--3 animate-blob animation-delay-4000"></div>
    </div>

    <!-- Top Right Actions -->
    <div class="absolute top-4 right-4 z-20 flex items-center space-x-4">
      <el-switch
        v-model="isDark"
        inline-prompt
        :active-icon="Moon"
        :inactive-icon="Sunny"
        class="theme-switch"
      />
      <el-dropdown @command="toggleLanguage">
        <span
          class="login-action"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
            />
          </svg>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="zh">中文</el-dropdown-item>
            <el-dropdown-item command="en">English</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- Login Card -->
    <div class="login-card">
      <div class="login-card-header">
        <!-- Logo -->
        <div class="login-logo">
          <span class="login-logo-text">V</span>
        </div>
        <h1 class="login-title">
          {{ t("login.title") }}
        </h1>
      </div>

      <el-form
        :model="loginForm"
        :rules="rules"
        ref="loginFormRef"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            :placeholder="t('login.usernamePlaceholder')"
            size="large"
            class="custom-input"
          >
            <template #prefix>
              <el-icon class="text-gray-400"><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            :type="passwordVisible ? 'text' : 'password'"
            :placeholder="t('login.passwordPlaceholder')"
            size="large"
            class="custom-input"
          >
            <template #prefix>
              <el-icon class="text-gray-400"><Lock /></el-icon>
            </template>
            <template #suffix>
              <el-icon
                class="login-password-toggle"
                @click="passwordVisible = !passwordVisible"
              >
                <View v-if="passwordVisible" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="captcha">
          <div class="login-captcha-row">
            <el-input
              v-model="loginForm.captcha"
              :placeholder="t('login.captchaPlaceholder')"
              size="large"
              class="flex-1 custom-input"
            />
            <div
              class="login-captcha-box"
              @click="refreshCaptcha"
            >
              <span
                class="login-captcha-text"
                >{{ captchaExpression }}</span
              >
            </div>
          </div>
        </el-form-item>

        <el-button
          type="primary"
          class="login-submit"
          @click="handleLogin"
          :loading="loading"
        >
          {{ t("common.confirm") }}
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { User, Lock, View, Hide, Moon, Sunny } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { useDark } from "@vueuse/core";
import userInfoService from "@/api/userInfo_service.js";

const router = useRouter();
const { t, locale } = useI18n();
const isDark = useDark();

const loginFormRef = ref(null);
const loading = ref(false);
const passwordVisible = ref(false);
const captchaExpression = ref("");
const captchaResult = ref(0);

const loginForm = reactive({
  username: "",
  password:  "",
  captcha: "",
});

const toggleLanguage = (lang) => {
  locale.value = lang;
  localStorage.setItem("language", lang);
};

const rules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  captcha: [{ required: true, message: "请输入验证码", trigger: "blur" }],
};

const generateCaptcha = () => {
  const a = Math.floor(Math.random() * 10);
  const b = Math.floor(Math.random() * 10);
  const operator = Math.random() > 0.5 ? "+" : "+"; // Simplify to just + for now as in image

  captchaExpression.value = `${a} ${operator} ${b} = ?`;
  captchaResult.value = a + b;
};

const refreshCaptcha = () => {
  generateCaptcha();
  loginForm.captcha = "";
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate((valid) => {
    if (valid) {
      if (parseInt(loginForm.captcha) !== captchaResult.value) {
        ElMessage.error("验证码错误");
        refreshCaptcha();
        return;
      }

      loading.value = true;
      userInfoService
        .checkUserInfo({
          name: loginForm.username,
          password: loginForm.password,
        })
        .then((valid) => {
          loading.value = false;

          if (valid) {
            const token = "admin-token-" + Date.now();
            const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

            localStorage.setItem("token", token);
            localStorage.setItem("tokenExpiry", expiry);
            localStorage.setItem("username", loginForm.username);
            localStorage.setItem("role", loginForm.password);

            ElMessage.success("登录成功");
            router.push("/");
          }
        }).catch((error) => {
          loading.value = false;
          ElMessage.error(error);
          refreshCaptcha();
        });
    }
  });
};

onMounted(() => {
  generateCaptcha();
});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #f9fafb;
  transition: background-color 300ms;
}

.dark .login-page {
  background: #111827;
}

.login-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.login-blob {
  position: absolute;
  width: 70%;
  height: 70%;
  border-radius: 9999px;
  filter: blur(64px);
  opacity: 0.7;
}

.login-blob--1 {
  top: -20%;
  left: -10%;
  background: rgba(52, 211, 153, 0.3);
}

.login-blob--2 {
  top: 20%;
  right: -10%;
  background: rgba(134, 239, 172, 0.3);
}

.login-blob--3 {
  bottom: -20%;
  left: 20%;
  background: rgba(167, 243, 208, 0.3);
}

.login-action {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  color: #4b5563;
}

.login-action:hover {
  color: #111827;
}

.dark .login-action {
  color: #d1d5db;
}

.dark .login-action:hover {
  color: #ffffff;
}

.login-password-toggle {
  cursor: pointer;
  color: #9ca3af;
}

.login-password-toggle:hover {
  color: #4b5563;
}

.login-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 28rem;
  z-index: 10;
  position: relative;
  transition: background-color 300ms;
}

.dark .login-card {
  background: #1f2937;
}

.login-card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.login-logo {
  width: 4rem;
  height: 4rem;
  background: #10b981;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transform: rotate(45deg);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

.login-logo-text {
  color: #ffffff;
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: 700;
  transform: rotate(-45deg);
}

.login-title {
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: 0.025em;
}

.dark .login-title {
  color: #ffffff;
}

.login-form {
  display: flex;
  flex-direction: column;
  row-gap: 1.5rem;
}

.login-captcha-row {
  display: flex;
  column-gap: 1rem;
  align-items: center;
}

.login-captcha-box {
  width: 8rem;
  height: 2.5rem;
  background: #f9fafb;
  border-radius: 0.25rem;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
}

.dark .login-captcha-box {
  background: #374151;
  border-color: #4b5563;
}

.login-captcha-text {
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 700;
  color: #10b981;
  font-style: italic;
  letter-spacing: 0.05em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.login-submit {
  width: 100%;
  height: 3rem;
  font-size: 1.125rem;
  border-radius: 9999px;
  background: #10b981;
  border: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  transition: transform 300ms, background-color 300ms;
}

.login-submit:hover {
  background: #059669;
  transform: scale(1.02);
}

.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}

@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

:deep(.el-input__wrapper) {
  border-radius: 9999px; /* Rounded pill shape */
  padding-left: 1rem;
  padding-right: 1rem;
  box-shadow: 0 0 0 1px #e5e7eb inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #10b981 inset !important;
}

/* Customizing the switch to match typical dark mode toggle */
:deep(.el-switch__core) {
  border-color: #d1d5db;
}
</style>
