import { Server } from 'socket.io'
import { Server as HTTPServer } from 'http'

interface RealTimeStockData {
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

interface TimeShareData {
  time: string
  price: number
  volume: number
  amount: number
  avgPrice: number
}

interface KLineData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  amount: number
}

interface MarketDepth {
  code: string
  asks: Array<{ price: number; volume: number }>
  bids: Array<{ price: number; volume: number }>
  timestamp: number
}

interface ClientSubscription {
  clientId: string
  stockCode: string
  dataType: 'quote' | 'timeshare' | 'kline' | 'depth'
  interval?: string
  active: boolean
  subscribedAt: number
}

export class RealTimeMarketDataServer {
  private io: Server
  private clients: Map<string, Set<string>> = new Map() // clientId -> stockCodes
  private subscriptions: Map<string, ClientSubscription[]> = new Map() // stockCode -> subscriptions
  private stockData: Map<string, RealTimeStockData> = new Map() // code -> stockData
  private timeShareData: Map<string, TimeShareData[]> = new Map() // code -> timeShareData
  private kLineData: Map<string, KLineData[]> = new Map() // code -> kLineData
  private marketDepth: Map<string, MarketDepth> = new Map() // code -> marketDepth
  private dataIntervals: Map<string, NodeJS.Timeout[]> = new Map() // code -> intervals
  private isRunning = false

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || ['http://localhost:5175', 'http://localhost:8080'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    this.io.on('connection', (socket) => {
      console.log(`[RealTimeMarketData] Client connected: ${socket.id}`)
      
      // 发送连接确认
      socket.emit('connected', {
        type: 'connection',
        data: {
          message: 'Connected to real-time market data server',
          clientId: socket.id,
          timestamp: Date.now()
        }
      })

      // 订阅股票实时数据
      socket.on('subscribe_stock', (data) => {
        this.handleStockSubscription(socket, data)
      })

      // 取消订阅
      socket.on('unsubscribe_stock', (data) => {
        this.handleStockUnsubscription(socket, data)
      })

      // 订阅分时数据
      socket.on('subscribe_timeshare', (data) => {
        this.handleTimeShareSubscription(socket, data)
      })

      // 订阅K线数据
      socket.on('subscribe_kline', (data) => {
        this.handleKLineSubscription(socket, data)
      })

      // 订阅深度数据
      socket.on('subscribe_depth', (data) => {
        this.handleDepthSubscription(socket, data)
      })

      // 心跳检测
      socket.on('heartbeat', (data) => {
        socket.emit('heartbeat', {
          type: 'heartbeat',
          data: {
            timestamp: Date.now(),
            serverTime: Date.now()
          }
        })
      })

      // 断开连接
      socket.on('disconnect', () => {
        this.handleDisconnect(socket)
      })

      // 错误处理
      socket.on('error', (error) => {
        console.error(`[RealTimeMarketData] Client error: ${socket.id}`, error)
      })
    })
  }

  private handleStockSubscription(socket: any, data: any) {
    const { stockCode, name } = data
    
    if (!stockCode) {
      socket.emit('error', {
        type: 'error',
        data: {
          message: 'Stock code is required',
          code: 'INVALID_STOCK_CODE'
        }
      })
      return
    }

    console.log(`[RealTimeMarketData] Client ${socket.id} subscribed to stock ${stockCode}`)

    // 添加客户端订阅
    if (!this.clients.has(socket.id)) {
      this.clients.set(socket.id, new Set())
    }
    this.clients.get(socket.id)!.add(stockCode)

    // 添加订阅记录
    const subscription: ClientSubscription = {
      clientId: socket.id,
      stockCode,
      dataType: 'quote',
      active: true,
      subscribedAt: Date.now()
    }

    if (!this.subscriptions.has(stockCode)) {
      this.subscriptions.set(stockCode, [])
    }
    this.subscriptions.get(stockCode)!.push(subscription)

    // 初始化股票数据
    this.initializeStockData(stockCode, name)

    // 开始推送实时数据
    this.startRealTimeDataPush(socket.id, stockCode)

    // 发送订阅确认
    socket.emit('subscription_ack', {
      type: 'subscription_ack',
      data: {
        stockCode,
        dataType: 'quote',
        status: 'subscribed',
        timestamp: Date.now()
      }
    })

    // 立即发送当前数据
    this.sendCurrentStockData(socket, stockCode)
  }

