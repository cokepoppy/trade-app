<template>
  <view class="orders-container">
    <Header />
    
    <view class="orders-content">
      <view class="filter-section">
        <view class="filter-tabs">
          <view 
            class="filter-tab" 
            :class="{ active: activeTab === 'all' }"
            @tap="switchTab('all')"
          >
            <text class="tab-text">全部</text>
            <text class="tab-count">{{ allOrders.length }}</text>
          </view>
          <view 
            class="filter-tab" 
            :class="{ active: activeTab === 'pending' }"
            @tap="switchTab('pending')"
          >
            <text class="tab-text">待成交</text>
            <text class="tab-count">{{ pendingOrders.length }}</text>
          </view>
          <view 
            class="filter-tab" 
            :class="{ active: activeTab === 'filled' }"
            @tap="switchTab('filled')"
          >
            <text class="tab-text">已成交</text>
            <text class="tab-count">{{ filledOrders.length }}</text>
          </view>
          <view 
            class="filter-tab" 
            :class="{ active: activeTab === 'cancelled' }"
            @tap="switchTab('cancelled')"
          >
            <text class="tab-text">已撤单</text>
            <text class="tab-count">{{ cancelledOrders.length }}</text>
          </view>
        </view>
        
        <view class="filter-actions">
          <view class="refresh-btn" @tap="refreshData">
            
          </view>
          <view class="filter-btn" @tap="showFilter = true">
            
          </view>
        </view>
      </view>
      
      <view v-if="filteredOrders.length > 0" class="orders-list">
        <view 
          v-for="order in filteredOrders" 
          :key="order.id" 
          class="order-item"
          @tap="viewOrderDetail(order)"
        >
          <view class="order-header">
            <view class="stock-info">
              <text class="stock-name">{{ order.name }}</text>
              <text class="stock-code">{{ formatStockCode(order.code) }}</text>
            </view>
            <view class="order-status">
              <text class="status-text" :class="order.status">
                {{ getStatusText(order.status) }}
              </text>
            </view>
          </view>
          
          <view class="order-body">
            <view class="order-info">
              <view class="info-row">
                <view class="info-item">
                  <text class="info-label">类型</text>
                  <text class="info-value" :class="order.type">
                    {{ order.type === 'buy' ? '买入' : '卖出' }}
                  </text>
                </view>
                <view class="info-item">
                  <text class="info-label">委托类型</text>
                  <text class="info-value">
                    {{ order.priceType === 'market' ? '市价' : '限价' }}
                  </text>
                </view>
              </view>
              
              <view class="info-row">
                <view class="info-item">
                  <text class="info-label">委托价格</text>
                  <text class="info-value price">
                    {{ order.priceType === 'market' ? '市价' : formatPrice(order.price) }}
                  </text>
                </view>
                <view class="info-item">
                  <text class="info-label">委托数量</text>
                  <text class="info-value">{{ order.volume }}股</text>
                </view>
              </view>
              
              <view v-if="order.filledVolume > 0" class="info-row">
                <view class="info-item">
                  <text class="info-label">成交数量</text>
                  <text class="info-value">{{ order.filledVolume }}股</text>
                </view>
                <view class="info-item">
                  <text class="info-label">成交均价</text>
                  <text class="info-value">{{ formatPrice(order.avgPrice) }}</text>
                </view>
              </view>
              
              <view class="info-row">
                <view class="info-item">
                  <text class="info-label">下单时间</text>
                  <text class="info-value">{{ formatDateTime(order.orderTime) }}</text>
                </view>
                <view v-if="order.filledTime" class="info-item">
                  <text class="info-label">成交时间</text>
                  <text class="info-value">{{ formatDateTime(order.filledTime) }}</text>
                </view>
              </view>
            </view>
            
            <view v-if="canCancelOrder(order)" class="order-actions">
              <view class="action-btn cancel-btn" @tap.stop="handleCancelOrder(order)">
                <text class="btn-text">撤单</text>
              </view>
            </view>
          </view>
          
          <view class="order-footer">
            <view class="footer-item">
              <text class="footer-label">委托金额</text>
              <text class="footer-value">{{ formatPrice(order.amount) }}</text>
            </view>
            <view class="footer-item">
              <text class="footer-label">手续费</text>
              <text class="footer-value">{{ formatPrice(order.totalFee) }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <view v-else class="empty-state">
        <view class="empty-content">
          
          <text class="empty-text">暂无委托记录</text>
          <text class="empty-desc">您还没有任何委托订单</text>
          <view class="empty-action" @tap="navigateToTrade">
            <text class="action-text">去交易</text>
          </view>
        </view>
      </view>
      
      <view v-if="hasMore && filteredOrders.length > 0" class="load-more" @tap="loadMore">
        <text class="load-more-text">加载更多</text>
      </view>
    </view>
    
    <Footer />
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'
import { useTradeStore } from '@/stores/useTradeStore'
import { useUserStore } from '@/stores/useUserStore'
import { useAppStore } from '@/stores/useAppStore'
import { formatPrice, formatDateTime, formatStockCode } from '@/utils/format'

const tradeStore = useTradeStore()
const userStore = useUserStore()
const appStore = useAppStore()

const activeTab = ref('all')
const isRefreshing = ref(false)
const showFilter = ref(false)
const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const refreshTimer = ref<any>(null)

const allOrders = computed(() => tradeStore.orders)
const pendingOrders = computed(() => tradeStore.pendingOrders)
const filledOrders = computed(() => tradeStore.filledOrders)
const cancelledOrders = computed(() => tradeStore.cancelledOrders)

const filteredOrders = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return pendingOrders.value
    case 'filled':
      return filledOrders.value
    case 'cancelled':
      return cancelledOrders.value
    default:
      return allOrders.value
  }
})

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

