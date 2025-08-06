<template>
  <view class="funds-container">
    <Header />
    
    <view class="funds-content">
      <view class="account-section">
        <view class="account-card">
          <view class="account-header">
            <text class="account-title">资金总览</text>
            <view class="refresh-btn" @tap="refreshData">
              
            </view>
          </view>
          
          <view class="account-grid">
            <view class="account-item">
              <text class="item-label">总资产</text>
              <text class="item-value total-assets">{{ formatPrice(totalAssets) }}</text>
            </view>
            <view class="account-item">
              <text class="item-label">可用余额</text>
              <text class="item-value balance">{{ formatPrice(availableBalance) }}</text>
            </view>
            <view class="account-item">
              <text class="item-label">冻结余额</text>
              <text class="item-value frozen">{{ formatPrice(frozenBalance) }}</text>
            </view>
            <view class="account-item">
              <text class="item-label">持仓市值</text>
              <text class="item-value market-value">{{ formatPrice(marketValue) }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="actions-section">
        <view class="action-grid">
          <view class="action-item deposit" @tap="handleDeposit">
            
            <text class="action-text">充值</text>
          </view>
          <view class="action-item withdraw" @tap="handleWithdraw">
            
            <text class="action-text">提现</text>
          </view>
          <view class="action-item transfer" @tap="handleTransfer">
            
            <text class="action-text">转账</text>
          </view>
          <view class="action-item history" @tap="viewFundHistory">
            
            <text class="action-text">明细</text>
          </view>
        </view>
      </view>
      
      <view class="flow-section">
        <view class="section-header">
          <text class="section-title">资金流水</text>
          <view class="header-actions">
            <view class="filter-btn" @tap="showFilter = true">
              
            </view>
            <view class="refresh-btn" @tap="refreshData">
              
            </view>
          </view>
        </view>
        
        <view class="type-tabs">
          <view 
            class="type-tab" 
            :class="{ active: activeTab === 'all' }"
            @tap="switchTab('all')"
          >
            <text class="tab-text">全部</text>
          </view>
          <view 
            class="type-tab" 
            :class="{ active: activeTab === 'deposit' }"
            @tap="switchTab('deposit')"
          >
            <text class="tab-text">充值</text>
          </view>
          <view 
            class="type-tab" 
            :class="{ active: activeTab === 'withdraw' }"
            @tap="switchTab('withdraw')"
          >
            <text class="tab-text">提现</text>
          </view>
          <view 
            class="type-tab" 
            :class="{ active: activeTab === 'transfer' }"
            @tap="switchTab('transfer')"
          >
            <text class="tab-text">转账</text>
          </view>
        </view>
        
        <view v-if="filteredFlows.length > 0" class="flow-list">
          <view 
            v-for="flow in filteredFlows" 
            :key="flow.id" 
            class="flow-item"
          >
            <view class="flow-header">
              <view class="flow-info">
                <text class="flow-type" :class="flow.type">
                  {{ getFlowTypeText(flow.type) }}
                </text>
                <text class="flow-time">{{ formatDateTime(flow.createTime) }}</text>
              </view>
              <view class="flow-amount">
                <text class="amount-text" :class="getAmountClass(flow.type)">
                  {{ getAmountPrefix(flow.type) }}{{ formatPrice(flow.amount) }}
                </text>
              </view>
            </view>
            
            <view class="flow-body">
              <view class="flow-details">
                <view class="detail-item">
                  <text class="detail-label">状态</text>
                  <text class="detail-value" :class="flow.status">
                    {{ getStatusText(flow.status) }}
                  </text>
                </view>
                <view class="detail-item">
                  <text class="detail-label">余额</text>
                  <text class="detail-value">{{ formatPrice(flow.balance) }}</text>
                </view>
                <view v-if="flow.description" class="detail-item">
                  <text class="detail-label">说明</text>
                  <text class="detail-value">{{ flow.description }}</text>
                </view>
                <view v-if="flow.referenceId" class="detail-item">
                  <text class="detail-label">关联单号</text>
                  <text class="detail-value">{{ flow.referenceId }}</text>
                </view>
              </view>
              
              <view v-if="canCancelFlow(flow)" class="flow-actions">
                <view class="action-btn cancel-btn" @tap="handleCancelFlow(flow)">
                  <text class="btn-text">撤销</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <view v-else class="empty-state">
          <view class="empty-content">
            
            <text class="empty-text">暂无资金流水</text>
            <text class="empty-desc">您还没有任何资金流水记录</text>
          </view>
        </view>
        
        <view v-if="hasMore && filteredFlows.length > 0" class="load-more" @tap="loadMore">
          <text class="load-more-text">加载更多</text>
        </view>
      </view>
    </view>
    
    <Footer />
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'
import { useTradeStore } from '@/stores/useTradeStore'
import { useUserStore } from '@/stores/useUserStore'
import { useAppStore } from '@/stores/useAppStore'
import { formatPrice, formatDateTime } from '@/utils/format'

const tradeStore = useTradeStore()
const userStore = useUserStore()
const appStore = useAppStore()

const isRefreshing = ref(false)
const showFilter = ref(false)
const activeTab = ref('all')
const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const refreshTimer = ref<any>(null)

const currentAccount = computed(() => tradeStore.currentAccount)
const totalAssets = computed(() => tradeStore.totalAssets)
const availableBalance = computed(() => tradeStore.availableBalance)
const frozenBalance = computed(() => tradeStore.frozenBalance)
const marketValue = computed(() => tradeStore.marketValue)
const fundFlows = computed(() => tradeStore.fundFlows)

const filteredFlows = computed(() => {
  switch (activeTab.value) {
    case 'deposit':
      return fundFlows.value.filter(flow => flow.type === 'deposit')
    case 'withdraw':
      return fundFlows.value.filter(flow => flow.type === 'withdraw')
    case 'transfer':
      return fundFlows.value.filter(flow => ['transfer_in', 'transfer_out'].includes(flow.type))
    default:
      return fundFlows.value
  }
})

const getFlowTypeText = (type: string) => {
  const typeMap = {
    deposit: '充值',
    withdraw: '提现',
    transfer_in: '转入',
    transfer_out: '转出',
    fee: '手续费',
    tax: '税费',
    dividend: '股息',
    interest: '利息'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

const getAmountPrefix = (type: string) => {
  const negativeTypes = ['withdraw', 'transfer_out', 'fee', 'tax']
  return negativeTypes.includes(type) ? '-' : '+'
}

const getAmountClass = (type: string) => {
  const negativeTypes = ['withdraw', 'transfer_out', 'fee', 'tax']
  return negativeTypes.includes(type) ? 'text-down' : 'text-up'
}

const getStatusText = (status: string) => {
  const statusMap = {
    pending: '处理中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const canCancelFlow = (flow: any) => {
  return flow.type === 'deposit' && flow.status === 'pending'
}

const switchTab = (tab: string) => {
  activeTab.value = tab
  page.value = 1
  hasMore.value = true
}

const refreshData = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    await tradeStore.refreshData()
    page.value = 1
    hasMore.value = true
  } catch (error) {
    console.error('Refresh funds error:', error)
  } finally {
    isRefreshing.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value) return
  
  try {
    page.value++
    await tradeStore.getFundFlows({ 
      page: page.value, 
      pageSize: pageSize.value 
    })
    
    if (fundFlows.value.length < page.value * pageSize.value) {
      hasMore.value = false
    }
  } catch (error) {
    console.error('Load more flows error:', error)
  }
}

const handleDeposit = () => {
  uni.navigateTo({
    url: '/pages/trade/deposit'
  })
}

const handleWithdraw = () => {
  uni.navigateTo({
    url: '/pages/trade/withdraw'
  })
}

const handleTransfer = () => {
  uni.navigateTo({
    url: '/pages/trade/transfer'
  })
}

const viewFundHistory = () => {
  uni.navigateTo({
    url: '/pages/trade/fund-history'
  })
}

const handleCancelFlow = async (flow: any) => {
  try {
    uni.showModal({
      title: '确认撤销',
      content: `确定要撤销这笔${getFlowTypeText(flow.type)}吗？`,
      success: async (res: { confirm: boolean; cancel: boolean }) => {
        if (res.confirm) {
          appStore.showLoading('撤销中...')
          
          await tradeStore.cancelFundFlow(flow.id)
          
          appStore.hideLoading()
          appStore.showToast('撤销成功', 'success')
          
          await tradeStore.refreshData()
        }
      }
    })
  } catch (error) {
    appStore.hideLoading()
    appStore.showError(error instanceof Error ? error.message : '撤销失败')
  }
}

const startAutoRefresh = () => {
  refreshTimer.value = setInterval(() => {
    if (appStore.isOnline) {
      refreshData()
    }
  }, 30000) // 30秒刷新一次
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    appStore.showModal('提示', '请先登录', 'confirm')
    uni.switchTab({
      url: '/pages/profile/index'
    })
    return
  }
  
  await tradeStore.initialize()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.funds-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 70px;
}

.funds-content {
  padding: 16px;
}

.account-section {
  margin-bottom: 16px;
}

.account-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.account-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.refresh-btn {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.refresh-btn:active {
  background-color: #f5f5f5;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.account-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-label {
  font-size: 12px;
  color: #666;
}

.item-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.total-assets {
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

.balance {
  color: #52c41a;
}

.frozen {
  color: #faad14;
}

.market-value {
  color: #722ed1;
}

.actions-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-item:active {
  opacity: 0.8;
}

.action-item.deposit {
  background-color: #52c41a;
}

.action-item.withdraw {
  background-color: #ff4d4f;
}

.action-item.transfer {
  background-color: #1890ff;
}

.action-item.history {
  background-color: #722ed1;
}

.action-text {
  font-size: 12px;
  font-weight: 500;
  color: #fff;
}

.flow-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.filter-btn:active {
  background-color: #f5f5f5;
}

.type-tabs {
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.type-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.type-tab.active {
  border-bottom-color: #1890ff;
  background-color: #f0f9ff;
}

.type-tab:active {
  opacity: 0.7;
}

.tab-text {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.type-tab.active .tab-text {
  color: #1890ff;
}

.flow-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flow-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.flow-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.flow-type {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.flow-time {
  font-size: 12px;
  color: #999;
}

.flow-amount {
  display: flex;
  align-items: center;
}

.amount-text {
  font-size: 16px;
  font-weight: 600;
}

.flow-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flow-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 12px;
  color: #666;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.detail-value.pending {
  color: #faad14;
}

.detail-value.completed {
  color: #52c41a;
}

.detail-value.failed {
  color: #ff4d4f;
}

.detail-value.cancelled {
  color: #999;
}

.flow-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-btn:active {
  opacity: 0.8;
}

.cancel-btn {
  background-color: #ff4d4f;
}

.cancel-btn:active {
  background-color: #ff7875;
}

.btn-text {
  font-size: 12px;
  font-weight: 500;
  color: #fff;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-text {
  font-size: 16px;
  color: #666;
  text-align: center;
}

.empty-desc {
  font-size: 14px;
  color: #999;
  text-align: center;
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.load-more:active {
  opacity: 0.7;
}

.load-more-text {
  font-size: 14px;
  color: #1890ff;
}

.text-up {
  color: #52c41a;
}

.text-down {
  color: #ff4d4f;
}
</style>