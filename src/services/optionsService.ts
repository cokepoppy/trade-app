import type { 
  OptionContract, 
  OptionChain, 
  OptionGreeks, 
  OptionPricingParams,
  VolatilitySurface,
  OptionStrategy,
  OptionStrategyLeg,
  OptionSpread
} from '@/types/options'

export class OptionsService {
  private readonly DAYS_PER_YEAR = 365
  private readonly SQRT_2_PI = Math.sqrt(2 * Math.PI)
  private readonly EPSILON = 1e-10

  /**
   * Calculate option price using Black-Scholes model
   */
  calculateOptionPrice(params: OptionPricingParams): number {
    const { underlyingPrice, strikePrice, timeToExpiration, riskFreeRate, dividendYield, volatility, optionType } = params
    
    if (timeToExpiration <= 0) {
      return this.calculateIntrinsicValue(underlyingPrice, strikePrice, optionType)
    }

    const d1 = this.calculateD1(underlyingPrice, strikePrice, timeToExpiration, riskFreeRate, dividendYield, volatility)
    const d2 = d1 - volatility * Math.sqrt(timeToExpiration)
    
    if (optionType === 'call') {
      return underlyingPrice * Math.exp(-dividendYield * timeToExpiration) * this.normalCDF(d1) - 
             strikePrice * Math.exp(-riskFreeRate * timeToExpiration) * this.normalCDF(d2)
    } else {
      return strikePrice * Math.exp(-riskFreeRate * timeToExpiration) * this.normalCDF(-d2) - 
             underlyingPrice * Math.exp(-dividendYield * timeToExpiration) * this.normalCDF(-d1)
    }
  }

  /**
   * Calculate option Greeks
   */
  calculateGreeks(params: OptionPricingParams): OptionGreeks {
    const { underlyingPrice, strikePrice, timeToExpiration, riskFreeRate, dividendYield, volatility, optionType } = params
    
    if (timeToExpiration <= 0) {
      return {
        delta: optionType === 'call' ? 1 : -1,
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
        impliedVolatility: volatility
      }
    }

    const d1 = this.calculateD1(underlyingPrice, strikePrice, timeToExpiration, riskFreeRate, dividendYield, volatility)
    const d2 = d1 - volatility * Math.sqrt(timeToExpiration)
    
    const sqrtT = Math.sqrt(timeToExpiration)
    const discountFactor = Math.exp(-riskFreeRate * timeToExpiration)
    const dividendDiscount = Math.exp(-dividendYield * timeToExpiration)
    
    // Delta
    let delta: number
    if (optionType === 'call') {
      delta = dividendDiscount * this.normalCDF(d1)
    } else {
      delta = -dividendDiscount * this.normalCDF(-d1)
    }
    
    // Gamma (same for calls and puts)
    const gamma = (dividendDiscount * this.normalPDF(d1)) / (underlyingPrice * volatility * sqrtT)
    
    // Theta
    let theta: number
    const theta1 = -(underlyingPrice * dividendDiscount * this.normalPDF(d1) * volatility) / (2 * sqrtT)
    const theta2 = riskFreeRate * strikePrice * discountFactor * this.normalCDF(d2)
    const theta3 = dividendYield * underlyingPrice * dividendDiscount * this.normalCDF(d1)
    
    if (optionType === 'call') {
      theta = (theta1 - theta2 + theta3) / this.DAYS_PER_YEAR
    } else {
      theta = (theta1 + theta2 - theta3) / this.DAYS_PER_YEAR
    }
    
    // Vega (same for calls and puts, converted to percentage points)
    const vega = (underlyingPrice * dividendDiscount * this.normalPDF(d1) * sqrtT) / 100
    
    // Rho
    let rho: number
    if (optionType === 'call') {
      rho = (strikePrice * timeToExpiration * discountFactor * this.normalCDF(d2)) / 100
    } else {
      rho = -(strikePrice * timeToExpiration * discountFactor * this.normalCDF(-d2)) / 100
    }
    
    return {
      delta,
      gamma,
      theta,
      vega,
      rho,
      impliedVolatility: volatility
    }
  }

