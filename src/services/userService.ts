import axios from 'axios'
import type { 
  User, 
  UserProfile, 
  UserSettings, 
  UserDevice,
  UserLoginHistory,
  UserActivity,
  UserMessage,
  UserFeedback,
  ApiResponse,
  PaginationResult
} from '@/types'
import { storage, storageKeys } from '@/utils/storage'
import { useAppStore } from '@/stores/useAppStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'TradeApp/1.0.0'
  },
  withCredentials: true
})

apiClient.interceptors.request.use(
  (config) => {
    const token = storage.get(storageKeys.USER_TOKEN)
    console.log('[DEBUG] Token from storage:', token ? 'Token exists' : 'No token found')
    console.log('[DEBUG] Storage keys available:', Object.keys(storage.getAll()))
    console.log('[DEBUG] Raw token value from storage:', storage.get(storageKeys.USER_TOKEN))
    console.log('[DEBUG] Token type:', typeof storage.get(storageKeys.USER_TOKEN))
    console.log('[DEBUG] Direct storage access:', uni.getStorageSync(storageKeys.USER_TOKEN))
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('[DEBUG] Authorization header set:', config.headers.Authorization)
    } else {
      console.log('[DEBUG] No token available for request to:', config.url)
    }
    
    return config
  },
  (error) => {
    console.error('[User API Request Error]', error)
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => {
    if (response.data.code !== 0) {
      const error = response.data.message || '用户API请求失败'
      return Promise.reject(new Error(error))
    }
    
    return response
  },
  async (error) => {
    const appStore = useAppStore()
    
    if (error.response?.status === 401) {
      appStore.showError('登录已过期，请重新登录')
      return Promise.reject(error)
    }
    
    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.message || '请求参数错误'
      appStore.showError(errorMessage)
      return Promise.reject(error)
    }
    
    if (error.response?.status === 409) {
      const errorMessage = error.response?.data?.message || '操作冲突'
      appStore.showError(errorMessage)
      return Promise.reject(error)
    }
    
    if (error.response?.status === 500) {
      appStore.showError('服务器内部错误')
      return Promise.reject(error)
    }
    
    const errorMessage = error.response?.data?.message || error.message || '网络请求失败'
    appStore.showError(errorMessage)
    
    return Promise.reject(error)
  }
)

