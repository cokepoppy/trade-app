# Trade App Frontend Design Document

## 1. Overview

This document outlines the frontend architecture and design for the trade application, built on the existing system architecture. The frontend will be developed using uni-app with Vue 3, providing a cross-platform solution for mobile trading applications.

## 2. Technology Stack

### 2.1 Core Technologies
- **Framework**: uni-app + Vue 3 (Composition API)
- **UI Library**: uView UI
- **State Management**: Pinia
- **Chart Library**: uCharts / ECharts
- **HTTP Client**: uni.request + Axios
- **Real-time Communication**: WebSocket
- **Build Tool**: Vite
- **Code Quality**: ESLint + Prettier

### 2.2 Development Tools
- **IDE**: VS Code with Volar extension
- **Version Control**: Git
- **Package Manager**: npm/yarn
- **Testing**: Jest + Vue Test Utils
- **Debugging**: Chrome DevTools + uni-app debugger

## 3. Project Structure

```
src/
├── components/           # 通用组件
│   ├── common/          # 基础组件
│   ├── charts/          # 图表组件
│   ├── forms/           # 表单组件
│   └── layout/          # 布局组件
├── pages/              # 页面模块
│   ├── home/           # 首页
│   ├── market/         # 行情页面
│   ├── trade/          # 交易页面
│   ├── news/           # 资讯页面
│   └── profile/        # 个人中心
├── stores/             # Pinia状态管理
├── services/           # API服务
├── utils/              # 工具函数
├── styles/             # 样式文件
├── types/              # TypeScript类型定义
└── static/             # 静态资源
```

## 4. Core Modules Design

### 4.1 Home Module (首页模块)

#### Features
- Market overview with major indices
- Watchlist with real-time quotes
- Quick access to main functions
- Market hotspots and trending stocks

#### Key Components
```vue
<!-- MarketIndices.vue -->
<template>
  <view class="market-indices">
    <view 
      v-for="index in indices" 
      :key="index.code"
      class="index-item"
    >
      <text class="index-name">{{index.name}}</text>
      <text 
        class="index-value" 
        :class="index.change >= 0 ? 'up' : 'down'"
      >
        {{index.value}}
      </text>
      <text 
        class="index-change" 
        :class="index.change >= 0 ? 'up' : 'down'"
      >
        {{index.change}} ({{index.changePercent}}%)
      </text>
    </view>
  </view>
</template>
```

```vue
<!-- Watchlist.vue -->
<template>
  <view class="watchlist">
    <view 
      v-for="stock in watchlist" 
      :key="stock.code"
      class="stock-item"
      @click="navigateToStockDetail(stock.code)"
    >
      <view class="stock-info">
        <text class="stock-name">{{stock.name}}</text>
        <text class="stock-code">{{stock.code}}</text>
      </view>
      <view class="stock-price">
        <text 
          class="current-price" 
          :class="stock.change >= 0 ? 'up' : 'down'"
        >
          {{stock.price}}
        </text>
        <text 
          class="price-change" 
          :class="stock.change >= 0 ? 'up' : 'down'"
        >
          {{stock.change}} ({{stock.changePercent}}%)
        </text>
      </view>
    </view>
  </view>
</template>
```

### 4.2 Market Module (行情模块)

#### Features
- Real-time stock quotes
- K-line charts and technical analysis
- Five-level order book
- Market depth and volume analysis

#### Key Components
```vue
<!-- KLineChart.vue -->
<template>
  <view class="kline-chart">
    <view class="chart-header">
      <view 
        v-for="period in periods" 
        :key="period"
        class="period-btn"
        :class="{ active: currentPeriod === period }"
        @click="changePeriod(period)"
      >
        {{period}}
      </view>
    </view>
    <canvas 
      canvas-id="kline-chart" 
      class="chart-canvas"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    />
    <view class="chart-footer">
      <view class="volume-info">
        <text>成交量: {{volume}}</text>
        <text>成交额: {{amount}}</text>
      </view>
    </view>
  </view>
</template>
```

