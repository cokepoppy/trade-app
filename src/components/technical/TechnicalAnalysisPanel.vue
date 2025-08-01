<template>
  <div class="technical-analysis-panel">
    <!-- Connection Status -->
    <div class="connection-status" v-if="showConnectionStatus">
      <div 
        :class="['status-indicator', connectionStatus]"
        @click="reconnectWebSocket"
      >
        <span class="status-dot"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>

    <!-- Symbol and Timeframe Selector -->
    <div class="controls-section">
      <div class="symbol-selector">
        <label>股票代码:</label>
        <input 
          v-model="currentSymbol" 
          @change="onSymbolChange"
          placeholder="输入股票代码"
        />
      </div>
      
      <div class="timeframe-selector">
        <label>时间周期:</label>
        <select v-model="currentTimeframe" @change="onTimeframeChange">
          <option value="1m">1分钟</option>
          <option value="5m">5分钟</option>
          <option value="15m">15分钟</option>
          <option value="30m">30分钟</option>
          <option value="1h">1小时</option>
          <option value="4h">4小时</option>
          <option value="1d">1天</option>
          <option value="1w">1周</option>
        </select>
      </div>

      <div class="real-time-toggle">
        <label>
          <input 
            type="checkbox" 
            v-model="realTimeEnabled"
            @change="toggleRealTime"
          />
          实时数据
        </label>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>正在分析技术指标...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-message">{{ error }}</div>
      <button @click="retryAnalysis" class="retry-button">重试</button>
    </div>

    <!-- Technical Indicators Panel -->
    <div v-else-if="analysisResult" class="indicators-panel">
      <!-- Overall Signal -->
      <div class="overall-signal">
        <div class="signal-header">
          <h3>综合信号</h3>
          <div class="confidence-bar">
            <div 
              class="confidence-fill"
              :style="{ width: `${analysisResult.confidence * 100}%` }"
            ></div>
            <span class="confidence-text">{{ Math.round(analysisResult.confidence * 100) }}%</span>
          </div>
        </div>
        <div 
          :class="['signal-value', analysisResult.overallSignal]"
        >
          {{ getSignalText(analysisResult.overallSignal) }}
        </div>
      </div>

      <!-- RSI Indicator -->
      <div v-if="analysisResult.rsi" class="indicator-card">
        <div class="indicator-header">
          <h4>RSI ({{ defaultConfig.rsi?.period }})</h4>
          <div :class="['signal-badge', analysisResult.rsi.signal]">
            {{ getRSISignalText(analysisResult.rsi.signal) }}
          </div>
        </div>
        <div class="indicator-value">
          <span class="value">{{ analysisResult.rsi.rsi.toFixed(2) }}</span>
          <div class="rsi-bar">
            <div 
              class="rsi-fill"
              :style="{ width: `${analysisResult.rsi.rsi}%` }"
            ></div>
          </div>
        </div>
        <div class="indicator-levels">
          <span class="level oversold">超卖 ({{ defaultConfig.rsi?.oversold }})</span>
          <span class="level overbought">超买 ({{ defaultConfig.rsi?.overbought }})</span>
        </div>
      </div>

      <!-- MACD Indicator -->
      <div v-if="analysisResult.macd" class="indicator-card">
        <div class="indicator-header">
          <h4>MACD</h4>
          <div :class="['signal-badge', analysisResult.macd.signalType]">
            {{ getMACDSignalText(analysisResult.macd.signalType) }}
          </div>
        </div>
        <div class="macd-values">
          <div class="macd-line">
            <span class="label">MACD:</span>
            <span class="value" :class="{ positive: analysisResult.macd.macd > 0 }">
              {{ analysisResult.macd.macd.toFixed(4) }}
            </span>
          </div>
          <div class="signal-line">
            <span class="label">Signal:</span>
            <span class="value" :class="{ positive: analysisResult.macd.signal > 0 }">
              {{ analysisResult.macd.signal.toFixed(4) }}
            </span>
          </div>
          <div class="histogram">
            <span class="label">Histogram:</span>
            <span class="value" :class="{ positive: analysisResult.macd.histogram > 0 }">
              {{ analysisResult.macd.histogram.toFixed(4) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Bollinger Bands Indicator -->
      <div v-if="analysisResult.bollingerBands" class="indicator-card">
        <div class="indicator-header">
          <h4>布林带</h4>
          <div :class="['signal-badge', analysisResult.bollingerBands.signal]">
            {{ getBollingerSignalText(analysisResult.bollingerBands.signal) }}
          </div>
        </div>
        <div class="bollinger-values">
          <div class="band upper">
            <span class="label">上轨:</span>
            <span class="value">{{ analysisResult.bollingerBands.upper.toFixed(2) }}</span>
          </div>
          <div class="band middle">
            <span class="label">中轨:</span>
            <span class="value">{{ analysisResult.bollingerBands.middle.toFixed(2) }}</span>
          </div>
          <div class="band lower">
            <span class="label">下轨:</span>
            <span class="value">{{ analysisResult.bollingerBands.lower.toFixed(2) }}</span>
          </div>
          <div class="bandwidth">
            <span class="label">带宽:</span>
            <span class="value">{{ (analysisResult.bollingerBands.bandwidth * 100).toFixed(2) }}%</span>
          </div>
        </div>
      </div>

      <!-- Price Alerts -->
      <div class="price-alerts">
        <h4>价格提醒</h4>
        <div class="alert-controls">
          <input 
            v-model="alertPrice"
            type="number"
            placeholder="目标价格"
            step="0.01"
          />
          <select v-model="alertCondition">
            <option value="above">高于</option>
            <option value="below">低于</option>
            <option value="equals">等于</option>
          </select>
          <button @click="setPriceAlert" :disabled="!alertPrice">
            设置提醒
          </button>
        </div>
        <div v-if="activeAlerts.length > 0" class="active-alerts">
          <div 
            v-for="alert in activeAlerts" 
            :key="alert.id"
            class="alert-item"
          >
            <span class="alert-condition">
              {{ alert.condition === 'above' ? '高于' : alert.condition === 'below' ? '低于' : '等于' }} {{ alert.price }}
            </span>
            <button @click="removeAlert(alert.id)" class="remove-alert">×</button>
          </div>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else class="no-data-state">
      <div class="no-data-icon">📊</div>
      <p>请输入股票代码开始技术分析</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMarketStore } from '@/stores/useMarketStore'
import { useTechnicalStore } from '@/stores/useTechnicalStore'
import type { TechnicalAnalysisResult } from '@/types/technical'

interface PriceAlert {
  id: string
  symbol: string
  price: number
  condition: 'above' | 'below' | 'equals'
  callback: Function
}

const props = defineProps<{
  symbol?: string
  timeframe?: string
  showConnectionStatus?: boolean
}>()

const emit = defineEmits<{
  signalUpdate: [signal: string, confidence: number]
  priceAlert: [symbol: string, price: number, condition: string]
}>()

const marketStore = useMarketStore()
const technicalStore = useTechnicalStore()

const currentSymbol = ref(props.symbol || '000001')
const currentTimeframe = ref(props.timeframe || '1d')
const realTimeEnabled = ref(true)
const alertPrice = ref<number | null>(null)
const alertCondition = ref<'above' | 'below' | 'equals'>('above')
const activeAlerts = ref<PriceAlert[]>([])

const analysisResult = computed(() => 
  technicalStore.getAnalysisResult(currentSymbol.value, currentTimeframe.value)
)

const loading = computed(() => technicalStore.loading)
const error = computed(() => technicalStore.error)
const connectionStatus = computed(() => marketStore.connectionStatus)
const defaultConfig = computed(() => technicalStore.defaultConfig)

const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return '已连接'
    case 'connecting': return '连接中...'
    case 'disconnected': return '未连接'
    case 'error': return '连接错误'
    default: return '未知状态'
  }
})

