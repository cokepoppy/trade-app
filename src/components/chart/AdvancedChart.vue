<template>
  <div class="advanced-chart-container">
    <!-- Chart Controls -->
    <div class="chart-controls">
      <!-- Timeframe Selector -->
      <div class="timeframe-selector">
        <button 
          v-for="timeframe in timeframes" 
          :key="timeframe.value"
          :class="['timeframe-btn', { active: currentTimeframe === timeframe.value }]"
          @click="changeTimeframe(timeframe.value)"
        >
          {{ timeframe.label }}
        </button>
      </div>

      <!-- Chart Type Selector -->
      <div class="chart-type-selector">
        <select v-model="chartConfig.type" @change="updateChartType">
          <option value="candlestick">K线图</option>
          <option value="line">分时图</option>
          <option value="bar">柱状图</option>
          <option value="area">面积图</option>
        </select>
      </div>

      <!-- Indicators Toggle -->
      <div class="indicators-toggle">
        <button 
          v-for="indicator in availableIndicators"
          :key="indicator"
          :class="['indicator-btn', { active: chartConfig.indicators.includes(indicator) }]"
          @click="toggleIndicator(indicator)"
        >
          {{ getIndicatorLabel(indicator) }}
        </button>
      </div>

      <!-- Drawing Tools -->
      <div class="drawing-tools">
        <button 
          v-for="tool in drawingTools"
          :key="tool.type"
          :class="['tool-btn', { active: selectedTool === tool.type }]"
          @click="selectDrawingTool(tool.type)"
          :title="tool.label"
        >
          {{ tool.icon }}
        </button>
      </div>

      <!-- View Controls -->
      <div class="view-controls">
        <button @click="resetZoom" title="重置缩放">🔍</button>
        <button @click="toggleCrosshair" title="十字线">➕</button>
        <button @click="toggleTheme" title="切换主题">🎨</button>
        <button @click="exportChart" title="导出图表">📥</button>
      </div>
    </div>

    <!-- Chart Canvas Container -->
    <div class="chart-canvas-container" ref="chartContainer">
      <!-- Main Chart Canvas -->
      <canvas 
        ref="chartCanvas" 
        class="chart-canvas"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseLeave"
        @wheel="handleWheel"
      ></canvas>

      <!-- Volume Chart Canvas -->
      <canvas 
        v-if="chartConfig.volume"
        ref="volumeCanvas" 
        class="volume-canvas"
      ></canvas>

      <!-- Indicator Canvas -->
      <canvas 
        v-for="indicator in activeIndicators"
        :key="indicator"
        :ref="el => setIndicatorCanvas(el, indicator)"
        class="indicator-canvas"
      ></canvas>

      <!-- Drawing Canvas -->
      <canvas 
        ref="drawingCanvas" 
        class="drawing-canvas"
        @mousedown="handleDrawingMouseDown"
        @mousemove="handleDrawingMouseMove"
        @mouseup="handleDrawingMouseUp"
      ></canvas>

      <!-- Crosshair Overlay -->
      <div 
        v-if="crosshair.visible"
        class="crosshair-overlay"
        :style="{
          left: crosshair.x + 'px',
          top: crosshair.y + 'px'
        }"
      >
        <div class="crosshair-line horizontal"></div>
        <div class="crosshair-line vertical"></div>
        <div class="crosshair-tooltip" v-if="crosshair.data">
          <div class="tooltip-content">
            <div class="tooltip-row">
              <span class="label">时间:</span>
              <span class="value">{{ formatTime(crosshair.data.timestamp) }}</span>
            </div>
            <div class="tooltip-row">
              <span class="label">开盘:</span>
              <span class="value">{{ crosshair.data.open?.toFixed(2) }}</span>
            </div>
            <div class="tooltip-row">
              <span class="label">最高:</span>
              <span class="value">{{ crosshair.data.high?.toFixed(2) }}</span>
            </div>
            <div class="tooltip-row">
              <span class="label">最低:</span>
              <span class="value">{{ crosshair.data.low?.toFixed(2) }}</span>
            </div>
            <div class="tooltip-row">
              <span class="label">收盘:</span>
              <span class="value">{{ crosshair.data.close?.toFixed(2) }}</span>
            </div>
            <div class="tooltip-row">
              <span class="label">成交量:</span>
              <span class="value">{{ formatVolume(crosshair.data.volume) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <span>加载图表数据...</span>
      </div>
    </div>

    <!-- Chart Info Panel -->
    <div class="chart-info-panel">
      <div class="info-row">
        <span class="label">当前价格:</span>
        <span class="value current-price" :class="{ up: currentPriceChange > 0, down: currentPriceChange < 0 }">
          {{ currentPrice?.toFixed(2) }}
        </span>
        <span class="change" :class="{ up: currentPriceChange > 0, down: currentPriceChange < 0 }">
          {{ currentPriceChange?.toFixed(2) }} ({{ currentPriceChangePercent?.toFixed(2) }}%)
        </span>
      </div>
      <div class="info-row">
        <span class="label">最高:</span>
        <span class="value">{{ highPrice?.toFixed(2) }}</span>
      </div>
      <div class="info-row">
        <span class="label">最低:</span>
        <span class="value">{{ lowPrice?.toFixed(2) }}</span>
      </div>
      <div class="info-row">
        <span class="label">成交量:</span>
        <span class="value">{{ formatVolume(totalVolume) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useMarketStore } from '@/stores/useMarketStore'
import { useTechnicalStore } from '@/stores/useTechnicalStore'
import type { ChartConfig, DrawingTool, ChartCrosshair, ChartZoom, ChartPan } from '@/types/chart'

interface Timeframe {
  value: string
  label: string
}

interface DrawingToolDef {
  type: string
  label: string
  icon: string
}

const props = defineProps<{
  symbol: string
  height?: number
  showVolume?: boolean
}>()

const emit = defineEmits<{
  timeRangeChange: [start: number, end: number]
  drawingComplete: [drawing: DrawingTool]
}>()

const marketStore = useMarketStore()
const technicalStore = useTechnicalStore()

// Refs
const chartContainer = ref<HTMLElement>()
const chartCanvas = ref<HTMLCanvasElement>()
const volumeCanvas = ref<HTMLCanvasElement>()
const drawingCanvas = ref<HTMLCanvasElement>()
const indicatorCanvases = ref<Map<string, HTMLCanvasElement>>(new Map())

// Chart Configuration
const chartConfig = ref<ChartConfig>({
  type: 'candlestick',
  timeframe: '1d',
  volume: true,
  indicators: [],
  drawingTools: true,
  theme: 'light'
})

// Chart State
const currentTimeframe = ref('1d')
const loading = ref(false)
const chartData = ref<any[]>([])
const selectedTool = ref<string | null>(null)
const crosshair = ref<ChartCrosshair>({
  x: 0,
  y: 0,
  visible: false,
  data: null
})

// Drawing State
const drawings = ref<DrawingTool[]>([])
const currentDrawing = ref<DrawingTool | null>(null)
const isDrawing = ref(false)
const isDragging = ref(false)

// Chart Navigation
const zoom = ref<ChartZoom>({
  min: 0,
  max: 100,
  range: 100
})

const pan = ref<ChartPan>({
  offset: 0,
  isDragging: false
})

// Constants
const timeframes: Timeframe[] = [
  { value: '1m', label: '1分' },
  { value: '5m', label: '5分' },
  { value: '15m', label: '15分' },
  { value: '30m', label: '30分' },
  { value: '1h', label: '1时' },
  { value: '4h', label: '4时' },
  { value: '1d', label: '1天' },
  { value: '1w', label: '1周' },
  { value: '1M', label: '1月' }
]

const availableIndicators = ['MA', 'EMA', 'RSI', 'MACD', 'BOLL']

const drawingTools: DrawingToolDef[] = [
  { type: 'trendline', label: '趋势线', icon: '📈' },
  { type: 'horizontal', label: '水平线', icon: '➖' },
  { type: 'vertical', label: '垂直线', icon: '|' },
  { type: 'rectangle', label: '矩形', icon: '⬜' },
  { type: 'circle', label: '圆形', icon: '⭕' },
  { type: 'text', label: '文本', icon: '📝' },
  { type: 'arrow', label: '箭头', icon: '➡️' }
]

// Computed Properties
const activeIndicators = computed(() => chartConfig.value.indicators)

const currentPrice = computed(() => {
  if (chartData.value.length === 0) return null
  return chartData.value[chartData.value.length - 1].close
})

const currentPriceChange = computed(() => {
  if (chartData.value.length < 2) return null
  const current = chartData.value[chartData.value.length - 1].close
  const previous = chartData.value[chartData.value.length - 2].close
  return current - previous
})

const currentPriceChangePercent = computed(() => {
  if (chartData.value.length < 2) return null
  const current = chartData.value[chartData.value.length - 1].close
  const previous = chartData.value[chartData.value.length - 2].close
  return ((current - previous) / previous) * 100
})

const highPrice = computed(() => {
  if (chartData.value.length === 0) return null
  return Math.max(...chartData.value.map(d => d.high))
})

const lowPrice = computed(() => {
  if (chartData.value.length === 0) return null
  return Math.min(...chartData.value.map(d => d.low))
})

const totalVolume = computed(() => {
  if (chartData.value.length === 0) return 0
  return chartData.value.reduce((sum, d) => sum + (d.volume || 0), 0)
})

// Methods
const loadChartData = async () => {
  try {
    loading.value = true
    
    const response = await marketService.getStockKLine({
      code: props.symbol,
      period: currentTimeframe.value,
      type: '1d'
    })

    chartData.value = response.data.map((item: any) => ({
      timestamp: item.timestamp || item.time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }))

    await nextTick()
    drawChart()
    
    // Emit time range change
    if (chartData.value.length > 0) {
      const startTime = chartData.value[0].timestamp
      const endTime = chartData.value[chartData.value.length - 1].timestamp
      emit('timeRangeChange', startTime, endTime)
    }

  } catch (error) {
    console.error('Failed to load chart data:', error)
  } finally {
    loading.value = false
  }
}

const drawChart = () => {
  if (!chartCanvas.value || chartData.value.length === 0) return

  const canvas = chartCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Set canvas size
  const container = chartContainer.value
  if (container) {
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight - (chartConfig.value.volume ? 100 : 0)
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw chart based on type
  switch (chartConfig.value.type) {
    case 'candlestick':
      drawCandlestickChart(ctx, canvas)
      break
    case 'line':
      drawLineChart(ctx, canvas)
      break
    case 'bar':
      drawBarChart(ctx, canvas)
      break
    case 'area':
      drawAreaChart(ctx, canvas)
      break
  }

  // Draw indicators
  drawIndicators()

  // Draw volume chart if enabled
  if (chartConfig.value.volume) {
    drawVolumeChart()
  }

  // Draw drawings
  drawDrawings()
}

const drawCandlestickChart = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const data = chartData.value
  const width = canvas.width
  const height = canvas.height
  
  const candleWidth = width / data.length * 0.8
  const candleSpacing = width / data.length * 0.2
  
  const minPrice = Math.min(...data.map(d => d.low))
  const maxPrice = Math.max(...data.map(d => d.high))
  const priceRange = maxPrice - minPrice

  data.forEach((candle, index) => {
    const x = index * (candleWidth + candleSpacing) + candleSpacing / 2
    const yOpen = height - ((candle.open - minPrice) / priceRange) * height
    const yHigh = height - ((candle.high - minPrice) / priceRange) * height
    const yLow = height - ((candle.low - minPrice) / priceRange) * height
    const yClose = height - ((candle.close - minPrice) / priceRange) * height

    // Draw candlestick
    ctx.strokeStyle = candle.close >= candle.open ? '#26a69a' : '#ef5350'
    ctx.fillStyle = candle.close >= candle.open ? '#26a69a' : '#ef5350'

    // Draw high-low line
    ctx.beginPath()
    ctx.moveTo(x + candleWidth / 2, yHigh)
    ctx.lineTo(x + candleWidth / 2, yLow)
    ctx.stroke()

    // Draw body
    const bodyTop = Math.min(yOpen, yClose)
    const bodyHeight = Math.abs(yClose - yOpen)
    
    if (bodyHeight > 1) {
      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight)
    } else {
      // Draw line for doji
      ctx.beginPath()
      ctx.moveTo(x, bodyTop)
      ctx.lineTo(x + candleWidth, bodyTop)
      ctx.stroke()
    }
  })
}

const drawLineChart = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const data = chartData.value
  const width = canvas.width
  const height = canvas.height
  
  const minPrice = Math.min(...data.map(d => d.low))
  const maxPrice = Math.max(...data.map(d => d.high))
  const priceRange = maxPrice - minPrice

  ctx.strokeStyle = '#2196f3'
  ctx.lineWidth = 2
  ctx.beginPath()

  data.forEach((candle, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((candle.close - minPrice) / priceRange) * height
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()
}

const drawBarChart = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const data = chartData.value
  const width = canvas.width
  const height = canvas.height
  
  const barWidth = width / data.length * 0.8
  const barSpacing = width / data.length * 0.2
  
  const minPrice = Math.min(...data.map(d => d.low))
  const maxPrice = Math.max(...data.map(d => d.high))
  const priceRange = maxPrice - minPrice

  data.forEach((candle, index) => {
    const x = index * (barWidth + barSpacing) + barSpacing / 2
    const yHigh = height - ((candle.high - minPrice) / priceRange) * height
    const yLow = height - ((candle.low - minPrice) / priceRange) * height

    ctx.strokeStyle = candle.close >= candle.open ? '#26a69a' : '#ef5350'
    ctx.fillStyle = candle.close >= candle.open ? '#26a69a' : '#ef5350'

    ctx.fillRect(x, yLow, barWidth, yHigh - yLow)
  })
}

const drawAreaChart = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const data = chartData.value
  const width = canvas.width
  const height = canvas.height
  
  const minPrice = Math.min(...data.map(d => d.low))
  const maxPrice = Math.max(...data.map(d => d.high))
  const priceRange = maxPrice - minPrice

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, 'rgba(33, 150, 243, 0.8)')
  gradient.addColorStop(1, 'rgba(33, 150, 243, 0.1)')

  ctx.fillStyle = gradient
  ctx.beginPath()

  data.forEach((candle, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((candle.close - minPrice) / priceRange) * height
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.lineTo(width, height)
  ctx.lineTo(0, height)
  ctx.closePath()
  ctx.fill()
}

const drawVolumeChart = () => {
  if (!volumeCanvas.value || chartData.value.length === 0) return

  const canvas = volumeCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const container = chartContainer.value
  if (container) {
    canvas.width = container.clientWidth
    canvas.height = 80
    canvas.style.top = (chartCanvas.value?.height || 0) + 'px'
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const data = chartData.value
  const maxVolume = Math.max(...data.map(d => d.volume || 0))
  
  const barWidth = canvas.width / data.length * 0.8
  const barSpacing = canvas.width / data.length * 0.2

  data.forEach((candle, index) => {
    const x = index * (barWidth + barSpacing) + barSpacing / 2
    const barHeight = ((candle.volume || 0) / maxVolume) * canvas.height * 0.8
    const y = canvas.height - barHeight

    ctx.fillStyle = candle.close >= candle.open ? '#26a69a' : '#ef5350'
    ctx.fillRect(x, y, barWidth, barHeight)
  })
}

const drawIndicators = () => {
  // Draw active indicators on their respective canvases
  activeIndicators.value.forEach(indicator => {
    const canvas = indicatorCanvases.value.get(indicator)
    if (canvas) {
      drawIndicator(canvas, indicator)
    }
  })
}

const drawIndicator = (canvas: HTMLCanvasElement, indicator: string) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const container = chartContainer.value
  if (container) {
    canvas.width = container.clientWidth
    canvas.height = 60
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw indicator based on type
  switch (indicator) {
    case 'MA':
      drawMA(ctx, canvas)
      break
    case 'RSI':
      drawRSI(ctx, canvas)
      break
    case 'MACD':
      drawMACD(ctx, canvas)
      break
    case 'BOLL':
      drawBollingerBands(ctx, canvas)
      break
  }
}

const drawMA = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const data = chartData.value
  if (data.length < 20) return

  const period = 20
  const maValues: number[] = []

  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, candle) => acc + candle.close, 0)
    maValues.push(sum / period)
  }

  const minMA = Math.min(...maValues)
  const maxMA = Math.max(...maValues)
  const maRange = maxMA - minMA

  ctx.strokeStyle = '#ff9800'
  ctx.lineWidth = 2
  ctx.beginPath()

  maValues.forEach((value, index) => {
    const x = ((index + period - 1) / (data.length - 1)) * canvas.width
    const y = canvas.height - ((value - minMA) / maRange) * canvas.height * 0.8 - 10

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()
}

const drawRSI = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const data = chartData.value
  if (data.length < 14) return

  const rsiData = technicalStore.getRSI(props.symbol, currentTimeframe.value)
  if (!rsiData) return

  // Draw RSI line
  ctx.strokeStyle = '#9c27b0'
  ctx.lineWidth = 2
  ctx.beginPath()

  const rsiY = canvas.height - ((rsiData.rsi - 0) / 100) * canvas.height * 0.8 - 10
  ctx.moveTo(canvas.width - 20, rsiY)
  ctx.lineTo(canvas.width - 10, rsiY)
  ctx.stroke()

  // Draw overbought/oversold lines
  ctx.strokeStyle = '#f44336'
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(0, canvas.height - 70 * 0.8 - 10)
  ctx.lineTo(canvas.width, canvas.height - 70 * 0.8 - 10)
  ctx.stroke()

  ctx.strokeStyle = '#4caf50'
  ctx.beginPath()
  ctx.moveTo(0, canvas.height - 30 * 0.8 - 10)
  ctx.lineTo(canvas.width, canvas.height - 30 * 0.8 - 10)
  ctx.stroke()
  
  ctx.setLineDash([])
}

