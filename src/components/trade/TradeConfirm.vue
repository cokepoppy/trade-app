<template>
  <view v-if="visible" class="trade-confirm">
    <view class="confirm-mask" @tap="handleClose"></view>
    <view class="confirm-content">
      <view class="confirm-header">
        <text class="confirm-title">交易确认</text>
        <view class="close-btn" @tap="handleClose">
          
        </view>
      </view>
      
      <view class="confirm-body">
        <view class="trade-info">
          <view class="info-item">
            <text class="info-label">交易类型</text>
            <text class="info-value" :class="tradeData.type">
              {{ tradeData.type === 'buy' ? '买入' : '卖出' }}
            </text>
          </view>
          
          <view class="info-item">
            <text class="info-label">股票代码</text>
            <text class="info-value">{{ tradeData.code }}</text>
          </view>
          
          <view class="info-item">
            <text class="info-label">股票名称</text>
            <text class="info-value">{{ tradeData.name }}</text>
          </view>
          
          <view class="info-item">
            <text class="info-label">委托类型</text>
            <text class="info-value">
              {{ tradeData.priceType === 'market' ? '市价委托' : '限价委托' }}
            </text>
          </view>
          
          <view v-if="tradeData.priceType === 'limit'" class="info-item">
            <text class="info-label">委托价格</text>
            <text class="info-value price">{{ formatPrice(tradeData.price) }}</text>
          </view>
          
          <view class="info-item">
            <text class="info-label">委托数量</text>
            <text class="info-value">{{ tradeData.volume }}股</text>
          </view>
          
          <view class="info-item">
            <text class="info-label">预估金额</text>
            <text class="info-value amount">{{ formatPrice(estimatedAmount) }}</text>
          </view>
          
          <view class="info-item">
            <text class="info-label">手续费</text>
            <text class="info-value fee">{{ formatPrice(estimatedFee) }}</text>
          </view>
          
          <view class="info-item total">
            <text class="info-label">预计总金额</text>
            <text class="info-value total-amount">{{ formatPrice(estimatedTotalAmount) }}</text>
          </view>
          
          <view v-if="tradeData.remark" class="info-item">
            <text class="info-label">备注</text>
            <text class="info-value remark">{{ tradeData.remark }}</text>
          </view>
        </view>
        
        <view v-if="showRiskWarning" class="risk-warning">
          <view class="warning-header">
            
            <text class="warning-title">风险提示</text>
          </view>
          <text class="warning-text">{{ riskWarningText }}</text>
        </view>
        
        <view v-if="errorMessage" class="error-message">
          <text class="error-text">{{ errorMessage }}</text>
        </view>
        
        <view v-if="requirePassword" class="password-section">
          <view class="password-label">
            <text class="label-text">交易密码</text>
            <text class="forgot-password" @tap="handleForgotPassword">忘记密码？</text>
          </view>
          <view class="password-input">
            <input 
              :value="password"
              type="password" 
              class="input-field"
              placeholder="请输入交易密码"
              maxlength="6"
              @focus="handlePasswordFocus"
              @blur="handlePasswordBlur"
              @input="handlePasswordInput"
            />
          </view>
          <view class="password-hint">
            <text class="hint-text">请输入6位数字交易密码</text>
          </view>
        </view>
      </view>
      
      <view class="confirm-footer">
        <view class="cancel-btn" @tap="handleClose">
          <text class="btn-text">取消</text>
        </view>
        <view 
          class="confirm-btn" 
          :class="{ disabled: !canConfirm || submitting }"
          @tap="handleConfirm"
        >
          <text class="btn-text">{{ submitting ? '提交中...' : '确认' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, defineProps } from 'vue'
import { formatPrice } from '@/utils/format'
import { validateTradePassword } from '@/utils/validation'
import { useTradeStore } from '@/stores/useTradeStore'
import { useUserStore } from '@/stores/useUserStore'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  tradeData: {
    type: Object,
    default: () => ({})
  },
  requirePassword: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'confirm', 'forgot-password', 'error'])

const tradeStore = useTradeStore()
const userStore = useUserStore()
const password = ref('123456')
const submitting = ref(false)
const errorMessage = ref('')

const handlePasswordFocus = () => {
  // 清除错误信息
  errorMessage.value = ''
}

const handlePasswordBlur = () => {
  // 处理密码输入框失去焦点事件
}

const handlePasswordInput = (e) => {
  // 处理密码输入事件
  const value = e.detail?.value || e.target?.value || ''
  console.log('Password input event:', value)
  password.value = value
  // 清除错误信息
  errorMessage.value = ''
}

const estimatedAmount = computed(() => {
  if (!props.tradeData.price || !props.tradeData.volume) return 0
  
  const tradePrice = props.tradeData.priceType === 'market' ? 0 : props.tradeData.price
  return tradePrice * props.tradeData.volume
})

const estimatedFee = computed(() => {
  return estimatedAmount.value * 0.0003
})

const estimatedTotalAmount = computed(() => {
  return estimatedAmount.value + estimatedFee.value
})

