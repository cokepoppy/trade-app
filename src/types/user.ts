import type { ApiResponse, PaginationResult } from './api'

export interface User {
  id: string
  username: string
  nickname: string
  email: string
  phone: string
  avatar?: string
  gender: 'male' | 'female' | 'other'
  birthday?: string
  idCard: string
  address: string
  occupation?: string
  education?: string
  income?: string
  riskLevel: 'conservative' | 'moderate' | 'aggressive'
  investmentExperience: 'beginner' | 'intermediate' | 'advanced'
  investmentGoal: string
  investmentPeriod: 'short' | 'medium' | 'long'
  status: 'active' | 'inactive' | 'frozen' | 'pending'
  isVerified: boolean
  isCertified: boolean
  lastLoginTime: number
  loginCount: number
  registerTime: number
  updateTime: number
}

export interface UserProfile {
  id: string
  userId: string
  realName: string
  idCard: string
  idCardFront: string
  idCardBack: string
  bankCard: string
  bankName: string
  bankAccount: string
  phone: string
  email: string
  address: string
  emergencyContact: string
  emergencyPhone: string
  occupation: string
  income: string
  investmentExperience: string
  riskAssessment: RiskAssessment
  verificationStatus: 'pending' | 'approved' | 'rejected'
  verificationTime?: number
  rejectReason?: string
  hasTradePassword?: boolean
}

export interface RiskAssessment {
  id: string
  userId: string
  score: number
  level: 'conservative' | 'moderate' | 'aggressive'
  questions: RiskQuestion[]
  completedTime: number
  expiryTime: number
  isValid: boolean
}

export interface RiskQuestion {
  id: string
  question: string
  options: RiskOption[]
  selectedOption: string
  score: number
}

export interface RiskOption {
  id: string
  text: string
  score: number
}

export interface UserSettings {
  id: string
  userId: string
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  timezone: string
  currency: 'CNY' | 'USD' | 'HKD'
  dateFormat: string
  timeFormat: '12h' | '24h'
  notification: NotificationSettings
  privacy: PrivacySettings
  security: SecuritySettings
  trading: TradingSettings
  display: DisplaySettings
  updatedAt: number
}

export interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  orderNotification: boolean
  dealNotification: boolean
  positionNotification: boolean
  fundNotification: boolean
  newsNotification: boolean
  marketNotification: boolean
  marketingNotification: boolean
  quietHours: QuietHours
}

export interface QuietHours {
  enabled: boolean
  startTime: string
  endTime: string
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private'
  tradingVisibility: 'public' | 'friends' | 'private'
  allowSearch: boolean
  allowMessage: boolean
  allowRecommendation: boolean
  dataCollection: boolean
  personalizedAds: boolean
  privacyMode: boolean
  locationEnabled: boolean
  analyticsEnabled: boolean
}

export interface SecuritySettings {
  twoFactorAuth: boolean
  loginAlert: boolean
  tradePassword: boolean
  deviceBinding: boolean
  autoLock: boolean
  lockTimeout: number
  biometricAuth: boolean
  lastPasswordChange: number
  lastSecurityCheck: number
}

export interface TradingSettings {
  defaultAccount: string
  defaultPriceType: 'market' | 'limit'
  defaultVolume: number
  quickTrade: boolean
  confirmTrade: boolean
  showAdvancedOptions: boolean
  autoSaveOrder: boolean
  riskWarning: boolean
  commissionDisplay: boolean
  fingerprintTrade: boolean
}

export interface DisplaySettings {
  defaultPage: string
  watchlistDisplay: 'list' | 'grid'
  chartStyle: 'candlestick' | 'line' | 'area'
  chartIndicators: string[]
  priceDisplay: 'price' | 'change' | 'percent'
  volumeDisplay: boolean
  marketDepth: boolean
  customColumns: string[]
  hideAsset: boolean
  noImageMode: boolean
}

export interface UserDevice {
  id: string
  userId: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  deviceName: string
  deviceId: string
  platform: string
  osVersion: string
  appVersion: string
  isActive: boolean
  lastLoginTime: number
  loginIp: string
  loginLocation: string
  isBound: boolean
  bindTime: number
}

export interface UserLoginHistory {
  id: string
  userId: string
  loginTime: number
  logoutTime?: number
  loginIp: string
  loginLocation: string
  deviceType: string
  deviceName: string
  platform: string
  status: 'success' | 'failed'
  failureReason?: string
}

export interface UserActivity {
  id: string
  userId: string
  type: 'login' | 'logout' | 'trade' | 'view' | 'search' | 'setting' | 'other'
  action: string
  target: string
  details: Record<string, any>
  ip: string
  location: string
  device: string
  timestamp: number
}

export interface UserMessage {
  id: string
  userId: string
  type: 'system' | 'order' | 'deal' | 'position' | 'fund' | 'news' | 'marketing'
  title: string
  content: string
  summary: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isRead: boolean
  isDeleted: boolean
  expireTime?: number
  createdAt: number
  readTime?: number
  deleteTime?: number
  relatedId?: string
  relatedType?: string
}

export interface UserFeedback {
  id: string
  userId: string
  type: 'bug' | 'feature' | 'improvement' | 'complaint' | 'suggestion'
  title: string
  content: string
  attachments?: string[]
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  createTime: number
  updateTime: number
  resolveTime?: number
  resolverId?: string
  response?: string
  rating?: number
  comment?: string
}

export interface UserReport {
  id: string
  userId: string
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  title: string
  content: string
  data: ReportData
  createTime: number
  period: ReportPeriod
}

export interface ReportData {
  portfolio: PortfolioData
  trading: TradingData
  performance: PerformanceData
  risk: RiskData
}

export interface PortfolioData {
  totalAssets: number
  totalProfit: number
  totalReturn: number
  positions: PositionData[]
  allocation: AllocationData[]
}

export interface PositionData {
  code: string
  name: string
  value: number
  profit: number
  return: number
  weight: number
}

export interface AllocationData {
  category: string
  value: number
  percentage: number
}

export interface TradingData {
  totalTrades: number
  winRate: number
  totalProfit: number
  averageProfit: number
  bestTrade: string
  worstTrade: string
}

export interface PerformanceData {
  totalReturn: number
  benchmarkReturn: number
  sharpeRatio: number
  maxDrawdown: number
  volatility: number
}

export interface RiskData {
  riskLevel: string
  maxPosition: number
  concentration: number
  diversification: number
}

export interface ReportPeriod {
  startDate: string
  endDate: string
  type: string
}

export interface UserPreference {
  id: string
  userId: string
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  category: string
  createdAt: number
  updatedAt: number
}