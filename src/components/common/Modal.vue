<template>
  <view v-if="visible" class="modal-container">
    <view class="modal-mask" @tap="handleClose"></view>
    <view class="modal-content">
      <view class="modal-header">
        <text class="modal-title">{{ title }}</text>
        <view class="modal-close" @tap="handleClose">
          <uni-icons type="close" size="20" color="#666"></uni-icons>
        </view>
      </view>
      
      <view class="modal-body">
        <slot></slot>
      </view>
      
      <view class="modal-footer">
        <view 
          v-if="showCancel" 
          class="modal-btn modal-btn-cancel"
          @tap="handleCancel"
        >
          <text>{{ cancelText }}</text>
        </view>
        <view 
          class="modal-btn modal-btn-confirm" 
          @tap="handleConfirm"
        >
          <text>{{ confirmText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '提示'
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmText: {
    type: String,
    default: '确定'
  }
})

const emit = defineEmits(['close', 'cancel', 'confirm'])

const handleClose = () => {
  emit('close')
}

const handleCancel = () => {
  emit('cancel')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<style scoped>
.modal-container {
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

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
}

.modal-content {
  position: relative;
  z-index: 1;
  width: 320px;
  max-width: 90%;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.modal-close {
  padding: 4px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  min-height: 60px;
}

.modal-footer {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.modal-btn:active {
  opacity: 0.8;
}

.modal-btn-cancel {
  border-right: 1px solid #f0f0f0;
}

.modal-btn-cancel text {
  color: #666;
  font-size: 16px;
}

.modal-btn-confirm {
  background-color: #1890ff;
}

.modal-btn-confirm text {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}
</style>