<template>
  <view v-if="visible" class="toast-container" :class="toastClass">
    <view class="toast-content">
      <uni-icons 
        v-if="showIcon" 
        :type="iconType" 
        size="20"
        :color="iconColor"
      ></uni-icons>
      <text class="toast-text">{{ message }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (value: string) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  },
  position: {
    type: String,
    default: 'top',
    validator: (value: string) => ['top', 'center', 'bottom'].includes(value)
  }
})

const emit = defineEmits(['close'])

const toastClass = computed(() => {
  return `toast-${props.position}`
})

const iconType = computed(() => {
  const iconMap = {
    success: 'checkmarkempty',
    error: 'closeempty',
    warning: 'info',
    info: 'info'
  }
  return iconMap[props.type as keyof typeof iconMap]
})

const iconColor = computed(() => {
  const colorMap = {
    success: '#52c41a',
    error: '#ff4d4f',
    warning: '#faad14',
    info: '#1890ff'
  }
  return colorMap[props.type as keyof typeof colorMap]
})

const showIcon = computed(() => {
  return props.type !== 'info'
})

let timer: any = null

watch(() => props.visible, (newVal) => {
  if (newVal && props.duration > 0) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      emit('close')
    }, props.duration)
  }
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  transition: all 0.3s ease;
}

.toast-top {
  top: 60px;
}

.toast-center {
  top: 50%;
  transform: translate(-50%, -50%);
}

.toast-bottom {
  bottom: 80px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  min-width: 120px;
  max-width: 300px;
}

.toast-text {
  color: #fff;
  font-size: 14px;
  line-height: 1.4;
  flex: 1;
}
</style>