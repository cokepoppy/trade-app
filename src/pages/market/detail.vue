<template>
  <view class="detail-container">
    <!-- 下拉刷新 -->
    <scroll-view 
      scroll-y 
      class="scroll-container"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <uni-icons type="arrowleft" size="24" color="#333"></uni-icons>
      </view>
      <view class="nav-title">
        <text class="nav-title-text">{{ stockDetail?.name || '股票详情' }}</text>
      </view>
      <view class="nav-right">
        <uni-icons type="more" size="24" color="#333"></uni-icons>
      </view>
    </view>

    <!-- 错误提示 -->
    <view v-if="error" class="error-container">
      <text class="error-message">{{ error }}</text>
      <view class="error-actions">
        <text class="retry-btn" @click="retryLoadData">重试</text>
        <text class="error-close" @click="error = null">×</text>
      </view>
    </view>

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
          <view v-if="loading" class="chart-loading">
            <uni-icons type="spinner-cycle" size="24" color="#999"></uni-icons>
            <text class="loading-text">加载中...</text>
          </view>
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
          <view v-if="loading" class="chart-loading">
            <uni-icons type="spinner-cycle" size="24" color="#999"></uni-icons>
            <text class="loading-text">加载中...</text>
          </view>
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
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMarketStore } from '@/stores/useMarketStore'
import { marketService } from '@/services/marketService'
import { createRealTimeDataManager } from '@/services/realTimeDataManager'
import type { RealTimeStockData, TimeShareData, KLineData, MarketDepth } from '@/types'

const marketStore = useMarketStore()

const stockCode = ref('')
const stockDetail = ref<any>(null)
const newsList = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const error = ref<string | null>(null)
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
  
  // 根据标签加载相应的数据
  switch (tab) {
    case 'time':
      loadTimeShareData()
      break
    case 'kline':
      loadKLineData()
      break
    case 'orderbook':
      loadOrderBookData()
      break
    case 'news':
      loadNewsList()
      break
    case 'financial':
      // 财务数据已经在股票详情中包含
      break
  }
}