const drawMACD = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const data = chartData.value
  if (data.length < 26) return

  const macdData = technicalStore.getMACD(props.symbol, currentTimeframe.value)
  if (!macdData) return

  // Draw MACD histogram
  const histogramHeight = Math.abs(macdData.histogram) * 20
  const histogramY = canvas.height / 2
  const histogramX = canvas.width - 30

  ctx.fillStyle = macdData.histogram > 0 ? '#4caf50' : '#f44336'
  ctx.fillRect(histogramX, histogramY, 10, macdData.histogram > 0 ? -histogramHeight : histogramHeight)
}

const drawBollingerBands = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const data = chartData.value
  if (data.length < 20) return

  const bbData = technicalStore.getBollingerBands(props.symbol, currentTimeframe.value)
  if (!bbData) return

  const currentPrice = data[data.length - 1].close
  const bbHeight = canvas.height * 0.8
  
  // Draw Bollinger Bands
  const upperY = canvas.height - ((bbData.upper - bbData.lower) / (bbData.upper - bbData.lower)) * bbHeight - 10
  const middleY = canvas.height - ((bbData.middle - bbData.lower) / (bbData.upper - bbData.lower)) * bbHeight - 10
  const lowerY = canvas.height - 10

  ctx.strokeStyle = '#2196f3'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])
  
  // Upper band
  ctx.beginPath()
  ctx.moveTo(canvas.width - 30, upperY)
  ctx.lineTo(canvas.width - 10, upperY)
  ctx.stroke()

  // Middle band
  ctx.strokeStyle = '#ff9800'
  ctx.beginPath()
  ctx.moveTo(canvas.width - 30, middleY)
  ctx.lineTo(canvas.width - 10, middleY)
  ctx.stroke()

  // Lower band
  ctx.strokeStyle = '#2196f3'
  ctx.beginPath()
  ctx.moveTo(canvas.width - 30, lowerY)
  ctx.lineTo(canvas.width - 10, lowerY)
  ctx.stroke()
  
  ctx.setLineDash([])
}