const showRiskWarning = computed(() => {
  return props.tradeData.type === 'sell' || estimatedAmount.value > 100000
})

const riskWarningText = computed(() => {
  if (props.tradeData.type === 'sell') {
    return '卖出股票可能影响您的投资组合配置，请确认交易信息。'
  }
  if (estimatedAmount.value > 100000) {
    return '本次交易金额较大，请确保资金充足并确认交易信息。'
  }
  return ''
})

const canConfirm = computed(() => {
  if (props.requirePassword) {
    return password.value && password.value.length === 6 && /^\d{6}$/.test(password.value)
  }
  return true
})

const handleClose = () => {
  password.value = ''
  errorMessage.value = ''
  emit('close')
}

const handleConfirm = async () => {
  console.log('handleConfirm 被调用')
  console.log('canConfirm:', canConfirm.value)
  console.log('submitting:', submitting.value)
  console.log('password:', password.value)
  
  if (!canConfirm.value || submitting.value) {
    console.log('条件不满足，直接返回')
    return
  }
  
  // 清除之前的错误信息
  errorMessage.value = ''
  submitting.value = true
  console.log('开始处理确认逻辑')
  
  try {
    // 验证交易密码
    if (props.requirePassword && !validateTradePassword(password.value)) {
      console.log('密码验证失败')
      errorMessage.value = '请输入正确的6位数字交易密码'
      submitting.value = false
      return
    }
    
    // 检查用户登录状态
    if (!userStore.isLoggedIn) {
      console.log('用户未登录')
      errorMessage.value = '请先登录'
      submitting.value = false
      return
    }
    
    // 检查账户信息
    console.log('获取账户信息...')
    const accountInfo = await tradeStore.getAccountInfo()
    if (!accountInfo) {
      console.log('获取账户信息失败')
      errorMessage.value = '获取账户信息失败，请稍后重试'
      submitting.value = false
      return
    }
    
    // 检查资金是否充足（买入时）
    if (props.tradeData.type === 'buy') {
      const requiredAmount = estimatedTotalAmount.value
      console.log('检查资金:', { required: requiredAmount, available: accountInfo.availableFunds })
      if (accountInfo.availableFunds < requiredAmount) {
        console.log('资金不足，显示提示')
        const message = `可用资金不足，需要 ${requiredAmount.toFixed(2)} 元，可用 ${accountInfo.availableFunds.toFixed(2)} 元`
        
        // 在对话框内显示错误信息
        errorMessage.value = message
        
        // 尝试多种提示方式
        try {
          uni.showToast({
            title: message,
            icon: 'none',
            duration: 3000
          })
          console.log('uni.showToast 调用成功')
        } catch (e) {
          console.error('uni.showToast 失败:', e)
        }
        
        // 也可以通过 emit 让父组件处理
        emit('error', { type: 'insufficient_funds', message })
        
        submitting.value = false
        return
      }
    }
    
    // 检查持仓是否充足（卖出时）
    if (props.tradeData.type === 'sell') {
      const position = await tradeStore.getStockPosition(props.tradeData.code)
      console.log('检查持仓:', position)
      if (!position || position.availableShares < props.tradeData.volume) {
        const message = '可卖数量不足'
        errorMessage.value = message
        submitting.value = false
        return
      }
    }
    
    // 构建订单数据
    const orderData = {
      accountId: tradeStore.currentAccount?.id || 'default',
      code: props.tradeData.code,
      name: props.tradeData.name,
      type: props.tradeData.type,
      priceType: props.tradeData.priceType,
      price: props.tradeData.priceType === 'market' ? 0 : props.tradeData.price,
      volume: props.tradeData.volume,
      remark: props.tradeData.remark || '',
      password: password.value,
      estimatedAmount: estimatedAmount.value,
      estimatedFee: estimatedFee.value,
      estimatedTotalAmount: estimatedTotalAmount.value
    }
    
    console.log('提交订单数据:', orderData)
    
    // 提交订单
    const result = await tradeStore.submitOrder(orderData)
    
    console.log('订单提交结果:', result)
    
    // 手动将订单添加到store（确保立即显示）
    console.log('手动添加订单到store...')
    if (!Array.isArray(tradeStore.orders)) {
      tradeStore.orders = []
    }
    
    // 创建完整的订单对象
    const completeOrder = {
      ...result,
      id: result.orderId,
      orderTime: result.createTime || Date.now(),
      filledVolume: 0,
      avgPrice: 0,
      filledTime: null,
      totalFee: estimatedFee.value,
      amount: estimatedAmount.value
    }
    
    // 添加到订单列表开头
    tradeStore.orders.unshift(completeOrder)
    console.log('订单已添加到store:', completeOrder)
    
    // 延迟刷新数据（确保后端数据同步）
    setTimeout(async () => {
      try {
        console.log('延迟刷新交易数据...')
        await Promise.all([
          tradeStore.fetchOrders({ limit: 50 }),
          tradeStore.fetchAccounts(),
          tradeStore.fetchPositions()
        ])
        console.log('延迟交易数据刷新完成')
      } catch (refreshError) {
        console.error('延迟刷新交易数据失败:', refreshError)
      }
    }, 1000)
    
    // 显示成功提示
    uni.showToast({
      title: props.tradeData.type === 'buy' ? '买入委托已提交' : '卖出委托已提交',
      icon: 'success',
      duration: 2000
    })
    
    // 触发确认事件，传递订单结果
    emit('confirm', {
      ...props.tradeData,
      password: password.value,
      orderResult: result
    })
    
    // 清空密码和错误信息
    password.value = '123456'
    errorMessage.value = ''
    
    // 关闭对话框
    setTimeout(() => {
      emit('close')
    }, 100)
    
  } catch (error) {
    console.error('交易确认失败:', error)
    
    let message = '交易失败'
    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    }
    
    // 在对话框内显示错误信息
    errorMessage.value = message
    
    // 显示错误提示
    try {
      uni.showToast({
        title: message,
        icon: 'none',
        duration: 3000
      })
    } catch (e) {
      console.error('uni.showToast 失败:', e)
    }
    
    // 如果是密码错误，清空密码
    if (message.includes('密码') || message.includes('验证')) {
      password.value = ''
    }
    
  } finally {
    submitting.value = false
    console.log('handleConfirm 处理完成')
  }
}

