import type { Stock } from './stock'
import type { ApiResponse, ApiConfig, ApiRequest, PaginationResult } from './api'

export interface MarketIndex {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  amount: number
  high: number
  low: number
  open: number
  preClose: number
  timestamp: number
  market: 'SH' | 'SZ' | 'HK' | 'US'
  type: 'index' | 'sector' | 'concept'
  description?: string
  constituentCount: number
  totalMarketValue: number
  pe: number
  pb: number
  dividendYield: number
  constituents?: Stock[]
}

export interface MarketSector {
  id: string
  name: string
  code: string
  description: string
  parentSector?: string
  stocks: Stock[]
  statistics: SectorStatistics
  performance: SectorPerformance
  market: 'SH' | 'SZ' | 'HK' | 'US'
}

export interface SectorStatistics {
  totalStocks: number
  upStocks: number
  downStocks: number
  unchangedStocks: number
  totalMarketValue: number
  averagePE: number
  averagePB: number
  averageDividendYield: number
  totalVolume: number
  totalAmount: number
  turnoverRate: number
}

export interface SectorPerformance {
  day: number
  week: number
  month: number
  quarter: number
  year: number
  yearToDate: number
}

export interface MarketConcept {
  id: string
  name: string
  description: string
  stocks: Stock[]
  hotLevel: number
  trend: 'up' | 'down' | 'flat'
  createdAt: number
  updatedAt: number
  relatedConcepts?: string[]
}

export interface MarketHotStock {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  amount: number
  turnoverRate: number
  hotReason: string
  hotLevel: number
  concept?: string[]
  industry?: string
  market: 'SH' | 'SZ' | 'HK' | 'US'
  timestamp: number
}

export interface MarketTrend {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  trend: 'up' | 'down' | 'flat'
  strength: number
  description: string
  keyPoints: string[]
  affectedSectors: string[]
  affectedStocks: string[]
}

export interface MarketSentiment {
  overall: 'bullish' | 'bearish' | 'neutral'
  individual: 'bullish' | 'bearish' | 'neutral'
  institutional: 'bullish' | 'bearish' | 'neutral'
  foreign: 'bullish' | 'bearish' | 'neutral'
  score: number
  description: string
  indicators: SentimentIndicator[]
}

export interface SentimentIndicator {
  name: string
  value: number
  description: string
  trend: 'up' | 'down' | 'flat'
}

export interface MarketCalendar {
  id: string
  date: string
  type: 'trading' | 'holiday' | 'dividend' | 'earnings' | 'economic'
  title: string
  description: string
  importance: 'high' | 'medium' | 'low'
  affectedMarkets: ('SH' | 'SZ' | 'HK' | 'US')[]
  relatedStocks?: string[]
  timestamp: number
}

export interface MarketEconomicData {
  id: string
  name: string
  value: number
  previousValue: number
  change: number
  changePercent: number
  unit: string
  releaseTime: number
  country: string
  importance: 'high' | 'medium' | 'low'
  description: string
  category: string
  forecast?: number
  actual?: number
}

export interface MarketCapitalFlow {
  date: string
  timestamp: number
  northBound: number
  southBound: number
  totalInflow: number
  totalOutflow: number
  netInflow: number
  topInflows: CapitalFlowStock[]
  topOutflows: CapitalFlowStock[]
  sectorFlows: SectorFlow[]
}

export interface CapitalFlowStock {
  code: string
  name: string
  netAmount: number
  changePercent: number
  volume: number
  market: 'SH' | 'SZ' | 'HK' | 'US'
}

export interface SectorFlow {
  sector: string
  netAmount: number
  changePercent: number
  volume: number
}

export interface MarketRanking {
  type: 'gain' | 'loss' | 'volume' | 'amount' | 'turnover' | 'market_value'
  period: 'day' | 'week' | 'month' | 'year'
  stocks: Stock[]
  updateTime: number
}

export interface MarketOverview {
  indices: MarketIndex[]
  sectors: MarketSector[]
  hotStocks: MarketHotStock[]
  marketSentiment: MarketSentiment
  capitalFlow: MarketCapitalFlow
  marketStatus: MarketStatus
  updateTime: number
}

export interface MarketStatus {
  isTradingDay: boolean
  isTradingTime: boolean
  marketPhase: 'pre_open' | 'open' | 'break' | 'close' | 'after_hours'
  nextTradingDay: string
  previousTradingDay: string
  tradingDaysThisMonth: number
  tradingDaysThisYear: number
  holidays: MarketHoliday[]
}

export interface MarketHoliday {
  date: string
  name: string
  description: string
  affectedMarkets: ('SH' | 'SZ' | 'HK' | 'US')[]
}

export interface MarketNews {
  id: string
  title: string
  content: string
  summary: string
  source: string
  author: string
  publishTime: number
  url: string
  type: 'market' | 'sector' | 'stock' | 'economic' | 'policy'
  importance: 'high' | 'medium' | 'low'
  tags: string[]
  relatedStocks?: string[]
  relatedSectors?: string[]
}

export interface MarketAnalysis {
  id: string
  title: string
  content: string
  summary: string
  author: string
  institution: string
  publishTime: number
  type: 'technical' | 'fundamental' | 'sentiment' | 'macro'
  timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year'
  target: string
  recommendation: 'buy' | 'hold' | 'sell'
  confidence: number
  charts?: ChartData[]
}

export interface ChartData {
  type: 'line' | 'bar' | 'candlestick' | 'scatter'
  title: string
  data: Record<string, unknown>[]
  xAxis: string
  yAxis: string
  description: string
}

export interface MarketAlert {
  id: string
  type: 'price' | 'volume' | 'technical' | 'news' | 'economic'
  condition: string
  target: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  isRead: boolean
  createdAt: number
  expireAt?: number
}

export interface MarketStockApiParams {
  code?: string
  market?: string
  type?: string
  industry?: string
  area?: string
  page?: number
  pageSize?: number
}

export interface MarketMarketApiParams {
  market?: string
  type?: string
  page?: number
  pageSize?: number
}

export interface MarketChartApiParams {
  code: string
  period: string
  type: string
}

export interface MarketScreenerApiParams {
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
  turnoverRateMin?: number
  turnoverRateMax?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface EconomicData {
  id: string
  name: string
  value: number
  previousValue: number
  change: number
  changePercent: number
  unit: string
  releaseTime: number
  country: string
  importance: 'high' | 'medium' | 'low'
  description: string
  category: string
  forecast?: number
  actual?: number
}

export interface MarketStatus {
  isTradingDay: boolean
  isTradingTime: boolean
  marketPhase: 'pre_open' | 'open' | 'break' | 'close' | 'after_hours'
  nextTradingDay: string
  previousTradingDay: string
  tradingDaysThisMonth: number
  tradingDaysThisYear: number
  holidays: MarketHoliday[]
}