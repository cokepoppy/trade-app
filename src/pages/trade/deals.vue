<template>
  <view class="deals-container">
    <Header />
    
    <view class="deals-content">
      <view class="summary-section">
        <view class="summary-card">
          <view class="summary-header">
            <text class="summary-title">今日成交统计</text>
            <view class="refresh-btn" @tap="refreshData">
              
            </view>
          </view>
          
          <view class="summary-grid">
            <view class="summary-item">
              <text class="item-label">成交笔数</text>
              <text class="item-value">{{ todayDeals.length }}</text>
            </view>
            <view class="summary-item">
              <text class="item-label">成交金额</text>
              <text class="item-value">{{ formatPrice(todayAmount) }}</text>
            </view>
            <view class="summary-item">
              <text class="item-label">手续费</text>
              <text class="item-value">{{ formatPrice(todayFee) }}</text>
            </view>
            <view class="summary-item">
              <text class="item-label">净盈亏</text>
              <text class="item-value" :class="getColorClass(todayProfit)">
                {{ formatChange(todayProfit) }}
              </text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="filter-section">
        <view class="filter-header">
          <text class="filter-title">成交记录</text>
          <view class="filter-actions">
            <view class="date-btn" @tap="showDatePicker = true">
              
              <text class="date-text">{{ selectedDate }}</text>
            </view>
            <view class="refresh-btn" @tap="refreshData">
              
            </view>
          </view>
        </view>
        
        <view class="type-filter">
          <view 
            class="type-item" 
            :class="{ active: selectedType === 'all' }"
            @tap="selectType('all')"
          >
            <text class="type-text">全部</text>
          </view>
          <view 
            class="type-item" 
            :class="{ active: selectedType === 'buy' }"
            @tap="selectType('buy')"
          >
            <text class="type-text">买入</text>
          </view>
          <view 
            class="type-item" 
            :class="{ active: selectedType === 'sell' }"
            @tap="selectType('sell')"
          >
            <text class="type-text">卖出</text>
          </view>
        </view>
      </view>
      
      <view v-if="filteredDeals.length > 0" class="deals-list">
        <view 
          v-for="deal in filteredDeals" 
          :key="deal.id" 
          class="deal-item"
          @tap="viewDealDetail(deal)"
        >
          <view class="deal-header">
            <view class="stock-info">
              <text class="stock-name">{{ deal.name }}</text>
              <text class="stock-code">{{ formatStockCode(deal.code) }}</text>
            </view>
            <view class="deal-type">
              <text class="type-text" :class="deal.type">
                {{ deal.type === 'buy' ? '买入' : '卖出' }}
              </text>
            </view>
          </view>
          
          <view class="deal-body">
            <view class="deal-info">
              <view class="info-row">
                <view class="info-item">
                  <text class="info-label">成交价格</text>
                  <text class="info-value price">{{ formatPrice(deal.price) }}</text>
                </view>
                <view class="info-item">
                  <text class="info-label">成交数量</text>
                  <text class="info-value">{{ deal.volume }}股</text>
                </view>
              </view>
              
              <view class="info-row">
                <view class="info-item">
                  <text class="info-label">成交金额</text>
                  <text class="info-value amount">{{ formatPrice(deal.amount) }}</text>
                </view>
                <view class="info-item">
                  <text class="info-label">手续费</text>
                  <text class="info-value fee">{{ formatPrice(deal.totalFee) }}</text>
                </view>
              </view>
              
              <view class="info-row">
                <view class="info-item">
                  <text class="info-label">成交时间</text>
                  <text class="info-value">{{ formatDateTime(deal.dealTime) }}</text>
                </view>
                <view class="info-item">
                  <text class="info-label">成交编号</text>
                  <text class="info-value">{{ deal.dealId }}</text>
                </view>
              </view>
            </view>
          </view>
          
          <view class="deal-footer">
            <view class="footer-item">
              <text class="footer-label">交易所</text>
              <text class="footer-value">{{ deal.market || '未知' }}</text>
            </view>
            <view class="footer-item">
              <text class="footer-label">账户</text>
              <text class="footer-value">{{ deal.accountName }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <view v-else class="empty-state">
        <view class="empty-content">
          
          <text class="empty-text">暂无成交记录</text>
          <text class="empty-desc">您还没有任何成交记录</text>
          <view class="empty-action" @tap="navigateToTrade">
            <text class="action-text">去交易</text>
          </view>
        </view>
      </view>
      
      <view v-if="hasMore && filteredDeals.length > 0" class="load-more" @tap="loadMore">
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
import { formatPrice, formatDateTime, formatChange, getColorClass, formatStockCode } from '@/utils/format'
import { formatDate } from '@/utils/date'

const tradeStore = useTradeStore()
const userStore = useUserStore()
const appStore = useAppStore()

const isRefreshing = ref(false)
const selectedDate = ref(formatDate(new Date().toISOString()))
const selectedType = ref('all')
const showDatePicker = ref(false)
const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const refreshTimer = ref<any>(null)

const allDeals = computed(() => tradeStore.deals)
const todayDeals = computed(() => tradeStore.todayDeals)

const filteredDeals = computed(() => {
  let filtered = allDeals.value
  
  if (selectedType.value !== 'all') {
    filtered = filtered.filter(deal => deal.type === selectedType.value)
  }
  
  return filtered
})

const todayAmount = computed(() => {
  return todayDeals.value.reduce((sum, deal) => sum + deal.amount, 0)
})

const todayFee = computed(() => {
  return todayDeals.value.reduce((sum, deal) => sum + deal.totalFee, 0)
})

const todayProfit = computed(() => {
  return todayDeals.value.reduce((sum, deal) => {
    if (deal.type === 'sell') {
      return sum + (deal.profit || 0)
    }
    return sum
  }, 0)
})

const selectType = (type: string) => {
  selectedType.value = type
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
    console.error('Refresh deals error:', error)
  } finally {
    isRefreshing.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value) return
  
  try {
    page.value++
    await tradeStore.getDeals({ 
      page: page.value, 
      pageSize: pageSize.value 
    })
    
    if (allDeals.value.length < page.value * pageSize.value) {
      hasMore.value = false
    }
  } catch (error) {
    console.error('Load more deals error:', error)
  }
}

