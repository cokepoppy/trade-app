import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  TechnicalAnalysisResult,
  ChartDataPoint,
  IndicatorConfig 
} from '@/types/technical'
import { technicalAnalysisService } from '@/services/technicalAnalysisService'
import { marketService } from '@/services/marketService'

export const useTechnicalStore = defineStore('technical', () => {
  const analysisResults = ref<Map<string, TechnicalAnalysisResult>>(new Map())
  const chartData = ref<Map<string, ChartDataPoint[]>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdate = ref<number>(0)
  
  const defaultConfig = ref<IndicatorConfig>({
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
  })

  const getAnalysisResult = (symbol: string, timeframe: string) => {
    const key = `${symbol}_${timeframe}`
    return analysisResults.value.get(key)
  }

  const getChartData = (symbol: string, timeframe: string) => {
    const key = `${symbol}_${timeframe}`
    return chartData.value.get(key) || []
  }

  const getRSI = (symbol: string, timeframe: string) => {
    const result = getAnalysisResult(symbol, timeframe)
    return result?.rsi
  }

  const getMACD = (symbol: string, timeframe: string) => {
    const result = getAnalysisResult(symbol, timeframe)
    return result?.macd
  }

  const getBollingerBands = (symbol: string, timeframe: string) => {
    const result = getAnalysisResult(symbol, timeframe)
    return result?.bollingerBands
  }

  const getOverallSignal = (symbol: string, timeframe: string) => {
    const result = getAnalysisResult(symbol, timeframe)
    return result?.overallSignal || 'neutral'
  }

  const getSignalStrength = (symbol: string, timeframe: string) => {
    const result = getAnalysisResult(symbol, timeframe)
    return result?.confidence || 0
  }

  const isOverbought = (symbol: string, timeframe: string) => {
    const rsi = getRSI(symbol, timeframe)
    return rsi?.rsi >= (defaultConfig.value.rsi?.overbought || 70)
  }

  const isOversold = (symbol: string, timeframe: string) => {
    const rsi = getRSI(symbol, timeframe)
    return rsi?.rsi <= (defaultConfig.value.rsi?.oversold || 30)
  }

  const isBullishMACD = (symbol: string, timeframe: string) => {
    const macd = getMACD(symbol, timeframe)
    return macd?.signalType === 'bullish'
  }

  const isBearishMACD = (symbol: string, timeframe: string) => {
    const macd = getMACD(symbol, timeframe)
    return macd?.signalType === 'bearish'
  }

  const isBollingerSqueeze = (symbol: string, timeframe: string) => {
    const bb = getBollingerBands(symbol, timeframe)
    return bb?.signal === 'squeeze'
  }

  const analyzeSymbol = async (symbol: string, timeframe: string, config?: Partial<IndicatorConfig>) => {
    try {
      loading.value = true
      error.value = null

      const key = `${symbol}_${timeframe}`
      
      // Get chart data
      const chartResponse = await marketService.getStockKLine({
        code: symbol,
        period: timeframe,
        type: '1d'
      })

      const chartDataPoints: ChartDataPoint[] = chartResponse.data.map((item: any) => ({
        timestamp: item.timestamp || item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }))

      // Store chart data
      chartData.value.set(key, chartDataPoints)

      // Perform technical analysis
      const result = technicalAnalysisService.analyzeTechnicalIndicators(
        symbol,
        chartDataPoints,
        timeframe,
        config || defaultConfig.value
      )

      // Store analysis result
      analysisResults.value.set(key, result)
      lastUpdate.value = Date.now()

      return result

    } catch (err) {
      error.value = err instanceof Error ? err.message : '技术分析失败'
      console.error('Technical analysis error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const batchAnalyze = async (symbols: string[], timeframe: string, config?: Partial<IndicatorConfig>) => {
    try {
      loading.value = true
      error.value = null

      const promises = symbols.map(symbol => 
        analyzeSymbol(symbol, timeframe, config).catch(err => {
          console.error(`Failed to analyze ${symbol}:`, err)
          return null
        })
      )

      const results = await Promise.all(promises)
      return results.filter(result => result !== null)

    } catch (err) {
      error.value = err instanceof Error ? err.message : '批量技术分析失败'
      console.error('Batch technical analysis error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateAnalysis = (symbol: string, timeframe: string, newPrice: number) => {
    const key = `${symbol}_${timeframe}`
    const data = chartData.value.get(key)
    
    if (!data || data.length === 0) return

    // Update the last data point with new price
    const lastPoint = data[data.length - 1]
    const updatedLastPoint = {
      ...lastPoint,
      high: Math.max(lastPoint.high, newPrice),
      low: Math.min(lastPoint.low, newPrice),
      close: newPrice,
      timestamp: Date.now()
    }

    const updatedData = [...data.slice(0, -1), updatedLastPoint]
    chartData.value.set(key, updatedData)

    // Recalculate technical indicators
    try {
      const result = technicalAnalysisService.analyzeTechnicalIndicators(
        symbol,
        updatedData,
        timeframe,
        defaultConfig.value
      )

      analysisResults.value.set(key, result)
      lastUpdate.value = Date.now()
    } catch (err) {
      console.error('Failed to update analysis:', err)
    }
  }

  const calculateSupportResistance = (symbol: string, timeframe: string, lookbackPeriod = 20) => {
    const data = getChartData(symbol, timeframe)
    if (!data || data.length === 0) {
      return { support: [], resistance: [] }
    }

    return technicalAnalysisService.calculateSupportResistance(data, lookbackPeriod)
  }

  const calculateSMA = (symbol: string, timeframe: string, period: number) => {
    const data = getChartData(symbol, timeframe)
    if (!data || data.length === 0) return []

    try {
      return technicalAnalysisService.calculateSMA(data, period)
    } catch (err) {
      console.error('Failed to calculate SMA:', err)
      return []
    }
  }

  const updateConfig = (newConfig: Partial<IndicatorConfig>) => {
    defaultConfig.value = { ...defaultConfig.value, ...newConfig }
  }

  const resetConfig = () => {
    defaultConfig.value = {
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
  }

  const clearAnalysis = (symbol?: string, timeframe?: string) => {
    if (symbol && timeframe) {
      const key = `${symbol}_${timeframe}`
      analysisResults.value.delete(key)
      chartData.value.delete(key)
    } else if (symbol) {
      // Clear all timeframes for a symbol
      const keysToDelete: string[] = []
      analysisResults.value.forEach((_, key) => {
        if (key.startsWith(`${symbol}_`)) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach(key => {
        analysisResults.value.delete(key)
        chartData.value.delete(key)
      })
    } else {
      // Clear all analysis
      analysisResults.value.clear()
      chartData.value.clear()
    }
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    analysisResults.value.clear()
    chartData.value.clear()
    loading.value = false
    error.value = null
    lastUpdate.value = 0
    resetConfig()
  }

  return {
    // State
    analysisResults,
    chartData,
    loading,
    error,
    lastUpdate,
    defaultConfig,
    
    // Computed
    getAnalysisResult,
    getChartData,
    getRSI,
    getMACD,
    getBollingerBands,
    getOverallSignal,
    getSignalStrength,
    isOverbought,
    isOversold,
    isBullishMACD,
    isBearishMACD,
    isBollingerSqueeze,
    
    // Methods
    analyzeSymbol,
    batchAnalyze,
    updateAnalysis,
    calculateSupportResistance,
    calculateSMA,
    updateConfig,
    resetConfig,
    clearAnalysis,
    clearError,
    reset
  }
})