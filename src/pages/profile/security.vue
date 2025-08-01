<template>
  <view class="security-page">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <u-icon name="arrow-left" size="20" color="#333"></u-icon>
      </view>
      <view class="nav-title">账户安全</view>
      <view class="nav-right"></view>
    </view>

    <scroll-view scroll-y class="security-content">
      <!-- 安全评分 -->
      <view class="security-score">
        <view class="score-circle">
          <view class="score-value">{{ securityScore }}</view>
          <view class="score-label">安全评分</view>
        </view>
        <view class="score-desc">{{ securityScoreDesc }}</view>
      </view>

      <!-- 安全设置 -->
      <view class="security-section">
        <view class="section-title">身份验证</view>
        <view class="security-group">
          <view class="security-item" @click="setTradePassword">
            <view class="security-left">
              <u-icon name="lock-fill" size="20" color="#007AFF"></u-icon>
              <view class="security-info">
                <text class="security-text">交易密码</text>
                <text class="security-desc">用于交易确认和资金操作</text>
              </view>
            </view>
            <view class="security-right">
              <text class="security-status" :class="{ 'set': hasTradePassword }">
                {{ hasTradePassword ? '已设置' : '未设置' }}
              </text>
              <u-icon name="arrow-right" size="16" color="#999"></u-icon>
            </view>
          </view>
          
          <view class="security-item" @click="toggleFingerprint">
            <view class="security-left">
              <u-icon name="fingerprint" size="20" color="#007AFF"></u-icon>
              <view class="security-info">
                <text class="security-text">指纹验证</text>
                <text class="security-desc">使用指纹进行身份验证</text>
              </view>
            </view>
            <view class="security-right">
              <u-switch 
                v-model="fingerprintEnabled" 
                @change="handleFingerprintToggle"
              ></u-switch>
            </view>
          </view>
          
          <view class="security-item" @click="toggleFaceID">
            <view class="security-left">
              <u-icon name="face" size="20" color="#007AFF"></u-icon>
              <view class="security-info">
                <text class="security-text">面容ID</text>
                <text class="security-desc">使用面容进行身份验证</text>
              </view>
            </view>
            <view class="security-right">
              <u-switch 
                v-model="faceIDEnabled" 
                @change="handleFaceIDToggle"
              ></u-switch>
            </view>
          </view>
        </view>
      </view>

      <!-- 登录保护 -->
      <view class="security-section">
        <view class="section-title">登录保护</view>
        <view class="security-group">
          <view class="security-item">
            <view class="security-left">
              <u-icon name="shield" size="20" color="#07c160"></u-icon>
              <view class="security-info">
                <text class="security-text">登录验证</text>
                <text class="security-desc">异常登录时进行二次验证</text>
              </view>
            </view>
            <view class="security-right">
              <u-switch 
                v-model="loginVerification" 
                @change="updateSecuritySettings"
              ></u-switch>
            </view>
          </view>
          
          <view class="security-item">
            <view class="security-left">
              <u-icon name="map" size="20" color="#07c160"></u-icon>
              <view class="security-info">
                <text class="security-text">登录地点提醒</text>
                <text class="security-desc">在新地点登录时发送提醒</text>
              </view>
            </view>
            <view class="security-right">
              <u-switch 
                v-model="locationReminder" 
                @change="updateSecuritySettings"
              ></u-switch>
            </view>
          </view>
          
          <view class="security-item">
            <view class="security-left">
              <u-icon name="clock" size="20" color="#07c160"></u-icon>
              <view class="security-info">
                <text class="security-text">自动登录</text>
                <text class="security-desc">30天内无需重复登录</text>
              </view>
            </view>
            <view class="security-right">
              <u-switch 
                v-model="autoLogin" 
                @change="updateSecuritySettings"
              ></u-switch>
            </view>
          </view>
        </view>
      </view>

      <!-- 设备管理 -->
      <view class="security-section">
        <view class="section-title">设备管理</view>
        <view class="security-group">
          <view class="security-item" @click="goToDeviceManagement">
            <view class="security-left">
              <u-icon name="smartphone" size="20" color="#ff9500"></u-icon>
              <view class="security-info">
                <text class="security-text">已登录设备</text>
                <text class="security-desc">管理登录的设备列表</text>
              </view>
            </view>
            <view class="security-right">
              <text class="security-status">{{ deviceCount }}台</text>
              <u-icon name="arrow-right" size="16" color="#999"></u-icon>
            </view>
          </view>
          
          <view class="security-item" @click="goToLoginHistory">
            <view class="security-left">
              <u-icon name="list" size="20" color="#ff9500"></u-icon>
              <view class="security-info">
                <text class="security-text">登录历史</text>
                <text class="security-desc">查看最近登录记录</text>
              </view>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
        </view>
      </view>

      <!-- 安全检测 -->
      <view class="security-section">
        <view class="section-title">安全检测</view>
        <view class="security-group">
          <view class="security-item" @click="runSecurityCheck">
            <view class="security-left">
              <u-icon name="search" size="20" color="#ff3b30"></u-icon>
              <view class="security-info">
                <text class="security-text">安全检测</text>
                <text class="security-desc">检测账户安全隐患</text>
              </view>
            </view>
            <view class="security-right">
              <text v-if="lastCheckTime" class="security-status">{{ lastCheckTime }}</text>
              <u-icon name="arrow-right" size="16" color="#999"></u-icon>
            </view>
          </view>
          
          <view class="security-item" @click="goToSecurityLog">
            <view class="security-left">
              <u-icon name="file-text" size="20" color="#ff3b30"></u-icon>
              <view class="security-info">
                <text class="security-text">安全日志</text>
                <text class="security-desc">查看安全操作记录</text>
              </view>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
        </view>
      </view>

      <!-- 账户保护 -->
      <view class="security-section">
        <view class="section-title">账户保护</view>
        <view class="security-group">
          <view class="security-item">
            <view class="security-left">
              <u-icon name="alert-circle" size="20" color="#ff3b30"></u-icon>
              <view class="security-info">
                <text class="security-text">账户冻结保护</text>
                <text class="security-desc">异常操作时自动冻结账户</text>
              </view>
            </view>
            <view class="security-right">
              <u-switch 
                v-model="accountFreezeProtection" 
                @change="updateSecuritySettings"
              ></u-switch>
            </view>
          </view>
          
          <view class="security-item">
            <view class="security-left">
              <u-icon name="mail" size="20" color="#ff3b30"></u-icon>
              <view class="security-info">
                <text class="security-text">邮件提醒</text>
                <text class="security-desc">重要操作邮件通知</text>
              </view>
            </view>
            <view class="security-right">
              <u-switch 
                v-model="emailNotification" 
                @change="updateSecuritySettings"
              ></u-switch>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 指纹验证弹窗 -->
    <u-popup v-model="showFingerprintPopup" mode="center" border-radius="20">
      <view class="fingerprint-popup">
        <view class="popup-title">指纹验证</view>
        <view class="fingerprint-icon">
          <u-icon name="fingerprint" size="60" color="#007AFF"></u-icon>
        </view>
        <view class="popup-desc">请使用指纹进行验证</view>
        <view class="popup-actions">
          <u-button type="info" @click="cancelFingerprint">取消</u-button>
        </view>
      </view>
    </u-popup>

    <!-- 面容ID验证弹窗 -->
    <u-popup v-model="showFaceIDPopup" mode="center" border-radius="20">
      <view class="faceid-popup">
        <view class="popup-title">面容ID验证</view>
        <view class="faceid-icon">
          <u-icon name="face" size="60" color="#007AFF"></u-icon>
        </view>
        <view class="popup-desc">请使用面容ID进行验证</view>
        <view class="popup-actions">
          <u-button type="info" @click="cancelFaceID">取消</u-button>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userService } from '@/services/userService'
