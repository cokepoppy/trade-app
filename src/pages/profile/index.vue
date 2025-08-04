<template>
  <view class="app-container">
    <view class="profile-page">
    <!-- 用户信息区域 -->
    <view class="user-section">
      <view class="user-info">
        <image :src="userInfo.avatar || '/static/default-avatar.png'" class="user-avatar" @click="changeAvatar"></image>
        <view class="user-details">
          <text class="user-name">{{ userInfo.nickname || userInfo.username }}</text>
          <text class="user-id">ID: {{ userInfo.userId }}</text>
          <view class="user-level">
            <u-tag :text="userLevel.text" :type="userLevel.type" size="mini"></u-tag>
          </view>
        </view>
        <view class="user-actions">
          <u-icon name="scan" size="24" color="#666" @click="scanCode"></u-icon>
          <u-icon name="setting" size="24" color="#666" @click="goToSettings"></u-icon>
        </view>
      </view>
      
      <!-- 用户统计 -->
      <view class="user-stats">
        <view class="stat-item" @click="goToFollowList">
          <text class="stat-value">{{ userInfo.followCount || 0 }}</text>
          <text class="stat-label">关注</text>
        </view>
        <view class="stat-item" @click="goToFansList">
          <text class="stat-value">{{ userInfo.fansCount || 0 }}</text>
          <text class="stat-label">粉丝</text>
        </view>
        <view class="stat-item" @click="goToMyPosts">
          <text class="stat-value">{{ userInfo.postCount || 0 }}</text>
          <text class="stat-label">发帖</text>
        </view>
        <view class="stat-item" @click="goToMyNews">
          <text class="stat-value">{{ userInfo.newsCount || 0 }}</text>
          <text class="stat-label">资讯</text>
        </view>
      </view>
    </view>

    <!-- 资产概览 -->
    <view class="asset-section">
      <view class="section-header">
        <text class="section-title">资产概览</text>
        <u-icon name="eye" size="16" color="#999" @click="toggleAssetVisibility"></u-icon>
      </view>
      <view class="asset-content">
        <view class="total-asset">
          <text class="asset-label">总资产</text>
          <text class="asset-value">{{ showAsset ? formatAmount(totalAsset) : '******' }}</text>
        </view>
        <view class="asset-details">
          <view class="asset-item">
            <text class="item-label">可用资金</text>
            <text class="item-value">{{ showAsset ? formatAmount(availableAmount) : '******' }}</text>
          </view>
          <view class="asset-item">
            <text class="item-label">持仓市值</text>
            <text class="item-value">{{ showAsset ? formatAmount(positionValue) : '******' }}</text>
          </view>
          <view class="asset-item">
            <text class="item-label">今日盈亏</text>
            <text class="item-value" :class="{ 'profit': todayProfit > 0, 'loss': todayProfit < 0 }">
              {{ showAsset ? formatAmount(todayProfit) : '******' }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-group">
        <view class="menu-item" @click="goToWallet">
          <u-icon name="wallet" size="20" color="#007AFF"></u-icon>
          <text class="menu-text">我的钱包</text>
          <u-icon name="arrow-right" size="16" color="#999"></u-icon>
        </view>
        <view class="menu-item" @click="goToOrders">
          <u-icon name="order" size="20" color="#007AFF"></u-icon>
          <text class="menu-text">我的订单</text>
          <u-icon name="arrow-right" size="16" color="#999"></u-icon>
        </view>
        <view class="menu-item" @click="goToPositions">
          <u-icon name="tags" size="20" color="#007AFF"></u-icon>
          <text class="menu-text">我的持仓</text>
          <u-icon name="arrow-right" size="16" color="#999"></u-icon>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @click="goToWatchlist">
          <u-icon name="star" size="20" color="#ff9500"></u-icon>
          <text class="menu-text">自选股</text>
          <u-icon name="arrow-right" size="16" color="#999"></u-icon>
        </view>
        <view class="menu-item" @click="goToBookmarks">
          <u-icon name="bookmark" size="20" color="#ff9500"></u-icon>
          <text class="menu-text">收藏夹</text>
          <u-icon name="arrow-right" size="16" color="#999"></u-icon>
        </view>
        <view class="menu-item" @click="goToHistory">
          <u-icon name="clock" size="20" color="#ff9500"></u-icon>
          <text class="menu-text">浏览历史</text>
          <u-icon name="arrow-right" size="16" color="#999"></u-icon>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @click="goToNotifications">
          <view class="menu-left">
            <u-icon name="bell" size="20" color="#ff3b30"></u-icon>
            <text class="menu-text">消息通知</text>
          </view>
          <view class="menu-right">
            <u-badge v-if="unreadCount > 0" :count="unreadCount" :offset="[0, 0]"></u-badge>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
        </view>
        <view class="menu-item" @click="goToSecurity">
          <u-icon name="lock" size="20" color="#ff3b30"></u-icon>
          <text class="menu-text">账户安全</text>
          <u-icon name="arrow-right" size="16" color="#999"></u-icon>
        </view>
        <view class="menu-item" @click="goToPrivacy">
          <u-icon name="eye-off" size="20" color="#ff3b30"></u-icon>
          <text class="menu-text">隐私设置</text>
          <u-icon name="arrow-right" size="16" color="#999"></u-icon>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @click="goToHelp">
          <u-icon name="question-circle" size="20" color="#666"></u-icon>
          <text class="menu-text">帮助中心</text>
          <u-icon name="arrow-right" size="16" color="#999"></u-icon>
        </view>
        <view class="menu-item" @click="goToFeedback">
          <u-icon name="edit-pen" size="20" color="#666"></u-icon>
          <text class="menu-text">意见反馈</text>
          <u-icon name="arrow-right" size="16" color="#999"></u-icon>
        </view>
        <view class="menu-item" @click="goToAbout">
          <u-icon name="info-circle" size="20" color="#666"></u-icon>
          <text class="menu-text">关于我们</text>
          <u-icon name="arrow-right" size="16" color="#999"></u-icon>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <u-button type="error" @click="logout">退出登录</u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userService } from '@/services/userService'