  /**
   * Calculate implied volatility using Newton-Raphson method
   */
  calculateImpliedVolatility(
    marketPrice: number,
    underlyingPrice: number,
    strikePrice: number,
    timeToExpiration: number,
    riskFreeRate: number,
    dividendYield: number,
    optionType: 'call' | 'put',
    maxIterations = 100,
    tolerance = 1e-6
  ): number {
    let volatility = 0.3 // Initial guess
    let price: number
    let vega: number
    
    for (let i = 0; i < maxIterations; i++) {
      const params: OptionPricingParams = {
        underlyingPrice,
        strikePrice,
        timeToExpiration,
        riskFreeRate,
        dividendYield,
        volatility,
        optionType
      }
      
      price = this.calculateOptionPrice(params)
      const greeks = this.calculateGreeks(params)
      vega = greeks.vega * 100 // Convert back from percentage points
      
      const diff = price - marketPrice
      
      if (Math.abs(diff) < tolerance) {
        return volatility
      }
      
      if (Math.abs(vega) < this.EPSILON) {
        break
      }
      
      volatility = volatility - diff / vega
      
      if (volatility <= 0) {
        volatility = 0.01
      }
    }
    
    return volatility
  }

  /**
   * Generate option chain
   */
  generateOptionChain(
    symbol: string,
    underlyingPrice: number,
    expirationDates: string[],
    strikes: number[],
    volatility: number,
    riskFreeRate = 0.02,
    dividendYield = 0.01
  ): OptionChain {
    const calls: OptionContract[] = []
    const puts: OptionContract[] = []
    
    const now = new Date()
    
    for (const expirationDate of expirationDates) {
      const expiration = new Date(expirationDate)
      const daysToExpiration = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const timeToExpiration = daysToExpiration / this.DAYS_PER_YEAR
      
      for (const strikePrice of strikes) {
        // Call option
        const callParams: OptionPricingParams = {
          underlyingPrice,
          strikePrice,
          timeToExpiration,
          riskFreeRate,
          dividendYield,
          volatility,
          optionType: 'call'
        }
        
        const callPrice = this.calculateOptionPrice(callParams)
        const callGreeks = this.calculateGreeks(callParams)
        const callIntrinsicValue = this.calculateIntrinsicValue(underlyingPrice, strikePrice, 'call')
        
        const callContract: OptionContract = {
          id: `${symbol}_C_${expirationDate}_${strikePrice}`,
          symbol: `${symbol}${expirationDate.replace(/-/g, '')}C${strikePrice}`,
          underlyingSymbol: symbol,
          type: 'call',
          strikePrice,
          expirationDate,
          daysToExpiration,
          lastPrice: callPrice,
          bid: callPrice * 0.98,
          ask: callPrice * 1.02,
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          impliedVolatility: volatility,
          delta: callGreeks.delta,
          gamma: callGreeks.gamma,
          theta: callGreeks.theta,
          vega: callGreeks.vega,
          rho: callGreeks.rho,
          inTheMoney: underlyingPrice > strikePrice,
          intrinsicValue: callIntrinsicValue,
          timeValue: callPrice - callIntrinsicValue,
          lastUpdated: Date.now()
        }
        
        calls.push(callContract)
        
        // Put option
        const putParams: OptionPricingParams = {
          underlyingPrice,
          strikePrice,
          timeToExpiration,
          riskFreeRate,
          dividendYield,
          volatility,
          optionType: 'put'
        }
        
        const putPrice = this.calculateOptionPrice(putParams)
        const putGreeks = this.calculateGreeks(putParams)
        const putIntrinsicValue = this.calculateIntrinsicValue(underlyingPrice, strikePrice, 'put')
        
        const putContract: OptionContract = {
          id: `${symbol}_P_${expirationDate}_${strikePrice}`,
          symbol: `${symbol}${expirationDate.replace(/-/g, '')}P${strikePrice}`,
          underlyingSymbol: symbol,
          type: 'put',
          strikePrice,
          expirationDate,
          daysToExpiration,
          lastPrice: putPrice,
          bid: putPrice * 0.98,
          ask: putPrice * 1.02,
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          impliedVolatility: volatility,
          delta: putGreeks.delta,
          gamma: putGreeks.gamma,
          theta: putGreeks.theta,
          vega: putGreeks.vega,
          rho: putGreeks.rho,
          inTheMoney: underlyingPrice < strikePrice,
          intrinsicValue: putIntrinsicValue,
          timeValue: putPrice - putIntrinsicValue,
          lastUpdated: Date.now()
        }
        
        puts.push(putContract)
      }
    }
    
    return {
      symbol,
      expirationDates,
      strikes,
      calls,
      puts,
      lastUpdated: Date.now()
    }
  }

