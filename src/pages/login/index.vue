<template>
  <view class="login-container">
    <!-- 登录卡片 -->
    <view class="login-card">
      <!-- Logo区域 -->
      <view class="login-header">
        <image 
          src="/static/logo.png" 
          class="login-logo" 
          mode="aspectFit"
        />
        <text class="login-title">股票交易</text>
        <text class="login-subtitle">专业证券交易平台</text>
      </view>

      <!-- 登录方式切换 -->
      <view class="login-type-switch">
        <view 
          v-for="type in loginTypes" 
          :key="type.value"
          class="login-type-item"
          :class="{ active: currentLoginType === type.value }"
          @tap="switchLoginType(type.value as 'username' | 'phone')"
        >
          {{ type.label }}
        </view>
      </view>

      <!-- 登录表单 -->
      <view class="login-form">
        <!-- 用户名登录 -->
        <view v-if="currentLoginType === 'username'" class="form-section">
          <view class="form-group">
            <view class="input-group">
              <uni-icons type="person" size="20" color="#666"></uni-icons>
              <input
                v-model="form.username"
                type="text"
                placeholder="请输入用户名"
                class="form-input"
                :class="{ error: validation.username }"
                @input="validateField('username')"
                @keypress="handleKeyPress"
              />
            </view>
            <text v-if="validation.username" class="form-error">
              {{ validationMessages.username }}
            </text>
          </view>

          <view class="form-group">
            <view class="input-group">
              <uni-icons type="locked" size="20" color="#666"></uni-icons>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="form-input"
                :class="{ error: validation.password }"
                @input="validateField('password')"
                @keypress="handleKeyPress"
              />
              <uni-icons 
                :type="showPassword ? 'eye' : 'eye-slash'" 
                size="20" 
                color="#666"
                @tap="togglePassword"
              ></uni-icons>
            </view>
            <text v-if="validation.password" class="form-error">
              {{ validationMessages.password }}
            </text>
          </view>

          <view class="form-group">
            <view class="input-group captcha-group">
              <input
                v-model="form.captcha"
                type="text"
                placeholder="请输入验证码"
                class="form-input captcha-input"
                :class="{ error: validation.captcha }"
                @input="validateField('captcha')"
                @keypress="handleKeyPress"
              />
              <image 
                :src="captchaImage" 
                class="captcha-image"
                @tap="refreshCaptcha"
              />
              <uni-icons 
                type="refresh" 
                size="20" 
                color="#666"
                @tap="refreshCaptcha"
              ></uni-icons>
            </view>
            <text v-if="validation.captcha" class="form-error">
              {{ validationMessages.captcha }}
            </text>
          </view>
        </view>

        <!-- 手机号登录 -->
        <view v-if="currentLoginType === 'phone'" class="form-section">
          <view class="form-group">
            <view class="input-group">
              <uni-icons type="phone" size="20" color="#666"></uni-icons>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="请输入手机号"
                class="form-input"
                :class="{ error: validation.phone }"
                @input="validateField('phone')"
                @keypress="handleKeyPress"
              />
            </view>
            <text v-if="validation.phone" class="form-error">
              {{ validationMessages.phone }}
            </text>
          </view>

          <view class="form-group">
            <view class="input-group captcha-group">
              <input
                v-model="form.smsCode"
                type="text"
                placeholder="请输入验证码"
                class="form-input captcha-input"
                :class="{ error: validation.smsCode }"
                @input="validateField('smsCode')"
                @keypress="handleKeyPress"
              />
              <button
                class="sms-code-btn"
                :class="{ disabled: smsCountdown > 0 }"
                :disabled="smsCountdown > 0 || !isPhoneValid"
                @tap="sendSmsCode"
              >
                {{ smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码' }}
              </button>
            </view>
            <text v-if="validation.smsCode" class="form-error">
              {{ validationMessages.smsCode }}
            </text>
          </view>
        </view>

        <!-- 选项区域 -->
        <view class="options-section">
          <label class="checkbox-item">
            <checkbox 
              v-model="rememberPassword" 
              color="#1890ff"
            />
            <text>记住密码</text>
          </label>
          <label class="checkbox-item">
            <checkbox 
              v-model="autoLogin" 
              color="#1890ff"
            />
            <text>自动登录</text>
          </label>
        </view>

        <!-- 登录按钮 -->
        <button
          class="login-btn"
          :class="{ disabled: !isFormValid || loading }"
          :disabled="!isFormValid || loading"
          @tap="handleLogin"
        >
          <text v-if="!loading">登录</text>
          <view v-else class="loading-spinner">
            <view class="spinner"></view>
          </view>
        </button>

        <!-- 辅助链接 -->
        <view class="helper-links">
          <text class="link-item" @tap="goToForgotPassword">忘记密码？</text>
          <text class="link-item" @tap="goToRegister">新用户注册</text>
        </view>

        <!-- 其他登录方式 -->
        <view class="other-login">
          <view class="divider">
            <text class="divider-text">其他登录方式</text>
          </view>
          <view class="social-login">
            <view class="social-item" @tap="wechatLogin">
              <uni-icons type="weixin" size="24" color="#07c160"></uni-icons>
              <text>微信</text>
            </view>
            <view class="social-item" @tap="alipayLogin">
              <uni-icons type="checkmarkempty" size="24" color="#1677ff"></uni-icons>
              <text>支付宝</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 错误提示 -->
    <view v-if="error" class="error-toast" :class="{ shake: errorShake }">
      <uni-icons type="closeempty" size="16" color="#ff4d4f"></uni-icons>
      <text>{{ error }}</text>
    </view>

    <!-- Loading组件 -->
    <Loading :visible="loading" text="登录中..." />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/useUserStore'
import { userService } from '@/services/userService'
import { storage } from '@/utils/storage'
import { router } from '@/utils/router'
import Loading from '@/components/common/Loading.vue'

// 用户状态管理
const userStore = useUserStore()

// 登录方式配置
const loginTypes = [
  { label: '用户名登录', value: 'username' },
  { label: '手机号登录', value: 'phone' }
]

// 响应式数据
const currentLoginType = ref<'username' | 'phone'>('username')
const showPassword = ref(false)
const rememberPassword = ref(false)
const autoLogin = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const errorShake = ref(false)
const captchaImage = ref('')
const captchaKey = ref('')
const smsCountdown = ref(0)
let smsTimer: any = null

// 表单数据
const form = reactive({
  username: '',
  password: '',
  phone: '',
  captcha: '',
  smsCode: ''
})

// 表单验证状态
const validation = reactive({
  username: false,
  password: false,
  phone: false,
  captcha: false,
  smsCode: false
})

// 验证规则
const validationRules = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: '用户名必须是3-20位字母、数字或下划线'
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 20,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,20}$/,
    message: '密码必须包含大小写字母和数字，长度6-20位'
  },
  phone: {
    required: true,
    pattern: /^1[3-9]\d{9}$/,
    message: '请输入正确的手机号码'
  },
  captcha: {
    required: true,
    length: 4,
    pattern: /^[A-Za-z0-9]{4}$/,
    message: '请输入4位验证码'
  },
  smsCode: {
    required: true,
    length: 6,
    pattern: /^\d{6}$/,
    message: '请输入6位数字验证码'
  }
}

