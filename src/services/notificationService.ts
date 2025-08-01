import { ref } from 'vue'
import { storage } from '@/utils/storage'
import { useAppStore } from '@/stores/useAppStore'

export interface Notification {
  id: string
  type: 'news' | 'trade' | 'system' | 'security'
  title: string
  content: string
  timestamp: number
  read: boolean
  data?: any
}

export interface PushSettings {
  news: {
    breaking: boolean
    important: boolean
    category: string[]
    stock: string[]
  }
  trade: {
    order: boolean
    position: boolean
    alert: boolean
  }
  system: {
    update: boolean
    maintenance: boolean
    security: boolean
  }
  sound: boolean
  vibration: boolean
  led: boolean
}

class NotificationService {
  private static instance: NotificationService
  private notifications = ref<Notification[]>([])
  private pushSettings = ref<PushSettings>({
    news: {
      breaking: true,
      important: true,
      category: [],
      stock: []
    },
    trade: {
      order: true,
      position: true,
      alert: true
    },
    system: {
      update: true,
      maintenance: true,
      security: true
    },
    sound: true,
    vibration: true,
    led: true
  })

  private websocket: any = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // 初始化推送服务
  async init() {
    await this.loadSettings()
    await this.loadNotifications()
    this.connectWebSocket()
    this.requestNotificationPermission()
  }

  // 连接WebSocket
  private connectWebSocket() {
    try {
      const token = storage.get('user_token')
      if (!token) return

      this.websocket = uni.connectSocket({
        url: `wss://api.example.com/ws/notifications?token=${token}`,
        complete: () => {
          // WebSocket连接完成回调
        }
      })

      this.websocket.onOpen(() => {
        console.log('通知WebSocket连接已建立')
        this.reconnectAttempts = 0
        this.sendHeartbeat()
      })

      this.websocket.onMessage(async (res: any) => {
        try {
          const data = JSON.parse(res.data)
          await this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('解析WebSocket消息失败:', error)
        }
      })

      this.websocket.onError((error: any) => {
        console.error('通知WebSocket连接错误:', error)
        this.reconnect()
      })

      this.websocket.onClose(() => {
        console.log('通知WebSocket连接已关闭')
        this.reconnect()
      })
    } catch (error) {
      console.error('连接WebSocket失败:', error)
      this.reconnect()
    }
  }