const switchPeriod = (period: string) => {
  activePeriod.value = period
  // 如果当前在K线图标签，重新加载数据
  if (activeTab.value === 'kline') {
    loadKLineData()
  }
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

// 返回上一页
const goBack = () => {
  uni.navigateBack()
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
  error.value = null
  
  try {
    const detail = await marketStore.getStockDetail(stockCode.value)
    stockDetail.value = detail
    // 检查是否在自选股中
    checkIfInWatchlist()
  } catch (err) {
    console.error('加载股票详情失败:', err)
    error.value = '加载股票详情失败，请重试'
  } finally {
    loading.value = false
  }
}

const loadNewsList = async () => {
  if (!stockCode.value) return
  
  try {
    const response = await marketService.getStockNews(stockCode.value, { page: 1, pageSize: 10 })
    newsList.value = response.data.list || []
  } catch (error) {
    console.error('加载股票资讯失败:', error)
    newsList.value = []
  }
}

const loadTimeShareData = async () => {
  if (!stockCode.value) return
  
  loading.value = true
  
  try {
    const response = await marketService.getStockTimeShare(stockCode.value)
    // 这里应该调用图表绘制函数
    drawTimeShareChart(response.data)
  } catch (err) {
    console.error('加载分时数据失败:', err)
    // 如果API调用失败，使用模拟数据
    console.log('使用模拟分时数据')
    drawTimeShareChart([])
  } finally {
    loading.value = false
  }
}

const loadKLineData = async () => {
  if (!stockCode.value) return
  
  loading.value = true
  
  try {
    const response = await marketService.getStockKLine({
      code: stockCode.value,
      period: activePeriod.value,
      type: 'kline'
    })
    // 这里应该调用K线图绘制函数
    drawKLineChart(response.data)
  } catch (err) {
    console.error('加载K线数据失败:', err)
    // 如果API调用失败，使用模拟数据
    console.log('使用模拟K线数据')
    drawKLineChart([])
  } finally {
    loading.value = false
  }
}

const loadOrderBookData = async () => {
  if (!stockCode.value) return
  
  loading.value = true
  
  try {
    const response = await marketService.getStockOrderBook(stockCode.value, 5)
    const orderBookData = response.data
    
    // 更新五档数据
    askOrders.value = orderBookData.asks || []
    bidOrders.value = orderBookData.bids || []
  } catch (err) {
    console.error('加载五档数据失败:', err)
    error.value = '加载五档数据失败，请重试'
  } finally {
    loading.value = false
  }
}

// 图表绘制函数
const drawTimeShareChart = (data: any[]) => {
  try {
    // 使用 uni-app 的 canvas API 绘制分时图
    const ctx = uni.createCanvasContext('time-share-chart')
    
    // 清空画布
    ctx.clearRect(0, 0, 750, 400)
    
    if (!data || data.length === 0) {
      // 如果没有数据，显示提示文字
      ctx.setFontSize(14)
      ctx.setFillStyle('#999')
      ctx.setTextAlign('center')
      ctx.fillText('暂无数据', 375, 200)
      ctx.draw()
      return
    }
    
    // 模拟分时数据格式
    const timeShareData = data.length > 0 ? data : generateMockTimeShareData()
    
    // 计算价格范围
    const prices = timeShareData.map((item: any) => item.price)
    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const priceRange = maxPrice - minPrice || 1
    
    // 画布尺寸
    const canvasWidth = 750
    const canvasHeight = 400
    const padding = 40
    const chartWidth = canvasWidth - padding * 2
    const chartHeight = canvasHeight - padding * 2
    
    // 绘制网格
    ctx.setStrokeStyle('#e0e0e0')
    ctx.setLineWidth(1)
    
    // 横向网格线
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(canvasWidth - padding, y)
      ctx.stroke()
    }
    
    // 纵向网格线
    for (let i = 0; i <= 8; i++) {
      const x = padding + (chartWidth / 8) * i
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, canvasHeight - padding)
      ctx.stroke()
    }
    
    // 绘制分时线
    ctx.setStrokeStyle('#1890ff')
    ctx.setLineWidth(2)
    ctx.beginPath()
    
    timeShareData.forEach((item: any, index: number) => {
      const x = padding + (chartWidth / (timeShareData.length - 1)) * index
      const y = padding + chartHeight - ((item.price - minPrice) / priceRange) * chartHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    
    ctx.stroke()
    
    // 绘制价格标签
    ctx.setFontSize(12)
    ctx.setFillStyle('#666')
    ctx.setTextAlign('right')
    
    for (let i = 0; i <= 4; i++) {
      const price = maxPrice - (priceRange / 4) * i
      const y = padding + (chartHeight / 4) * i
      ctx.fillText(price.toFixed(2), padding - 10, y + 4)
    }
    
    // 绘制时间标签
    ctx.setTextAlign('center')
    
    for (let i = 0; i <= 4; i++) {
      const timeIndex = Math.floor((timeShareData.length - 1) / 4) * i
      const time = timeShareData[timeIndex]?.time || ''
      const x = padding + (chartWidth / 4) * i
      ctx.fillText(time, x, canvasHeight - 10)
    }
    
    ctx.draw()
    
  } catch (error) {
    console.error('绘制分时图失败:', error)
  }
}

const drawKLineChart = (data: any[]) => {
  try {
    // 使用 uni-app 的 canvas API 绘制K线图
    const ctx = uni.createCanvasContext('kline-chart')
    
    // 清空画布
    ctx.clearRect(0, 0, 750, 400)
    
    if (!data || data.length === 0) {
      // 如果没有数据，显示提示文字
      ctx.setFontSize(14)
      ctx.setFillStyle('#999')
      ctx.setTextAlign('center')
      ctx.fillText('暂无数据', 375, 200)
      ctx.draw()
      return
    }
    
    // 模拟K线数据格式
    const klineData = data.length > 0 ? data : generateMockKLineData()
    
    // 计算价格范围
    const prices = klineData.map((item: any) => [item.high, item.low]).flat()
    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const priceRange = maxPrice - minPrice || 1
    
    // 画布尺寸
    const canvasWidth = 750
    const canvasHeight = 400
    const padding = 40
    const chartWidth = canvasWidth - padding * 2
    const chartHeight = canvasHeight - padding * 2
    
    // 计算K线宽度
    const candleWidth = chartWidth / klineData.length * 0.8
    const candleSpacing = chartWidth / klineData.length * 0.2
    
    // 绘制网格
    ctx.setStrokeStyle('#e0e0e0')
    ctx.setLineWidth(1)
    
    // 横向网格线
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(canvasWidth - padding, y)
      ctx.stroke()
    }
    
    // 绘制K线
    klineData.forEach((item: any, index: number) => {
      const x = padding + (candleWidth + candleSpacing) * index + candleSpacing / 2
      const centerY = padding + chartHeight - ((item.close - minPrice) / priceRange) * chartHeight
      const highY = padding + chartHeight - ((item.high - minPrice) / priceRange) * chartHeight
      const lowY = padding + chartHeight - ((item.low - minPrice) / priceRange) * chartHeight
      const openY = padding + chartHeight - ((item.open - minPrice) / priceRange) * chartHeight
      
      // 设置颜色
      const isUp = item.close >= item.open
      ctx.setStrokeStyle(isUp ? '#ff4d4f' : '#52c41a')
      ctx.setFillStyle(isUp ? '#ff4d4f' : '#52c41a')
      
      // 绘制影线
      ctx.setLineWidth(1)
      ctx.beginPath()
      ctx.moveTo(x + candleWidth / 2, highY)
      ctx.lineTo(x + candleWidth / 2, lowY)
      ctx.stroke()
      
      // 绘制实体
      const bodyTop = Math.min(openY, centerY)
      const bodyHeight = Math.abs(centerY - openY)
      
      if (bodyHeight > 2) {
        ctx.fillRect(x, bodyTop, candleWidth, bodyHeight)
      } else {
        // 如果实体太小，绘制一条线
        ctx.beginPath()
        ctx.moveTo(x, bodyTop)
        ctx.lineTo(x + candleWidth, bodyTop)
        ctx.stroke()
      }
    })
    
    // 绘制价格标签
    ctx.setFontSize(12)
    ctx.setFillStyle('#666')
    ctx.setTextAlign('right')
    
    for (let i = 0; i <= 4; i++) {
      const price = maxPrice - (priceRange / 4) * i
      const y = padding + (chartHeight / 4) * i
      ctx.fillText(price.toFixed(2), padding - 10, y + 4)
    }
    
    ctx.draw()
    
  } catch (error) {
    console.error('绘制K线图失败:', error)
  }
}

