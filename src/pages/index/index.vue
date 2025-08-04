<template>
  <view class="app-container">
    <view class="home-container">
      <Header />
      
      <view class="home-content">
        <MarketIndices />
        <QuickActions />
        <Watchlist />
        
        <view class="market-hotspots">
          <view class="section-header">
            <text class="section-title">市场热点</text>
            <text class="view-all" @click="navigateToMarket">查看全部</text>
          </view>
          
          <view class="hotspots-list">
            <view 
              v-for="hotspot in marketHotspots" 
              :key="hotspot.id" 
              class="hotspot-item"
              @click="handleHotspotClick(hotspot)"
            >
              <view class="hotspot-info">
                <text class="hotspot-title">{{ hotspot.title }}</text>
                <text class="hotspot-desc">{{ hotspot.description }}</text>
              </view>
              <view class="hotspot-meta">
                <text class="hotspot-time">{{ formatRelativeTime(hotspot.timestamp) }}</text>
                <text class="hotspot-count">{{ hotspot.readCount }}阅读</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <Footer />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'
import MarketIndices from '@/components/market/MarketIndices.vue'
import QuickActions from '@/components/market/QuickActions.vue'
import Watchlist from '@/components/market/Watchlist.vue'
import { useMarketStore } from '@/stores/useMarketStore'
import { useAppStore } from '@/stores/useAppStore'
import { formatRelativeTime } from '@/utils/date'

const marketStore = useMarketStore()
const appStore = useAppStore()

const marketHotspots = computed(() => [
  {
    id: '1',
    title: 'A股市场今日表现',
    description: '沪指涨跌互现，创业板指领涨',
    timestamp: Date.now() - 1000 * 60 * 30,
    readCount: 15234
  },
  {
    id: '2',
    title: '新能源板块集体拉升',
    description: '锂电池、光伏概念股涨幅居前',
    timestamp: Date.now() - 1000 * 60 * 60,
    readCount: 8921
  },
  {
    id: '3',
    title: '北向资金动向',
    description: '外资今日净流入超50亿元',
    timestamp: Date.now() - 1000 * 60 * 90,
    readCount: 6782
  }
])

const navigateToMarket = () => {
  uni.switchTab({
    url: '/pages/market/index'
  })
}

const handleHotspotClick = (hotspot: any) => {
  uni.navigateTo({
    url: `/pages/news/detail?id=${hotspot.id}`
  })
}

onMounted(async () => {
  console.log('[index.vue] onMounted: 开始初始化市场数据')
  try {
    await marketStore.initialize()
    console.log('[index.vue] onMounted: 市场数据初始化完成')
  } catch (error) {
    console.error('[index.vue] onMounted error:', error)
  }
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 70px;
}

.home-content {
  padding: 16px;
}

.market-hotspots {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
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

.hotspots-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hotspot-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.hotspot-item:active {
  background-color: #f5f5f5;
}

.hotspot-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hotspot-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.hotspot-desc {
  font-size: 12px;
  color: #666;
}

.hotspot-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.hotspot-time {
  font-size: 10px;
  color: #999;
}

.hotspot-count {
  font-size: 10px;
  color: #666;
}
</style>