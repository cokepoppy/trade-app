import type { User, UserSettings, NotificationSettings, PrivacySettings, SecuritySettings, TradingSettings, DisplaySettings } from './user'
import type { TradeOrder } from './trade'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
  traceId?: string
}

export interface ApiError {
  code: number
  message: string
  details?: Record<string, any>
  timestamp: number
  traceId?: string
}

export interface ApiRequest {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  params?: Record<string, any>
  data?: any
  headers?: Record<string, string>
  timeout?: number
  withCredentials?: boolean
}

export interface ApiConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
  withCredentials: boolean
  retryCount: number
  retryDelay: number
  enableCache: boolean
  cacheTime: number
  enableLog: boolean
}

export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
  messageId: string
}

export interface WebSocketConfig {
  url: string
  reconnect: boolean
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeat: boolean
  heartbeatInterval: number
  timeout: number
}

export interface StockApiParams {
  code?: string
  codes?: string[]
  market?: string
  type?: string
  industry?: string
  area?: string
}

export interface MarketApiParams {
  market?: string
  type?: string
  period?: string
  startDate?: string
  endDate?: string
}

export interface TradeApiParams {
  accountId?: string
  code?: string
  type?: string
  status?: string
  startDate?: string
  endDate?: string
}

export interface UserApiParams {
  userId?: string
  type?: string
  status?: string
}

export interface NewsApiParams {
  category?: string
  type?: string
  importance?: string
  startDate?: string
  endDate?: string
  keyword?: string
  limit?: number
}

export interface ChartApiParams {
  code: string
  period: string
  type: string
  indicators?: string[]
  startDate?: string
  endDate?: string
}

export interface ScreenerApiParams {
  market?: string[]
  type?: string[]
  industry?: string[]
  area?: string[]
  priceMin?: number
  priceMax?: number
  marketValueMin?: number
  marketValueMax?: number
  peMin?: number
  peMax?: number
  pbMin?: number
  pbMax?: number
  volumeMin?: number
  volumeMax?: number
  changeMin?: number
  changeMax?: number
  sortBy?: string
  sortOrder?: string
  page?: number
  pageSize?: number
}

export interface LoginRequest {
  username: string
  password: string
  captcha?: string
  deviceInfo?: DeviceInfo
}

export interface LoginResponse {
  token: string
  refreshToken: string
  expiresIn: number
  userInfo: User
  permissions: string[]
  settings: UserSettings
}

export interface RegisterRequest {
  username: string
  password: string
  email: string
  phone: string
  captcha: string
  deviceInfo?: DeviceInfo
}

export interface RegisterResponse {
  userId: string
  token: string
  expiresIn: number
  userInfo: User
}

export interface DeviceInfo {
  deviceId: string
  deviceType: string
  deviceName: string
  platform: string
  osVersion: string
  appVersion: string
  ip: string
  location: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
  confirmPassword: string
  captcha?: string
}

export interface ResetPasswordRequest {
  email: string
  phone: string
  captcha: string
  newPassword: string
  confirmPassword: string
}

export interface UpdateProfileRequest {
  nickname?: string
  avatar?: string
  gender?: string
  birthday?: string
  address?: string
  occupation?: string
  education?: string
  income?: string
}

export interface VerifyEmailRequest {
  email: string
  captcha: string
}

export interface VerifyPhoneRequest {
  phone: string
  captcha: string
}

export interface SendCaptchaRequest {
  type: 'email' | 'phone'
  target: string
  purpose: 'register' | 'login' | 'reset_password' | 'verify_email' | 'verify_phone'
}

export interface TradeOrderRequest {
  accountId: string
  code: string
  type: 'buy' | 'sell'
  priceType: 'market' | 'limit' | 'stop_loss' | 'stop_profit'
  price: number
  volume: number
  remark?: string
}

export interface TradeOrderResponse {
  orderId: string
  status: string
  message: string
  order: TradeOrder
}

export interface CancelOrderRequest {
  orderId: string
  reason?: string
}

export interface CancelOrderResponse {
  orderId: string
  status: string
  message: string
  order: TradeOrder
}

