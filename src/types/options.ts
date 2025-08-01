export interface OptionContract {
  id: string
  symbol: string
  underlyingSymbol: string
  type: 'call' | 'put'
  strikePrice: number
  expirationDate: string
  daysToExpiration: number
  lastPrice: number
  bid: number
  ask: number
  volume: number
  openInterest: number
  impliedVolatility: number
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  inTheMoney: boolean
  intrinsicValue: number
  timeValue: number
  lastUpdated: number
}

export interface OptionChain {
  symbol: string
  expirationDates: string[]
  strikes: number[]
  calls: OptionContract[]
  puts: OptionContract[]
  lastUpdated: number
}

export interface OptionPosition {
  id: string
  contract: OptionContract
  quantity: number
  averagePrice: number
  currentPrice: number
  totalValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  realizedPnL: number
  totalCost: number
  openingDate: string
  closingDate?: string
  status: 'open' | 'closed' | 'expired'
  strategy?: string
  legs?: OptionPosition[]
  lastUpdated: number
}

export interface OptionStrategy {
  id: string
  name: string
  type: 'single' | 'spread' | 'straddle' | 'strangle' | 'butterfly' | 'condor' | 'ratio' | 'collar'
  description: string
  legs: OptionStrategyLeg[]
  maxProfit: number
  maxLoss: number
  breakEvenPoints: number[]
  probabilityOfProfit: number
  riskRewardRatio: number
  greeks: OptionGreeks
  lastUpdated: number
}

export interface OptionStrategyLeg {
  id: string
  contract: OptionContract
  action: 'buy' | 'sell'
  quantity: number
  ratio: number
}

export interface OptionGreeks {
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  impliedVolatility: number
}

export interface OptionOrder {
  id: string
  strategy: OptionStrategy
  type: 'market' | 'limit' | 'stop' | 'stop_limit'
  duration: 'day' | 'gtc' | 'ioc' | 'fok'
  status: 'pending' | 'filled' | 'cancelled' | 'expired' | 'rejected'
  quantity: number
  filledQuantity: number
  price?: number
  stopPrice?: number
  limitPrice?: number
  averageFillPrice?: number
  commission: number
  createdAt: number
  filledAt?: number
  updatedAt: number
  notes?: string
}

export interface VolatilitySurface {
  symbol: string
  strikes: number[]
  expirations: string[]
  impliedVolatilities: number[][]
  lastUpdated: number
}

export interface OptionPricingParams {
  underlyingPrice: number
  strikePrice: number
  timeToExpiration: number
  riskFreeRate: number
  dividendYield: number
  volatility: number
  optionType: 'call' | 'put'
}

export interface OptionScenario {
  id: string
  name: string
  underlyingPrice: number
  volatility: number
  timeToExpiration: number
  strategyValue: number
  strategyPnL: number
  greeks: OptionGreeks
  probability: number
}

export interface OptionRiskMetrics {
  portfolioDelta: number
  portfolioGamma: number
  portfolioTheta: number
  portfolioVega: number
  portfolioRho: number
  var95: number
  var99: number
  expectedShortfall: number
  maxLoss: number
  betaWeightedDelta: number
  correlationRisk: number
  liquidityRisk: number
  lastUpdated: number
}

export interface OptionTrade {
  id: string
  symbol: string
  strategy: string
  action: 'buy_to_open' | 'sell_to_open' | 'buy_to_close' | 'sell_to_close'
  quantity: number
  price: number
  commission: number
  timestamp: number
  pnl?: number
  holdingPeriod?: number
  notes?: string
}

export interface OptionAnalytics {
  totalPositions: number
  totalValue: number
  totalPnL: number
  totalPnLPercent: number
  dailyPnL: number
  dailyPnLPercent: number
  winningTrades: number
  losingTrades: number
  winRate: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  largestWin: number
  largestLoss: number
  maxDrawdown: number
  sharpeRatio: number
  sortinoRatio: number
  beta: number
  alpha: number
  impliedVolatilityAvg: number
  deltaExposure: number
  gammaExposure: number
  thetaDecay: number
  vegaExposure: number
  lastUpdated: number
}

export interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  bid: number
  ask: number
  lastUpdated: number
}

export interface OptionSpread {
  id: string
  name: string
  type: 'vertical' | 'horizontal' | 'diagonal' | 'calendar' | 'ratio'
  description: string
  legs: OptionStrategyLeg[]
  debitOrCredit: 'debit' | 'credit'
  maxProfit: number
  maxLoss: number
  breakEvenPoints: number[]
  probabilityOfProfit: number
  riskRewardRatio: number
  greeks: OptionGreeks
  marginRequirement: number
  lastUpdated: number
}