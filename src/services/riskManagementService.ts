import type { 
  StopLossOrder,
  TakeProfitOrder,
  RiskRule,
  PositionRisk,
  PortfolioRisk,
  RiskAlert,
  RiskMetrics,
  MarginInfo,
  RiskReport
} from '@/types/risk'
import type { PortfolioPosition } from '@/types/portfolio'

export class RiskManagementService {
  private stopLossOrders: Map<string, StopLossOrder[]> = new Map()
  private takeProfitOrders: Map<string, TakeProfitOrder[]> = new Map()
  private riskRules: RiskRule[] = []
  private alerts: RiskAlert[] = []
  private callbacks: Map<string, Function[]> = new Map()

  constructor() {
    this.initializeDefaultRules()
  }

  /**
   * Initialize default risk management rules
   */
  private initializeDefaultRules() {
    this.riskRules = [
      {
        id: 'max_position_size',
        name: 'Maximum Position Size',
        type: 'position_size',
        enabled: true,
        parameters: {
          maxPercent: 10, // Maximum 10% of portfolio value
          maxAbsolute: 100000 // Maximum $100,000
        },
        priority: 'high',
        action: 'restrict',
        createdAt: Date.now(),
        triggerCount: 0
      },
      {
        id: 'mandatory_stop_loss',
        name: 'Mandatory Stop Loss',
        type: 'stop_loss',
        enabled: true,
        parameters: {
          maxLossPercent: 5, // Maximum 5% loss per position
          timeframe: 'day'
        },
        priority: 'critical',
        action: 'alert',
        createdAt: Date.now(),
        triggerCount: 0
      },
      {
        id: 'portfolio_drawdown',
        name: 'Portfolio Drawdown Limit',
        type: 'drawdown',
        enabled: true,
        parameters: {
          maxDrawdownPercent: 15, // Maximum 15% portfolio drawdown
          timeframe: 'month'
        },
        priority: 'high',
        action: 'restrict',
        createdAt: Date.now(),
        triggerCount: 0
      },
      {
        id: 'concentration_limit',
        name: 'Concentration Risk Limit',
        type: 'concentration',
        enabled: true,
        parameters: {
          maxSectorPercent: 30, // Maximum 30% in any sector
          maxSinglePosition: 20 // Maximum 20% in single position
        },
        priority: 'medium',
        action: 'alert',
        createdAt: Date.now(),
        triggerCount: 0
      },
      {
        id: 'variance_limit',
        name: 'Daily Variance Limit',
        type: 'variance',
        enabled: true,
        parameters: {
          maxDailyVariance: 2 // Maximum 2% daily variance
        },
        priority: 'medium',
        action: 'alert',
        createdAt: Date.now(),
        triggerCount: 0
      }
    ]
  }

  /**
   * Create stop loss order
   */
  createStopLossOrder(order: Omit<StopLossOrder, 'id' | 'createdAt' | 'status'>): StopLossOrder {
    const stopLossOrder: StopLossOrder = {
      ...order,
      id: `sl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      status: 'active'
    }

    if (!this.stopLossOrders.has(order.symbol)) {
      this.stopLossOrders.set(order.symbol, [])
    }
    
    this.stopLossOrders.get(order.symbol)!.push(stopLossOrder)
    
    // Subscribe to price updates for this symbol
    this.subscribeToPriceUpdates(order.symbol)
    
    this.createAlert('stop_loss', 'medium', order.symbol, 
      `Stop loss order created for ${order.symbol} at ${order.triggerPrice}`, stopLossOrder)
    
    return stopLossOrder
  }

  /**
   * Create take profit order
   */
  createTakeProfitOrder(order: Omit<TakeProfitOrder, 'id' | 'createdAt' | 'status'>): TakeProfitOrder {
    const takeProfitOrder: TakeProfitOrder = {
      ...order,
      id: `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      status: 'active'
    }

    if (!this.takeProfitOrders.has(order.symbol)) {
      this.takeProfitOrders.set(order.symbol, [])
    }
    
    this.takeProfitOrders.get(order.symbol)!.push(takeProfitOrder)
    
    // Subscribe to price updates for this symbol
    this.subscribeToPriceUpdates(order.symbol)
    
    this.createAlert('take_profit', 'medium', order.symbol, 
      `Take profit order created for ${order.symbol} at ${order.targetPrice}`, takeProfitOrder)
    
    return takeProfitOrder
  }