  // 重新连接
  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`尝试重新连接WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connectWebSocket()
      }, this.reconnectInterval)
    }
  }

  // 发送心跳包
  private sendHeartbeat() {
    setInterval(() => {
      if (this.websocket && this.websocket.readyState === 1) {
        this.websocket.send({
          data: JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })
        })
      }
    }, 30000)
  }

  // 处理WebSocket消息
  private async handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'notification':
        await this.handleNotification(data.data)
        break
      case 'news_update':
        await this.handleNewsUpdate(data.data)
        break
      case 'trade_update':
        await this.handleTradeUpdate(data.data)
        break
      case 'system_message':
        await this.handleSystemMessage(data.data)
        break
      case 'heartbeat':
        // 心跳响应，无需处理
        break
      default:
        console.warn('未知消息类型:', data.type)
    }
  }

  // 处理通知消息
  private async handleNotification(notificationData: any) {
    const notification: Notification = {
      id: notificationData.id,
      type: notificationData.type,
      title: notificationData.title,
      content: notificationData.content,
      timestamp: notificationData.timestamp,
      read: false,
      data: notificationData.data
    }

    // 检查推送设置
    if (this.shouldPushNotification(notification)) {
      this.showNotification(notification)
    }

    // 添加到通知列表
    this.notifications.value.unshift(notification)
    await this.saveNotifications()
  }

  // 处理新闻更新
  private async handleNewsUpdate(newsData: any) {
    const settings = this.pushSettings.value.news
    
    // 检查是否应该推送
    if (newsData.importance === 'breaking' && settings.breaking) {
      const notification: Notification = {
        id: `news_${newsData.id}`,
        type: 'news',
        title: '快讯',
        content: newsData.title,
        timestamp: Date.now(),
        read: false,
        data: newsData
      }
      
      this.showNotification(notification)
    }
  }

  // 处理交易更新
  private async handleTradeUpdate(tradeData: any) {
    const settings = this.pushSettings.value.trade
    
    let shouldPush = false
    let title = ''
    let content = ''
    
    switch (tradeData.type) {
      case 'order':
        if (settings.order) {
          shouldPush = true
          title = '订单通知'
          content = `您的${tradeData.action}订单已${tradeData.status}`
        }
        break
      case 'position':
        if (settings.position) {
          shouldPush = true
          title = '持仓通知'
          content = `您的${tradeData.stockName}持仓有变动`
        }
        break
      case 'alert':
        if (settings.alert) {
          shouldPush = true
          title = '价格提醒'
          content = `${tradeData.stockName}已达到${tradeData.alertPrice}元`
        }
        break
    }
    
    if (shouldPush) {
      const notification: Notification = {
        id: `trade_${tradeData.id}`,
        type: 'trade',
        title,
        content,
        timestamp: Date.now(),
        read: false,
        data: tradeData
      }
      
      this.showNotification(notification)
    }
  }

  // 处理系统消息
  private async handleSystemMessage(systemData: any) {
    const settings = this.pushSettings.value.system
    
    let shouldPush = false
    
    switch (systemData.type) {
      case 'update':
        shouldPush = settings.update
        break
      case 'maintenance':
        shouldPush = settings.maintenance
        break
      case 'security':
        shouldPush = settings.security
        break
    }
    
    if (shouldPush) {
      const notification: Notification = {
        id: `system_${systemData.id}`,
        type: 'system',
        title: systemData.title,
        content: systemData.content,
        timestamp: Date.now(),
        read: false,
        data: systemData
      }
      
      this.showNotification(notification)
    }
  }

  // 检查是否应该推送通知
  private shouldPushNotification(notification: Notification): boolean {
    const settings = this.pushSettings.value
    
    switch (notification.type) {
      case 'news': {
        const newsSettings = settings.news
        if (notification.data?.importance === 'breaking' && newsSettings.breaking) {
          return true
        }
        if (notification.data?.importance === 'important' && newsSettings.important) {
          return true
        }
        if (notification.data?.category && newsSettings.category.includes(notification.data.category)) {
          return true
        }
        if (notification.data?.stock && newsSettings.stock.includes(notification.data.stock)) {
          return true
        }
        return false
      }
        
      case 'trade':
        return settings.trade[(notification.data?.type as keyof typeof settings.trade)] || false
        
      case 'system':
        return settings.system[(notification.data?.type as keyof typeof settings.system)] || false
        
      default:
        return false
    }
  }

  // 显示通知
  private showNotification(notification: Notification) {
    const appStore = useAppStore()
    
    // 系统通知
    if (this.pushSettings.value.sound) {
      uni.vibrateShort()
    }
    
    // 应用内通知
    appStore.showToast(notification.title)
    
    // 状态栏通知（仅APP）
    // #ifdef APP-PLUS
    plus.push.createMessage(notification.content, JSON.stringify(notification.data))
    // #endif
  }

  // 请求通知权限
  private requestNotificationPermission() {
    // #ifdef APP-PLUS
    plus.push.getClientInfoAsync((info: any) => {
      if (info.clientid) {
        storage.set('push_client_id', info.clientid)
      }
    }, (error: any) => {
      console.error('获取推送信息失败:', error)
    })
    
    // 请求权限
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const push = plus.push as any
    if (push.requestPermission) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      push.requestPermission((result: any) => {
        if (result.granted) {
          console.log('通知权限已授予')
        } else {
          console.log('通知权限被拒绝')
        }
      })
    } else {
      console.log('设备不支持通知权限请求')
    }
    // #endif
  }

  // 获取通知列表
  getNotifications(): Notification[] {
    return this.notifications.value
  }

  // 获取未读通知数量
  getUnreadCount(): number {
    return this.notifications.value.filter(n => !n.read).length
  }

  // 标记通知为已读
  async markAsRead(notificationId: string) {
    const notification = this.notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      await this.saveNotifications()
    }
  }

  // 标记所有通知为已读
  async markAllAsRead() {
    this.notifications.value.forEach(n => n.read = true)
    await this.saveNotifications()
  }

  // 删除通知
  async deleteNotification(notificationId: string) {
    this.notifications.value = this.notifications.value.filter(n => n.id !== notificationId)
    await this.saveNotifications()
  }

  // 清空所有通知
  async clearAllNotifications() {
    this.notifications.value = []
    await this.saveNotifications()
  }

  // 获取推送设置
  getPushSettings(): PushSettings {
    return this.pushSettings.value
  }

  // 更新推送设置
  async updatePushSettings(settings: Partial<PushSettings>) {
    this.pushSettings.value = { ...this.pushSettings.value, ...settings }
    await this.saveSettings()
  }

  // 订阅股票通知
  async subscribeStockNotification(stockCode: string) {
    if (!this.pushSettings.value.news.stock.includes(stockCode)) {
      this.pushSettings.value.news.stock.push(stockCode)
      await this.saveSettings()
    }
  }

  // 取消订阅股票通知
  async unsubscribeStockNotification(stockCode: string) {
    this.pushSettings.value.news.stock = this.pushSettings.value.news.stock.filter(s => s !== stockCode)
    await this.saveSettings()
  }

  // 订阅分类通知
  async subscribeCategoryNotification(category: string) {
    if (!this.pushSettings.value.news.category.includes(category)) {
      this.pushSettings.value.news.category.push(category)
      await this.saveSettings()
    }
  }

  // 取消订阅分类通知
  async unsubscribeCategoryNotification(category: string) {
    this.pushSettings.value.news.category = this.pushSettings.value.news.category.filter(c => c !== category)
    await this.saveSettings()
  }

  // 保存通知到本地存储
  private async saveNotifications() {
    try {
      await storage.set('notifications', this.notifications.value.slice(0, 100)) // 只保存最近100条
    } catch (error) {
      console.error('保存通知失败:', error)
    }
  }

  // 加载通知
  private async loadNotifications() {
    try {
      const saved = await storage.get('notifications')
      if (saved) {
        this.notifications.value = saved
      }
    } catch (error) {
      console.error('加载通知失败:', error)
    }
  }

  // 保存设置
  private async saveSettings() {
    try {
      await storage.set('push_settings', this.pushSettings.value)
    } catch (error) {
      console.error('保存推送设置失败:', error)
    }
  }

  // 加载设置
  private async loadSettings() {
    try {
      const saved = await storage.get('push_settings')
      if (saved) {
        this.pushSettings.value = { ...this.pushSettings.value, ...saved }
      }
    } catch (error) {
      console.error('加载推送设置失败:', error)
    }
  }

  // 销毁服务
  destroy() {
    if (this.websocket) {
      this.websocket.close()
    }
  }
}

export const notificationService = NotificationService.getInstance()