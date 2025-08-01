export const storage = {
  set(key: string, value: any): void {
    try {
      if (typeof value === 'object') {
        uni.setStorageSync(key, JSON.stringify(value))
      } else {
        uni.setStorageSync(key, value)
      }
    } catch (error) {
      console.error('Storage set error:', error)
    }
  },
  
  get(key: string, defaultValue: any = null): any {
    try {
      const value = uni.getStorageSync(key)
      if (value && typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      }
      return value || defaultValue
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  },
  
  remove(key: string): void {
    try {
      uni.removeStorageSync(key)
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  },
  
  clear(): void {
    try {
      uni.clearStorageSync()
    } catch (error) {
      console.error('Storage clear error:', error)
    }
  },
  
  getAll(): Record<string, any> {
    try {
      const storageInfo = uni.getStorageInfoSync()
      const data: Record<string, any> = {}
      
      storageInfo.keys.forEach(key => {
        data[key] = this.get(key)
      })
      
      return data
    } catch (error) {
      console.error('Storage get all error:', error)
      return {}
    }
  },
  
  has(key: string): boolean {
    try {
      const value = uni.getStorageSync(key)
      return value !== ''
    } catch (error) {
      console.error('Storage has error:', error)
      return false
    }
  }
}

export const sessionStorage = {
  set(key: string, value: any): void {
    try {
      if (typeof value === 'object') {
        uni.setStorageSync(`session_${key}`, JSON.stringify(value))
      } else {
        uni.setStorageSync(`session_${key}`, value)
      }
    } catch (error) {
      console.error('Session storage set error:', error)
    }
  },
  
  get(key: string, defaultValue: any = null): any {
    try {
      const value = uni.getStorageSync(`session_${key}`)
      if (value && typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      }
      return value || defaultValue
    } catch (error) {
      console.error('Session storage get error:', error)
      return defaultValue
    }
  },
  
  remove(key: string): void {
    try {
      uni.removeStorageSync(`session_${key}`)
    } catch (error) {
      console.error('Session storage remove error:', error)
    }
  },
  
  clear(): void {
    try {
      const storageInfo = uni.getStorageInfoSync()
      storageInfo.keys.forEach(key => {
        if (key.startsWith('session_')) {
          uni.removeStorageSync(key)
        }
      })
    } catch (error) {
      console.error('Session storage clear error:', error)
    }
  }
}

export const cache = {
  set(key: string, value: any, expireTime = 0): void {
    try {
      const cacheData = {
        value: value,
        timestamp: Date.now(),
        expireTime: expireTime
      }
      
      storage.set(`cache_${key}`, cacheData)
    } catch (error) {
      console.error('Cache set error:', error)
    }
  },
  
  get(key: string, defaultValue: any = null): any {
    try {
      const cacheData = storage.get(`cache_${key}`)
      
      if (!cacheData) return defaultValue
      
      if (cacheData.expireTime > 0) {
        const now = Date.now()
        if (now - cacheData.timestamp > cacheData.expireTime) {
          storage.remove(`cache_${key}`)
          return defaultValue
        }
      }
      
      return cacheData.value
    } catch (error) {
      console.error('Cache get error:', error)
      return defaultValue
    }
  },
  
  remove(key: string): void {
    try {
      storage.remove(`cache_${key}`)
    } catch (error) {
      console.error('Cache remove error:', error)
    }
  },
  
  clear(): void {
    try {
      const storageInfo = uni.getStorageInfoSync()
      storageInfo.keys.forEach(key => {
        if (key.startsWith('cache_')) {
          storage.remove(key)
        }
      })
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }
}

export const storageKeys = {
  USER_TOKEN: 'user_token',
  USER_INFO: 'user_info',
  WATCHLIST: 'watchlist',
  TRADE_SETTINGS: 'trade_settings',
  APP_SETTINGS: 'app_settings',
  THEME_CONFIG: 'theme_config',
  LANGUAGE_CONFIG: 'language_config',
  LAST_LOGIN: 'last_login',
  SEARCH_HISTORY: 'search_history'
}