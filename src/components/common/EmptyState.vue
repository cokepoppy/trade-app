<template>
  <view class="empty-state">
    <view class="empty-icon">
      <uni-icons :type="icon" size="48" color="#d9d9d9"></uni-icons>
    </view>
    <text class="empty-title">{{ title }}</text>
    <text v-if="description" class="empty-description">{{ description }}</text>
    <view v-if="actionText" class="empty-action" @tap="handleAction">
      <text class="action-text">{{ actionText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

defineProps({
  icon: {
    type: String,
    default: 'info'
  },
  title: {
    type: String,
    default: '暂无数据'
  },
  description: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['action'])

const handleAction = () => {
  emit('action')
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
  text-align: center;
}

.empty-description {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
  text-align: center;
  line-height: 1.5;
}

.empty-action {
  padding: 8px 24px;
  background-color: #1890ff;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.empty-action:active {
  background-color: #40a9ff;
}

.action-text {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}
</style>