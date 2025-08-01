import type { 
  PortfolioPosition,
  PortfolioSummary,
  PerformanceMetrics,
  AssetAllocation,
  SectorAllocation,
  RiskMetrics,
  PortfolioHistory,
  DividendHistory,
  Transaction,
  PortfolioGoal,
  Benchmark,
  PortfolioAnalytics
} from '@/types/portfolio'

export class PortfolioAnalyticsService {
  /**
   * Calculate portfolio summary from positions
   */
  calculatePortfolioSummary(positions: PortfolioPosition[]): PortfolioSummary {
    const totalValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0)
    const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0)
    const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0)
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0
    const realizedPnL = positions.reduce((sum, pos) => sum + pos.realizedPnL, 0)
    
    // Calculate daily P&L (mock data - in real app this would come from daily price changes)
    const dailyPnL = positions.reduce((sum, pos) => {
      const dailyChange = pos.currentPrice * 0.001 // Mock 0.1% daily change
      return sum + (pos.quantity * dailyChange)
    }, 0)
    const dailyPnLPercent = totalValue > 0 ? (dailyPnL / totalValue) * 100 : 0

    return {
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent,
      dailyPnL,
      dailyPnLPercent,
      totalReturn: totalPnL + realizedPnL,
      totalReturnPercent: totalCost > 0 ? ((totalPnL + realizedPnL) / totalCost) * 100 : 0,
      cashBalance: 10000, // Mock cash balance
      marginUsed: 0,
      marginAvailable: 50000,
      positionsCount: positions.length,
      lastUpdated: Date.now()
    }
  }

  /**
   * Calculate comprehensive performance metrics
   */
  calculatePerformanceMetrics(
    history: PortfolioHistory[],
    transactions: Transaction[],
    benchmarkHistory?: PortfolioHistory[]
  ): PerformanceMetrics {
    if (history.length < 2) {
      return this.getEmptyPerformanceMetrics()
    }

    const returns = this.calculateReturns(history)
    const benchmarkReturns = benchmarkHistory ? this.calculateReturns(benchmarkHistory) : []
    
    const totalReturn = returns.reduce((sum, r) => sum + r, 0)
    const totalReturnPercent = ((history[history.length - 1].value / history[0].value) - 1) * 100
    
    const annualizedReturn = this.calculateAnnualizedReturn(totalReturnPercent, history.length)
    const volatility = this.calculateVolatility(returns)
    const sharpeRatio = this.calculateSharpeRatio(returns, 0.02) // Assuming 2% risk-free rate
    const maxDrawdown = this.calculateMaxDrawdown(history)

    // Trade-based metrics
    const trades = this.extractTrades(transactions)
    const winningTrades = trades.filter(t => t.pnl > 0)
    const losingTrades = trades.filter(t => t.pnl < 0)
    
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0
    const profitFactor = this.calculateProfitFactor(winningTrades, losingTrades)
    const averageWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0
    const averageLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0)) / losingTrades.length : 0
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0

    const averageHoldingPeriod = this.calculateAverageHoldingPeriod(trades)

    // Risk-adjusted metrics
    const beta = benchmarkReturns.length > 0 ? this.calculateBeta(returns, benchmarkReturns) : 1
    const alpha = this.calculateAlpha(returns, benchmarkReturns, 0.02)
    const informationRatio = benchmarkReturns.length > 0 ? this.calculateInformationRatio(returns, benchmarkReturns) : 0
    const sortinoRatio = this.calculateSortinoRatio(returns, 0.02)
    const calmarRatio = this.calculateCalmarRatio(annualizedReturn, maxDrawdown)
    const trackingError = benchmarkReturns.length > 0 ? this.calculateTrackingError(returns, benchmarkReturns) : 0

    const { upCapture, downCapture } = this.calculateCaptureRatios(returns, benchmarkReturns)

    return {
      totalReturn,
      totalReturnPercent,
      annualizedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      winRate,
      profitFactor,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageHoldingPeriod,
      beta,
      alpha,
      informationRatio,
      sortinoRatio,
      calmarRatio,
      trackingError,
      upCapture,
      downCapture
    }
  }

  /**
   * Calculate asset allocation
   */
  calculateAssetAllocation(positions: PortfolioPosition[]): AssetAllocation {
    const stocks = positions.reduce((sum, pos) => sum + pos.totalValue, 0)
    const cash = 10000 // Mock cash balance
    const bonds = 0 // Mock bonds
    const alternatives = 0 // Mock alternatives
    const total = stocks + cash + bonds + alternatives

    return {
      stocks,
      bonds,
      cash,
      alternatives,
      total
    }
  }

  /**
   * Calculate sector allocation
   */
  calculateSectorAllocation(positions: PortfolioPosition[]): SectorAllocation[] {
    const sectorMap = new Map<string, { value: number; count: number; dailyChange: number }>()
    
    positions.forEach(pos => {
      const current = sectorMap.get(pos.sector) || { value: 0, count: 0, dailyChange: 0 }
      sectorMap.set(pos.sector, {
        value: current.value + pos.totalValue,
        count: current.count + 1,
        dailyChange: current.dailyChange + (pos.currentPrice * pos.quantity * 0.001) // Mock daily change
      })
    })

    const totalValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0)
    
    return Array.from(sectorMap.entries()).map(([sector, data]) => ({
      sector,
      value: data.value,
      weight: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      positionsCount: data.count,
      dailyChange: data.dailyChange,
      dailyChangePercent: data.value > 0 ? (data.dailyChange / data.value) * 100 : 0
    }))
  }

  /**
   * Calculate risk metrics
   */
  calculateRiskMetrics(
    positions: PortfolioPosition[],
    history: PortfolioHistory[]
  ): RiskMetrics {
    const portfolioVaR = this.calculatePortfolioVaR(positions, history)
    const positionVaR = new Map<string, number>()
    
    positions.forEach(pos => {
      positionVaR.set(pos.symbol, this.calculatePositionVaR(pos, history))
    })

    const beta = this.calculatePortfolioBeta(positions)
    const correlationMatrix = this.calculateCorrelationMatrix(positions, history)
    const concentrationRisk = this.calculateConcentrationRisk(positions)
    const liquidityRisk = this.calculateLiquidityRisk(positions)
    const marketRisk = portfolioVaR
    const creditRisk = this.calculateCreditRisk(positions)
    const operationalRisk = 0.01 // Mock operational risk

    return {
      portfolioVaR,
      positionVaR,
      beta,
      correlationMatrix,
      concentrationRisk,
      liquidityRisk,
      marketRisk,
      creditRisk,
      operationalRisk
    }
  }

  /**
   * Calculate portfolio VaR (Value at Risk)
   */
  private calculatePortfolioVaR(positions: PortfolioPosition[], history: PortfolioHistory[], confidence = 0.95): number {
    if (history.length < 2) return 0

    const returns = this.calculateReturns(history)
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
    const stdDev = Math.sqrt(variance)
    
    // Assuming normal distribution, 95% VaR is approximately 1.645 * stdDev below mean
    const varPercentile = 1 - confidence
    const zScore = this.inverseNormalCDF(varPercentile)
    
    const portfolioValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0)
    return portfolioValue * Math.abs(zScore * stdDev)
  }

  /**
   * Calculate position VaR
   */
  private calculatePositionVaR(position: PortfolioPosition, history: PortfolioHistory[]): number {
    // Simplified position VaR calculation
    const positionValue = position.totalValue
    const volatility = 0.2 // Mock 20% annual volatility
    const dailyVolatility = volatility / Math.sqrt(252)
    
    return positionValue * 1.645 * dailyVolatility // 95% VaR
  }

  /**
   * Calculate portfolio beta
   */
  private calculatePortfolioBeta(positions: PortfolioPosition[]): number {
    // Simplified beta calculation
    const weightedBeta = positions.reduce((sum, pos) => {
      const positionBeta = 1.0 // Mock beta for each position
      const weight = pos.totalValue / positions.reduce((total, p) => total + p.totalValue, 0)
      return sum + (weight * positionBeta)
    }, 0)
    
    return weightedBeta
  }

  /**
   * Calculate correlation matrix
   */
  private calculateCorrelationMatrix(positions: PortfolioPosition[], history: PortfolioHistory[]): Map<string, Map<string, number>> {
    const correlationMatrix = new Map<string, Map<string, number>>()
    
    positions.forEach(pos1 => {
      const correlations = new Map<string, number>()
      positions.forEach(pos2 => {
        if (pos1.symbol === pos2.symbol) {
          correlations.set(pos2.symbol, 1.0)
        } else {
          // Mock correlation calculation
          correlations.set(pos2.symbol, 0.3 + Math.random() * 0.4)
        }
      })
      correlationMatrix.set(pos1.symbol, correlations)
    })
    
    return correlationMatrix
  }

  /**
   * Calculate concentration risk
   */
  private calculateConcentrationRisk(positions: PortfolioPosition[]): number {
    const totalValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0)
    const herfindahlIndex = positions.reduce((sum, pos) => {
      const weight = pos.totalValue / totalValue
      return sum + Math.pow(weight, 2)
    }, 0)
    
    return herfindahlIndex
  }

  /**
   * Calculate liquidity risk
   */
  private calculateLiquidityRisk(positions: PortfolioPosition[]): number {
    // Simplified liquidity risk based on position size and trading volume
    const totalValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0)
    const largePositions = positions.filter(pos => pos.totalValue > totalValue * 0.05) // Positions > 5% of portfolio
    
    return largePositions.length / positions.length
  }

  /**
   * Calculate credit risk
   */
  private calculateCreditRisk(positions: PortfolioPosition[]): number {
    // Simplified credit risk calculation
    return 0.02 // Mock 2% credit risk
  }

  /**
   * Calculate returns from history
   */
  private calculateReturns(history: PortfolioHistory[]): number[] {
    const returns: number[] = []
    for (let i = 1; i < history.length; i++) {
      const returnValue = (history[i].value - history[i - 1].value) / history[i - 1].value
      returns.push(returnValue)
    }
    return returns
  }

  /**
   * Calculate annualized return
   */
  private calculateAnnualizedReturn(totalReturnPercent: number, periods: number): number {
    const years = periods / 252 // Assuming daily data
    return Math.pow(1 + totalReturnPercent / 100, 1 / years) - 1
  }

  /**
   * Calculate volatility (standard deviation of returns)
   */
  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
    return Math.sqrt(variance * 252) // Annualized volatility
  }

  /**
   * Calculate Sharpe ratio
   */
  private calculateSharpeRatio(returns: number[], riskFreeRate: number): number {
    if (returns.length === 0) return 0
    
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const volatility = this.calculateVolatility(returns)
    
    return volatility > 0 ? (meanReturn - riskFreeRate) / volatility : 0
  }

  /**
   * Calculate maximum drawdown
   */
  private calculateMaxDrawdown(history: PortfolioHistory[]): number {
    if (history.length === 0) return 0
    
    let peak = history[0].value
    let maxDrawdown = 0
    
    for (let i = 1; i < history.length; i++) {
      const currentValue = history[i].value
      if (currentValue > peak) {
        peak = currentValue
      }
      
      const drawdown = (peak - currentValue) / peak
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    }
    
    return maxDrawdown
  }

  /**
   * Extract trades from transactions
   */
  private extractTrades(transactions: Transaction[]): Array<{ pnl: number; holdingPeriod: number }> {
    const trades: Array<{ pnl: number; holdingPeriod: number }> = []
    const buyTransactions = transactions.filter(t => t.type === 'buy')
    const sellTransactions = transactions.filter(t => t.type === 'sell')
    
    // Simple matching (in real app, use FIFO/LIFO specific matching)
    buyTransactions.forEach(buy => {
      const matchingSell = sellTransactions.find(sell => 
        sell.symbol === buy.symbol && new Date(sell.date) > new Date(buy.date)
      )
      
      if (matchingSell) {
        const pnl = (matchingSell.price - buy.price) * buy.quantity - matchingSell.commission - buy.commission
        const holdingPeriod = (new Date(matchingSell.date).getTime() - new Date(buy.date).getTime()) / (1000 * 60 * 60 * 24)
        trades.push({ pnl, holdingPeriod })
      }
    })
    
    return trades
  }

  /**
   * Calculate profit factor
   */
  private calculateProfitFactor(winningTrades: Array<{ pnl: number }>, losingTrades: Array<{ pnl: number }>): number {
    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0)
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0))
    
    return totalLosses > 0 ? totalWins / totalLosses : 0
  }

  /**
   * Calculate average holding period
   */
  private calculateAverageHoldingPeriod(trades: Array<{ holdingPeriod: number }>): number {
    if (trades.length === 0) return 0
    return trades.reduce((sum, t) => sum + t.holdingPeriod, 0) / trades.length
  }

  /**
   * Calculate beta against benchmark
   */
  private calculateBeta(returns: number[], benchmarkReturns: number[]): number {
    if (returns.length === 0 || benchmarkReturns.length === 0) return 1
    
    const min_length = Math.min(returns.length, benchmarkReturns.length)
    const portfolioReturns = returns.slice(0, min_length)
    const benchmarkReturnsSlice = benchmarkReturns.slice(0, min_length)
    
    const covariance = this.calculateCovariance(portfolioReturns, benchmarkReturnsSlice)
    const benchmarkVariance = this.calculateVariance(benchmarkReturnsSlice)
    
    return benchmarkVariance > 0 ? covariance / benchmarkVariance : 1
  }

  /**
   * Calculate alpha
   */
  private calculateAlpha(returns: number[], benchmarkReturns: number[], riskFreeRate: number): number {
    if (returns.length === 0 || benchmarkReturns.length === 0) return 0
    
    const portfolioReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const benchmarkReturn = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length
    const beta = this.calculateBeta(returns, benchmarkReturns)
    
    return portfolioReturn - (riskFreeRate + beta * (benchmarkReturn - riskFreeRate))
  }

  /**
   * Calculate information ratio
   */
  private calculateInformationRatio(returns: number[], benchmarkReturns: number[]): number {
    if (returns.length === 0 || benchmarkReturns.length === 0) return 0
    
    const excessReturns = returns.map((r, i) => r - benchmarkReturns[i])
    const meanExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length
    const trackingError = this.calculateTrackingError(returns, benchmarkReturns)
    
    return trackingError > 0 ? meanExcessReturn / trackingError : 0
  }

  /**
   * Calculate Sortino ratio
   */
  private calculateSortinoRatio(returns: number[], riskFreeRate: number): number {
    if (returns.length === 0) return 0
    
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const negativeReturns = returns.filter(r => r < riskFreeRate)
    
    if (negativeReturns.length === 0) return Infinity
    
    const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r - riskFreeRate, 2), 0) / negativeReturns.length
    const downsideDeviation = Math.sqrt(downsideVariance * 252)
    
    return downsideDeviation > 0 ? (meanReturn - riskFreeRate) / downsideDeviation : 0
  }

  /**
   * Calculate Calmar ratio
   */
  private calculateCalmarRatio(annualizedReturn: number, maxDrawdown: number): number {
    return maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0
  }

  /**
   * Calculate tracking error
   */
  private calculateTrackingError(returns: number[], benchmarkReturns: number[]): number {
    if (returns.length === 0 || benchmarkReturns.length === 0) return 0
    
    const excessReturns = returns.map((r, i) => r - benchmarkReturns[i])
    const meanExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length
    const variance = excessReturns.reduce((sum, r) => sum + Math.pow(r - meanExcessReturn, 2), 0) / excessReturns.length
    
    return Math.sqrt(variance * 252) // Annualized tracking error
  }

  /**
   * Calculate capture ratios
   */
  private calculateCaptureRatios(returns: number[], benchmarkReturns: number[]): { upCapture: number; downCapture: number } {
    if (returns.length === 0 || benchmarkReturns.length === 0) return { upCapture: 0, downCapture: 0 }
    
    const min_length = Math.min(returns.length, benchmarkReturns.length)
    const portfolioReturns = returns.slice(0, min_length)
    const benchmarkReturnsSlice = benchmarkReturns.slice(0, min_length)
    
    let upMarketPortfolioReturn = 0
    let upMarketBenchmarkReturn = 0
    let downMarketPortfolioReturn = 0
    let downMarketBenchmarkReturn = 0
    
    for (let i = 0; i < min_length; i++) {
      if (benchmarkReturnsSlice[i] > 0) {
        upMarketPortfolioReturn += portfolioReturns[i]
        upMarketBenchmarkReturn += benchmarkReturnsSlice[i]
      } else if (benchmarkReturnsSlice[i] < 0) {
        downMarketPortfolioReturn += portfolioReturns[i]
        downMarketBenchmarkReturn += benchmarkReturnsSlice[i]
      }
    }
    
    const upCapture = upMarketBenchmarkReturn > 0 ? (upMarketPortfolioReturn / upMarketBenchmarkReturn) * 100 : 0
    const downCapture = downMarketBenchmarkReturn < 0 ? (downMarketPortfolioReturn / Math.abs(downMarketBenchmarkReturn)) * 100 : 0
    
    return { upCapture, downCapture }
  }

  /**
   * Utility functions
   */
  private calculateCovariance(x: number[], y: number[]): number {
    const n = x.length
    const meanX = x.reduce((sum, val) => sum + val, 0) / n
    const meanY = y.reduce((sum, val) => sum + val, 0) / n
    
    return x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0) / n
  }

  private calculateVariance(values: number[]): number {
    const n = values.length
    const mean = values.reduce((sum, val) => sum + val, 0) / n
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
  }

  private inverseNormalCDF(p: number): number {
    // Approximation of inverse normal CDF
    return Math.sqrt(2) * this.inverseErrorFunction(2 * p - 1)
  }

  private inverseErrorFunction(x: number): number {
    // Approximation of inverse error function
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911
    
    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)
    
    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
    
    return sign * y
  }

  private getEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      totalReturn: 0,
      totalReturnPercent: 0,
      annualizedReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      winRate: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      averageHoldingPeriod: 0,
      beta: 1,
      alpha: 0,
      informationRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      trackingError: 0,
      upCapture: 0,
      downCapture: 0
    }
  }

  /**
   * Generate comprehensive portfolio analytics
   */
  generatePortfolioAnalytics(
    positions: PortfolioPosition[],
    history: PortfolioHistory[],
    transactions: Transaction[],
    benchmarkHistory?: PortfolioHistory[]
  ): PortfolioAnalytics {
    const summary = this.calculatePortfolioSummary(positions)
    const performance = this.calculatePerformanceMetrics(history, transactions, benchmarkHistory)
    const assetAllocation = this.calculateAssetAllocation(positions)
    const sectorAllocation = this.calculateSectorAllocation(positions)
    const risk = this.calculateRiskMetrics(positions, history)

    return {
      summary,
      performance,
      assetAllocation,
      sectorAllocation,
      risk,
      history,
      dividends: [], // Mock empty dividends
      transactions,
      goals: [], // Mock empty goals
      benchmarks: benchmarkHistory ? [{
        name: 'Market Index',
        symbol: 'INDEX',
        values: benchmarkHistory
      }] : [],
      positions,
      lastUpdated: Date.now()
    }
  }
}

// Export singleton instance
export const portfolioAnalyticsService = new PortfolioAnalyticsService()