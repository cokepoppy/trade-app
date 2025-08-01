<template>
  <view class="news-page">
    <!-- 顶部搜索栏 -->
    <view class="search-bar">
      <view class="search-input" @click="goToSearch">
        <u-icon name="search" size="16" color="#999"></u-icon>
        <text class="placeholder">搜索资讯、研报、公告</text>
      </view>
    </view>

    <!-- 分类标签 -->
    <view class="category-tabs">
      <scroll-view scroll-x class="tabs-scroll" :scroll-left="scrollLeft">
        <view 
          v-for="category in categories" 
          :key="category.value"
          class="tab-item"
          :class="{ active: currentCategory === category.value }"
          @click="switchCategory(category.value)"
        >
          <text class="tab-text">{{ category.label }}</text>
          <view v-if="category.count" class="badge">{{ category.count }}</view>
        </view>
      </scroll-view>
    </view>

    <!-- 资讯列表 -->
    <scroll-view 
      scroll-y 
      class="news-list"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @scrolltolower="loadMore"
      @refresherrefresh="onRefresh"
    >
      <!-- 头条资讯 -->
      <view v-if="currentCategory === 'headline' && headlineNews.length > 0" class="headline-section">
        <view class="section-title">今日头条</view>
        <swiper 
          class="headline-swiper" 
          :autoplay="true" 
          :interval="3000" 
          :duration="500"
          circular
        >
          <swiper-item v-for="news in headlineNews" :key="news.id" @click="goToDetail(news.id)">
            <image :src="news.coverImage" class="headline-image" mode="aspectFill"></image>
            <view class="headline-overlay">
              <text class="headline-title">{{ news.title }}</text>
              <view class="headline-meta">
                <text class="source">{{ news.source }}</text>
                <text class="time">{{ formatTime(news.publishTime) }}</text>
              </view>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <!-- 资讯列表项 -->
      <view v-for="news in newsList" :key="news.id" class="news-item" @click="goToDetail(news.id)">
        <!-- 图文模式 -->
        <view v-if="news.coverImage" class="news-content-with-image">
          <view class="news-info">
            <view class="news-title" :class="{ breaking: news.importance === 'breaking' }">
              <text v-if="news.importance === 'breaking'" class="breaking-tag">快讯</text>
              {{ news.title }}
            </view>
            <view class="news-summary">{{ news.summary }}</view>
            <view class="news-meta">
              <text class="source">{{ news.source }}</text>
              <text class="time">{{ formatTime(news.publishTime) }}</text>
              <view class="stats">
                <text class="read-count">{{ news.readCount || 0 }}阅读</text>
                <text v-if="news.commentCount" class="comment-count">{{ news.commentCount }}评论</text>
              </view>
            </view>
          </view>
          <image :src="news.coverImage" class="news-image" mode="aspectFill"></image>
        </view>

        <!-- 纯文字模式 -->
        <view v-else class="news-content-text">
          <view class="news-title" :class="{ breaking: news.importance === 'breaking' }">
            <text v-if="news.importance === 'breaking'" class="breaking-tag">快讯</text>
            {{ news.title }}
          </view>
          <view class="news-summary">{{ news.summary }}</view>
          <view class="news-meta">
            <text class="source">{{ news.source }}</text>
            <text class="time">{{ formatTime(news.publishTime) }}</text>
            <view class="stats">
              <text class="read-count">{{ news.readCount || 0 }}阅读</text>
              <text v-if="news.commentCount" class="comment-count">{{ news.commentCount }}评论</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading-status">
        <u-loading-icon v-if="loading" mode="flower"></u-loading-icon>
        <text v-else-if="hasMore" class="load-more">上拉加载更多</text>
        <text v-else class="no-more">没有更多数据了</text>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && newsList.length === 0" class="empty-state">
        <u-empty-state 
          mode="data" 
          icon="http://cdn.uviewui.com/uview/empty/data.png"
          text="暂无资讯"
        ></u-empty-state>
      </view>
    </scroll-view>

    <!-- 悬浮按钮 -->
    <view class="floating-buttons">
      <view class="floating-btn" @click="scrollToTop">
        <u-icon name="arrow-up" size="20" color="#fff"></u-icon>
      </view>
      <view v-if="hasNewNews" class="floating-btn new-news" @click="loadNewNews">
        <u-icon name="bell" size="20" color="#fff"></u-icon>
        <view class="red-dot"></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { newsService } from '@/services/newsService'