export const userService = {
  async login(loginData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/login', loginData)
    return response.data
  },

  async loginByPhone(phone: string, smsCode: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/login-by-phone', { phone, smsCode })
    return response.data
  },

  async getCaptcha(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/user/captcha')
    return response.data
  },

  async logout(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/logout')
    return response.data
  },

  async register(registerData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/register', registerData)
    return response.data
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/refresh-token', { refreshToken })
    return response.data
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await apiClient.get('/user/current')
    return response.data
  },

  async updateUserProfile(profileData: any): Promise<ApiResponse<User>> {
    const response = await apiClient.put('/user/profile', profileData)
    return response.data
  },

  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.get('/user/profile')
    return response.data
  },

  async updateUserProfileDetail(profileData: any): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.put('/user/profile/detail', profileData)
    return response.data
  },

  async getUserSettings(): Promise<ApiResponse<UserSettings>> {
    const response = await apiClient.get('/user/settings')
    return response.data
  },

  async updateUserSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    const response = await apiClient.put('/user/settings', settings)
    return response.data
  },

  async changePassword(passwordData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/change-password', passwordData)
    return response.data
  },

  async resetPassword(resetData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/reset-password', resetData)
    return response.data
  },

  async verifyEmail(email: string, captcha: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/verify-email', { email, captcha })
    return response.data
  },

  async verifyPhone(phone: string, captcha: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/verify-phone', { phone, captcha })
    return response.data
  },

  async sendEmailCaptcha(email: string, purpose: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/send-email-captcha', { email, purpose })
    return response.data
  },

  async sendPhoneCaptcha(phone: string, purpose: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/send-phone-captcha', { phone, purpose })
    return response.data
  },

  async getUserDevices(): Promise<ApiResponse<UserDevice[]>> {
    const response = await apiClient.get('/user/devices')
    return response.data
  },

  async updateDevice(deviceId: string, deviceData: any): Promise<ApiResponse<UserDevice>> {
    const response = await apiClient.put(`/user/devices/${deviceId}`, deviceData)
    return response.data
  },

  async removeDevice(deviceId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/user/devices/${deviceId}`)
    return response.data
  },

  async getLoginHistory(params?: any): Promise<ApiResponse<PaginationResult<UserLoginHistory>>> {
    const response = await apiClient.get('/user/login-history', { params })
    return response.data
  },

  async getUserActivities(params?: any): Promise<ApiResponse<PaginationResult<UserActivity>>> {
    const response = await apiClient.get('/user/activities', { params })
    return response.data
  },

  async getUserMessages(params?: any): Promise<ApiResponse<PaginationResult<UserMessage>>> {
    const response = await apiClient.get('/user/messages', { params })
    return response.data
  },

  async getMessage(messageId: string): Promise<ApiResponse<UserMessage>> {
    const response = await apiClient.get(`/user/messages/${messageId}`)
    return response.data
  },

  async markMessageAsRead(messageId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/user/messages/${messageId}/read`)
    return response.data
  },

  async markAllMessagesAsRead(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/messages/mark-all-read')
    return response.data
  },

  async deleteMessage(messageId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/user/messages/${messageId}`)
    return response.data
  },

  async getUnreadMessages(): Promise<ApiResponse<UserMessage[]>> {
    const response = await apiClient.get('/user/messages/unread')
    return response.data
  },

  async getUserFeedbacks(params?: any): Promise<ApiResponse<PaginationResult<UserFeedback>>> {
    const response = await apiClient.get('/user/feedbacks', { params })
    return response.data
  },

  async submitFeedback(feedbackData: any): Promise<ApiResponse<UserFeedback>> {
    const response = await apiClient.post('/user/feedbacks', feedbackData)
    return response.data
  },

  async updateFeedback(feedbackId: string, feedbackData: any): Promise<ApiResponse<UserFeedback>> {
    const response = await apiClient.put(`/user/feedbacks/${feedbackId}`, feedbackData)
    return response.data
  },

  async deleteFeedback(feedbackId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/user/feedbacks/${feedbackId}`)
    return response.data
  },

  async getUserReports(params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/user/reports', { params })
    return response.data
  },

  async generateReport(reportData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/reports/generate', reportData)
    return response.data
  },

  async getReport(reportId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/user/reports/${reportId}`)
    return response.data
  },

  async downloadReport(reportId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/user/reports/${reportId}/download`)
    return response.data
  },

  async getUserPreferences(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/user/preferences')
    return response.data
  },

  async updateUserPreference(key: string, value: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/user/preferences/${key}`, { value })
    return response.data
  },

  async deleteUserPreference(key: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/user/preferences/${key}`)
    return response.data
  },

  async uploadAvatar(filePath: string): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', filePath)
    
    const response = await apiClient.post('/user/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  async runSecurityCheck(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/security-check')
    return response.data
  },

  async uploadFile(file: File, type: string): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    const response = await apiClient.post('/user/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  async deleteFile(fileId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/user/files/${fileId}`)
    return response.data
  },

  async getUserFiles(params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/user/files', { params })
    return response.data
  },

  async getUserNotifications(params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/user/notifications', { params })
    return response.data
  },

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/user/notifications/${notificationId}/read`)
    return response.data
  },

  async deleteNotification(notificationId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/user/notifications/${notificationId}`)
    return response.data
  },

  async getUserSubscriptions(params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/user/subscriptions', { params })
    return response.data
  },

  async addSubscription(subscriptionData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/subscriptions', subscriptionData)
    return response.data
  },

  async removeSubscription(subscriptionId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/user/subscriptions/${subscriptionId}`)
    return response.data
  },

  async getUserBookmarks(params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/user/bookmarks', { params })
    return response.data
  },

  async addBookmark(bookmarkData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/bookmarks', bookmarkData)
    return response.data
  },

  async removeBookmark(bookmarkId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/user/bookmarks/${bookmarkId}`)
    return response.data
  },

  async getUserSearchHistory(params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/user/search-history', { params })
    return response.data
  },

  async addSearchHistory(searchData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/search-history', searchData)
    return response.data
  },

  async clearSearchHistory(): Promise<ApiResponse<any>> {
    const response = await apiClient.delete('/user/search-history')
    return response.data
  },

  async getUserStatistics(params?: any): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/user/statistics', { params })
    return response.data
  },

  async getUserAnalytics(params?: any): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/user/analytics', { params })
    return response.data
  },

  async deactivateAccount(reason: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/deactivate', { reason })
    return response.data
  },

  async reactivateAccount(code: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/reactivate', { code })
    return response.data
  },

  async deleteAccount(password: string, reason: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/delete-account', { password, reason })
    return response.data
  },

  async getUserSecuritySettings(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/user/security-settings')
    return response.data
  },

  async updateSecuritySettings(settings: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/user/security-settings', settings)
    return response.data
  },

  async enableTwoFactorAuth(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/enable-2fa')
    return response.data
  },

  async disableTwoFactorAuth(code: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/disable-2fa', { code })
    return response.data
  },

  async verifyTwoFactorAuth(code: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/verify-2fa', { code })
    return response.data
  },

  async getBackupCodes(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/user/backup-codes')
    return response.data
  },

  async regenerateBackupCodes(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/regenerate-backup-codes')
    return response.data
  },

  async getUserPrivacySettings(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/user/privacy-settings')
    return response.data
  },

  async updatePrivacySettings(settings: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/user/privacy-settings', settings)
    return response.data
  },

  async exportUserData(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/user/export-data')
    return response.data
  },

  async downloadUserData(exportId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/user/download-data/${exportId}`)
    return response.data
  }
}