export interface Stock {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  amount: number
  marketValue: number
  pe: number
  pb: number
  high: number
  low: number
  open: number
  preClose: number
  timestamp: number
  market: 'SH' | 'SZ' | 'HK' | 'US'
  type: 'stock' | 'fund' | 'bond' | 'index'
  industry?: string
  area?: string
  isHot?: boolean
  isUp?: boolean
  isDown?: boolean
}

export interface StockDetail extends Stock {
  currentPrice: number
  buyPrice: number
  sellPrice: number
  buyVolume: number
  sellVolume: number
  turnoverRate: number
  amplitude: number
  circulationMarketValue: number
  totalMarketValue: number
  earningsPerShare: number
  netAssetsPerShare: number
  dividendYield: number
  priceEarningsRatio: number
  priceBookRatio: number
  priceSalesRatio: number
  priceCashFlowRatio: number
  beta: number
  volatility: number
  week52High: number
  week52Low: number
  sharesOutstanding: number
  floatShares: number
  institutionHolding: number
  employeeCount: number
  establishedDate: string
  listingDate: string
  description: string
  website?: string
  phone?: string
  address?: string
}

export interface StockQuote {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  amount: number
  timestamp: number
  buyPrice: number
  sellPrice: number
  buyVolume: number
  sellVolume: number
  high: number
  low: number
  open: number
  preClose: number
}

export interface StockKLine {
  timestamp: number
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  amount: number
  change: number
  changePercent: number
  turnoverRate?: number
}

export interface StockTimeShare {
  timestamp: number
  time: string
  price: number
  avgPrice: number
  volume: number
  amount: number
  change: number
  changePercent: number
}

export interface OrderBook {
  code: string
  timestamp: number
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
}

export interface OrderBookLevel {
  price: number
  volume: number
  amount: number
}

export interface Transaction {
  code: string
  timestamp: number
  time: string
  price: number
  volume: number
  amount: number
  type: 'buy' | 'sell'
  direction: 'up' | 'down' | 'flat'
}

export interface StockFundamental {
  code: string
  name: string
  industry: string
  mainBusiness: string
  description: string
  establishedDate: string
  listingDate: string
  sharesOutstanding: number
  floatShares: number
  circulationMarketValue: number
  totalMarketValue: number
  earningsPerShare: number
  netAssetsPerShare: number
  revenue: number
  netProfit: number
  totalAssets: number
  netAssets: number
  roe: number
  roa: number
  debtRatio: number
  currentRatio: number
  quickRatio: number
  grossMargin: number
  netMargin: number
  operatingMargin: number
  pe: number
  pb: number
  ps: number
  pc: number
  dividendYield: number
  beta: number
}

export interface StockFinancial {
  code: string
  reportDate: string
  reportType: 'quarter' | 'half' | 'year'
  revenue: number
  revenueGrowth: number
  netProfit: number
  netProfitGrowth: number
  grossProfit: number
  grossMargin: number
  operatingProfit: number
  operatingMargin: number
  netMargin: number
  totalAssets: number
  totalLiabilities: number
  netAssets: number
  roe: number
  roa: number
  debtRatio: number
  currentRatio: number
  quickRatio: number
  earningsPerShare: number
  netAssetsPerShare: number
  cashFlowFromOperating: number
  cashFlowFromInvesting: number
  cashFlowFromFinancing: number
  freeCashFlow: number
}

export interface StockNews {
  id: string
  code: string
  name: string
  title: string
  content: string
  summary: string
  source: string
  author: string
  publishTime: number
  url: string
  tags: string[]
  importance: 'high' | 'medium' | 'low'
  type: 'news' | 'announcement' | 'research' | 'analysis'
}

export interface StockAnnouncement {
  id: string
  code: string
  name: string
  title: string
  content: string
  summary: string
  announcementType: string
  announcementDate: string
  publishTime: number
  url: string
  importance: 'high' | 'medium' | 'low'
 附件?: string[]
}

export interface StockResearch {
  id: string
  code: string
  name: string
  title: string
  content: string
  summary: string
  institution: string
  analyst: string
  rating: 'buy' | 'hold' | 'sell' | 'strong_buy' | 'strong_sell'
  targetPrice: number
  publishTime: number
  url: string
  reportType: string
}

export interface WatchlistItem {
  id: string
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  amount: number
  timestamp: number
  groupId: string
  groupName: string
  sort: number
  isTop: boolean
  remark?: string
  alertPrice?: number
  alertPercent?: number
  createdAt: number
  updatedAt: number
}

export interface WatchlistGroup {
  id: string
  name: string
  description?: string
  sort: number
  isDefault: boolean
  itemCount: number
  createdAt: number
  updatedAt: number
}

export interface StockSearchResult {
  code: string
  name: string
  market: 'SH' | 'SZ' | 'HK' | 'US'
  type: 'stock' | 'fund' | 'bond' | 'index'
  pinyin?: string
  pinyinInitial?: string
  industry?: string
  area?: string
  matchScore: number
}

export interface StockScreenerCondition {
  market?: ('SH' | 'SZ' | 'HK' | 'US')[]
  type?: ('stock' | 'fund' | 'bond' | 'index')[]
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
  sortBy?: 'price' | 'change' | 'changePercent' | 'volume' | 'amount' | 'marketValue' | 'pe' | 'pb'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface StockScreenerResult {
  stocks: Stock[]
  total: number
  page: number
  pageSize: number
  conditions: StockScreenerCondition
}