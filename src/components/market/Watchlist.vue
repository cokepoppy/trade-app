<template>
  <view class="watchlist">
    <view class="watchlist-header">
      <text class="section-title">自选股</text>
      <view class="header-actions">
        <view class="action-btn" @click="handleAddStock">
          <uni-icons type="plus" size="16" color="#666"></uni-icons>
        </view>
        <view class="action-btn" @click="handleManage">
          <uni-icons type="gear" size="16" color="#666"></uni-icons>
        </view>
      </view>
    </view>
    
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
            <uni-icons type="close" size="14" color="#999"></uni-icons>
          </view>
        </view>
      </view>
    </view>
    
    <view v-else class="empty-state" @click="handleAddStock">
      <view class="empty-content">
        <uni-icons type="star" size="32" color="#d9d9d9"></uni-icons>
        <text class="empty-text">暂无自选股</text>
        <text class="empty-desc">点击添加按钮添加自选股</text>
      </view>
    </view>
    
    <view v-if="watchlistItems.length > 0" class="watchlist-footer" @click="handleViewAll">
      <text class="view-all-text">查看全部自选股</text>
      <uni-icons type="arrowright" size="14" color="#666"></uni-icons>
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
  console.log('[Watchlist] 添加股票按钮被点击')
  
  // 先尝试直接添加测试股票
  const testStock = {
    id: Date.now().toString(),
    code: '000001',
    name: '平安银行',
    price: 12.58,
    change: 0.23,
    changePercent: 1.86,
    addedTime: Date.now()
  }
  
  addToWatchlist(testStock)
  
  // 同时也跳转到搜索页面
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/market/search?mode=add',
      success: () => {
        console.log('[Watchlist] 成功跳转到搜索页面')
      },
      fail: (error) => {
        console.error('[Watchlist] 跳转失败:', error)
      }
    })
  }, 500)
}

const handleManage = () => {
  uni.navigateTo({
    url: '/pages/profile/watchlist'
  })
}

const handleStockClick = (stock: any) => {
  console.log('[Watchlist] 股票被点击:', stock)
  uni.navigateTo({
    url: `/pages/market/detail?code=${stock.code}&name=${stock.name}`
  })
}

const handleRemoveStock = async (stock: any) => {
  try {
    const updatedWatchlist = watchlistItems.value.filter(item => item.id !== stock.id)
    watchlistItems.value = updatedWatchlist
    uni.setStorageSync('watchlist', updatedWatchlist)
  } catch (error) {
    console.error('Remove stock error:', error)
  }
}

// 检查股票是否在自选股中
const isInWatchlist = (stockCode: string) => {
  return watchlistItems.value.some(item => item.code === stockCode)
}

// 添加股票到自选股
const addToWatchlist = async (stock: any) => {
  try {
    if (isInWatchlist(stock.code)) {
      uni.showToast({
        title: '该股票已在自选股中',
        icon: 'none'
      })
      return
    }
    
    const watchlistItem = {
      id: Date.now().toString(),
      code: stock.code,
      name: stock.name,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      addedTime: Date.now()
    }
    
    const updatedWatchlist = [...watchlistItems.value, watchlistItem]
    watchlistItems.value = updatedWatchlist
    uni.setStorageSync('watchlist', updatedWatchlist)
    
    uni.showToast({
      title: '已添加到自选股',
      icon: 'success'
    })
  } catch (error) {
    console.error('Add to watchlist error:', error)
  }
}

const handleViewAll = () => {
  uni.navigateTo({
    url: '/pages/market/watchlist'
  })
}

onMounted(() => {
  console.log('[Watchlist] 组件开始挂载')
  loadWatchlist()
  console.log('[Watchlist] 组件挂载完成，自选股数据:', watchlistItems.value)
})
</script>

<style scoped>
.watchlist {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.watchlist-header {
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

.watchlist-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stock-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-height: 60px;
}

.stock-item:active {
  background-color: #f5f5f5;
}

.stock-item:hover {
  background-color: #f8f9fa;
}

.stock-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stock-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.stock-code {
  font-size: 12px;
  color: #999;
}

.stock-data {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.stock-price {
  font-size: 16px;
  font-weight: 600;
}

.stock-change {
  font-size: 12px;
}

.stock-change-percent {
  font-size: 12px;
}

.stock-actions {
  flex: 0 0 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon {
  padding: 4px;
  border-radius: 4px;
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
  padding: 40px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.empty-state:active {
  background-color: #f5f5f5;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-text {
  font-size: 14px;
  color: #666;
  text-align: center;
}

.empty-desc {
  font-size: 12px;
  color: #999;
  text-align: center;
}

.watchlist-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.watchlist-footer:active {
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
EOF < /dev/null