```vue
<!-- OrderBook.vue -->
<template>
  <view class="order-book">
    <view class="ask-orders">
      <view 
        v-for="order in askOrders" 
        :key="order.price"
        class="order-item"
      >
        <text class="price down">{{order.price}}</text>
        <text class="volume">{{order.volume}}</text>
      </view>
    </view>
    <view class="current-price">
      <text :class="currentPrice.change >= 0 ? 'up' : 'down'">
        {{currentPrice.price}}
      </text>
    </view>
    <view class="bid-orders">
      <view 
        v-for="order in bidOrders" 
        :key="order.price"
        class="order-item"
      >
        <text class="price up">{{order.price}}</text>
        <text class="volume">{{order.volume}}</text>
      </view>
    </view>
  </view>
</template>
```

### 4.3 Trade Module (交易模块)

#### Features
- Buy/Sell order placement
- Position management
- Order history
- Account balance management

#### Key Components
```vue
<!-- TradePanel.vue -->
<template>
  <view class="trade-panel">
    <view class="trade-type">
      <view 
        v-for="type in tradeTypes" 
        :key="type"
        class="type-btn"
        :class="{ active: currentType === type }"
        @click="changeTradeType(type)"
      >
        {{type}}
      </view>
    </view>
    <view class="trade-form">
      <view class="form-item">
        <text class="label">股票代码</text>
        <input 
          class="input" 
          v-model="stockCode" 
          placeholder="请输入股票代码" 
          @blur="searchStock"
        />
      </view>
      <view class="form-item">
        <text class="label">委托价格</text>
        <view class="price-options">
          <view 
            v-for="option in priceOptions" 
            :key="option"
            class="price-option"
            :class="{ active: selectedPriceOption === option }"
            @click="selectPriceOption(option)"
          >
            {{option}}
          </view>
        </view>
        <input 
          class="input" 
          v-model="price" 
          type="digit" 
          placeholder="请输入价格" 
        />
      </view>
      <view class="form-item">
        <text class="label">委托数量</text>
        <input 
          class="input" 
          v-model="quantity" 
          type="number" 
          placeholder="请输入数量" 
        />
        <view class="quantity-quick">
          <view 
            v-for="percent in quantityPresets" 
            :key="percent"
            class="quick-btn"
            @click="setQuantityPercent(percent)"
          >
            {{percent}}%
          </view>
        </view>
      </view>
    </view>
    <view class="trade-info">
      <text>可用资金: {{availableFunds}}</text>
      <text>预计金额: {{estimatedAmount}}</text>
    </view>
    <view class="trade-actions">
      <button 
        class="btn-submit"
        :class="currentType === 'buy' ? 'btn-buy' : 'btn-sell'"
        @click="submitOrder"
      >
        {{currentType === 'buy' ? '买入' : '卖出'}}
      </button>
    </view>
  </view>
</template>
```

### 4.4 News Module (资讯模块)

#### Features
- Real-time financial news
- Company announcements
- Research reports
- Market analysis

#### Key Components
```vue
<!-- NewsList.vue -->
<template>
  <view class="news-list">
    <view class="news-categories">
      <view 
        v-for="category in categories" 
        :key="category.id"
        class="category-btn"
        :class="{ active: currentCategory === category.id }"
        @click="changeCategory(category.id)"
      >
        {{category.name}}
      </view>
    </view>
    <view class="news-items">
      <view 
        v-for="news in newsList" 
        :key="news.id"
        class="news-item"
        @click="navigateToNewsDetail(news.id)"
      >
        <view class="news-content">
          <text class="news-title">{{news.title}}</text>
          <text class="news-summary">{{news.summary}}</text>
          <view class="news-meta">
            <text class="news-source">{{news.source}}</text>
            <text class="news-time">{{formatTime(news.publishTime)}}</text>
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
</template>
```

## 5. State Management (Pinia)

### 5.1 Store Structure
```typescript
// stores/market.ts
export const useMarketStore = defineStore('market', {
  state: () => ({
    indices: [] as MarketIndex[],
    watchlist: [] as Stock[],
    currentStock: null as Stock | null,
    realTimeData: new Map<string, RealTimeData>(),
    websocketConnected: false
  }),
  actions: {
    async fetchIndices() {
      const response = await marketApi.getIndices()
      this.indices = response.data
    },
    updateRealTimeData(symbol: string, data: RealTimeData) {
      this.realTimeData.set(symbol, data)
    }
  }
})

// stores/trade.ts
export const useTradeStore = defineStore('trade', {
  state: () => ({
    positions: [] as Position[],
    orders: [] as Order[],
    accountInfo: null as AccountInfo | null,
    currentOrder: null as Order | null
  }),
  actions: {
    async submitOrder(orderData: OrderRequest) {
      const response = await tradeApi.submitOrder(orderData)
      this.orders.unshift(response.data)
      return response.data
    }
  }
})
```

