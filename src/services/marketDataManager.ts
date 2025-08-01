import { useWebSocket } from '@/services/websocketService'
import { useMarketStore } from '@/stores/useMarketStore'
import { useTradeStore } from '@/stores/useTradeStore'
import { ref, computed } from 'vue'

export interface MarketDataConfig {
  enabled: boolean
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
  enableLogging: boolean
  defaultSubscriptions: {
    indices: string[]
    hotStocks: boolean
    userPositions: boolean
  }
}

export class MarketDataManager {
  private marketStore: any
  private tradeStore: any
  private config: MarketDataConfig
  private subscriptions: Map<string, string> = new Map()
  private updateCallbacks: Map<string, Function> = new Map()

  constructor(config: MarketDataConfig) {
    this.config = config
    this.marketStore = useMarketStore()
    this.tradeStore = useTradeStore()
  }

  initialize() {
    if (!this.config.enabled) {
      console.log('[MarketDataManager] WebSocket disabled')
      return
    }

    const { connect, disconnect, subscribe, stats } = useWebSocket(
      {
        url: this.config.url,
        reconnectInterval: this.config.reconnectInterval,
        maxReconnectAttempts: this.config.maxReconnectAttempts,
        heartbeatInterval: this.config.heartbeatInterval,
        enableCompression: true,
        enableLogging: this.config.enableLogging
      },
      {
        onConnect: () => this.handleConnect(),
        onDisconnect: () => this.handleDisconnect(),
        onError: (error) => this.handleError(error),
        onMessage: (message) => this.handleMessage(message),
        onStockUpdate: (update) => this.handleStockUpdate(update),
        onIndexUpdate: (update) => this.handleIndexUpdate(update),
        onMarketUpdate: (update) => this.handleMarketUpdate(update),
        onHeartbeat: () => this.handleHeartbeat()
      }
    )

    return {
      connect,
      disconnect,
      subscribe,
      stats
    }
  }

  private handleConnect() {
    console.log('[MarketDataManager] Connected to market data stream')
    this.setupDefaultSubscriptions()
  }

  private handleDisconnect() {
    console.log('[MarketDataManager] Disconnected from market data stream')
  }

  private handleError(error: Error) {
    console.error('[MarketDataManager] WebSocket error:', error)
  }

  private handleMessage(message: any) {
    if (this.config.enableLogging) {
      console.log('[MarketDataManager] Received message:', message.type)
    }
  }

  private handleStockUpdate(update: any) {
    // Update market store with real-time stock data
    this.marketStore.updateStockPrice(
      update.code,
      update.price,
      update.change,
      update.changePercent
    )

    // Update trade store if user has positions in this stock
    const userPositions = this.tradeStore.positions
    const position = userPositions.find((p: any) => p.code === update.code)
    if (position) {
      this.tradeStore.updatePositionPrice(update.code, update.price)
    }

    // Trigger custom callbacks
    const callback = this.updateCallbacks.get(`stock_${update.code}`)
    if (callback) {
      callback(update)
    }
  }

  private handleIndexUpdate(update: any) {
    // Update market store with real-time index data
    this.marketStore.updateIndex(update.code, {
      price: update.price,
      change: update.change,
      changePercent: update.changePercent,
      volume: update.volume,
      amount: update.amount,
      timestamp: update.timestamp
    })

    // Trigger custom callbacks
    const callback = this.updateCallbacks.get(`index_${update.code}`)
    if (callback) {
      callback(update)
    }
  }

  private handleMarketUpdate(update: any) {
    // Handle general market updates
    switch (update.type) {
      case 'sentiment':
        this.marketStore.marketSentiment = update.data
        break
      case 'capital_flow':
        this.marketStore.capitalFlow = update.data
        break
      case 'market_status':
        this.marketStore.marketStatus = update.data
        break
    }

    // Trigger custom callbacks
    const callback = this.updateCallbacks.get(`market_${update.type}`)
    if (callback) {
      callback(update)
    }
  }

  private handleHeartbeat() {
    if (this.config.enableLogging) {
      console.log('[MarketDataManager] Heartbeat received')
    }
  }

