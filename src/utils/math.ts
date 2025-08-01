export const add = (a: number, b: number, precision = 2): number => {
  const result = a + b
  return Math.round(result * Math.pow(10, precision)) / Math.pow(10, precision)
}

export const subtract = (a: number, b: number, precision = 2): number => {
  const result = a - b
  return Math.round(result * Math.pow(10, precision)) / Math.pow(10, precision)
}

export const multiply = (a: number, b: number, precision = 2): number => {
  const result = a * b
  return Math.round(result * Math.pow(10, precision)) / Math.pow(10, precision)
}

export const divide = (a: number, b: number, precision = 2): number => {
  if (b === 0) return 0
  const result = a / b
  return Math.round(result * Math.pow(10, precision)) / Math.pow(10, precision)
}

export const calculateChangePercent = (current: number, previous: number): number => {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export const calculateChange = (current: number, previous: number): number => {
  return current - previous
}

export const calculateProfit = (currentPrice: number, buyPrice: number, volume: number): number => {
  return (currentPrice - buyPrice) * volume
}

export const calculateProfitPercent = (currentPrice: number, buyPrice: number): number => {
  if (buyPrice === 0) return 0
  return ((currentPrice - buyPrice) / buyPrice) * 100
}

export const calculateTotalAmount = (price: number, volume: number): number => {
  return price * volume
}

export const calculateFee = (amount: number, feeRate = 0.0003): number => {
  return amount * feeRate
}

export const calculateNetAmount = (amount: number, fee: number): number => {
  return amount - fee
}

export const calculateMA = (prices: number[], period: number): number[] => {
  const result: number[] = []
  
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((acc, price) => acc + price, 0)
    result.push(sum / period)
  }
  
  return result
}

export const calculateEMA = (prices: number[], period: number): number[] => {
  const result: number[] = []
  const multiplier = 2 / (period + 1)
  
  if (prices.length === 0) return result
  
  result.push(prices[0])
  
  for (let i = 1; i < prices.length; i++) {
    const ema = (prices[i] - result[i - 1]) * multiplier + result[i - 1]
    result.push(ema)
  }
  
  return result
}

export const calculateRSI = (prices: number[], period = 14): number[] => {
  const result: number[] = []
  const changes: number[] = []
  
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1])
  }
  
  for (let i = period - 1; i < changes.length; i++) {
    const gains = changes.slice(i - period + 1, i + 1).filter(change => change > 0)
    const losses = changes.slice(i - period + 1, i + 1).filter(change => change < 0).map(loss => Math.abs(loss))
    
    const avgGain = gains.length > 0 ? gains.reduce((sum, gain) => sum + gain, 0) / period : 0
    const avgLoss = losses.length > 0 ? losses.reduce((sum, loss) => sum + loss, 0) / period : 0
    
    if (avgLoss === 0) {
      result.push(100)
    } else {
      const rs = avgGain / avgLoss
      const rsi = 100 - (100 / (1 + rs))
      result.push(rsi)
    }
  }
  
  return result
}

export const calculateMACD = (prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
  macd: number[]
  signal: number[]
  histogram: number[]
} => {
  const fastEMA = calculateEMA(prices, fastPeriod)
  const slowEMA = calculateEMA(prices, slowPeriod)
  
  const macd: number[] = []
  for (let i = 0; i < fastEMA.length && i < slowEMA.length; i++) {
    macd.push(fastEMA[i] - slowEMA[i])
  }
  
  const signal = calculateEMA(macd, signalPeriod)
  
  const histogram: number[] = []
  for (let i = 0; i < macd.length && i < signal.length; i++) {
    histogram.push(macd[i] - signal[i])
  }
  
  return { macd, signal, histogram }
}

export const calculateBollingerBands = (prices: number[], period = 20, stdDev = 2): {
  upper: number[]
  middle: number[]
  lower: number[]
} => {
  const middle = calculateMA(prices, period)
  const upper: number[] = []
  const lower: number[] = []
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1)
    const mean = slice.reduce((sum, price) => sum + price, 0) / period
    
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period
    const standardDeviation = Math.sqrt(variance)
    
    upper.push(mean + (standardDeviation * stdDev))
    lower.push(mean - (standardDeviation * stdDev))
  }
  
  return { upper, middle, lower }
}

export const calculateVolatility = (prices: number[], period = 20): number[] => {
  const result: number[] = []
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1)
    const mean = slice.reduce((sum, price) => sum + price, 0) / period
    
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period
    const standardDeviation = Math.sqrt(variance)
    
    result.push(standardDeviation)
  }
  
  return result
}

export const round = (num: number, precision = 2): number => {
  const factor = Math.pow(10, precision)
  return Math.round(num * factor) / factor
}

export const floor = (num: number, precision = 2): number => {
  const factor = Math.pow(10, precision)
  return Math.floor(num * factor) / factor
}

export const ceil = (num: number, precision = 2): number => {
  const factor = Math.pow(10, precision)
  return Math.ceil(num * factor) / factor
}

export const clamp = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max)
}

export const normalize = (num: number, min: number, max: number): number => {
  if (max === min) return 0
  return (num - min) / (max - min)
}

export const denormalize = (normalized: number, min: number, max: number): number => {
  return normalized * (max - min) + min
}

export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

export const calculateMax = (numbers: number[]): number => {
  if (numbers.length === 0) return 0
  return Math.max(...numbers)
}

export const calculateMin = (numbers: number[]): number => {
  if (numbers.length === 0) return 0
  return Math.min(...numbers)
}

export const calculateSum = (numbers: number[]): number => {
  return numbers.reduce((sum, num) => sum + num, 0)
}

export const calculateStandardDeviation = (numbers: number[]): number => {
  if (numbers.length === 0) return 0
  
  const mean = calculateAverage(numbers)
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length
  
  return Math.sqrt(variance)
}

export const calculateMedian = (numbers: number[]): number => {
  if (numbers.length === 0) return 0
  
  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid]
}