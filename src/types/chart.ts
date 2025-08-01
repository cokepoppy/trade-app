export interface ChartConfig {
  type: 'candlestick' | 'line' | 'bar' | 'area'
  timeframe: string
  volume: boolean
  indicators: string[]
  drawingTools: boolean
  theme: 'light' | 'dark'
}

export interface DrawingTool {
  type: 'trendline' | 'horizontal' | 'vertical' | 'rectangle' | 'circle' | 'text' | 'arrow'
  points: { x: number; y: number }[]
  color: string
  width: number
  text?: string
  id: string
  timestamp: number
}

export interface ChartCrosshair {
  x: number
  y: number
  visible: boolean
  data: any
}

export interface ChartZoom {
  min: number
  max: number
  range: number
}

export interface ChartPan {
  offset: number
  isDragging: boolean
}

export interface TimeRange {
  start: number
  end: number
  interval: number
}