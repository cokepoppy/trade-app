export interface StopLossOrder {
  id: string
  symbol: string
  triggerPrice: number
  orderType: 'market' | 'limit'
  limitPrice?: number
  quantity: number
  status: 'active' | 'triggered' | 'cancelled' | 'expired'
  createdAt: number
  triggeredAt?: number
  trailing?: boolean
  trailingPercent?: number
  highestPrice?: number
  timeInForce: 'GTC' | 'DAY' | 'IOC'
  notes?: string
}

export interface TakeProfitOrder {
  id: string
  symbol: string
  targetPrice: number
  orderType: 'market' | 'limit'
  limitPrice?: number
  quantity: number
  status: 'active' | 'triggered' | 'cancelled' | 'expired'
  createdAt: number
  triggeredAt?: number
  timeInForce: 'GTC' | 'DAY' | 'IOC'
  notes?: string
}

export interface RiskRule {
  id: string
  name: string
  type: 'position_size' | 'stop_loss' | 'take_profit' | 'drawdown' | 'concentration' | 'variance'
  enabled: boolean
  parameters: Record<string, any>
  priority: 'low' | 'medium' | 'high' | 'critical'
  action: 'alert' | 'restrict' | 'close'
  createdAt: number
  lastTriggered?: number
  triggerCount: number
}

export interface PositionRisk {
  symbol: string
  positionSize: number
  positionValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  stopLossPrice?: number
  takeProfitPrice?: number
  riskAmount: number
  riskPercent: number
  rewardAmount: number
  rewardPercent: number
  riskRewardRatio: number
  maxDrawdown: number
  volatility: number
  beta: number
  var95: number
  concentrationRisk: number
  liquidityRisk: number
  overallRisk: 'low' | 'medium' | 'high' | 'extreme'
  lastUpdated: number
}

export interface PortfolioRisk {
  totalValue: number
  totalRisk: number
  totalRiskPercent: number
  maxDrawdown: number
  currentDrawdown: number
  valueAtRisk95: number
  valueAtRisk99: number
  beta: number
  correlationRisk: number
  concentrationRisk: number
  liquidityRisk: number
  marketRisk: number
  creditRisk: number
  operationalRisk: number
  overallRisk: 'low' | 'medium' | 'high' | 'extreme'
  riskBudget: number
  riskUtilization: number
  lastUpdated: number
}

export interface RiskAlert {
  id: string
  type: 'stop_loss' | 'take_profit' | 'drawdown' | 'margin' | 'variance' | 'concentration' | 'liquidity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  symbol?: string
  message: string
  data: any
  timestamp: number
  acknowledged: boolean
  resolvedAt?: number
}

export interface RiskMetrics {
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  informationRatio: number
  treynorRatio: number
  beta: number
  alpha: number
  rSquared: number
  trackingError: number
  upCapture: number
  downCapture: number
  var95: number
  var99: number
  expectedShortfall: number
  maxDrawdown: number
  averageDrawdown: number
  recoveryTime: number
  winRate: number
  profitFactor: number
  kellyCriterion: number
  optimalPositionSize: number
}

export interface MarginInfo {
  totalMargin: number
  usedMargin: number
  availableMargin: number
  marginLevel: number
  marginCallLevel: number
  stopOutLevel: number
  maintenanceMargin: number
  isMarginCall: boolean
  isStopOut: boolean
  lastUpdated: number
}

export interface RiskReport {
  id: string
  portfolioId: string
  generatedAt: number
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  portfolioRisk: PortfolioRisk
  positionRisks: PositionRisk[]
  riskMetrics: RiskMetrics
  alerts: RiskAlert[]
  recommendations: string[]
  compliance: {
    positionSize: boolean
    stopLoss: boolean
    concentration: boolean
    margin: boolean
    overall: boolean
  }
}