## 6. API Services

### 6.1 Service Layer
```typescript
// services/market.ts
export class MarketService {
  async getIndices() {
    return uni.request({
      url: '/api/market/indices',
      method: 'GET'
    })
  }
  
  async getStockDetail(symbol: string) {
    return uni.request({
      url: `/api/market/stocks/${symbol}`,
      method: 'GET'
    })
  }
  
  async getKLineData(symbol: string, period: string) {
    return uni.request({
      url: `/api/market/kline/${symbol}`,
      method: 'GET',
      data: { period }
    })
  }
}

// services/websocket.ts
export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  
  connect() {
    this.ws = uni.connectSocket({
      url: 'wss://api.example.com/ws',
      success: () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
      }
    })
    
    this.ws.onMessage((res) => {
      const data = JSON.parse(res.data)
      this.handleMessage(data)
    })
    
    this.ws.onClose(() => {
      this.reconnect()
    })
  }
  
  private handleMessage(data: any) {
    const marketStore = useMarketStore()
    marketStore.updateRealTimeData(data.symbol, data)
  }
}
```

## 7. Real-time Data Handling

### 7.1 WebSocket Integration
```typescript
// utils/websocket.ts
export const useWebSocket = () => {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const messageQueue = ref<any[]>([])
  
  const connect = (url: string) => {
    ws.value = uni.connectSocket({
      url,
      success: () => {
        isConnected.value = true
        processMessageQueue()
      }
    })
    
    ws.value.onMessage((res) => {
      const data = JSON.parse(res.data)
      handleRealTimeData(data)
    })
  }
  
  const subscribe = (symbols: string[]) => {
    if (ws.value && isConnected.value) {
      ws.value.send({
        data: JSON.stringify({
          action: 'subscribe',
          symbols
        })
      })
    }
  }
  
  return { connect, subscribe, isConnected }
}
```

## 8. Performance Optimization

### 8.1 Data Caching
```typescript
// utils/cache.ts
export class DataCache {
  private cache = new Map<string, { data: any, timestamp: number }>()
  private maxAge = 5 * 60 * 1000 // 5 minutes
  
  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
}
```

### 8.2 Component Optimization
```vue
<!-- OptimizedStockList.vue -->
<template>
  <view class="stock-list">
    <view 
      v-for="stock in visibleStocks" 
      :key="stock.code"
      class="stock-item"
    >
      <!-- Stock item content -->
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const stocks = ref([])
const page = ref(1)
const loading = ref(false)
const hasMore = ref(true)

const visibleStocks = computed(() => {
  return stocks.value.slice(0, page.value * 20)
})

const loadMore = async () => {
  if (loading.value || !hasMore.value) return
  
  loading.value = true
  const newStocks = await fetchStocks(page.value + 1)
  
  if (newStocks.length > 0) {
    stocks.value.push(...newStocks)
    page.value++
  } else {
    hasMore.value = false
  }
  
  loading.value = false
}

onMounted(() => {
  // Initial load
})
</script>
```

## 9. Responsive Design

### 9.1 Layout Adaptation
```scss
// styles/variables.scss
$breakpoints: (
  'small': 320px,
  'medium': 768px,
  'large': 1024px
);

// styles/mixins.scss
@mixin responsive($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}

// styles/layout.scss
.container {
  padding: 16px;
  
  @include responsive('medium') {
    padding: 24px;
  }
  
  @include responsive('large') {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px;
  }
}
```

## 10. Security Considerations

### 10.1 Data Encryption
```typescript
// utils/crypto.ts
import CryptoJS from 'crypto-js'

export const encryptData = (data: string, key: string) => {
  return CryptoJS.AES.encrypt(data, key).toString()
}

export const decryptData = (encrypted: string, key: string) => {
  const bytes = CryptoJS.AES.decrypt(encrypted, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}
```

