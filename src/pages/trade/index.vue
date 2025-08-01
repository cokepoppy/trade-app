<template>
  <view class="trade-container">
    <Header />
    
    <view class="trade-content">
      <view class="account-info">
        <view class="account-card">
          <view class="account-header">
            <text class="account-title">账户信息</text>
            <text class="account-status" :class="{ 'active': currentAccount?.status === 'active' }">
              {{ currentAccount?.status === 'active' ? '正常' : '异常' }}
            </text>
          </view>
          
          <view class="account-details">
            <view class="detail-item">
              <text class="label">总资产</text>
              <text class="value total-assets">{{ formatPrice(totalAssets) }}</text>
            </view>
            <view class="detail-item">
              <text class="label">可用余额</text>
              <text class="value balance">{{ formatPrice(availableBalance) }}</text>
            </view>
            <view class="detail-item">
              <text class="label">持仓市值</text>
              <text class="value market-value">{{ formatPrice(marketValue) }}</text>
            </view>
            <view class="detail-item">
              <text class="label">今日盈亏</text>
              <text class="value" :class="getColorClass(todayProfit)">
                {{ formatChange(todayProfit) }}
              </text>
            </view>
            <view class="detail-item">
              <text class="label">累计盈亏</text>
              <text class="value" :class="getColorClass(totalProfit)">
                {{ formatChange(totalProfit) }}
              </text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="trade-panel">
        <TradePanel ref="tradePanelRef" @trade="handleTrade" />
      </view>
      
      <TradeConfirm 
        :visible="showConfirm"
        :trade-data="confirmTradeData"
        :require-password="requirePassword"
        @close="handleConfirmClose"
        @confirm="handleConfirmTrade"
        @forgot-password="handleForgotPassword"
      />
      
      <view class="quick-actions">
        <view class="action-grid">
          <view class="action-item" @tap="navigateToPositions">
            <uni-icons type="list" size="24" color="#1890ff"></uni-icons>
            <text class="action-text">持仓</text>
          </view>
          <view class="action-item" @tap="navigateToOrders">
            <uni-icons type="document" size="24" color="#52c41a"></uni-icons>
            <text class="action-text">委托</text>
          </view>
          <view class="action-item" @tap="navigateToDeals">
            <uni-icons type="checkmarkempty" size="24" color="#faad14"></uni-icons>
            <text class="action-text">成交</text>
          </view>
          <view class="action-item" @tap="navigateToFunds">
            <uni-icons type="wallet" size="24" color="#722ed1"></uni-icons>
            <text class="action-text">资金</text>
          </view>
        </view>
      </view>
      
      <view v-if="recentOrders.length > 0" class="recent-orders">
        <view class="section-header">
          <text class="section-title">最近委托</text>
          <text class="view-all" @tap="navigateToOrders">查看全部</text>
        </view>
        
        <view class="orders-list">
          <view 
            v-for="order in recentOrders" 
            :key="order.id" 
            class="order-item"
            @tap="viewOrderDetail(order)"
          >
            <view class="order-info">
              <text class="stock-name">{{ order.name }}</text>
              <text class="order-type" :class="order.type">
                {{ order.type === 'buy' ? '买入' : '卖出' }}
              </text>
            </view>
            
            <view class="order-data">
              <text class="order-price">{{ formatPrice(order.price) }}</text>
              <text class="order-volume">{{ order.volume }}股</text>
              <text class="order-status" :class="order.status">
                {{ getStatusText(order.status) }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <Footer />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'
import TradePanel from '@/components/trade/TradePanel.vue'
import TradeConfirm from '@/components/trade/TradeConfirm.vue'
import { useTradeStore } from '@/stores/useTradeStore'
import { useUserStore } from '@/stores/useUserStore'
import { useAppStore } from '@/stores/useAppStore'
import { formatPrice, formatChange, getColorClass } from '@/utils/format'

const tradeStore = useTradeStore()
const userStore = useUserStore()
const appStore = useAppStore()
const tradePanelRef = ref()

const showConfirm = ref(false)
const confirmTradeData = ref({})
const requirePassword = ref(true)

const currentAccount = computed(() => tradeStore.currentAccount)
const totalAssets = computed(() => tradeStore.totalAssets)
const availableBalance = computed(() => tradeStore.availableBalance)
const marketValue = computed(() => tradeStore.marketValue)
const todayProfit = computed(() => tradeStore.todayProfit)
const totalProfit = computed(() => tradeStore.totalProfit)
const recentOrders = computed(() => tradeStore.todayOrders.slice(0, 5))

const getStatusText = (status: string) => {
  const statusMap = {
    pending: '待成交',
    partial: '部分成交',
    filled: '已成交',
    cancelled: '已撤单',
    rejected: '已拒绝',
    expired: '已过期'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const handleTrade = async (tradeData: any) => {
  confirmTradeData.value = tradeData
  showConfirm.value = true
}

const handleConfirmClose = () => {
  showConfirm.value = false
  confirmTradeData.value = {}
}

const handleConfirmTrade = async (finalTradeData: any) => {
  try {
    appStore.showLoading('处理中...')
    
    const result = await tradeStore.placeOrder(finalTradeData)
    
    appStore.hideLoading()
    appStore.showToast('下单成功', 'success')
    
    showConfirm.value = false
    confirmTradeData.value = {}
    
    await tradeStore.refreshData()
    
    if (tradePanelRef.value) {
      tradePanelRef.value.setStock(null)
    }
  } catch (error) {
    appStore.hideLoading()
    appStore.showError(error instanceof Error ? error.message : '下单失败')
  }
}

const handleForgotPassword = () => {
  uni.navigateTo({
    url: '/pages/profile/reset-trade-password'
  })
}

const navigateToPositions = () => {
  uni.navigateTo({
    url: '/pages/trade/positions'
  })
}

const navigateToOrders = () => {
  uni.navigateTo({
    url: '/pages/trade/orders'
  })
}

const navigateToDeals = () => {
  uni.navigateTo({
    url: '/pages/trade/deals'
  })
}

const navigateToFunds = () => {
  uni.navigateTo({
    url: '/pages/trade/funds'
  })
}

const viewOrderDetail = (order: any) => {
  uni.navigateTo({
    url: `/pages/trade/order-detail?id=${order.id}`
  })
}

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    appStore.showModal('提示', '请先登录', 'confirm')
    uni.switchTab({
      url: '/pages/profile/index'
    })
    return
  }
  
  await tradeStore.initialize()
})
</script>