import { useAppStore } from '@/stores/useAppStore'

const appStore = useAppStore()

// 安全评分
const securityScore = ref(85)
const securityScoreDesc = ref('您的账户安全等级较高')

// 安全设置
const hasTradePassword = ref(false)
const fingerprintEnabled = ref(false)
const faceIDEnabled = ref(false)
const loginVerification = ref(true)
const locationReminder = ref(true)
const autoLogin = ref(false)
const accountFreezeProtection = ref(true)
const emailNotification = ref(true)

// 设备信息
const deviceCount = ref(1)
const lastCheckTime = ref('')

// 弹窗控制
const showFingerprintPopup = ref(false)
const showFaceIDPopup = ref(false)

// 页面加载
onMounted(async () => {
  await loadSecuritySettings()
})

// 加载安全设置
const loadSecuritySettings = async () => {
  try {
    const response = await userService.getUserSecuritySettings()
    const settings = response.data
    
    hasTradePassword.value = settings.hasTradePassword || false
    fingerprintEnabled.value = settings.fingerprintEnabled || false
    faceIDEnabled.value = settings.faceIDEnabled || false
    loginVerification.value = settings.loginVerification !== false
    locationReminder.value = settings.locationReminder !== false
    autoLogin.value = settings.autoLogin || false
    accountFreezeProtection.value = settings.accountFreezeProtection !== false
    emailNotification.value = settings.emailNotification !== false
    
    deviceCount.value = settings.deviceCount || 1
    lastCheckTime.value = settings.lastCheckTime || ''
    
    // 计算安全评分
    calculateSecurityScore()
  } catch (error) {
    console.error('加载安全设置失败:', error)
  }
}

