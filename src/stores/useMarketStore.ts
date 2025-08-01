import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  MarketIndex, 
  Stock, 
  MarketHotStock, 
  MarketCapitalFlow, 
  MarketSentiment,
  MarketOverview,
  MarketStatus,
  MarketRanking,
  MarketNews
} from '@/types'
import { marketService } from '@/services/marketService'

export const useMarketStore = defineStore('market', () => {
  const indices = ref<MarketIndex[]>([])
  const hotStocks = ref<MarketHotStock[]>([])
  const capitalFlow = ref<MarketCapitalFlow | null>(null)
  const marketSentiment = ref<MarketSentiment | null>(null)
  const marketStatus = ref<MarketStatus | null>(null)
  const marketOverview = ref<MarketOverview | null>(null)
  const rankings = ref<Record<string, MarketRanking>>({})
  const marketNews = ref<MarketNews[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdate = ref<number>(0)

  const isMarketOpen = computed(() => {
    return marketStatus.value?.isTradingTime || false
  })

  const mainIndices = computed(() => {
    return indices.value.filter(index => 
      ['000001', '000002', '000300', '399001', '399006'].includes(index.code)
    )
  })

  const sectorIndices = computed(() => {
    return indices.value.filter(index => index.type === 'sector')
  })

  const topGainers = computed(() => {
    return rankings.value['gain']?.stocks.slice(0, 10) || []
  })

  const topLosers = computed(() => {
    return rankings.value['loss']?.stocks.slice(0, 10) || []
  })

  const topVolume = computed(() => {
    return rankings.value['volume']?.stocks.slice(0, 10) || []
  })

  const initialize = async () => {
    try {
      loading.value = true
      error.value = null
      
      await Promise.all([
        fetchMarketStatus(),
        fetchIndices(),
        fetchHotStocks(),
        fetchCapitalFlow(),
        fetchMarketSentiment()
      ])
      
      lastUpdate.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取市场数据失败'
      console.error('Market store initialization error:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchMarketStatus = async () => {
    try {
      const response = await marketService.getMarketStatus()
      marketStatus.value = response.data
    } catch (err) {
      console.error('Fetch market status error:', err)
    }
  }

  const fetchIndices = async () => {
    try {
      console.log('[useMarketStore] fetchIndices: 开始请求市场指数数据')
      const response = await marketService.getIndices()
      console.log('[useMarketStore] fetchIndices: 请求成功', {
        data: response.data,
        dataLength: response.data?.length
      })
      indices.value = response.data
    } catch (err) {
      console.error('[useMarketStore] fetchIndices error:', {
        error: err,
        message: err instanceof Error ? err.message : '未知错误',
        stack: err instanceof Error ? err.stack : undefined
      })
    }
  }

  const fetchHotStocks = async () => {
    try {
      const response = await marketService.getHotStocks()
      hotStocks.value = response.data
    } catch (err) {
      console.error('Fetch hot stocks error:', err)
    }
  }

  const fetchCapitalFlow = async () => {
    try {
      const response = await marketService.getCapitalFlow()
      capitalFlow.value = response.data
    } catch (err) {
      console.error('Fetch capital flow error:', err)
    }
  }

  const fetchMarketSentiment = async () => {
    try {
      const response = await marketService.getMarketSentiment()
      marketSentiment.value = response.data
    } catch (err) {
      console.error('Fetch market sentiment error:', err)
    }
  }

  const fetchMarketOverview = async () => {
    try {
      const response = await marketService.getMarketOverview()
      marketOverview.value = response.data
    } catch (err) {
      console.error('Fetch market overview error:', err)
    }
  }

  const fetchRanking = async (type: string, period = 'day') => {
    try {
      const response = await marketService.getRanking(type, period)
      rankings.value[`${type}_${period}`] = response.data
    } catch (err) {
      console.error('Fetch ranking error:', err)
    }
  }

  const fetchMarketNews = async (params?: any) => {
    try {
      const response = await marketService.getMarketNews(params)
      marketNews.value = response.data.list
    } catch (err) {
      console.error('Fetch market news error:', err)
    }
  }

  const updateIndex = (indexCode: string, data: Partial<MarketIndex>) => {
    const index = indices.value.find(idx => idx.code === indexCode)
    if (index) {
      Object.assign(index, data)
    }
  }

  const updateStockPrice = (stockCode: string, price: number, change: number, changePercent: number) => {
    hotStocks.value.forEach(stock => {
      if (stock.code === stockCode) {
        stock.price = price
        stock.change = change
        stock.changePercent = changePercent
        stock.timestamp = Date.now()
      }
    })
  }

  const refreshMarketData = async () => {
    if (loading.value) return
    
    try {
      loading.value = true
      await Promise.all([
        fetchMarketStatus(),
        fetchIndices(),
        fetchCapitalFlow(),
        fetchMarketSentiment()
      ])
      lastUpdate.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刷新市场数据失败'
      console.error('Refresh market data error:', err)
    } finally {
      loading.value = false
    }
  }

  const getStockQuote = async (code: string) => {
    try {
      const response = await marketService.getStockQuote(code)
      return response.data
    } catch (err) {
      console.error('Get stock quote error:', err)
      return null
    }
  }

  const getStockDetail = async (code: string) => {
    try {
      const response = await marketService.getStockDetail(code)
      return response.data
    } catch (err) {
      console.error('Get stock detail error:', err)
      return null
    }
  }

  const searchStocks = async (keyword: string) => {
    try {
      const response = await marketService.searchStocks(keyword)
      return response.data
    } catch (err) {
      console.error('Search stocks error:', err)
      return []
    }
  }

  const getMarketCalendar = async (params?: any) => {
    try {
      const response = await marketService.getMarketCalendar(params)
      return response.data
    } catch (err) {
      console.error('Get market calendar error:', err)
      return []
    }
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    indices.value = []
    hotStocks.value = []
    capitalFlow.value = null
    marketSentiment.value = null
    marketStatus.value = null
    marketOverview.value = null
    rankings.value = {}
    marketNews.value = []
    loading.value = false
    error.value = null
    lastUpdate.value = 0
  }

  return {
    indices,
    hotStocks,
    capitalFlow,
    marketSentiment,
    marketStatus,
    marketOverview,
    rankings,
    marketNews,
    loading,
    error,
    lastUpdate,
    isMarketOpen,
    mainIndices,
    sectorIndices,
    topGainers,
    topLosers,
    topVolume,
    initialize,
    fetchMarketStatus,
    fetchIndices,
    fetchHotStocks,
    fetchCapitalFlow,
    fetchMarketSentiment,
    fetchMarketOverview,
    fetchRanking,
    fetchMarketNews,
    updateIndex,
    updateStockPrice,
    refreshMarketData,
    getStockQuote,
    getStockDetail,
    searchStocks,
    getMarketCalendar,
    clearError,
    reset
  }
})