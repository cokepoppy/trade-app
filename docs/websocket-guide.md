# WebSocket 实时行情数据服务

## 概述

本项目实现了一个完整的 WebSocket 实时行情数据服务，包括：

1. **服务端**: 基于 Socket.IO 的实时数据推送服务
2. **客户端**: 前端 WebSocket 连接管理器
3. **数据类型**: 支持股票报价、分时图、K线图、深度数据等

## 服务端架构

### 1. 主要组件

#### RealTimeMarketDataServer
- 位置: `server/src/websocket/realTimeMarketDataServer.ts`
- 功能: 专门处理实时行情数据的 WebSocket 服务

#### MarketDataWebSocketServer
- 位置: `server/src/websocket/marketDataServer.ts`
- 功能: 通用市场数据 WebSocket 服务

### 2. 支持的数据类型

- **实时报价** (stock_quote): 股票价格、涨跌幅、成交量等
- **分时数据** (timeshare_data): 分时图数据点
- **K线数据** (kline_data): 各种周期的K线数据
- **深度数据** (market_depth): 五档行情数据

### 3. 数据推送频率

- 实时报价: 3秒
- 分时数据: 5秒
- K线数据: 10秒 (推送), 30秒 (更新)
- 深度数据: 2秒

## 客户端使用

### 1. 基本使用

```typescript
import { createRealTimeDataManager } from '@/services/realTimeDataManager'

// 创建实时数据管理器
const manager = createRealTimeDataManager({
  url: 'ws://localhost:3001',
  enableLogging: true
})

// 初始化
const { connect, subscribeToStocks, subscribeToTimeShare, subscribeToKLine, on } = manager.initialize()

// 连接服务器
connect()

// 订阅股票实时数据
const subscriptionId = subscribeToStocks(['000001', '000002'], (data) => {
  console.log('股票数据更新:', data)
})

// 订阅分时数据
subscribeToTimeShare('000001', (data) => {
  console.log('分时数据更新:', data)
})

// 订阅K线数据
subscribeToKLine('000001', '1day', (data) => {
  console.log('K线数据更新:', data)
})

// 监听连接状态
on('connected', () => {
  console.log('WebSocket 连接成功')
})

on('disconnected', () => {
  console.log('WebSocket 连接断开')
})
```

### 2. 在 Vue 组件中使用

```vue
<template>
  <div>
    <div>股票价格: {{ stockPrice }}</div>
    <div>涨跌幅: {{ stockChange }}%</div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createRealTimeDataManager } from '@/services/realTimeDataManager'

const stockPrice = ref(0)
const stockChange = ref(0)
const chartCanvas = ref<HTMLCanvasElement | null>(null)

let manager: any = null

onMounted(() => {
  // 创建实时数据管理器
  manager = createRealTimeDataManager({
    url: 'ws://localhost:3001',
    enableLogging: false
  })

  const { connect, subscribeToStocks, subscribeToTimeShare, on } = manager.initialize()

  // 连接服务器
  connect()

  // 订阅股票数据
  subscribeToStocks(['000001'], (data) => {
    stockPrice.value = data.price
    stockChange.value = data.changePercent
  })

  // 订阅分时数据用于绘图
  subscribeToTimeShare('000001', (data) => {
    drawChart(data.data)
  })

  // 监听连接状态
  on('connected', () => {
    console.log('实时数据连接成功')
  })
})

onUnmounted(() => {
  // 清理连接
  if (manager) {
    manager.cleanup()
  }
})

const drawChart = (data: any[]) => {
  // 绘制图表逻辑
  if (chartCanvas.value) {
    const ctx = chartCanvas.value.getContext('2d')
    // ... 绘制图表
  }
}
</script>
```

### 3. 在股票详情页面中使用

```typescript
// 在股票详情页面中集成WebSocket实时数据
const initWebSocket = () => {
  const manager = createRealTimeDataManager({
    url: 'ws://localhost:3001',
    enableLogging: true
  })

  const { connect, subscribeToStocks, subscribeToTimeShare, subscribeToKLine, on } = manager.initialize()

  connect()

  // 订阅当前股票的实时数据
  subscribeToStocks([stockCode.value], (data) => {
    // 更新股票详情
    stockDetail.value = {
      ...stockDetail.value,
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      volume: data.volume,
      amount: data.amount,
      high: data.high,
      low: data.low
    }
  })

  // 订阅分时数据
  subscribeToTimeShare(stockCode.value, (data) => {
    // 更新分时图
    drawTimeShareChart(data.data)
  })

  // 订阅K线数据
  subscribeToKLine(stockCode.value, '1day', (data) => {
    // 更新K线图
    drawKLineChart(data.data)
  })

  // 订阅深度数据
  subscribeToMarketDepth(stockCode.value, (data) => {
    // 更新五档行情
    askOrders.value = data.asks
    bidOrders.value = data.bids
  })

  return manager
}
```

## 服务器端 API

### 1. 客户端消息类型