<style scoped>
.trade-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 70px;
}

.trade-content {
  padding: 16px;
}

.account-info {
  margin-bottom: 16px;
}

.account-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.account-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.account-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f5f5f5;
  color: #666;
}

.account-status.active {
  background-color: #f6ffed;
  color: #52c41a;
}

.account-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: #666;
}

.value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.total-assets {
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

.balance {
  color: #52c41a;
}

.market-value {
  color: #722ed1;
}

.trade-panel {
  margin-bottom: 16px;
}

.quick-actions {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.action-grid {
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

.action-text {
  font-size: 12px;
  color: #666;
}

.recent-orders {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.view-all {
  font-size: 12px;
  color: #1890ff;
  cursor: pointer;
}

.view-all:active {
  opacity: 0.7;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.order-item:active {
  background-color: #f5f5f5;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stock-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.order-type {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
}

.order-type.buy {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.order-type.sell {
  background-color: #f6ffed;
  color: #52c41a;
}

.order-data {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-price {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.order-volume {
  font-size: 12px;
  color: #666;
}

.order-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
}

.order-status.pending {
  background-color: #fff7e6;
  color: #faad14;
}

.order-status.partial {
  background-color: #e6f7ff;
  color: #1890ff;
}

.order-status.filled {
  background-color: #f6ffed;
  color: #52c41a;
}

.order-status.cancelled {
  background-color: #f5f5f5;
  color: #666;
}

.order-status.rejected {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.text-up {
  color: #ff4d4f;
}

.text-down {
  color: #52c41a;
}

.text-flat {
  color: #666;
}
</style>