// 生成模拟分时数据
const generateMockTimeShareData = () => {
  const data = []
  const basePrice = 25.65
  let currentPrice = basePrice
  
  // 生成一天的分时数据（每分钟一个数据点）
  for (let i = 0; i < 240; i++) {
    // 模拟价格波动
    const change = (Math.random() - 0.5) * 0.1
    currentPrice += change
    
    // 生成时间
    const hour = Math.floor(i / 60) + 9
    const minute = i % 60
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    
    data.push({
      time,
      price: currentPrice,
      volume: Math.floor(Math.random() * 1000) + 100
    })
  }
  
  return data
}

// 生成模拟K线数据
const generateMockKLineData = () => {
  const data = []
  let basePrice = 25.65
  
  // 生成30天的K线数据
  for (let i = 0; i < 30; i++) {
    const open = basePrice + (Math.random() - 0.5) * 0.5
    const change = (Math.random() - 0.5) * 1.0
    const close = open + change
    const high = Math.max(open, close) + Math.random() * 0.3
    const low = Math.min(open, close) - Math.random() * 0.3
    const volume = Math.floor(Math.random() * 100000) + 50000
    
    data.push({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      open,
      close,
      high,
      low,
      volume
    })
    
    basePrice = close
  }
  
  return data
}

const retryLoadData = () => {
  error.value = null
  switch (activeTab.value) {
    case 'time':
      loadTimeShareData()
      break
    case 'kline':
      loadKLineData()
      break
    case 'orderbook':
      loadOrderBookData()
      break
    case 'news':
      loadNewsList()
      break
  }
}

const onRefresh = async () => {
  refreshing.value = true
  error.value = null
  
  try {
    await Promise.all([
      loadStockDetail(),
      loadNewsList(),
      // 根据当前标签刷新相应的数据
      activeTab.value === 'time' ? loadTimeShareData() :
      activeTab.value === 'kline' ? loadKLineData() :
      activeTab.value === 'orderbook' ? loadOrderBookData() : Promise.resolve()
    ])
  } catch (error) {
    console.error('刷新数据失败:', error)
  } finally {
    refreshing.value = false
  }
}

// RealTimeDataManager相关
let realTimeDataManager: any = null
let subscriptions: string[] = []

