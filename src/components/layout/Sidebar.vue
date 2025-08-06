<template>
  <view class="sidebar" :class="{ 'sidebar-open': isOpen }">
    <view class="sidebar-header">
      <view class="user-info">
        <view class="avatar">
          
        </view>
        <view class="user-details">
          <text class="username">{{ username }}</text>
          <text class="user-id">ID: {{ userId }}</text>
        </view>
      </view>
      <view class="close-btn" @tap="closeSidebar">
        
      </view>
    </view>
    
    <view class="sidebar-content">
      <view class="menu-section">
        <view class="menu-title">账户管理</view>
        <view class="menu-item" @tap="navigateTo('/pages/trade/funds')">
          
          <text>资金管理</text>
        </view>
        <view class="menu-item" @tap="navigateTo('/pages/trade/positions')">
          
          <text>持仓管理</text>
        </view>
        <view class="menu-item" @tap="navigateTo('/pages/trade/orders')">
          
          <text>委托查询</text>
        </view>
        <view class="menu-item" @tap="navigateTo('/pages/trade/deals')">
          
          <text>成交查询</text>
        </view>
      </view>
      
      <view class="menu-section">
        <view class="menu-title">自选股管理</view>
        <view class="menu-item" @tap="navigateTo('/pages/profile/watchlist')">
          
          <text>自选股设置</text>
        </view>
        <view class="menu-item" @tap="navigateTo('/pages/market/indices')">
          
          <text>指数行情</text>
        </view>
      </view>
      
      <view class="menu-section">
        <view class="menu-title">系统设置</view>
        <view class="menu-item" @tap="navigateTo('/pages/profile/settings')">
          
          <text>设置</text>
        </view>
        <view class="menu-item" @tap="navigateTo('/pages/profile/about')">
          
          <text>关于</text>
        </view>
      </view>
    </view>
  </view>
  
  <view 
    v-if="isOpen" 
    class="sidebar-mask" 
    @tap="closeSidebar"
  ></view>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  username: {
    type: String,
    default: '用户'
  },
  userId: {
    type: String,
    default: '000001'
  }
})

const emit = defineEmits(['close'])

const closeSidebar = () => {
  emit('close')
}

const navigateTo = (url: string) => {
  uni.navigateTo({
    url: url
  })
  closeSidebar()
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: -280px;
  width: 280px;
  height: 100vh;
  background-color: #fff;
  z-index: 2000;
  transition: left 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.sidebar-open {
  left: 0;
}

.sidebar-header {
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  padding: 20px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.user-id {
  font-size: 12px;
  opacity: 0.8;
}

.close-btn {
  padding: 8px;
  cursor: pointer;
}

.sidebar-content {
  padding: 20px 0;
}

.menu-section {
  margin-bottom: 24px;
}

.menu-title {
  padding: 0 20px 8px;
  font-size: 14px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.menu-item:active {
  background-color: #f5f5f5;
}

.menu-item text {
  font-size: 14px;
  color: #333;
}

.sidebar-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1999;
}
</style>