<template>
  <div class="risk-management-panel">
    <!-- Portfolio Overview -->
    <div class="portfolio-overview">
      <div class="risk-summary">
        <div class="risk-metric">
          <div class="metric-label">总风险</div>
          <div class="metric-value" :class="riskLevelClass">
            {{ formatCurrency(portfolioRisk.totalRisk) }}
            <span class="metric-percent">({{ portfolioRisk.totalRiskPercent.toFixed(2) }}%)</span>
          </div>
        </div>
        <div class="risk-metric">
          <div class="metric-label">VaR (95%)</div>
          <div class="metric-value warning">
            {{ formatCurrency(portfolioRisk.valueAtRisk95) }}
          </div>
        </div>
        <div class="risk-metric">
          <div class="metric-label">最大回撤</div>
          <div class="metric-value" :class="drawdownClass">
            {{ (portfolioRisk.maxDrawdown * 100).toFixed(2) }}%
          </div>
        </div>
        <div class="risk-metric">
          <div class="metric-label">风险利用率</div>
          <div class="metric-value">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :class="riskUtilizationClass"
                :style="{ width: `${Math.min(portfolioRisk.riskUtilization, 100)}%` }"
              ></div>
            </div>
            <span class="progress-text">{{ portfolioRisk.riskUtilization.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Risk Controls -->
    <div class="risk-controls">
      <div class="control-section">
        <h3>风险管理工具</h3>
        <div class="control-buttons">
          <button @click="showStopLossModal = true" class="control-btn">
            🛑 设置止损
          </button>
          <button @click="showTakeProfitModal = true" class="control-btn">
            📈 设置止盈
          </button>
          <button @click="generateRiskReport" class="control-btn">
            📊 风险报告
          </button>
          <button @click="toggleAutoRiskManagement" class="control-btn" :class="{ active: autoRiskManagement }">
            🤖 自动风控
          </button>
        </div>
      </div>
    </div>

    <!-- Position Risk Analysis -->
    <div class="position-risk-section">
      <h3>持仓风险分析</h3>
      <div class="position-risk-grid">
        <div 
          v-for="position in positionRisks" 
          :key="position.symbol"
          class="position-risk-card"
          :class="position.overallRisk"
        >
          <div class="position-header">
            <div class="position-info">
              <div class="position-symbol">{{ position.symbol }}</div>
              <div class="position-value">{{ formatCurrency(position.positionValue) }}</div>
            </div>
            <div class="position-pnl" :class="{ positive: position.unrealizedPnL > 0, negative: position.unrealizedPnL < 0 }">
              {{ position.unrealizedPnLPercent.toFixed(2) }}%
            </div>
          </div>
          
          <div class="risk-indicators">
            <div class="risk-indicator">
              <span class="indicator-label">风险金额:</span>
              <span class="indicator-value">{{ formatCurrency(position.riskAmount) }}</span>
            </div>
            <div class="risk-indicator">
              <span class="indicator-label">风险比例:</span>
              <span class="indicator-value">{{ position.riskPercent.toFixed(2) }}%</span>
            </div>
            <div class="risk-indicator">
              <span class="indicator-label">风险收益比:</span>
              <span class="indicator-value">{{ position.riskRewardRatio.toFixed(2) }}</span>
            </div>
          </div>
          
          <div class="protection-status">
            <div class="protection-item" :class="{ active: !!position.stopLossPrice }">
              🛑 止损: {{ position.stopLossPrice ? formatCurrency(position.stopLossPrice) : '未设置' }}
            </div>
            <div class="protection-item" :class="{ active: !!position.takeProfitPrice }">
              📈 止盈: {{ position.takeProfitPrice ? formatCurrency(position.takeProfitPrice) : '未设置' }}
            </div>
          </div>
          
          <div class="position-actions">
            <button @click="editPositionRisk(position)" class="action-btn">编辑</button>
            <button @click="setPositionProtection(position)" class="action-btn">设置保护</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Risk Alerts -->
    <div class="risk-alerts-section">
      <h3>风险警报</h3>
      <div v-if="activeAlerts.length === 0" class="no-alerts">
        暂无风险警报
      </div>
      <div v-else class="alerts-list">
        <div 
          v-for="alert in activeAlerts" 
          :key="alert.id"
          class="alert-item"
          :class="alert.severity"
        >
          <div class="alert-header">
            <span class="alert-type">{{ getAlertTypeLabel(alert.type) }}</span>
            <span class="alert-severity">{{ getSeverityLabel(alert.severity) }}</span>
            <button @click="acknowledgeAlert(alert.id)" class="acknowledge-btn">确认</button>
          </div>
          <div class="alert-message">{{ alert.message }}</div>
          <div class="alert-time">{{ formatTime(alert.timestamp) }}</div>
        </div>
      </div>
    </div>

    <!-- Risk Rules -->
    <div class="risk-rules-section">
      <h3>风险规则</h3>
      <div class="rules-list">
        <div 
          v-for="rule in riskRules" 
          :key="rule.id"
          class="rule-item"
          :class="{ disabled: !rule.enabled }"
        >
          <div class="rule-header">
            <div class="rule-info">
              <div class="rule-name">{{ rule.name }}</div>
              <div class="rule-type">{{ getRuleTypeLabel(rule.type) }}</div>
            </div>
            <div class="rule-controls">
              <label class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="rule.enabled"
                  @change="updateRiskRule(rule)"
                />
                <span class="toggle-slider"></span>
              </label>
              <span class="rule-priority" :class="rule.priority">{{ rule.priority }}</span>
            </div>
          </div>
          <div class="rule-details">
            <div class="rule-action">动作: {{ getActionLabel(rule.action) }}</div>
            <div class="rule-triggers">触发次数: {{ rule.triggerCount }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stop Loss Modal -->
    <div v-if="showStopLossModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>设置止损订单</h3>
          <button @click="closeModals" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>股票代码</label>
            <input v-model="stopLossForm.symbol" placeholder="输入股票代码" />
          </div>
          <div class="form-group">
            <label>触发价格</label>
            <input 
              v-model.number="stopLossForm.triggerPrice" 
              type="number" 
              step="0.01"
              placeholder="输入触发价格"
            />
          </div>
          <div class="form-group">
            <label>数量</label>
            <input 
              v-model.number="stopLossForm.quantity" 
              type="number" 
              placeholder="输入数量"
            />
          </div>
          <div class="form-group">
            <label>订单类型</label>
            <select v-model="stopLossForm.orderType">
              <option value="market">市价单</option>
              <option value="limit">限价单</option>
            </select>
          </div>
          <div class="form-group" v-if="stopLossForm.orderType === 'limit'">
            <label>限价</label>
            <input 
              v-model.number="stopLossForm.limitPrice" 
              type="number" 
              step="0.01"
              placeholder="输入限价"
            />
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="stopLossForm.trailing" />
              追踪止损
            </label>
          </div>
          <div class="form-group" v-if="stopLossForm.trailing">
            <label>追踪比例 (%)</label>
            <input 
              v-model.number="stopLossForm.trailingPercent" 
              type="number" 
              step="0.1"
              placeholder="输入追踪比例"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="createStopLoss" class="primary-btn">创建止损单</button>
          <button @click="closeModals" class="secondary-btn">取消</button>
        </div>
      </div>
    </div>

    <!-- Take Profit Modal -->
    <div v-if="showTakeProfitModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>设置止盈订单</h3>
          <button @click="closeModals" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>股票代码</label>
            <input v-model="takeProfitForm.symbol" placeholder="输入股票代码" />
          </div>
          <div class="form-group">
            <label>目标价格</label>
            <input 
              v-model.number="takeProfitForm.targetPrice" 
              type="number" 
              step="0.01"
              placeholder="输入目标价格"
            />
          </div>
          <div class="form-group">
            <label>数量</label>
            <input 
              v-model.number="takeProfitForm.quantity" 
              type="number" 
              placeholder="输入数量"
            />
          </div>
          <div class="form-group">
            <label>订单类型</label>
            <select v-model="takeProfitForm.orderType">
              <option value="market">市价单</option>
              <option value="limit">限价单</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="createTakeProfit" class="primary-btn">创建止盈单</button>
          <button @click="closeModals" class="secondary-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePortfolioStore } from '@/stores/usePortfolioStore'
import { riskManagementService } from '@/services/riskManagementService'
import type { 
  StopLossOrder, 
  TakeProfitOrder, 
  PositionRisk, 
  PortfolioRisk, 
  RiskAlert, 
  RiskRule 
} from '@/types/risk'

const portfolioStore = usePortfolioStore()

// State
const showStopLossModal = ref(false)
const showTakeProfitModal = ref(false)
const autoRiskManagement = ref(false)
const currentPrices = ref<Map<string, number>>(new Map())

// Forms
const stopLossForm = ref({
  symbol: '',
  triggerPrice: 0,
  quantity: 0,
  orderType: 'market' as 'market' | 'limit',
  limitPrice: 0,
  trailing: false,
  trailingPercent: 0
})

const takeProfitForm = ref({
  symbol: '',
  targetPrice: 0,
  quantity: 0,
  orderType: 'market' as 'market' | 'limit',
  limitPrice: 0
})

// Computed properties
const portfolioRisk = computed<PortfolioRisk>(() => {
  if (!portfolioStore.positions.length) return getEmptyPortfolioRisk()
  
  return riskManagementService.calculatePortfolioRisk(
    portfolioStore.positions, 
    currentPrices.value
  )
})

const positionRisks = computed<PositionRisk[]>(() => {
  return portfolioStore.positions.map(position => {
    const currentPrice = currentPrices.value.get(position.symbol) || position.currentPrice
    return riskManagementService.calculatePositionRisk(position, currentPrice)
  })
})

const activeAlerts = computed<RiskAlert[]>(() => {
  return riskManagementService.getActiveAlerts()
})

const riskRules = computed<RiskRule[]>(() => {
  return riskManagementService.getRiskRules()
})

const riskLevelClass = computed(() => {
  const risk = portfolioRisk.value.overallRisk
  return {
    'low': risk === 'low',
    'medium': risk === 'medium',
    'high': risk === 'high',
    'extreme': risk === 'extreme'
  }
})

const drawdownClass = computed(() => {
  const drawdown = portfolioRisk.value.maxDrawdown
  if (drawdown < 0.05) return 'low'
  if (drawdown < 0.15) return 'medium'
  if (drawdown < 0.25) return 'high'
  return 'extreme'
})

const riskUtilizationClass = computed(() => {
  const utilization = portfolioRisk.value.riskUtilization
  if (utilization < 50) return 'low'
  if (utilization < 80) return 'medium'
  if (utilization < 100) return 'high'
  return 'extreme'
})

// Methods
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(value)
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const getAlertTypeLabel = (type: string): string => {
  const labels = {
    'stop_loss': '止损',
    'take_profit': '止盈',
    'drawdown': '回撤',
    'margin': '保证金',
    'variance': '方差',
    'concentration': '集中度',
    'liquidity': '流动性'
  }
  return labels[type as keyof typeof labels] || type
}

const getSeverityLabel = (severity: string): string => {
  const labels = {
    'low': '低',
    'medium': '中',
    'high': '高',
    'critical': '严重'
  }
  return labels[severity as keyof typeof labels] || severity
}

const getRuleTypeLabel = (type: string): string => {
  const labels = {
    'position_size': '仓位大小',
    'stop_loss': '止损',
    'take_profit': '止盈',
    'drawdown': '回撤',
    'concentration': '集中度',
    'variance': '方差'
  }
  return labels[type as keyof typeof labels] || type
}

const getActionLabel = (action: string): string => {
  const labels = {
    'alert': '警报',
    'restrict': '限制',
    'close': '平仓'
  }
  return labels[action as keyof typeof labels] || action
}

const createStopLoss = () => {
  try {
    const order = riskManagementService.createStopLossOrder({
      symbol: stopLossForm.value.symbol,
      triggerPrice: stopLossForm.value.triggerPrice,
      orderType: stopLossForm.value.orderType,
      limitPrice: stopLossForm.value.limitPrice || undefined,
      quantity: stopLossForm.value.quantity,
      status: 'active',
      trailing: stopLossForm.value.trailing,
      trailingPercent: stopLossForm.value.trailingPercent || undefined,
      timeInForce: 'GTC'
    })
    
    console.log('Stop loss order created:', order)
    closeModals()
  } catch (error) {
    console.error('Failed to create stop loss order:', error)
  }
}

const createTakeProfit = () => {
  try {
    const order = riskManagementService.createTakeProfitOrder({
      symbol: takeProfitForm.value.symbol,
      targetPrice: takeProfitForm.value.targetPrice,
      orderType: takeProfitForm.value.orderType,
      limitPrice: takeProfitForm.value.limitPrice || undefined,
      quantity: takeProfitForm.value.quantity,
      status: 'active',
      timeInForce: 'GTC'
    })
    
    console.log('Take profit order created:', order)
    closeModals()
  } catch (error) {
    console.error('Failed to create take profit order:', error)
  }
}

const generateRiskReport = () => {
  try {
    const report = riskManagementService.generateRiskReport(
      'portfolio_1',
      portfolioStore.positions,
      currentPrices.value
    )
    
    console.log('Risk report generated:', report)
    // In a real app, this would download or display the report
  } catch (error) {
    console.error('Failed to generate risk report:', error)
  }
}

const toggleAutoRiskManagement = () => {
  autoRiskManagement.value = !autoRiskManagement.value
  if (autoRiskManagement.value) {
    console.log('Auto risk management enabled')
  } else {
    console.log('Auto risk management disabled')
  }
}

const editPositionRisk = (position: PositionRisk) => {
  console.log('Edit position risk:', position)
  // In a real app, this would open an edit modal
}

const setPositionProtection = (position: PositionRisk) => {
  stopLossForm.value.symbol = position.symbol
  stopLossForm.value.quantity = position.positionSize
  showStopLossModal.value = true
}

const acknowledgeAlert = (alertId: string) => {
  riskManagementService.acknowledgeAlert(alertId)
}

const updateRiskRule = (rule: RiskRule) => {
  riskManagementService.updateRiskRule(rule.id, rule)
}

const closeModals = () => {
  showStopLossModal.value = false
  showTakeProfitModal.value = false
  
  // Reset forms
  stopLossForm.value = {
    symbol: '',
    triggerPrice: 0,
    quantity: 0,
    orderType: 'market',
    limitPrice: 0,
    trailing: false,
    trailingPercent: 0
  }
  
  takeProfitForm.value = {
    symbol: '',
    targetPrice: 0,
    quantity: 0,
    orderType: 'market',
    limitPrice: 0
  }
}

const getEmptyPortfolioRisk = (): PortfolioRisk => {
  return {
    totalValue: 0,
    totalRisk: 0,
    totalRiskPercent: 0,
    maxDrawdown: 0,
    currentDrawdown: 0,
    valueAtRisk95: 0,
    valueAtRisk99: 0,
    beta: 1,
    correlationRisk: 0,
    concentrationRisk: 0,
    liquidityRisk: 0,
    marketRisk: 0,
    creditRisk: 0,
    operationalRisk: 0,
    overallRisk: 'low',
    riskBudget: 0,
    riskUtilization: 0,
    lastUpdated: Date.now()
  }
}

// Initialize current prices
const initializeCurrentPrices = () => {
  portfolioStore.positions.forEach(position => {
    currentPrices.value.set(position.symbol, position.currentPrice)
  })
}

// Subscribe to real-time price updates
const subscribeToPriceUpdates = () => {
  // Simulate real-time price updates
  setInterval(() => {
    portfolioStore.positions.forEach(position => {
      const currentPrice = currentPrices.value.get(position.symbol) || position.currentPrice
      const newPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.002) // ±0.1% change
      currentPrices.value.set(position.symbol, newPrice)
      
      // Check stop loss and take profit orders
      riskManagementService.checkStopLossOrders(position.symbol, newPrice)
      riskManagementService.checkTakeProfitOrders(position.symbol, newPrice)
      
      // Update trailing stop losses
      riskManagementService.updateTrailingStopLoss(position.symbol, newPrice)
    })
    
    // Check risk rules
    riskManagementService.checkRiskRules(portfolioStore.positions, currentPrices.value)
  }, 5000) // Update every 5 seconds
}

// Lifecycle hooks
onMounted(() => {
  initializeCurrentPrices()
  subscribeToPriceUpdates()
  
  // Set up event listeners
  riskManagementService.on('stopLossTriggered', (data) => {
    console.log('Stop loss triggered:', data)
  })
  
  riskManagementService.on('takeProfitTriggered', (data) => {
    console.log('Take profit triggered:', data)
  })
  
  riskManagementService.on('riskAlert', (alert) => {
    console.log('Risk alert:', alert)
  })
})

onUnmounted(() => {
  // Clean up event listeners
  riskManagementService.off('stopLossTriggered', () => {})
  riskManagementService.off('takeProfitTriggered', () => {})
  riskManagementService.off('riskAlert', () => {})
})
</script>

<style scoped>
.risk-management-panel {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  min-height: 800px;
}

.portfolio-overview {
  margin-bottom: 24px;
}

.risk-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.risk-metric {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.metric-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.metric-percent {
  font-size: 14px;
  color: #666;
  margin-left: 4px;
}

.metric-value.low {
  color: #28a745;
}

.metric-value.medium {
  color: #ffc107;
}

.metric-value.high {
  color: #fd7e14;
}

.metric-value.extreme {
  color: #dc3545;
}

.metric-value.warning {
  color: #fd7e14;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.low {
  background: #28a745;
}

.progress-fill.medium {
  background: #ffc107;
}

.progress-fill.high {
  background: #fd7e14;
}

.progress-fill.extreme {
  background: #dc3545;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.risk-controls {
  margin-bottom: 24px;
}

.control-section {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.control-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.control-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #e9ecef;
}

.control-btn.active {
  background: #007aff;
  color: white;
  border-color: #007aff;
}

.position-risk-section {
  margin-bottom: 24px;
}

.position-risk-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.position-risk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.position-risk-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #ddd;
}

.position-risk-card.low {
  border-left-color: #28a745;
}

.position-risk-card.medium {
  border-left-color: #ffc107;
}

.position-risk-card.high {
  border-left-color: #fd7e14;
}

.position-risk-card.extreme {
  border-left-color: #dc3545;
}

.position-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.position-info {
  display: flex;
  flex-direction: column;
}

.position-symbol {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.position-value {
  font-size: 14px;
  color: #666;
}

.position-pnl {
  font-size: 14px;
  font-weight: bold;
}

.position-pnl.positive {
  color: #28a745;
}

.position-pnl.negative {
  color: #dc3545;
}

.risk-indicators {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.risk-indicator {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.indicator-label {
  color: #666;
}

.indicator-value {
  font-weight: bold;
  color: #333;
}

.protection-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.protection-item {
  font-size: 12px;
  color: #666;
}

.protection-item.active {
  color: #28a745;
  font-weight: bold;
}

.position-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  border: 1px solid #ddd;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e9ecef;
}

.risk-alerts-section {
  margin-bottom: 24px;
}

.risk-alerts-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.no-alerts {
  background: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  color: #666;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #ddd;
}

.alert-item.low {
  border-left-color: #28a745;
}

.alert-item.medium {
  border-left-color: #ffc107;
}

.alert-item.high {
  border-left-color: #fd7e14;
}

.alert-item.critical {
  border-left-color: #dc3545;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alert-type {
  font-size: 12px;
  font-weight: bold;
  color: #333;
}

.alert-severity {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
  color: white;
}

.alert-severity.low {
  background: #28a745;
}

.alert-severity.medium {
  background: #ffc107;
}

.alert-severity.high {
  background: #fd7e14;
}

.alert-severity.critical {
  background: #dc3545;
}

.acknowledge-btn {
  padding: 2px 6px;
  border: 1px solid #ddd;
  background: #f8f9fa;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}

.acknowledge-btn:hover {
  background: #e9ecef;
}

.alert-message {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.alert-time {
  font-size: 12px;
  color: #666;
}

.risk-rules-section {
  margin-bottom: 24px;
}

.risk-rules-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.rule-item.disabled {
  opacity: 0.6;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rule-info {
  display: flex;
  flex-direction: column;
}

.rule-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.rule-type {
  font-size: 12px;
  color: #666;
}

.rule-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 20px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #007aff;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.rule-priority {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  color: white;
}

.rule-priority.low {
  background: #28a745;
}

.rule-priority.medium {
  background: #ffc107;
}

.rule-priority.high {
  background: #fd7e14;
}

.rule-priority.critical {
  background: #dc3545;
}

.rule-details {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ddd;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 16px;
  border-top: 1px solid #ddd;
}

.primary-btn {
  padding: 8px 16px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.primary-btn:hover {
  background: #0056b3;
}

.secondary-btn {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.secondary-btn:hover {
  background: #545b62;
}
</style>