import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  PortfolioAnalytics,
  PortfolioPosition,
  PortfolioSummary,
  PerformanceMetrics,
  SectorAllocation,
  RiskMetrics
} from '@/types/portfolio'
import { portfolioAnalyticsService } from '@/services/portfolioAnalyticsService'

export const usePortfolioStore = defineStore('portfolio', () => {
  // State
  const positions = ref<PortfolioPosition[]>([])
  const analytics = ref<PortfolioAnalytics | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdate = ref<number>(0)
  const autoRefresh = ref(true)
  const refreshInterval = ref<null | number>(null)

  // Computed properties
  const summary = computed(() => analytics.value?.summary || {
    totalValue: 0,
    totalCost: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
    dailyPnL: 0,
    dailyPnLPercent: 0,
    totalReturn: 0,
    totalReturnPercent: 0,
    cashBalance: 0,
    marginUsed: 0,
    marginAvailable: 0,
    positionsCount: 0,
    lastUpdated: 0
  })

  const performance = computed(() => analytics.value?.performance || {
    totalReturn: 0,
    totalReturnPercent: 0,
    annualizedReturn: 0,
    volatility: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    winRate: 0,
    profitFactor: 0,
    averageWin: 0,
    averageLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    averageHoldingPeriod: 0,
    beta: 1,
    alpha: 0,
    informationRatio: 0,
    sortinoRatio: 0,
    calmarRatio: 0,
    trackingError: 0,
    upCapture: 0,
    downCapture: 0
  })

  const assetAllocation = computed(() => analytics.value?.assetAllocation || {
    stocks: 0,
    bonds: 0,
    cash: 0,
    alternatives: 0,
    total: 0
  })

  const sectorAllocation = computed(() => analytics.value?.sectorAllocation || [])

  const risk = computed(() => analytics.value?.risk || {
    portfolioVaR: 0,
    positionVaR: new Map(),
    beta: 1,
    correlationMatrix: new Map(),
    concentrationRisk: 0,
    liquidityRisk: 0,
    marketRisk: 0,
    creditRisk: 0,
    operationalRisk: 0
  })

  const topPositions = computed(() => {
    return [...positions.value]
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10)
  })

  const worstPositions = computed(() => {
    return [...positions.value]
      .sort((a, b) => a.unrealizedPnLPercent - b.unrealizedPnLPercent)
      .slice(0, 5)
  })

  const bestPositions = computed(() => {
    return [...positions.value]
      .sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)
      .slice(0, 5)
  })

  const isProfitable = computed(() => summary.value.totalPnL > 0)
  const isPositiveToday = computed(() => summary.value.dailyPnL > 0)

  // Methods
  const initializePortfolio = async () => {
    try {
      loading.value = true
      error.value = null
      
      // Load mock data (in real app, this would come from API)
      await loadMockData()
      
      // Generate analytics
      await refreshAnalytics()
      
      // Set up auto-refresh
      if (autoRefresh.value) {
        startAutoRefresh()
      }
      
      lastUpdate.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化投资组合失败'
      console.error('Portfolio initialization error:', err)
    } finally {
      loading.value = false
    }
  }

  const loadMockData = async () => {
    // Generate mock portfolio positions
    const mockPositions: PortfolioPosition[] = [
      {
        id: '1',
        symbol: '000001',
        name: '平安银行',
        quantity: 1000,
        averagePrice: 12.50,
        currentPrice: 13.20,
        totalValue: 13200,
        unrealizedPnL: 700,
        unrealizedPnLPercent: 5.6,
        realizedPnL: 200,
        totalCost: 12500,
        sector: '银行',
        weight: 35.2,
        lastUpdated: Date.now()
      },
      {
        id: '2',
        symbol: '000002',
        name: '万科A',
        quantity: 500,
        averagePrice: 18.00,
        currentPrice: 17.50,
        totalValue: 8750,
        unrealizedPnL: -250,
        unrealizedPnLPercent: -1.39,
        realizedPnL: 150,
        totalCost: 9000,
        sector: '房地产',
        weight: 23.3,
        lastUpdated: Date.now()
      },
      {
        id: '3',
        symbol: '600036',
        name: '招商银行',
        quantity: 300,
        averagePrice: 35.00,
        currentPrice: 36.80,
        totalValue: 11040,
        unrealizedPnL: 540,
        unrealizedPnLPercent: 5.14,
        realizedPnL: 300,
        totalCost: 10500,
        sector: '银行',
        weight: 29.4,
        lastUpdated: Date.now()
      },
      {
        id: '4',
        symbol: '600519',
        name: '贵州茅台',
        quantity: 10,
        averagePrice: 1600,
        currentPrice: 1680,
        totalValue: 16800,
        unrealizedPnL: 800,
        unrealizedPnLPercent: 5.0,
        realizedPnL: 500,
        totalCost: 16000,
        sector: '白酒',
        weight: 44.8,
        lastUpdated: Date.now()
      }
    ]

    positions.value = mockPositions
  }

  const refreshAnalytics = async () => {
    try {
      loading.value = true
      error.value = null

      // Generate mock history
      const history = generateMockHistory()
      const transactions = generateMockTransactions()

      // Calculate analytics
      analytics.value = portfolioAnalyticsService.generatePortfolioAnalytics(
        positions.value,
        history,
        transactions
      )

      lastUpdate.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刷新分析数据失败'
      console.error('Analytics refresh error:', err)
    } finally {
      loading.value = false
    }
  }

  const generateMockHistory = () => {
    const history = []
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1) // 1 year of data
    
    let currentValue = 50000 // Starting portfolio value
    
    for (let i = 0; i < 252; i++) { // 252 trading days
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      // Random walk with slight upward bias
      const dailyReturn = (Math.random() - 0.48) * 0.04 // -1.92% to +2.08%
      currentValue *= (1 + dailyReturn)
      
      history.push({
        date: date.toISOString().split('T')[0],
        value: currentValue,
        return: dailyReturn,
        returnPercent: dailyReturn * 100,
        benchmarkValue: currentValue * (0.98 + Math.random() * 0.04), // Mock benchmark
        benchmarkReturn: dailyReturn * (0.9 + Math.random() * 0.2)
      })
    }
    
    return history
  }

  const generateMockTransactions = () => {
    return [
      {
        id: '1',
        symbol: '000001',
        type: 'buy' as const,
        quantity: 1000,
        price: 12.50,
        amount: 12500,
        commission: 5,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'completed' as const,
        notes: 'Initial purchase'
      },
      {
        id: '2',
        symbol: '000002',
        type: 'buy' as const,
        quantity: 500,
        price: 18.00,
        amount: 9000,
        commission: 5,
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'completed' as const,
        notes: 'Initial purchase'
      }
    ]
  }

  const updatePositionPrice = (symbol: string, newPrice: number) => {
    const position = positions.value.find(p => p.symbol === symbol)
    if (position) {
      position.currentPrice = newPrice
      position.totalValue = position.quantity * newPrice
      position.unrealizedPnL = position.totalValue - position.totalCost
      position.unrealizedPnLPercent = position.totalCost > 0 ? 
        (position.unrealizedPnL / position.totalCost) * 100 : 0
      position.lastUpdated = Date.now()
      
      // Refresh analytics
      refreshAnalytics()
    }
  }

  const addPosition = (position: Omit<PortfolioPosition, 'id' | 'lastUpdated'>) => {
    const newPosition: PortfolioPosition = {
      ...position,
      id: `position_${Date.now()}`,
      lastUpdated: Date.now()
    }
    
    positions.value.push(newPosition)
    refreshAnalytics()
  }

  const removePosition = (positionId: string) => {
    positions.value = positions.value.filter(p => p.id !== positionId)
    refreshAnalytics()
  }

  const updatePosition = (positionId: string, updates: Partial<PortfolioPosition>) => {
    const position = positions.value.find(p => p.id === positionId)
    if (position) {
      Object.assign(position, updates)
      position.lastUpdated = Date.now()
      refreshAnalytics()
    }
  }

  const startAutoRefresh = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
    }
    
    refreshInterval.value = window.setInterval(() => {
      if (autoRefresh.value) {
        refreshAnalytics()
      }
    }, 30000) // Refresh every 30 seconds
  }

  const stopAutoRefresh = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
  }

  const toggleAutoRefresh = (enabled: boolean) => {
    autoRefresh.value = enabled
    if (enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }

  const getPerformanceRating = () => {
    const sharpe = performance.value.sharpeRatio
    const returnPercent = performance.value.totalReturnPercent
    const maxDD = performance.value.maxDrawdown
    
    if (sharpe > 2 && returnPercent > 20 && maxDD < 10) return 'excellent'
    if (sharpe > 1 && returnPercent > 10 && maxDD < 20) return 'good'
    if (sharpe > 0.5 && returnPercent > 5 && maxDD < 30) return 'average'
    return 'poor'
  }

  const getRiskLevel = () => {
    const volatility = performance.value.volatility
    const maxDD = performance.value.maxDrawdown
    const beta = performance.value.beta
    
    if (volatility > 0.3 || maxDD > 0.4 || beta > 1.5) return 'high'
    if (volatility > 0.2 || maxDD > 0.25 || beta > 1.2) return 'medium'
    return 'low'
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    positions.value = []
    analytics.value = null
    loading.value = false
    error.value = null
    lastUpdate.value = 0
    stopAutoRefresh()
  }

  return {
    // State
    positions,
    analytics,
    loading,
    error,
    lastUpdate,
    autoRefresh,
    
    // Computed
    summary,
    performance,
    assetAllocation,
    sectorAllocation,
    risk,
    topPositions,
    worstPositions,
    bestPositions,
    isProfitable,
    isPositiveToday,
    
    // Methods
    initializePortfolio,
    refreshAnalytics,
    updatePositionPrice,
    addPosition,
    removePosition,
    updatePosition,
    startAutoRefresh,
    stopAutoRefresh,
    toggleAutoRefresh,
    getPerformanceRating,
    getRiskLevel,
    clearError,
    reset
  }
})