const onSymbolChange = () => {
  performAnalysis()
}

const onTimeframeChange = () => {
  performAnalysis()
}

const performAnalysis = async () => {
  try {
    await technicalStore.analyzeSymbol(currentSymbol.value, currentTimeframe.value)
    
    if (analysisResult.value) {
      emit('signalUpdate', 
        analysisResult.value.overallSignal, 
        analysisResult.value.confidence
      )
    }
  } catch (err) {
    console.error('Failed to perform analysis:', err)
  }
}

const retryAnalysis = () => {
  technicalStore.clearError()
  performAnalysis()
}

const toggleRealTime = (enabled: boolean) => {
  marketStore.toggleRealTime(enabled)
  if (enabled) {
    subscribeToRealTimeUpdates()
  }
}

const subscribeToRealTimeUpdates = () => {
  marketStore.subscribeToStocks([currentSymbol.value], (update: any) => {
    technicalStore.updateAnalysis(currentSymbol.value, currentTimeframe.value, update.price)
  })
}

const setPriceAlert = () => {
  if (!alertPrice.value) return

  const alertId = `alert_${Date.now()}`
  const removeCallback = marketStore.setPriceAlert(
    currentSymbol.value,
    alertCondition.value,
    alertPrice.value,
    (alertData: any) => {
      emit('priceAlert', alertData.code, alertData.price, alertData.condition)
      
      // Show notification
      showNotification(`价格提醒: ${currentSymbol.value} ${alertCondition.value === 'above' ? '高于' : alertCondition.value === 'below' ? '低于' : '等于'} ${alertPrice.value}`)
    }
  )

  activeAlerts.value.push({
    id: alertId,
    symbol: currentSymbol.value,
    price: alertPrice.value,
    condition: alertCondition.value,
    callback: removeCallback
  })

  alertPrice.value = null
}

