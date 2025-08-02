<template>
  <view class="app-container">
    <view class="test-container">
      <view class="test-header">
        <text class="test-title">移动端适配测试</text>
        <text class="test-subtitle">当前视口宽度: {{ viewportWidth }}px</text>
      </view>
      
      <view class="test-content">
        <view class="test-item">
          <text class="test-label">设备类型:</text>
          <text class="test-value">{{ deviceType }}</text>
        </view>
        
        <view class="test-item">
          <text class="test-label">是否移动端:</text>
          <text class="test-value">{{ isMobile ? '是' : '否' }}</text>
        </view>
        
        <view class="test-item">
          <text class="test-label">屏幕方向:</text>
          <text class="test-value">{{ orientation }}</text>
        </view>
        
        <view class="test-item">
          <text class="test-label">像素比:</text>
          <text class="test-value">{{ pixelRatio }}</text>
        </view>
      </view>
      
      <view class="test-actions">
        <button class="test-btn" @tap="goBack">返回首页</button>
        <button class="test-btn" @tap="refreshData">刷新数据</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const viewportWidth = ref(window.innerWidth)
const deviceType = ref('')
const isMobile = ref(false)
const orientation = ref('')
const pixelRatio = ref(window.devicePixelRatio)

const detectDevice = () => {
  const width = window.innerWidth
  viewportWidth.value = width
  
  // 检测设备类型
  if (width <= 768) {
    deviceType.value = '移动端'
    isMobile.value = true
  } else if (width <= 1024) {
    deviceType.value = '平板端'
    isMobile.value = true
  } else {
    deviceType.value = 'PC端'
    isMobile.value = false
  }
  
  // 检测屏幕方向
  if (window.matchMedia('(orientation: portrait)').matches) {
    orientation.value = '竖屏'
  } else {
    orientation.value = '横屏'
  }
}

const refreshData = () => {
  detectDevice()
  console.log('设备信息已刷新:', {
    viewportWidth: viewportWidth.value,
    deviceType: deviceType.value,
    isMobile: isMobile.value,
    orientation: orientation.value,
    pixelRatio: pixelRatio.value
  })
}

const goBack = () => {
  uni.switchTab({
    url: '/pages/index/index'
  })
}

onMounted(() => {
  detectDevice()
  
  // 监听窗口大小变化
  window.addEventListener('resize', detectDevice)
  window.addEventListener('orientationchange', detectDevice)
})

onUnmounted(() => {
  window.removeEventListener('resize', detectDevice)
  window.removeEventListener('orientationchange', detectDevice)
})
</script>

<style scoped>
.test-container {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.test-title {
  display: block;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.test-subtitle {
  display: block;
  font-size: 14px;
  opacity: 0.8;
}

.test-content {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.test-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.test-item:last-child {
  border-bottom: none;
}

.test-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.test-value {
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.test-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.test-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  background: white;
  color: #667eea;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.test-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.test-btn:active {
  transform: translateY(0);
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .test-container {
    padding: 16px;
  }
  
  .test-title {
    font-size: 20px;
  }
  
  .test-content {
    padding: 16px;
  }
  
  .test-actions {
    flex-direction: column;
  }
  
  .test-btn {
    width: 100%;
  }
}
</style>