  /**
   * Update trailing stop loss
   */
  updateTrailingStopLoss(symbol: string, currentPrice: number): void {
    const orders = this.stopLossOrders.get(symbol)
    if (!orders) return

    orders.forEach(order => {
      if (order.trailing && order.status === 'active') {
        if (!order.highestPrice || currentPrice > order.highestPrice) {
          order.highestPrice = currentPrice
          
          // Calculate new stop price based on trailing percentage
          if (order.trailingPercent) {
            const newStopPrice = currentPrice * (1 - order.trailingPercent / 100)
            order.triggerPrice = newStopPrice
          }
        }
      }
    })
  }

  /**
   * Check and trigger stop loss orders
   */
  checkStopLossOrders(symbol: string, currentPrice: number): StopLossOrder[] {
    const orders = this.stopLossOrders.get(symbol) || []
    const triggeredOrders: StopLossOrder[] = []

    orders.forEach(order => {
      if (order.status === 'active' && currentPrice <= order.triggerPrice) {
        order.status = 'triggered'
        order.triggeredAt = Date.now()
        triggeredOrders.push(order)
        
        this.createAlert('stop_loss', 'high', symbol, 
          `Stop loss triggered for ${symbol} at ${currentPrice}`, order)
        
        this.emit('stopLossTriggered', { order, currentPrice })
      }
    })

    return triggeredOrders
  }

  /**
   * Check and trigger take profit orders
   */
  checkTakeProfitOrders(symbol: string, currentPrice: number): TakeProfitOrder[] {
    const orders = this.takeProfitOrders.get(symbol) || []
    const triggeredOrders: TakeProfitOrder[] = []

    orders.forEach(order => {
      if (order.status === 'active' && currentPrice >= order.targetPrice) {
        order.status = 'triggered'
        order.triggeredAt = Date.now()
        triggeredOrders.push(order)
        
        this.createAlert('take_profit', 'high', symbol, 
          `Take profit triggered for ${symbol} at ${currentPrice}`, order)
        
        this.emit('takeProfitTriggered', { order, currentPrice })
      }
    })

    return triggeredOrders
  }

  /**
   * Cancel stop loss order
   */
  cancelStopLossOrder(orderId: string): boolean {
    for (const [symbol, orders] of this.stopLossOrders.entries()) {
      const index = orders.findIndex(order => order.id === orderId)
      if (index !== -1) {
        orders[index].status = 'cancelled'
        this.createAlert('stop_loss', 'low', symbol, `Stop loss order cancelled`, orders[index])
        return true
      }
    }
    return false
  }

  /**
   * Cancel take profit order
   */
  cancelTakeProfitOrder(orderId: string): boolean {
    for (const [symbol, orders] of this.takeProfitOrders.entries()) {
      const index = orders.findIndex(order => order.id === orderId)
      if (index !== -1) {
        orders[index].status = 'cancelled'
        this.createAlert('take_profit', 'low', symbol, `Take profit order cancelled`, orders[index])
        return true
      }
    }
    return false
  }

