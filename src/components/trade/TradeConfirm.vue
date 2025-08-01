<template>
  <view v-if="visible" class="trade-confirm">
    <view class="confirm-mask" @tap="handleClose"></view>
    <view class="confirm-content">
      <view class="confirm-header">
        <text class="confirm-title">交易确认</text>
        <view class="close-btn" @tap="handleClose">
          <uni-icons type="close" size="20" color="#666"></uni-icons>
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
            <uni-icons type="info" size="16" color="#faad14"></uni-icons>
            <text class="warning-title">风险提示</text>
          </view>
          <text class="warning-text">{{ riskWarningText }}</text>
        </view>
        
        <view v-if="requirePassword" class="password-section">
          <view class="password-label">
            <text class="label-text">交易密码</text>
            <text class="forgot-password" @tap="handleForgotPassword">忘记密码？</text>
          </view>
          <view class="password-input">
            <input 
              v-model="password" 
              type="password" 
              class="input-field"
              placeholder="请输入交易密码"
              maxlength="6"
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
          :class="{ disabled: !canConfirm }"
          @tap="handleConfirm"
        >
          <text class="btn-text">确认</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, defineProps } from 'vue'
import { formatPrice } from '@/utils/format'
import { validateTradePassword } from '@/utils/validation'

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

const emit = defineEmits(['close', 'confirm', 'forgot-password'])

const password = ref('')

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
    return password.value && validateTradePassword(password.value)
  }
  return true
})

const handleClose = () => {
  password.value = ''
  emit('close')
}

const handleConfirm = () => {
  if (!canConfirm.value) return
  
  emit('confirm', {
    ...props.tradeData,
    password: password.value
  })
  
  password.value = ''
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
}

.input-field {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  border: none;
  outline: none;
  background-color: transparent;
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