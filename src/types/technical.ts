export interface TechnicalIndicator {
  name: string
  value: number
  signal: 'buy' | 'sell' | 'neutral'
  timestamp: number
}

export interface RSIResult {
  rsi: number
  signal: 'oversold' | 'overbought' | 'neutral'
  timestamp: number
}

export interface MACDResult {
  macd: number
  signal: number
  histogram: number
  signalType: 'bullish' | 'bearish' | 'neutral'
  timestamp: number
}

export interface BollingerBandsResult {
  upper: number
  middle: number
  lower: number
  bandwidth: number
  signal: 'squeeze' | 'expansion' | 'normal'
  timestamp: number
}

export interface TechnicalAnalysisResult {
  symbol: string
  timeframe: string
  rsi?: RSIResult
  macd?: MACDResult
  bollingerBands?: BollingerBandsResult
  overallSignal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell'
  confidence: number
  timestamp: number
}

export interface ChartDataPoint {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface IndicatorConfig {
  rsi?: {
    period: number
    overbought: number
    oversold: number
  }
  macd?: {
    fastPeriod: number
    slowPeriod: number
    signalPeriod: number
  }
  bollingerBands?: {
    period: number
    standardDeviations: number
  }
}