import type { 
  ChartDataPoint, 
  TechnicalAnalysisResult,
  RSIResult,
  MACDResult,
  BollingerBandsResult,
  IndicatorConfig 
} from '@/types/technical'

export class TechnicalAnalysisService {
  private defaultConfig: IndicatorConfig = {
    rsi: {
      period: 14,
      overbought: 70,
      oversold: 30
    },
    macd: {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9
    },
    bollingerBands: {
      period: 20,
      standardDeviations: 2
    }
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSI(data: ChartDataPoint[], period = 14): RSIResult {
    if (data.length < period + 1) {
      throw new Error('Insufficient data for RSI calculation')
    }

    const closes = data.map(d => d.close)
    const gains: number[] = []
    const losses: number[] = []

    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1]
      gains.push(change > 0 ? change : 0)
      losses.push(change < 0 ? Math.abs(change) : 0)
    }

    // Calculate initial average gain and loss
    let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period
    let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period

    const rsiValues: number[] = []

    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period

      if (avgLoss === 0) {
        rsiValues.push(100)
      } else {
        const rs = avgGain / avgLoss
        const rsi = 100 - (100 / (1 + rs))
        rsiValues.push(rsi)
      }
    }

    const currentRSI = rsiValues[rsiValues.length - 1]
    
    let signal: 'oversold' | 'overbought' | 'neutral' = 'neutral'
    if (currentRSI <= 30) signal = 'oversold'
    else if (currentRSI >= 70) signal = 'overbought'

    return {
      rsi: currentRSI,
      signal,
      timestamp: Date.now()
    }
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(
    data: ChartDataPoint[], 
    fastPeriod = 12, 
    slowPeriod = 26, 
    signalPeriod = 9
  ): MACDResult {
    if (data.length < slowPeriod + signalPeriod) {
      throw new Error('Insufficient data for MACD calculation')
    }

    const closes = data.map(d => d.close)
    
    // Calculate EMAs
    const fastEMA = this.calculateEMA(closes, fastPeriod)
    const slowEMA = this.calculateEMA(closes, slowPeriod)
    
    // Calculate MACD line
    const macdLine: number[] = []
    for (let i = 0; i < fastEMA.length; i++) {
      macdLine.push(fastEMA[i] - slowEMA[i])
    }

    // Calculate signal line (EMA of MACD line)
    const signalLine = this.calculateEMA(macdLine, signalPeriod)
    
    // Calculate histogram
    const histogram: number[] = []
    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[macdLine.length - signalLine.length + i] - signalLine[i])
    }

    const currentMACD = macdLine[macdLine.length - 1]
    const currentSignal = signalLine[signalLine.length - 1]
    const currentHistogram = histogram[histogram.length - 1]

    let signalType: 'bullish' | 'bearish' | 'neutral' = 'neutral'
    if (currentHistogram > 0) signalType = 'bullish'
    else if (currentHistogram < 0) signalType = 'bearish'

    return {
      macd: currentMACD,
      signal: currentSignal,
      histogram: currentHistogram,
      signalType,
      timestamp: Date.now()
    }
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(
    data: ChartDataPoint[], 
    period = 20, 
    standardDeviations = 2
  ): BollingerBandsResult {
    if (data.length < period) {
      throw new Error('Insufficient data for Bollinger Bands calculation')
    }

    const closes = data.map(d => d.close)
    const middleBand: number[] = []
    const upperBand: number[] = []
    const lowerBand: number[] = []

    for (let i = period - 1; i < closes.length; i++) {
      const slice = closes.slice(i - period + 1, i + 1)
      const mean = slice.reduce((sum, price) => sum + price, 0) / period
      
      // Calculate standard deviation
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period
      const stdDev = Math.sqrt(variance)
      
      middleBand.push(mean)
      upperBand.push(mean + (standardDeviations * stdDev))
      lowerBand.push(mean - (standardDeviations * stdDev))
    }

    const currentMiddle = middleBand[middleBand.length - 1]
    const currentUpper = upperBand[upperBand.length - 1]
    const currentLower = lowerBand[lowerBand.length - 1]
    
    const bandwidth = (currentUpper - currentLower) / currentMiddle

    let signal: 'squeeze' | 'expansion' | 'normal' = 'normal'
    if (bandwidth < 0.04) signal = 'squeeze'
    else if (bandwidth > 0.10) signal = 'expansion'

    return {
      upper: currentUpper,
      middle: currentMiddle,
      lower: currentLower,
      bandwidth,
      signal,
      timestamp: Date.now()
    }
  }

  /**
   * Calculate comprehensive technical analysis
   */
  analyzeTechnicalIndicators(
    symbol: string,
    data: ChartDataPoint[],
    timeframe: string,
    config?: Partial<IndicatorConfig>
  ): TechnicalAnalysisResult {
    const finalConfig = { ...this.defaultConfig, ...config }
    
    let rsi: RSIResult | undefined
    let macd: MACDResult | undefined
    let bollingerBands: BollingerBandsResult | undefined

    try {
      if (finalConfig.rsi) {
        rsi = this.calculateRSI(data, finalConfig.rsi.period)
      }
    } catch (error) {
      console.warn(`Failed to calculate RSI for ${symbol}:`, error)
    }

    try {
      if (finalConfig.macd) {
        macd = this.calculateMACD(
          data, 
          finalConfig.macd.fastPeriod, 
          finalConfig.macd.slowPeriod, 
          finalConfig.macd.signalPeriod
        )
      }
    } catch (error) {
      console.warn(`Failed to calculate MACD for ${symbol}:`, error)
    }

    try {
      if (finalConfig.bollingerBands) {
        bollingerBands = this.calculateBollingerBands(
          data, 
          finalConfig.bollingerBands.period, 
          finalConfig.bollingerBands.standardDeviations
        )
      }
    } catch (error) {
      console.warn(`Failed to calculate Bollinger Bands for ${symbol}:`, error)
    }

    // Calculate overall signal
    const overallSignal = this.calculateOverallSignal(rsi, macd, bollingerBands)
    const confidence = this.calculateConfidence(rsi, macd, bollingerBands)

    return {
      symbol,
      timeframe,
      rsi,
      macd,
      bollingerBands,
      overallSignal,
      confidence,
      timestamp: Date.now()
    }
  }

  /**
   * Calculate overall signal from multiple indicators
   */
  private calculateOverallSignal(
    rsi?: RSIResult,
    macd?: MACDResult,
    bollingerBands?: BollingerBandsResult
  ): 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell' {
    const signals: string[] = []

    if (rsi) {
      if (rsi.signal === 'oversold') signals.push('buy')
      else if (rsi.signal === 'overbought') signals.push('sell')
    }

    if (macd) {
      if (macd.signalType === 'bullish') signals.push('buy')
      else if (macd.signalType === 'bearish') signals.push('sell')
    }

    if (bollingerBands) {
      if (bollingerBands.signal === 'squeeze') signals.push('neutral')
    }

    const buySignals = signals.filter(s => s === 'buy').length
    const sellSignals = signals.filter(s => s === 'sell').length
    const totalSignals = signals.length

    if (totalSignals === 0) return 'neutral'

    const buyRatio = buySignals / totalSignals
    const sellRatio = sellSignals / totalSignals

    if (buyRatio >= 0.67) return 'strong_buy'
    else if (buyRatio >= 0.34) return 'buy'
    else if (sellRatio >= 0.67) return 'strong_sell'
    else if (sellRatio >= 0.34) return 'sell'
    else return 'neutral'
  }

  /**
   * Calculate confidence level based on indicator agreement
   */
  private calculateConfidence(
    rsi?: RSIResult,
    macd?: MACDResult,
    bollingerBands?: BollingerBandsResult
  ): number {
    const validIndicators = [rsi, macd, bollingerBands].filter(ind => ind !== undefined).length
    if (validIndicators === 0) return 0

    // Base confidence on number of available indicators
    let confidence = (validIndicators / 3) * 0.7 // 70% based on availability

    // Additional confidence based on indicator strength
    if (rsi) {
      if (rsi.rsi <= 20 || rsi.rsi >= 80) confidence += 0.1
    }

    if (macd) {
      if (Math.abs(macd.histogram) > 0.5) confidence += 0.1
    }

    if (bollingerBands) {
      if (bollingerBands.bandwidth <= 0.02 || bollingerBands.bandwidth >= 0.15) confidence += 0.1
    }

    return Math.min(confidence, 1.0)
  }

  /**
   * Calculate Exponential Moving Average (EMA)
   */
  private calculateEMA(values: number[], period: number): number[] {
    if (values.length < period) {
      throw new Error('Insufficient data for EMA calculation')
    }

    const ema: number[] = []
    const multiplier = 2 / (period + 1)

    // Start with SMA for first value
    const firstSMA = values.slice(0, period).reduce((sum, val) => sum + val, 0) / period
    ema.push(firstSMA)

    // Calculate EMA for remaining values
    for (let i = period; i < values.length; i++) {
      const emaValue = (values[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]
      ema.push(emaValue)
    }

    return ema
  }

  /**
   * Calculate Simple Moving Average (SMA)
   */
  calculateSMA(data: ChartDataPoint[], period: number): number[] {
    if (data.length < period) {
      throw new Error('Insufficient data for SMA calculation')
    }

    const sma: number[] = []
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1)
      const average = slice.reduce((sum, d) => sum + d.close, 0) / period
      sma.push(average)
    }
    return sma
  }

  /**
   * Calculate support and resistance levels
   */
  calculateSupportResistance(data: ChartDataPoint[], lookbackPeriod = 20): {
    support: number[]
    resistance: number[]
  } {
    if (data.length < lookbackPeriod) {
      return { support: [], resistance: [] }
    }

    const support: number[] = []
    const resistance: number[] = []

    for (let i = lookbackPeriod; i < data.length - lookbackPeriod; i++) {
      const current = data[i]
      const leftSlice = data.slice(i - lookbackPeriod, i)
      const rightSlice = data.slice(i + 1, i + lookbackPeriod + 1)

      const isLow = leftSlice.every(d => d.low >= current.low) && 
                   rightSlice.every(d => d.low >= current.low)
      const isHigh = leftSlice.every(d => d.high <= current.high) && 
                    rightSlice.every(d => d.high <= current.high)

      if (isLow) support.push(current.low)
      if (isHigh) resistance.push(current.high)
    }

    // Remove nearby duplicates and return significant levels
    return {
      support: this.removeNearbyDuplicates(support, 0.02),
      resistance: this.removeNearbyDuplicates(resistance, 0.02)
    }
  }

  /**
   * Remove nearby duplicate values
   */
  private removeNearbyDuplicates(values: number[], threshold: number): number[] {
    if (values.length === 0) return []

    const sorted = [...values].sort((a, b) => a - b)
    const filtered: number[] = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      if (Math.abs(sorted[i] - filtered[filtered.length - 1]) / filtered[filtered.length - 1] > threshold) {
        filtered.push(sorted[i])
      }
    }

    return filtered
  }
}

// Export singleton instance
export const technicalAnalysisService = new TechnicalAnalysisService()