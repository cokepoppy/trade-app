<template>
  <view class="news-detail-page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <u-icon name="arrow-left" size="20" color="#333"></u-icon>
      </view>
      <view class="nav-title">资讯详情</view>
      <view class="nav-right">
        <u-icon name="share" size="20" color="#333" @click="shareNews"></u-icon>
      </view>
    </view>

    <!-- 文章内容 -->
    <scroll-view scroll-y class="content-scroll">
      <!-- 文章标题 -->
      <view class="article-header">
        <text class="article-title">{{ newsDetail.title }}</text>
        <view class="article-meta">
          <view class="meta-item">
            <text class="source">{{ newsDetail.source }}</text>
            <text class="time">{{ formatTime(newsDetail.publishTime) }}</text>
          </view>
          <view class="meta-item">
            <text class="read-count">{{ newsDetail.readCount || 0 }}阅读</text>
            <text v-if="newsDetail.commentCount" class="comment-count">{{ newsDetail.commentCount }}评论</text>
          </view>
        </view>
        <view v-if="newsDetail.tags" class="article-tags">
          <view 
            v-for="tag in newsDetail.tags" 
            :key="tag" 
            class="tag"
            @click="searchByTag(tag)"
          >
            {{ tag }}
          </view>
        </view>
      </view>

      <!-- 文章正文 -->
      <view class="article-content">
        <rich-text :nodes="newsDetail.content"></rich-text>
      </view>

      <!-- 相关股票 -->
      <view v-if="relatedStocks.length > 0" class="related-stocks">
        <view class="section-title">相关股票</view>
        <view class="stock-list">
          <view 
            v-for="stock in relatedStocks" 
            :key="stock.code"
            class="stock-item"
            @click="goToStockDetail(stock.code)"
          >
            <view class="stock-info">
              <text class="stock-name">{{ stock.name }}</text>
              <text class="stock-code">{{ stock.code }}</text>
            </view>
            <view class="stock-price" :class="{ 'up': stock.change > 0, 'down': stock.change < 0 }">
              <text class="price">{{ stock.price }}</text>
              <text class="change">{{ stock.changePercent }}%</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 相关资讯 -->
      <view v-if="relatedNews.length > 0" class="related-news">
        <view class="section-title">相关资讯</view>
        <view class="related-news-list">
          <view 
            v-for="news in relatedNews" 
            :key="news.id"
            class="related-news-item"
            @click="goToDetail(news.id)"
          >
            <text class="related-news-title">{{ news.title }}</text>
            <text class="related-news-time">{{ formatTime(news.publishTime) }}</text>
          </view>
        </view>
      </view>

      <!-- 评论区 -->
      <view class="comments-section">
        <view class="section-title">
          评论 ({{ newsDetail.commentCount || 0 }})
        </view>
        
        <!-- 评论输入框 -->
        <view class="comment-input">
          <u-input 
            v-model="commentText"
            placeholder="写下你的评论..."
            border="none"
            :maxlength="500"
          ></u-input>
          <u-button 
            type="primary" 
            size="mini"
            :disabled="!commentText.trim()"
            @click="submitComment"
          >
            发送
          </u-button>
        </view>

        <!-- 评论列表 -->
        <view v-if="comments.length > 0" class="comments-list">
          <view v-for="comment in comments" :key="comment.id" class="comment-item">
            <view class="comment-header">
              <image :src="comment.userAvatar" class="user-avatar"></image>
              <view class="comment-info">
                <text class="user-name">{{ comment.userName }}</text>
                <text class="comment-time">{{ formatTime(comment.createTime) }}</text>
              </view>
            </view>
            <view class="comment-content">{{ comment.content }}</view>
            <view class="comment-actions">
              <view class="action-item" @click="likeComment(comment)">
                <u-icon 
                  :name="comment.isLiked ? 'heart-fill' : 'heart'" 
                  size="16" 
                  :color="comment.isLiked ? '#ff3b30' : '#999'"
                ></u-icon>
                <text :class="{ 'liked': comment.isLiked }">{{ comment.likeCount || 0 }}</text>
              </view>
              <view class="action-item" @click="replyComment(comment)">
                <u-icon name="chat" size="16" color="#999"></u-icon>
                <text>回复</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空评论 -->
        <view v-else class="empty-comments">
          <u-empty-state 
            mode="comment" 
            icon="http://cdn.uviewui.com/uview/empty/comment.png"
            text="暂无评论"
          ></u-empty-state>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="action-item" @click="toggleLike">
        <u-icon 
          :name="newsDetail.isLiked ? 'heart-fill' : 'heart'" 
          size="20" 
          :color="newsDetail.isLiked ? '#ff3b30' : '#666'"
        ></u-icon>
        <text :class="{ 'liked': newsDetail.isLiked }">{{ newsDetail.likeCount || 0 }}</text>
      </view>
      <view class="action-item" @click="toggleBookmark">
        <u-icon 
          :name="newsDetail.isBookmarked ? 'star-fill' : 'star'" 
          size="20" 
          :color="newsDetail.isBookmarked ? '#ff9500' : '#666'"
        ></u-icon>
        <text :class="{ 'bookmarked': newsDetail.isBookmarked }">收藏</text>
      </view>
      <view class="action-item" @click="scrollToComments">
        <u-icon name="chat" size="20" color="#666"></u-icon>
        <text>{{ newsDetail.commentCount || 0 }}</text>
      </view>
      <view class="action-item" @click="shareNews">
        <u-icon name="share" size="20" color="#666"></u-icon>
        <text>分享</text>
      </view>
    </view>

    <!-- 分享弹窗 -->
    <u-popup v-model="showSharePopup" mode="bottom" border-radius="20">
      <view class="share-popup">
        <view class="share-title">分享到</view>
        <view class="share-options">
          <view class="share-option" @click="shareToWechat">
            <u-icon name="weixin-fill" size="24" color="#07c160"></u-icon>
            <text>微信</text>
          </view>
          <view class="share-option" @click="shareToWechatMoment">
            <u-icon name="moments" size="24" color="#07c160"></u-icon>
            <text>朋友圈</text>
          </view>
          <view class="share-option" @click="shareToWeibo">
            <u-icon name="weibo" size="24" color="#ff8200"></u-icon>
            <text>微博</text>
          </view>
          <view class="share-option" @click="copyLink">
            <u-icon name="link" size="24" color="#666"></u-icon>
            <text>复制链接</text>
          </view>
        </view>
        <view class="share-cancel" @click="showSharePopup = false">取消</view>
      </view>
    </u-popup>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { newsService } from '@/services/newsService'
