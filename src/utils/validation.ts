export const validateStockCode = (code: string): boolean => {
  return /^\d{6}$/.test(code)
}

export const validatePrice = (price: number): boolean => {
  return price > 0 && price <= 10000
}

export const validateVolume = (volume: number): boolean => {
  return volume > 0 && volume <= 1000000 && Number.isInteger(volume)
}

export const validateAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 10000000
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 20
}

export const validateTradePassword = (password: string): boolean => {
  return /^\d{6}$/.test(password)
}

export const validatePhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone)
}

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const validateIdCard = (idCard: string): boolean => {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard)
}

export const validateBankCard = (bankCard: string): boolean => {
  return /^\d{16,19}$/.test(bankCard)
}

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

export const validateRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max
}

export const validateMinLength = (value: string, min: number): boolean => {
  return value.length >= min
}

export const validateMaxLength = (value: string, max: number): boolean => {
  return value.length <= max
}

export const validatePattern = (value: string, pattern: RegExp): boolean => {
  return pattern.test(value)
}

export const getValidationError = (field: string, value: any, rules: any[]): string => {
  for (const rule of rules) {
    if (!rule.validator(value)) {
      return rule.message
    }
  }
  return ''
}

export const validateForm = (formData: Record<string, any>, rules: Record<string, any[]>): Record<string, string> => {
  const errors: Record<string, string> = {}
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const error = getValidationError(field, formData[field], fieldRules)
    if (error) {
      errors[field] = error
    }
  }
  
  return errors
}

export const isValidTradeTime = (): boolean => {
  const now = new Date()
  const day = now.getDay()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  
  if (day === 0 || day === 6) return false
  
  const time = hours * 60 + minutes
  const morningStart = 9 * 60 + 15
  const morningEnd = 11 * 60 + 30
  const afternoonStart = 13 * 60
  const afternoonEnd = 15 * 60
  
  return (time >= morningStart && time <= morningEnd) || 
         (time >= afternoonStart && time <= afternoonEnd)
}

export const isValidMarketDay = (date: Date): boolean => {
  const day = date.getDay()
  return day !== 0 && day !== 6
}