  private handleTimeShareSubscription(socket: any, data: any) {
    const { stockCode } = data
    
    if (!stockCode) {
      socket.emit('error', {
        type: 'error',
        data: {
          message: 'Stock code is required',
          code: 'INVALID_STOCK_CODE'
        }
      })
      return
    }

    console.log(`[RealTimeMarketData] Client ${socket.id} subscribed to timeshare data for ${stockCode}`)

    // 初始化分时数据
    this.initializeTimeShareData(stockCode)

    // 开始推送分时数据
    this.startTimeShareDataPush(socket.id, stockCode)

    // 发送订阅确认
    socket.emit('subscription_ack', {
      type: 'subscription_ack',
      data: {
        stockCode,
        dataType: 'timeshare',
        status: 'subscribed',
        timestamp: Date.now()
      }
    })

    // 立即发送当前分时数据
    this.sendCurrentTimeShareData(socket, stockCode)
  }

  private handleKLineSubscription(socket: any, data: any) {
    const { stockCode, interval = '1day' } = data
    
    if (!stockCode) {
      socket.emit('error', {
        type: 'error',
        data: {
          message: 'Stock code is required',
          code: 'INVALID_STOCK_CODE'
        }
      })
      return
    }

    console.log(`[RealTimeMarketData] Client ${socket.id} subscribed to kline data for ${stockCode} (${interval})`)

    // 初始化K线数据
    this.initializeKLineData(stockCode, interval)

    // 开始推送K线数据
    this.startKLineDataPush(socket.id, stockCode, interval)

    // 发送订阅确认
    socket.emit('subscription_ack', {
      type: 'subscription_ack',
      data: {
        stockCode,
        dataType: 'kline',
        interval,
        status: 'subscribed',
        timestamp: Date.now()
      }
    })

    // 立即发送当前K线数据
    this.sendCurrentKLineData(socket, stockCode, interval)
  }

  private handleDepthSubscription(socket: any, data: any) {
    const { stockCode } = data
    
    if (!stockCode) {
      socket.emit('error', {
        type: 'error',
        data: {
          message: 'Stock code is required',
          code: 'INVALID_STOCK_CODE'
        }
      })
      return
    }

    console.log(`[RealTimeMarketData] Client ${socket.id} subscribed to depth data for ${stockCode}`)

    // 初始化深度数据
    this.initializeMarketDepth(stockCode)

    // 开始推送深度数据
    this.startDepthDataPush(socket.id, stockCode)

    // 发送订阅确认
    socket.emit('subscription_ack', {
      type: 'subscription_ack',
      data: {
        stockCode,
        dataType: 'depth',
        status: 'subscribed',
        timestamp: Date.now()
      }
    })

    // 立即发送当前深度数据
    this.sendCurrentDepthData(socket, stockCode)
  }

  private handleStockUnsubscription(socket: any, data: any) {
    const { stockCode } = data
    
    if (!stockCode) return

    console.log(`[RealTimeMarketData] Client ${socket.id} unsubscribed from stock ${stockCode}`)

    // 移除客户端订阅
    const clientStocks = this.clients.get(socket.id)
    if (clientStocks) {
      clientStocks.delete(stockCode)
      if (clientStocks.size === 0) {
        this.clients.delete(socket.id)
      }
    }

    // 移除订阅记录
    const subscriptions = this.subscriptions.get(stockCode)
    if (subscriptions) {
      const filtered = subscriptions.filter(sub => sub.clientId !== socket.id)
      if (filtered.length === 0) {
        this.subscriptions.delete(stockCode)
        // 停止该股票的数据推送
        this.stopDataPush(stockCode)
      } else {
        this.subscriptions.set(stockCode, filtered)
      }
    }

    // 发送取消订阅确认
    socket.emit('unsubscription_ack', {
      type: 'unsubscription_ack',
      data: {
        stockCode,
        status: 'unsubscribed',
        timestamp: Date.now()
      }
    })
  }