import { formatTime } from '@/utils/format'
import { useAppStore } from '@/stores/useAppStore'

const appStore = useAppStore()

// 分类数据
const categories = ref([
  { label: '头条', value: 'headline', count: 0 },
  { label: '重要', value: 'important', count: 0 },
  { label: '研报', value: 'research', count: 0 },
  { label: '公告', value: 'announcement', count: 0 },
  { label: '市场', value: 'market', count: 0 },
  { label: '行业', value: 'industry', count: 0 },
  { label: '公司', value: 'company', count: 0 },
  { label: '政策', value: 'policy', count: 0 }
])

const currentCategory = ref('headline')
const scrollLeft = ref(0)

// 资讯数据
const newsList = ref<any[]>([])
const headlineNews = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const page = ref(1)
const pageSize = ref(20)

// 新资讯提示
const hasNewNews = ref(false)
const lastNewsId = ref('')

// WebSocket连接
let websocket: any = null

// 切换分类
const switchCategory = (category: string) => {
  currentCategory.value = category
  page.value = 1
  newsList.value = []
  hasMore.value = true
  loadNews()
}

// 加载资讯数据
const loadNews = async () => {
  if (loading.value || !hasMore.value) return
  
  try {
    loading.value = true
    
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      category: currentCategory.value
    }
    
    const response = await newsService.getNewsList(params)
    
    if (response.data.list.length > 0) {
      if (page.value === 1) {
        newsList.value = response.data.list
        lastNewsId.value = response.data.list[0].id
      } else {
        newsList.value.push(...response.data.list)
      }
      
      hasMore.value = response.data.hasNext
      page.value++
    } else {
      hasMore.value = false
    }
  } catch (error) {
    console.error('加载资讯失败:', error)
    appStore.showError('加载资讯失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 加载头条资讯
const loadHeadlineNews = async () => {
  try {
    const response = await newsService.getHotNews({ limit: 5 })
    headlineNews.value = response.data
  } catch (error) {
    console.error('加载头条资讯失败:', error)
  }
}

// 加载更多
const loadMore = () => {
  if (hasMore.value && !loading.value) {
    loadNews()
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  page.value = 1
  hasMore.value = true
  loadNews()
  loadHeadlineNews()
}

// 加载新资讯
const loadNewNews = () => {
  page.value = 1
  hasMore.value = true
  newsList.value = []
  hasNewNews.value = false
  loadNews()
}

// 滚动到顶部
const scrollToTop = () => {
  uni.pageScrollTo({
    scrollTop: 0,
    duration: 300
  })
}

// 跳转到搜索页
const goToSearch = () => {
  uni.navigateTo({
    url: '/pages/news/search'
  })
}

// 跳转到详情页
const goToDetail = (newsId: string) => {
  uni.navigateTo({
    url: `/pages/news/detail?id=${newsId}`
  })
}

// 初始化WebSocket连接
const initWebSocket = () => {
  try {
    const token = uni.getStorageSync('user_token')
    if (!token) return
    
    websocket = uni.connectSocket({
      url: `wss://api.example.com/ws/news?token=${token}`,
      complete: () => {
        // WebSocket连接完成回调
      }
    })
    
    websocket.onOpen(() => {
      console.log('WebSocket连接已建立')
    })
    
    websocket.onMessage((res: any) => {
      try {
        const data = JSON.parse(res.data)
        if (data.type === 'news_update') {
          // 显示新资讯提示
          hasNewNews.value = true
          
          // 更新分类计数
          const categoryIndex = categories.value.findIndex(c => c.value === data.category)
          if (categoryIndex !== -1) {
            categories.value[categoryIndex].count++
          }
        }
      } catch (error) {
        console.error('解析WebSocket消息失败:', error)
      }
    })
    
    websocket.onError((error: any) => {
      console.error('WebSocket连接错误:', error)
    })
    
    websocket.onClose(() => {
      console.log('WebSocket连接已关闭')
      // 3秒后重连
      setTimeout(initWebSocket, 3000)
    })
  } catch (error) {
    console.error('初始化WebSocket失败:', error)
  }
}

// 页面生命周期
onMounted(() => {
  loadNews()
  if (currentCategory.value === 'headline') {
    loadHeadlineNews()
  }
  initWebSocket()
})

onUnmounted(() => {
  if (websocket) {
    websocket.close()
  }
})
</script>

<style lang="scss" scoped>
.news-page {
  height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.search-bar {
  padding: 16rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
  
  .search-input {
    display: flex;
    align-items: center;
    padding: 20rpx 24rpx;
    background-color: #f5f5f5;
    border-radius: 32rpx;
    
    .placeholder {
      margin-left: 16rpx;
      font-size: 28rpx;
      color: #999;
    }
  }
}

.category-tabs {
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
  
  .tabs-scroll {
    white-space: nowrap;
    padding: 0 16rpx;
  }
  
  .tab-item {
    display: inline-flex;
    align-items: center;
    padding: 24rpx 32rpx;
    margin-right: 16rpx;
    position: relative;
    
    &.active {
      color: #007AFF;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 4rpx;
        background-color: #007AFF;
        border-radius: 2rpx;
      }
    }
    
    .tab-text {
      font-size: 28rpx;
      font-weight: 500;
    }
    
    .badge {
      margin-left: 8rpx;
      padding: 4rpx 8rpx;
      background-color: #ff3b30;
      color: #fff;
      font-size: 20rpx;
      border-radius: 12rpx;
      min-width: 24rpx;
      text-align: center;
    }
  }
}

.news-list {
  flex: 1;
  padding: 16rpx;
}

.headline-section {
  margin-bottom: 32rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    margin-bottom: 16rpx;
    padding: 0 8rpx;
  }
  
  .headline-swiper {
    height: 300rpx;
    border-radius: 16rpx;
    overflow: hidden;
    
    .headline-image {
      width: 100%;
      height: 100%;
    }
    
    .headline-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 24rpx;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
      
      .headline-title {
        color: #fff;
        font-size: 32rpx;
        font-weight: bold;
        margin-bottom: 8rpx;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .headline-meta {
        display: flex;
        align-items: center;
        gap: 16rpx;
        
        .source, .time {
          color: rgba(255, 255, 255, 0.8);
          font-size: 24rpx;
        }
      }
    }
  }
}

.news-item {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  overflow: hidden;
  
  .news-content-with-image {
    display: flex;
    padding: 24rpx;
    gap: 24rpx;
  }
  
  .news-content-text {
    padding: 24rpx;
  }
  
  .news-info {
    flex: 1;
  }
  
  .news-title {
    font-size: 30rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 12rpx;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    
    &.breaking {
      color: #ff3b30;
    }
    
    .breaking-tag {
      display: inline-block;
      padding: 4rpx 8rpx;
      background-color: #ff3b30;
      color: #fff;
      font-size: 20rpx;
      border-radius: 4rpx;
      margin-right: 8rpx;
    }
  }
  
  .news-summary {
    font-size: 26rpx;
    color: #666;
    line-height: 1.4;
    margin-bottom: 16rpx;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .news-meta {
    display: flex;
    align-items: center;
    gap: 16rpx;
    font-size: 24rpx;
    color: #999;
    
    .stats {
      margin-left: auto;
      display: flex;
      gap: 16rpx;
    }
  }
  
  .news-image {
    width: 200rpx;
    height: 150rpx;
    border-radius: 8rpx;
    flex-shrink: 0;
  }
}

.loading-status {
  text-align: center;
  padding: 32rpx;
  
  .load-more, .no-more {
    font-size: 26rpx;
    color: #999;
  }
}

.empty-state {
  padding: 120rpx 0;
}

.floating-buttons {
  position: fixed;
  right: 32rpx;
  bottom: 120rpx;
  z-index: 100;
  
  .floating-btn {
    width: 88rpx;
    height: 88rpx;
    background-color: #007AFF;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
    
    &.new-news {
      position: relative;
      
      .red-dot {
        position: absolute;
        top: 8rpx;
        right: 8rpx;
        width: 16rpx;
        height: 16rpx;
        background-color: #ff3b30;
        border-radius: 50%;
      }
    }
  }
}
</style>