  private setupDefaultSubscriptions() {
    const { subscribe } = this.initialize()
    
    // Subscribe to main indices
    if (this.config.defaultSubscriptions.indices.length > 0) {
      const subscriptionId = subscribe('index', this.config.defaultSubscriptions.indices)
      this.subscriptions.set('indices', subscriptionId)
    }

    // Subscribe to hot stocks
    if (this.config.defaultSubscriptions.hotStocks) {
      const hotStockCodes = this.marketStore.hotStocks.map((stock: any) => stock.code)
      if (hotStockCodes.length > 0) {
        const subscriptionId = subscribe('stock', hotStockCodes)
        this.subscriptions.set('hot_stocks', subscriptionId)
      }
    }

    // Subscribe to user's position stocks
    if (this.config.defaultSubscriptions.userPositions) {
      const positionCodes = this.tradeStore.positions.map((position: any) => position.code)
      if (positionCodes.length > 0) {
        const subscriptionId = subscribe('stock', positionCodes)
        this.subscriptions.set('user_positions', subscriptionId)
      }
    }
  }

  // Public methods for custom subscriptions
  subscribeToStocks(codes: string[], callback?: Function) {
    const { subscribe } = this.initialize()
    const subscriptionId = subscribe('stock', codes)
    
    this.subscriptions.set(`custom_stocks_${codes.join('_')}`, subscriptionId)
    
    if (callback) {
      codes.forEach(code => {
        this.updateCallbacks.set(`stock_${code}`, callback)
      })
    }
    
    return subscriptionId
  }

  subscribeToIndices(codes: string[], callback?: Function) {
    const { subscribe } = this.initialize()
    const subscriptionId = subscribe('index', codes)
    
    this.subscriptions.set(`custom_indices_${codes.join('_')}`, subscriptionId)
    
    if (callback) {
      codes.forEach(code => {
        this.updateCallbacks.set(`index_${code}`, callback)
      })
    }
    
    return subscriptionId
  }

  subscribeToMarketData(types: string[], callback?: Function) {
    const { subscribe } = this.initialize()
    const subscriptionId = subscribe('market', types)
    
    this.subscriptions.set(`custom_market_${types.join('_')}`, subscriptionId)
    
    if (callback) {
      types.forEach(type => {
        this.updateCallbacks.set(`market_${type}`, callback)
      })
    }
    
    return subscriptionId
  }

  unsubscribe(subscriptionKey: string) {
    const subscriptionId = this.subscriptions.get(subscriptionKey)
    if (subscriptionId) {
      const { unsubscribe } = this.initialize()
      unsubscribe(subscriptionId)
      this.subscriptions.delete(subscriptionKey)
      
      // Remove related callbacks
      const prefix = subscriptionKey.split('_')[0]
      this.updateCallbacks.forEach((_, key) => {
        if (key.startsWith(prefix)) {
          this.updateCallbacks.delete(key)
        }
      })
    }
  }

  // Real-time price alerts
  setPriceAlert(code: string, condition: 'above' | 'below' | 'equals', targetPrice: number, callback: Function) {
    const alertCallback = (update: any) => {
      const price = update.price
      let triggered = false

      switch (condition) {
        case 'above':
          triggered = price > targetPrice
          break
        case 'below':
          triggered = price < targetPrice
          break
        case 'equals':
          triggered = Math.abs(price - targetPrice) < 0.01
          break
      }

      if (triggered) {
        callback({ code, price, targetPrice, condition, timestamp: Date.now() })
      }
    }

    this.updateCallbacks.set(`alert_${code}_${condition}_${targetPrice}`, alertCallback)
    
    // Ensure we're subscribed to this stock
    if (!this.subscriptions.has(`stock_${code}`)) {
      this.subscribeToStocks([code])
    }

    return () => {
      this.updateCallbacks.delete(`alert_${code}_${condition}_${targetPrice}`)
    }
  }

  // Get current subscription status
  getSubscriptionStatus() {
    return {
      total: this.subscriptions.size,
      subscriptions: Array.from(this.subscriptions.entries()).map(([key, id]) => ({
        key,
        id,
        active: true
      })),
      callbacks: this.updateCallbacks.size
    }
  }

  // Clean up all subscriptions
  cleanup() {
    const { disconnect } = this.initialize()
    
    this.subscriptions.forEach((subscriptionId, key) => {
      this.unsubscribe(key)
    })
    
    this.updateCallbacks.clear()
    disconnect()
  }
}

// Default configuration
export const defaultMarketDataConfig: MarketDataConfig = {
  enabled: true,
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  enableLogging: import.meta.env.DEV,
  defaultSubscriptions: {
    indices: ['000001', '000002', '000300', '399001', '399006'],
    hotStocks: true,
    userPositions: true
  }
}

// Factory function for easy initialization
export function createMarketDataManager(config?: Partial<MarketDataConfig>) {
  const finalConfig = { ...defaultMarketDataConfig, ...config }
  return new MarketDataManager(finalConfig)
}