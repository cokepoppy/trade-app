<template>
  <view class="detail-container">
    <!-- 股票基本信息 -->
    <view class="stock-header">
      <view class="stock-info">
        <view class="stock-name-info">
          <text class="stock-name">{{ stockDetail?.name || '--' }}</text>
          <text class="stock-code">{{ stockDetail?.code || '--' }}</text>
        </view>
        <view class="stock-price-info">
          <text class="current-price" :class="stockDetail?.change >= 0 ? 'up' : 'down'">
            {{ stockDetail?.price?.toFixed(2) || '--' }}
          </text>
          <view class="price-change-info">
            <text class="price-change" :class="stockDetail?.change >= 0 ? 'up' : 'down'">
              {{ stockDetail?.change >= 0 ? '+' : '' }}{{ stockDetail?.change?.toFixed(2) || '--' }}
            </text>
            <text class="price-change-percent" :class="stockDetail?.change >= 0 ? 'up' : 'down'">
              {{ stockDetail?.changePercent >= 0 ? '+' : '' }}{{ stockDetail?.changePercent?.toFixed(2) || '--' }}%
            </text>
          </view>
        </view>
        <view class="watchlist-btn" @click="toggleWatchlist">
          <uni-icons 
            :type="isInWatchlist ? 'star-filled' : 'star'" 
            size="24" 
            :color="isInWatchlist ? '#ff9500' : '#999'"
          ></uni-icons>
          <text class="watchlist-text">{{ isInWatchlist ? '已添加' : '添加自选' }}</text>
        </view>
      </view>
      <view class="stock-extra">
        <view class="extra-item">
          <text class="extra-label">最高</text>
          <text class="extra-value">{{ stockDetail?.high?.toFixed(2) || '--' }}</text>
        </view>
        <view class="extra-item">
          <text class="extra-label">最低</text>
          <text class="extra-value">{{ stockDetail?.low?.toFixed(2) || '--' }}</text>
        </view>
        <view class="extra-item">
          <text class="extra-label">成交量</text>
          <text class="extra-value">{{ formatVolume(stockDetail?.volume) }}</text>
        </view>
        <view class="extra-item">
          <text class="extra-label">成交额</text>
          <text class="extra-value">{{ formatAmount(stockDetail?.amount) }}</text>
        </view>
      </view>
    </view>

    <!-- 标签页 -->
    <view class="detail-tabs">
      <view 
        v-for="tab in tabs" 
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.name }}
      </view>
    </view>

    <!-- 标签页内容 -->
    <view class="detail-content">
      <!-- 分时图 -->
      <view v-if="activeTab === 'time'" class="time-share">
        <view class="chart-container">
          <canvas canvas-id="time-share-chart" class="chart-canvas"></canvas>
        </view>
        <view class="chart-info">
          <view class="info-item">
            <text class="info-label">均价</text>
            <text class="info-value">{{ stockDetail?.avgPrice?.toFixed(2) || '--' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">换手率</text>
            <text class="info-value">{{ stockDetail?.turnoverRate?.toFixed(2) || '--' }}%</text>
          </view>
          <view class="info-item">
            <text class="info-label">市盈率</text>
            <text class="info-value">{{ stockDetail?.pe?.toFixed(2) || '--' }}</text>
          </view>
        </view>
      </view>

      <!-- K线图 -->
      <view v-if="activeTab === 'kline'" class="kline">
        <view class="kline-periods">
          <view 
            v-for="period in periods" 
            :key="period.key"
            class="period-item"
            :class="{ active: activePeriod === period.key }"
            @click="switchPeriod(period.key)"
          >
            {{ period.name }}
          </view>
        </view>
        <view class="chart-container">
          <canvas canvas-id="kline-chart" class="chart-canvas"></canvas>
        </view>
      </view>

      <!-- 五档 -->
      <view v-if="activeTab === 'orderbook'" class="orderbook">
        <view class="orderbook-header">
          <text class="orderbook-title">五档行情</text>
        </view>
        <view class="orderbook-content">
          <!-- 卖五档 -->
          <view class="ask-orders">
            <view 
              v-for="order in askOrders" 
              :key="order.price"
              class="order-item"
            >
              <text class="price down">{{ order.price }}</text>
              <text class="volume">{{ order.volume }}</text>
            </view>
          </view>
          
          <!-- 当前价 -->
          <view class="current-price-line">
            <text class="current-price" :class="stockDetail?.change >= 0 ? 'up' : 'down'">
              {{ stockDetail?.price?.toFixed(2) || '--' }}
            </text>
          </view>
          
          <!-- 买五档 -->
          <view class="bid-orders">
            <view 
              v-for="order in bidOrders" 
              :key="order.price"
              class="order-item"
            >
              <text class="price up">{{ order.price }}</text>
              <text class="volume">{{ order.volume }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 财务数据 -->
      <view v-if="activeTab === 'financial'" class="financial">
        <view class="financial-section">
          <view class="section-title">主要财务指标</view>
          <view class="financial-grid">
            <view class="financial-item">
              <text class="financial-label">每股收益</text>
              <text class="financial-value">{{ stockDetail?.eps?.toFixed(2) || '--' }}</text>
            </view>
            <view class="financial-item">
              <text class="financial-label">每股净资产</text>
              <text class="financial-value">{{ stockDetail?.navps?.toFixed(2) || '--' }}</text>
            </view>
            <view class="financial-item">
              <text class="financial-label">市净率</text>
              <text class="financial-value">{{ stockDetail?.pb?.toFixed(2) || '--' }}</text>
            </view>
            <view class="financial-item">
              <text class="financial-label">总股本</text>
              <text class="financial-value">{{ formatVolume(stockDetail?.totalShares) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 资讯 -->
      <view v-if="activeTab === 'news'" class="news">
        <view class="news-list">
          <view 
            v-for="news in newsList" 
            :key="news.id"
            class="news-item"
            @click="goToNewsDetail(news.id)"
          >
            <view class="news-content">
              <text class="news-title">{{ news.title }}</text>
              <view class="news-meta">
                <text class="news-source">{{ news.source }}</text>
                <text class="news-time">{{ formatTime(news.publishTime) }}</text>
              </view>
            </view>
            <image 
              v-if="news.image" 
              :src="news.image" 
              class="news-image" 
              mode="aspectFill"
            />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMarketStore } from '@/stores/useMarketStore'

const marketStore = useMarketStore()

const stockCode = ref('')
const stockDetail = ref<any>(null)
const newsList = ref<any[]>([])
const loading = ref(false)
const watchlist = ref<any[]>([])
const isInWatchlist = ref(false)

const tabs = [
  { key: 'time', name: '分时' },
  { key: 'kline', name: 'K线' },
  { key: 'orderbook', name: '五档' },
  { key: 'financial', name: '财务' },
  { key: 'news', name: '资讯' }
]

const periods = [
  { key: '1min', name: '1分' },
  { key: '5min', name: '5分' },
  { key: '15min', name: '15分' },
  { key: '30min', name: '30分' },
  { key: '1hour', name: '1小时' },
  { key: '1day', name: '日K' },
  { key: '1week', name: '周K' },
  { key: '1month', name: '月K' }
]

const activeTab = ref('time')
const activePeriod = ref('1day')

// 模拟五档数据
const askOrders = ref([
  { price: 25.68, volume: 1200 },
  { price: 25.67, volume: 800 },
  { price: 25.66, volume: 1500 },
  { price: 25.65, volume: 600 },
  { price: 25.64, volume: 900 }
])

const bidOrders = ref([
  { price: 25.62, volume: 700 },
  { price: 25.61, volume: 1100 },
  { price: 25.60, volume: 1300 },
  { price: 25.59, volume: 500 },
  { price: 25.58, volume: 800 }
])

const switchTab = (tab: string) => {
  activeTab.value = tab
}

const switchPeriod = (period: string) => {
  activePeriod.value = period
}

const formatVolume = (volume: number) => {
  if (!volume) return '--'
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(2) + '亿'
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(2) + '万'
  }
  return volume.toString()
}

const formatAmount = (amount: number) => {
  if (!amount) return '--'
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿'
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toString()
}

const formatTime = (time: string) => {
  if (!time) return '--'
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

const goToNewsDetail = (newsId: string) => {
  uni.navigateTo({
    url: `/pages/news/detail?id=${newsId}`
  })
}

// 自选股相关功能
const loadWatchlist = () => {
  try {
    const savedWatchlist = uni.getStorageSync('watchlist') || []
    watchlist.value = savedWatchlist
  } catch (error) {
    console.error('Load watchlist error:', error)
  }
}

const checkIfInWatchlist = () => {
  if (stockCode.value) {
    isInWatchlist.value = watchlist.value.some(item => item.code === stockCode.value)
  }
}

const toggleWatchlist = () => {
  try {
    if (!stockDetail.value) return
    
    if (isInWatchlist.value) {
      // 从自选股中移除
      const updatedWatchlist = watchlist.value.filter(item => item.code !== stockCode.value)
      watchlist.value = updatedWatchlist
      uni.setStorageSync('watchlist', updatedWatchlist)
      isInWatchlist.value = false
      uni.showToast({
        title: '已从自选股中移除',
        icon: 'success'
      })
    } else {
      // 添加到自选股
      const watchlistItem = {
        id: Date.now().toString(),
        code: stockCode.value,
        name: stockDetail.value.name,
        price: stockDetail.value.price,
        change: stockDetail.value.change,
        changePercent: stockDetail.value.changePercent,
        addedTime: Date.now()
      }
      
      const updatedWatchlist = [...watchlist.value, watchlistItem]
      watchlist.value = updatedWatchlist
      uni.setStorageSync('watchlist', updatedWatchlist)
      isInWatchlist.value = true
      uni.showToast({
        title: '已添加到自选股',
        icon: 'success'
      })
    }
  } catch (error) {
    console.error('Toggle watchlist error:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}

const loadStockDetail = async () => {
  if (!stockCode.value) return
  
  loading.value = true
  
  try {
    const detail = await marketStore.getStockDetail(stockCode.value)
    stockDetail.value = detail
    // 检查是否在自选股中
    checkIfInWatchlist()
  } catch (error) {
    console.error('加载股票详情失败:', error)
  } finally {
    loading.value = false
  }
}

const loadNewsList = async () => {
  if (!stockCode.value) return
  
  try {
    // Note: This API method doesn't exist in the store yet, we'll implement it later
    // For now, let's use empty data
    newsList.value = []
  } catch (error) {
    console.error('加载股票资讯失败:', error)
    newsList.value = []
  }
}

onMounted(() => {
  // 获取URL参数
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1] as any
    const options = currentPage.options || {}
    
    if (options.code) {
      stockCode.value = options.code
      loadWatchlist()
      loadStockDetail()
      loadNewsList()
    }
  }
})
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.stock-header {
  background-color: #fff;
  padding: 30rpx;
  border-bottom: 1px solid #e8e8e8;
}

.stock-info {
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.watchlist-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx;
  border-radius: 8rpx;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.watchlist-btn:active {
  background-color: #e9ecef;
  transform: scale(0.95);
}

.watchlist-btn.added {
  background-color: #fff4e6;
  border-color: #ff9500;
}

.watchlist-text {
  font-size: 22rpx;
  color: #666;
  text-align: center;
}

.watchlist-btn.added .watchlist-text {
  color: #ff9500;
}

.stock-name-info {
  display: flex;
  align-items: baseline;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.stock-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.stock-code {
  font-size: 24rpx;
  color: #999;
}

.stock-price-info {
  display: flex;
  align-items: baseline;
  gap: 20rpx;
}

.current-price {
  font-size: 48rpx;
  font-weight: bold;
}

.price-change-info {
  display: flex;
  flex-direction: column;
}

.price-change {
  font-size: 28rpx;
}

.price-change-percent {
  font-size: 24rpx;
}

.stock-extra {
  display: flex;
  justify-content: space-between;
}

.extra-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.extra-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.extra-value {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
}

.detail-tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #1890ff;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background-color: #1890ff;
}

.detail-content {
  padding: 20rpx;
}

.chart-container {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.chart-canvas {
  width: 100%;
  height: 400rpx;
}

.chart-info {
  display: flex;
  justify-content: space-around;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
}

.kline-periods {
  display: flex;
  background-color: #fff;
  border-radius: 12rpx 12rpx 0 0;
  padding: 20rpx;
  flex-wrap: wrap;
  gap: 15rpx;
}

.period-item {
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #666;
  background-color: #f5f5f5;
}

.period-item.active {
  background-color: #1890ff;
  color: #fff;
}

.orderbook {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}

.orderbook-header {
  padding: 20rpx;
  border-bottom: 1px solid #f0f0f0;
}

.orderbook-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.orderbook-content {
  padding: 20rpx;
}

.ask-orders,
.bid-orders {
  margin-bottom: 20rpx;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15rpx 0;
  border-bottom: 1px solid #f8f8f8;
}

.order-item:last-child {
  border-bottom: none;
}

.price {
  font-size: 28rpx;
  font-weight: bold;
}

.volume {
  font-size: 26rpx;
  color: #666;
}

.current-price-line {
  display: flex;
  justify-content: center;
  padding: 20rpx 0;
  border-top: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  margin: 20rpx 0;
}

.current-price {
  font-size: 32rpx;
  font-weight: bold;
}

.financial-section {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.financial-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.financial-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 8rpx;
}

.financial-label {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.financial-value {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.news-list {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}

.news-item {
  display: flex;
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.news-item:last-child {
  border-bottom: none;
}

.news-content {
  flex: 1;
  margin-right: 20rpx;
}

.news-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  line-height: 1.4;
}

.news-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.news-source {
  font-size: 24rpx;
  color: #999;
}

.news-time {
  font-size: 24rpx;
  color: #999;
}

.news-image {
  width: 120rpx;
  height: 80rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.up {
  color: #ff4d4f;
}

.down {
  color: #52c41a;
}
</style>