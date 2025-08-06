<template>
  <view class="app-container page-content">
    <view class="trade-buy-container">
      <!-- 股票信息头部 -->
      <view class="stock-header">
        <view class="stock-info">
          <text class="stock-name">{{ stockName || '选择股票' }}</text>
          <text class="stock-code">{{ stockCode || '' }}</text>
        </view>
        <view class="stock-price">
          <text class="current-price" :class="{ 'up': priceChange >= 0, 'down': priceChange < 0 }">
            {{ currentPrice || '--' }}
          </text>
          <text class="price-change" :class="{ 'up': priceChange >= 0, 'down': priceChange < 0 }">
            {{ priceChange >= 0 ? '+' : '' }}{{ priceChange || '--' }} ({{ priceChangePercent >= 0 ? '+' : '' }}{{ priceChangePercent || '--' }}%)
          </text>
        </view>
      </view>

      <!-- 交易表单 -->
      <view class="trade-form">
        <!-- 交易方向 -->
        <view class="form-section">
          <view class="section-title">交易方向</view>
          <view class="trade-direction">
            <view 
              class="direction-item" 
              :class="{ active: tradeDirection === 'buy' }"
              @tap="setDirection('buy')"
            >
              <text class="direction-text">买入</text>
            </view>
            <view 
              class="direction-item" 
              :class="{ active: tradeDirection === 'sell' }"
              @tap="setDirection('sell')"
            >
              <text class="direction-text">卖出</text>
            </view>
          </view>
        </view>

        <!-- 价格类型 -->
        <view class="form-section">
          <view class="section-title">价格类型</view>
          <view class="price-types">
            <view 
              class="price-type-item" 
              :class="{ active: priceType === 'market' }"
              @tap="setPriceType('market')"
            >
              <text class="price-type-text">市价</text>
            </view>
            <view 
              class="price-type-item" 
              :class="{ active: priceType === 'limit' }"
              @tap="setPriceType('limit')"
            >
              <text class="price-type-text">限价</text>
            </view>
          </view>
        </view>

        <!-- 价格输入 -->
        <view class="form-section" v-if="priceType === 'limit'">
          <view class="section-title">委托价格</view>
          <view class="input-group">
            <input
              v-model="orderPrice"
              type="number"
              placeholder="请输入委托价格"
              class="form-input"
              @input="calculateAmount"
            />
            <text class="input-unit">元</text>
          </view>
        </view>

        <!-- 数量输入 -->
        <view class="form-section">
          <view class="section-title">委托数量</view>
          <view class="input-group">
            <input
              v-model="orderQuantity"
              type="number"
              placeholder="请输入委托数量"
              class="form-input"
              @input="calculateAmount"
            />
            <text class="input-unit">股</text>
          </view>
          
          <!-- 快速选择数量 -->
          <view class="quick-quantity">
            <view 
              class="quantity-btn" 
              v-for="btn in quickQuantityBtns"
              :key="btn.label"
              @tap="setQuantity(btn.value)"
            >
              {{ btn.label }}
            </view>
          </view>
        </view>

        <!-- 预估金额 -->
        <view class="form-section">
          <view class="section-title">预估金额</view>
          <view class="amount-display">
            <text class="amount-value">{{ estimatedAmount || '0.00' }}</text>
            <text class="amount-unit">元</text>
          </view>
        </view>

        <!-- 可用信息 -->
        <view class="form-section">
          <view class="info-row">
            <text class="info-label">可用资金：</text>
            <text class="info-value">{{ availableFunds || '0.00' }} 元</text>
          </view>
          <view class="info-row" v-if="tradeDirection === 'sell'">
            <text class="info-label">可用股份：</text>
            <text class="info-value">{{ availableShares || '0' }} 股</text>
          </view>
        </view>

        <!-- 交易按钮 -->
        <button 
          class="trade-btn" 
          :class="{ 
            'buy-btn': tradeDirection === 'buy', 
            'sell-btn': tradeDirection === 'sell',
            'disabled': !isFormValid || loading
          }"
          :disabled="!isFormValid || loading"
          @tap="submitOrder"
        >
          <text v-if="!loading">{{ tradeDirection === 'buy' ? '买入' : '卖出' }}</text>
          <view v-else class="loading-spinner">
            <view class="spinner"></view>
          </view>
        </button>
      </view>

      <!-- 交易说明 -->
      <view class="trade-tips">
        <view class="tips-title">交易说明</view>
        <view class="tips-content">
          <text class="tip-item">• 交易时间：周一至周五 9:30-11:30, 13:00-15:00</text>
          <text class="tip-item">• 最小交易单位：100股</text>
          <text class="tip-item">• 市价委托按当前最优价格成交</text>
          <text class="tip-item">• 限价委托按指定价格或更好价格成交</text>
        </view>
      </view>
    </view>

    <!-- Loading组件 -->
    <Loading :visible="loading" text="提交中..." />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useTradeStore } from '@/stores/useTradeStore'
