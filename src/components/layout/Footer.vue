<template>
  <view class="footer">
    <view class="footer-nav">
      <view 
        class="nav-item" 
        :class="{ active: activeTab === 'home' }"
        @tap="switchTab('home')"
      >
        <uni-icons 
          :type="activeTab === 'home' ? 'home-filled' : 'home'" 
          size="24" 
          :color="activeTab === 'home' ? '#1890ff' : '#666'"
        ></uni-icons>
        <text class="nav-text" :class="{ active: activeTab === 'home' }">首页</text>
      </view>
      
      <view 
        class="nav-item" 
        :class="{ active: activeTab === 'market' }"
        @tap="switchTab('market')"
      >
        <uni-icons 
          :type="activeTab === 'market' ? 'chart' : 'chart'" 
          size="24" 
          :color="activeTab === 'market' ? '#1890ff' : '#666'"
        ></uni-icons>
        <text class="nav-text" :class="{ active: activeTab === 'market' }">行情</text>
      </view>
      
      <view 
        class="nav-item" 
        :class="{ active: activeTab === 'trade' }"
        @tap="switchTab('trade')"
      >
        <uni-icons 
          :type="activeTab === 'trade' ? 'wallet' : 'wallet'" 
          size="24" 
          :color="activeTab === 'trade' ? '#1890ff' : '#666'"
        ></uni-icons>
        <text class="nav-text" :class="{ active: activeTab === 'trade' }">交易</text>
      </view>
      
      <view 
        class="nav-item" 
        :class="{ active: activeTab === 'news' }"
        @tap="switchTab('news')"
      >
        <uni-icons 
          :type="activeTab === 'news' ? 'notification' : 'notification'" 
          size="24" 
          :color="activeTab === 'news' ? '#1890ff' : '#666'"
        ></uni-icons>
        <text class="nav-text" :class="{ active: activeTab === 'news' }">资讯</text>
      </view>
      
      <view 
        class="nav-item" 
        :class="{ active: activeTab === 'profile' }"
        @tap="switchTab('profile')"
      >
        <uni-icons 
          :type="activeTab === 'profile' ? 'person' : 'person'" 
          size="24" 
          :color="activeTab === 'profile' ? '#1890ff' : '#666'"
        ></uni-icons>
        <text class="nav-text" :class="{ active: activeTab === 'profile' }">我的</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const activeTab = ref('home')

const switchTab = (tab: string) => {
  activeTab.value = tab
  
  const pages = {
    home: '/pages/index/index',
    market: '/pages/market/index',
    trade: '/pages/trade/index',
    news: '/pages/news/index',
    profile: '/pages/profile/index'
  }
  
  uni.switchTab({
    url: pages[tab as keyof typeof pages]
  })
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const route = currentPage?.route
  
  if (route) {
    const tabMap: Record<string, string> = {
      'pages/index/index': 'home',
      'pages/market/index': 'market',
      'pages/trade/index': 'trade',
      'pages/news/index': 'news',
      'pages/profile/index': 'profile'
    }
    
    activeTab.value = tabMap[route] || 'home'
  }
})
</script>

<style scoped>
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
  z-index: 1000;
}

.footer-nav {
  display: flex;
  height: 50px;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-item:active {
  opacity: 0.7;
}

.nav-text {
  font-size: 12px;
  color: #666;
  transition: color 0.3s ease;
}

.nav-text.active {
  color: #1890ff;
}

.nav-item.active {
  background-color: #f0f9ff;
}
</style>