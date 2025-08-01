<template>
  <view class="market-indices">
    <view class="indices-header">
      <text class="section-title">市场指数</text>
      <view class="refresh-btn" @tap="handleRefresh">
        <uni-icons :type="isRefreshing ? 'spinner-cycle' : 'refresh'" size="16" color="#666"></uni-icons>
      </view>
    </view>
    
    <view class="indices-content">
      <view 
        v-for="index in mainIndices" 
        :key="index.code" 
        class="index-item"
        @tap="handleIndexClick(index)"
      >
        <view class="index-info">
          <text class="index-name">{{ index.name }}</text>
          <text class="index-code">{{ formatStockCode(index.code) }}</text>
        </view>
        
        <view class="index-data">
          <text class="index-price" :class="getColorClass(index.change)">
            {{ formatNumber(index.price) }}
          </text>
          <text class="index-change" :class="getColorClass(index.change)">
            {{ formatChange(index.change) }}
          </text>
          <text class="index-change-percent" :class="getColorClass(index.change)">
            {{ formatChangePercent(index.changePercent) }}
          </text>
        </view>
        
        <view v-if="index.trendData" class="index-chart">
          <view class="mini-chart">
            <text class="chart-placeholder">图表</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="indices-footer" @tap="handleViewAll">
      <text class="view-all-text">查看全部指数</text>
      <uni-icons type="arrowright" size="14" color="#666"></uni-icons>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMarketStore } from '@/stores/useMarketStore'
import { formatNumber, formatChange, formatChangePercent, getColorClass, formatStockCode } from '@/utils/format'

const marketStore = useMarketStore()
const isRefreshing = ref(false)

const mainIndices = computed(() => {
  return marketStore.mainIndices.map(index => ({
    ...index,
    trendData: generateTrendData(index.changePercent)
  }))
})

const generateTrendData = (changePercent: number) => {
  const isPositive = changePercent >= 0
  const points = []
  const baseValue = 100
  
  for (let i = 0; i < 20; i++) {
    const variation = (Math.random() - 0.5) * 10
    const trend = isPositive ? i * 0.5 : -i * 0.5
    points.push(baseValue + variation + trend)
  }
  
  return points
}

const handleRefresh = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    await marketStore.refreshMarketData()
  } catch (error) {
    console.error('Refresh indices error:', error)
  } finally {
    isRefreshing.value = false
  }
}

const handleIndexClick = (index: any) => {
  uni.navigateTo({
    url: `/pages/market/index-detail?code=${index.code}&name=${index.name}`
  })
}

const handleViewAll = () => {
  uni.navigateTo({
    url: '/pages/market/indices'
  })
}

onMounted(async () => {
  if (marketStore.indices.length === 0) {
    await marketStore.initialize()
  }
})
</script>

<style scoped>
.market-indices {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.indices-header {
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

.refresh-btn {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.refresh-btn:active {
  background-color: #f5f5f5;
}

.indices-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.index-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.index-item:active {
  background-color: #f5f5f5;
}

.index-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.index-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.index-code {
  font-size: 12px;
  color: #999;
}

.index-data {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.index-price {
  font-size: 16px;
  font-weight: 600;
}

.index-change {
  font-size: 12px;
}

.index-change-percent {
  font-size: 12px;
}

.index-chart {
  flex: 0 0 60px;
  height: 30px;
  margin-left: 12px;
}

.mini-chart {
  width: 100%;
  height: 100%;
  background-color: #f8f9fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  font-size: 10px;
  color: #999;
}

.indices-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.indices-footer:active {
  opacity: 0.7;
}

.view-all-text {
  font-size: 12px;
  color: #666;
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