// 计算属性
const isFormValid = computed(() => {
  if (currentLoginType.value === 'username') {
    return form.username && form.password && form.captcha && 
           !validation.username && !validation.password && !validation.captcha
  } else {
    return form.phone && form.smsCode && 
           !validation.phone && !validation.smsCode
  }
})

const isPhoneValid = computed(() => {
  return validationRules.phone.pattern.test(form.phone)
})

const validationMessages = computed(() => {
  const messages: Record<string, string> = {}
  Object.keys(validationRules).forEach(key => {
    if (validation[key as keyof typeof validation]) {
      messages[key] = validationRules[key as keyof typeof validationRules].message
    }
  })
  return messages
})

// 初始化
onMounted(async () => {
  // 检查是否已登录
  if (userStore.isLoggedIn) {
    router.replaceTab('/pages/index/index')
    return
  }

  // 加载保存的登录信息
  loadSavedCredentials()

  // 获取验证码
  await refreshCaptcha()

  // 监听键盘事件
  document.addEventListener('keypress', handleKeyPress)
})

onUnmounted(() => {
  // 清理定时器
  if (smsTimer) {
    clearInterval(smsTimer)
  }
  
  // 移除事件监听
  document.removeEventListener('keypress', handleKeyPress)
})

// 加载保存的登录信息
const loadSavedCredentials = () => {
  const saved = storage.get('login_credentials')
  if (saved) {
    form.username = saved.username
    rememberPassword.value = true
    autoLogin.value = saved.autoLogin || false
    
    if (autoLogin.value) {
      // 自动登录
      setTimeout(() => {
        handleLogin()
      }, 500)
    }
  }
}

// 保存登录信息
const saveCredentials = () => {
  if (rememberPassword.value) {
    storage.set('login_credentials', {
      username: form.username,
      password: form.password,
      autoLogin: autoLogin.value,
      timestamp: Date.now()
    })
  } else {
    storage.remove('login_credentials')
  }
}

// 切换登录方式
const switchLoginType = (type: 'username' | 'phone') => {
  currentLoginType.value = type
  clearError()
  
  // 清空表单
  if (type === 'username') {
    form.phone = ''
    form.smsCode = ''
  } else {
    form.username = ''
    form.password = ''
    form.captcha = ''
  }
}

// 切换密码显示
const togglePassword = () => {
  showPassword.value = !showPassword.value
}

