<template>
  <view class="search-container">
    <view class="search-header">
      <view class="search-bar">
        <view class="search-input-wrapper">
          <text class="search-icon">🔍</text>
          <input 
            class="search-input"
            v-model="searchKeyword"
            placeholder="搜索股票代码/名称"
            @input="onSearchInput"
            @confirm="onSearchConfirm"
            focus
          />
        </view>
        <text class="cancel-btn" @click="goBack">取消</text>
      </view>
    </view>
    
    <view class="search-content">
      <!-- 搜索历史 -->
      <view v-if="!searchKeyword && searchHistory.length > 0" class="search-history">
        <view class="section-header">
          <text class="section-title">搜索历史</text>
          <text class="clear-btn" @click="clearHistory">清空</text>
        </view>
        <view class="history-list">
          <view 
            v-for="item in searchHistory" 
            :key="item"
            class="history-item"
            @click="selectHistory(item)"
          >
            {{ item }}
          </view>
        </view>
      </view>
      
      <!-- 热门搜索 -->
      <view v-if="!searchKeyword" class="hot-search">
        <view class="section-header">
          <text class="section-title">热门搜索</text>
        </view>
        <view class="hot-list">
          <view 
            v-for="item in hotSearches" 
            :key="item"
            class="hot-item"
            @click="selectHot(item)"
          >
            {{ item }}
          </view>
        </view>
      </view>
      
      <!-- 搜索结果 -->
      <view v-if="searchKeyword && searchResults.length > 0" class="search-results">
        <view class="results-header">
          <text class="results-title">搜索结果</text>
          <text class="results-count">共 {{ searchResults.length }} 条</text>
        </view>
        <view class="results-list">
          <view 
            v-for="stock in searchResults" 
            :key="stock.code"
            class="result-item"
            @click="selectStock(stock)"
          >
            <view class="stock-info">
              <text class="stock-name">{{ stock.name }}</text>
              <text class="stock-code">{{ stock.code }}</text>
            </view>
            <view class="stock-price">
              <text class="current-price" :class="stock.change >= 0 ? 'up' : 'down'">
                {{ stock.price?.toFixed(2) || '--' }}
              </text>
              <text class="price-change" :class="stock.change >= 0 ? 'up' : 'down'">
                {{ stock.change >= 0 ? '+' : '' }}{{ stock.change?.toFixed(2) || '--' }}
                ({{ stock.changePercent >= 0 ? '+' : '' }}{{ stock.changePercent?.toFixed(2) || '--' }}%)
              </text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 无搜索结果 -->
      <view v-if="searchKeyword && searchResults.length === 0 && !loading" class="no-results">
        <text class="no-results-text">未找到相关股票</text>
        <text class="no-results-hint">请尝试其他关键词</text>
      </view>
      
      <!-- 加载中 -->
      <view v-if="loading" class="loading">
        <text class="loading-text">搜索中...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMarketStore } from '@/stores/useMarketStore'

const marketStore = useMarketStore()

const searchKeyword = ref('')
const searchResults = ref<any[]>([])
const searchHistory = ref<string[]>([])
const loading = ref(false)

const hotSearches = [
  '贵州茅台',
  '宁德时代',
  '比亚迪',
  '中国平安',
  '招商银行',
  '腾讯控股',
  '阿里巴巴',
  '美团',
  '京东',
  '拼多多'
]

let searchTimer: any = null

const onSearchInput = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  if (searchKeyword.value.trim()) {
    searchTimer = setTimeout(() => {
      performSearch()
    }, 500)
  }
}

const onSearchConfirm = () => {
  performSearch()
}

const performSearch = async () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return
  
  loading.value = true
  
  try {
    const results = await marketStore.searchStocks(keyword)
    searchResults.value = results
    
    // 添加到搜索历史
    addToHistory(keyword)
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
  } finally {
    loading.value = false
  }
}

const addToHistory = (keyword: string) => {
  // 避免重复
  const index = searchHistory.value.indexOf(keyword)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
  }
  
  // 添加到开头
  searchHistory.value.unshift(keyword)
  
  // 限制历史记录数量
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10)
  }
  
  // 保存到本地存储
  uni.setStorageSync('search_history', searchHistory.value)
}

const selectHistory = (keyword: string) => {
  searchKeyword.value = keyword
  performSearch()
}

const selectHot = (keyword: string) => {
  searchKeyword.value = keyword
  performSearch()
}

const selectStock = (stock: any) => {
  // 跳转到股票详情页
  uni.navigateTo({
    url: `/pages/market/detail?code=${stock.code}`
  })
}

const clearHistory = () => {
  searchHistory.value = []
  uni.removeStorageSync('search_history')
}

const goBack = () => {
  uni.navigateBack()
}

onMounted(() => {
  // 加载搜索历史
  const history = uni.getStorageSync('search_history')
  if (history) {
    searchHistory.value = history
  }
})
</script>

<style scoped>
.search-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.search-header {
  background-color: #fff;
  padding: 20rpx 30rpx;
  border-bottom: 1px solid #e8e8e8;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 25rpx;
  padding: 15rpx 20rpx;
}

.search-icon {
  font-size: 28rpx;
  margin-right: 10rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  background: none;
  border: none;
  outline: none;
}

.cancel-btn {
  font-size: 28rpx;
  color: #1890ff;
  padding: 10rpx;
}

.search-content {
  padding: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.clear-btn {
  font-size: 24rpx;
  color: #999;
}

.search-history,
.hot-search {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.history-list,
.hot-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.history-item,
.hot-item {
  background-color: #f5f5f5;
  padding: 15rpx 25rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #666;
}

.hot-item {
  background-color: #fff0f0;
  color: #ff4d4f;
}

.search-results {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1px solid #f0f0f0;
}

.results-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.results-count {
  font-size: 24rpx;
  color: #999;
}

.results-list {
  max-height: 800rpx;
  overflow-y: auto;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.result-item:last-child {
  border-bottom: none;
}

.stock-info {
  display: flex;
  flex-direction: column;
}

.stock-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.stock-code {
  font-size: 24rpx;
  color: #999;
}

.stock-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

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

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  background-color: #fff;
  border-radius: 12rpx;
}

.no-results-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.no-results-hint {
  font-size: 24rpx;
  color: #ccc;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
  background-color: #fff;
  border-radius: 12rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}
</style>