const canCancelOrder = (order: any) => {
  return ['pending', 'partial'].includes(order.status)
}

const switchTab = (tab: string) => {
  activeTab.value = tab
  page.value = 1
  hasMore.value = true
}

const refreshData = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    await tradeStore.refreshData()
    page.value = 1
    hasMore.value = true
  } catch (error) {
    console.error('Refresh orders error:', error)
  } finally {
    isRefreshing.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value) return
  
  try {
    page.value++
    await tradeStore.fetchOrders({ 
      page: page.value, 
      pageSize: pageSize.value 
    })
    
    if (tradeStore.orders.length < page.value * pageSize.value) {
      hasMore.value = false
    }
  } catch (error) {
    console.error('Load more orders error:', error)
  }
}

const viewOrderDetail = (order: any) => {
  uni.navigateTo({
    url: `/pages/trade/order-detail?id=${order.id}`
  })
}

const handleCancelOrder = async (order: any) => {
  try {
    // 使用 uni.showModal 进行确认
    uni.showModal({
      title: '确认撤单',
      content: `确定要撤单 ${order.name} 吗？`,
      success: async (res: { confirm: boolean; cancel: boolean }) => {
        if (res.confirm) {
          appStore.showLoading('撤单中...')
          
          await tradeStore.cancelOrder(order.id)
          
          appStore.hideLoading()
          appStore.showToast('撤单成功', 'success')
          
          await tradeStore.refreshData()
        }
      }
    })
  } catch (error) {
    appStore.hideLoading()
    appStore.showError(error instanceof Error ? error.message : '撤单失败')
  }
}

const navigateToTrade = () => {
  uni.switchTab({
    url: '/pages/trade/index'
  })
}

const startAutoRefresh = () => {
  refreshTimer.value = setInterval(() => {
    if (appStore.isOnline && (activeTab.value === 'pending' || activeTab.value === 'all')) {
      refreshData()
    }
  }, 10000) // 10秒刷新一次
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
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
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.orders-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 70px;
}

.orders-content {
  padding: 16px;
}

.filter-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.filter-tabs {
  display: flex;
  margin-bottom: 12px;
}

.filter-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.filter-tab.active {
  border-bottom-color: #1890ff;
  background-color: #f0f9ff;
}

.filter-tab:active {
  opacity: 0.7;
}

.tab-text {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.filter-tab.active .tab-text {
  color: #1890ff;
}

.tab-count {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.refresh-btn,
.filter-btn {
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.refresh-btn:active,
.filter-btn:active {
  background-color: #f5f5f5;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.order-item:active {
  background-color: #f5f5f5;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stock-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stock-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.stock-code {
  font-size: 12px;
  color: #999;
}

.order-status {
  display: flex;
  align-items: center;
}

.status-text {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.status-text.pending {
  background-color: #fff7e6;
  color: #faad14;
}

.status-text.partial {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-text.filled {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-text.cancelled {
  background-color: #f5f5f5;
  color: #666;
}

.status-text.rejected {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.order-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 12px;
  color: #666;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.info-value.buy {
  color: #ff4d4f;
}

.info-value.sell {
  color: #52c41a;
}

.info-value.price {
  color: #1890ff;
  font-weight: 600;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-btn:active {
  opacity: 0.8;
}

.cancel-btn {
  background-color: #ff4d4f;
}

.cancel-btn:active {
  background-color: #ff7875;
}

.btn-text {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.footer-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.footer-label {
  font-size: 12px;
  color: #666;
}

.footer-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-text {
  font-size: 16px;
  color: #666;
  text-align: center;
}

.empty-desc {
  font-size: 14px;
  color: #999;
  text-align: center;
}

.empty-action {
  margin-top: 8px;
  padding: 8px 24px;
  background-color: #1890ff;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.empty-action:active {
  background-color: #40a9ff;
}

.action-text {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.load-more:active {
  opacity: 0.7;
}

.load-more-text {
  font-size: 14px;
  color: #1890ff;
}
</style>