const drawDrawings = () => {
  if (!drawingCanvas.value) return

  const canvas = drawingCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const container = chartContainer.value
  if (container) {
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  drawings.value.forEach(drawing => {
    drawSingleDrawing(ctx, drawing)
  })

  if (currentDrawing.value) {
    drawSingleDrawing(ctx, currentDrawing.value)
  }
}

const drawSingleDrawing = (ctx: CanvasRenderingContext2D, drawing: DrawingTool) => {
  ctx.strokeStyle = drawing.color
  ctx.lineWidth = drawing.width
  ctx.beginPath()

  switch (drawing.type) {
    case 'trendline':
      if (drawing.points.length >= 2) {
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y)
        ctx.lineTo(drawing.points[1].x, drawing.points[1].y)
      }
      break
    case 'horizontal':
      if (drawing.points.length >= 2) {
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y)
        ctx.lineTo(drawing.points[1].x, drawing.points[0].y)
      }
      break
    case 'vertical':
      if (drawing.points.length >= 2) {
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y)
        ctx.lineTo(drawing.points[0].x, drawing.points[1].y)
      }
      break
    case 'rectangle':
      if (drawing.points.length >= 2) {
        const width = drawing.points[1].x - drawing.points[0].x
        const height = drawing.points[1].y - drawing.points[0].y
        ctx.rect(drawing.points[0].x, drawing.points[0].y, width, height)
      }
      break
    case 'circle':
      if (drawing.points.length >= 2) {
        const radius = Math.sqrt(
          Math.pow(drawing.points[1].x - drawing.points[0].x, 2) +
          Math.pow(drawing.points[1].y - drawing.points[0].y, 2)
        )
        ctx.arc(drawing.points[0].x, drawing.points[0].y, radius, 0, 2 * Math.PI)
      }
      break
    case 'text':
      if (drawing.points.length >= 1 && drawing.text) {
        ctx.fillStyle = drawing.color
        ctx.font = '14px Arial'
        ctx.fillText(drawing.text, drawing.points[0].x, drawing.points[0].y)
      }
      break
  }

  ctx.stroke()
}