  /**
   * Calculate position risk
   */
  calculatePositionRisk(position: PortfolioPosition, currentPrice: number): PositionRisk {
    const positionValue = position.quantity * currentPrice
    const unrealizedPnL = positionValue - position.totalCost
    const unrealizedPnLPercent = position.totalCost > 0 ? (unrealizedPnL / position.totalCost) * 100 : 0
    
    // Find active stop loss and take profit orders
    const stopLossOrders = this.stopLossOrders.get(position.symbol) || []
    const takeProfitOrders = this.takeProfitOrders.get(position.symbol) || []
    
    const activeStopLoss = stopLossOrders.find(order => order.status === 'active')
    const activeTakeProfit = takeProfitOrders.find(order => order.status === 'active')
    
    const stopLossPrice = activeStopLoss?.triggerPrice
    const takeProfitPrice = activeTakeProfit?.targetPrice
    
    // Calculate risk amounts
    const riskAmount = stopLossPrice ? 
      position.quantity * (currentPrice - stopLossPrice) : position.totalCost * 0.1 // Default 10% risk
    
    const riskPercent = positionValue > 0 ? (riskAmount / positionValue) * 100 : 0
    
    const rewardAmount = takeProfitPrice ? 
      position.quantity * (takeProfitPrice - currentPrice) : position.totalCost * 0.2 // Default 20% reward
    
    const rewardPercent = positionValue > 0 ? (rewardAmount / positionValue) * 100 : 0
    
    const riskRewardRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0
    
    // Calculate risk metrics
    const volatility = this.calculatePositionVolatility(position.symbol)
    const beta = this.calculatePositionBeta(position.symbol)
    const var95 = this.calculatePositionVaR(position, currentPrice)
    const concentrationRisk = this.calculateConcentrationRisk(position)
    const liquidityRisk = this.calculateLiquidityRisk(position)
    
    // Determine overall risk level
    const overallRisk = this.calculateOverallRiskLevel({
      riskPercent,
      volatility,
      concentrationRisk,
      liquidityRisk
    })

    return {
      symbol: position.symbol,
      positionSize: position.quantity,
      positionValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      stopLossPrice,
      takeProfitPrice,
      riskAmount,
      riskPercent,
      rewardAmount,
      rewardPercent,
      riskRewardRatio,
      maxDrawdown: 0, // Would need historical data
      volatility,
      beta,
      var95,
      concentrationRisk,
      liquidityRisk,
      overallRisk,
      lastUpdated: Date.now()
    }
  }

  /**
   * Calculate portfolio risk
   */
  calculatePortfolioRisk(positions: PortfolioPosition[], currentPrices: Map<string, number>): PortfolioRisk {
    const totalValue = Array.from(currentPrices.values()).reduce((sum, price, i) => {
      return sum + (positions[i]?.quantity * price || 0)
    }, 0)
    
    const positionRisks = positions.map((position, i) => {
      const currentPrice = currentPrices.get(position.symbol) || position.currentPrice
      return this.calculatePositionRisk(position, currentPrice)
    })
    
    const totalRisk = positionRisks.reduce((sum, risk) => sum + risk.riskAmount, 0)
    const totalRiskPercent = totalValue > 0 ? (totalRisk / totalValue) * 100 : 0
    
    const valueAtRisk95 = this.calculatePortfolioVaR(positions, currentPrices)
    const valueAtRisk99 = valueAtRisk95 * 1.5 // Approximation
    
    const beta = this.calculatePortfolioBeta(positions)
    const correlationRisk = this.calculateCorrelationRisk(positions)
    const concentrationRisk = this.calculatePortfolioConcentrationRisk(positions)
    const liquidityRisk = this.calculatePortfolioLiquidityRisk(positions)
    
    const marketRisk = valueAtRisk95
    const creditRisk = totalValue * 0.02 // 2% credit risk assumption
    const operationalRisk = totalValue * 0.01 // 1% operational risk assumption
    
    const overallRisk = this.calculateOverallRiskLevel({
      riskPercent: totalRiskPercent,
      volatility: valueAtRisk95 / totalValue,
      concentrationRisk,
      liquidityRisk
    })

    return {
      totalValue,
      totalRisk,
      totalRiskPercent,
      maxDrawdown: 0, // Would need historical data
      currentDrawdown: 0, // Would need historical data
      valueAtRisk95,
      valueAtRisk99,
      beta,
      correlationRisk,
      concentrationRisk,
      liquidityRisk,
      marketRisk,
      creditRisk,
      operationalRisk,
      overallRisk,
      riskBudget: totalValue * 0.15, // 15% risk budget
      riskUtilization: totalRiskPercent / 15 * 100, // Percentage of risk budget used
      lastUpdated: Date.now()
    }
  }

