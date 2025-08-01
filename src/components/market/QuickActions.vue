<template>
  <view class="quick-actions">
    <view class="actions-grid">
      <view 
        v-for="action in actions" 
        :key="action.id" 
        class="action-item"
        @tap="handleActionClick(action)"
      >
        <view class="action-icon-wrapper" :class="action.type">
          <uni-icons :type="action.icon" size="24" :color="action.color"></uni-icons>
        </view>
        <text class="action-text">{{ action.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/useUserStore'
import { useTradeStore } from '@/stores/useTradeStore'
import { useAppStore } from '@/stores/useAppStore'

const userStore = useUserStore()
const tradeStore = useTradeStore()
const appStore = useAppStore()

const actions = computed(() => [
  {
    id: 'buy',
    name: '买入',
    icon: 'cart',
    color: '#1890ff',
    type: 'primary',
    action: () => handleBuy()
  },
  {
    id: 'sell',
    name: '卖出',
    icon: 'cash',
    color: '#ff4d4f',
    type: 'danger',
    action: () => handleSell()
  },
  {
    id: 'transfer',
    name: '转账',
    icon: 'loop',
    color: '#52c41a',
    type: 'success',
    action: () => handleTransfer()
  },
  {
    id: 'scan',
    name: '扫一扫',
    icon: 'scan',
    color: '#722ed1',
    type: 'info',
    action: () => handleScan()
  }
])

const handleActionClick = (action: any) => {
  if (!userStore.isLoggedIn) {
    appStore.showModal('提示', '请先登录', 'confirm')
    return
  }
  
  action.action()
}

const handleBuy = () => {
  uni.navigateTo({
    url: '/pages/trade/buy'
  })
}

const handleSell = () => {
  if (tradeStore.positions.length === 0) {
    appStore.showToast('暂无持仓股票', 'warning')
    return
  }
  
  uni.navigateTo({
    url: '/pages/trade/sell'
  })
}

const handleTransfer = () => {
  uni.navigateTo({
    url: '/pages/trade/transfer'
  })
}

const handleScan = () => {
  uni.scanCode({
    success: (res: any) => {
      console.log('扫码结果:', res)
      appStore.showToast('扫码成功', 'success')
    },
    fail: (err: any) => {
      console.error('扫码失败:', err)
      appStore.showToast('扫码失败', 'error')
    }
  })
}
</script>

<style scoped>
.quick-actions {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.action-item:active {
  opacity: 0.7;
}

.action-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.action-item:active .action-icon-wrapper {
  transform: scale(0.95);
}

.action-icon-wrapper.primary {
  background-color: #e6f7ff;
}

.action-icon-wrapper.danger {
  background-color: #fff2f0;
}

.action-icon-wrapper.success {
  background-color: #f6ffed;
}

.action-icon-wrapper.info {
  background-color: #f9f0ff;
}

.action-text {
  font-size: 12px;
  color: #666;
  text-align: center;
  font-weight: 500;
}
</style>