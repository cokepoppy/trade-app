import axios from 'axios'
import type { 
  ApiResponse, 
  PaginationResult,
  NewsApiParams
} from '@/types/api'
import { storage } from '@/utils/storage'
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
    const token = storage.get('user_token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('[News API Request Error]', error)
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => {
    if (response.data.code !== 0) {
      const error = response.data.message || '资讯API请求失败'
      return Promise.reject(new Error(error))
    }
    
    return response
  },
  async (error) => {
    const appStore = useAppStore()
    
    if (error.response?.status === 401) {
      appStore.showError('登录已过期，请重新登录')
      const userStore = (await import('@/stores/useUserStore')).useUserStore()
      await userStore.logout()
      return Promise.reject(error)
    }
    
    if (error.response?.status === 404) {
      appStore.showError('资讯内容不存在')
      return Promise.reject(error)
    }
    
    if (error.response?.status === 500) {
      appStore.showError('资讯服务器错误')
      return Promise.reject(error)
    }
    
    const errorMessage = error.response?.data?.message || error.message || '网络请求失败'
    appStore.showError(errorMessage)
    
    return Promise.reject(error)
  }
)

export const newsService = {
  async getNewsList(params?: NewsApiParams): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/news', { params })
    return response.data
  },

  async getNewsDetail(newsId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/news/${newsId}`)
    return response.data
  },

  async getHotNews(params?: NewsApiParams): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/news/hot', { params })
    return response.data
  },

  async getLatestNews(params?: NewsApiParams): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/news/latest', { params })
    return response.data
  },

  async getNewsByCategory(category: string, params?: NewsApiParams): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get(`/news/category/${category}`, { params })
    return response.data
  },

  async getNewsByTag(tag: string, params?: NewsApiParams): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get(`/news/tag/${tag}`, { params })
    return response.data
  },

  async searchNews(keyword: string, params?: NewsApiParams): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/news/search', { 
      params: { keyword, ...params } 
    })
    return response.data
  },

  async getRelatedNews(newsId: string, params?: NewsApiParams): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get(`/news/${newsId}/related`, { params })
    return response.data
  },

  async getNewsComments(newsId: string, params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get(`/news/${newsId}/comments`, { params })
    return response.data
  },

  async addNewsComment(newsId: string, commentData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/news/${newsId}/comments`, commentData)
    return response.data
  },

  async deleteNewsComment(newsId: string, commentId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/news/${newsId}/comments/${commentId}`)
    return response.data
  },

  async likeNews(newsId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/news/${newsId}/like`)
    return response.data
  },

  async unlikeNews(newsId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/news/${newsId}/like`)
    return response.data
  },

  async bookmarkNews(newsId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/news/${newsId}/bookmark`)
    return response.data
  },

  async removeBookmarkNews(newsId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/news/${newsId}/bookmark`)
    return response.data
  },

  async shareNews(newsId: string, shareData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/news/${newsId}/share`, shareData)
    return response.data
  },

  async reportNews(newsId: string, reportData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/news/${newsId}/report`, reportData)
    return response.data
  },

  async getAnnouncements(params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/news/announcements', { params })
    return response.data
  },

  async getAnnouncementDetail(announcementId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/news/announcements/${announcementId}`)
    return response.data
  },

  async getAnnouncementsByStock(code: string, params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get(`/news/announcements/stock/${code}`, { params })
    return response.data
  },

  async getResearchReports(params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/news/research-reports', { params })
    return response.data
  },

  async getResearchReportDetail(reportId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/news/research-reports/${reportId}`)
    return response.data
  },

  async getResearchReportsByStock(code: string, params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get(`/news/research-reports/stock/${code}`, { params })
    return response.data
  },

  async getResearchReportsByInstitution(institution: string, params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get(`/news/research-reports/institution/${institution}`, { params })
    return response.data
  },

  async getNewsCategories(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/news/categories')
    return response.data
  },

  async getNewsTags(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/news/tags')
    return response.data
  },

  async getNewsSources(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/news/sources')
    return response.data
  },

  async getNewsStatistics(params?: any): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/news/statistics', { params })
    return response.data
  },

  async getNewsTrending(params?: any): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/news/trending', { params })
    return response.data
  },

  async getNewsRecommendations(params?: any): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/news/recommendations', { params })
    return response.data
  },

  async getBreakingNews(params?: any): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/news/breaking', { params })
    return response.data
  },

  async getNewsTimeline(params?: any): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/news/timeline', { params })
    return response.data
  },

  async getNewsByDate(date: string, params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get(`/news/date/${date}`, { params })
    return response.data
  },

  async getNewsArchive(params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/news/archive', { params })
    return response.data
  },

  async getNewsRssFeeds(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/news/rss-feeds')
    return response.data
  },

  async getNewsPushSettings(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/news/push-settings')
    return response.data
  },

  async updateNewsPushSettings(settings: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/news/push-settings', settings)
    return response.data
  },

  async getNewsSubscriptions(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/news/subscriptions')
    return response.data
  },

  async addNewsSubscription(subscriptionData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/news/subscriptions', subscriptionData)
    return response.data
  },

  async removeNewsSubscription(subscriptionId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/news/subscriptions/${subscriptionId}`)
    return response.data
  },

  async getNewsNotifications(params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/news/notifications', { params })
    return response.data
  },

  async markNewsNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/news/notifications/${notificationId}/read`)
    return response.data
  },

  async deleteNewsNotification(notificationId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/news/notifications/${notificationId}`)
    return response.data
  },

  async getNewsSearchHistory(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/news/search-history')
    return response.data
  },

  async addNewsSearchHistory(keyword: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/news/search-history', { keyword })
    return response.data
  },

  async clearNewsSearchHistory(): Promise<ApiResponse<any>> {
    const response = await apiClient.delete('/news/search-history')
    return response.data
  },

  async getNewsBookmarks(params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/news/bookmarks', { params })
    return response.data
  },

  async getNewsReadingHistory(params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get('/news/reading-history', { params })
    return response.data
  },

  async addNewsReadingHistory(newsId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/news/reading-history', { newsId })
    return response.data
  },

  async clearNewsReadingHistory(): Promise<ApiResponse<any>> {
    const response = await apiClient.delete('/news/reading-history')
    return response.data
  },

  async getNewsAnalytics(params?: any): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/news/analytics', { params })
    return response.data
  },

  async getNewsRecommendationSettings(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/news/recommendation-settings')
    return response.data
  },

  async updateNewsRecommendationSettings(settings: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/news/recommendation-settings', settings)
    return response.data
  },

  async getNewsFeedback(newsId: string, params?: any): Promise<ApiResponse<PaginationResult<any>>> {
    const response = await apiClient.get(`/news/${newsId}/feedback`, { params })
    return response.data
  },

  async submitNewsFeedback(newsId: string, feedbackData: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/news/${newsId}/feedback`, feedbackData)
    return response.data
  },

  async getNewsRatings(newsId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/news/${newsId}/ratings`)
    return response.data
  },

  async rateNews(newsId: string, rating: number): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/news/${newsId}/rate`, { rating })
    return response.data
  },

  async getNewsCommentsCount(newsId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/news/${newsId}/comments-count`)
    return response.data
  },

  async getNewsLikesCount(newsId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/news/${newsId}/likes-count`)
    return response.data
  },

  async getNewsSharesCount(newsId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/news/${newsId}/shares-count`)
    return response.data
  },

  async getNewsViewsCount(newsId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/news/${newsId}/views-count`)
    return response.data
  },

  async incrementNewsViews(newsId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/news/${newsId}/views`)
    return response.data
  },

  async getNewsEngagement(newsId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/news/${newsId}/engagement`)
    return response.data
  },

  async likeComment(newsId: string, commentId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/news/${newsId}/comments/${commentId}/like`)
    return response.data
  },

  async unlikeComment(newsId: string, commentId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/news/${newsId}/comments/${commentId}/like`)
    return response.data
  }
}