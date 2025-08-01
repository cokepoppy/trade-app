import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

export const formatRelativeTime = (timestamp: number | string): string => {
  return dayjs(timestamp).fromNow()
}

export const formatFullDate = (timestamp: number | string): string => {
  return dayjs(timestamp).format('YYYY年MM月DD日')
}

export const formatFullTime = (timestamp: number | string): string => {
  return dayjs(timestamp).format('YYYY年MM月DD日 HH:mm:ss')
}

export const formatShortDate = (timestamp: number | string): string => {
  return dayjs(timestamp).format('MM/DD')
}

export const formatShortTime = (timestamp: number | string): string => {
  return dayjs(timestamp).format('HH:mm')
}

export const formatTradeDate = (timestamp: number | string): string => {
  return dayjs(timestamp).format('YYYY-MM-DD')
}

export const formatDate = (timestamp: number | string): string => {
  return dayjs(timestamp).format('YYYY-MM-DD')
}

export const formatTradeTime = (timestamp: number | string): string => {
  return dayjs(timestamp).format('HH:mm:ss')
}

export const formatMonthYear = (timestamp: number | string): string => {
  return dayjs(timestamp).format('YYYY年MM月')
}

export const formatYearMonth = (timestamp: number | string): string => {
  return dayjs(timestamp).format('YYYY-MM')
}

export const getWeekday = (timestamp: number | string): string => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[dayjs(timestamp).day()]
}

export const isToday = (timestamp: number | string): boolean => {
  return dayjs(timestamp).isSame(dayjs(), 'day')
}

export const isYesterday = (timestamp: number | string): boolean => {
  return dayjs(timestamp).isSame(dayjs().subtract(1, 'day'), 'day')
}

export const isThisWeek = (timestamp: number | string): boolean => {
  return dayjs(timestamp).isSame(dayjs(), 'week')
}

export const isThisMonth = (timestamp: number | string): boolean => {
  return dayjs(timestamp).isSame(dayjs(), 'month')
}

export const isThisYear = (timestamp: number | string): boolean => {
  return dayjs(timestamp).isSame(dayjs(), 'year')
}

export const getDaysDiff = (start: number | string, end: number | string): number => {
  return dayjs(end).diff(dayjs(start), 'day')
}

export const getHoursDiff = (start: number | string, end: number | string): number => {
  return dayjs(end).diff(dayjs(start), 'hour')
}

export const getMinutesDiff = (start: number | string, end: number | string): number => {
  return dayjs(end).diff(dayjs(start), 'minute')
}

export const getSecondsDiff = (start: number | string, end: number | string): number => {
  return dayjs(end).diff(dayjs(start), 'second')
}

export const addDays = (timestamp: number | string, days: number): string => {
  return dayjs(timestamp).add(days, 'day').toISOString()
}

export const subtractDays = (timestamp: number | string, days: number): string => {
  return dayjs(timestamp).subtract(days, 'day').toISOString()
}

export const addHours = (timestamp: number | string, hours: number): string => {
  return dayjs(timestamp).add(hours, 'hour').toISOString()
}

export const subtractHours = (timestamp: number | string, hours: number): string => {
  return dayjs(timestamp).subtract(hours, 'hour').toISOString()
}

export const getStartOfDay = (timestamp: number | string): string => {
  return dayjs(timestamp).startOf('day').toISOString()
}

export const getEndOfDay = (timestamp: number | string): string => {
  return dayjs(timestamp).endOf('day').toISOString()
}

export const getStartOfWeek = (timestamp: number | string): string => {
  return dayjs(timestamp).startOf('week').toISOString()
}

export const getEndOfWeek = (timestamp: number | string): string => {
  return dayjs(timestamp).endOf('week').toISOString()
}

export const getStartOfMonth = (timestamp: number | string): string => {
  return dayjs(timestamp).startOf('month').toISOString()
}

export const getEndOfMonth = (timestamp: number | string): string => {
  return dayjs(timestamp).endOf('month').toISOString()
}

export const isValidDate = (date: any): boolean => {
  return dayjs(date).isValid()
}

export const parseDate = (dateString: string): Date => {
  return dayjs(dateString).toDate()
}

export const formatDateRange = (start: number | string, end: number | string): string => {
  const startDate = dayjs(start)
  const endDate = dayjs(end)
  
  if (startDate.isSame(endDate, 'day')) {
    return startDate.format('YYYY年MM月DD日')
  }
  
  if (startDate.isSame(endDate, 'month')) {
    return `${startDate.format('MM月DD日')}-${endDate.format('DD日')}`
  }
  
  if (startDate.isSame(endDate, 'year')) {
    return `${startDate.format('MM月DD日')}-${endDate.format('MM月DD日')}`
  }
  
  return `${startDate.format('YYYY年MM月DD日')}-${endDate.format('YYYY年MM月DD日')}`
}

export const getTradeDateRange = (days = 30): { start: string; end: string } => {
  const end = dayjs()
  const start = end.subtract(days, 'day')
  
  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD')
  }
}