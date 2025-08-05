export const formatNumber = (num: number, precision = 2): string => {
  return num.toFixed(precision)
}

export const formatPercent = (num: number, precision = 2): string => {
  return `${(num * 100).toFixed(precision)}%`
}

export const formatPrice = (price: number | undefined | null, precision = 2): string => {
  if (price === undefined || price === null || isNaN(price)) {
    return '--'
  }
  const numPrice = Number(price)
  if (numPrice >= 10000) {
    return `${(numPrice / 10000).toFixed(precision)}万`
  }
  return numPrice.toFixed(precision)
}

export const formatVolume = (volume: number): string => {
  if (volume >= 100000000) {
    return `${(volume / 100000000).toFixed(2)}亿`
  } else if (volume >= 10000) {
    return `${(volume / 10000).toFixed(2)}万`
  }
  return volume.toString()
}

export const formatMarketValue = (value: number): string => {
  if (value >= 1000000000000) {
    return `${(value / 1000000000000).toFixed(2)}万亿`
  } else if (value >= 100000000) {
    return `${(value / 100000000).toFixed(2)}亿`
  } else if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万`
  }
  return value.toString()
}

export const formatChange = (change: number | undefined | null, precision = 2): string => {
  if (change === undefined || change === null || isNaN(change)) {
    return '--'
  }
  const numChange = Number(change)
  const sign = numChange >= 0 ? '+' : ''
  return `${sign}${numChange.toFixed(precision)}`
}

export const formatChangePercent = (change: number | undefined | null, precision = 2): string => {
  if (change === undefined || change === null || isNaN(change)) {
    return '--'
  }
  const numChange = Number(change)
  const sign = numChange >= 0 ? '+' : ''
  return `${sign}${(numChange * 100).toFixed(precision)}%`
}

export const getColorClass = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'text-flat'
  }
  const numValue = Number(value)
  if (numValue > 0) return 'text-up'
  if (numValue < 0) return 'text-down'
  return 'text-flat'
}

export const getChangeColor = (change: number): string => {
  if (change > 0) return '#ff4d4f'
  if (change < 0) return '#52c41a'
  return '#666'
}

export const formatTime = (timestamp: number | string): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export const formatDate = (timestamp: number | string): string => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export const formatDateTime = (timestamp: number | string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatStockCode = (code: string): string => {
  if (code.length === 6) {
    const prefix = code.startsWith('6') ? 'SH' : 'SZ'
    return `${prefix}${code}`
  }
  return code
}

export const formatStockName = (name: string, maxLength = 8): string => {
  if (name.length > maxLength) {
    return name.substring(0, maxLength) + '...'
  }
  return name
}

export const formatAmount = (amount: number, precision = 2): string => {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(precision)}亿`
  } else if (amount >= 10000) {
    return `${(amount / 10000).toFixed(precision)}万`
  }
  return amount.toFixed(precision)
}