// 计算安全评分
const calculateSecurityScore = () => {
  let score = 0
  
  if (hasTradePassword.value) score += 25
  if (fingerprintEnabled.value) score += 15
  if (faceIDEnabled.value) score += 15
  if (loginVerification.value) score += 15
  if (locationReminder.value) score += 10
  if (accountFreezeProtection.value) score += 10
  if (emailNotification.value) score += 10
  
  securityScore.value = score
  
  if (score >= 90) {
    securityScoreDesc.value = '您的账户安全等级极高'
  } else if (score >= 70) {
    securityScoreDesc.value = '您的账户安全等级较高'
  } else if (score >= 50) {
    securityScoreDesc.value = '您的账户安全等级一般'
  } else {
    securityScoreDesc.value = '您的账户安全等级较低，建议加强保护'
  }
}

// 设置交易密码
const setTradePassword = () => {
  uni.navigateTo({
    url: '/pages/profile/set-trade-password'
  })
}

// 切换指纹验证
const toggleFingerprint = () => {
  if (!fingerprintEnabled.value) {
    // 检查设备是否支持指纹
    checkFingerprintSupport()
  } else {
    // 关闭指纹验证
    updateSecuritySettings()
  }
}

// 检查指纹支持
const checkFingerprintSupport = () => {
  // #ifdef APP-PLUS
  if (plus.fingerprint) {
    plus.fingerprint.authenticate(() => {
      // 指纹验证成功
      showFingerprintPopup.value = false
      fingerprintEnabled.value = true
      updateSecuritySettings()
      appStore.showSuccess('指纹验证已开启')
    }, (error: any) => {
      console.error('指纹验证失败:', error)
      appStore.showError('指纹验证失败')
    }, {
      message: '请验证指纹以开启功能'
    })
  } else {
    appStore.showError('设备不支持指纹验证')
  }
  // #endif
}

// 取消指纹验证
const cancelFingerprint = () => {
  showFingerprintPopup.value = false
  fingerprintEnabled.value = false
}

// 切换面容ID
const toggleFaceID = () => {
  if (!faceIDEnabled.value) {
    // 检查设备是否支持面容ID
    checkFaceIDSupport()
  } else {
    // 关闭面容ID
    updateSecuritySettings()
  }
}

// 检查面容ID支持
const checkFaceIDSupport = () => {
  // #ifdef APP-PLUS
  if (plus.fingerprint) {
    plus.fingerprint.authenticate(() => {
      // 面容ID验证成功
      showFaceIDPopup.value = false
      faceIDEnabled.value = true
      updateSecuritySettings()
      appStore.showSuccess('面容ID验证已开启')
    }, (error: any) => {
      console.error('面容ID验证失败:', error)
      appStore.showError('面容ID验证失败')
    }, {
      message: '请验证面容ID以开启功能'
    })
  } else {
    appStore.showError('设备不支持面容ID验证')
  }
  // #endif
}

// 取消面容ID验证
const cancelFaceID = () => {
  showFaceIDPopup.value = false
  faceIDEnabled.value = false
}

// 处理指纹开关
const handleFingerprintToggle = (value: boolean) => {
  if (value) {
    showFingerprintPopup.value = true
  } else {
    updateSecuritySettings()
  }
}