export interface GetOrdersRequest extends PaginationParams {
  accountId?: string
  code?: string
  type?: string
  status?: string
  startDate?: string
  endDate?: string
}

export interface GetPositionsRequest extends PaginationParams {
  accountId?: string
  code?: string
}

export interface GetDealsRequest extends PaginationParams {
  accountId?: string
  code?: string
  type?: string
  startDate?: string
  endDate?: string
}

export interface GetFundsFlowRequest extends PaginationParams {
  accountId?: string
  type?: string
  startDate?: string
  endDate?: string
}

export interface AddWatchlistRequest {
  code: string
  groupId?: string
  remark?: string
}

export interface RemoveWatchlistRequest {
  id: string
}

export interface UpdateWatchlistRequest {
  id: string
  groupId?: string
  remark?: string
  alertPrice?: number
  alertPercent?: number
}

export interface CreateWatchlistGroupRequest {
  name: string
  description?: string
}

export interface UpdateWatchlistGroupRequest {
  id: string
  name: string
  description?: string
}

export interface DeleteWatchlistGroupRequest {
  id: string
}

export interface SearchStocksRequest {
  keyword: string
  market?: string
  type?: string
  limit?: number
}

export interface GetStockDetailRequest {
  code: string
  market?: string
}

export interface GetStockQuoteRequest {
  codes: string[]
}

export interface GetStockKLineRequest {
  code: string
  period: string
  type: string
  indicators?: string[]
  startDate?: string
  endDate?: string
}

export interface GetStockTimeShareRequest {
  code: string
  date?: string
}

export interface GetStockOrderBookRequest {
  code: string
  depth?: number
}

export interface GetStockTransactionsRequest {
  code: string
  date?: string
  limit?: number
}

export interface GetMarketIndicesRequest {
  market?: string
  type?: string
}

export interface GetMarketSectorsRequest {
  market?: string
}

export interface GetMarketHotStocksRequest {
  market?: string
  limit?: number
}

export interface GetMarketNewsRequest extends PaginationParams {
  category?: string
  type?: string
  importance?: string
  keyword?: string
}

export interface GetNewsDetailRequest {
  id: string
}

export interface GetAnnouncementRequest extends PaginationParams {
  code?: string
  type?: string
  startDate?: string
  endDate?: string
}

export interface GetResearchReportRequest extends PaginationParams {
  code?: string
  institution?: string
  rating?: string
  startDate?: string
  endDate?: string
}

export interface GetEconomicCalendarRequest extends PaginationParams {
  country?: string
  importance?: string
  startDate?: string
  endDate?: string
}

export interface GetMarketCapitalFlowRequest {
  date?: string
}

export interface GetMarketRankingRequest {
  type: string
  period: string
  market?: string
  limit?: number
}

export type GetMarketScreenerRequest = ScreenerApiParams

export interface GetUserSettingsRequest {
  keys?: string[]
}

export interface UpdateUserSettingsRequest {
  theme?: string
  language?: string
  notification?: NotificationSettings
  privacy?: PrivacySettings
  security?: SecuritySettings
  trading?: TradingSettings
  display?: DisplaySettings
}

export interface GetUserStatisticsRequest {
  period?: string
  startDate?: string
  endDate?: string
}

export interface GetUserReportRequest {
  type: string
  period: string
  startDate?: string
  endDate?: string
}

export interface UploadRequest {
  file: File
  type: string
  purpose: string
}

export interface UploadResponse {
  url: string
  filename: string
  size: number
  type: string
  uploadTime: number
}

export interface DownloadRequest {
  url: string
  filename?: string
  type?: string
}

export interface ExportRequest {
  type: string
  format: 'csv' | 'excel' | 'pdf'
  data: any
  filename?: string
}

export interface NotificationRequest {
  type: string
  title: string
  content: string
  target: string[]
  priority?: string
  expireTime?: number
}

export interface FeedbackRequest {
  type: string
  title: string
  content: string
  attachments?: string[]
}

export interface HealthCheckResponse {
  status: string
  timestamp: number
  version: string
  environment: string
  services: ServiceStatus[]
}

export interface ServiceStatus {
  name: string
  status: string
  responseTime: number
  lastCheck: number
}