  /**
   * Calculate strategy Greeks
   */
  calculateStrategyGreeks(legs: OptionStrategyLeg[]): OptionGreeks {
    let totalDelta = 0
    let totalGamma = 0
    let totalTheta = 0
    let totalVega = 0
    let totalRho = 0
    let totalIV = 0
    let totalContracts = 0
    
    for (const leg of legs) {
      const multiplier = leg.action === 'buy' ? 1 : -1
      const quantity = leg.quantity * leg.ratio
      
      totalDelta += leg.contract.delta * multiplier * quantity
      totalGamma += leg.contract.gamma * multiplier * quantity
      totalTheta += leg.contract.theta * multiplier * quantity
      totalVega += leg.contract.vega * multiplier * quantity
      totalRho += leg.contract.rho * multiplier * quantity
      totalIV += leg.contract.impliedVolatility * quantity
      totalContracts += quantity
    }
    
    return {
      delta: totalDelta,
      gamma: totalGamma,
      theta: totalTheta,
      vega: totalVega,
      rho: totalRho,
      impliedVolatility: totalContracts > 0 ? totalIV / totalContracts : 0
    }
  }

  /**
   * Create common option strategies
   */
  createStrategy(
    type: OptionStrategy['type'],
    underlyingSymbol: string,
    strikes: number[],
    expirationDate: string,
    currentPrice: number,
    volatility: number
  ): OptionStrategy {
    const legs: OptionStrategyLeg[] = []
    let name = ''
    let description = ''
    let maxProfit = 0
    let maxLoss = 0
    let breakEvenPoints: number[] = []
    let greeks: OptionGreeks = { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0, impliedVolatility: 0 }
    
    switch (type) {
      case 'straddle':
        name = 'Straddle'
        description = 'Long call and put at same strike'
        const straddleStrike = strikes[0] || currentPrice
        
        // Create legs
        const straddleCall = this.createOptionContract(underlyingSymbol, 'call', straddleStrike, expirationDate, currentPrice, volatility)
        const straddlePut = this.createOptionContract(underlyingSymbol, 'put', straddleStrike, expirationDate, currentPrice, volatility)
        
        legs.push(
          { id: '1', contract: straddleCall, action: 'buy', quantity: 1, ratio: 1 },
          { id: '2', contract: straddlePut, action: 'buy', quantity: 1, ratio: 1 }
        )
        
        const straddleCost = straddleCall.lastPrice + straddlePut.lastPrice
        maxProfit = Infinity
        maxLoss = straddleCost
        breakEvenPoints = [straddleStrike - straddleCost, straddleStrike + straddleCost]
        greeks = this.calculateStrategyGreeks(legs)
        break
        
      case 'strangle':
        name = 'Strangle'
        description = 'Long OTM call and put'
        const [putStrike, callStrike] = strikes
        
        // Create legs
        const strangleCall = this.createOptionContract(underlyingSymbol, 'call', callStrike, expirationDate, currentPrice, volatility)
        const stranglePut = this.createOptionContract(underlyingSymbol, 'put', putStrike, expirationDate, currentPrice, volatility)
        
        legs.push(
          { id: '1', contract: strangleCall, action: 'buy', quantity: 1, ratio: 1 },
          { id: '2', contract: stranglePut, action: 'buy', quantity: 1, ratio: 1 }
        )
        
        const strangleCost = strangleCall.lastPrice + stranglePut.lastPrice
        maxProfit = Infinity
        maxLoss = strangleCost
        breakEvenPoints = [putStrike - strangleCost, callStrike + strangleCost]
        greeks = this.calculateStrategyGreeks(legs)
        break
        
      case 'butterfly':
        name = 'Butterfly Spread'
        description = 'Long one low strike, short two middle strikes, long one high strike'
        const [lowStrike, middleStrike, highStrike] = strikes
        
        // Create legs
        const butterflyLowCall = this.createOptionContract(underlyingSymbol, 'call', lowStrike, expirationDate, currentPrice, volatility)
        const butterflyMiddleCall = this.createOptionContract(underlyingSymbol, 'call', middleStrike, expirationDate, currentPrice, volatility)
        const butterflyHighCall = this.createOptionContract(underlyingSymbol, 'call', highStrike, expirationDate, currentPrice, volatility)
        
        legs.push(
          { id: '1', contract: butterflyLowCall, action: 'buy', quantity: 1, ratio: 1 },
          { id: '2', contract: butterflyMiddleCall, action: 'sell', quantity: 2, ratio: 1 },
          { id: '3', contract: butterflyHighCall, action: 'buy', quantity: 1, ratio: 1 }
        )
        
        const butterflyCost = butterflyLowCall.lastPrice - 2 * butterflyMiddleCall.lastPrice + butterflyHighCall.lastPrice
        maxProfit = highStrike - lowStrike - 2 * butterflyCost
        maxLoss = butterflyCost
        breakEvenPoints = [lowStrike + butterflyCost, highStrike - butterflyCost]
        greeks = this.calculateStrategyGreeks(legs)
        break
    }
    
    const probabilityOfProfit = this.calculateProbabilityOfProfit(breakEvenPoints, currentPrice, volatility, this.getDaysToExpiration(expirationDate))
    const riskRewardRatio = maxLoss > 0 ? maxProfit / maxLoss : 0
    
    return {
      id: `strategy_${Date.now()}`,
      name,
      type,
      description,
      legs,
      maxProfit,
      maxLoss,
      breakEvenPoints,
      probabilityOfProfit,
      riskRewardRatio,
      greeks,
      lastUpdated: Date.now()
    }
  }

