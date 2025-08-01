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
    return orders.value.filter(order => ['pending', 'partial'].includes(order.status))
  })

  const filledOrders = computed(() => {
    return orders.value.filter(order => order.status === 'filled')
  })

  const cancelledOrders = computed(() => {
    return orders.value.filter(order => order.status === 'cancelled')
  })

  const todayOrders = computed(() => {
    const today = new Date().toDateString()
    return orders.value.filter(order => 
      new Date(order.orderTime).toDateString() === today
    )
  })

  const todayDeals = computed(() => {
    const today = new Date().toDateString()
    return deals.value.filter(deal => 
      new Date(deal.dealTime).toDateString() === today
    )
  })

  const todayFundFlows = computed(() => {
    const today = new Date().toDateString()
    return fundFlows.value.filter(flow => 
      new Date(flow.createTime).toDateString() === today
    )
  })

  const positionByCode = computed(() => {
    const result: Record<string, TradePosition> = {}
    positions.value.forEach(position => {
      result[position.code] = position
    })
    return result
  })

  const initialize = async () => {
    try {
      loading.value = true
      error.value = null
      
      await Promise.all([
        fetchAccounts(),
        fetchSettings()
      ])
      
      if (currentAccount.value) {
        await Promise.all([
          fetchPositions(),
          fetchOrders(),
          fetchFundFlows()
        ])
      }
      
      lastUpdate.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取交易数据失败'
      console.error('Trade store initialization error:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await tradeService.getAccounts()
      accounts.value = response.data
    } catch (err) {
      console.error('Fetch accounts error:', err)
    }
  }

  const fetchPositions = async (accountId?: string) => {
    try {
      const response = await tradeService.getPositions(accountId)
      positions.value = response.data
    } catch (err) {
      console.error('Fetch positions error:', err)
    }
  }

  const fetchOrders = async (params?: any) => {
    try {
      const response = await tradeService.getOrders(params)
      orders.value = response.data
    } catch (err) {
      console.error('Fetch orders error:', err)
    }
  }

  const fetchDeals = async (params?: any) => {
    try {
      const response = await tradeService.getDeals(params)
      deals.value = response.data
    } catch (err) {
      console.error('Fetch deals error:', err)
    }
  }

  const fetchFundFlows = async (params?: any) => {
    try {
      const response = await tradeService.getFundFlows(params)
      fundFlows.value = response.data
    } catch (err) {
      console.error('Fetch fund flows error:', err)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await tradeService.getSettings()
      settings.value = response.data
      storage.set(storageKeys.TRADE_SETTINGS, response.data)
    } catch (err) {
      console.error('Fetch settings error:', err)
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
    const index = orders.value.findIndex(order => order.id === orderId)
    if (index !== -1) {
      orders.value[index] = { ...orders.value[index], ...updates }
    }
  }

  const updatePosition = (code: string, updates: Partial<TradePosition>) => {
    const index = positions.value.findIndex(position => position.code === code)
    if (index !== -1) {
      positions.value[index] = { ...positions.value[index], ...updates }
    }
  }

  const updateAccount = (accountId: string, updates: Partial<TradeAccount>) => {
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
    clearError,
    reset
  }
})