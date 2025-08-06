<template>
  <view class="watchlist-page">
    <view class="page-header">
      <view class="header-content">
        <view class="back-btn" @click="goBack">
          
        </view>
        <text class="page-title">自选股管理</text>
        <view class="header-actions">
          <view class="action-btn" @click="handleAddStock">
            
          </view>
        </view>
      </view>
    </view>
    
    <view class="page-content">
      <view v-if="watchlistItems.length > 0" class="watchlist-content">
        <view 
          v-for="stock in watchlistItems" 
          :key="stock.id" 
          class="stock-item"
          @click="handleStockClick(stock)"
        >
          <view class="stock-info">
            <text class="stock-name">{{ stock.name }}</text>
            <text class="stock-code">{{ formatStockCode(stock.code) }}</text>
          </view>
          
          <view class="stock-data">
            <text class="stock-price" :class="getColorClass(stock.change)">
              {{ formatNumber(stock.price) }}
            </text>
            <text class="stock-change" :class="getColorClass(stock.change)">
              {{ formatChange(stock.change) }}
            </text>
            <text class="stock-change-percent" :class="getColorClass(stock.change)">
              {{ formatChangePercent(stock.changePercent) }}
            </text>
          </view>
          
          <view class="stock-actions">
            <view class="action-icon" @click.stop="handleRemoveStock(stock)">
              
            </view>
          </view>
        </view>
      </view>
      
      <view v-else class="empty-state">
        <view class="empty-content">
          
          <text class="empty-text">暂无自选股</text>
          <text class="empty-desc">点击添加按钮添加自选股</text>
          <view class="add-btn" @click="handleAddStock">
            <text class="add-btn-text">添加自选股</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { marketService } from '@/services/marketService'
import { formatNumber, formatChange, formatChangePercent, getColorClass, formatStockCode } from '@/utils/format'

const watchlistItems = ref<any[]>([])

const loadWatchlist = async () => {
  try {
    const savedWatchlist = uni.getStorageSync('watchlist') || []
    watchlistItems.value = savedWatchlist
    
    if (savedWatchlist.length > 0) {
      const codes = savedWatchlist.map((item: any) => item.code)
      const quotes = await marketService.batchGetStockQuotes(codes)
      
      watchlistItems.value = savedWatchlist.map((item: any) => {
        const quote = quotes.data.find((q: any) => q.code === item.code)
        return {
          ...item,
          ...quote
        }
      })
    }
  } catch (error) {
    console.error('Load watchlist error:', error)
  }
}

const handleAddStock = () => {
  uni.navigateTo({
    url: '/pages/market/search?mode=add'
  })
}

const handleStockClick = (stock: any) => {
  uni.navigateTo({
    url: `/pages/market/detail?code=${stock.code}&name=${stock.name}`
  })
}

const handleRemoveStock = async (stock: any) => {
  try {
    const updatedWatchlist = watchlistItems.value.filter(item => item.id !== stock.id)
    watchlistItems.value = updatedWatchlist
    uni.setStorageSync('watchlist', updatedWatchlist)
    
    uni.showToast({
      title: '已从自选股中移除',
      icon: 'success'
    })
  } catch (error) {
    console.error('Remove stock error:', error)
  }
}

const goBack = () => {
  uni.navigateBack()
}

onMounted(() => {
  loadWatchlist()
})
</script>

<style scoped>
.watchlist-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.page-header {
  background-color: #fff;
  padding: 20rpx 30rpx;
  border-bottom: 1px solid #e8e8e8;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.back-btn:active {
  background-color: #f5f5f5;
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.header-actions {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-btn:active {
  background-color: #f5f5f5;
}

.page-content {
  padding: 20rpx;
}

.watchlist-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.stock-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.stock-item:active {
  background-color: #f5f5f5;
}

.stock-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.stock-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.stock-code {
  font-size: 24rpx;
  color: #999;
}

.stock-data {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.stock-price {
  font-size: 36rpx;
  font-weight: 600;
}

.stock-change {
  font-size: 24rpx;
}

.stock-change-percent {
  font-size: 24rpx;
}

.stock-actions {
  flex: 0 0 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-icon:active {
  background-color: #f5f5f5;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100rpx 40rpx;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  text-align: center;
}

.empty-desc {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  margin-bottom: 20rpx;
}

.add-btn {
  background-color: #1890ff;
  color: white;
  padding: 20rpx 40rpx;
  border-radius: 25rpx;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.add-btn:active {
  background-color: #096dd9;
}

.add-btn-text {
  font-size: 28rpx;
  color: white;
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
EOF < /dev/null