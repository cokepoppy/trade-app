<template>
  <view class="header">
    <view class="header-left">
      <text class="app-title">股票交易</text>
    </view>
    <view class="header-center">
      <view class="market-status">
        <text class="status-dot" :class="{ 'open': isMarketOpen }"></text>
        <text class="status-text">{{ marketStatusText }}</text>
      </view>
    </view>
    <view class="header-right">
      <view class="header-actions">
        <view class="action-item" @tap="handleSearch">
          
        </view>
        <view class="action-item" @tap="handleMessage">
          
          <view v-if="unreadCount > 0" class="badge">{{ unreadCount }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const isMarketOpen = ref(false)
const unreadCount = ref(0)

const marketStatusText = computed(() => {
  return isMarketOpen.value ? '交易中' : '已收盘'
})

const handleSearch = () => {
  uni.navigateTo({
    url: '/pages/market/search'
  })
}

const handleMessage = () => {
  uni.navigateTo({
    url: '/pages/news/messages'
  })
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 44px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  flex: 1;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.market-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #999;
}

.status-dot.open {
  background-color: #52c41a;
}

.status-text {
  font-size: 12px;
  color: #666;
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.header-actions {
  display: flex;
  gap: 16px;
}

.action-item {
  position: relative;
  padding: 4px;
}

.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 16px;
  height: 16px;
  background-color: #ff4d4f;
  color: white;
  border-radius: 8px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
</style>