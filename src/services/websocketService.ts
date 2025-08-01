import { ref, reactive, onMounted, onUnmounted } from 'vue'
import type { 
  WebSocketConfig, 
  WebSocketCallbacks, 
  WebSocketMessage,
  StockQuoteUpdate,
  IndexUpdate,
  MarketDataUpdate,
  Subscription,
  WebSocketStats
} from '@/types/websocket'

class WebSocketService {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private callbacks: WebSocketCallbacks
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null
  private reconnectAttempts = 0
  private subscriptions: Map<string, Subscription> = new Map()
  private messageQueue: WebSocketMessage[] = []
  private stats: WebSocketStats

  constructor(config: WebSocketConfig, callbacks: WebSocketCallbacks) {
    this.config = config
    this.callbacks = callbacks
    this.stats = reactive({
      connected: false,
      reconnectAttempts: 0,
      messagesReceived: 0,
      messagesSent: 0,
      lastMessageTime: 0,
      connectionTime: 0,
      subscriptions: 0
    })
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      this.ws = new WebSocket(this.config.url)
      this.setupEventListeners()
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  disconnect(): void {
    this.clearTimers()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.stats.connected = false
    this.callbacks.onDisconnect?.()
  }

  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      this.stats.connected = true
      this.stats.connectionTime = Date.now()
      this.reconnectAttempts = 0
      this.callbacks.onConnect?.()
      this.startHeartbeat()
      this.resubscribeAll()
      this.flushMessageQueue()
    }

    this.ws.onmessage = (event) => {
      this.handleMessage(event)
    }

    this.ws.onclose = () => {
      this.stats.connected = false
      this.callbacks.onDisconnect?.()
      this.scheduleReconnect()
    }

    this.ws.onerror = (error) => {
      this.handleError(error as Error)
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      this.stats.messagesReceived++
      this.stats.lastMessageTime = Date.now()

      if (this.config.enableLogging) {
        console.log('[WebSocket] Received message:', message)
      }

      this.callbacks.onMessage?.(message)

      switch (message.type) {
        case 'stock_update':
          this.callbacks.onStockUpdate?.(message.data as StockQuoteUpdate)
          break
        case 'index_update':
          this.callbacks.onIndexUpdate?.(message.data as IndexUpdate)
          break
        case 'market_update':
          this.callbacks.onMarketUpdate?.(message.data as MarketDataUpdate)
          break
        case 'heartbeat':
          this.callbacks.onHeartbeat?.()
          break
        case 'subscription_ack':
          this.handleSubscriptionAck(message.data)
          break
        case 'error':
          console.error('[WebSocket] Server error:', message.data)
          break
      }
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error)
    }
  }

  sendMessage(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
      this.stats.messagesSent++
      
      if (this.config.enableLogging) {
        console.log('[WebSocket] Sent message:', message)
      }
    } else {
      this.messageQueue.push(message)
      if (this.config.enableLogging) {
        console.log('[WebSocket] Message queued:', message)
      }
    }
  }

  subscribe(type: 'stock' | 'index' | 'market', codes: string[], filters?: Record<string, any>): string {
    const subscriptionId = `${type}_${codes.join('_')}_${Date.now()}`
    
    const subscription: Subscription = {
      id: subscriptionId,
      type,
      codes,
      filters,
      active: true,
      createdAt: Date.now()
    }

    this.subscriptions.set(subscriptionId, subscription)
    this.stats.subscriptions = this.subscriptions.size

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'subscribe',
        data: {
          subscriptionId,
          type,
          codes,
          filters
        },
        timestamp: Date.now()
      })
    }

    return subscriptionId
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (subscription) {
      subscription.active = false
      this.subscriptions.delete(subscriptionId)
      this.stats.subscriptions = this.subscriptions.size

      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'unsubscribe',
          data: { subscriptionId },
          timestamp: Date.now()
        })
      }
    }
  }

  private resubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      if (subscription.active) {
        this.sendMessage({
          type: 'subscribe',
          data: {
            subscriptionId: subscription.id,
            type: subscription.type,
            codes: subscription.codes,
            filters: subscription.filters
          },
          timestamp: Date.now()
        })
      }
    })
  }

  private handleSubscriptionAck(data: any): void {
    const { subscriptionId, success, error } = data
    const subscription = this.subscriptions.get(subscriptionId)
    
    if (subscription) {
      if (success) {
        if (this.config.enableLogging) {
          console.log('[WebSocket] Subscription confirmed:', subscriptionId)
        }
      } else {
        console.error('[WebSocket] Subscription failed:', subscriptionId, error)
        subscription.active = false
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'heartbeat',
          data: { timestamp: Date.now() },
          timestamp: Date.now()
        })
      }
    }, this.config.heartbeatInterval)
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached')
      return
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectAttempts++
      this.stats.reconnectAttempts = this.reconnectAttempts
      console.log(`[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}`)
      this.connect()
    }, this.config.reconnectInterval)
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.sendMessage(message)
      }
    }
  }

  private handleError(error: Error): void {
    console.error('[WebSocket] Error:', error)
    this.callbacks.onError?.(error)
  }

  getStats(): WebSocketStats {
    return { ...this.stats }
  }

  getActiveSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active)
  }
}

export function useWebSocket(config: WebSocketConfig, callbacks: WebSocketCallbacks) {
  const service = ref<WebSocketService | null>(null)
  const stats = ref<WebSocketStats>({
    connected: false,
    reconnectAttempts: 0,
    messagesReceived: 0,
    messagesSent: 0,
    lastMessageTime: 0,
    connectionTime: 0,
    subscriptions: 0
  })

  const initialize = () => {
    service.value = new WebSocketService(config, callbacks)
    service.value.connect()
    
    // Update stats reactively
    const updateStats = () => {
      if (service.value) {
        Object.assign(stats.value, service.value.getStats())
      }
    }
    
    setInterval(updateStats, 1000)
  }

  const connect = () => {
    service.value?.connect()
  }

  const disconnect = () => {
    service.value?.disconnect()
  }

  const subscribe = (type: 'stock' | 'index' | 'market', codes: string[], filters?: Record<string, any>) => {
    return service.value?.subscribe(type, codes, filters) || ''
  }

  const unsubscribe = (subscriptionId: string) => {
    service.value?.unsubscribe(subscriptionId)
  }

  const sendMessage = (message: WebSocketMessage) => {
    service.value?.sendMessage(message)
  }

  onMounted(() => {
    initialize()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    stats,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendMessage,
    getActiveSubscriptions: () => service.value?.getActiveSubscriptions() || []
  }
}