import { tradeService } from '@/services/tradeService'
import { notificationService } from '@/services/notificationService'
import { useAppStore } from '@/stores/useAppStore'
import { useUserStore } from '@/stores/useUserStore'
import { formatAmount } from '@/utils/format'

const appStore = useAppStore()
const userStore = useUserStore()

// 用户信息
const userInfo = ref<any>({})
const userLevel = ref({ text: '普通用户', type: 'info' })

// 资产信息
const totalAsset = ref(0)
const availableAmount = ref(0)
const positionValue = ref(0)
const todayProfit = ref(0)
const showAsset = ref(true)

// 通知相关
const unreadCount = ref(0)

// 页面加载
onMounted(async () => {
  await loadUserInfo()
  await loadAssetInfo()
  await loadNotificationCount()
})

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const response = await userService.getUserProfile()
    userInfo.value = response.data
    
    // 设置用户等级
    if (userInfo.value.level === 'vip') {
      userLevel.value = { text: 'VIP会员', type: 'warning' }
    } else if (userInfo.value.level === 'premium') {
      userLevel.value = { text: '高级会员', type: 'success' }
    } else if (userInfo.value.level === 'admin') {
      userLevel.value = { text: '管理员', type: 'error' }
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

// 加载资产信息
const loadAssetInfo = async () => {
  try {
    const response = await tradeService.getAccountOverview()
    totalAsset.value = response.data.totalAsset || 0
    availableAmount.value = response.data.availableAmount || 0
    positionValue.value = response.data.positionValue || 0
    todayProfit.value = response.data.todayProfit || 0
  } catch (error) {
    console.error('加载资产信息失败:', error)
  }
}

// 加载通知数量
const loadNotificationCount = async () => {
  try {
    notificationService.getNotifications()
    unreadCount.value = notificationService.getUnreadCount()
  } catch (error) {
    console.error('加载通知数量失败:', error)
  }
}

// 切换资产显示状态
const toggleAssetVisibility = () => {
  showAsset.value = !showAsset.value
}

// 更换头像
const changeAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      try {
        const tempFilePath = res.tempFilePaths[0]
        const uploadResponse = await userService.uploadAvatar(tempFilePath)
        userInfo.value.avatar = uploadResponse.data.url
        appStore.showSuccess('头像更新成功')
      } catch (error) {
        console.error('上传头像失败:', error)
        appStore.showError('上传头像失败')
      }
    }
  })
}

