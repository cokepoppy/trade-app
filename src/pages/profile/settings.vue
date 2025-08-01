<template>
  <view class="settings-page">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <u-icon name="arrow-left" size="20" color="#333"></u-icon>
      </view>
      <view class="nav-title">设置</view>
      <view class="nav-right"></view>
    </view>

    <scroll-view scroll-y class="settings-content">
      <!-- 账户设置 -->
      <view class="settings-section">
        <view class="section-title">账户设置</view>
        <view class="settings-group">
          <view class="setting-item" @click="editProfile">
            <view class="setting-left">
              <u-icon name="account" size="20" color="#007AFF"></u-icon>
              <text class="setting-text">个人资料</text>
            </view>
            <view class="setting-right">
              <text class="setting-value">{{ userInfo.nickname || '未设置' }}</text>
              <u-icon name="arrow-right" size="16" color="#999"></u-icon>
            </view>
          </view>
          
          <view class="setting-item" @click="changePassword">
            <view class="setting-left">
              <u-icon name="lock" size="20" color="#007AFF"></u-icon>
              <text class="setting-text">修改密码</text>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
          
          <view class="setting-item" @click="setTradePassword">
            <view class="setting-left">
              <u-icon name="lock-fill" size="20" color="#007AFF"></u-icon>
              <text class="setting-text">交易密码</text>
            </view>
            <view class="setting-right">
              <text class="setting-value">{{ hasTradePassword ? '已设置' : '未设置' }}</text>
              <u-icon name="arrow-right" size="16" color="#999"></u-icon>
            </view>
          </view>
          
          <view class="setting-item" @click="bindPhone">
            <view class="setting-left">
              <u-icon name="phone" size="20" color="#007AFF"></u-icon>
              <text class="setting-text">手机绑定</text>
            </view>
            <view class="setting-right">
              <text class="setting-value">{{ userInfo.phone ? '已绑定' : '未绑定' }}</text>
              <u-icon name="arrow-right" size="16" color="#999"></u-icon>
            </view>
          </view>
          
          <view class="setting-item" @click="bindEmail">
            <view class="setting-left">
              <u-icon name="email" size="20" color="#007AFF"></u-icon>
              <text class="setting-text">邮箱绑定</text>
            </view>
            <view class="setting-right">
              <text class="setting-value">{{ userInfo.email ? '已绑定' : '未绑定' }}</text>
              <u-icon name="arrow-right" size="16" color="#999"></u-icon>
            </view>
          </view>
        </view>
      </view>

      <!-- 推送设置 -->
      <view class="settings-section">
        <view class="section-title">推送设置</view>
        <view class="settings-group">
          <view class="setting-item">
            <view class="setting-left">
              <u-icon name="bell" size="20" color="#ff9500"></u-icon>
              <text class="setting-text">推送通知</text>
            </view>
            <u-switch 
              v-model="pushSettings.enabled" 
              @change="updatePushSettings"
            ></u-switch>
          </view>
          
          <view class="setting-item">
            <view class="setting-left">
              <u-icon name="volume-up" size="20" color="#ff9500"></u-icon>
              <text class="setting-text">声音提醒</text>
            </view>
            <u-switch 
              v-model="pushSettings.sound" 
              @change="updatePushSettings"
            ></u-switch>
          </view>
          
          <view class="setting-item">
            <view class="setting-left">
              <u-icon name="vibrate" size="20" color="#ff9500"></u-icon>
              <text class="setting-text">震动提醒</text>
            </view>
            <u-switch 
              v-model="pushSettings.vibration" 
              @change="updatePushSettings"
            ></u-switch>
          </view>
          
          <view class="setting-item" @click="goToNotificationSettings">
            <view class="setting-left">
              <u-icon name="setting-fill" size="20" color="#ff9500"></u-icon>
              <text class="setting-text">通知详情设置</text>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
        </view>
      </view>

      <!-- 显示设置 -->
      <view class="settings-section">
        <view class="section-title">显示设置</view>
        <view class="settings-group">
          <view class="setting-item" @click="changeTheme">
            <view class="setting-left">
              <u-icon name="color-lens" size="20" color="#666"></u-icon>
              <text class="setting-text">主题设置</text>
            </view>
            <view class="setting-right">
              <text class="setting-value">{{ currentTheme }}</text>
              <u-icon name="arrow-right" size="16" color="#999"></u-icon>
            </view>
          </view>
          
          <view class="setting-item" @click="changeLanguage">
            <view class="setting-left">
              <u-icon name="translate" size="20" color="#666"></u-icon>
              <text class="setting-text">语言设置</text>
            </view>
            <view class="setting-right">
              <text class="setting-value">{{ currentLanguage }}</text>
              <u-icon name="arrow-right" size="16" color="#999"></u-icon>
            </view>
          </view>
          
          <view class="setting-item">
            <view class="setting-left">
              <u-icon name="eye" size="20" color="#666"></u-icon>
              <text class="setting-text">隐藏资产</text>
            </view>
            <u-switch 
              v-model="displaySettings.hideAsset" 
              @change="updateDisplaySettings"
            ></u-switch>
          </view>
          
          <view class="setting-item">
            <view class="setting-left">
              <u-icon name="photo" size="20" color="#666"></u-icon>
              <text class="setting-text">无图模式</text>
            </view>
            <u-switch 
              v-model="displaySettings.noImageMode" 
              @change="updateDisplaySettings"
            ></u-switch>
          </view>
        </view>
      </view>

      <!-- 交易设置 -->
      <view class="settings-section">
        <view class="section-title">交易设置</view>
        <view class="settings-group">
          <view class="setting-item">
            <view class="setting-left">
              <u-icon name="checkbox-mark" size="20" color="#07c160"></u-icon>
              <text class="setting-text">交易确认</text>
            </view>
            <u-switch 
              v-model="tradingSettings.confirmTrade" 
              @change="updateTradingSettings"
            ></u-switch>
          </view>
          
          <view class="setting-item">
            <view class="setting-left">
              <u-icon name="fingerprint" size="20" color="#07c160"></u-icon>
              <text class="setting-text">指纹交易</text>
            </view>
            <u-switch 
              v-model="tradingSettings.fingerprintTrade" 
              @change="updateTradingSettings"
            ></u-switch>
          </view>
          
          <view class="setting-item">
            <view class="setting-left">
              <u-icon name="warning" size="20" color="#07c160"></u-icon>
              <text class="setting-text">风险提示</text>
            </view>
            <u-switch 
              v-model="tradingSettings.riskWarning" 
              @change="updateTradingSettings"
            ></u-switch>
          </view>
          
          <view class="setting-item" @click="setDefaultTradeSettings">
            <view class="setting-left">
              <u-icon name="setting" size="20" color="#07c160"></u-icon>
              <text class="setting-text">默认交易设置</text>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
        </view>
      </view>

      <!-- 隐私设置 -->
      <view class="settings-section">
        <view class="section-title">隐私设置</view>
        <view class="settings-group">
          <view class="setting-item">
            <view class="setting-left">
              <u-icon name="eye-off" size="20" color="#ff3b30"></u-icon>
              <text class="setting-text">隐私模式</text>
            </view>
            <u-switch 
              v-model="privacySettings.privacyMode" 
              @change="updatePrivacySettings"
            ></u-switch>
          </view>
          
          <view class="setting-item">
            <view class="setting-left">
              <u-icon name="map" size="20" color="#ff3b30"></u-icon>
              <text class="setting-text">位置信息</text>
            </view>
            <u-switch 
              v-model="privacySettings.locationEnabled" 
              @change="updatePrivacySettings"
            ></u-switch>
          </view>
          
          <view class="setting-item">
            <view class="setting-left">
              <u-icon name="analytics" size="20" color="#ff3b30"></u-icon>
              <text class="setting-text">数据分析</text>
            </view>
            <u-switch 
              v-model="privacySettings.analyticsEnabled" 
              @change="updatePrivacySettings"
            ></u-switch>
          </view>
          
          <view class="setting-item" @click="clearData">
            <view class="setting-left">
              <u-icon name="trash" size="20" color="#ff3b30"></u-icon>
              <text class="setting-text">清除数据</text>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
        </view>
      </view>

      <!-- 关于 -->
      <view class="settings-section">
        <view class="section-title">关于</view>
        <view class="settings-group">
          <view class="setting-item" @click="checkUpdate">
            <view class="setting-left">
              <u-icon name="reload" size="20" color="#999"></u-icon>
              <text class="setting-text">检查更新</text>
            </view>
            <view class="setting-right">
              <text class="setting-value">v{{ appVersion }}</text>
              <u-icon name="arrow-right" size="16" color="#999"></u-icon>
            </view>
          </view>
          
          <view class="setting-item" @click="goToAbout">
            <view class="setting-left">
              <u-icon name="info-circle" size="20" color="#999"></u-icon>
              <text class="setting-text">关于我们</text>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
          
          <view class="setting-item" @click="goToUserAgreement">
            <view class="setting-left">
              <u-icon name="file-text" size="20" color="#999"></u-icon>
              <text class="setting-text">用户协议</text>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
          
          <view class="setting-item" @click="goToPrivacyPolicy">
            <view class="setting-left">
              <u-icon name="shield" size="20" color="#999"></u-icon>
              <text class="setting-text">隐私政策</text>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-section">
        <u-button type="error" @click="logout">退出登录</u-button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userService } from '@/services/userService'