import { useMarketStore } from '@/stores/useMarketStore'
import Loading from '@/components/common/Loading.vue'

// 状态管理
const tradeStore = useTradeStore()
const marketStore = useMarketStore()

// 响应式数据
const tradeDirection = ref<'buy' | 'sell'>('buy')
const priceType = ref<'market' | 'limit'>('market')
const orderPrice = ref('')
const orderQuantity = ref('')
const loading = ref(false)
const stockCode = ref('')
const stockName = ref('')
const currentPrice = ref(0)
const priceChange = ref(0)
const priceChangePercent = ref(0)

// 账户信息
const availableFunds = ref(0)
const availableShares = ref(0)

// 快速选择按钮
const quickQuantityBtns = [
  { label: '100股', value: 100 },
  { label: '500股', value: 500 },
  { label: '1000股', value: 1000 },
  { label: '全部', value: 'all' }
]

// 计算属性
const estimatedAmount = computed(() => {
  if (!orderQuantity.value) return '0.00'
  
  const quantity = parseInt(orderQuantity.value) || 0
  const price = priceType.value === 'market' ? currentPrice.value : parseFloat(orderPrice.value) || 0
  
  return (quantity * price).toFixed(2)
})

const isFormValid = computed(() => {
  if (!stockCode.value) return false
  if (!orderQuantity.value) return false
  
  const quantity = parseInt(orderQuantity.value) || 0
  if (quantity <= 0) return false
  
  if (priceType.value === 'limit') {
    const price = parseFloat(orderPrice.value) || 0
    if (price <= 0) return false
  }
  
  // 检查资金或股份是否充足
  if (tradeDirection.value === 'buy') {
    return parseFloat(estimatedAmount.value) <= availableFunds.value
  } else {
    return quantity <= availableShares.value
  }
  
  return true
})

// 初始化
onMounted(async () => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options
  
  if (options.stockCode) {
    stockCode.value = options.stockCode
    await loadStockInfo(options.stockCode)
  }
  
  // 获取账户信息
  await loadAccountInfo()
})

// 加载股票信息
const loadStockInfo = async (code: string) => {
  try {
    const stockInfo = await marketStore.getStockDetail(code)
    stockName.value = stockInfo.name
    currentPrice.value = stockInfo.currentPrice
    priceChange.value = stockInfo.priceChange
    priceChangePercent.value = stockInfo.priceChangePercent
  } catch (error) {
    console.error('加载股票信息失败:', error)
  }
}

// 加载账户信息
const loadAccountInfo = async () => {
  try {
    const accountInfo = await tradeStore.getAccountInfo()
    availableFunds.value = accountInfo.availableFunds
    
    if (stockCode.value) {
      const position = await tradeStore.getStockPosition(stockCode.value)
      availableShares.value = position.availableShares || 0
    }
  } catch (error) {
    console.error('加载账户信息失败:', error)
  }
}