### 10.2 Request Security
```typescript
// utils/request.ts
const request = async (options: UniApp.RequestOptions) => {
  const token = uni.getStorageSync('token')
  
  const defaultOptions = {
    header: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Request-ID': generateRequestId()
    },
    timeout: 10000
  }
  
  try {
    const response = await uni.request({
      ...defaultOptions,
      ...options
    })
    
    if (response.statusCode === 401) {
      // Handle token expiration
      uni.redirectTo({ url: '/pages/login/login' })
    }
    
    return response
  } catch (error) {
    console.error('Request failed:', error)
    throw error
  }
}
```

## 11. Testing Strategy

### 11.1 Unit Tests
```typescript
// tests/components/StockItem.test.ts
import { mount } from '@vue/test-utils'
import StockItem from '@/components/common/StockItem.vue'

describe('StockItem', () => {
  it('renders stock information correctly', () => {
    const stock = {
      name: '贵州茅台',
      code: '600519',
      price: 1678.90,
      change: 23.45,
      changePercent: 1.42
    }
    
    const wrapper = mount(StockItem, {
      props: { stock }
    })
    
    expect(wrapper.find('.stock-name').text()).toBe('贵州茅台')
    expect(wrapper.find('.current-price').text()).toBe('1678.90')
  })
})
```

### 11.2 Integration Tests
```typescript
// tests/stores/market.test.ts
import { useMarketStore } from '@/stores/market'
import { createPinia, setActivePinia } from 'pinia'

describe('Market Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('updates real-time data correctly', () => {
    const store = useMarketStore()
    
    store.updateRealTimeData('600519', {
      price: 1680.00,
      change: 24.55,
      changePercent: 1.49
    })
    
    expect(store.realTimeData.get('600519')).toEqual({
      price: 1680.00,
      change: 24.55,
      changePercent: 1.49
    })
  })
})
```

## 12. Deployment Configuration

### 12.1 Build Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'pinia'],
          charts: ['echarts']
        }
      }
    }
  }
})
```

### 12.2 Environment Configuration
```javascript
// .env.development
VITE_API_BASE_URL=https://dev-api.example.com
VITE_WS_URL=wss://dev-api.example.com/ws
VITE_APP_ENV=development

// .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com/ws
VITE_APP_ENV=production
```

## 13. Development Guidelines

### 13.1 Code Style
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    '@vue/typescript/recommended',
    'prettier'
  ],
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'warn'
  }
}

// .prettierrc.js
module.exports = {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none'
}
```

### 13.2 Git Hooks
```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run test
```

## 14. Monitoring and Analytics

### 14.1 Performance Monitoring
```typescript
// utils/analytics.ts
export const trackPerformance = (metricName: string, value: number) => {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    console.log(`Performance metric: ${metricName} = ${value}ms`)
  }
}

export const trackError = (error: Error, context?: any) => {
  if (process.env.NODE_ENV === 'production') {
    console.error('Error tracked:', error, context)
  }
}
```

### 14.2 User Behavior Tracking
```typescript
// utils/tracking.ts
export const trackEvent = (eventName: string, properties?: any) => {
  if (process.env.NODE_ENV === 'production') {
    console.log('Event tracked:', eventName, properties)
  }
}

// Usage in components
onMounted(() => {
  trackEvent('page_view', { page: 'home' })
})
```

## 15. Future Enhancements

### 15.1 Planned Features
- **Dark Mode**: Complete dark theme implementation
- **Multi-language Support**: Internationalization (i18n)
- **Advanced Charts**: More technical indicators and drawing tools
- **Paper Trading**: Virtual trading for practice
- **Social Features**: Community and sharing capabilities

### 15.2 Technology Upgrades
- **Vue 3.4**: Latest Vue.js features
- **TypeScript 5.0**: Enhanced type safety
- **PWA Support**: Progressive Web App capabilities
- **WebAssembly**: Performance-critical components

---

This frontend design document provides a comprehensive blueprint for developing the trade application frontend. The architecture emphasizes performance, maintainability, and user experience while adhering to modern development practices and security standards.