<template>
  <view class="trade-panel">
    <view class="panel-header">
      <view class="type-tabs">
        <view 
          class="tab-item" 
          :class="{ active: tradeType === 'buy' }"
          @tap="switchType('buy')"
        >
          <text class="tab-text">买入</text>
        </view>
        <view 
          class="tab-item" 
          :class="{ active: tradeType === 'sell' }"
          @tap="switchType('sell')"
        >
          <text class="tab-text">卖出</text>
        </view>
      </view>
    </view>
    
    <view class="panel-content">
      <view class="form-section">
        <view class="form-item">
          <text class="form-label">股票代码</text>
          <view class="stock-input" @tap="selectStock">
            <text v-if="selectedStock" class="stock-code">{{ selectedStock.code }}</text>
            <text v-else class="stock-placeholder">请选择股票</text>
            <text class="arrow-icon">›</text>
          </view>
        </view>
        
        <view v-if="selectedStock" class="form-item">
          <text class="form-label">股票名称</text>
          <text class="stock-name">{{ selectedStock.name }}</text>
        </view>
        
        <view v-if="selectedStock" class="form-item">
          <text class="form-label">当前价格</text>
          <text class="current-price" :class="getColorClass(selectedStock.change)">
            {{ formatPrice(selectedStock.price) }}
            <text class="price-change">({{ formatChangePercent(selectedStock.changePercent) }})</text>
          </text>
        </view>
        
        <view class="form-item">
          <text class="form-label">委托类型</text>
          <view class="price-type-tabs">
            <view 
              class="type-tab" 
              :class="{ active: priceType === 'limit' }"
              @tap="switchPriceType('limit')"
            >
              <text class="type-text">限价委托</text>
            </view>
            <view 
              class="type-tab" 
              :class="{ active: priceType === 'market' }"
              @tap="switchPriceType('market')"
            >
              <text class="type-text">市价委托</text>
            </view>
          </view>
        </view>
        
        <view v-if="priceType === 'limit'" class="form-item">
          <text class="form-label">委托价格</text>
          <view class="price-input">
            <input 
              v-model="price" 
              type="digit" 
              class="input-field"
              placeholder="请输入价格"
              @input="validatePrice"
            />
          </view>
          <view v-if="selectedStock" class="price-suggestions">
            <view 
              v-for="suggestion in priceSuggestions" 
              :key="suggestion.label" 
              class="suggestion-item"
              @tap="setPrice(suggestion.value)"
            >
              <text class="suggestion-label">{{ suggestion.label }}</text>
              <text class="suggestion-value">{{ formatPrice(suggestion.value) }}</text>
            </view>
          </view>
        </view>
        
        <view class="form-item">
          <text class="form-label">委托数量</text>
          <view class="volume-input">
            <input 
              v-model="volume" 
              type="number" 
              class="input-field"
              placeholder="请输入数量"
              @input="validateVolume"
            />
          </view>
          <view v-if="selectedStock" class="volume-suggestions">
            <view 
              v-for="suggestion in volumeSuggestions" 
              :key="suggestion.label" 
              class="suggestion-item"
              @tap="setVolume(suggestion.value)"
            >
              <text class="suggestion-label">{{ suggestion.label }}</text>
              <text class="suggestion-value">{{ suggestion.value }}股</text>
            </view>
          </view>
        </view>
        
        <view v-if="selectedStock && (price || priceType === 'market') && volume" class="form-item">
          <text class="form-label">预估金额</text>
          <text class="estimated-amount">
            {{ formatPrice(estimatedAmount) }}
          </text>
        </view>
        
        <view class="form-item">
          <text class="form-label">备注</text>
          <view class="remark-input">
            <input 
              v-model="remark" 
              type="text" 
              class="input-field"
              placeholder="选填"
              maxlength="50"
            />
          </view>
        </view>
      </view>
      
      <view v-if="selectedStock && (price || priceType === 'market') && volume" class="trade-summary">
        <view class="summary-item">
          <text class="summary-label">手续费</text>
          <text class="summary-value">{{ formatPrice(estimatedFee) }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">预计成交金额</text>
          <text class="summary-value">{{ formatPrice(estimatedTotalAmount) }}</text>
        </view>
      </view>
      
      <view class="trade-actions">
        <button 
          class="trade-btn" 
          :class="tradeType"
          :disabled="!canTrade"
          @tap="handleTrade"
        >
          {{ tradeType === 'buy' ? '买入' : '卖出' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, onMounted, onUnmounted } from 'vue'
import { formatPrice, formatChangePercent, getColorClass } from '@/utils/format'
import { validatePrice as validatePriceUtil, validateVolume as validateVolumeUtil } from '@/utils/validation'
import { useMarketStore } from '@/stores/useMarketStore'

const emit = defineEmits(['trade'])

const marketStore = useMarketStore()
const tradeType = ref<'buy' | 'sell'>('buy')
const priceType = ref<'limit' | 'market'>('limit')
const selectedStock = ref<any>(null)
const price = ref('')
const volume = ref('')
const remark = ref('')
let priceUpdateInterval: any = null

const priceSuggestions = computed(() => {
  if (!selectedStock.value) return []
  
  return [
    { label: '跌停价', value: selectedStock.value.price * 0.9 },
    { label: '当前价', value: selectedStock.value.price },
    { label: '涨停价', value: selectedStock.value.price * 1.1 }
  ]
})

const volumeSuggestions = computed(() => {
  if (!selectedStock.value) return []
  
  const suggestedVolumes = [
    { label: '100股', value: 100 },
    { label: '500股', value: 500 },
    { label: '1000股', value: 1000 }
  ]
  
  if (selectedStock.value.price > 0) {
    const amount1000 = selectedStock.value.price * 1000
    suggestedVolumes.push({ label: '1万元', value: Math.floor(10000 / selectedStock.value.price) })
  }
  
  return suggestedVolumes
})

const estimatedAmount = computed(() => {
  if (!selectedStock.value || !volume.value) return 0
  
  const tradePrice = priceType.value === 'market' ? selectedStock.value.price : parseFloat(price.value) || 0
  return tradePrice * parseInt(volume.value)
})

const estimatedFee = computed(() => {
  return estimatedAmount.value * 0.0003
})

const estimatedTotalAmount = computed(() => {
  return estimatedAmount.value + estimatedFee.value
})

const canTrade = computed(() => {
  return selectedStock.value && 
         (priceType.value === 'market' || (price.value && parseFloat(price.value) > 0)) && 
         volume.value && 
         parseInt(volume.value) > 0
})

const switchType = (type: 'buy' | 'sell') => {
  tradeType.value = type
}

const switchPriceType = (type: 'limit' | 'market') => {
  priceType.value = type
  if (type === 'market') {
    price.value = ''
  }
}

const selectStock = () => {
  uni.navigateTo({
    url: '/pages/market/search?mode=trade'
  })
}

const setPrice = (value: number) => {
  price.value = value.toFixed(2)
}

const setVolume = (value: number) => {
  volume.value = value.toString()
}

const validatePrice = (event: any) => {
  const value = event.detail.value
  if (value && !validatePriceUtil(parseFloat(value))) {
    price.value = ''
  }
}

const validateVolume = (event: any) => {
  const value = event.detail.value
  if (value && !validateVolumeUtil(parseInt(value))) {
    volume.value = ''
  }
}

const handleTrade = () => {
  if (!canTrade.value) return
  
  const tradeData = {
    accountId: 'default',
    code: selectedStock.value.code,
    name: selectedStock.value.name,
    type: tradeType.value,
    priceType: priceType.value,
    price: priceType.value === 'market' ? 0 : parseFloat(price.value),
    volume: parseInt(volume.value),
    remark: remark.value
  }
  
  emit('trade', tradeData)
}

const setStock = (stock: any) => {
  selectedStock.value = stock
  price.value = ''
  volume.value = ''
  startPriceUpdates()
}

const startPriceUpdates = () => {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval)
  }
  
  if (selectedStock.value) {
    priceUpdateInterval = setInterval(async () => {
      try {
        const stockDetail = await marketStore.getStockDetail(selectedStock.value.code)
        selectedStock.value = {
          ...selectedStock.value,
          price: stockDetail.price || stockDetail.currentPrice || selectedStock.value.price,
          change: stockDetail.change || stockDetail.priceChange || selectedStock.value.change,
          changePercent: stockDetail.changePercent || stockDetail.priceChangePercent || selectedStock.value.changePercent
        }
      } catch (error) {
        console.error('Price update error:', error)
      }
    }, 5000) // 每5秒更新一次价格
  }
}