import { formatTime } from '@/utils/format'
import { useAppStore } from '@/stores/useAppStore'

const appStore = useAppStore()

// 页面参数
const newsId = ref('')

// 文章详情
const newsDetail = ref<any>({})
const relatedStocks = ref<any[]>([])
const relatedNews = ref<any[]>([])
const comments = ref<any[]>([])

// 评论相关
const commentText = ref('')
const loading = ref(false)

// 分享相关
const showSharePopup = ref(false)

// 页面加载
onLoad((options) => {
  newsId.value = options?.id || ''
  if (newsId.value) {
    loadNewsDetail()
    loadRelatedStocks()
    loadRelatedNews()
    loadComments()
    incrementViews()
  }
})

// 加载文章详情
const loadNewsDetail = async () => {
  try {
    const response = await newsService.getNewsDetail(newsId.value)
    newsDetail.value = response.data
  } catch (error) {
    console.error('加载文章详情失败:', error)
    appStore.showError('加载文章详情失败')
  }
}

// 加载相关股票
const loadRelatedStocks = async () => {
  try {
    const response = await newsService.getRelatedNews(newsId.value, { type: 'stocks' })
    relatedStocks.value = response.data || []
  } catch (error) {
    console.error('加载相关股票失败:', error)
  }
}

// 加载相关资讯
const loadRelatedNews = async () => {
  try {
    const response = await newsService.getRelatedNews(newsId.value, { type: 'news' })
    relatedNews.value = response.data || []
  } catch (error) {
    console.error('加载相关资讯失败:', error)
  }
}