  /**
   * Generate risk report
   */
  generateRiskReport(
    portfolioId: string,
    positions: PortfolioPosition[],
    currentPrices: Map<string, number>,
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): RiskReport {
    const portfolioRisk = this.calculatePortfolioRisk(positions, currentPrices)
    const positionRisks = positions.map((position, i) => {
      const currentPrice = currentPrices.get(position.symbol) || position.currentPrice
      return this.calculatePositionRisk(position, currentPrice)
    })
    
    const riskMetrics = this.calculateRiskMetrics(positions, currentPrices)
    const alerts = this.getActiveAlerts()
    const recommendations = this.generateRiskRecommendations(portfolioRisk, positionRisks)
    
    const compliance = this.checkCompliance(portfolioRisk, positionRisks)

    return {
      id: `report_${Date.now()}`,
      portfolioId,
      generatedAt: Date.now(),
      period,
      portfolioRisk,
      positionRisks,
      riskMetrics,
      alerts,
      recommendations,
      compliance
    }
  }

  /**
   * Check risk rules and generate alerts
   */
  checkRiskRules(positions: PortfolioPosition[], currentPrices: Map<string, number>): RiskAlert[] {
    const newAlerts: RiskAlert[] = []
    
    for (const rule of this.riskRules) {
      if (!rule.enabled) continue
      
      const alert = this.evaluateRiskRule(rule, positions, currentPrices)
      if (alert) {
        newAlerts.push(alert)
        rule.lastTriggered = Date.now()
        rule.triggerCount++
      }
    }
    
    this.alerts.push(...newAlerts)
    return newAlerts
  }

  /**
   * Evaluate individual risk rule
   */
  private evaluateRiskRule(
    rule: RiskRule,
    positions: PortfolioPosition[],
    currentPrices: Map<string, number>
  ): RiskAlert | null {
    const totalValue = positions.reduce((sum, position) => {
      const currentPrice = currentPrices.get(position.symbol) || position.currentPrice
      return sum + (position.quantity * currentPrice)
    }, 0)

    switch (rule.type) {
      case 'position_size':
        for (const position of positions) {
          const currentPrice = currentPrices.get(position.symbol) || position.currentPrice
          const positionValue = position.quantity * currentPrice
          const positionPercent = totalValue > 0 ? (positionValue / totalValue) * 100 : 0
          
          if (positionPercent > rule.parameters.maxPercent || positionValue > rule.parameters.maxAbsolute) {
            return this.createAlert('concentration', rule.priority, position.symbol, 
              `Position size for ${position.symbol} exceeds limit: ${positionPercent.toFixed(2)}%`, rule)
          }
        }
        break
        
      case 'stop_loss':
        for (const position of positions) {
          const currentPrice = currentPrices.get(position.symbol) || position.currentPrice
          const unrealizedPnLPercent = position.totalCost > 0 ? 
            ((currentPrice * position.quantity - position.totalCost) / position.totalCost) * 100 : 0
          
          if (unrealizedPnLPercent < -rule.parameters.maxLossPercent) {
            return this.createAlert('stop_loss', rule.priority, position.symbol, 
              `Position ${position.symbol} exceeds stop loss threshold: ${unrealizedPnLPercent.toFixed(2)}%`, rule)
          }
        }
        break
        
      case 'drawdown':
        // Would need historical data to calculate drawdown
        break
        
      case 'concentration':
        const sectorAllocation = this.calculateSectorAllocation(positions, currentPrices)
        for (const [sector, allocation] of sectorAllocation.entries()) {
          if (allocation > rule.parameters.maxSectorPercent) {
            return this.createAlert('concentration', rule.priority, undefined, 
              `Sector concentration for ${sector} exceeds limit: ${allocation.toFixed(2)}%`, rule)
          }
        }
        break
        
      case 'variance':
        // Would need historical data to calculate variance
        break
    }
    
    return null
  }