import { notificationService } from '@/services/notificationService'
import { useAppStore } from '@/stores/useAppStore'
import { useUserStore } from '@/stores/useUserStore'

const appStore = useAppStore()
const userStore = useUserStore()

// 用户信息
const userInfo = ref<any>({})
const hasTradePassword = ref(false)

// 应用版本
const appVersion = ref('1.0.0')

// 推送设置
const pushSettings = ref({
  enabled: true,
  sound: true,
  vibration: true
})

// 显示设置
const displaySettings = ref({
  defaultPage: 'market',
  watchlistDisplay: 'list' as 'list' | 'grid',
  chartStyle: 'candlestick' as 'candlestick' | 'line' | 'area',
  chartIndicators: [] as string[],
  priceDisplay: 'price' as 'price' | 'change' | 'percent',
  volumeDisplay: false,
  marketDepth: false,
  customColumns: [] as string[],
  hideAsset: false,
  noImageMode: false
})

// 交易设置
const tradingSettings = ref({
  defaultAccount: '',
  defaultPriceType: 'market' as 'market' | 'limit',
  defaultVolume: 100,
  quickTrade: false,
  confirmTrade: true,
  showAdvancedOptions: false,
  autoSaveOrder: false,
  riskWarning: true,
  commissionDisplay: false,
  fingerprintTrade: false
})