const viewDealDetail = (deal: any) => {
  uni.navigateTo({
    url: `/pages/trade/deal-detail?id=${deal.id}`
  })
}

const navigateToTrade = () => {
  uni.switchTab({
    url: '/pages/trade/index'
  })
}

const startAutoRefresh = () => {
  refreshTimer.value = setInterval(() => {
    if (appStore.isOnline) {
      refreshData()
    }
  }, 30000) // 30秒刷新一次
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
.deals-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 70px;
}

.deals-content {
  padding: 16px;
}

.summary-section {
  margin-bottom: 16px;
}

.summary-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.refresh-btn {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.refresh-btn:active {
  background-color: #f5f5f5;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-label {
  font-size: 12px;
  color: #666;
}

.item-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.filter-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filter-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.date-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.date-btn:active {
  border-color: #1890ff;
  background-color: #f0f9ff;
}

.date-text {
  font-size: 12px;
  color: #666;
}

.type-filter {
  display: flex;
  gap: 8px;
}

.type-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-item.active {
  border-color: #1890ff;
  background-color: #f0f9ff;
}

.type-item:active {
  opacity: 0.7;
}

.type-text {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.type-item.active .type-text {
  color: #1890ff;
}

.deals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.deal-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.deal-item:active {
  background-color: #f5f5f5;
}

.deal-header {
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

.deal-type {
  display: flex;
  align-items: center;
}

.type-text {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.type-text.buy {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.type-text.sell {
  background-color: #f6ffed;
  color: #52c41a;
}

.deal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.deal-info {
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

.info-value.price {
  color: #1890ff;
  font-weight: 600;
}

.info-value.amount {
  color: #722ed1;
}

.info-value.fee {
  color: #faad14;
}

.deal-footer {
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