import { Request } from 'express';

// 全局类型定义
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
  traceId?: string;
}

export interface ApiError {
  code: number;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  traceId?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
  nickname: string;
  email: string;
  phone: string;
  avatar?: string;
  gender: 'male' | 'female' | 'other';
  birthday?: string;
  idCard: string;
  address: string;
  occupation?: string;
  education?: string;
  income?: string;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  investmentExperience: 'beginner' | 'intermediate' | 'advanced';
  investmentGoal: string;
  investmentPeriod: 'short' | 'medium' | 'long';
  status: 'active' | 'inactive' | 'frozen' | 'pending';
  isVerified: boolean;
  isCertified: boolean;
  lastLoginTime: number;
  loginCount: number;
  registerTime: number;
  updateTime: number;
  role?: string;
  permissions?: string[];
  passwordHash?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  realName: string;
  idCard: string;
  idCardFront: string;
  idCardBack: string;
  bankCard: string;
  bankName: string;
  bankAccount: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  occupation: string;
  income: string;
  investmentExperience: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationTime?: number;
  rejectReason?: string;
  hasTradePassword?: boolean;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  timezone: string;
  currency: 'CNY' | 'USD' | 'HKD';
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notification: NotificationSettings;
  privacy: PrivacySettings;
  security: SecuritySettings;
  trading: TradingSettings;
  display: DisplaySettings;
  updatedAt: number;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  orderNotification: boolean;
  dealNotification: boolean;
  positionNotification: boolean;
  fundNotification: boolean;
  newsNotification: boolean;
  marketNotification: boolean;
  marketingNotification: boolean;
  quietHours: QuietHours;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  tradingVisibility: 'public' | 'friends' | 'private';
  allowSearch: boolean;
  allowMessage: boolean;
  allowRecommendation: boolean;
  dataCollection: boolean;
  personalizedAds: boolean;
  privacyMode: boolean;
  locationEnabled: boolean;
  analyticsEnabled: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAlert: boolean;
  tradePassword: boolean;
  deviceBinding: boolean;
  autoLock: boolean;
  lockTimeout: number;
  biometricAuth: boolean;
  lastPasswordChange: number;
  lastSecurityCheck: number;
}

export interface TradingSettings {
  defaultAccount: string;
  defaultPriceType: 'market' | 'limit';
  defaultVolume: number;
  quickTrade: boolean;
  confirmTrade: boolean;
  showAdvancedOptions: boolean;
  autoSaveOrder: boolean;
  riskWarning: boolean;
  commissionDisplay: boolean;
  fingerprintTrade: boolean;
}

export interface DisplaySettings {
  defaultPage: string;
  watchlistDisplay: 'list' | 'grid';
  chartStyle: 'candlestick' | 'line' | 'area';
  chartIndicators: string[];
  priceDisplay: 'price' | 'change' | 'percent';
  volumeDisplay: boolean;
  marketDepth: boolean;
  customColumns: string[];
  hideAsset: boolean;
  noImageMode: boolean;
}

// 认证相关类型
export interface LoginRequest {
  username: string;
  password: string;
  captcha?: string;
  deviceInfo?: DeviceInfo;
}

export interface PhoneLoginRequest {
  phone: string;
  smsCode: string;
  deviceInfo?: DeviceInfo;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  userInfo: User;
  permissions: string[];
  settings: UserSettings;
}

export interface LoginApiResponse extends ApiResponse<LoginResponse> {
  userInfo?: User;
  userId?: string;
  token?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  phone: string;
  captcha: string;
  deviceInfo?: DeviceInfo;
}

export interface RegisterResponse {
  userId: string;
  token: string;
  expiresIn: number;
  userInfo: User;
}

export interface RegisterApiResponse extends ApiResponse<RegisterResponse> {
  userId?: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: string;
  deviceName: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  ip: string;
  location: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  captcha?: string;
}

export interface ResetPasswordRequest {
  email?: string;
  phone?: string;
  captcha: string;
  newPassword: string;
  confirmPassword: string;
}

// 错误类型
export class AppError extends Error {
  constructor(
    public code: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 创建应用错误
 */
export const createAppError = (
  code: number,
  message: string,
  details?: any
): AppError => {
  return new AppError(code, message, details);
};

// HTTP 请求类型
export interface RequestWithUser extends Request {
  user?: User;
  token?: string;
}

// 用户消息类型
export interface UserMessage {
  id: string;
  userId: string;
  type: 'system' | 'order' | 'deal' | 'position' | 'fund' | 'news' | 'marketing';
  title: string;
  content: string;
  summary: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  isDeleted: boolean;
  expireTime?: number;
  createdAt: number;
  readTime?: number;
  deleteTime?: number;
  relatedId?: string;
  relatedType?: string;
}

// 导出增强的 Request 类型
export type AuthenticatedRequest = RequestWithUser;

// WebSocket 类型
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  messageId: string;
}

export interface WebSocketAuth {
  token: string;
  deviceId: string;
  platform: string;
}