<template>
  <view class="positions-container">
    <Header />
    
    <view class="positions-content">
      <view class="summary-section">
        <view class="summary-card">
          <view class="summary-header">
            <text class="summary-title">持仓总览</text>
            <view class="refresh-btn" @tap="refreshData">
              
            </view>
          </view>
          
          <view class="summary-grid">
            <view class="summary-item">
              <text class="item-label">总资产</text>
              <text class="item-value total-assets">{{ formatPrice(totalAssets) }}</text>
            </view>
            <view class="summary-item">
              <text class="item-label">总市值</text>
              <text class="item-value market-value">{{ formatPrice(marketValue) }}</text>
            </view>
            <view class="summary-item">
              <text class="item-label">今日盈亏</text>
              <text class="item-value" :class="getColorClass(todayProfit)">
                {{ formatChange(todayProfit) }}
              </text>
            </view>
            <view class="summary-item">
              <text class="item-label">累计盈亏</text>
              <text class="item-value" :class="getColorClass(totalProfit)">
                {{ formatChange(totalProfit) }}
              </text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="positions-section">
        <view class="section-header">
          <text class="section-title">持仓明细</text>
          <view class="header-actions">
            <view class="action-btn" @tap="navigateToMarket">
              
            </view>
            <view class="action-btn" @tap="toggleSort">
              
            </view>
          </view>
        </view>
        
        <view v-if="positions.length > 0" class="positions-list">
          <view 
            v-for="position in sortedPositions" 
            :key="position.id" 
            class="position-item"
            @tap="viewPositionDetail(position)"
          >
            <view class="position-header">
              <view class="stock-info">
                <text class="stock-name">{{ position.name }}</text>
                <text class="stock-code">{{ formatStockCode(position.code) }}</text>
              </view>
              <view class="position-actions">
                <view class="action-icon" @tap.stop="handleSell(position)">
                  
                </view>
              </view>
            </view>
            
            <view class="position-data">
              <view class="data-row">
                <view class="data-item">
                  <text class="data-label">持仓数量</text>
                  <text class="data-value">{{ position.volume }}股</text>
                </view>
                <view class="data-item">
                  <text class="data-label">可用数量</text>
                  <text class="data-value">{{ position.availableVolume }}股</text>
                </view>
              </view>
              
              <view class="data-row">
                <view class="data-item">
                  <text class="data-label">成本价</text>
                  <text class="data-value">{{ formatPrice(position.buyPrice) }}</text>
                </view>
                <view class="data-item">
                  <text class="data-label">现价</text>
                  <text class="data-value" :class="getColorClass(position.currentPrice - position.buyPrice)">
                    {{ formatPrice(position.currentPrice) }}
                  </text>
                </view>
              </view>
              
              <view class="data-row">
                <view class="data-item">
                  <text class="data-label">市值</text>
                  <text class="data-value">{{ formatPrice(position.marketValue) }}</text>
                </view>
                <view class="data-item">
                  <text class="data-label">盈亏</text>
                  <text class="data-value" :class="getColorClass(position.profit)">
                    {{ formatChange(position.profit) }}
                  </text>
                </view>
              </view>
              
              <view class="data-row">
                <view class="data-item">
                  <text class="data-label">盈亏比例</text>
                  <text class="data-value" :class="getColorClass(position.profit)">
                    {{ formatChangePercent(position.profitPercent) }}
                  </text>
                </view>
                <view class="data-item">
                  <text class="data-label">今日盈亏</text>
                  <text class="data-value" :class="getColorClass(position.todayProfit)">
                    {{ formatChange(position.todayProfit) }}
                  </text>
                </view>
              </view>
            </view>
            
            <view v-if="position.trendData" class="position-chart">
              <view class="mini-chart">
                <text class="chart-placeholder">走势图</text>
              </view>
            </view>
          </view>
        </view>
        
        <view v-else class="empty-state">
          <view class="empty-content">
            
            <text class="empty-text">暂无持仓</text>
            <text class="empty-desc">您还没有购买任何股票</text>
            <view class="empty-action" @tap="navigateToMarket">
              <text class="action-text">去交易</text>
            </view>
          </view>
        </view>
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
import { formatPrice, formatChange, formatChangePercent, getColorClass, formatStockCode } from '@/utils/format'

const tradeStore = useTradeStore()
const userStore = useUserStore()
const appStore = useAppStore()

const isRefreshing = ref(false)
const sortOrder = ref<'asc' | 'desc'>('desc')
const refreshTimer = ref<any>(null)

const totalAssets = computed(() => tradeStore.totalAssets)
const marketValue = computed(() => tradeStore.marketValue)
const todayProfit = computed(() => tradeStore.todayProfit)
const totalProfit = computed(() => tradeStore.totalProfit)
const positions = computed(() => tradeStore.positions)

const sortedPositions = computed(() => {
  const sorted = [...positions.value]
  sorted.sort((a, b) => {
    const aValue = sortOrder.value === 'desc' ? a.marketValue : -a.marketValue
    const bValue = sortOrder.value === 'desc' ? b.marketValue : -b.marketValue
    return bValue - aValue
  })
  
  return sorted.map(position => ({
    ...position,
    trendData: generateTrendData(position.profitPercent)
  }))
})

const generateTrendData = (profitPercent: number) => {
  const isPositive = profitPercent >= 0
  const points = []
  const baseValue = 100
  
  for (let i = 0; i < 20; i++) {
    const variation = (Math.random() - 0.5) * 10
    const trend = isPositive ? i * 0.3 : -i * 0.3
    points.push(baseValue + variation + trend)
  }
  
  return points
}

const refreshData = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    await tradeStore.refreshData()
  } catch (error) {
    console.error('Refresh positions error:', error)
  } finally {
    isRefreshing.value = false
  }
}

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

const viewPositionDetail = (position: any) => {
  uni.navigateTo({
    url: `/pages/trade/position-detail?code=${position.code}&name=${position.name}`
  })
}

const handleSell = (position: any) => {
  uni.navigateTo({
    url: `/pages/trade/sell?code=${position.code}&name=${position.name}&volume=${position.availableVolume}`
  })
}

const navigateToMarket = () => {
  uni.switchTab({
    url: '/pages/market/index'
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
.positions-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 70px;
}

.positions-content {
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

.total-assets {
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

.market-value {
  color: #722ed1;
}

.positions-section {
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

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-btn:active {
  background-color: #f5f5f5;
}

.positions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.position-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.position-item:active {
  background-color: #f5f5f5;
}

.position-header {
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

.position-actions {
  display: flex;
  gap: 8px;
}

.action-icon {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-icon:active {
  background-color: #fff2f0;
}

.position-data {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.data-row {
  display: flex;
  justify-content: space-between;
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.data-label {
  font-size: 12px;
  color: #666;
}

.data-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.position-chart {
  height: 40px;
  background-color: #f8f9fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-chart {
  width: 100%;
  height: 100%;
}

.chart-placeholder {
  font-size: 10px;
  color: #999;
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