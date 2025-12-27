<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- Background Shapes -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
      <div class="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-emerald-400/30 blur-3xl filter opacity-70 animate-blob"></div>
      <div class="absolute top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-green-300/30 blur-3xl filter opacity-70 animate-blob animation-delay-2000"></div>
      <div class="absolute -bottom-[20%] left-[20%] w-[70%] h-[70%] rounded-full bg-emerald-200/30 blur-3xl filter opacity-70 animate-blob animation-delay-4000"></div>
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
        <span class="cursor-pointer flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
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
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md z-10 relative transition-colors duration-300">
      <div class="flex flex-col items-center mb-8">
        <!-- Logo -->
        <div class="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 transform rotate-45 shadow-lg">
          <span class="text-white text-3xl font-bold transform -rotate-45">V</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white tracking-wide">{{ t('login.title') }}</h1>
      </div>

      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" class="space-y-6">
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
                class="cursor-pointer text-gray-400 hover:text-gray-600" 
                @click="passwordVisible = !passwordVisible"
              >
                <View v-if="passwordVisible" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="captcha">
          <div class="flex space-x-4">
            <el-input 
              v-model="loginForm.captcha" 
              :placeholder="t('login.captchaPlaceholder')" 
              size="large"
              class="flex-1 custom-input"
            />
            <div class="w-32 h-10 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center cursor-pointer select-none" @click="refreshCaptcha">
              <span class="text-lg font-bold text-emerald-500 italic tracking-wider font-mono">{{ captchaExpression }}</span>
            </div>
          </div>
        </el-form-item>

        <el-button 
          type="primary" 
          class="w-full !h-12 !text-lg !rounded-full !bg-emerald-500 hover:!bg-emerald-600 border-none shadow-md transition-all duration-300 transform hover:scale-[1.02]" 
          @click="handleLogin"
          :loading="loading"
        >
          {{ t('common.confirm') }}
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, View, Hide, Moon, Sunny } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useDark } from '@vueuse/core'

const router = useRouter()
const { t, locale } = useI18n()
const isDark = useDark()

const loginFormRef = ref(null)
const loading = ref(false)
const passwordVisible = ref(false)
const captchaExpression = ref('')
const captchaResult = ref(0)

const loginForm = reactive({
  username: 'admin',
  password: 'admin123456',
  captcha: ''
})

const toggleLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('language', lang)
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

const generateCaptcha = () => {
  const a = Math.floor(Math.random() * 10)
  const b = Math.floor(Math.random() * 10)
  const operator = Math.random() > 0.5 ? '+' : '+' // Simplify to just + for now as in image
  
  captchaExpression.value = `${a} ${operator} ${b} = ?`
  captchaResult.value = a + b
}

const refreshCaptcha = () => {
  generateCaptcha()
  loginForm.captcha = ''
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate((valid) => {
    if (valid) {
      if (parseInt(loginForm.captcha) !== captchaResult.value) {
        ElMessage.error('验证码错误')
        refreshCaptcha()
        return
      }

      loading.value = true
      setTimeout(() => {
        loading.value = false
        
        if (loginForm.username === 'admin' && loginForm.password === 'admin123456') {
          const token = 'admin-token-' + Date.now()
          const expiry = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
          
          localStorage.setItem('token', token)
          localStorage.setItem('tokenExpiry', expiry)
          
          ElMessage.success('登录成功')
          router.push('/')
        } else {
          ElMessage.error('用户名或密码错误')
          refreshCaptcha()
        }
      }, 1000)
    }
  })
}

onMounted(() => {
  generateCaptcha()
})
</script>

<style scoped>
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
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
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
