import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// import type { UserSettings } from '@/types'
import { storage } from '@/utils/storage'
import { storageKeys } from '@/utils/storage'

export const useAppStore = defineStore('app', () => {
  const theme = ref<'light' | 'dark' | 'auto'>('light')
  const language = ref<'zh-CN' | 'en-US'>('zh-CN')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const networkStatus = ref<'online' | 'offline'>('online')
  const sidebarOpen = ref(false)
  const toastMessage = ref('')
  const toastVisible = ref(false)
  const toastType = ref<'info' | 'success' | 'warning' | 'error'>('info')
  const modalVisible = ref(false)
  const modalTitle = ref('')
  const modalContent = ref('')
  const modalType = ref<'info' | 'confirm' | 'warning'>('info')
  const loadingVisible = ref(false)
  const loadingText = ref('')
  const currentPage = ref('home')
  const previousPage = ref('')
  const appVersion = ref('1.0.0')
  const buildNumber = ref('100')
  const environment = ref<'development' | 'testing' | 'production'>('development')
  const lastUpdateTime = ref<number>(0)

  const isDarkMode = computed(() => {
    if (theme.value === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return theme.value === 'dark'
  })

  const isOnline = computed(() => {
    return networkStatus.value === 'online'
  })

  const appInfo = computed(() => {
    return {
      version: appVersion.value,
      build: buildNumber.value,
      environment: environment.value,
      lastUpdate: lastUpdateTime.value
    }
  })

  const initialize = async () => {
    try {
      loading.value = true
      error.value = null
      
      await loadSettings()
      await checkNetworkStatus()
      await checkForUpdates()
      
      setupNetworkListener()
      setupThemeListener()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化应用失败'
      console.error('App store initialization error:', err)
    } finally {
      loading.value = false
    }
  }

  const loadSettings = async () => {
    try {
      const savedSettings = storage.get(storageKeys.APP_SETTINGS)
      if (savedSettings) {
        theme.value = savedSettings.theme || 'light'
        language.value = savedSettings.language || 'zh-CN'
      }
    } catch (err) {
      console.error('Load settings error:', err)
    }
  }

  const checkNetworkStatus = async () => {
    try {
      const status = await getNetworkStatus()
      networkStatus.value = status
    } catch (err) {
      console.error('Check network status error:', err)
    }
  }

  const checkForUpdates = async () => {
    try {
      const response = await fetch('/api/app/version')
      const data = await response.json()
      
      if (data.version !== appVersion.value) {
        lastUpdateTime.value = Date.now()
      }
    } catch (err) {
      console.error('Check for updates error:', err)
    }
  }

  const setupNetworkListener = () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        networkStatus.value = 'online'
        showToast('网络已连接', 'success')
      })
      
      window.addEventListener('offline', () => {
        networkStatus.value = 'offline'
        showToast('网络已断开', 'warning')
      })
    }
  }

  const setupThemeListener = () => {
    if (typeof window !== 'undefined' && theme.value === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        document.documentElement.classList.toggle('dark', e.matches)
      })
    }
  }

  const getNetworkStatus = async (): Promise<'online' | 'offline'> => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine ? 'online' : 'offline'
    }
    return 'online'
  }

  const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    theme.value = newTheme
    
    if (typeof document !== 'undefined') {
      if (newTheme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.documentElement.classList.toggle('dark', isDark)
      } else {
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
      }
    }
    
    saveSettings()
  }

  const setLanguage = (newLanguage: 'zh-CN' | 'en-US') => {
    language.value = newLanguage
    saveSettings()
  }

  const saveSettings = () => {
    try {
      const settings = {
        theme: theme.value,
        language: language.value
      }
      storage.set(storageKeys.APP_SETTINGS, settings)
    } catch (err) {
      console.error('Save settings error:', err)
    }
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const openSidebar = () => {
    sidebarOpen.value = true
  }

  const closeSidebar = () => {
    sidebarOpen.value = false
  }

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000) => {
    toastMessage.value = message
    toastType.value = type
    toastVisible.value = true
    
    setTimeout(() => {
      toastVisible.value = false
    }, duration)
  }

  const showSuccess = (message: string, duration = 3000) => {
    showToast(message, 'success', duration)
  }

  const hideToast = () => {
    toastVisible.value = false
  }

  const showModal = (title: string, content: string, type: 'info' | 'confirm' | 'warning' = 'info') => {
    modalTitle.value = title
    modalContent.value = content
    modalType.value = type
    modalVisible.value = true
  }

  const hideModal = () => {
    modalVisible.value = false
  }

  const showLoading = (text = '加载中...') => {
    loadingText.value = text
    loadingVisible.value = true
  }

  const hideLoading = () => {
    loadingVisible.value = false
  }

  const navigateTo = (page: string) => {
    previousPage.value = currentPage.value
    currentPage.value = page
  }

  const goBack = () => {
    if (previousPage.value) {
      currentPage.value = previousPage.value
      previousPage.value = ''
    }
  }

  const showError = (message: string) => {
    error.value = message
    showToast(message, 'error')
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    theme.value = 'light'
    language.value = 'zh-CN'
    loading.value = false
    error.value = null
    networkStatus.value = 'online'
    sidebarOpen.value = false
    toastMessage.value = ''
    toastVisible.value = false
    toastType.value = 'info'
    modalVisible.value = false
    modalTitle.value = ''
    modalContent.value = ''
    modalType.value = 'info'
    loadingVisible.value = false
    loadingText.value = ''
    currentPage.value = 'home'
    previousPage.value = ''
    lastUpdateTime.value = 0
  }

  const getAppConfig = () => {
    return {
      theme: theme.value,
      language: language.value,
      version: appVersion.value,
      environment: environment.value,
      networkStatus: networkStatus.value
    }
  }

  const getAppStats = () => {
    return {
      loadTime: performance.now(),
      memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
      networkStatus: networkStatus.value,
      lastUpdate: lastUpdateTime.value
    }
  }

  return {
    theme,
    language,
    loading,
    error,
    networkStatus,
    sidebarOpen,
    toastMessage,
    toastVisible,
    toastType,
    modalVisible,
    modalTitle,
    modalContent,
    modalType,
    loadingVisible,
    loadingText,
    currentPage,
    previousPage,
    appVersion,
    buildNumber,
    environment,
    lastUpdateTime,
    isDarkMode,
    isOnline,
    appInfo,
    initialize,
    loadSettings,
    checkNetworkStatus,
    checkForUpdates,
    setTheme,
    setLanguage,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    showToast,
    showSuccess,
    hideToast,
    showModal,
    hideModal,
    showLoading,
    hideLoading,
    navigateTo,
    goBack,
    showError,
    clearError,
    reset,
    getAppConfig,
    getAppStats
  }
})