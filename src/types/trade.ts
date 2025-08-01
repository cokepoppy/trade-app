import type { ApiResponse, PaginationResult } from './api'

export interface TradeOrder {
  id: string
  orderId: string
  userId: string
  code: string
  name: string
  type: 'buy' | 'sell'
  priceType: 'market' | 'limit' | 'stop_loss' | 'stop_profit'
  price: number
  volume: number
  amount: number
  status: 'pending' | 'partial' | 'filled' | 'cancelled' | 'rejected' | 'expired'
  filledVolume: number
  filledAmount: number
  avgPrice: number
  fee: number
  tax: number
  commission: number
  totalFee: number
  orderTime: number
  updateTime: number
  filledTime?: number
  cancelTime?: number
  rejectReason?: string
  remark?: string
  accountId: string
  accountName: string
}

export interface TradePosition {
  id: string
  userId: string
  code: string
  name: string
  volume: number
  availableVolume: number
  buyPrice: number
  currentPrice: number
  marketValue: number
  costAmount: number
  currentAmount: number
  profit: number
  profitPercent: number
  todayProfit: number
  todayProfitPercent: number
  buyDate: number
  accountId: string
  accountName: string
  industry?: string
  area?: string
  pe?: number
  pb?: number
  high?: number
  low?: number
  open?: number
  preClose?: number
  turnoverRate?: number
}

export interface TradeDeal {
  id: string
  dealId: string
  orderId: string
  userId: string
  code: string
  name: string
  type: 'buy' | 'sell'
  price: number
  volume: number
  amount: number
  fee: number
  tax: number
  commission: number
  totalFee: number
  dealTime: number
  counterParty?: string
  market?: 'SH' | 'SZ' | 'HK' | 'US'
  accountId: string
  accountName: string
  profit?: number
}

export interface TradeAccount {
  id: string
  userId: string
  accountName: string
  accountType: 'stock' | 'fund' | 'bond' | 'margin'
  accountNumber: string
  status: 'active' | 'inactive' | 'frozen' | 'closed'
  balance: number
  availableBalance: number
  frozenBalance: number
  totalAssets: number
  marketValue: number
  profit: number
  profitPercent: number
  todayProfit: number
  todayProfitPercent: number
  totalProfit: number
  totalProfitPercent: number
  costAmount: number
  margin: number
  availableMargin: number
  riskLevel: 'low' | 'medium' | 'high'
  createdAt: number
  updatedAt: number
  lastTradeTime?: number
  dailyLimit?: number
  monthlyLimit?: number
  commissionRate?: number
  taxRate?: number
  marginRate?: number
}

export interface TradeFundFlow {
  id: string
  userId: string
  accountId: string
  accountName: string
  type: 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out' | 'fee' | 'tax' | 'dividend' | 'interest'
  amount: number
  balance: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  createTime: number
  completeTime?: number
  description: string
  referenceId?: string
  referenceType?: string
  operator?: string
  remark?: string
}

export interface TradeHistory {
  id: string
  userId: string
  code: string
  name: string
  type: 'buy' | 'sell'
  price: number
  volume: number
  amount: number
  profit: number
  profitPercent: number
  holdDays: number
  buyDate: number
  sellDate: number
  accountId: string
  accountName: string
  fee: number
  tax: number
  totalFee: number
  netProfit: number
  netProfitPercent: number
}

export interface TradeSetting {
  id: string
  userId: string
  defaultAccount: string
  defaultPriceType: 'market' | 'limit'
  defaultVolume: number
  maxSingleOrder: number
  maxDailyOrder: number
  maxSingleAmount: number
  maxDailyAmount: number
  commissionRate: number
  taxRate: number
  marginRate: number
  minCommission: number
  enableStopLoss: boolean
  stopLossPercent: number
  enableStopProfit: boolean
  stopProfitPercent: number
  enableRiskControl: boolean
  riskControlLevel: 'low' | 'medium' | 'high'
  enableAutoSell: boolean
  autoSellConditions: TradeAutoSellCondition[]
  enableNotification: boolean
  notificationTypes: ('order' | 'deal' | 'position' | 'fund' | 'risk')[]
  createdAt: number
  updatedAt: number
}

export interface TradeAutoSellCondition {
  id: string
  name: string
  condition: 'profit' | 'loss' | 'time' | 'price'
  value: number
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  enabled: boolean
  priority: number
}

export interface TradeCommissionRule {
  id: string
  name: string
  market: 'SH' | 'SZ' | 'HK' | 'US'
  type: 'stock' | 'fund' | 'bond' | 'margin'
  minAmount: number
  maxAmount: number
  commissionRate: number
  minCommission: number
  taxRate: number
  otherFees: TradeOtherFee[]
  effectiveFrom: number
  effectiveTo?: number
  isActive: boolean
}

export interface TradeOtherFee {
  name: string
  type: 'fixed' | 'percentage'
  value: number
  description: string
}

export interface TradeRiskControl {
  id: string
  userId: string
  level: 'low' | 'medium' | 'high'
  maxPositionValue: number
  maxSinglePosition: number
  maxDailyLoss: number
  maxTotalLoss: number
  marginCallRatio: number
  forcedLiquidationRatio: number
  enablePositionLimit: boolean
  enableDailyLossLimit: boolean
  enableTotalLossLimit: boolean
  enableMarginCall: boolean
  enableForcedLiquidation: boolean
  warningThreshold: number
  createdAt: number
  updatedAt: number
}

export interface TradeStatistics {
  userId: string
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalProfit: number
  totalLoss: number
  netProfit: number
  averageProfit: number
  averageLoss: number
  profitFactor: number
  maxDrawdown: number
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  totalReturn: number
  annualizedReturn: number
  volatility: number
  bestTrade: TradeHistory
  worstTrade: TradeHistory
  averageHoldDays: number
  startDate: number
  endDate: number
}

export interface TradePerformance {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all'
  return: number
  returnPercent: number
  benchmarkReturn: number
  benchmarkReturnPercent: number
  excessReturn: number
  excessReturnPercent: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  profitFactor: number
  totalTrades: number
  profitableTrades: number
  averageProfit: number
  averageLoss: number
  startDate: number
  endDate: number
}