// 处理面容ID开关
const handleFaceIDToggle = (value: boolean) => {
  if (value) {
    showFaceIDPopup.value = true
  } else {
    updateSecuritySettings()
  }
}

// 更新安全设置
const updateSecuritySettings = async () => {
  try {
    await userService.updateSecuritySettings({
      fingerprintEnabled: fingerprintEnabled.value,
      faceIDEnabled: faceIDEnabled.value,
      loginVerification: loginVerification.value,
      locationReminder: locationReminder.value,
      autoLogin: autoLogin.value,
      accountFreezeProtection: accountFreezeProtection.value,
      emailNotification: emailNotification.value
    })
    
    calculateSecurityScore()
    appStore.showSuccess('安全设置已更新')
  } catch (error) {
    console.error('更新安全设置失败:', error)
    appStore.showError('更新安全设置失败')
  }
}

// 设备管理
const goToDeviceManagement = () => {
  uni.navigateTo({
    url: '/pages/profile/device-management'
  })
}

// 登录历史
const goToLoginHistory = () => {
  uni.navigateTo({
    url: '/pages/profile/login-history'
  })
}

// 安全检测
const runSecurityCheck = async () => {
  try {
    appStore.showLoading('正在检测...')
    
    const response = await userService.runSecurityCheck()
    const results = response.data
    
    let message = '安全检测完成\n\n'
    
    if (results.tradePassword) {
      message += '✓ 交易密码已设置\n'
    } else {
      message += '✗ 交易密码未设置\n'
    }
    
    if (results.fingerprint) {
      message += '✓ 指纹验证已开启\n'
    } else {
      message += '✗ 指纹验证未开启\n'
    }
    
    if (results.deviceCount > 1) {
      message += `⚠ 当前有${results.deviceCount}台设备登录\n`
    }
    
    lastCheckTime.value = new Date().toLocaleString()
    
    uni.showModal({
      title: '安全检测结果',
      content: message,
      showCancel: false
    })
    
  } catch (error) {
    console.error('安全检测失败:', error)
    appStore.showError('安全检测失败')
  } finally {
    appStore.hideLoading()
  }
}

// 安全日志
const goToSecurityLog = () => {
  uni.navigateTo({
    url: '/pages/profile/security-log'
  })
}

// 返回
const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.security-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
  
  .nav-left, .nav-right {
    width: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .nav-title {
    font-size: 32rpx;
    font-weight: 500;
    color: #333;
  }
}

.security-content {
  flex: 1;
  padding: 16rpx;
}

.security-score {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 48rpx;
  margin-bottom: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .score-circle {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #007AFF, #00c6ff);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
    
    .score-value {
      font-size: 36rpx;
      font-weight: bold;
      color: #fff;
    }
    
    .score-label {
      font-size: 20rpx;
      color: rgba(255, 255, 255, 0.8);
    }
  }
  
  .score-desc {
    font-size: 28rpx;
    color: #666;
    text-align: center;
  }
}

.security-section {
  margin-bottom: 32rpx;
  
  .section-title {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 16rpx;
    padding: 0 16rpx;
  }
  
  .security-group {
    background-color: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    
    .security-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 32rpx 24rpx;
      border-bottom: 1rpx solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      .security-left {
        display: flex;
        align-items: center;
        
        .security-info {
          margin-left: 16rpx;
          
          .security-text {
            font-size: 28rpx;
            font-weight: 500;
            color: #333;
            margin-bottom: 4rpx;
          }
          
          .security-desc {
            font-size: 24rpx;
            color: #999;
          }
        }
      }
      
      .security-right {
        display: flex;
        align-items: center;
        
        .security-status {
          font-size: 24rpx;
          color: #999;
          margin-right: 8rpx;
          
          &.set {
            color: #07c160;
          }
        }
      }
    }
  }
}

.fingerprint-popup, .faceid-popup {
  padding: 48rpx;
  width: 500rpx;
  
  .popup-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    text-align: center;
    margin-bottom: 32rpx;
  }
  
  .fingerprint-icon, .faceid-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 24rpx;
  }
  
  .popup-desc {
    font-size: 28rpx;
    color: #666;
    text-align: center;
    margin-bottom: 32rpx;
  }
  
  .popup-actions {
    display: flex;
    justify-content: center;
  }
}
</style>