const stopPriceUpdates = () => {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval)
    priceUpdateInterval = null
  }
}

onMounted(() => {
  // 组件挂载时的初始化逻辑
})

onUnmounted(() => {
  stopPriceUpdates()
})

defineExpose({
  setStock
})
</script>

<style scoped>
.trade-panel {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  border-bottom: 1px solid #f0f0f0;
}

.type-tabs {
  display: flex;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-item.active {
  border-bottom-color: #1890ff;
  background-color: #f0f9ff;
}

.tab-item:active {
  opacity: 0.7;
}

.tab-text {
  font-size: 16px;
  font-weight: 500;
  color: #666;
}

.tab-item.active .tab-text {
  color: #1890ff;
}

.panel-content {
  padding: 16px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.stock-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.stock-input:active {
  border-color: #1890ff;
}

.stock-code {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.stock-placeholder {
  font-size: 14px;
  color: #999;
}

.arrow-icon {
  font-size: 16px;
  color: #999;
  margin-left: 8px;
}

.stock-name {
  font-size: 14px;
  color: #666;
}

.current-price {
  font-size: 16px;
  font-weight: 600;
}

.price-change {
  font-size: 12px;
  margin-left: 4px;
}

.price-type-tabs {
  display: flex;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.type-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #fff;
}

.type-tab.active {
  background-color: #1890ff;
  color: #fff;
}

.type-tab:active {
  opacity: 0.7;
}

.type-text {
  font-size: 12px;
  font-weight: 500;
}

.price-input,
.volume-input,
.remark-input {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.input-field {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  border: none;
  outline: none;
  background-color: transparent;
}

.price-suggestions,
.volume-suggestions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.suggestion-item:active {
  background-color: #e6f7ff;
}

.suggestion-label {
  font-size: 12px;
  color: #666;
}

.suggestion-value {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.estimated-amount {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.trade-summary {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-label {
  font-size: 12px;
  color: #666;
}

.summary-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.trade-actions {
  display: flex;
  gap: 12px;
}

.trade-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trade-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.trade-btn.buy {
  background-color: #ff4d4f;
  color: #fff;
}

.trade-btn.buy:active:not(:disabled) {
  background-color: #ff7875;
}

.trade-btn.sell {
  background-color: #52c41a;
  color: #fff;
}

.trade-btn.sell:active:not(:disabled) {
  background-color: #73d13d;
}

.text-up {
  color: #ff4d4f;
}

.text-down {
  color: #52c41a;
}

.text-flat {
  color: #666;
}
</style>