// 验证字段
const validateField = (field: string) => {
  const value = form[field as keyof typeof form]
  const rule = validationRules[field as keyof typeof validationRules]
  
  if (!rule) return
  
  // 清除之前的错误
  validation[field as keyof typeof validation] = false
  
  // 必填验证
  if (rule.required && !value.trim()) {
    validation[field as keyof typeof validation] = true
    return
  }
  
  // 长度验证
  if ('minLength' in rule && rule.minLength && value.length < rule.minLength) {
    validation[field as keyof typeof validation] = true
    return
  }
  
  if ('maxLength' in rule && rule.maxLength && value.length > rule.maxLength) {
    validation[field as keyof typeof validation] = true
    return
  }
  
  // 格式验证
  if (rule.pattern && !rule.pattern.test(value)) {
    validation[field as keyof typeof validation] = true
    return
  }
}

// 刷新验证码
const refreshCaptcha = async () => {
  try {
    const response = await userService.getCaptcha()
    captchaImage.value = response.data.image
    captchaKey.value = response.data.key
    form.captcha = ''
    validation.captcha = false
  } catch (err) {
    showError('获取验证码失败')
  }
}

// 发送短信验证码
const sendSmsCode = async () => {
  if (!isPhoneValid.value || smsCountdown.value > 0) return
  
  try {
    loading.value = true
    await userService.sendPhoneCaptcha(form.phone, 'login')
    
    // 开始倒计时
    smsCountdown.value = 60
    smsTimer = setInterval(() => {
      smsCountdown.value--
      if (smsCountdown.value <= 0) {
        clearInterval(smsTimer)
      }
    }, 1000)
    
    clearError()
  } catch (err) {
    showError('发送验证码失败')
  } finally {
    loading.value = false
  }
}

// 处理登录
const handleLogin = async () => {
  if (!isFormValid.value || loading.value) return
  
  try {
    loading.value = true
    clearError()
    
    let response
    if (currentLoginType.value === 'username') {
      response = await userStore.login(
        form.username, 
        form.password, 
        form.captcha
      )
    } else {
      response = await userStore.loginByPhone(
        form.phone, 
        form.smsCode
      )
    }
    
    // 保存登录信息
    saveCredentials()
    
    // 登录成功，跳转到首页
    setTimeout(() => {
      router.replaceTab('/pages/index/index')
    }, 500)
    
  } catch (err: any) {
    showError(err.message || '登录失败')
    
    // 刷新验证码
    if (currentLoginType.value === 'username') {
      await refreshCaptcha()
    }
  } finally {
    loading.value = false
  }
}

// 显示错误信息
const showError = (message: string) => {
  error.value = message
  errorShake.value = true
  setTimeout(() => {
    errorShake.value = false
  }, 500)
}

// 清除错误信息
const clearError = () => {
  error.value = null
}

// 键盘事件处理
const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && isFormValid.value) {
    handleLogin()
  }
}

// 页面跳转
const goToForgotPassword = () => {
  router.navigateTo('/pages/forgot-password/index')
}

const goToRegister = () => {
  router.navigateTo('/pages/register/index')
}

// 第三方登录
const wechatLogin = () => {
  // 微信登录逻辑
  console.log('微信登录')
}

const alipayLogin = () => {
  // 支付宝登录逻辑
  console.log('支付宝登录')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
}

.login-card {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.login-title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.login-subtitle {
  display: block;
  font-size: 14px;
  color: #666;
}

.login-type-switch {
  display: flex;
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 4px;
  margin-bottom: 24px;
}

.login-type-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  border-radius: 4px;
  color: #666;
  font-size: 14px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.login-type-item.active {
  background-color: #1890ff;
  color: #ffffff;
  font-weight: 500;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background-color: #ffffff;
  transition: all 0.2s ease;
}

.input-group:focus-within {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.input-group.error {
  border-color: #ff4d4f;
}

.form-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #333;
  margin-left: 12px;
  background: transparent;
}

.form-input::placeholder {
  color: #999;
}

.form-input.error {
  color: #ff4d4f;
}

.captcha-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 80px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
}

.sms-code-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #1890ff;
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.sms-code-btn:hover {
  background: #40a9ff;
}

.sms-code-btn.disabled {
  background: #d9d9d9;
  color: #999;
  cursor: not-allowed;
}

.form-error {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}

.options-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
  cursor: pointer;
}

.checkbox-item text {
  margin-left: 4px;
}

.login-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 6px;
  background: #1890ff;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.login-btn:hover {
  background: #40a9ff;
}

.login-btn:active {
  opacity: 0.8;
}

.login-btn.disabled {
  background: #d9d9d9;
  color: #999;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  margin: 0 auto;
}

.spinner {
  width: 100%;
  height: 100%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.helper-links {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.link-item {
  color: #1890ff;
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
}

.link-item:hover {
  text-decoration: underline;
}

.other-login {
  margin-top: 16px;
}

.divider {
  text-align: center;
  margin-bottom: 16px;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #f0f0f0;
}

.divider-text {
  background: #ffffff;
  padding: 0 12px;
  font-size: 12px;
  color: #999;
  position: relative;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.social-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.social-item:hover {
  color: #1890ff;
}

.social-item:active {
  opacity: 0.7;
}

.error-toast {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  animation: slideDown 0.3s ease;
}

.error-toast.shake {
  animation: shake 0.5s ease;
}

@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(-50%) translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-50%) translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(-50%) translateX(5px); }
}
</style>