import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  User, 
  UserProfile, 
  UserSettings, 
  UserDevice,
  UserLoginHistory,
  UserActivity,
  UserMessage,
  UserFeedback
} from '@/types/user'
import { userService } from '@/services/userService'
import { storage } from '@/utils/storage'
import { storageKeys } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const profile = ref<UserProfile | null>(null)
  const settings = ref<UserSettings | null>(null)
  const devices = ref<UserDevice[]>([])
  const loginHistory = ref<UserLoginHistory[]>([])
  const activities = ref<UserActivity[]>([])
  const messages = ref<UserMessage[]>([])
  const feedbacks = ref<UserFeedback[]>([])
  const token = ref<string>('')
  const refreshToken = ref<string>('')
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastLoginTime = ref<number>(0)

  const isLoggedIn = computed(() => {
    return isAuthenticated.value && !!token.value
  })

  const isVerified = computed(() => {
    return user.value?.isVerified || false
  })

  const isCertified = computed(() => {
    return profile.value?.verificationStatus === 'approved'
  })

  const unreadMessages = computed(() => {
    return messages.value.filter(message => !message.isRead)
  })

  const unreadMessageCount = computed(() => {
    return unreadMessages.value.length
  })

  const highPriorityMessages = computed(() => {
    return unreadMessages.value.filter(message => 
      ['high', 'urgent'].includes(message.priority)
    )
  })

  const activeDevices = computed(() => {
    return devices.value.filter(device => device.isActive)
  })

  const recentLoginHistory = computed(() => {
    return loginHistory.value.slice(0, 10)
  })

  const recentActivities = computed(() => {
    return activities.value.slice(0, 20)
  })

  const initialize = async () => {
    try {
      loading.value = true
      error.value = null
      
      const savedToken = storage.get(storageKeys.USER_TOKEN)
      const savedUser = storage.get(storageKeys.USER_INFO)
      
      if (savedToken && savedUser) {
        token.value = savedToken
        user.value = savedUser
        isAuthenticated.value = true
        
        await Promise.all([
          fetchUserProfile(),
          fetchUserSettings(),
          fetchUserDevices(),
          fetchUnreadMessages()
        ])
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化用户数据失败'
      console.error('User store initialization error:', err)
    } finally {
      loading.value = false
    }
  }

  const login = async (username: string, password: string, captcha?: string) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await userService.login({ username, password, captcha })
      const loginData = response.data.data
      const { token: newToken, refreshToken: newRefreshToken, userInfo } = loginData
      
      token.value = newToken
      refreshToken.value = newRefreshToken
      user.value = userInfo
      isAuthenticated.value = true
      lastLoginTime.value = Date.now()
      
      console.log('[DEBUG] Storing token:', newToken ? 'Token exists' : 'No token')
      console.log('[DEBUG] Storage before:', Object.keys(storage.getAll()))
      storage.set(storageKeys.USER_TOKEN, newToken)
      storage.set(storageKeys.REFRESH_TOKEN, newRefreshToken)
      storage.set(storageKeys.USER_INFO, userInfo)
      storage.set(storageKeys.LAST_LOGIN, Date.now())
      console.log('[DEBUG] Storage after:', Object.keys(storage.getAll()))
      console.log('[DEBUG] Token verification:', storage.get(storageKeys.USER_TOKEN) ? 'Token stored successfully' : 'Token storage failed')
      console.log('[DEBUG] Refresh token verification:', storage.get(storageKeys.REFRESH_TOKEN) ? 'Refresh token stored successfully' : 'Refresh token storage failed')
      
      await Promise.all([
        fetchUserProfile(),
        fetchUserSettings(),
        fetchUserDevices()
      ])
      
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败'
      console.error('Login error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const loginByPhone = async (phone: string, smsCode: string) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await userService.loginByPhone(phone, smsCode)
      const { token: newToken, refreshToken: newRefreshToken, userInfo } = response.data
      
      token.value = newToken
      refreshToken.value = newRefreshToken
      user.value = userInfo
      isAuthenticated.value = true
      lastLoginTime.value = Date.now()
      
      storage.set(storageKeys.USER_TOKEN, newToken)
      storage.set(storageKeys.REFRESH_TOKEN, newRefreshToken)
      storage.set(storageKeys.USER_INFO, userInfo)
      storage.set(storageKeys.LAST_LOGIN, Date.now())
      
      await Promise.all([
        fetchUserProfile(),
        fetchUserSettings(),
        fetchUserDevices()
      ])
      
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '手机号登录失败'
      console.error('Login by phone error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await userService.logout()
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      token.value = ''
      refreshToken.value = ''
      user.value = null
      profile.value = null
      settings.value = null
      devices.value = []
      loginHistory.value = []
      activities.value = []
      messages.value = []
      feedbacks.value = []
      isAuthenticated.value = false
      lastLoginTime.value = 0
      
      storage.remove(storageKeys.USER_TOKEN)
      storage.remove(storageKeys.REFRESH_TOKEN)
      storage.remove(storageKeys.USER_INFO)
      storage.remove(storageKeys.LAST_LOGIN)
    }
  }

  const register = async (userData: any) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await userService.register(userData)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '注册失败'
      console.error('Register error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const refreshTokenIfNeeded = async () => {
    try {
      if (!refreshToken.value) return false
      
      const response = await userService.refreshToken(refreshToken.value)
      token.value = response.data.token
      refreshToken.value = response.data.refreshToken
      storage.set(storageKeys.USER_TOKEN, token.value)
      storage.set(storageKeys.REFRESH_TOKEN, refreshToken.value)
      return true
    } catch (err) {
      console.error('Refresh token error:', err)
      await logout()
      return false
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await userService.getUserProfile()
      profile.value = response.data
    } catch (err) {
      console.error('Fetch user profile error:', err)
    }
  }

  const fetchUserSettings = async () => {
    try {
      const response = await userService.getUserSettings()
      settings.value = response.data
      storage.set(storageKeys.APP_SETTINGS, response.data)
    } catch (err) {
      console.error('Fetch user settings error:', err)
    }
  }

  const fetchUserDevices = async () => {
    try {
      const response = await userService.getUserDevices()
      devices.value = response.data
    } catch (err) {
      console.error('Fetch user devices error:', err)
    }
  }

  const fetchLoginHistory = async () => {
    try {
      const response = await userService.getLoginHistory()
      loginHistory.value = response.data.list || response.data
    } catch (err) {
      console.error('Fetch login history error:', err)
    }
  }

  const fetchUserActivities = async () => {
    try {
      const response = await userService.getUserActivities()
      activities.value = response.data.list || response.data
    } catch (err) {
      console.error('Fetch user activities error:', err)
    }
  }

  const fetchUserMessages = async (params?: any) => {
    try {
      const response = await userService.getUserMessages(params)
      messages.value = response.data.list || response.data
    } catch (err) {
      console.error('Fetch user messages error:', err)
    }
  }

  const fetchUnreadMessages = async () => {
    try {
      const response = await userService.getUnreadMessages()
      const unreadMessages = response.data
      
      unreadMessages.forEach(msg => {
        const existingIndex = messages.value.findIndex(m => m.id === msg.id)
        if (existingIndex === -1) {
          messages.value.unshift(msg)
        }
      })
    } catch (err) {
      console.error('Fetch unread messages error:', err)
    }
  }

  const fetchUserFeedbacks = async () => {
    try {
      const response = await userService.getUserFeedbacks()
      feedbacks.value = response.data.list || response.data
    } catch (err) {
      console.error('Fetch user feedbacks error:', err)
    }
  }

  const updateUserProfile = async (profileData: any) => {
    try {
      const response = await userService.updateUserProfile(profileData)
      // Update user info since this returns User type
      if (user.value) {
        user.value = { ...user.value, ...response.data }
        storage.set(storageKeys.USER_INFO, user.value)
      }
      // Refresh profile data to get updated UserProfile
      await fetchUserProfile()
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新用户资料失败'
      console.error('Update user profile error:', err)
      throw err
    }
  }

  const updateUserSettings = async (settingsData: any) => {
    try {
      const response = await userService.updateUserSettings(settingsData)
      settings.value = response.data
      storage.set(storageKeys.APP_SETTINGS, response.data)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新用户设置失败'
      console.error('Update user settings error:', err)
      throw err
    }
  }

  const changePassword = async (passwordData: any) => {
    try {
      const response = await userService.changePassword(passwordData)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '修改密码失败'
      console.error('Change password error:', err)
      throw err
    }
  }

  const resetPassword = async (resetData: any) => {
    try {
      const response = await userService.resetPassword(resetData)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '重置密码失败'
      console.error('Reset password error:', err)
      throw err
    }
  }

  const verifyEmail = async (email: string, captcha: string) => {
    try {
      const response = await userService.verifyEmail(email, captcha)
      if (user.value) {
        user.value.email = email
        storage.set(storageKeys.USER_INFO, user.value)
      }
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '验证邮箱失败'
      console.error('Verify email error:', err)
      throw err
    }
  }

  const verifyPhone = async (phone: string, captcha: string) => {
    try {
      const response = await userService.verifyPhone(phone, captcha)
      if (user.value) {
        user.value.phone = phone
        storage.set(storageKeys.USER_INFO, user.value)
      }
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '验证手机号失败'
      console.error('Verify phone error:', err)
      throw err
    }
  }

  const markMessageAsRead = async (messageId: string) => {
    try {
      await userService.markMessageAsRead(messageId)
      const message = messages.value.find(m => m.id === messageId)
      if (message) {
        message.isRead = true
        message.readTime = Date.now()
      }
    } catch (err) {
      console.error('Mark message as read error:', err)
    }
  }

  const markAllMessagesAsRead = async () => {
    try {
      await userService.markAllMessagesAsRead()
      messages.value.forEach(message => {
        message.isRead = true
        message.readTime = Date.now()
      })
    } catch (err) {
      console.error('Mark all messages as read error:', err)
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      await userService.deleteMessage(messageId)
      const index = messages.value.findIndex(m => m.id === messageId)
      if (index !== -1) {
        messages.value.splice(index, 1)
      }
    } catch (err) {
      console.error('Delete message error:', err)
    }
  }

  const submitFeedback = async (feedbackData: any) => {
    try {
      const response = await userService.submitFeedback(feedbackData)
      feedbacks.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '提交反馈失败'
      console.error('Submit feedback error:', err)
      throw err
    }
  }

  const updateDevice = async (deviceId: string, deviceData: any) => {
    try {
      const response = await userService.updateDevice(deviceId, deviceData)
      const index = devices.value.findIndex(d => d.id === deviceId)
      if (index !== -1) {
        devices.value[index] = response.data
      }
      return response.data
    } catch (err) {
      console.error('Update device error:', err)
      throw err
    }
  }

  const removeDevice = async (deviceId: string) => {
    try {
      await userService.removeDevice(deviceId)
      const index = devices.value.findIndex(d => d.id === deviceId)
      if (index !== -1) {
        devices.value.splice(index, 1)
      }
    } catch (err) {
      console.error('Remove device error:', err)
      throw err
    }
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    user.value = null
    profile.value = null
    settings.value = null
    devices.value = []
    loginHistory.value = []
    activities.value = []
    messages.value = []
    feedbacks.value = []
    token.value = ''
    refreshToken.value = ''
    isAuthenticated.value = false
    loading.value = false
    error.value = null
    lastLoginTime.value = 0
  }

  return {
    user,
    profile,
    settings,
    devices,
    loginHistory,
    activities,
    messages,
    feedbacks,
    token,
    refreshToken,
    isAuthenticated,
    loading,
    error,
    lastLoginTime,
    isLoggedIn,
    isVerified,
    isCertified,
    unreadMessages,
    unreadMessageCount,
    highPriorityMessages,
    activeDevices,
    recentLoginHistory,
    recentActivities,
    initialize,
    login,
    loginByPhone,
    logout,
    register,
    refreshTokenIfNeeded,
    fetchUserProfile,
    fetchUserSettings,
    fetchUserDevices,
    fetchLoginHistory,
    fetchUserActivities,
    fetchUserMessages,
    fetchUnreadMessages,
    fetchUserFeedbacks,
    updateUserProfile,
    updateUserSettings,
    changePassword,
    resetPassword,
    verifyEmail,
    verifyPhone,
    markMessageAsRead,
    markAllMessagesAsRead,
    deleteMessage,
    submitFeedback,
    updateDevice,
    removeDevice,
    clearError,
    reset
  }
})