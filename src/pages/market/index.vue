<template>
  <view class="app-container">
    <view class="market-container">
    <view class="market-header">
      <text class="market-title">行情</text>
      <view class="search-icon" @click="goToSearch">
        <text class="icon">🔍</text>
      </view>
    </view>
    
    <view class="market-tabs">
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
    
    <view class="market-content">
      <!-- 指数行情 -->
      <view v-if="activeTab === 'indices'" class="indices-section">
        <view class="section-title">主要指数</view>
        <view class="indices-list">
          <view 
            v-for="index in mainIndices" 
            :key="index.code"
            class="index-item"
            @click="goToDetail(index.code)"
          >
            <view class="index-info">
              <text class="index-name">{{ index.name }}</text>
              <text class="index-code">{{ index.code }}</text>
            </view>
            <view class="index-price">
              <text class="price-value" :class="index.change >= 0 ? 'up' : 'down'">
                {{ (index as any).value?.toFixed(2) || '--' }}
              </text>
              <text class="price-change" :class="index.change >= 0 ? 'up' : 'down'">
                {{ index.change >= 0 ? '+' : '' }}{{ index.change?.toFixed(2) || '--' }}
                ({{ index.changePercent >= 0 ? '+' : '' }}{{ index.changePercent?.toFixed(2) || '--' }}%)
              </text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 热门股票 -->
      <view v-if="activeTab === 'hot'" class="hot-section">
        <view class="section-title">热门股票</view>
        <view class="hot-list">
          <view 
            v-for="stock in hotStocks" 
            :key="stock.code"
            class="stock-item"
            @click="goToDetail(stock.code)"
          >
            <view class="stock-info">
              <text class="stock-name">{{ stock.name }}</text>
              <text class="stock-code">{{ stock.code }}</text>
            </view>
            <view class="stock-price">
              <text class="current-price" :class="stock.change >= 0 ? 'up' : 'down'">
                {{ (stock as any).price?.toFixed(2) || '--' }}
              </text>
              <text class="price-change" :class="(stock as any).change >= 0 ? 'up' : 'down'">
                {{ (stock as any).change >= 0 ? '+' : '' }}{{ (stock as any).change?.toFixed(2) || '--' }}
                ({{ (stock as any).changePercent >= 0 ? '+' : '' }}{{ (stock as any).changePercent?.toFixed(2) || '--' }}%)
              </text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 涨幅榜 -->
      <view v-if="activeTab === 'gainers'" class="gainers-section">
        <view class="section-title">涨幅榜</view>
        <view class="gainers-list">
          <view 
            v-for="stock in topGainers" 
            :key="stock.code"
            class="stock-item"
            @click="goToDetail(stock.code)"
          >
            <view class="stock-info">
              <text class="stock-name">{{ stock.name }}</text>
              <text class="stock-code">{{ stock.code }}</text>
            </view>
            <view class="stock-price">
              <text class="current-price up">{{ (stock as any).price?.toFixed(2) || '--' }}</text>
              <text class="price-change up">
                +{{ (stock as any).change?.toFixed(2) || '--' }}
                (+{{ (stock as any).changePercent?.toFixed(2) || '--' }}%)
              </text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 跌幅榜 -->
      <view v-if="activeTab === 'losers'" class="losers-section">
        <view class="section-title">跌幅榜</view>
        <view class="losers-list">
          <view 
            v-for="stock in topLosers" 
            :key="stock.code"
            class="stock-item"
            @click="goToDetail(stock.code)"
          >
            <view class="stock-info">
              <text class="stock-name">{{ stock.name }}</text>
              <text class="stock-code">{{ stock.code }}</text>
            </view>
            <view class="stock-price">
              <text class="current-price down">{{ (stock as any).price?.toFixed(2) || '--' }}</text>
              <text class="price-change down">
                {{ (stock as any).change?.toFixed(2) || '--' }}
                ({{ (stock as any).changePercent?.toFixed(2) || '--' }}%)
              </text>
            </view>
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

const tabs = [
  { key: 'indices', name: '指数' },
  { key: 'hot', name: '热门' },
  { key: 'gainers', name: '涨幅' },
  { key: 'losers', name: '跌幅' }
]

const activeTab = ref('indices')

const mainIndices = computed(() => marketStore.mainIndices)
const hotStocks = computed(() => marketStore.hotStocks)
const topGainers = computed(() => marketStore.topGainers)
const topLosers = computed(() => marketStore.topLosers)

const switchTab = (tab: string) => {
  activeTab.value = tab
}

const goToSearch = () => {
  uni.navigateTo({
    url: '/pages/market/search'
  })
}

const goToDetail = (code: string) => {
  uni.navigateTo({
    url: `/pages/market/detail?code=${code}`
  })
}

onMounted(async () => {
  await marketStore.initialize()
})
</script>

<style scoped>
.market-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.market-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.market-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.search-icon {
  padding: 10rpx;
}

.icon {
  font-size: 32rpx;
}

.market-tabs {
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

.market-content {
  padding: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding: 0 10rpx;
}

.indices-list,
.hot-list,
.gainers-list,
.losers-list {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}

.index-item,
.stock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.index-item:last-child,
.stock-item:last-child {
  border-bottom: none;
}

.index-info,
.stock-info {
  display: flex;
  flex-direction: column;
}

.index-name,
.stock-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.index-code,
.stock-code {
  font-size: 24rpx;
  color: #999;
}

.index-price,
.stock-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.price-value,
.current-price {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.price-change {
  font-size: 24rpx;
}

.up {
  color: #ff4d4f;
}

.down {
  color: #52c41a;
}
</style>
  </view>
</view>