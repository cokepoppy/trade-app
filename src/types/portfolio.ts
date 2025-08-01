export interface PortfolioPosition {
  id: string
  symbol: string
  name: string
  quantity: number
  averagePrice: number
  currentPrice: number
  totalValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  realizedPnL: number
  totalCost: number
  sector: string
  weight: number
  lastUpdated: number
}

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalPnL: number
  totalPnLPercent: number
  dailyPnL: number
  dailyPnLPercent: number
  totalReturn: number
  totalReturnPercent: number
  cashBalance: number
  marginUsed: number
  marginAvailable: number
  positionsCount: number
  lastUpdated: number
}

export interface PerformanceMetrics {
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  profitFactor: number
  averageWin: number
  averageLoss: number
  largestWin: number
  largestLoss: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  averageHoldingPeriod: number
  beta: number
  alpha: number
  informationRatio: number
  sortinoRatio: number
  calmarRatio: number
  trackingError: number
  upCapture: number
  downCapture: number
}

export interface AssetAllocation {
  stocks: number
  bonds: number
  cash: number
  alternatives: number
  total: number
}

export interface SectorAllocation {
  sector: string
  value: number
  weight: number
  positionsCount: number
  dailyChange: number
  dailyChangePercent: number
}

export interface RiskMetrics {
  portfolioVaR: number
  positionVaR: Map<string, number>
  beta: number
  correlationMatrix: Map<string, Map<string, number>>
  concentrationRisk: number
  liquidityRisk: number
  marketRisk: number
  creditRisk: number
  operationalRisk: number
}

export interface PortfolioHistory {
  date: string
  value: number
  return: number
  returnPercent: number
  benchmarkValue?: number
  benchmarkReturn?: number
}

export interface DividendHistory {
  id: string
  symbol: string
  amount: number
  date: string
  type: 'dividend' | 'interest' | 'other'
  status: 'pending' | 'received' | 'reinvested'
}

export interface Transaction {
  id: string
  symbol: string
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal'
  quantity: number
  price: number
  amount: number
  commission: number
  date: string
  status: 'pending' | 'completed' | 'cancelled'
  notes?: string
}

export interface PortfolioGoal {
  id: string
  name: string
  targetValue: number
  currentValue: number
  targetDate: string
  progress: number
  status: 'active' | 'completed' | 'paused'
  description: string
}

export interface Benchmark {
  name: string
  symbol: string
  values: PortfolioHistory[]
}

export interface PortfolioAnalytics {
  summary: PortfolioSummary
  performance: PerformanceMetrics
  assetAllocation: AssetAllocation
  sectorAllocation: SectorAllocation[]
  risk: RiskMetrics
  history: PortfolioHistory[]
  dividends: DividendHistory[]
  transactions: Transaction[]
  goals: PortfolioGoal[]
  benchmarks: Benchmark[]
  positions: PortfolioPosition[]
  lastUpdated: number
}