  /**
   * Calculate risk metrics
   */
  private calculateRiskMetrics(positions: PortfolioPosition[], currentPrices: Map<string, number>): RiskMetrics {
    // Simplified risk metrics calculation
    return {
      sharpeRatio: 1.2,
      sortinoRatio: 1.5,
      calmarRatio: 0.8,
      informationRatio: 0.6,
      treynorRatio: 0.1,
      beta: 1.1,
      alpha: 0.02,
      rSquared: 0.85,
      trackingError: 0.08,
      upCapture: 1.1,
      downCapture: 0.9,
      var95: 0.05,
      var99: 0.08,
      expectedShortfall: 0.06,
      maxDrawdown: 0.12,
      averageDrawdown: 0.05,
      recoveryTime: 30,
      winRate: 0.65,
      profitFactor: 1.8,
      kellyCriterion: 0.15,
      optimalPositionSize: 0.1
    }
  }

  /**
   * Generate risk recommendations
   */
  private generateRiskRecommendations(portfolioRisk: PortfolioRisk, positionRisks: PositionRisk[]): string[] {
    const recommendations: string[] = []
    
    if (portfolioRisk.riskUtilization > 80) {
      recommendations.push('Consider reducing position sizes to stay within risk budget')
    }
    
    if (portfolioRisk.concentrationRisk > 0.3) {
      recommendations.push('Diversify portfolio to reduce concentration risk')
    }
    
    const highRiskPositions = positionRisks.filter(p => p.overallRisk === 'high' || p.overallRisk === 'extreme')
    if (highRiskPositions.length > 0) {
      recommendations.push(`Consider setting stop loss orders for ${highRiskPositions.length} high-risk positions`)
    }
    
    const noStopLossPositions = positionRisks.filter(p => !p.stopLossPrice)
    if (noStopLossPositions.length > 0) {
      recommendations.push(`Set stop loss orders for ${noStopLossPositions.length} positions without protection`)
    }
    
    if (portfolioRisk.liquidityRisk > 0.2) {
      recommendations.push('Consider reducing positions in less liquid securities')
    }
    
    return recommendations
  }

  /**
   * Check compliance
   */
  private checkCompliance(portfolioRisk: PortfolioRisk, positionRisks: PositionRisk[]) {
    return {
      positionSize: portfolioRisk.concentrationRisk < 0.2,
      stopLoss: positionRisks.filter(p => !p.stopLossPrice).length === 0,
      concentration: portfolioRisk.concentrationRisk < 0.3,
      margin: portfolioRisk.totalValue * 0.5 > portfolioRisk.totalRisk, // Simplified margin check
      overall: portfolioRisk.overallRisk !== 'extreme'
    }
  }

  /**
   * Utility methods
   */
  private calculatePositionVolatility(symbol: string): number {
    // Simplified volatility calculation
    return 0.2 // 20% annual volatility
  }

  private calculatePositionBeta(symbol: string): number {
    // Simplified beta calculation
    return 1.0
  }

  private calculatePositionVaR(position: PortfolioPosition, currentPrice: number): number {
    const positionValue = position.quantity * currentPrice
    const volatility = 0.2
    const dailyVolatility = volatility / Math.sqrt(252)
    return positionValue * 1.645 * dailyVolatility // 95% VaR
  }

  private calculatePortfolioVaR(positions: PortfolioPosition[], currentPrices: Map<string, number>): number {
    const totalValue = positions.reduce((sum, position) => {
      const currentPrice = currentPrices.get(position.symbol) || position.currentPrice
      return sum + (position.quantity * currentPrice)
    }, 0)
    
    return totalValue * 0.05 // Simplified 5% portfolio VaR
  }

  private calculateConcentrationRisk(position: PortfolioPosition): number {
    // Simplified concentration risk based on position size
    return Math.min(position.weight / 100, 1) // Convert weight percentage to decimal
  }