// 隐私设置
const privacySettings = ref({
  profileVisibility: 'private' as 'public' | 'friends' | 'private',
  tradingVisibility: 'private' as 'public' | 'friends' | 'private',
  allowSearch: false,
  allowMessage: false,
  allowRecommendation: false,
  dataCollection: false,
  personalizedAds: false,
  privacyMode: false,
  locationEnabled: false,
  analyticsEnabled: false
})

// 主题和语言
const currentTheme = ref<'light' | 'dark' | 'auto'>('auto')
const currentLanguage = ref<'zh-CN' | 'en-US'>('zh-CN')

// 页面加载
onMounted(async () => {
  await loadUserInfo()
  await loadSettings()
})

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const response = await userService.getUserProfile()
    userInfo.value = response.data
    hasTradePassword.value = response.data.hasTradePassword || false
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

// 加载设置
const loadSettings = async () => {
  try {
    // 加载推送设置
    const pushSettingsData = notificationService.getPushSettings()
    pushSettings.value = {
      enabled: pushSettingsData.sound || pushSettingsData.vibration,
      sound: pushSettingsData.sound,
      vibration: pushSettingsData.vibration
    }
    
    // 加载其他设置
    const savedSettings = await userService.getUserSettings()
    if (savedSettings.data) {
      displaySettings.value = { ...displaySettings.value, ...savedSettings.data.display }
      tradingSettings.value = { ...tradingSettings.value, ...savedSettings.data.trading }
      privacySettings.value = { ...privacySettings.value, ...savedSettings.data.privacy }
      
      currentTheme.value = savedSettings.data.theme || 'auto'
      currentLanguage.value = savedSettings.data.language || 'zh-CN'
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 更新推送设置
const updatePushSettings = async () => {
  try {
    await notificationService.updatePushSettings({
      sound: pushSettings.value.sound,
      vibration: pushSettings.value.vibration,
      led: true
    })
    appStore.showSuccess('推送设置已更新')
  } catch (error) {
    console.error('更新推送设置失败:', error)
    appStore.showError('更新推送设置失败')
  }
}

// 更新显示设置
const updateDisplaySettings = async () => {
  try {
    await userService.updateUserSettings({
      display: displaySettings.value
    })
    appStore.showSuccess('显示设置已更新')
  } catch (error) {
    console.error('更新显示设置失败:', error)
    appStore.showError('更新显示设置失败')
  }
}

// 更新交易设置
const updateTradingSettings = async () => {
  try {
    await userService.updateUserSettings({
      trading: tradingSettings.value
    })
    appStore.showSuccess('交易设置已更新')
  } catch (error) {
    console.error('更新交易设置失败:', error)
    appStore.showError('更新交易设置失败')
  }
}

// 更新隐私设置
const updatePrivacySettings = async () => {
  try {
    await userService.updateUserSettings({
      privacy: privacySettings.value
    })
    appStore.showSuccess('隐私设置已更新')
  } catch (error) {
    console.error('更新隐私设置失败:', error)
    appStore.showError('更新隐私设置失败')
  }
}

// 编辑个人资料
const editProfile = () => {
  uni.navigateTo({
    url: '/pages/profile/edit-profile'
  })
}

// 修改密码
const changePassword = () => {
  uni.navigateTo({
    url: '/pages/profile/change-password'
  })
}

// 设置交易密码
const setTradePassword = () => {
  uni.navigateTo({
    url: '/pages/profile/set-trade-password'
  })
}

// 绑定手机
const bindPhone = () => {
  uni.navigateTo({
    url: '/pages/profile/bind-phone'
  })
}

// 绑定邮箱
const bindEmail = () => {
  uni.navigateTo({
    url: '/pages/profile/bind-email'
  })
}

// 通知详情设置
const goToNotificationSettings = () => {
  uni.navigateTo({
    url: '/pages/profile/notification-settings'
  })
}

// 更改主题
const changeTheme = () => {
  uni.showActionSheet({
    itemList: ['自动', '浅色', '深色'],
    success: async (res: any) => {
      const themes: Array<'auto' | 'light' | 'dark'> = ['auto', 'light', 'dark']
      currentTheme.value = themes[res.tapIndex]
      
      try {
        await userService.updateUserSettings({
          theme: currentTheme.value
        })
        appStore.showSuccess('主题设置已更新')
      } catch (error) {
        console.error('更新主题设置失败:', error)
        appStore.showError('更新主题设置失败')
      }
    }
  })
}

// 更改语言
const changeLanguage = () => {
  uni.showActionSheet({
    itemList: ['简体中文', '繁体中文', 'English'],
    success: async (res: any) => {
      const languages: Array<'zh-CN' | 'en-US'> = ['zh-CN', 'en-US']
      currentLanguage.value = languages[res.tapIndex]
      
      try {
        await userService.updateUserSettings({
          language: currentLanguage.value
        })
        appStore.showSuccess('语言设置已更新')
      } catch (error) {
        console.error('更新语言设置失败:', error)
        appStore.showError('更新语言设置失败')
      }
    }
  })
}

// 默认交易设置
const setDefaultTradeSettings = () => {
  uni.navigateTo({
    url: '/pages/profile/default-trade-settings'
  })
}

// 清除数据
const clearData = () => {
  uni.showModal({
    title: '确认清除',
    content: '确定要清除所有本地数据吗？此操作不可恢复。',
    success: (res: any) => {
      if (res.confirm) {
        // 清除本地存储
        uni.clearStorageSync()
        appStore.showSuccess('数据已清除')
      }
    }
  })
}

// 检查更新
const checkUpdate = () => {
  appStore.showSuccess('当前已是最新版本')
}

// 关于我们
const goToAbout = () => {
  uni.navigateTo({
    url: '/pages/profile/about'
  })
}

// 用户协议
const goToUserAgreement = () => {
  uni.navigateTo({
    url: '/pages/profile/user-agreement'
  })
}

// 隐私政策
const goToPrivacyPolicy = () => {
  uni.navigateTo({
    url: '/pages/profile/privacy-policy'
  })
}

// 退出登录
const logout = async () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: async (res: any) => {
      if (res.confirm) {
        try {
          await userStore.logout()
          appStore.showSuccess('退出登录成功')
          uni.reLaunch({
            url: '/pages/index/index'
          })
        } catch (error) {
          console.error('退出登录失败:', error)
          appStore.showError('退出登录失败')
        }
      }
    }
  })
}

// 返回
const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.settings-page {
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

.settings-content {
  flex: 1;
  padding: 16rpx;
}

.settings-section {
  margin-bottom: 32rpx;
  
  .section-title {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 16rpx;
    padding: 0 16rpx;
  }
  
  .settings-group {
    background-color: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    
    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 32rpx 24rpx;
      border-bottom: 1rpx solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      .setting-left {
        display: flex;
        align-items: center;
        
        .setting-text {
          margin-left: 16rpx;
          font-size: 28rpx;
          color: #333;
        }
      }
      
      .setting-right {
        display: flex;
        align-items: center;
        
        .setting-value {
          font-size: 24rpx;
          color: #999;
          margin-right: 8rpx;
        }
      }
    }
  }
}

.logout-section {
  padding: 32rpx 16rpx;
}
</style>