// 加载评论
const loadComments = async () => {
  try {
    const response = await newsService.getNewsComments(newsId.value, { page: 1, pageSize: 20 })
    comments.value = response.data.list || []
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

// 增加阅读量
const incrementViews = async () => {
  try {
    await newsService.incrementNewsViews(newsId.value)
  } catch (error) {
    console.error('增加阅读量失败:', error)
  }
}

// 提交评论
const submitComment = async () => {
  if (!commentText.value.trim()) return
  
  try {
    loading.value = true
    await newsService.addNewsComment(newsId.value, { content: commentText.value })
    
    // 刷新评论列表
    await loadComments()
    
    // 更新评论数量
    newsDetail.value.commentCount = (newsDetail.value.commentCount || 0) + 1
    
    // 清空输入框
    commentText.value = ''
    
    appStore.showSuccess('评论发表成功')
  } catch (error) {
    console.error('提交评论失败:', error)
    appStore.showError('评论发表失败')
  } finally {
    loading.value = false
  }
}

// 点赞评论
const likeComment = async (comment: any) => {
  try {
    if (comment.isLiked) {
      await newsService.unlikeComment(newsId.value, comment.id)
      comment.isLiked = false
      comment.likeCount = Math.max(0, (comment.likeCount || 0) - 1)
    } else {
      await newsService.likeComment(newsId.value, comment.id)
      comment.isLiked = true
      comment.likeCount = (comment.likeCount || 0) + 1
    }
  } catch (error) {
    console.error('点赞评论失败:', error)
  }
}

// 回复评论
const replyComment = (comment: any) => {
  commentText.value = `@${comment.userName} `
  // 聚焦到输入框
}

// 点赞文章
const toggleLike = async () => {
  try {
    if (newsDetail.value.isLiked) {
      await newsService.unlikeNews(newsId.value)
      newsDetail.value.isLiked = false
      newsDetail.value.likeCount = Math.max(0, (newsDetail.value.likeCount || 0) - 1)
    } else {
      await newsService.likeNews(newsId.value)
      newsDetail.value.isLiked = true
      newsDetail.value.likeCount = (newsDetail.value.likeCount || 0) + 1
    }
  } catch (error) {
    console.error('点赞文章失败:', error)
  }
}

// 收藏文章
const toggleBookmark = async () => {
  try {
    if (newsDetail.value.isBookmarked) {
      await newsService.removeBookmarkNews(newsId.value)
      newsDetail.value.isBookmarked = false
      appStore.showSuccess('已取消收藏')
    } else {
      await newsService.bookmarkNews(newsId.value)
      newsDetail.value.isBookmarked = true
      appStore.showSuccess('收藏成功')
    }
  } catch (error) {
    console.error('收藏文章失败:', error)
  }
}

// 滚动到评论区
const scrollToComments = () => {
  uni.pageScrollTo({
    selector: '.comments-section',
    duration: 300
  })
}

// 分享文章
const shareNews = () => {
  showSharePopup.value = true
}

// 分享到微信
const shareToWechat = () => {
  uni.shareWithSystem({
    type: 'text',
    summary: newsDetail.value.title,
    success: () => {
      appStore.showSuccess('分享成功')
    }
  })
  showSharePopup.value = false
}

// 分享到朋友圈
const shareToWechatMoment = () => {
  uni.shareWithSystem({
    type: 'text',
    summary: newsDetail.value.title,
    success: () => {
      appStore.showSuccess('分享成功')
    }
  })
  showSharePopup.value = false
}

// 分享到微博
const shareToWeibo = () => {
  uni.shareWithSystem({
    type: 'text',
    summary: newsDetail.value.title,
    success: () => {
      appStore.showSuccess('分享成功')
    }
  })
  showSharePopup.value = false
}

// 复制链接
const copyLink = () => {
  uni.setClipboardData({
    data: `${window.location.origin}/news/${newsId.value}`,
    success: () => {
      appStore.showSuccess('链接已复制')
    }
  })
  showSharePopup.value = false
}

// 按标签搜索
const searchByTag = (tag: string) => {
  uni.navigateTo({
    url: `/pages/news/search?keyword=${encodeURIComponent(tag)}`
  })
}

// 跳转到股票详情
const goToStockDetail = (code: string) => {
  uni.navigateTo({
    url: `/pages/market/detail?code=${code}`
  })
}

// 跳转到其他文章
const goToDetail = (id: string) => {
  uni.redirectTo({
    url: `/pages/news/detail?id=${id}`
  })
}

// 返回
const goBack = () => {
  uni.navigateBack()
}

// 小程序分享
onShareAppMessage(() => {
  return {
    title: newsDetail.value.title,
    path: `/pages/news/detail?id=${newsId.value}`,
    imageUrl: newsDetail.value.coverImage
  }
})
</script>

<style lang="scss" scoped>
.news-detail-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
  
  .nav-left, .nav-right {
    width: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .nav-title {
    font-size: 32rpx;
    font-weight: 500;
    color: #333;
  }
}

.content-scroll {
  flex: 1;
  padding-bottom: 100rpx;
}

.article-header {
  padding: 32rpx;
  border-bottom: 1rpx solid #eee;
  
  .article-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    line-height: 1.4;
    margin-bottom: 24rpx;
  }
  
  .article-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 16rpx;
      font-size: 24rpx;
      color: #999;
    }
  }
  
  .article-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    
    .tag {
      padding: 8rpx 16rpx;
      background-color: #f0f0f0;
      color: #666;
      font-size: 24rpx;
      border-radius: 16rpx;
    }
  }
}