  private handleDisconnect(socket: any) {
    console.log(`[RealTimeMarketData] Client disconnected: ${socket.id}`)
    
    // 清理该客户端的所有订阅
    const clientStocks = this.clients.get(socket.id)
    if (clientStocks) {
      clientStocks.forEach(stockCode => {
        const subscriptions = this.subscriptions.get(stockCode)
        if (subscriptions) {
          const filtered = subscriptions.filter(sub => sub.clientId !== socket.id)
          if (filtered.length === 0) {
            this.subscriptions.delete(stockCode)
            this.stopDataPush(stockCode)
          } else {
            this.subscriptions.set(stockCode, filtered)
          }
        }
      })
      this.clients.delete(socket.id)
    }
  }

  private initializeStockData(stockCode: string, name: string) {
    if (!this.stockData.has(stockCode)) {
      const basePrice = 10 + Math.random() * 100
      this.stockData.set(stockCode, {
        code: stockCode,
        name: name || `股票${stockCode}`,
        price: basePrice,
        change: 0,
        changePercent: 0,
        volume: 0,
        amount: 0,
        high: basePrice,
        low: basePrice,
        open: basePrice,
        timestamp: Date.now()
      })
    }
  }

  private initializeTimeShareData(stockCode: string) {
    if (!this.timeShareData.has(stockCode)) {
      const data: TimeShareData[] = []
      const basePrice = this.stockData.get(stockCode)?.price || 50
      
      // 生成240个分时数据点（模拟一天的交易时间）
      for (let i = 0; i < 240; i++) {
        const hour = Math.floor(i / 60) + 9
        const minute = i % 60
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        
        // 模拟价格波动
        const priceChange = (Math.random() - 0.5) * 0.2
        const price = basePrice + priceChange
        
        data.push({
          time,
          price,
          volume: Math.floor(Math.random() * 10000) + 1000,
          amount: price * (Math.floor(Math.random() * 10000) + 1000),
          avgPrice: price
        })
      }
      
      this.timeShareData.set(stockCode, data)
    }
  }