#### 订阅消息

```javascript
// 订阅股票实时数据
socket.emit('subscribe_stock', {
  stockCode: '000001',
  name: '平安银行'
})

// 订阅分时数据
socket.emit('subscribe_timeshare', {
  stockCode: '000001'
})

// 订阅K线数据
socket.emit('subscribe_kline', {
  stockCode: '000001',
  interval: '1day'
})

// 订阅深度数据
socket.emit('subscribe_depth', {
  stockCode: '000001'
})
```

#### 取消订阅

```javascript
socket.emit('unsubscribe_stock', {
  stockCode: '000001'
})
```

#### 心跳检测

```javascript
socket.emit('heartbeat', {
  timestamp: Date.now()
})
```

### 2. 服务器消息类型

#### 连接确认
```javascript
{
  type: 'connected',
  data: {
    message: 'Connected to real-time market data server',
    clientId: 'socket_id',
    timestamp: 1640995200000
  }
}
```

#### 股票数据更新
```javascript
{
  type: 'stock_data',
  data: {
    code: '000001',
    name: '平安银行',
    price: 25.68,
    change: 0.15,
    changePercent: 0.59,
    volume: 12345678,
    amount: 316789012,
    high: 25.75,
    low: 25.52,
    open: 25.53,
    timestamp: 1640995200000
  },
  timestamp: 1640995200000
}
```

#### 分时数据更新
```javascript
{
  type: 'timeshare_data',
  data: {
    code: '000001',
    data: [
      {
        time: '09:30',
        price: 25.53,
        volume: 12000,
        amount: 306360,
        avgPrice: 25.53
      }
      // ... 更多数据点
    ]
  },
  timestamp: 1640995200000
}
```

#### K线数据更新
```javascript
{
  type: 'kline_data',
  data: {
    code: '000001',
    interval: '1day',
    data: [
      {
        time: '2024-01-01',
        open: 25.50,
        high: 25.80,
        low: 25.40,
        close: 25.68,
        volume: 12345678,
        amount: 316789012
      }
      // ... 更多K线数据
    ]
  },
  timestamp: 1640995200000
}
```

#### 深度数据更新
```javascript
{
  type: 'market_depth',
  data: {
    code: '000001',
    asks: [
      { price: 25.69, volume: 1200 },
      { price: 25.70, volume: 800 },
      // ... 更多卖盘
    ],
    bids: [
      { price: 25.67, volume: 1500 },
      { price: 25.66, volume: 900 },
      // ... 更多买盘
    ],
    timestamp: 1640995200000
  },
  timestamp: 1640995200000
}
```

## 配置选项

### 1. 客户端配置

```typescript
interface WebSocketConfig {
  url?: string                    // WebSocket服务器地址
  reconnectInterval?: number      // 重连间隔(毫秒)
  maxReconnectAttempts?: number   // 最大重连次数
  enableLogging?: boolean         // 是否启用日志
  heartbeatInterval?: number      // 心跳间隔(毫秒)
}
```

### 2. 服务器配置

```typescript
// 在环境变量中配置
process.env.CORS_ORIGIN = 'http://localhost:5175'
process.env.REDIS_URL = 'redis://localhost:6379'
```

## 特性

### 1. 自动重连
- 网络断开时自动重连
- 可配置重连间隔和最大重连次数
- 重连后自动恢复订阅

### 2. 心跳检测
- 定期发送心跳包保持连接
- 自动检测连接状态

### 3. 数据模拟
- 服务器内置数据模拟功能
- 支持实时价格、分时、K线、深度数据模拟

### 4. 订阅管理
- 支持多种数据类型订阅
- 自动管理订阅生命周期
- 支持取消订阅

### 5. 错误处理
- 完善的错误处理机制
- 优雅降级处理

## 性能优化

### 1. 数据压缩
- 支持消息压缩传输
- 减少网络带宽占用

### 2. 批量推送
- 支持批量数据推送
- 减少消息数量

### 3. 缓存机制
- 客户端数据缓存
- 避免重复请求

### 4. 连接池
- 支持多连接管理
- 提高并发处理能力

## 监控和统计

### 1. 连接统计
```typescript
const stats = manager.stats()
console.log('连接统计:', stats)
```

### 2. 服务器统计
```typescript
const serverStats = realTimeServer.getStats()
console.log('服务器统计:', serverStats)
```

## 部署

### 1. 开发环境
```bash
# 启动前端开发服务器
npm run dev:h5

# 启动后端服务器
cd server
npm run dev
```

### 2. 生产环境
```bash
# 构建前端
npm run build:h5

# 构建后端
cd server
npm run build

# 启动服务
npm start
```

## 注意事项

1. **网络环境**: 确保WebSocket端口可访问
2. **浏览器兼容**: 现代浏览器都支持WebSocket
3. **资源清理**: 组件销毁时记得清理连接
4. **错误处理**: 建议添加完整的错误处理逻辑
5. **性能监控**: 监控连接状态和数据流量