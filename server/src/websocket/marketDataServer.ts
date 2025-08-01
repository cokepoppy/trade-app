import { Server } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { createClient } from 'redis'

interface ClientSubscription {
  id: string
  clientId: string
  type: 'stock' | 'index' | 'market'
  codes: string[]
  filters?: Record<string, any>
  active: boolean
  createdAt: number
}

interface MarketDataMessage {
  type: string
  data: any
  timestamp: number
  id?: string
}

export class MarketDataWebSocketServer {
  private io: Server
  private redisClient: any
  private subscriptions: Map<string, ClientSubscription[]> = new Map()
  private clients: Map<string, Set<string>> = new Map() // clientId -> subscriptionIds
  private marketDataInterval: NodeJS.Timeout | null = null
  private isRunning = false

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    // Initialize Redis client for pub/sub
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })

    this.setupEventListeners()
  }

  async initialize() {
    try {
      await this.redisClient.connect()
      console.log('[WebSocket] Redis client connected')
      
      this.setupRedisSubscriptions()
      this.startMarketDataGeneration()
      this.isRunning = true
      
      console.log('[WebSocket] Market data server initialized successfully')
    } catch (error) {
      console.error('[WebSocket] Failed to initialize:', error)
    }
  }

  private setupEventListeners() {
    this.io.on('connection', (socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`)
      
      socket.on('subscribe', (data) => {
        this.handleSubscribe(socket, data)
      })

      socket.on('unsubscribe', (data) => {
        this.handleUnsubscribe(socket, data)
      })

      socket.on('heartbeat', (data) => {
        this.handleHeartbeat(socket, data)
      })

      socket.on('disconnect', () => {
        this.handleDisconnect(socket)
      })

      socket.on('error', (error) => {
        console.error(`[WebSocket] Client error: ${socket.id}`, error)
      })

      // Send initial connection acknowledgment
      socket.emit('connected', {
        message: 'Connected to market data stream',
        timestamp: Date.now(),
        clientId: socket.id
      })
    })
  }

  private async setupRedisSubscriptions() {
    try {
      const subscriber = this.redisClient.duplicate()
      await subscriber.connect()
      
      await subscriber.subscribe('market_updates', (message) => {
        const data = JSON.parse(message)
        this.broadcastMarketUpdate(data)
      })
      
      console.log('[WebSocket] Redis subscriptions set up')
    } catch (error) {
      console.error('[WebSocket] Failed to setup Redis subscriptions:', error)
    }
  }

  private handleSubscribe(socket: any, data: any) {
    const { subscriptionId, type, codes, filters } = data
    
    if (!subscriptionId || !type || !codes || !Array.isArray(codes)) {
      socket.emit('error', {
        message: 'Invalid subscription data',
        subscriptionId,
        timestamp: Date.now()
      })
      return
    }

    const subscription: ClientSubscription = {
      id: subscriptionId,
      clientId: socket.id,
      type,
      codes,
      filters,
      active: true,
      createdAt: Date.now()
    }

    // Store subscription
    if (!this.subscriptions.has(subscriptionId)) {
      this.subscriptions.set(subscriptionId, [])
    }
    this.subscriptions.get(subscriptionId)!.push(subscription)

    // Track client subscriptions
    if (!this.clients.has(socket.id)) {
      this.clients.set(socket.id, new Set())
    }
    this.clients.get(socket.id)!.add(subscriptionId)

    console.log(`[WebSocket] Subscription created: ${subscriptionId} for client ${socket.id}`)

    // Send acknowledgment
    socket.emit('subscription_ack', {
      subscriptionId,
      success: true,
      timestamp: Date.now()
    })

    // Send initial data for the subscription
    this.sendInitialData(socket, subscription)
  }

  private handleUnsubscribe(socket: any, data: any) {
    const { subscriptionId } = data
    
    if (!subscriptionId) return

    // Remove subscription
    const subscriptions = this.subscriptions.get(subscriptionId)
    if (subscriptions) {
      const filtered = subscriptions.filter(sub => sub.clientId !== socket.id)
      if (filtered.length === 0) {
        this.subscriptions.delete(subscriptionId)
      } else {
        this.subscriptions.set(subscriptionId, filtered)
      }
    }

    // Remove from client tracking
    const clientSubs = this.clients.get(socket.id)
    if (clientSubs) {
      clientSubs.delete(subscriptionId)
      if (clientSubs.size === 0) {
        this.clients.delete(socket.id)
      }
    }

    console.log(`[WebSocket] Subscription removed: ${subscriptionId} for client ${socket.id}`)

    socket.emit('subscription_ack', {
      subscriptionId,
      success: true,
      timestamp: Date.now()
    })
  }

  private handleHeartbeat(socket: any, data: any) {
    socket.emit('heartbeat', {
      timestamp: Date.now(),
      serverTime: Date.now()
    })
  }

  private handleDisconnect(socket: any) {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`)
    
    // Clean up all subscriptions for this client
    const clientSubs = this.clients.get(socket.id)
    if (clientSubs) {
      clientSubs.forEach(subscriptionId => {
        const subscriptions = this.subscriptions.get(subscriptionId)
        if (subscriptions) {
          const filtered = subscriptions.filter(sub => sub.clientId !== socket.id)
          if (filtered.length === 0) {
            this.subscriptions.delete(subscriptionId)
          } else {
            this.subscriptions.set(subscriptionId, filtered)
          }
        }
      })
      this.clients.delete(socket.id)
    }
  }

  private sendInitialData(socket: any, subscription: ClientSubscription) {
    // Send initial data based on subscription type
    switch (subscription.type) {
      case 'stock':
        this.sendInitialStockData(socket, subscription)
        break
      case 'index':
        this.sendInitialIndexData(socket, subscription)
        break
      case 'market':
        this.sendInitialMarketData(socket, subscription)
        break
    }
  }

  private sendInitialStockData(socket: any, subscription: ClientSubscription) {
    subscription.codes.forEach(code => {
      const stockData = this.generateMockStockData(code)
      socket.emit('stock_update', {
        type: 'stock_update',
        data: stockData,
        timestamp: Date.now()
      })
    })
  }

  private sendInitialIndexData(socket: any, subscription: ClientSubscription) {
    subscription.codes.forEach(code => {
      const indexData = this.generateMockIndexData(code)
      socket.emit('index_update', {
        type: 'index_update',
        data: indexData,
        timestamp: Date.now()
      })
    })
  }

  private sendInitialMarketData(socket: any, subscription: ClientSubscription) {
    // Send market overview data
    const marketData = {
      type: 'market_update',
      data: {
        type: 'overview',
        data: this.generateMockMarketOverview()
      },
      timestamp: Date.now()
    }
    socket.emit('market_update', marketData)
  }

  private startMarketDataGeneration() {
    // Generate mock market data every second
    this.marketDataInterval = setInterval(() => {
      this.generateAndBroadcastMarketData()
    }, 1000)
  }

  private generateAndBroadcastMarketData() {
    // Generate updates for all active subscriptions
    this.subscriptions.forEach((subscriptions, subscriptionId) => {
      subscriptions.forEach(subscription => {
        if (!subscription.active) return

        switch (subscription.type) {
          case 'stock':
            this.broadcastStockUpdates(subscription)
            break
          case 'index':
            this.broadcastIndexUpdates(subscription)
            break
          case 'market':
            this.broadcastMarketUpdates(subscription)
            break
        }
      })
    })
  }

  private broadcastStockUpdates(subscription: ClientSubscription) {
    subscription.codes.forEach(code => {
      const update = this.generateStockUpdate(code)
      this.broadcastToSubscription(subscription.id, {
        type: 'stock_update',
        data: update,
        timestamp: Date.now()
      })
    })
  }

  private broadcastIndexUpdates(subscription: ClientSubscription) {
    subscription.codes.forEach(code => {
      const update = this.generateIndexUpdate(code)
      this.broadcastToSubscription(subscription.id, {
        type: 'index_update',
        data: update,
        timestamp: Date.now()
      })
    })
  }

  private broadcastMarketUpdates(subscription: ClientSubscription) {
    // Broadcast market sentiment updates
    const sentimentUpdate = this.generateSentimentUpdate()
    this.broadcastToSubscription(subscription.id, {
      type: 'market_update',
      data: sentimentUpdate,
      timestamp: Date.now()
    })
  }

  private broadcastToSubscription(subscriptionId: string, message: MarketDataMessage) {
    const subscriptions = this.subscriptions.get(subscriptionId)
    if (!subscriptions) return

    subscriptions.forEach(subscription => {
      const clientSocket = this.io.sockets.sockets.get(subscription.clientId)
      if (clientSocket && subscription.active) {
        clientSocket.emit(message.type, message)
      }
    })
  }

  private broadcastMarketUpdate(data: any) {
    this.io.emit('market_update', {
      type: 'market_update',
      data,
      timestamp: Date.now()
    })
  }

  // Mock data generation methods
  private generateMockStockData(code: string) {
    const basePrice = 100 + Math.random() * 900
    return {
      code,
      price: basePrice,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000),
      amount: Math.floor(Math.random() * 100000000),
      high: basePrice + Math.random() * 5,
      low: basePrice - Math.random() * 5,
      open: basePrice + (Math.random() - 0.5) * 3,
      timestamp: Date.now()
    }
  }

  private generateMockIndexData(code: string) {
    const basePrice = 2000 + Math.random() * 3000
    return {
      code,
      price: basePrice,
      change: (Math.random() - 0.5) * 50,
      changePercent: (Math.random() - 0.5) * 2,
      volume: Math.floor(Math.random() * 10000000),
      amount: Math.floor(Math.random() * 1000000000),
      timestamp: Date.now()
    }
  }

  private generateMockMarketOverview() {
    return {
      totalStocks: 4500,
      risingStocks: 2345,
      fallingStocks: 1890,
      unchangedStocks: 265,
      totalVolume: 1234567890123,
      totalTurnover: 9876543210987,
      timestamp: Date.now()
    }
  }

  private generateStockUpdate(code: string) {
    const previousPrice = this.getPreviousPrice(code) || 100
    const change = (Math.random() - 0.5) * 2
    const newPrice = previousPrice + change
    const changePercent = (change / previousPrice) * 100

    this.updatePreviousPrice(code, newPrice)

    return {
      code,
      price: newPrice,
      change: change,
      changePercent: changePercent,
      volume: Math.floor(Math.random() * 100000),
      amount: Math.floor(Math.random() * 10000000),
      high: newPrice + Math.random() * 0.5,
      low: newPrice - Math.random() * 0.5,
      open: previousPrice,
      timestamp: Date.now()
    }
  }

  private generateIndexUpdate(code: string) {
    const previousPrice = this.getPreviousPrice(code) || 3000
    const change = (Math.random() - 0.5) * 20
    const newPrice = previousPrice + change
    const changePercent = (change / previousPrice) * 100

    this.updatePreviousPrice(code, newPrice)

    return {
      code,
      price: newPrice,
      change: change,
      changePercent: changePercent,
      volume: Math.floor(Math.random() * 1000000),
      amount: Math.floor(Math.random() * 100000000),
      timestamp: Date.now()
    }
  }

  private generateSentimentUpdate() {
    return {
      type: 'sentiment',
      data: {
        overall: ['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)],
        score: Math.random(),
        bullishRatio: Math.random(),
        bearishRatio: Math.random(),
        neutralRatio: Math.random(),
        timestamp: Date.now()
      }
    }
  }

  private previousPrices: Map<string, number> = new Map()

  private getPreviousPrice(code: string): number | undefined {
    return this.previousPrices.get(code)
  }

  private updatePreviousPrice(code: string, price: number) {
    this.previousPrices.set(code, price)
  }

  // Public methods for external data sources
  publishStockUpdate(code: string, data: any) {
    this.io.emit('stock_update', {
      type: 'stock_update',
      data: { code, ...data },
      timestamp: Date.now()
    })
  }

  publishIndexUpdate(code: string, data: any) {
    this.io.emit('index_update', {
      type: 'index_update',
      data: { code, ...data },
      timestamp: Date.now()
    })
  }

  publishMarketUpdate(type: string, data: any) {
    this.io.emit('market_update', {
      type: 'market_update',
      data: { type, data },
      timestamp: Date.now()
    })
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      activeSubscriptions: this.subscriptions.size,
      totalSubscriptions: Array.from(this.subscriptions.values()).reduce((acc, subs) => acc + subs.length, 0),
      isRunning: this.isRunning
    }
  }

  shutdown() {
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval)
    }
    
    this.io.close()
    this.redisClient.disconnect()
    
    this.isRunning = false
    console.log('[WebSocket] Market data server shutdown complete')
  }
}