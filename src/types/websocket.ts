import type { 
  Stock, 
  MarketIndex, 
  MarketHotStock,
  MarketCapitalFlow,
  MarketSentiment
} from '@/types'

// 基础WebSocket消息类型
export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
  id?: string
}

// 实时股票数据
export interface RealTimeStockData {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  amount: number
  high: number
  low: number
  open: number
  timestamp: number
}

// 分时数据
export interface TimeShareData {
  time: string
  price: number
  volume: number
  amount: number
  avgPrice: number
}

// K线数据
export interface KLineData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  amount: number
}

// 市场深度数据
export interface MarketDepth {
  code: string
  asks: Array<{ price: number; volume: number }>
  bids: Array<{ price: number; volume: number }>
  timestamp: number
}

// 兼容旧的接口
export interface StockQuoteUpdate {
  code: string
  price: number
  change: number
  changePercent: number
  volume: number
  amount: number
  high: number
  low: number
  open: number
  timestamp: number
}

export interface IndexUpdate {
  code: string
  price: number
  change: number
  changePercent: number
  volume: number
  amount: number
  timestamp: number
}

export interface MarketDataUpdate {
  type: 'stock' | 'index' | 'market'
  data: StockQuoteUpdate | IndexUpdate | any
  timestamp: number
}

// 实时数据更新消息
export interface StockQuoteUpdateMessage {
  type: 'stock_quote'
  data: RealTimeStockData
  timestamp: number
}

export interface TimeShareUpdateMessage {
  type: 'timeshare_data'
  data: {
    code: string
    data: TimeShareData[]
  }
  timestamp: number
}

export interface KLineUpdateMessage {
  type: 'kline_data'
  data: {
    code: string
    interval: string
    data: KLineData[]
  }
  timestamp: number
}

export interface MarketDepthUpdateMessage {
  type: 'market_depth'
  data: MarketDepth
  timestamp: number
}

// WebSocket配置
export interface WebSocketConfig {
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  enableCompression?: boolean
  enableLogging?: boolean
}

// WebSocket回调
export interface WebSocketCallbacks {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  onMessage?: (message: WebSocketMessage) => void
  onStockUpdate?: (update: StockQuoteUpdate) => void
  onIndexUpdate?: (update: IndexUpdate) => void
  onMarketUpdate?: (update: MarketDataUpdate) => void
  onHeartbeat?: () => void
  onRealTimeStockUpdate?: (data: RealTimeStockData) => void
  onTimeShareUpdate?: (data: { code: string; data: TimeShareData[] }) => void
  onKLineUpdate?: (data: { code: string; interval: string; data: KLineData[] }) => void
  onMarketDepthUpdate?: (data: MarketDepth) => void
}

// 订阅信息
export interface Subscription {
  id: string
  type: 'stock' | 'index' | 'market' | 'timeshare' | 'kline' | 'depth'
  codes?: string[]
  stockCode?: string
  interval?: string
  filters?: Record<string, any>
  active: boolean
  createdAt: number
}

// 连接状态
export interface ConnectionStatus {
  connected: boolean
  reconnectAttempts: number
  subscriptionsCount: number
  lastConnectTime: number
  lastDisconnectTime: number
}

// WebSocket统计
export interface WebSocketStats {
  connected: boolean
  reconnectAttempts: number
  messagesReceived: number
  messagesSent: number
  lastMessageTime: number
  connectionTime: number
  subscriptions: number
  connectedClients?: number
  totalSubscriptions?: number
  subscriptionsList?: Subscription[]
  connectionStatus?: ConnectionStatus
}

// 价格提醒
export interface PriceAlert {
  id: string
  code: string
  condition: 'above' | 'below' | 'equals'
  targetPrice: number
  active: boolean
  triggered: boolean
  createdAt: number
  triggeredAt?: number
}

// K线周期
export type KLineInterval = '1min' | '5min' | '15min' | '30min' | '1hour' | '1day' | '1week' | '1month'

// 订阅类型
export type SubscriptionType = 'stock' | 'timeshare' | 'kline' | 'depth' | 'index' | 'market'

// WebSocket事件类型
export type WebSocketEventType = 
  | 'connected'
  | 'disconnected'
  | 'message'
  | 'stock_data'
  | 'timeshare_data'
  | 'kline_data'
  | 'market_depth'
  | 'subscription_ack'
  | 'unsubscription_ack'
  | 'heartbeat'
  | 'error'
  | 'server_connected'
  | 'stock_update'
  | 'timeshare_update'
  | 'kline_update'
  | 'depth_update'