  /**
   * Calculate probability of profit
   */
  private calculateProbabilityOfProfit(
    breakEvenPoints: number[],
    currentPrice: number,
    volatility: number,
    daysToExpiration: number
  ): number {
    if (breakEvenPoints.length === 0) return 0
    
    const timeToExpiration = daysToExpiration / this.DAYS_PER_YEAR
    const standardDeviation = volatility * Math.sqrt(timeToExpiration)
    
    // Calculate probability of price being above/below break-even points
    let probability = 0
    
    for (const breakEven of breakEvenPoints) {
      const zScore = (breakEven - currentPrice) / (currentPrice * standardDeviation)
      const prob = 1 - this.normalCDF(zScore)
      probability += prob
    }
    
    return Math.min(probability / breakEvenPoints.length, 1)
  }

  /**
   * Helper methods
   */
  private calculateD1(
    underlyingPrice: number,
    strikePrice: number,
    timeToExpiration: number,
    riskFreeRate: number,
    dividendYield: number,
    volatility: number
  ): number {
    return (Math.log(underlyingPrice / strikePrice) + 
            (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiration) / 
           (volatility * Math.sqrt(timeToExpiration))
  }

  private calculateIntrinsicValue(underlyingPrice: number, strikePrice: number, optionType: 'call' | 'put'): number {
    if (optionType === 'call') {
      return Math.max(0, underlyingPrice - strikePrice)
    } else {
      return Math.max(0, strikePrice - underlyingPrice)
    }
  }

  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)))
  }

  private normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / this.SQRT_2_PI
  }

  private erf(x: number): number {
    // Approximation of error function
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

  private createOptionContract(
    symbol: string,
    type: 'call' | 'put',
    strikePrice: number,
    expirationDate: string,
    underlyingPrice: number,
    volatility: number,
    riskFreeRate = 0.02,
    dividendYield = 0.01
  ): OptionContract {
    const daysToExpiration = this.getDaysToExpiration(expirationDate)
    const timeToExpiration = daysToExpiration / this.DAYS_PER_YEAR
    
    const params: OptionPricingParams = {
      underlyingPrice,
      strikePrice,
      timeToExpiration,
      riskFreeRate,
      dividendYield,
      volatility,
      optionType: type
    }
    
    const price = this.calculateOptionPrice(params)
    const greeks = this.calculateGreeks(params)
    const intrinsicValue = this.calculateIntrinsicValue(underlyingPrice, strikePrice, type)
    
    return {
      id: `${symbol}_${type}_${expirationDate}_${strikePrice}`,
      symbol: `${symbol}${expirationDate.replace(/-/g, '')}${type.charAt(0).toUpperCase()}${strikePrice}`,
      underlyingSymbol: symbol,
      type,
      strikePrice,
      expirationDate,
      daysToExpiration,
      lastPrice: price,
      bid: price * 0.98,
      ask: price * 1.02,
      volume: Math.floor(Math.random() * 1000),
      openInterest: Math.floor(Math.random() * 5000),
      impliedVolatility: volatility,
      delta: greeks.delta,
      gamma: greeks.gamma,
      theta: greeks.theta,
      vega: greeks.vega,
      rho: greeks.rho,
      inTheMoney: type === 'call' ? underlyingPrice > strikePrice : underlyingPrice < strikePrice,
      intrinsicValue,
      timeValue: price - intrinsicValue,
      lastUpdated: Date.now()
    }
  }

  private getDaysToExpiration(expirationDate: string): number {
    const now = new Date()
    const expiration = new Date(expirationDate)
    return Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }
}

// Export singleton instance
export const optionsService = new OptionsService()