.article-content {
  padding: 32rpx;
  line-height: 1.6;
  color: #333;
  font-size: 30rpx;
}

.related-stocks, .related-news {
  margin: 32rpx;
  padding: 24rpx;
  background-color: #f8f8f8;
  border-radius: 16rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    margin-bottom: 24rpx;
    color: #333;
  }
}

.stock-list {
  .stock-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #eee;
    
    &:last-child {
      border-bottom: none;
    }
    
    .stock-info {
      .stock-name {
        font-size: 28rpx;
        font-weight: 500;
        color: #333;
        margin-right: 16rpx;
      }
      
      .stock-code {
        font-size: 24rpx;
        color: #999;
      }
    }
    
    .stock-price {
      text-align: right;
      
      .price {
        font-size: 28rpx;
        font-weight: 500;
        margin-right: 8rpx;
      }
      
      .change {
        font-size: 24rpx;
      }
      
      &.up {
        .price, .change {
          color: #ff3b30;
        }
      }
      
      &.down {
        .price, .change {
          color: #07c160;
        }
      }
    }
  }
}

.related-news-list {
  .related-news-item {
    padding: 16rpx 0;
    border-bottom: 1rpx solid #eee;
    
    &:last-child {
      border-bottom: none;
    }
    
    .related-news-title {
      font-size: 28rpx;
      color: #333;
      margin-bottom: 8rpx;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .related-news-time {
      font-size: 24rpx;
      color: #999;
    }
  }
}

.comments-section {
  margin: 32rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    margin-bottom: 24rpx;
    color: #333;
  }
  
  .comment-input {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 20rpx;
    background-color: #f8f8f8;
    border-radius: 32rpx;
    margin-bottom: 32rpx;
  }
  
  .comments-list {
    .comment-item {
      padding: 24rpx 0;
      border-bottom: 1rpx solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      .comment-header {
        display: flex;
        align-items: center;
        margin-bottom: 16rpx;
        
        .user-avatar {
          width: 64rpx;
          height: 64rpx;
          border-radius: 50%;
          margin-right: 16rpx;
        }
        
        .comment-info {
          .user-name {
            font-size: 28rpx;
            font-weight: 500;
            color: #333;
            margin-right: 16rpx;
          }
          
          .comment-time {
            font-size: 24rpx;
            color: #999;
          }
        }
      }
      
      .comment-content {
        font-size: 28rpx;
        color: #333;
        line-height: 1.5;
        margin-bottom: 16rpx;
      }
      
      .comment-actions {
        display: flex;
        gap: 32rpx;
        
        .action-item {
          display: flex;
          align-items: center;
          gap: 8rpx;
          font-size: 24rpx;
          color: #999;
          
          &.liked {
            color: #ff3b30;
          }
        }
      }
    }
  }
  
  .empty-comments {
    padding: 80rpx 0;
    text-align: center;
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  display: flex;
  justify-content: space-around;
  padding: 16rpx 0;
  
  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;
    
    text {
      font-size: 24rpx;
      color: #666;
      
      &.liked {
        color: #ff3b30;
      }
      
      &.bookmarked {
        color: #ff9500;
      }
    }
  }
}

.share-popup {
  padding: 32rpx;
  
  .share-title {
    text-align: center;
    font-size: 32rpx;
    font-weight: 500;
    margin-bottom: 32rpx;
  }
  
  .share-options {
    display: flex;
    justify-content: space-around;
    margin-bottom: 32rpx;
    
    .share-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8rpx;
      
      text {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
  
  .share-cancel {
    text-align: center;
    padding: 20rpx;
    background-color: #f8f8f8;
    border-radius: 32rpx;
    font-size: 28rpx;
    color: #666;
  }
}
</style>