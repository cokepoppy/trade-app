import type { RealTimeStockData, TimeShareData, KLineData, MarketDepth } from '@/types'
import { io, type Socket } from 'socket.io-client'

interface WebSocketConfig {
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  enableLogging?: boolean
  heartbeatInterval?: number
}

interface Subscription {
  id: string
  type: 'stock' | 'timeshare' | 'kline' | 'depth'
  stockCode: string
  interval?: string
  callback?: (data: any) => void
  active: boolean
  createdAt: number
}

interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}

export class RealTimeDataManager {
  private socket: Socket | null = null
  private config: WebSocketConfig
  private isConnected = false
  private reconnectAttempts = 0
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null
  private subscriptions: Map<string, Subscription> = new Map()
  private callbacks: Map<string, Array<(data: any) => void>> = new Map()
  private stats = {
    connectedClients: 0,
    totalSubscriptions: 0,
    messagesReceived: 0,
    messagesSent: 0,
    lastConnectTime: 0,
    lastDisconnectTime: 0
  }

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      url: config.url || (import.meta.env.VITE_WS_URL || 'http://localhost:3000'),
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      enableLogging: config.enableLogging || import.meta.env.DEV,
      heartbeatInterval: config.heartbeatInterval || 30000
    }
  }

  initialize() {
    this.connect()
    
    return {
      connect: () => this.connect(),
      disconnect: () => this.disconnect(),
      subscribeToStocks: (codes: string[], callback?: (data: RealTimeStockData) => void) => this.subscribeToStocks(codes, callback),
      subscribeToTimeShare: (code: string, callback?: (data: { code: string; data: TimeShareData[] }) => void) => this.subscribeToTimeShare(code, callback),
      subscribeToKLine: (code: string, interval?: string, callback?: (data: { code: string; interval: string; data: KLineData[] }) => void) => this.subscribeToKLine(code, interval, callback),
      subscribeToMarketDepth: (code: string, callback?: (data: MarketDepth) => void) => this.subscribeToMarketDepth(code, callback),
      unsubscribe: (subscriptionId: string) => this.unsubscribe(subscriptionId),
      unsubscribeAll: () => this.unsubscribeAll(),
      on: (event: string, callback: (data: any) => void) => this.on(event, callback),
      off: (event: string, callback: (data: any) => void) => this.off(event, callback),
      stats: () => this.getStats(),
      getConnectionStatus: () => this.getConnectionStatus()
    }
  }

  private connect() {
    try {
      if (this.socket && this.isConnected) {
        this.log('Socket.io already connected')
        return
      }

      this.log('Connecting to Socket.io server:', this.config.url)
      
      // 创建Socket.io连接
      this.socket = io(this.config.url!, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: this.config.maxReconnectAttempts,
        reconnectionDelay: this.config.reconnectInterval
      })
      
      // 设置Socket.io事件监听
      this.socket.on('connect', () => this.handleOpen())
      this.socket.on('disconnect', (reason) => this.handleClose({ code: 1000, reason } as CloseEvent))
      this.socket.on('connect_error', (error) => this.handleError(error))
      this.socket.on('connected', (data) => this.handleConnected({ type: 'connected', data, timestamp: Date.now() }))
      this.socket.on('stock_data', (data) => this.handleStockData({ type: 'stock_data', data, timestamp: Date.now() }))
      this.socket.on('timeshare_data', (data) => this.handleTimeShareData({ type: 'timeshare_data', data, timestamp: Date.now() }))
      this.socket.on('kline_data', (data) => this.handleKLineData({ type: 'kline_data', data, timestamp: Date.now() }))
      this.socket.on('market_depth', (data) => this.handleMarketDepth({ type: 'market_depth', data, timestamp: Date.now() }))
      this.socket.on('subscription_ack', (data) => this.handleSubscriptionAck({ type: 'subscription_ack', data, timestamp: Date.now() }))
      this.socket.on('unsubscription_ack', (data) => this.handleUnsubscriptionAck({ type: 'unsubscription_ack', data, timestamp: Date.now() }))
      this.socket.on('heartbeat', (data) => this.handleHeartbeat({ type: 'heartbeat', data, timestamp: Date.now() }))
      this.socket.on('error', (data) => this.handleError(data))
      
    } catch (error) {
      this.log('Connection error:', error)
      this.handleReconnect()
    }
  }

  private disconnect() {
    this.log('Disconnecting Socket.io...')
    
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.isConnected = false
    this.stats.lastDisconnectTime = Date.now()
  }

  private handleOpen() {
    this.log('Socket.io connected')
    this.isConnected = true
    this.reconnectAttempts = 0
    this.stats.lastConnectTime = Date.now()
    
    // 开始心跳检测
    this.startHeartbeat()
    
    // 重新订阅所有订阅
    this.resubscribeAll()
    
    // 触发连接事件
    this.emit('connected', { timestamp: Date.now() })
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      this.stats.messagesReceived++
      
      this.log('Received message:', message.type)
      
      // 处理不同类型的消息
      switch (message.type) {
        case 'connected':
          this.handleConnected(message)
          break
        case 'stock_data':
          this.handleStockData(message)
          break
        case 'timeshare_data':
          this.handleTimeShareData(message)
          break
        case 'kline_data':
          this.handleKLineData(message)
          break
        case 'market_depth':
          this.handleMarketDepth(message)
          break
        case 'subscription_ack':
          this.handleSubscriptionAck(message)
          break
        case 'unsubscription_ack':
          this.handleUnsubscriptionAck(message)
          break
        case 'heartbeat':
          this.handleHeartbeat(message)
          break
        case 'error':
          this.handleError(message)
          break
        default:
          this.log('Unknown message type:', message.type)
      }
      
      // 触发消息事件
      this.emit('message', message)
      this.emit(message.type, message)
      
    } catch (error) {
      this.log('Message parsing error:', error)
    }
  }

  private handleClose(event: CloseEvent) {
    this.log('Socket.io disconnected:', event.code, event.reason)
    this.isConnected = false
    this.stats.lastDisconnectTime = Date.now()
    
    // 停止心跳检测
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    
    // 触发断开连接事件
    this.emit('disconnected', { code: event.code, reason: event.reason })
    
    // 尝试重连
    this.handleReconnect()
  }

  private handleError(error: any) {
    this.log('Socket.io error:', error)
    this.emit('error', error)
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      this.log('Max reconnection attempts reached')
      this.emit('max_reconnect_reached', { attempts: this.reconnectAttempts })
      return
    }
    
    this.reconnectAttempts++
    this.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`)
    
    this.reconnectTimer = window.setTimeout(() => {
      this.connect()
    }, this.config.reconnectInterval)
  }

  private startHeartbeat() {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.isConnected && this.socket) {
        this.socket.emit('heartbeat', { timestamp: Date.now() })
        this.stats.messagesSent++
      }
    }, this.config.heartbeatInterval)
  }

  private handleConnected(message: WebSocketMessage) {
    this.log('Connection acknowledged by server')
    this.emit('server_connected', message.data)
  }

  private handleStockData(message: WebSocketMessage) {
    const stockData: RealTimeStockData = message.data
    this.emit('stock_update', stockData)
    
    // 触发特定股票的更新事件
    this.emit(`stock_update_${stockData.code}`, stockData)
  }

  private handleTimeShareData(message: WebSocketMessage) {
    const { code, data } = message.data
    const timeShareData: TimeShareData[] = data
    this.emit('timeshare_update', { code, data: timeShareData })
    
    // 触发特定股票的分时更新事件
    this.emit(`timeshare_update_${code}`, { code, data: timeShareData })
  }

  private handleKLineData(message: WebSocketMessage) {
    const { code, interval, data } = message.data
    const kLineData: KLineData[] = data
    this.emit('kline_update', { code, interval, data: kLineData })
    
    // 触发特定股票的K线更新事件
    this.emit(`kline_update_${code}`, { code, interval, data: kLineData })
  }

  private handleMarketDepth(message: WebSocketMessage) {
    const depthData: MarketDepth = message.data
    this.emit('depth_update', depthData)
    
    // 触发特定股票的深度更新事件
    this.emit(`depth_update_${depthData.code}`, depthData)
  }

  private handleSubscriptionAck(message: WebSocketMessage) {
    this.log('Subscription acknowledged:', message.data)
    this.emit('subscription_ack', message.data)
  }

  private handleUnsubscriptionAck(message: WebSocketMessage) {
    this.log('Unsubscription acknowledged:', message.data)
    this.emit('unsubscription_ack', message.data)
  }

  private handleHeartbeat(message: WebSocketMessage) {
    this.log('Heartbeat received from server')
    this.emit('heartbeat', message.data)
  }

  // 订阅方法
  private subscribeToStocks(codes: string[], callback?: (data: RealTimeStockData) => void): string {
    const subscriptionId = `stock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    codes.forEach(code => {
      const subscription: Subscription = {
        id: `${subscriptionId}_${code}`,
        type: 'stock',
        stockCode: code,
        callback,
        active: true,
        createdAt: Date.now()
      }
      
      this.subscriptions.set(subscription.id, subscription)
      
      if (this.isConnected && this.socket) {
        this.socket.emit('subscribe_stock', { stockCode: code })
        this.stats.messagesSent++
      }
    })
    
    this.stats.totalSubscriptions += codes.length
    this.log(`Subscribed to stocks:`, codes)
    
    return subscriptionId
  }

  private subscribeToTimeShare(code: string, callback?: (data: { code: string; data: TimeShareData[] }) => void): string {
    const subscriptionId = `timeshare_${code}_${Date.now()}`
    
    const subscription: Subscription = {
      id: subscriptionId,
      type: 'timeshare',
      stockCode: code,
      callback,
      active: true,
      createdAt: Date.now()
    }
    
    this.subscriptions.set(subscriptionId, subscription)
    
    if (this.isConnected && this.socket) {
      this.socket.emit('subscribe_timeshare', { stockCode: code })
      this.stats.messagesSent++
    }
    
    this.stats.totalSubscriptions++
    this.log(`Subscribed to timeshare data for:`, code)
    
    return subscriptionId
  }

  private subscribeToKLine(code: string, interval = '1day', callback?: (data: { code: string; interval: string; data: KLineData[] }) => void): string {
    const subscriptionId = `kline_${code}_${interval}_${Date.now()}`
    
    const subscription: Subscription = {
      id: subscriptionId,
      type: 'kline',
      stockCode: code,
      interval,
      callback,
      active: true,
      createdAt: Date.now()
    }
    
    this.subscriptions.set(subscriptionId, subscription)
    
    if (this.isConnected && this.socket) {
      this.socket.emit('subscribe_kline', { stockCode: code, interval })
      this.stats.messagesSent++
    }
    
    this.stats.totalSubscriptions++
    this.log(`Subscribed to kline data for:`, code, interval)
    
    return subscriptionId
  }

  private subscribeToMarketDepth(code: string, callback?: (data: MarketDepth) => void): string {
    const subscriptionId = `depth_${code}_${Date.now()}`
    
    const subscription: Subscription = {
      id: subscriptionId,
      type: 'depth',
      stockCode: code,
      callback,
      active: true,
      createdAt: Date.now()
    }
    
    this.subscriptions.set(subscriptionId, subscription)
    
    if (this.isConnected && this.socket) {
      this.socket.emit('subscribe_depth', { stockCode: code })
      this.stats.messagesSent++
    }
    
    this.stats.totalSubscriptions++
    this.log(`Subscribed to market depth for:`, code)
    
    return subscriptionId
  }

  private unsubscribe(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return
    
    if (this.isConnected && this.socket) {
      this.socket.emit('unsubscribe_stock', { stockCode: subscription.stockCode })
      this.stats.messagesSent++
    }
    
    this.subscriptions.delete(subscriptionId)
    this.stats.totalSubscriptions--
    
    this.log(`Unsubscribed from:`, subscriptionId)
  }

  private unsubscribeAll() {
    if (this.isConnected && this.socket) {
      this.subscriptions.forEach(subscription => {
        this.socket!.emit('unsubscribe_stock', { stockCode: subscription.stockCode })
        this.stats.messagesSent++
      })
    }
    
    this.subscriptions.clear()
    this.stats.totalSubscriptions = 0
    
    this.log('Unsubscribed from all subscriptions')
  }

  private resubscribeAll() {
    if (!this.isConnected || !this.socket) return
    
    this.subscriptions.forEach(subscription => {
      switch (subscription.type) {
        case 'stock':
          this.socket!.emit('subscribe_stock', { stockCode: subscription.stockCode })
          break
        case 'timeshare':
          this.socket!.emit('subscribe_timeshare', { stockCode: subscription.stockCode })
          break
        case 'kline':
          this.socket!.emit('subscribe_kline', { stockCode: subscription.stockCode, interval: subscription.interval })
          break
        case 'depth':
          this.socket!.emit('subscribe_depth', { stockCode: subscription.stockCode })
          break
      }
      this.stats.messagesSent++
    })
    
    this.log('Resubscribed to all subscriptions')
  }

  // 事件处理
  private on(event: string, callback: (data: any) => void) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event)!.push(callback)
  }

  private off(event: string, callback: (data: any) => void) {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          this.log('Callback error:', error)
        }
      })
    }
  }

  // 工具方法
  private log(...args: any[]) {
    if (this.config.enableLogging) {
      console.log('[RealTimeDataManager]', ...args)
    }
  }

  private getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      subscriptionsCount: this.subscriptions.size,
      lastConnectTime: this.stats.lastConnectTime,
      lastDisconnectTime: this.stats.lastDisconnectTime
    }
  }

  private getStats() {
    return {
      ...this.stats,
      subscriptions: Array.from(this.subscriptions.values()),
      connectionStatus: this.getConnectionStatus()
    }
  }

  // 价格提醒功能
  private setPriceAlert(code: string, condition: 'above' | 'below' | 'equals', targetPrice: number, callback: (data: RealTimeStockData) => void) {
    const alertId = `alert_${code}_${condition}_${targetPrice}_${Date.now()}`
    
    const handlePriceUpdate = (data: RealTimeStockData) => {
      if (data.code === code) {
        let triggered = false
        
        switch (condition) {
          case 'above':
            triggered = data.price > targetPrice
            break
          case 'below':
            triggered = data.price < targetPrice
            break
          case 'equals':
            triggered = Math.abs(data.price - targetPrice) < 0.01
            break
        }
        
        if (triggered) {
          callback(data)
          this.off(`stock_update_${code}`, handlePriceUpdate)
        }
      }
    }
    
    this.on(`stock_update_${code}`, handlePriceUpdate)
    
    return () => {
      this.off(`stock_update_${code}`, handlePriceUpdate)
    }
  }

  // 清理资源
  cleanup() {
    this.disconnect()
    this.subscriptions.clear()
    this.callbacks.clear()
  }
}

// 工厂函数
export function createRealTimeDataManager(config?: WebSocketConfig) {
  return new RealTimeDataManager(config)
}