const removeAlert = (alertId: string) => {
  const alertIndex = activeAlerts.value.findIndex(alert => alert.id === alertId)
  if (alertIndex !== -1) {
    const alert = activeAlerts.value[alertIndex]
    alert.callback() // Remove the alert from market store
    activeAlerts.value.splice(alertIndex, 1)
  }
}

const reconnectWebSocket = () => {
  marketStore.reconnectWebSocket()
}

const showNotification = (message: string) => {
  // Use uni-app notification system
  if (typeof uni !== 'undefined') {
    uni.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    })
  } else {
    console.log('Notification:', message)
  }
}

const getSignalText = (signal: string) => {
  const signalMap = {
    'strong_buy': '强烈买入',
    'buy': '买入',
    'neutral': '中性',
    'sell': '卖出',
    'strong_sell': '强烈卖出'
  }
  return signalMap[signal as keyof typeof signalMap] || signal
}

const getRSISignalText = (signal: string) => {
  const signalMap = {
    'oversold': '超卖',
    'overbought': '超买',
    'neutral': '中性'
  }
  return signalMap[signal as keyof typeof signalMap] || signal
}

const getMACDSignalText = (signal: string) => {
  const signalMap = {
    'bullish': '看涨',
    'bearish': '看跌',
    'neutral': '中性'
  }
  return signalMap[signal as keyof typeof signalMap] || signal
}

const getBollingerSignalText = (signal: string) => {
  const signalMap = {
    'squeeze': '挤压',
    'expansion': '扩张',
    'normal': '正常'
  }
  return signalMap[signal as keyof typeof signalMap] || signal
}

onMounted(() => {
  if (props.symbol) {
    performAnalysis()
  }
  if (realTimeEnabled.value) {
    subscribeToRealTimeUpdates()
  }
})

onUnmounted(() => {
  // Clean up alerts
  activeAlerts.value.forEach(alert => alert.callback())
})
</script>

<style scoped>
.technical-analysis-panel {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  min-height: 400px;
}

.connection-status {
  margin-bottom: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.status-indicator.connected {
  background: #d4edda;
  color: #155724;
}

.status-indicator.connecting {
  background: #fff3cd;
  color: #856404;
}

.status-indicator.disconnected {
  background: #f8d7da;
  color: #721c24;
}

.status-indicator.error {
  background: #f8d7da;
  color: #721c24;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.controls-section {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.symbol-selector,
.timeframe-selector,
.real-time-toggle {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.symbol-selector input,
.timeframe-selector select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.real-time-toggle {
  justify-content: center;
  align-items: center;
}

.loading-state,
.error-state,
.no-data-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-button {
  padding: 8px 16px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  background: #0056b3;
}

.indicators-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.overall-signal {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.signal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.confidence-bar {
  width: 100px;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #dc3545, #ffc107, #28a745);
  transition: width 0.3s ease;
}

.confidence-text {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: bold;
  color: #333;
}

.signal-value {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  padding: 8px;
  border-radius: 4px;
}

.signal-value.strong_buy {
  color: #28a745;
  background: #d4edda;
}

.signal-value.buy {
  color: #17a2b8;
  background: #d1ecf1;
}

.signal-value.neutral {
  color: #6c757d;
  background: #e2e3e5;
}

.signal-value.sell {
  color: #fd7e14;
  background: #fff3cd;
}

.signal-value.strong_sell {
  color: #dc3545;
  background: #f8d7da;
}

.indicator-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.indicator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.signal-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.signal-badge.oversold {
  background: #d4edda;
  color: #155724;
}

.signal-badge.overbought {
  background: #f8d7da;
  color: #721c24;
}

.signal-badge.neutral {
  background: #e2e3e5;
  color: #383d41;
}

.signal-badge.bullish {
  background: #d4edda;
  color: #155724;
}

.signal-badge.bearish {
  background: #f8d7da;
  color: #721c24;
}

.signal-badge.squeeze {
  background: #fff3cd;
  color: #856404;
}

.signal-badge.expansion {
  background: #d1ecf1;
  color: #0c5460;
}

.indicator-value {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.indicator-value .value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.rsi-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.rsi-fill {
  height: 100%;
  background: linear-gradient(90deg, #dc3545, #ffc107, #28a745);
  transition: width 0.3s ease;
}

.indicator-levels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6c757d;
}

.macd-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.macd-line,
.signal-line,
.histogram {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.macd-line .value,
.signal-line .value,
.histogram .value {
  font-weight: bold;
}

.value.positive {
  color: #28a745;
}

.value.negative {
  color: #dc3545;
}

.bollinger-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.band {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.bandwidth {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e9ecef;
}

.price-alerts {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.alert-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.alert-controls input,
.alert-controls select {
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.alert-controls button {
  padding: 6px 12px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.alert-controls button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.active-alerts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
}

.remove-alert {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-alert:hover {
  background: #f8d7da;
  border-radius: 2px;
}
</style>