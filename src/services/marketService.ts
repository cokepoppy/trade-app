import axios from 'axios'
import type { 
  ApiResponse, 
  ApiConfig, 
  ApiRequest, 
  MarketStockApiParams, 
  MarketMarketApiParams,
  MarketChartApiParams,
  MarketScreenerApiParams,
  MarketIndex,
  Stock,
  MarketHotStock,
  MarketCapitalFlow,
  MarketSentiment,
  MarketOverview,
  MarketRanking,
  MarketNews,
  MarketCalendar,
  EconomicData,
  MarketStatus,
  PaginationResult
} from '@/types'
import { storage, cache } from '@/utils/storage'
import { useAppStore } from '@/stores/useAppStore'

const API_BASE_URL = '/api'

const defaultConfig: ApiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'TradeApp/1.0.0'
  },
  withCredentials: true,
  retryCount: 3,
  retryDelay: 1000,
  enableCache: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes
  enableLog: import.meta.env.DEV
}

const apiClient = axios.create(defaultConfig)

apiClient.interceptors.request.use(
  (config) => {
    const appStore = useAppStore()
    const token = storage.get('user_token')
    
    console.log(`[API Auth] 检查认证状态:`, {
      hasToken: !!token,
      token: token ? `${token.substring(0, 10)}...` : null,
      url: config.url
    })
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    if (defaultConfig.enableLog) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        headers: config.headers,
        data: config.data,
        params: config.params
      })
    }
    
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => {
    const appStore = useAppStore()
    
    if (defaultConfig.enableLog) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      })
    }
    
    // 添加更详细的调试信息
    console.log(`[API Debug] 检查响应数据格式:`, {
      hasData: !!response.data,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      code: response.data?.code,
      message: response.data?.message
    })
    
    if (response.data.code !== 0) {
      const error = response.data.message || 'API请求失败'
      console.error(`[API Error] ${response.config.method?.toUpperCase()} ${response.config.url} - Code: ${response.data.code}, Message: ${error}`)
      console.error(`[API Error] 完整响应数据:`, response.data)
      appStore.showError(error)
      return Promise.reject(new Error(error))
    }
    
    return response
  },
  async (error) => {
    const appStore = useAppStore()
    
    if (defaultConfig.enableLog) {
      console.error('[API Response Error]', {
        message: error.message,
        code: error.code,
        config: error.config,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null
      })
    }
    
    if (error.response?.status === 401) {
      appStore.showError('登录已过期，请重新登录')
      const userStore = (await import('@/stores/useUserStore')).useUserStore()
      await userStore.logout()
      return Promise.reject(error)
    }
    
    if (error.response?.status === 403) {
      appStore.showError('权限不足')
      return Promise.reject(error)
    }
    
    if (error.response?.status === 404) {
      appStore.showError('请求的资源不存在')
      return Promise.reject(error)
    }
    
    if (error.response?.status === 500) {
      appStore.showError('服务器内部错误')
      return Promise.reject(error)
    }
    
    const errorMessage = error.response?.data?.message || error.message || '网络请求失败'
    appStore.showError(errorMessage)
    
    return Promise.reject(error)
  }
)

const retryRequest = async (config: any, retryCount: number): Promise<any> => {
  try {
    return await apiClient(config)
  } catch (error) {
    if (retryCount > 0) {
      await new Promise(resolve => setTimeout(resolve, defaultConfig.retryDelay))
      return retryRequest(config, retryCount - 1)
    }
    throw error
  }
}

const cachedRequest = async <T>(key: string, request: () => Promise<T>): Promise<T> => {
  console.log(`[cachedRequest] 开始处理缓存请求`, {
    key,
    enableCache: defaultConfig.enableCache,
    cacheTime: defaultConfig.cacheTime
  })
  
  if (defaultConfig.enableCache) {
    const cached = cache.get(key)
    if (cached) {
      console.log(`[cachedRequest] 使用缓存数据`, { key })
      return cached
    }
  }
  
  console.log(`[cachedRequest] 发起新的请求`, { key })
  const result = await request()
  
  if (defaultConfig.enableCache) {
    cache.set(key, result, defaultConfig.cacheTime)
    console.log(`[cachedRequest] 数据已缓存`, { key, cacheTime: defaultConfig.cacheTime })
  }
  
  console.log(`[cachedRequest] 请求完成`, { key, resultType: typeof result })
  return result
}