// 扫码
const scanCode = () => {
  uni.scanCode({
    success: (res) => {
      console.log('扫码结果:', res.result)
      // 处理扫码结果
    }
  })
}

// 页面跳转方法
const goToSettings = () => {
  uni.navigateTo({
    url: '/pages/profile/settings'
  })
}

const goToWallet = () => {
  uni.navigateTo({
    url: '/pages/profile/wallet'
  })
}

const goToOrders = () => {
  uni.navigateTo({
    url: '/pages/trade/orders'
  })
}

const goToPositions = () => {
  uni.navigateTo({
    url: '/pages/trade/positions'
  })
}

const goToWatchlist = () => {
  uni.navigateTo({
    url: '/pages/market/watchlist'
  })
}

const goToBookmarks = () => {
  uni.navigateTo({
    url: '/pages/profile/bookmarks'
  })
}

const goToHistory = () => {
  uni.navigateTo({
    url: '/pages/profile/history'
  })
}

const goToNotifications = () => {
  uni.navigateTo({
    url: '/pages/profile/notifications'
  })
}

const goToSecurity = () => {
  uni.navigateTo({
    url: '/pages/profile/security'
  })
}

const goToPrivacy = () => {
  uni.navigateTo({
    url: '/pages/profile/privacy'
  })
}

const goToHelp = () => {
  uni.navigateTo({
    url: '/pages/profile/help'
  })
}

const goToFeedback = () => {
  uni.navigateTo({
    url: '/pages/profile/feedback'
  })
}

const goToAbout = () => {
  uni.navigateTo({
    url: '/pages/profile/about'
  })
}

const goToFollowList = () => {
  uni.navigateTo({
    url: '/pages/profile/follow'
  })
}

const goToFansList = () => {
  uni.navigateTo({
    url: '/pages/profile/fans'
  })
}

const goToMyPosts = () => {
  uni.navigateTo({
    url: '/pages/profile/posts'
  })
}

const goToMyNews = () => {
  uni.navigateTo({
    url: '/pages/profile/news'
  })
}

// 退出登录
const logout = async () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: async (res) => {
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
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

.user-section {
  background-color: #fff;
  padding: 32rpx;
  margin-bottom: 16rpx;
  
  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 32rpx;
    
    .user-avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      margin-right: 24rpx;
    }
    
    .user-details {
      flex: 1;
      
      .user-name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 8rpx;
      }
      
      .user-id {
        font-size: 24rpx;
        color: #999;
        margin-bottom: 8rpx;
      }
      
      .user-level {
        display: flex;
        align-items: center;
      }
    }
    
    .user-actions {
      display: flex;
      gap: 24rpx;
    }
  }
  
  .user-stats {
    display: flex;
    justify-content: space-around;
    padding: 24rpx 0;
    border-top: 1rpx solid #eee;
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .stat-value {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 8rpx;
      }
      
      .stat-label {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

.asset-section {
  background-color: #fff;
  padding: 32rpx;
  margin-bottom: 16rpx;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    
    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .asset-content {
    .total-asset {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24rpx;
      
      .asset-label {
        font-size: 28rpx;
        color: #666;
      }
      
      .asset-value {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
      }
    }
    
    .asset-details {
      display: flex;
      justify-content: space-between;
      
      .asset-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .item-label {
          font-size: 24rpx;
          color: #999;
          margin-bottom: 8rpx;
        }
        
        .item-value {
          font-size: 28rpx;
          font-weight: 500;
          color: #333;
          
          &.profit {
            color: #ff3b30;
          }
          
          &.loss {
            color: #07c160;
          }
        }
      }
    }
  }
}

.menu-section {
  .menu-group {
    background-color: #fff;
    margin-bottom: 16rpx;
    
    .menu-item {
      display: flex;
      align-items: center;
      padding: 32rpx;
      border-bottom: 1rpx solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      .menu-left {
        display: flex;
        align-items: center;
        flex: 1;
        
        .menu-text {
          margin-left: 16rpx;
          font-size: 28rpx;
          color: #333;
        }
      }
      
      .menu-right {
        display: flex;
        align-items: center;
      }
    }
  }
}

.logout-section {
  padding: 32rpx;
}
</style>
  </view>
</view>