// Event Handlers
const handleMouseDown = (event: MouseEvent) => {
  if (selectedTool.value) return // Don't pan when drawing tool is selected
  
  isDragging.value = true
  pan.value.isDragging = true
  pan.value.offset = event.clientX
}

const handleMouseMove = (event: MouseEvent) => {
  const rect = chartCanvas.value?.getBoundingClientRect()
  if (!rect) return

  crosshair.value.x = event.clientX - rect.left
  crosshair.value.y = event.clientY - rect.top

  // Update crosshair data
  const dataIndex = Math.floor((crosshair.value.x / rect.width) * chartData.value.length)
  if (dataIndex >= 0 && dataIndex < chartData.value.length) {
    crosshair.value.data = chartData.value[dataIndex]
  }

  if (isDragging.value && pan.value.isDragging) {
    const deltaX = event.clientX - pan.value.offset
    pan.value.offset = event.clientX
    
    // Update zoom based on pan
    zoom.value.min += deltaX
    zoom.value.max += deltaX
    
    drawChart()
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  pan.value.isDragging = false
}

const handleMouseLeave = () => {
  crosshair.value.visible = false
  isDragging.value = false
  pan.value.isDragging = false
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  
  const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9
  const centerX = crosshair.value.x
  
  zoom.value.min = centerX - (centerX - zoom.value.min) * zoomFactor
  zoom.value.max = centerX + (zoom.value.max - centerX) * zoomFactor
  zoom.value.range = zoom.value.max - zoom.value.min
  
  drawChart()
}

const handleDrawingMouseDown = (event: MouseEvent) => {
  if (!selectedTool.value) return
  
  const rect = drawingCanvas.value?.getBoundingClientRect()
  if (!rect) return

  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  if (selectedTool.value === 'text') {
    const text = prompt('请输入文本:')
    if (text) {
      const drawing: DrawingTool = {
        type: 'text',
        points: [{ x, y }],
        color: '#000000',
        width: 2,
        text,
        id: `drawing_${Date.now()}`,
        timestamp: Date.now()
      }
      drawings.value.push(drawing)
      emit('drawingComplete', drawing)
      drawDrawings()
    }
    selectedTool.value = null
  } else {
    isDrawing.value = true
    currentDrawing.value = {
      type: selectedTool.value,
      points: [{ x, y }],
      color: '#ff0000',
      width: 2,
      id: `drawing_${Date.now()}`,
      timestamp: Date.now()
    }
  }
}

const handleDrawingMouseMove = (event: MouseEvent) => {
  if (!isDrawing.value || !currentDrawing.value) return
  
  const rect = drawingCanvas.value?.getBoundingClientRect()
  if (!rect) return

  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  if (currentDrawing.value.points.length === 1) {
    currentDrawing.value.points.push({ x, y })
  } else if (currentDrawing.value.points.length === 2) {
    currentDrawing.value.points[1] = { x, y }
  }

  drawDrawings()
}

const handleDrawingMouseUp = () => {
  if (!isDrawing.value || !currentDrawing.value) return
  
  isDrawing.value = false
  
  if (currentDrawing.value.points.length >= 2) {
    drawings.value.push({ ...currentDrawing.value })
    emit('drawingComplete', currentDrawing.value)
  }
  
  currentDrawing.value = null
  selectedTool.value = null
}

// Control Methods
const changeTimeframe = (timeframe: string) => {
  currentTimeframe.value = timeframe
  chartConfig.value.timeframe = timeframe
  loadChartData()
}

const updateChartType = () => {
  drawChart()
}

const toggleIndicator = (indicator: string) => {
  const index = chartConfig.value.indicators.indexOf(indicator)
  if (index > -1) {
    chartConfig.value.indicators.splice(index, 1)
  } else {
    chartConfig.value.indicators.push(indicator)
  }
  drawChart()
}

const selectDrawingTool = (tool: string) => {
  selectedTool.value = selectedTool.value === tool ? null : tool
}

const resetZoom = () => {
  zoom.value = {
    min: 0,
    max: 100,
    range: 100
  }
  drawChart()
}

const toggleCrosshair = () => {
  crosshair.value.visible = !crosshair.value.visible
}

const toggleTheme = () => {
  chartConfig.value.theme = chartConfig.value.theme === 'light' ? 'dark' : 'light'
  drawChart()
}

const exportChart = () => {
  if (!chartCanvas.value) return
  
  const link = document.createElement('a')
  link.download = `${props.symbol}_${currentTimeframe.value}_${Date.now()}.png`
  link.href = chartCanvas.value.toDataURL()
  link.click()
}

// Utility Methods
const setIndicatorCanvas = (el: HTMLCanvasElement | null, indicator: string) => {
  if (el) {
    indicatorCanvases.value.set(indicator, el)
  } else {
    indicatorCanvases.value.delete(indicator)
  }
}

const getIndicatorLabel = (indicator: string) => {
  const labels = {
    'MA': 'MA',
    'EMA': 'EMA',
    'RSI': 'RSI',
    'MACD': 'MACD',
    'BOLL': 'BOLL'
  }
  return labels[indicator as keyof typeof labels] || indicator
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

const formatVolume = (volume: number) => {
  if (volume >= 100000000) {
    return `${(volume / 100000000).toFixed(2)}亿`
  } else if (volume >= 10000) {
    return `${(volume / 10000).toFixed(2)}万`
  }
  return volume.toString()
}

// Lifecycle Hooks
onMounted(() => {
  loadChartData()
  
  // Subscribe to real-time updates
  marketStore.subscribeToStocks([props.symbol], (update: any) => {
    // Update chart with real-time data
    if (chartData.value.length > 0) {
      const lastCandle = chartData.value[chartData.value.length - 1]
      const updatedCandle = {
        ...lastCandle,
        high: Math.max(lastCandle.high, update.price),
        low: Math.min(lastCandle.low, update.price),
        close: update.price,
        volume: (lastCandle.volume || 0) + (update.volume || 0)
      }
      
      chartData.value[chartData.value.length - 1] = updatedCandle
      drawChart()
    }
  })
})

onUnmounted(() => {
  // Cleanup
  drawings.value = []
  currentDrawing.value = null
  selectedTool.value = null
})

// Watch for real-time updates
watch(() => props.symbol, () => {
  loadChartData()
})
</script>

<style scoped>
.advanced-chart-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap;
}

.timeframe-selector {
  display: flex;
  gap: 4px;
}

.timeframe-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.timeframe-btn:hover {
  background: #e9ecef;
}

.timeframe-btn.active {
  background: #007aff;
  color: white;
  border-color: #007aff;
}

.chart-type-selector select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.indicators-toggle {
  display: flex;
  gap: 4px;
}

.indicator-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.indicator-btn:hover {
  background: #e9ecef;
}

.indicator-btn.active {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.drawing-tools {
  display: flex;
  gap: 4px;
}

.tool-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: #e9ecef;
}

.tool-btn.active {
  background: #007aff;
  color: white;
  border-color: #007aff;
}

.view-controls {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.view-controls button {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.view-controls button:hover {
  background: #e9ecef;
}

.chart-canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.chart-canvas,
.volume-canvas,
.indicator-canvas,
.drawing-canvas {
  position: absolute;
  left: 0;
  background: transparent;
}

.chart-canvas {
  top: 0;
  z-index: 1;
}

.volume-canvas {
  bottom: 0;
  z-index: 2;
  border-top: 1px solid #e0e0e0;
}

.indicator-canvas {
  z-index: 3;
}

.drawing-canvas {
  top: 0;
  z-index: 4;
  cursor: crosshair;
}

.crosshair-overlay {
  position: absolute;
  pointer-events: none;
  z-index: 5;
}

.crosshair-line {
  position: absolute;
  background: rgba(0, 0, 0, 0.3);
}

.crosshair-line.horizontal {
  width: 100%;
  height: 1px;
  top: 50%;
  left: 0;
}

.crosshair-line.vertical {
  width: 1px;
  height: 100%;
  left: 50%;
  top: 0;
}

.crosshair-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 6;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.tooltip-row .label {
  color: #ccc;
}

.tooltip-row .value {
  font-weight: bold;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chart-info-panel {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  font-size: 14px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-row .label {
  color: #666;
  font-weight: 500;
}

.info-row .value {
  font-weight: bold;
  color: #333;
}

.current-price {
  font-size: 16px;
}

.current-price.up {
  color: #28a745;
}

.current-price.down {
  color: #dc3545;
}

.change {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
}

.change.up {
  background: #d4edda;
  color: #155724;
}

.change.down {
  background: #f8d7da;
  color: #721c24;
}

/* Dark theme styles */
.advanced-chart-container.dark {
  background: #1a1a1a;
  color: #ffffff;
}

.advanced-chart-container.dark .chart-controls {
  border-bottom-color: #333;
}

.advanced-chart-container.dark .timeframe-btn,
.advanced-chart-container.dark .indicator-btn,
.advanced-chart-container.dark .tool-btn,
.advanced-chart-container.dark .view-controls button {
  background: #2d2d2d;
  border-color: #444;
  color: #fff;
}

.advanced-chart-container.dark .timeframe-btn:hover,
.advanced-chart-container.dark .indicator-btn:hover,
.advanced-chart-container.dark .tool-btn:hover,
.advanced-chart-container.dark .view-controls button:hover {
  background: #3d3d3d;
}

.advanced-chart-container.dark .chart-info-panel {
  border-top-color: #333;
}

.advanced-chart-container.dark .info-row .label {
  color: #aaa;
}

.advanced-chart-container.dark .info-row .value {
  color: #fff;
}
</style>