export const marketService = {
  async getMarketStatus(): Promise<ApiResponse<MarketStatus>> {
    return cachedRequest('market_status', async () => {
      const response = await apiClient.get('/market/status')
      return response.data
    })
  },

  async getIndices(params?: MarketMarketApiParams): Promise<ApiResponse<MarketIndex[]>> {
    console.log('[marketService] getIndices: 开始请求', { params, baseURL: defaultConfig.baseURL })
    return cachedRequest('market_indices', async () => {
      console.log('[marketService] getIndices: 发起axios请求', { 
        url: '/market/indices', 
        params,
        fullURL: `${defaultConfig.baseURL}/market/indices`
      })
      const response = await apiClient.get('/market/indices', { params })
      console.log('[marketService] getIndices: axios请求完成', { 
        status: response.status,
        data: response.data
      })
      return response.data
    })
  },

  async getHotStocks(params?: MarketStockApiParams): Promise<ApiResponse<MarketHotStock[]>> {
    return cachedRequest('market_hot_stocks', async () => {
      const response = await apiClient.get('/market/hot-stocks', { params })
      return response.data
    })
  },

  async getCapitalFlow(date?: string): Promise<ApiResponse<MarketCapitalFlow>> {
    const key = date ? `market_capital_flow_${date}` : 'market_capital_flow'
    return cachedRequest(key, async () => {
      const response = await apiClient.get('/market/capital-flow', { params: { date } })
      return response.data
    })
  },

  async getMarketSentiment(): Promise<ApiResponse<MarketSentiment>> {
    return cachedRequest('market_sentiment', async () => {
      const response = await apiClient.get('/market/sentiment')
      return response.data
    })
  },

  async getMarketOverview(): Promise<ApiResponse<MarketOverview>> {
    return cachedRequest('market_overview', async () => {
      const response = await apiClient.get('/market/overview')
      return response.data
    })
  },

  async getRanking(type: string, period = 'day', params?: any): Promise<ApiResponse<MarketRanking>> {
    const key = `market_ranking_${type}_${period}`
    return cachedRequest(key, async () => {
      const response = await apiClient.get('/market/ranking', { 
        params: { type, period, ...params } 
      })
      return response.data
    })
  },

  async getMarketNews(params?: any): Promise<ApiResponse<PaginationResult<MarketNews>>> {
    const response = await apiClient.get('/market/news', { params })
    return response.data
  },

  async getStockQuote(code: string): Promise<ApiResponse<Stock>> {
    const key = `stock_quote_${code}`
    return cachedRequest(key, async () => {
      const response = await apiClient.get(`/stock/${code}/quote`)
      return response.data
    })
  },

  async getStockDetail(code: string): Promise<ApiResponse<Stock>> {
    const key = `stock_detail_${code}`
    return cachedRequest(key, async () => {
      const response = await apiClient.get(`/stock/${code}/detail`)
      return response.data
    })
  },

  async getStockKLine(params: MarketChartApiParams): Promise<ApiResponse<any[]>> {
    const key = `stock_kline_${params.code}_${params.period}_${params.type}`
    return cachedRequest(key, async () => {
      const response = await apiClient.get(`/stock/${params.code}/kline`, { params })
      return response.data
    })
  },

  async getStockTimeShare(code: string, date?: string): Promise<ApiResponse<any[]>> {
    const key = date ? `stock_timeshare_${code}_${date}` : `stock_timeshare_${code}`
    return cachedRequest(key, async () => {
      const response = await apiClient.get(`/stock/${code}/timeshare`, { params: { date } })
      return response.data
    })
  },

  async getStockOrderBook(code: string, depth = 5): Promise<ApiResponse<any>> {
    const key = `stock_orderbook_${code}_${depth}`
    return cachedRequest(key, async () => {
      const response = await apiClient.get(`/stock/${code}/orderbook`, { params: { depth } })
      return response.data
    })
  },

  async getStockTransactions(code: string, date?: string, limit = 50): Promise<ApiResponse<any[]>> {
    const key = date ? `stock_transactions_${code}_${date}` : `stock_transactions_${code}`
    return cachedRequest(key, async () => {
      const response = await apiClient.get(`/stock/${code}/transactions`, { 
        params: { date, limit } 
      })
      return response.data
    })
  },

  async getStockFinancial(code: string): Promise<ApiResponse<any>> {
    const key = `stock_financial_${code}`
    return cachedRequest(key, async () => {
      const response = await apiClient.get(`/stock/${code}/financial`)
      return response.data
    })
  },

  async getStockNews(code: string, params?: any): Promise<ApiResponse<PaginationResult<MarketNews>>> {
    const response = await apiClient.get(`/stock/${code}/news`, { params })
    return response.data
  },

  async getStockAnnouncements(code: string, params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get(`/stock/${code}/announcements`, { params })
    return response.data
  },

  async searchStocks(keyword: string, params?: MarketStockApiParams): Promise<ApiResponse<Stock[]>> {
    const response = await apiClient.get('/stock/search', { 
      params: { keyword, ...params } 
    })
    return response.data
  },

  async getMarketScreener(params: MarketScreenerApiParams): Promise<ApiResponse<PaginationResult<Stock>>> {
    const response = await apiClient.get('/market/screener', { params })
    return response.data
  },

  async getMarketSectors(params?: MarketMarketApiParams): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/market/sectors', { params })
    return response.data
  },

  async getMarketConcepts(params?: MarketMarketApiParams): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/market/concepts', { params })
    return response.data
  },

  async getMarketCalendar(params?: any): Promise<ApiResponse<MarketCalendar[]>> {
    const response = await apiClient.get('/market/calendar', { params })
    return response.data
  },

  async getEconomicCalendar(params?: any): Promise<ApiResponse<EconomicData[]>> {
    const response = await apiClient.get('/market/economic-calendar', { params })
    return response.data
  },

  async getMarketTrends(params?: any): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/market/trends', { params })
    return response.data
  },

  async getMarketAnalysis(params?: any): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/market/analysis', { params })
    return response.data
  },

  async getMarketAlerts(params?: any): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/market/alerts', { params })
    return response.data
  },

  async getMarketStatistics(params?: any): Promise<ApiResponse<any>> {
    const key = 'market_statistics'
    return cachedRequest(key, async () => {
      const response = await apiClient.get('/market/statistics', { params })
      return response.data
    })
  },

  async batchGetStockQuotes(codes: string[]): Promise<ApiResponse<Stock[]>> {
    const key = `batch_stock_quotes_${codes.join(',')}`
    return cachedRequest(key, async () => {
      const response = await apiClient.post('/stock/batch-quotes', { codes })
      return response.data
    })
  },

  async batchGetStockDetails(codes: string[]): Promise<ApiResponse<Stock[]>> {
    const key = `batch_stock_details_${codes.join(',')}`
    return cachedRequest(key, async () => {
      const response = await apiClient.post('/stock/batch-details', { codes })
      return response.data
    })
  },

  async subscribeStockQuotes(codes: string[]): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/stock/subscribe-quotes', { codes })
    return response.data
  },

  async unsubscribeStockQuotes(codes: string[]): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/stock/unsubscribe-quotes', { codes })
    return response.data
  },

  async getHistoricalData(code: string, params: any): Promise<ApiResponse<any[]>> {
    const key = `historical_data_${code}_${JSON.stringify(params)}`
    return cachedRequest(key, async () => {
      const response = await apiClient.get(`/stock/${code}/historical`, { params })
      return response.data
    })
  },

  async getDividendHistory(code: string, params?: any): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get(`/stock/${code}/dividends`, { params })
    return response.data
  },

  async getSplitHistory(code: string, params?: any): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get(`/stock/${code}/splits`, { params })
    return response.data
  }
}