// 初始化RealTimeDataManager
const initRealTimeDataManager = () => {
  try {
    if (!stockCode.value) return
    
    realTimeDataManager = createRealTimeDataManager({
      url: 'ws://localhost:3000',
      enableLogging: true
    })
    
    const manager = realTimeDataManager.initialize()
    
    // 监听连接事件
    manager.on('connected', () => {
      console.log('RealTimeDataManager连接已建立')
      // 连接成功后订阅数据
      if (stockCode.value) {
        setTimeout(() => {
          subscribeToStockData(manager)
        }, 1000)
      }
    })
    
    // 监听股票数据更新
    manager.on('stock_update', (data: any) => {
      if (stockDetail.value && data.code === stockCode.value) {
        stockDetail.value.price = data.price
        stockDetail.value.change = data.change
        stockDetail.value.changePercent = data.changePercent
        stockDetail.value.high = data.high
        stockDetail.value.low = data.low
        stockDetail.value.volume = data.volume
        stockDetail.value.amount = data.amount
      }
    })
    
    // 监听分时数据更新
    manager.on('timeshare_update', (data: any) => {
      if (data.code === stockCode.value && activeTab.value === 'time') {
        drawTimeShareChart(data.data)
      }
    })
    
    // 监听K线数据更新
    manager.on('kline_update', (data: any) => {
      if (data.code === stockCode.value && activeTab.value === 'kline') {
        drawKLineChart(data.data)
      }
    })
    
    // 监听深度数据更新
    manager.on('depth_update', (data: any) => {
      if (data.code === stockCode.value) {
        askOrders.value = data.asks || []
        bidOrders.value = data.bids || []
      }
    })
    
    // 监听订阅确认
    manager.on('subscription_ack', (data: any) => {
      console.log('订阅确认:', data)
    })
    
    // 监听心跳
    manager.on('heartbeat', () => {
      // 心跳消息，忽略
    })
    
    // 监听错误
    manager.on('error', (error: any) => {
      console.error('RealTimeDataManager连接错误:', error)
    })
    
    // 监听断开连接
    manager.on('disconnected', () => {
      console.log('RealTimeDataManager连接已关闭')
    })
    
    // 开始连接
    manager.connect()
    
    return manager
  } catch (error) {
    console.error('初始化RealTimeDataManager失败:', error)
    return null
  }
}

// 订阅股票数据
const subscribeToStockData = (manager: any) => {
  if (!manager || !stockCode.value) return
  
  try {
    // 订阅股票实时数据
    const stockSubscription = manager.subscribeToStocks([stockCode.value])
    subscriptions.push(stockSubscription)
    
    // 订阅分时数据
    const timeShareSubscription = manager.subscribeToTimeShare(stockCode.value)
    subscriptions.push(timeShareSubscription)
    
    // 订阅K线数据
    const klineSubscription = manager.subscribeToKLine(stockCode.value, '1day')
    subscriptions.push(klineSubscription)
    
    // 订阅深度数据
    const depthSubscription = manager.subscribeToMarketDepth(stockCode.value)
    subscriptions.push(depthSubscription)
    
    console.log('已发送订阅请求')
  } catch (error) {
    console.error('订阅数据失败:', error)
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
      // 默认加载分时图数据
      loadTimeShareData()
      // 初始化RealTimeDataManager连接
      initRealTimeDataManager()
    }
  }
})

onUnmounted(() => {
  // 清理RealTimeDataManager连接
  if (realTimeDataManager) {
    realTimeDataManager.cleanup()
    realTimeDataManager = null
  }
  subscriptions = []
})
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.scroll-container {
  height: 100vh;
}

.error-container {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8rpx;
  margin: 20rpx;
  padding: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message {
  color: #ff4d4f;
  font-size: 26rpx;
  flex: 1;
}

.error-actions {
  display: flex;
  gap: 20rpx;
}

.retry-btn {
  color: #1890ff;
  font-size: 24rpx;
  cursor: pointer;
}

.error-close {
  color: #999;
  font-size: 30rpx;
  cursor: pointer;
  font-weight: bold;
}

.nav-bar {
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left,
.nav-right {
  width: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  flex: 1;
  text-align: center;
}

.nav-title-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
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
  position: relative;
}

.chart-canvas {
  width: 100%;
  height: 400rpx;
  background-color: #fff;
  border-radius: 8rpx;
}

.chart-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.loading-text {
  font-size: 24rpx;
  color: #999;
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