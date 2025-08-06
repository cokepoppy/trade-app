import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  TradeOrder, 
  TradePosition, 
  TradeDeal, 
  TradeAccount, 
  TradeFundFlow,
  TradeSetting,
  TradeStatistics,
  TradePerformance
} from '@/types'
import { tradeService } from '@/services/tradeService'
import { storage } from '@/utils/storage'
import { storageKeys } from '@/utils/storage'

export const useTradeStore = defineStore('trade', () => {
  const orders = ref<TradeOrder[]>([])
  const positions = ref<TradePosition[]>([])
  const deals = ref<TradeDeal[]>([])
  const accounts = ref<TradeAccount[]>([])
  const fundFlows = ref<TradeFundFlow[]>([])
  const settings = ref<TradeSetting | null>(null)
  const statistics = ref<TradeStatistics | null>(null)
  const performance = ref<Record<string, TradePerformance>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdate = ref<number>(0)

  const currentAccount = computed(() => {
    return accounts.value.find(account => account.status === 'active') || accounts.value[0] || null
  })

  const totalAssets = computed(() => {
    return accounts.value.reduce((sum, account) => sum + account.totalAssets, 0)
  })

  const totalProfit = computed(() => {
    return accounts.value.reduce((sum, account) => sum + account.profit, 0)
  })

  const totalProfitPercent = computed(() => {
    const totalCost = accounts.value.reduce((sum, account) => sum + account.costAmount, 0)
    if (totalCost === 0) return 0
    return (totalProfit.value / totalCost) * 100
  })

  const todayProfit = computed(() => {
    return accounts.value.reduce((sum, account) => sum + account.todayProfit, 0)
  })

  const availableBalance = computed(() => {
    return accounts.value.reduce((sum, account) => sum + account.availableBalance, 0)
  })

  const frozenBalance = computed(() => {
    return accounts.value.reduce((sum, account) => sum + account.frozenBalance, 0)
  })

  const marketValue = computed(() => {
    return accounts.value.reduce((sum, account) => sum + account.marketValue, 0)
  })

  const pendingOrders = computed(() => {
    const ordersArray = Array.isArray(orders.value) ? orders.value : []
    return ordersArray.filter(order => ['pending', 'partial'].includes(order.status))
  })

  const filledOrders = computed(() => {
    const ordersArray = Array.isArray(orders.value) ? orders.value : []
    return ordersArray.filter(order => order.status === 'filled')
  })

  const cancelledOrders = computed(() => {
    const ordersArray = Array.isArray(orders.value) ? orders.value : []
    return ordersArray.filter(order => order.status === 'cancelled')
  })

  const todayOrders = computed(() => {
    const today = new Date().toDateString()
    const ordersArray = Array.isArray(orders.value) ? orders.value : []
    return ordersArray.filter(order => 
      new Date(order.orderTime).toDateString() === today
    )
  })

  const todayDeals = computed(() => {
    const today = new Date().toDateString()
    const dealsArray = Array.isArray(deals.value) ? deals.value : []
    return dealsArray.filter(deal => 
      new Date(deal.dealTime).toDateString() === today
    )
  })

  const todayFundFlows = computed(() => {
    const today = new Date().toDateString()
    const flowsArray = Array.isArray(fundFlows.value) ? fundFlows.value : []
    return flowsArray.filter(flow => 
      new Date(flow.createTime).toDateString() === today
    )
  })

  const positionByCode = computed(() => {
    const result: Record<string, TradePosition> = {}
    const positionsArray = Array.isArray(positions.value) ? positions.value : []
    positionsArray.forEach(position => {
      result[position.code] = position
    })
    return result
  })

  const initialize = async () => {
    try {
      loading.value = true
      error.value = null
      
      // 使用更长的延迟和更好的错误处理来避免429错误
      console.log('Trade store initialization started')
      
      // 只加载最关键的数据，其他数据延迟加载
      await fetchAccountsWithRetry()
      
      // 延迟加载其他数据
      setTimeout(async () => {
        try {
          await fetchSettingsWithRetry()
          if (currentAccount.value) {
            await new Promise(resolve => setTimeout(resolve, 2000))
            await fetchPositions()
            await new Promise(resolve => setTimeout(resolve, 2000))
            await fetchOrders()
          }
        } catch (err) {
          console.error('Delayed data loading error:', err)
        }
      }, 3000) // 3秒后开始加载其他数据
      
      lastUpdate.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取交易数据失败'
      console.error('Trade store initialization error:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchAccounts = async () => {
    let retryCount = 0
    const maxRetries = 3
    const baseDelay = 1000 // 1 second
    
    while (retryCount <= maxRetries) {
      try {
        const response = await tradeService.getAccounts()
        const responseData = response.data
        if (Array.isArray(responseData)) {
          accounts.value = responseData
          return
        } else {
          console.warn('Accounts API response data is not an array:', responseData)
          accounts.value = []
          return
        }
      } catch (err: any) {
        if (err.response?.status === 429 && retryCount < maxRetries) {
          retryCount++
          const delay = baseDelay * Math.pow(2, retryCount) // Exponential backoff
          console.log(`Rate limited, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          console.error('Fetch accounts error:', err)
          accounts.value = []
          return
        }
      }
    }
  }

  const fetchPositions = async (accountId?: string) => {
    try {
      const response = await tradeService.getPositions(accountId)
      const responseData = response.data
      if (Array.isArray(responseData)) {
        positions.value = responseData
      } else {
        console.warn('Positions API response data is not an array:', responseData)
        positions.value = []
      }
    } catch (err) {
      console.error('Fetch positions error:', err)
      positions.value = []
    }
  }

  const fetchOrders = async (params?: any) => {
    try {
      const response = await tradeService.getOrders(params)
      // Ensure response.data is always an array
      const responseData = response.data
      if (Array.isArray(responseData)) {
        orders.value = responseData
      } else if (responseData && responseData.list && Array.isArray(responseData.list)) {
        // Handle paginated response structure
        orders.value = responseData.list
      } else {
        console.warn('Orders API response data is not an array:', responseData)
        orders.value = []
      }
    } catch (err) {
      console.error('Fetch orders error:', err)
      orders.value = []
    }
  }

  const fetchDeals = async (params?: any) => {
    try {
      const response = await tradeService.getDeals(params)
      const responseData = response.data
      if (Array.isArray(responseData)) {
        deals.value = responseData
      } else if (responseData && responseData.list && Array.isArray(responseData.list)) {
        // Handle paginated response structure
        deals.value = responseData.list
      } else {
        console.warn('Deals API response data is not an array:', responseData)
        deals.value = []
      }
    } catch (err) {
      console.error('Fetch deals error:', err)
      deals.value = []
    }
  }

  const fetchFundFlows = async (params?: any) => {
    try {
      const response = await tradeService.getFundFlows(params)
      const responseData = response.data
      if (Array.isArray(responseData)) {
        fundFlows.value = responseData
      } else if (responseData && responseData.list && Array.isArray(responseData.list)) {
        // Handle paginated response structure
        fundFlows.value = responseData.list
      } else {
        console.warn('Fund flows API response data is not an array:', responseData)
        fundFlows.value = []
      }
    } catch (err) {
      console.error('Fetch fund flows error:', err)
      fundFlows.value = []
    }
  }

  const fetchAccountsWithRetry = async () => {
    let retryCount = 0
    const maxRetries = 5
    const baseDelay = 3000 // 3 seconds
    
    while (retryCount <= maxRetries) {
      try {
        const response = await tradeService.getAccounts()
        const responseData = response.data
        if (Array.isArray(responseData)) {
          accounts.value = responseData
          return
        } else {
          console.warn('Accounts API response data is not an array:', responseData)
          accounts.value = []
          return
        }
      } catch (err: any) {
        if (err.response?.status === 429 && retryCount < maxRetries) {
          retryCount++
          const delay = baseDelay * Math.pow(2, retryCount) // Exponential backoff
          console.log(`Rate limited, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          console.error('Fetch accounts error:', err)
          accounts.value = []
          return
        }
      }
    }
  }

  const fetchSettingsWithRetry = async () => {
    let retryCount = 0
    const maxRetries = 5
    const baseDelay = 3000 // 3 seconds
    
    while (retryCount <= maxRetries) {
      try {
        const response = await tradeService.getSettings()
        settings.value = response.data
        storage.set(storageKeys.TRADE_SETTINGS, response.data)
        return
      } catch (err: any) {
        if (err.response?.status === 429 && retryCount < maxRetries) {
          retryCount++
          const delay = baseDelay * Math.pow(2, retryCount) // Exponential backoff
          console.log(`Rate limited, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          console.error('Fetch settings error:', err)
          return
        }
      }
    }
  }

  const fetchSettings = async () => {
    let retryCount = 0
    const maxRetries = 3
    const baseDelay = 1000 // 1 second
    
    while (retryCount <= maxRetries) {
      try {
        const response = await tradeService.getSettings()
        settings.value = response.data
        storage.set(storageKeys.TRADE_SETTINGS, response.data)
        return
      } catch (err: any) {
        if (err.response?.status === 429 && retryCount < maxRetries) {
          retryCount++
          const delay = baseDelay * Math.pow(2, retryCount) // Exponential backoff
          console.log(`Rate limited, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          console.error('Fetch settings error:', err)
          return
        }
      }
    }
  }

  const fetchStatistics = async (params?: any) => {
    try {
      const response = await tradeService.getStatistics(params)
      statistics.value = response.data
    } catch (err) {
      console.error('Fetch statistics error:', err)
    }
  }

  const fetchPerformance = async (period: string, params?: any) => {
    try {
      const response = await tradeService.getPerformance(period, params)
      performance.value[period] = response.data
    } catch (err) {
      console.error('Fetch performance error:', err)
    }
  }

  const placeOrder = async (orderData: any) => {
    try {
      const response = await tradeService.placeOrder(orderData)
      const newOrder = response.data
      // Ensure orders.value is always an array before unshift
      if (!Array.isArray(orders.value)) {
        console.warn('orders.value is not an array, resetting to empty array')
        orders.value = []
      }
      orders.value.unshift(newOrder)
      return newOrder
    } catch (err) {
      error.value = err instanceof Error ? err.message : '下单失败'
      console.error('Place order error:', err)
      throw err
    }
  }

  const cancelOrder = async (orderId: string) => {
    try {
      const response = await tradeService.cancelOrder(orderId)
      const updatedOrder = response.data
      // Ensure orders.value is always an array
      if (!Array.isArray(orders.value)) {
        console.warn('orders.value is not an array, resetting to empty array')
        orders.value = []
      }
      const index = orders.value.findIndex(order => order.id === orderId)
      if (index !== -1) {
        orders.value[index] = updatedOrder
      }
      return updatedOrder
    } catch (err) {
      error.value = err instanceof Error ? err.message : '撤单失败'
      console.error('Cancel order error:', err)
      throw err
    }
  }

  const updateOrder = (orderId: string, updates: Partial<TradeOrder>) => {
    // Ensure orders.value is always an array
    if (!Array.isArray(orders.value)) {
      console.warn('orders.value is not an array, resetting to empty array')
      orders.value = []
    }
    const index = orders.value.findIndex(order => order.id === orderId)
    if (index !== -1) {
      orders.value[index] = { ...orders.value[index], ...updates }
    }
  }

  const updatePosition = (code: string, updates: Partial<TradePosition>) => {
    // Ensure positions.value is always an array
    if (!Array.isArray(positions.value)) {
      console.warn('positions.value is not an array, resetting to empty array')
      positions.value = []
    }
    const index = positions.value.findIndex(position => position.code === code)
    if (index !== -1) {
      positions.value[index] = { ...positions.value[index], ...updates }
    }
  }

  const updateAccount = (accountId: string, updates: Partial<TradeAccount>) => {
    // Ensure accounts.value is always an array
    if (!Array.isArray(accounts.value)) {
      console.warn('accounts.value is not an array, resetting to empty array')
      accounts.value = []
    }
    const index = accounts.value.findIndex(account => account.id === accountId)
    if (index !== -1) {
      accounts.value[index] = { ...accounts.value[index], ...updates }
    }
  }

  const refreshData = async () => {
    if (loading.value) return
    
    try {
      loading.value = true
      await Promise.all([
        fetchAccounts(),
        currentAccount.value ? fetchPositions() : Promise.resolve(),
        fetchOrders({ limit: 50 })
      ])
      lastUpdate.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刷新交易数据失败'
      console.error('Refresh trade data error:', err)
    } finally {
      loading.value = false
    }
  }

  const calculateOrderProfit = (order: TradeOrder): number => {
    if (order.type === 'buy') {
      return 0
    }
    
    const position = positions.value.find(p => p.code === order.code)
    if (!position) return 0
    
    return (position.currentPrice - order.price) * order.filledVolume
  }

  const calculatePositionRisk = (position: TradePosition): string => {
    if (position.profitPercent > 10) return 'high'
    if (position.profitPercent < -10) return 'high'
    if (position.profitPercent > 5 || position.profitPercent < -5) return 'medium'
    return 'low'
  }

  const getAccountRiskLevel = (account: TradeAccount): string => {
    const riskRatio = account.margin / account.totalAssets
    if (riskRatio > 0.8) return 'high'
    if (riskRatio > 0.6) return 'medium'
    return 'low'
  }

  const getAccountInfo = async () => {
    try {
      const response = await tradeService.getAccounts()
      accounts.value = response.data
      return currentAccount.value || { availableFunds: 0 }
    } catch (err) {
      console.error('Get account info error:', err)
      throw err
    }
  }

  const getStockPosition = async (stockCode: string) => {
    try {
      const position = positions.value.find(p => p.code === stockCode)
      return position || { availableShares: 0 }
    } catch (err) {
      console.error('Get stock position error:', err)
      throw err
    }
  }

  const submitOrder = async (orderData: any) => {
    try {
      const response = await tradeService.placeOrder(orderData)
      const newOrder = response.data
      // Ensure orders.value is always an array before unshift
      if (!Array.isArray(orders.value)) {
        console.warn('orders.value is not an array, resetting to empty array')
        orders.value = []
      }
      orders.value.unshift(newOrder)
      return newOrder
    } catch (err) {
      error.value = err instanceof Error ? err.message : '下单失败'
      console.error('Place order error:', err)
      throw err
    }
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    orders.value = []
    positions.value = []
    deals.value = []
    accounts.value = []
    fundFlows.value = []
    settings.value = null
    statistics.value = null
    performance.value = {}
    loading.value = false
    error.value = null
    lastUpdate.value = 0
  }

  return {
    orders,
    positions,
    deals,
    accounts,
    fundFlows,
    settings,
    statistics,
    performance,
    loading,
    error,
    lastUpdate,
    currentAccount,
    totalAssets,
    totalProfit,
    totalProfitPercent,
    todayProfit,
    availableBalance,
    frozenBalance,
    marketValue,
    pendingOrders,
    filledOrders,
    cancelledOrders,
    todayOrders,
    todayDeals,
    todayFundFlows,
    positionByCode,
    initialize,
    fetchAccounts,
    fetchPositions,
    fetchOrders,
    fetchDeals,
    getDeals: fetchDeals,
    fetchFundFlows,
    getFundFlows: fetchFundFlows,
    fetchSettings,
    fetchStatistics,
    fetchPerformance,
    placeOrder,
    cancelOrder,
    cancelFundFlow: async (flowId: string) => {
      try {
        await tradeService.cancelFundFlow(flowId)
        await fetchFundFlows()
      } catch (err) {
        console.error('Cancel fund flow error:', err)
        throw err
      }
    },
    updateOrder,
    updatePosition,
    updateAccount,
    refreshData,
    calculateOrderProfit,
    calculatePositionRisk,
    getAccountRiskLevel,
    getAccountInfo,
    getStockPosition,
    submitOrder,
    clearError,
    reset
  }
})