import type { 
  Stock, 
  MarketIndex, 
  MarketHotStock,
  MarketCapitalFlow,
  MarketSentiment
} from '@/types'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
  id?: string
}

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

export interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
  enableCompression: boolean
  enableLogging: boolean
}

export interface WebSocketCallbacks {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  onMessage?: (message: WebSocketMessage) => void
  onStockUpdate?: (update: StockQuoteUpdate) => void
  onIndexUpdate?: (update: IndexUpdate) => void
  onMarketUpdate?: (update: MarketDataUpdate) => void
  onHeartbeat?: () => void
}

export interface Subscription {
  id: string
  type: 'stock' | 'index' | 'market'
  codes: string[]
  filters?: Record<string, any>
  active: boolean
  createdAt: number
}

export interface WebSocketStats {
  connected: boolean
  reconnectAttempts: number
  messagesReceived: number
  messagesSent: number
  lastMessageTime: number
  connectionTime: number
  subscriptions: number
}