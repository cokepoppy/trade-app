import axios from 'axios'
import type { 
  ApiResponse, 
  TradeOrder, 
  TradePosition, 
  TradeDeal, 
  TradeAccount, 
  TradeFundFlow,
  TradeSetting,
  TradeStatistics,
  TradePerformance,
  PaginationResult
} from '@/types'
import { storage } from '@/utils/storage'
import { useAppStore } from '@/stores/useAppStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'TradeApp/1.0.0'
  },
  withCredentials: true
})

apiClient.interceptors.request.use(
  (config) => {
    const token = storage.get('user_token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('[Trade API Request Error]', error)
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => {
    if (response.data.code !== 0) {
      const error = response.data.message || '交易API请求失败'
      return Promise.reject(new Error(error))
    }
    
    return response
  },
  async (error) => {
    const appStore = useAppStore()
    
    if (error.response?.status === 401) {
      appStore.showError('登录已过期，请重新登录')
      const userStore = (await import('@/stores/useUserStore')).useUserStore()
      await userStore.logout()
      return Promise.reject(error)
    }
    
    if (error.response?.status === 403) {
      appStore.showError('交易权限不足')
      return Promise.reject(error)
    }
    
    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.message || '交易参数错误'
      appStore.showError(errorMessage)
      return Promise.reject(error)
    }
    
    if (error.response?.status === 500) {
      appStore.showError('交易服务器错误')
      return Promise.reject(error)
    }
    
    const errorMessage = error.response?.data?.message || error.message || '交易请求失败'
    appStore.showError(errorMessage)
    
    return Promise.reject(error)
  }
)

export const tradeService = {
  async getAccounts(): Promise<ApiResponse<TradeAccount[]>> {
    const response = await apiClient.get('/trade/accounts')
    return response.data
  },

  async getAccount(accountId: string): Promise<ApiResponse<TradeAccount>> {
    const response = await apiClient.get(`/trade/accounts/${accountId}`)
    return response.data
  },

  async getAccountOverview(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/trade/accounts/overview')
    return response.data
  },

  async getPositions(accountId?: string): Promise<ApiResponse<TradePosition[]>> {
    const params = accountId ? { accountId } : {}
    const response = await apiClient.get('/trade/positions', { params })
    return response.data
  },

  async getPosition(accountId: string, code: string): Promise<ApiResponse<TradePosition>> {
    const response = await apiClient.get(`/trade/accounts/${accountId}/positions/${code}`)
    return response.data
  },

  async getOrders(params?: any): Promise<ApiResponse<TradeOrder[]>> {
    const response = await apiClient.get('/trade/orders', { params })
    return response.data
  },

  async getOrder(orderId: string): Promise<ApiResponse<TradeOrder>> {
    const response = await apiClient.get(`/trade/orders/${orderId}`)
    return response.data
  },

  async placeOrder(orderData: any): Promise<ApiResponse<TradeOrder>> {
    const response = await apiClient.post('/trade/orders', orderData)
    return response.data
  },

  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<TradeOrder>> {
    const response = await apiClient.post(`/trade/orders/${orderId}/cancel`, { reason })
    return response.data
  },

  async batchCancelOrders(orderIds: string[]): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/trade/orders/batch-cancel', { orderIds })
    return response.data
  },

  async getDeals(params?: any): Promise<ApiResponse<TradeDeal[]>> {
    const response = await apiClient.get('/trade/deals', { params })
    return response.data
  },

  async getDeal(dealId: string): Promise<ApiResponse<TradeDeal>> {
    const response = await apiClient.get(`/trade/deals/${dealId}`)
    return response.data
  },

  async getFundFlows(params?: any): Promise<ApiResponse<TradeFundFlow[]>> {
    const response = await apiClient.get('/trade/fund-flows', { params })
    return response.data
  },

  async getFundFlow(flowId: string): Promise<ApiResponse<TradeFundFlow>> {
    const response = await apiClient.get(`/trade/fund-flows/${flowId}`)
    return response.data
  },

  async deposit(amount: number, paymentMethod: string): Promise<ApiResponse<TradeFundFlow>> {
    const response = await apiClient.post('/trade/deposit', { amount, paymentMethod })
    return response.data
  },

  async withdraw(amount: number, bankCard: string): Promise<ApiResponse<TradeFundFlow>> {
    const response = await apiClient.post('/trade/withdraw', { amount, bankCard })
    return response.data
  },

  async getSettings(): Promise<ApiResponse<TradeSetting>> {
    const response = await apiClient.get('/trade/settings')
    return response.data
  },

  async updateSettings(settings: Partial<TradeSetting>): Promise<ApiResponse<TradeSetting>> {
    const response = await apiClient.put('/trade/settings', settings)
    return response.data
  },

  async getStatistics(params?: any): Promise<ApiResponse<TradeStatistics>> {
    const response = await apiClient.get('/trade/statistics', { params })
    return response.data
  },

  async getPerformance(period: string, params?: any): Promise<ApiResponse<TradePerformance>> {
    const response = await apiClient.get(`/trade/performance/${period}`, { params })
    return response.data
  },

  async getTradeHistory(params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/trade/history', { params })
    return response.data
  },

  async cancelFundFlow(flowId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/trade/fund-flows/${flowId}/cancel`)
    return response.data
  },

  async getRiskControl(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/trade/risk-control')
    return response.data
  },

  async updateRiskControl(settings: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/trade/risk-control', settings)
    return response.data
  },

  async getCommissionRules(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/trade/commission-rules')
    return response.data
  },

  async calculateCommission(orderData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/trade/calculate-commission', orderData)
    return response.data
  },

  async validateOrder(orderData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/trade/validate-order', orderData)
    return response.data
  },

  async getOrderBook(code: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/trade/order-book/${code}`)
    return response.data
  },

  async getMarketDepth(code: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/trade/market-depth/${code}`)
    return response.data
  },

  async getTradeCalendar(params?: any): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/trade/calendar', { params })
    return response.data
  },

  async getAccountStatements(accountId: string, params?: any): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get(`/trade/accounts/${accountId}/statements`, { params })
    return response.data
  },

  async exportOrders(params?: any): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/trade/export/orders', { params })
    return response.data
  },

  async exportDeals(params?: any): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/trade/export/deals', { params })
    return response.data
  },

  async exportPositions(params?: any): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/trade/export/positions', { params })
    return response.data
  },

  async exportFundFlows(params?: any): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/trade/export/fund-flows', { params })
    return response.data
  },

  async getTradingLimits(accountId?: string): Promise<ApiResponse<any>> {
    const params = accountId ? { accountId } : {}
    const response = await apiClient.get('/trade/trading-limits', { params })
    return response.data
  },

  async getMarginInfo(accountId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/trade/accounts/${accountId}/margin-info`)
    return response.data
  },

  async getShortSellingInfo(code: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/trade/short-selling/${code}`)
    return response.data
  },

  async placeShortOrder(orderData: any): Promise<ApiResponse<TradeOrder>> {
    const response = await apiClient.post('/trade/short-orders', orderData)
    return response.data
  },

  async getOptionsChain(code: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/trade/options/${code}/chain`)
    return response.data
  },

  async getOptionsInfo(optionCode: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/trade/options/${optionCode}`)
    return response.data
  },

  async placeOptionOrder(orderData: any): Promise<ApiResponse<TradeOrder>> {
    const response = await apiClient.post('/trade/options/orders', orderData)
    return response.data
  },

  async getFuturesInfo(code: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/trade/futures/${code}`)
    return response.data
  },

  async placeFuturesOrder(orderData: any): Promise<ApiResponse<TradeOrder>> {
    const response = await apiClient.post('/trade/futures/orders', orderData)
    return response.data
  },

  async getAlgoOrders(params?: any): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/trade/algo-orders', { params })
    return response.data
  },

  async placeAlgoOrder(orderData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/trade/algo-orders', orderData)
    return response.data
  },

  async cancelAlgoOrder(orderId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/trade/algo-orders/${orderId}/cancel`)
    return response.data
  },

  async getConditionOrders(params?: any): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/trade/condition-orders', { params })
    return response.data
  },

  async placeConditionOrder(orderData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/trade/condition-orders', orderData)
    return response.data
  },

  async cancelConditionOrder(orderId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/trade/condition-orders/${orderId}/cancel`)
    return response.data
  },

  async getIpoInfo(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/trade/ipo-info')
    return response.data
  },

  async subscribeIpo(ipoCode: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/trade/ipo-subscribe/${ipoCode}`)
    return response.data
  },

  async getBondInfo(code: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/trade/bonds/${code}`)
    return response.data
  },

  async placeBondOrder(orderData: any): Promise<ApiResponse<TradeOrder>> {
    const response = await apiClient.post('/trade/bonds/orders', orderData)
    return response.data
  },

  async getFundInfo(code: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/trade/funds/${code}`)
    return response.data
  },

  async placeFundOrder(orderData: any): Promise<ApiResponse<TradeOrder>> {
    const response = await apiClient.post('/trade/funds/orders', orderData)
    return response.data
  },

  async getWarrantInfo(code: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/trade/warrants/${code}`)
    return response.data
  },

  async placeWarrantOrder(orderData: any): Promise<ApiResponse<TradeOrder>> {
    const response = await apiClient.post('/trade/warrants/orders', orderData)
    return response.data
  }
}