// 设置交易方向
const setDirection = (direction: 'buy' | 'sell') => {
  tradeDirection.value = direction
}

// 设置价格类型
const setPriceType = (type: 'market' | 'limit') => {
  priceType.value = type
  if (type === 'market') {
    orderPrice.value = ''
  }
}

// 设置数量
const setQuantity = (value: number | string) => {
  if (value === 'all') {
    if (tradeDirection.value === 'buy') {
      const price = priceType.value === 'market' ? currentPrice.value : parseFloat(orderPrice.value) || currentPrice.value
      if (price > 0) {
        const maxQuantity = Math.floor(availableFunds.value / price)
        orderQuantity.value = (maxQuantity - (maxQuantity % 100)).toString()
      }
    } else {
      orderQuantity.value = availableShares.value.toString()
    }
  } else {
    orderQuantity.value = value.toString()
  }
}

// 计算金额
const calculateAmount = () => {
  // 这个计算由computed属性自动处理
}

// 提交订单
const submitOrder = async () => {
  if (!isFormValid.value || loading.value) return
  
  try {
    loading.value = true
    
    const orderData = {
      stockCode: stockCode.value,
      stockName: stockName.value,
      direction: tradeDirection.value,
      priceType: priceType.value,
      price: priceType.value === 'limit' ? parseFloat(orderPrice.value) : 0,
      quantity: parseInt(orderQuantity.value)
    }
    
    await tradeStore.submitOrder(orderData)
    
    // 显示成功提示
    uni.showToast({
      title: '委托成功',
      icon: 'success'
    })
    
    // 返回交易页面
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    
  } catch (error: any) {
    uni.showToast({
      title: error.message || '委托失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.trade-buy-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 16px;
}

.stock-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  color: white;
}

.stock-info {
  margin-bottom: 12px;
}

.stock-name {
  font-size: 18px;
  font-weight: 600;
  margin-right: 8px;
}

.stock-code {
  font-size: 14px;
  opacity: 0.8;
}

.stock-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.current-price {
  font-size: 24px;
  font-weight: 700;
}

.price-change {
  font-size: 12px;
  opacity: 0.9;
}

.up {
  color: #ff4757;
}

.down {
  color: #2ed573;
}

.trade-form {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.form-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.trade-direction {
  display: flex;
  gap: 8px;
}

.direction-item {
  flex: 1;
  padding: 12px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.direction-item.active {
  border-color: #1890ff;
  background-color: #1890ff;
}

.direction-item.active .direction-text {
  color: white;
}

.direction-text {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.price-types {
  display: flex;
  gap: 8px;
}

.price-type-item {
  flex: 1;
  padding: 12px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.price-type-item.active {
  border-color: #1890ff;
  background-color: #1890ff;
}

.price-type-item.active .price-type-text {
  color: white;
}

.price-type-text {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.input-group {
  display: flex;
  align-items: center;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  background-color: #fafafa;
}

.form-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 16px;
  outline: none;
}

.input-unit {
  font-size: 14px;
  color: #666;
  margin-left: 8px;
}

.quick-quantity {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.quantity-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  text-align: center;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quantity-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.amount-display {
  display: flex;
  align-items: baseline;
  padding: 16px;
  background-color: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #e6f7ff;
}

.amount-value {
  font-size: 24px;
  font-weight: 700;
  color: #1890ff;
}

.amount-unit {
  font-size: 14px;
  color: #666;
  margin-left: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.trade-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
}

.buy-btn {
  background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
  color: white;
}

.sell-btn {
  background: linear-gradient(135deg, #2ed573 0%, #17c0eb 100%);
  color: white;
}

.trade-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.trade-btn.disabled {
  background: #d9d9d9;
  color: #999;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  margin: 0 auto;
}

.spinner {
  width: 100%;
  height: 100%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.trade-tips {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.tips-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}
</style>