const handleForgotPassword = () => {
  emit('forgot-password')
}
</script>

<style scoped>
.trade-confirm {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
}

.confirm-content {
  position: relative;
  z-index: 1;
  width: 320px;
  max-width: 90%;
  max-height: 80vh;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.confirm-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  padding: 4px;
  cursor: pointer;
}

.confirm-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.trade-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.info-value.buy {
  color: #ff4d4f;
}

.info-value.sell {
  color: #52c41a;
}

.info-value.price {
  font-size: 16px;
  font-weight: 600;
}

.info-value.amount {
  color: #1890ff;
  font-weight: 600;
}

.info-value.fee {
  color: #faad14;
}

.info-item.total {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.info-value.total-amount {
  font-size: 18px;
  font-weight: 600;
  color: #ff4d4f;
}

.info-value.remark {
  font-size: 12px;
  color: #666;
  max-width: 200px;
  word-break: break-all;
}

.risk-warning {
  background-color: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.warning-title {
  font-size: 14px;
  font-weight: 500;
  color: #d46b08;
}

.warning-text {
  font-size: 12px;
  color: #ad6800;
  line-height: 1.4;
}

.error-message {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.error-text {
  font-size: 14px;
  color: #ff4d4f;
  line-height: 1.4;
}

.password-section {
  margin-bottom: 16px;
}

.password-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.label-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.forgot-password {
  font-size: 12px;
  color: #1890ff;
  cursor: pointer;
}

.forgot-password:active {
  opacity: 0.7;
}

.password-input {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 4px;
  position: relative;
  background-color: #fff;
  cursor: text;
}

.password-input:focus-within {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.input-field {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  border: none;
  outline: none;
  background-color: transparent;
  color: #333;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
  pointer-events: auto;
  min-height: 20px;
  line-height: 1.4;
}

.input-field::placeholder {
  color: #999;
}

.input-field:focus {
  outline: none;
}

/* 确保 uni-input 内部元素可点击 */
.input-field >>> .uni-input-wrapper,
.input-field >>> .uni-input-input,
.input-field >>> .uni-input-placeholder {
  pointer-events: auto !important;
  cursor: text !important;
}

/* 修复 uni-input 样式 */
.input-field >>> .uni-input-wrapper {
  width: 100%;
  min-height: 20px;
}

.input-field >>> .uni-input-input {
  width: 100%;
  font-size: 14px;
  color: #333;
  background: transparent;
}

.input-field >>> .uni-input-placeholder {
  color: #999;
  font-size: 14px;
}

/* 确保密码输入框容器可点击 */
.password-input {
  pointer-events: auto !important;
  touch-action: manipulation !important;
}

.password-input * {
  pointer-events: auto !important;
}

/* 移除可能阻止点击的样式 */
.password-input,
.password-input *,
.input-field,
.input-field * {
  user-select: auto !important;
  -webkit-user-select: auto !important;
  -webkit-touch-callout: default !important;
}

.password-hint {
  text-align: center;
}

.hint-text {
  font-size: 12px;
  color: #999;
}

.confirm-footer {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cancel-btn {
  border-right: 1px solid #f0f0f0;
}

.cancel-btn:active {
  background-color: #f5f5f5;
}

.btn-text {
  font-size: 16px;
  font-weight: 500;
}

.cancel-btn .btn-text {
  color: #666;
}

.confirm-btn {
  background-color: #1890ff;
}

.confirm-btn:active {
  background-color: #40a9ff;
}

.confirm-btn .btn-text {
  color: #fff;
}

.confirm-btn.disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.confirm-btn.disabled .btn-text {
  color: #999;
}
</style>