  private initializeKLineData(stockCode: string, interval: string) {
    const key = `${stockCode}_${interval}`
    if (!this.kLineData.has(key)) {
      const data: KLineData[] = []
      const basePrice = this.stockData.get(stockCode)?.price || 50
      
      // 生成30天的K线数据
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const time = date.toISOString().split('T')[0]
        
        const open = basePrice + (Math.random() - 0.5) * 2
        const close = open + (Math.random() - 0.5) * 1
        const high = Math.max(open, close) + Math.random() * 0.5
        const low = Math.min(open, close) - Math.random() * 0.5
        const volume = Math.floor(Math.random() * 100000) + 50000
        
        data.push({
          time,
          open,
          high,
          low,
          close,
          volume,
          amount: (open + close) / 2 * volume
        })
      }
      
      this.kLineData.set(key, data)
    }
  }

  private initializeMarketDepth(stockCode: string) {
    if (!this.marketDepth.has(stockCode)) {
      const currentPrice = this.stockData.get(stockCode)?.price || 50
      
      // 生成五档行情数据
      const asks = []
      const bids = []
      
      for (let i = 1; i <= 5; i++) {
        asks.push({
          price: currentPrice + i * 0.01,
          volume: Math.floor(Math.random() * 1000) + 100
        })
        bids.push({
          price: currentPrice - i * 0.01,
          volume: Math.floor(Math.random() * 1000) + 100
        })
      }
      
      this.marketDepth.set(stockCode, {
        code: stockCode,
        asks,
        bids,
        timestamp: Date.now()
      })
    }
  }

  private startRealTimeDataPush(clientId: string, stockCode: string) {
    // 每3秒推送一次实时行情数据
    const interval = setInterval(() => {
      this.updateStockData(stockCode)
      this.broadcastStockData(stockCode)
    }, 3000)

    if (!this.dataIntervals.has(stockCode)) {
      this.dataIntervals.set(stockCode, [])
    }
    this.dataIntervals.get(stockCode)!.push(interval)
  }

  private startTimeShareDataPush(clientId: string, stockCode: string) {
    // 每5秒推送一次分时数据
    const interval = setInterval(() => {
      this.updateTimeShareData(stockCode)
      this.broadcastTimeShareData(stockCode)
    }, 5000)

    if (!this.dataIntervals.has(stockCode)) {
      this.dataIntervals.set(stockCode, [])
    }
    this.dataIntervals.get(stockCode)!.push(interval)
  }

  private startKLineDataPush(clientId: string, stockCode: string, interval: string) {
    // 每10秒推送一次K线数据
    const pushInterval = setInterval(() => {
      this.broadcastKLineData(stockCode, interval)
    }, 10000)

    // 每30秒更新一次K线数据
    const updateInterval = setInterval(() => {
      this.updateKLineData(stockCode, interval)
    }, 30000)

    if (!this.dataIntervals.has(stockCode)) {
      this.dataIntervals.set(stockCode, [])
    }
    this.dataIntervals.get(stockCode)!.push(pushInterval, updateInterval)
  }

  private startDepthDataPush(clientId: string, stockCode: string) {
    // 每2秒推送一次深度数据
    const interval = setInterval(() => {
      this.updateMarketDepth(stockCode)
      this.broadcastMarketDepth(stockCode)
    }, 2000)

    if (!this.dataIntervals.has(stockCode)) {
      this.dataIntervals.set(stockCode, [])
    }
    this.dataIntervals.get(stockCode)!.push(interval)
  }

  private updateStockData(stockCode: string) {
    const stockData = this.stockData.get(stockCode)
    if (!stockData) return

    const priceChange = (Math.random() - 0.5) * 0.1
    const newPrice = stockData.price + priceChange
    const change = newPrice - stockData.open
    const changePercent = (change / stockData.open) * 100

    stockData.price = newPrice
    stockData.change = change
    stockData.changePercent = changePercent
    stockData.volume += Math.floor(Math.random() * 1000) + 100
    stockData.amount += newPrice * (Math.floor(Math.random() * 1000) + 100)
    stockData.high = Math.max(stockData.high, newPrice)
    stockData.low = Math.min(stockData.low, newPrice)
    stockData.timestamp = Date.now()
  }

  private updateTimeShareData(stockCode: string) {
    const timeShareData = this.timeShareData.get(stockCode)
    if (!timeShareData) return

    // 移除第一个数据点，添加新的数据点
    timeShareData.shift()
    
    const lastData = timeShareData[timeShareData.length - 1]
    const stockData = this.stockData.get(stockCode)
    const currentPrice = stockData?.price || lastData.price
    
    const hour = Math.floor(timeShareData.length / 60) + 9
    const minute = timeShareData.length % 60
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    
    timeShareData.push({
      time,
      price: currentPrice,
      volume: Math.floor(Math.random() * 10000) + 1000,
      amount: currentPrice * (Math.floor(Math.random() * 10000) + 1000),
      avgPrice: currentPrice
    })
  }

  private updateKLineData(stockCode: string, interval: string) {
    const key = `${stockCode}_${interval}`
    const kLineData = this.kLineData.get(key)
    if (!kLineData) return

    // 更新最后一个K线数据点
    const lastKLine = kLineData[kLineData.length - 1]
    const stockData = this.stockData.get(stockCode)
    const currentPrice = stockData?.price || lastKLine.close
    
    lastKLine.close = currentPrice
    lastKLine.high = Math.max(lastKLine.high, currentPrice)
    lastKLine.low = Math.min(lastKLine.low, currentPrice)
    lastKLine.volume += Math.floor(Math.random() * 10000) + 1000
    lastKLine.amount = (lastKLine.open + lastKLine.close) / 2 * lastKLine.volume
  }

  private updateMarketDepth(stockCode: string) {
    const depth = this.marketDepth.get(stockCode)
    if (!depth) return

    const stockData = this.stockData.get(stockCode)
    const currentPrice = stockData?.price || 50

    // 更新五档行情
    depth.asks.forEach((ask, index) => {
      ask.price = currentPrice + (index + 1) * 0.01
      ask.volume = Math.floor(Math.random() * 1000) + 100
    })

    depth.bids.forEach((bid, index) => {
      bid.price = currentPrice - (index + 1) * 0.01
      bid.volume = Math.floor(Math.random() * 1000) + 100
    })

    depth.timestamp = Date.now()
  }

  private broadcastStockData(stockCode: string) {
    const stockData = this.stockData.get(stockCode)
    if (!stockData) return

    const subscriptions = this.subscriptions.get(stockCode)
    if (!subscriptions) return

    const message = {
      type: 'stock_quote',
      data: stockData,
      timestamp: Date.now()
    }

    subscriptions.forEach(subscription => {
      if (subscription.active && subscription.dataType === 'quote') {
        const clientSocket = this.io.sockets.sockets.get(subscription.clientId)
        if (clientSocket) {
          clientSocket.emit('stock_data', message)
        }
      }
    })
  }

  private broadcastTimeShareData(stockCode: string) {
    const timeShareData = this.timeShareData.get(stockCode)
    if (!timeShareData) return

    const message = {
      type: 'timeshare_data',
      data: {
        code: stockCode,
        data: timeShareData
      },
      timestamp: Date.now()
    }

    // 发送给所有订阅该股票分时数据的客户端
    this.io.emit('timeshare_data', message)
  }

  private broadcastKLineData(stockCode: string, interval: string) {
    const key = `${stockCode}_${interval}`
    const kLineData = this.kLineData.get(key)
    if (!kLineData) return

    const message = {
      type: 'kline_data',
      data: {
        code: stockCode,
        interval,
        data: kLineData
      },
      timestamp: Date.now()
    }

    // 发送给所有订阅该股票K线数据的客户端
    this.io.emit('kline_data', message)
  }

  private broadcastMarketDepth(stockCode: string) {
    const depth = this.marketDepth.get(stockCode)
    if (!depth) return

    const message = {
      type: 'market_depth',
      data: depth,
      timestamp: Date.now()
    }

    // 发送给所有订阅该股票深度数据的客户端
    this.io.emit('market_depth', message)
  }

  private sendCurrentStockData(socket: any, stockCode: string) {
    const stockData = this.stockData.get(stockCode)
    if (!stockData) return

    socket.emit('stock_data', {
      type: 'stock_quote',
      data: stockData,
      timestamp: Date.now()
    })
  }

  private sendCurrentTimeShareData(socket: any, stockCode: string) {
    const timeShareData = this.timeShareData.get(stockCode)
    if (!timeShareData) return

    socket.emit('timeshare_data', {
      type: 'timeshare_data',
      data: {
        code: stockCode,
        data: timeShareData
      },
      timestamp: Date.now()
    })
  }

  private sendCurrentKLineData(socket: any, stockCode: string, interval: string) {
    const key = `${stockCode}_${interval}`
    const kLineData = this.kLineData.get(key)
    if (!kLineData) return

    socket.emit('kline_data', {
      type: 'kline_data',
      data: {
        code: stockCode,
        interval,
        data: kLineData
      },
      timestamp: Date.now()
    })
  }

  private sendCurrentDepthData(socket: any, stockCode: string) {
    const depth = this.marketDepth.get(stockCode)
    if (!depth) return

    socket.emit('market_depth', {
      type: 'market_depth',
      data: depth,
      timestamp: Date.now()
    })
  }

  private stopDataPush(stockCode: string) {
    const intervals = this.dataIntervals.get(stockCode)
    if (intervals) {
      intervals.forEach(interval => clearInterval(interval))
      this.dataIntervals.delete(stockCode)
    }
  }

  public getStats() {
    return {
      connectedClients: this.clients.size,
      activeSubscriptions: this.subscriptions.size,
      totalSubscriptions: Array.from(this.subscriptions.values()).reduce((acc, subs) => acc + subs.length, 0),
      trackedStocks: this.stockData.size,
      isRunning: this.isRunning
    }
  }

  public start() {
    this.isRunning = true
    console.log('[RealTimeMarketData] Server started')
  }

  public shutdown() {
    this.isRunning = false
    
    // 清理所有定时器
    this.dataIntervals.forEach(intervals => {
      intervals.forEach(interval => clearInterval(interval))
    })
    this.dataIntervals.clear()
    
    // 关闭WebSocket连接
    this.io.close()
    
    console.log('[RealTimeMarketData] Server shutdown complete')
  }
}