  private calculateLiquidityRisk(position: PortfolioPosition): number {
    // Simplified liquidity risk
    return position.totalValue > 100000 ? 0.3 : 0.1
  }

  private calculateOverallRiskLevel(riskFactors: { riskPercent: number; volatility: number; concentrationRisk: number; liquidityRisk: number }): 'low' | 'medium' | 'high' | 'extreme' {
    const score = (riskFactors.riskPercent * 0.3) + 
                  (riskFactors.volatility * 0.3) + 
                  (riskFactors.concentrationRisk * 0.2) + 
                  (riskFactors.liquidityRisk * 0.2)
    
    if (score > 0.8) return 'extreme'
    if (score > 0.6) return 'high'
    if (score > 0.4) return 'medium'
    return 'low'
  }

  private calculatePortfolioBeta(positions: PortfolioPosition[]): number {
    // Simplified portfolio beta calculation
    return 1.0
  }

  private calculateCorrelationRisk(positions: PortfolioPosition[]): number {
    // Simplified correlation risk
    return 0.2
  }

  private calculatePortfolioConcentrationRisk(positions: PortfolioPosition[]): number {
    // Simplified portfolio concentration risk
    return 0.15
  }

  private calculatePortfolioLiquidityRisk(positions: PortfolioPosition[]): number {
    // Simplified portfolio liquidity risk
    return 0.1
  }

  private calculateSectorAllocation(positions: PortfolioPosition[], currentPrices: Map<string, number>): Map<string, number> {
    const sectorMap = new Map<string, number>()
    const totalValue = positions.reduce((sum, position) => {
      const currentPrice = currentPrices.get(position.symbol) || position.currentPrice
      return sum + (position.quantity * currentPrice)
    }, 0)
    
    positions.forEach(position => {
      const currentPrice = currentPrices.get(position.symbol) || position.currentPrice
      const positionValue = position.quantity * currentPrice
      const currentAllocation = sectorMap.get(position.sector) || 0
      sectorMap.set(position.sector, currentAllocation + positionValue)
    })
    
    // Convert to percentages
    sectorMap.forEach((value, sector) => {
      sectorMap.set(sector, (value / totalValue) * 100)
    })
    
    return sectorMap
  }

  private createAlert(type: RiskAlert['type'], severity: RiskAlert['severity'], symbol: string | undefined, message: string, data: any): RiskAlert {
    const alert: RiskAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      symbol,
      message,
      data,
      timestamp: Date.now(),
      acknowledged: false
    }
    
    this.alerts.push(alert)
    this.emit('riskAlert', alert)
    
    return alert
  }

  private subscribeToPriceUpdates(symbol: string) {
    // In a real implementation, this would subscribe to real-time price updates
    console.log(`Subscribed to price updates for ${symbol}`)
  }

  private emit(event: string, data: any) {
    const callbacks = this.callbacks.get(event) || []
    callbacks.forEach(callback => callback(data))
  }

  // Public API
  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  getStopLossOrders(symbol?: string): StopLossOrder[] {
    if (symbol) {
      return this.stopLossOrders.get(symbol) || []
    }
    return Array.from(this.stopLossOrders.values()).flat()
  }

  getTakeProfitOrders(symbol?: string): TakeProfitOrder[] {
    if (symbol) {
      return this.takeProfitOrders.get(symbol) || []
    }
    return Array.from(this.takeProfitOrders.values()).flat()
  }

  getActiveAlerts(): RiskAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged)
  }

  getRiskRules(): RiskRule[] {
    return [...this.riskRules]
  }

  updateRiskRule(ruleId: string, updates: Partial<RiskRule>): boolean {
    const rule = this.riskRules.find(r => r.id === ruleId)
    if (rule) {
      Object.assign(rule, updates)
      return true
    }
    return false
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      return true
    }
    return false
  }
}

// Export singleton instance
export const riskManagementService = new RiskManagementService()