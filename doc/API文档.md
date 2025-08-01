# API 文档

## 概述

本文档描述了 uni-app 股票交易应用程序的完整 API 接口规范。API 基于 RESTful 设计，使用 JSON 格式进行数据交换。

### 基本信息

- **基础 URL**: `https://api.example.com/api` (或通过环境变量 `VITE_API_BASE_URL` 配置)
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8
- **超时时间**: 10秒

### 通用响应格式

```typescript
interface ApiResponse<T = any> {
  code: number;        // 状态码，0 表示成功
  message: string;     // 响应消息
  data: T;            // 响应数据
  timestamp: number;  // 时间戳
  traceId?: string;   // 追踪ID
}
```

### 通用请求头

```
Content-Type: application/json
User-Agent: TradeApp/1.0.0
Authorization: Bearer {token}
```

### 错误码规范

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 1. 用户模块 API

### 1.1 认证相关

#### 登录
- **路径**: `/user/login`
- **方法**: POST
- **请求头**: 
  ```
  Content-Type: application/json
  ```
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string",
    "captcha": "string (可选)",
    "deviceInfo": {
      "deviceId": "string",
      "deviceType": "string",
      "deviceName": "string",
      "platform": "string",
      "osVersion": "string",
      "appVersion": "string",
      "ip": "string",
      "location": "string"
    } (可选)
  }
  ```
- **响应**:
  ```json
  {
    "code": 0,
    "message": "登录成功",
    "data": {
      "token": "string",
      "refreshToken": "string",
      "expiresIn": 7200,
      "userInfo": {
        "id": "string",
        "username": "string",
        "nickname": "string",
        "email": "string",
        "phone": "string",
        "avatar": "string",
        "status": "active"
      },
      "permissions": ["string"],
      "settings": {}
    },
    "timestamp": 1234567890
  }
  ```

#### 注册
- **路径**: `/user/register`
- **方法**: POST
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string",
    "email": "string",
    "phone": "string",
    "captcha": "string",
    "deviceInfo": {} (可选)
  }
  ```

#### 刷新Token
- **路径**: `/user/refresh-token`
- **方法**: POST
- **请求体**:
  ```json
  {
    "refreshToken": "string"
  }
  ```

#### 登出
- **路径**: `/user/logout`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

### 1.2 用户信息

#### 获取当前用户信息
- **路径**: `/user/current`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 更新用户资料
- **路径**: `/user/profile`
- **方法**: PUT
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "nickname": "string",
    "avatar": "string",
    "gender": "male|female|other",
    "birthday": "string",
    "address": "string",
    "occupation": "string",
    "education": "string",
    "income": "string"
  }
  ```

#### 获取用户详细资料
- **路径**: `/user/profile`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 1.3 密码管理

#### 修改密码
- **路径**: `/user/change-password`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "oldPassword": "string",
    "newPassword": "string",
    "confirmPassword": "string",
    "captcha": "string (可选)"
  }
  ```

#### 重置密码
- **路径**: `/user/reset-password`
- **方法**: POST
- **请求体**:
  ```json
  {
    "email": "string",
    "phone": "string",
    "captcha": "string",
    "newPassword": "string",
    "confirmPassword": "string"
  }
  ```

### 1.4 验证码

#### 发送邮箱验证码
- **路径**: `/user/send-email-captcha`
- **方法**: POST
- **请求体**:
  ```json
  {
    "email": "string",
    "purpose": "register|login|reset_password|verify_email|verify_phone"
  }
  ```

#### 发送手机验证码
- **路径**: `/user/send-phone-captcha`
- **方法**: POST
- **请求体**:
  ```json
  {
    "phone": "string",
    "purpose": "register|login|reset_password|verify_email|verify_phone"
  }
  ```

#### 验证邮箱
- **路径**: `/user/verify-email`
- **方法**: POST
- **请求体**:
  ```json
  {
    "email": "string",
    "captcha": "string"
  }
  ```

#### 验证手机
- **路径**: `/user/verify-phone`
- **方法**: POST
- **请求体**:
  ```json
  {
    "phone": "string",
    "captcha": "string"
  }
  ```

### 1.5 设备管理

#### 获取用户设备列表
- **路径**: `/user/devices`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 更新设备信息
- **路径**: `/user/devices/{deviceId}`
- **方法**: PUT
- **请求头**: `Authorization: Bearer {token}`

#### 移除设备
- **路径**: `/user/devices/{deviceId}`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

### 1.6 用户设置

#### 获取用户设置
- **路径**: `/user/settings`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 更新用户设置
- **路径**: `/user/settings`
- **方法**: PUT
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "theme": "light|dark|auto",
    "language": "zh-CN|en-US",
    "notification": {
      "email": true,
      "sms": true,
      "push": true,
      "orderNotification": true,
      "dealNotification": true,
      "positionNotification": true,
      "fundNotification": true,
      "newsNotification": true,
      "marketNotification": true,
      "marketingNotification": true,
      "quietHours": {
        "enabled": true,
        "startTime": "22:00",
        "endTime": "08:00"
      }
    },
    "privacy": {
      "profileVisibility": "public|friends|private",
      "tradingVisibility": "public|friends|private",
      "allowSearch": true,
      "allowMessage": true,
      "allowRecommendation": true,
      "dataCollection": true,
      "personalizedAds": true,
      "privacyMode": true,
      "locationEnabled": true,
      "analyticsEnabled": true
    },
    "security": {
      "twoFactorAuth": true,
      "loginAlert": true,
      "tradePassword": true,
      "deviceBinding": true,
      "autoLock": true,
      "lockTimeout": 300,
      "biometricAuth": true
    },
    "trading": {
      "defaultAccount": "string",
      "defaultPriceType": "market|limit",
      "defaultVolume": 100,
      "quickTrade": true,
      "confirmTrade": true,
      "showAdvancedOptions": true,
      "autoSaveOrder": true,
      "riskWarning": true,
      "commissionDisplay": true,
      "fingerprintTrade": true
    },
    "display": {
      "defaultPage": "string",
      "watchlistDisplay": "list|grid",
      "chartStyle": "candlestick|line|area",
      "chartIndicators": ["string"],
      "priceDisplay": "price|change|percent",
      "volumeDisplay": true,
      "marketDepth": true,
      "customColumns": ["string"],
      "hideAsset": true,
      "noImageMode": true
    }
  }
  ```

### 1.7 消息管理

#### 获取用户消息列表
- **路径**: `/user/messages`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  page: number (默认1)
  pageSize: number (默认20)
  type: string (可选)
  status: string (可选)
  ```

#### 获取消息详情
- **路径**: `/user/messages/{messageId}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 标记消息为已读
- **路径**: `/user/messages/{messageId}/read`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

#### 标记所有消息为已读
- **路径**: `/user/messages/mark-all-read`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

#### 删除消息
- **路径**: `/user/messages/{messageId}`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

#### 获取未读消息
- **路径**: `/user/messages/unread`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 1.8 反馈管理

#### 获取用户反馈列表
- **路径**: `/user/feedbacks`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

#### 提交反馈
- **路径**: `/user/feedbacks`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "type": "bug|feature|improvement|complaint|suggestion",
    "title": "string",
    "content": "string",
    "attachments": ["string"] (可选)
  }
  ```

#### 更新反馈
- **路径**: `/user/feedbacks/{feedbackId}`
- **方法**: PUT
- **请求头**: `Authorization: Bearer {token}`

#### 删除反馈
- **路径**: `/user/feedbacks/{feedbackId}`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

### 1.9 安全设置

#### 运行安全检查
- **路径**: `/user/security-check`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

#### 启用双因子认证
- **路径**: `/user/enable-2fa`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

#### 禁用双因子认证
- **路径**: `/user/disable-2fa`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "code": "string"
  }
  ```

#### 验证双因子认证
- **路径**: `/user/verify-2fa`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "code": "string"
  }
  ```

#### 获取备份码
- **路径**: `/user/backup-codes`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 重新生成备份码
- **路径**: `/user/regenerate-backup-codes`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

### 1.10 文件上传

#### 上传头像
- **路径**: `/user/upload-avatar`
- **方法**: POST
- **请求头**: 
  ```
  Authorization: Bearer {token}
  Content-Type: multipart/form-data
  ```
- **请求体**: FormData (file字段)

#### 上传文件
- **路径**: `/user/upload-file`
- **方法**: POST
- **请求头**: 
  ```
  Authorization: Bearer {token}
  Content-Type: multipart/form-data
  ```
- **请求体**: FormData (file和type字段)

#### 删除文件
- **路径**: `/user/files/{fileId}`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

#### 获取用户文件列表
- **路径**: `/user/files`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 1.11 历史记录

#### 获取用户登录历史
- **路径**: `/user/login-history`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  page: number (可选，默认1)
  pageSize: number (可选，默认20)
  startDate: string (可选，格式YYYY-MM-DD)
  endDate: string (可选，格式YYYY-MM-DD)
  ```
- **响应**:
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": {
      "list": [
        {
          "id": "string",
          "loginTime": 1640995200000,
          "logoutTime": 1640998800000,
          "deviceInfo": {
            "deviceId": "string",
            "deviceType": "string",
            "deviceName": "string",
            "platform": "string",
            "osVersion": "string",
            "appVersion": "string",
            "ip": "string",
            "location": "string"
          },
          "sessionDuration": 3600,
          "status": "success|failed"
        }
      ],
      "total": 100,
      "page": 1,
      "pageSize": 20
    }
  }
  ```

#### 获取用户活动记录
- **路径**: `/user/activities`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  page: number (可选，默认1)
  pageSize: number (可选，默认20)
  type: string (可选，login|trade|view|search|download)
  startDate: string (可选，格式YYYY-MM-DD)
  endDate: string (可选，格式YYYY-MM-DD)
  ```
- **响应**:
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": {
      "list": [
        {
          "id": "string",
          "type": "login|trade|view|search|download",
          "action": "string",
          "description": "string",
          "timestamp": 1640995200000,
          "ip": "string",
          "deviceInfo": {},
          "metadata": {}
        }
      ],
      "total": 100,
      "page": 1,
      "pageSize": 20
    }
  }
  ```

---

## 2. 市场模块 API

### 2.1 市场状态

#### 获取市场状态
- **路径**: `/market/status`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": {
      "isTradingDay": true,
      "isTradingTime": true,
      "marketPhase": "open",
      "nextTradingDay": "2024-01-02",
      "previousTradingDay": "2023-12-29",
      "tradingDaysThisMonth": 20,
      "tradingDaysThisYear": 240,
      "holidays": [
        {
          "date": "2024-01-01",
          "name": "元旦",
          "description": "新年假期",
          "affectedMarkets": ["SH", "SZ"]
        }
      ]
    }
  }
  ```

### 2.2 指数数据

#### 获取指数列表
- **路径**: `/market/indices`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  market: string (可选，SH|SZ|HK|US)
  type: string (可选，index|sector|concept)
  page: number (可选)
  pageSize: number (可选)
  ```
- **响应**:
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": [
      {
        "code": "000001",
        "name": "上证指数",
        "price": 2967.25,
        "change": 15.42,
        "changePercent": 0.52,
        "volume": 245680000,
        "amount": 2894560000,
        "high": 2975.32,
        "low": 2950.18,
        "open": 2960.45,
        "preClose": 2951.83,
        "timestamp": 1640995200000,
        "market": "SH",
        "type": "index",
        "description": "上海证券交易所综合指数",
        "constituentCount": 1600,
        "totalMarketValue": 45678900000000,
        "pe": 15.8,
        "pb": 1.6,
        "dividendYield": 2.3
      }
    ]
  }
  ```

### 2.3 热门股票

#### 获取热门股票
- **路径**: `/market/hot-stocks`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  market: string (可选)
  limit: number (可选，默认20)
  ```

### 2.4 资金流向

#### 获取资金流向
- **路径**: `/market/capital-flow`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  date: string (可选，格式YYYY-MM-DD)
  ```

### 2.5 市场情绪

#### 获取市场情绪
- **路径**: `/market/sentiment`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": {
      "overallSentiment": "bullish|bearish|neutral",
      "sentimentScore": 0.75,
      "fearGreedIndex": 65,
      "marketMood": "optimistic|pessimistic|neutral",
      "confidenceIndex": 0.8,
      "timestamp": 1640995200000
    }
  }
  ```

### 2.6 市场概览

#### 获取市场概览
- **路径**: `/market/overview`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": {
      "totalMarketValue": 45678900000000,
      "totalVolume": 1234567890000,
      "totalAmount": 9876543210000,
      "advancingStocks": 1200,
      "decliningStocks": 800,
      "unchangedStocks": 200,
      "limitUpStocks": 50,
      "limitDownStocks": 30,
      "timestamp": 1640995200000
    }
  }
  ```

### 2.7 市场排名

#### 获取市场排名
- **路径**: `/market/ranking`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  type: string (必需，gain|loss|volume|amount|turnover|market_value)
  period: string (必需，day|week|month|year)
  market: string (可选)
  limit: number (可选)
  ```
- **响应**:
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": [
      {
        "code": "000001",
        "name": "平安银行",
        "price": 12.34,
        "change": 0.56,
        "changePercent": 4.76,
        "volume": 123456789,
        "amount": 987654321,
        "turnover": 2.5,
        "marketValue": 1234567890123,
        "rank": 1
      }
    ]
  }
  ```

### 2.8 市场新闻

#### 获取市场新闻
- **路径**: `/market/news`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

### 2.9 股票详情

#### 获取股票报价
- **路径**: `/stock/{code}/quote`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取股票详情
- **路径**: `/stock/{code}/detail`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取股票K线数据
- **路径**: `/stock/{code}/kline`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  period: string (必需，1min|5min|15min|30min|1hour|4hour|day|week|month|year)
  type: string (必需，candlestick|line|area)
  indicators: string[] (可选)
  startDate: string (可选)
  endDate: string (可选)
  ```

#### 获取股票分时图
- **路径**: `/stock/{code}/timeshare`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  date: string (可选，格式YYYY-MM-DD)
  ```

#### 获取股票买卖盘
- **路径**: `/stock/{code}/orderbook`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  depth: number (可选，默认5)
  ```

#### 获取股票成交明细
- **路径**: `/stock/{code}/transactions`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  date: string (可选)
  limit: number (可选，默认50)
  ```

#### 获取股票财务数据
- **路径**: `/stock/{code}/financial`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取股票新闻
- **路径**: `/stock/{code}/news`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

#### 获取股票公告
- **路径**: `/stock/{code}/announcements`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

### 2.10 股票搜索

#### 搜索股票
- **路径**: `/stock/search`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  keyword: string (必需)
  market: string (可选)
  type: string (可选)
  limit: number (可选，默认20)
  ```

### 2.11 股票筛选器

#### 获取股票筛选结果
- **路径**: `/market/screener`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  market: string[] (可选)
  type: string[] (可选)
  industry: string[] (可选)
  area: string[] (可选)
  priceMin: number (可选)
  priceMax: number (可选)
  marketValueMin: number (可选)
  marketValueMax: number (可选)
  peMin: number (可选)
  peMax: number (可选)
  pbMin: number (可选)
  pbMax: number (可选)
  volumeMin: number (可选)
  volumeMax: number (可选)
  changeMin: number (可选)
  changeMax: number (可选)
  turnoverRateMin: number (可选)
  turnoverRateMax: number (可选)
  sortBy: string (可选)
  sortOrder: asc|desc (可选)
  page: number (可选)
  pageSize: number (可选)
  ```

### 2.12 板块和概念

#### 获取市场板块
- **路径**: `/market/sectors`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取市场概念
- **路径**: `/market/concepts`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 2.13 市场日历

#### 获取市场日历
- **路径**: `/market/calendar`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 2.14 经济日历

#### 获取经济日历
- **路径**: `/market/economic-calendar`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 2.15 历史数据

#### 获取历史数据
- **路径**: `/stock/{code}/historical`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  startDate: string (可选)
  endDate: string (可选)
  period: string (可选)
  ```

#### 获取分红历史
- **路径**: `/stock/{code}/dividends`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取拆股历史
- **路径**: `/stock/{code}/splits`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 2.16 批量操作

#### 批量获取股票报价
- **路径**: `/stock/batch-quotes`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "codes": ["string"]
  }
  ```

#### 批量获取股票详情
- **路径**: `/stock/batch-details`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "codes": ["string"]
  }
  ```

### 2.17 实时订阅

#### 订阅股票报价
- **路径**: `/stock/subscribe-quotes`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "codes": ["string"]
  }
  ```

#### 取消订阅股票报价
- **路径**: `/stock/unsubscribe-quotes`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "codes": ["string"]
  }
  ```

### 2.18 市场分析

#### 获取市场趋势
- **路径**: `/market/trends`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取市场分析
- **路径**: `/market/analysis`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取市场提醒
- **路径**: `/market/alerts`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取市场统计
- **路径**: `/market/statistics`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

---

## 3. 交易模块 API

### 3.1 账户管理

#### 获取交易账户列表
- **路径**: `/trade/accounts`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取交易账户详情
- **路径**: `/trade/accounts/{accountId}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取账户概览
- **路径**: `/trade/accounts/overview`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 3.2 持仓管理

#### 获取持仓列表
- **路径**: `/trade/positions`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  accountId: string (可选)
  ```

#### 获取持仓详情
- **路径**: `/trade/accounts/{accountId}/positions/{code}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 3.3 订单管理

#### 获取订单列表
- **路径**: `/trade/orders`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

#### 获取订单详情
- **路径**: `/trade/orders/{orderId}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 下单
- **路径**: `/trade/orders`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "accountId": "string",
    "code": "string",
    "type": "buy|sell",
    "priceType": "market|limit|stop_loss|stop_profit",
    "price": number,
    "volume": number,
    "remark": "string (可选)"
  }
  ```

#### 撤单
- **路径**: `/trade/orders/{orderId}/cancel`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "reason": "string (可选)"
  }
  ```

#### 批量撤单
- **路径**: `/trade/orders/batch-cancel`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "orderIds": ["string"]
  }
  ```

### 3.4 成交记录

#### 获取成交列表
- **路径**: `/trade/deals`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

#### 获取成交详情
- **路径**: `/trade/deals/{dealId}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 3.5 资金管理

#### 获取资金流水
- **路径**: `/trade/fund-flows`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

#### 获取资金流水详情
- **路径**: `/trade/fund-flows/{flowId}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 入金
- **路径**: `/trade/deposit`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "amount": number,
    "paymentMethod": "string"
  }
  ```

#### 出金
- **路径**: `/trade/withdraw`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "amount": number,
    "bankCard": "string"
  }
  ```

#### 取消资金流水
- **路径**: `/trade/fund-flows/{flowId}/cancel`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

### 3.6 交易设置

#### 获取交易设置
- **路径**: `/trade/settings`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 更新交易设置
- **路径**: `/trade/settings`
- **方法**: PUT
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 部分更新交易设置对象

### 3.7 统计和绩效

#### 获取交易统计
- **路径**: `/trade/statistics`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取交易绩效
- **路径**: `/trade/performance/{period}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **路径参数**:
  ```
  period: string (day|week|month|quarter|year)
  ```

#### 获取交易历史
- **路径**: `/trade/history`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

### 3.8 风控管理

#### 获取风控设置
- **路径**: `/trade/risk-control`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 更新风控设置
- **路径**: `/trade/risk-control`
- **方法**: PUT
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 风控设置对象

### 3.9 佣金规则

#### 获取佣金规则
- **路径**: `/trade/commission-rules`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 计算佣金
- **路径**: `/trade/calculate-commission`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 订单数据

### 3.10 订单验证

#### 验证订单
- **路径**: `/trade/validate-order`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 订单数据

### 3.11 市场深度

#### 获取订单簿
- **路径**: `/trade/order-book/{code}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取市场深度
- **路径**: `/trade/market-depth/{code}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 3.12 交易日历

#### 获取交易日历
- **路径**: `/trade/calendar`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 3.13 账户报表

#### 获取账户对账单
- **路径**: `/trade/accounts/{accountId}/statements`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 3.14 数据导出

#### 导出订单
- **路径**: `/trade/export/orders`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 导出筛选条件

#### 导出成交
- **路径**: `/trade/export/deals`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 导出筛选条件

#### 导出持仓
- **路径**: `/trade/export/positions`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 导出筛选条件

#### 导出资金流水
- **路径**: `/trade/export/fund-flows`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 导出筛选条件

### 3.15 交易限制

#### 获取交易限制
- **路径**: `/trade/trading-limits`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  accountId: string (可选)
  ```

### 3.16 融资融券

#### 获取融资信息
- **路径**: `/trade/accounts/{accountId}/margin-info`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取融券信息
- **路径**: `/trade/short-selling/{code}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 融券下单
- **路径**: `/trade/short-orders`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 融券订单数据

### 3.17 期权交易

#### 获取期权链
- **路径**: `/trade/options/{code}/chain`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取期权信息
- **路径**: `/trade/options/{optionCode}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 期权下单
- **路径**: `/trade/options/orders`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 期权订单数据

### 3.18 期货交易

#### 获取期货信息
- **路径**: `/trade/futures/{code}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 期货下单
- **路径**: `/trade/futures/orders`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 期货订单数据

### 3.19 算法交易

#### 获取算法订单
- **路径**: `/trade/algo-orders`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

#### 下算法订单
- **路径**: `/trade/algo-orders`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 算法订单数据

#### 撤销算法订单
- **路径**: `/trade/algo-orders/{orderId}/cancel`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

### 3.20 条件单

#### 获取条件单
- **路径**: `/trade/condition-orders`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

#### 下条件单
- **路径**: `/trade/condition-orders`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 条件单数据

#### 撤销条件单
- **路径**: `/trade/condition-orders/{orderId}/cancel`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

### 3.21 新股申购

#### 获取新股信息
- **路径**: `/trade/ipo-info`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 申购新股
- **路径**: `/trade/ipo-subscribe/{ipoCode}`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

### 3.22 债券交易

#### 获取债券信息
- **路径**: `/trade/bonds/{code}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 债券下单
- **路径**: `/trade/bonds/orders`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 债券订单数据

### 3.23 基金交易

#### 获取基金信息
- **路径**: `/trade/funds/{code}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 基金下单
- **路径**: `/trade/funds/orders`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 基金订单数据

### 3.24 权证交易

#### 获取权证信息
- **路径**: `/trade/warrants/{code}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 权证下单
- **路径**: `/trade/warrants/orders`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 权证订单数据

### 3.25 交易限制

#### 获取交易限制
- **路径**: `/trade/trading-limits`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  accountId: string (可选)
  ```
- **响应**:
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": {
      "accountId": "string",
      "maxOrderAmount": 1000000.00,
      "maxOrderVolume": 100000,
      "maxPositionAmount": 5000000.00,
      "maxPositionVolume": 500000,
      "minOrderAmount": 100.00,
      "minOrderVolume": 100,
      "tradingHours": {
        "start": "09:30",
        "end": "15:00"
      },
      "restrictedStocks": ["string"],
      "restrictedMarkets": ["string"],
      "riskLevel": "low|medium|high",
      "marginRatio": 0.5,
      "leverageLimit": 2.0
    }
  }
  ```

---

## 4. 资讯模块 API

### 4.1 新闻列表

#### 获取新闻列表
- **路径**: `/news`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

### 4.2 新闻详情

#### 获取新闻详情
- **路径**: `/news/{newsId}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 4.3 热门新闻

#### 获取热门新闻
- **路径**: `/news/hot`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持筛选

### 4.4 最新新闻

#### 获取最新新闻
- **路径**: `/news/latest`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持筛选

### 4.5 分类新闻

#### 按分类获取新闻
- **路径**: `/news/category/{category}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

### 4.6 标签新闻

#### 按标签获取新闻
- **路径**: `/news/tag/{tag}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

### 4.7 新闻搜索

#### 搜索新闻
- **路径**: `/news/search`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  keyword: string (必需)
  ```

### 4.8 相关新闻

#### 获取相关新闻
- **路径**: `/news/{newsId}/related`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持筛选

### 4.9 新闻评论

#### 获取新闻评论
- **路径**: `/news/{newsId}/comments`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

#### 添加新闻评论
- **路径**: `/news/{newsId}/comments`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 评论数据

#### 删除新闻评论
- **路径**: `/news/{newsId}/comments/{commentId}`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

#### 点赞评论
- **路径**: `/news/{newsId}/comments/{commentId}/like`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

#### 取消点赞评论
- **路径**: `/news/{newsId}/comments/{commentId}/like`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

### 4.10 新闻互动

#### 点赞新闻
- **路径**: `/news/{newsId}/like`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

#### 取消点赞新闻
- **路径**: `/news/{newsId}/like`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

#### 收藏新闻
- **路径**: `/news/{newsId}/bookmark`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

#### 取消收藏新闻
- **路径**: `/news/{newsId}/bookmark`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

#### 分享新闻
- **路径**: `/news/{newsId}/share`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 分享数据

#### 举报新闻
- **路径**: `/news/{newsId}/report`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 举报数据

### 4.11 公告信息

#### 获取公告列表
- **路径**: `/news/announcements`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

#### 获取公告详情
- **路径**: `/news/announcements/{announcementId}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 按股票获取公告
- **路径**: `/news/announcements/stock/{code}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

### 4.12 研报信息

#### 获取研报列表
- **路径**: `/news/research-reports`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

#### 获取研报详情
- **路径**: `/news/research-reports/{reportId}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 按股票获取研报
- **路径**: `/news/research-reports/stock/{code}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

#### 按机构获取研报
- **路径**: `/news/research-reports/institution/{institution}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页和筛选

### 4.13 资讯分类

#### 获取新闻分类
- **路径**: `/news/categories`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取新闻标签
- **路径**: `/news/tags`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取新闻来源
- **路径**: `/news/sources`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 4.14 资讯统计

#### 获取新闻统计
- **路径**: `/news/statistics`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取新闻趋势
- **路径**: `/news/trending`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取新闻推荐
- **路径**: `/news/recommendations`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取快讯
- **路径**: `/news/breaking`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取新闻时间线
- **路径**: `/news/timeline`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 4.15 历史资讯

#### 按日期获取新闻
- **路径**: `/news/date/{date}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

#### 获取新闻归档
- **路径**: `/news/archive`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

### 4.16 RSS订阅

#### 获取RSS源
- **路径**: `/news/rss-feeds`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 4.17 推送设置

#### 获取新闻推送设置
- **路径**: `/news/push-settings`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 更新新闻推送设置
- **路径**: `/news/push-settings`
- **方法**: PUT
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 推送设置对象

### 4.18 订阅管理

#### 获取新闻订阅
- **路径**: `/news/subscriptions`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 添加新闻订阅
- **路径**: `/news/subscriptions`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 订阅数据

#### 取消新闻订阅
- **路径**: `/news/subscriptions/{subscriptionId}`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

### 4.19 通知管理

#### 获取新闻通知
- **路径**: `/news/notifications`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

#### 标记通知为已读
- **路径**: `/news/notifications/{notificationId}/read`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

#### 删除通知
- **路径**: `/news/notifications/{notificationId}`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

### 4.20 搜索历史

#### 获取新闻搜索历史
- **路径**: `/news/search-history`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 添加新闻搜索历史
- **路径**: `/news/search-history`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "keyword": "string"
  }
  ```

#### 清空新闻搜索历史
- **路径**: `/news/search-history`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

### 4.21 收藏和阅读历史

#### 获取新闻收藏
- **路径**: `/news/bookmarks`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

#### 获取新闻阅读历史
- **路径**: `/news/reading-history`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

#### 添加新闻阅读历史
- **路径**: `/news/reading-history`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "newsId": "string"
  }
  ```

#### 清空新闻阅读历史
- **路径**: `/news/reading-history`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

### 4.22 数据分析

#### 获取新闻分析
- **路径**: `/news/analytics`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取推荐设置
- **路径**: `/news/recommendation-settings`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 更新推荐设置
- **路径**: `/news/recommendation-settings`
- **方法**: PUT
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 推荐设置对象

### 4.23 反馈和评分

#### 获取新闻反馈
- **路径**: `/news/{newsId}/feedback`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

#### 提交新闻反馈
- **路径**: `/news/{newsId}/feedback`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 反馈数据

#### 获取新闻评分
- **路径**: `/news/{newsId}/ratings`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 评分新闻
- **路径**: `/news/{newsId}/rate`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "rating": number
  }
  ```

### 4.24 互动统计

#### 获取新闻评论数
- **路径**: `/news/{newsId}/comments-count`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取新闻点赞数
- **路径**: `/news/{newsId}/likes-count`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取新闻分享数
- **路径**: `/news/{newsId}/shares-count`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取新闻浏览数
- **路径**: `/news/{newsId}/views-count`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 增加新闻浏览数
- **路径**: `/news/{newsId}/views`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

#### 获取新闻互动数据
- **路径**: `/news/{newsId}/engagement`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 4.25 新闻时间线

#### 获取新闻时间线
- **路径**: `/news/timeline`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  ```
  date: string (可选，格式YYYY-MM-DD)
  category: string (可选)
  importance: string (可选)
  ```

### 4.26 历史资讯

#### 按日期获取新闻
- **路径**: `/news/date/{date}`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

#### 获取新闻归档
- **路径**: `/news/archive`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

### 4.27 RSS订阅

#### 获取RSS源
- **路径**: `/news/rss-feeds`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

### 4.28 推送设置

#### 获取新闻推送设置
- **路径**: `/news/push-settings`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 更新新闻推送设置
- **路径**: `/news/push-settings`
- **方法**: PUT
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 推送设置对象

### 4.29 订阅管理

#### 获取新闻订阅
- **路径**: `/news/subscriptions`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 添加新闻订阅
- **路径**: `/news/subscriptions`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 订阅数据

#### 取消新闻订阅
- **路径**: `/news/subscriptions/{subscriptionId}`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

### 4.30 通知管理

#### 获取新闻通知
- **路径**: `/news/notifications`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

#### 标记通知为已读
- **路径**: `/news/notifications/{notificationId}/read`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`

#### 删除通知
- **路径**: `/news/notifications/{notificationId}`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

### 4.31 搜索历史

#### 获取新闻搜索历史
- **路径**: `/news/search-history`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 添加新闻搜索历史
- **路径**: `/news/search-history`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "keyword": "string"
  }
  ```

#### 清空新闻搜索历史
- **路径**: `/news/search-history`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

### 4.32 收藏和阅读历史

#### 获取新闻收藏
- **路径**: `/news/bookmarks`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

#### 获取新闻阅读历史
- **路径**: `/news/reading-history`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

#### 添加新闻阅读历史
- **路径**: `/news/reading-history`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "newsId": "string"
  }
  ```

#### 清空新闻阅读历史
- **路径**: `/news/reading-history`
- **方法**: DELETE
- **请求头**: `Authorization: Bearer {token}`

### 4.33 数据分析

#### 获取新闻分析
- **路径**: `/news/analytics`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 获取推荐设置
- **路径**: `/news/recommendation-settings`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 更新推荐设置
- **路径**: `/news/recommendation-settings`
- **方法**: PUT
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 推荐设置对象

### 4.34 反馈和评分

#### 获取新闻反馈
- **路径**: `/news/{newsId}/feedback`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**: 支持分页

#### 提交新闻反馈
- **路径**: `/news/{newsId}/feedback`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: 反馈数据

#### 获取新闻评分
- **路径**: `/news/{newsId}/ratings`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`

#### 评分新闻
- **路径**: `/news/{newsId}/rate`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "rating": number
  }
  ```

---

## 5. 通知模块 API

### 5.1 WebSocket 连接

#### 连接通知服务
- **WebSocket URL**: `wss://api.example.com/ws/notifications?token={token}`
- **协议**: WebSocket
- **认证**: 通过 URL 参数传递 token
- **连接参数**:
  ```
  token: string (必需，用户认证token)
  deviceId: string (可选，设备ID)
  platform: string (可选，平台信息)
  ```

#### 连接状态
- **连接成功**: 服务器发送 `connected` 消息
- **连接失败**: 服务器发送 `error` 消息
- **心跳检测**: 客户端每30秒发送心跳，服务器响应 `pong`

### 5.2 消息类型

#### 心跳消息
```json
{
  "type": "heartbeat",
  "timestamp": 1640995200000,
  "messageId": "uuid"
}
```

#### 通知消息
```json
{
  "type": "notification",
  "data": {
    "id": "string",
    "type": "news|trade|system|security",
    "title": "string",
    "content": "string",
    "timestamp": 1640995200000,
    "data": {}
  },
  "timestamp": 1640995200000,
  "messageId": "uuid"
}
```

#### 新闻更新消息
```json
{
  "type": "news_update",
  "data": {
    "id": "string",
    "title": "string",
    "importance": "breaking|important|normal",
    "category": "string",
    "stock": "string"
  },
  "timestamp": 1640995200000,
  "messageId": "uuid"
}
```

#### 交易更新消息
```json
{
  "type": "trade_update",
  "data": {
    "id": "string",
    "type": "order|position|alert",
    "action": "string",
    "status": "string",
    "stockName": "string",
    "alertPrice": number
  },
  "timestamp": 1640995200000,
  "messageId": "uuid"
}
```

#### 系统消息
```json
{
  "type": "system_message",
  "data": {
    "id": "string",
    "type": "update|maintenance|security",
    "title": "string",
    "content": "string"
  },
  "timestamp": 1640995200000,
  "messageId": "uuid"
}
```

#### 实时行情消息
```json
{
  "type": "quote_update",
  "data": {
    "code": "string",
    "name": "string",
    "price": number,
    "change": number,
    "changePercent": number,
    "volume": number,
    "amount": number,
    "timestamp": 1640995200000
  },
  "timestamp": 1640995200000,
  "messageId": "uuid"
}
```

### 5.3 推送设置

#### 推送设置结构
```json
{
  "news": {
    "breaking": true,
    "important": true,
    "category": ["string"],
    "stock": ["string"]
  },
  "trade": {
    "order": true,
    "position": true,
    "alert": true
  },
  "system": {
    "update": true,
    "maintenance": true,
    "security": true
  },
  "quotes": {
    "enabled": true,
    "codes": ["string"],
    "interval": 1000
  },
  "sound": true,
  "vibration": true,
  "led": true
}
```

### 5.4 连接管理

#### 订阅股票行情
- **消息类型**: `subscribe_quotes`
- **请求体**:
  ```json
  {
    "type": "subscribe_quotes",
    "data": {
      "codes": ["000001", "000002"]
    },
    "timestamp": 1640995200000,
    "messageId": "uuid"
  }
  ```

#### 取消订阅股票行情
- **消息类型**: `unsubscribe_quotes`
- **请求体**:
  ```json
  {
    "type": "unsubscribe_quotes",
    "data": {
      "codes": ["000001", "000002"]
    },
    "timestamp": 1640995200000,
    "messageId": "uuid"
  }
  ```

#### 更新推送设置
- **消息类型**: `update_push_settings`
- **请求体**:
  ```json
  {
    "type": "update_push_settings",
    "data": {
      "news": {
        "breaking": true,
        "important": true
      },
      "trade": {
        "order": true,
        "position": true
      }
    },
    "timestamp": 1640995200000,
    "messageId": "uuid"
  }
  ```

### 5.5 错误处理

#### 连接错误
```json
{
  "type": "error",
  "data": {
    "code": 401,
    "message": "认证失败",
    "details": "Token无效或已过期"
  },
  "timestamp": 1640995200000,
  "messageId": "uuid"
}
```

#### 消息错误
```json
{
  "type": "error",
  "data": {
    "code": 400,
    "message": "消息格式错误",
    "details": "缺少必需字段"
  },
  "timestamp": 1640995200000,
  "messageId": "uuid"
}
```

### 5.6 重连机制

- **自动重连**: 连接断开后自动重连，间隔递增
- **最大重连次数**: 5次
- **重连间隔**: 1s, 2s, 4s, 8s, 16s
- **重连成功**: 重新订阅之前的频道
- **重连失败**: 停止重连，显示错误信息

---

## 6. 通用功能

### 6.1 分页参数

所有支持分页的接口都使用以下查询参数：

```
page: number (页码，从1开始)
pageSize: number (每页数量，默认20)
sortBy: string (排序字段，可选)
sortOrder: asc|desc (排序方式，可选)
```

### 6.2 分页响应

```json
{
  "list": [],
  "total": 0,
  "page": 1,
  "pageSize": 20,
  "totalPages": 0,
  "hasNext": false,
  "hasPrev": false
}
```

### 6.3 文件上传

文件上传接口支持以下格式：

#### 请求头
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

#### 请求体
使用 FormData 格式，包含文件字段和类型字段。

### 6.4 批量操作

批量操作接口通常接受数组类型的参数：

```json
{
  "codes": ["000001", "000002"],
  "orderIds": ["order1", "order2"]
}
```

### 6.5 导出功能

导出接口支持以下格式：

- CSV (.csv)
- Excel (.xlsx)
- PDF (.pdf)

查询参数：
```
format: csv|excel|pdf
filename: string (可选)
```

---

## 7. 错误处理

### 7.1 错误响应格式

```json
{
  "code": 400,
  "message": "请求参数错误",
  "details": {
    "field": "error message"
  },
  "timestamp": 1640995200000,
  "traceId": "trace-id"
}
```

### 7.2 常见错误码

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数格式和必填项 |
| 401 | 未授权/Token过期 | 重新登录获取新token |
| 403 | 权限不足 | 检查用户权限或联系管理员 |
| 404 | 资源不存在 | 检查请求的URL或资源ID |
| 429 | 请求频率限制 | 降低请求频率或等待重置 |
| 500 | 服务器内部错误 | 联系技术支持 |

### 7.3 重试机制

- 自动重试：默认3次，间隔1秒
- 手动重试：收到错误响应后根据错误类型决定是否重试
- 指数退避：重试间隔逐渐增加

---

## 8. 性能优化

### 8.1 缓存策略

- 内存缓存：5分钟
- 本地存储：持久化缓存
- CDN缓存：静态资源

### 8.2 请求优化

- 批量请求：合并多个请求
- 增量更新：只获取变化的数据
- 数据压缩：启用gzip压缩

### 8.3 连接管理

- 连接池：复用HTTP连接
- WebSocket：长连接保持
- 超时控制：设置合理的超时时间

---

## 9. 安全措施

### 9.1 认证授权

- JWT Token：Bearer Token认证
- 权限控制：基于角色的访问控制
- 会话管理：Token过期和刷新机制

### 9.2 数据安全

- HTTPS加密：所有API使用HTTPS
- 数据验证：严格的输入验证和输出编码
- 敏感信息：脱敏处理敏感数据

### 9.3 防护措施

- 频率限制：API调用频率限制
- IP白名单：限制访问来源
- 请求签名：防止请求篡改

---

## 10. 开发建议

### 10.1 最佳实践

1. **错误处理**：所有API调用都要处理错误情况
2. **重试机制**：对于网络错误实现自动重试
3. **缓存策略**：合理使用缓存减少API调用
4. **用户体验**：提供加载状态和错误提示
5. **性能优化**：避免频繁调用API，使用批量操作

### 10.2 调试技巧

1. **查看网络请求**：使用浏览器开发者工具
2. **检查请求头**：确保Authorization头正确设置
3. **验证参数**：使用TypeScript类型检查
4. **日志记录**：记录API调用和响应日志
5. **环境配置**：使用不同的环境配置

### 10.3 测试建议

1. **单元测试**：测试API调用逻辑
2. **集成测试**：测试API与UI的集成
3. **性能测试**：测试API响应时间
4. **错误测试**：测试各种错误情况
5. **安全测试**：测试认证和授权机制

---

## 11. 版本更新

### 11.1 版本号规则

- 主版本号：不兼容的API变更
- 次版本号：向下兼容的功能性新增
- 修订版本号：向下兼容的问题修正

### 11.2 更新日志

#### v1.0.0
- 初始版本发布
- 完整的用户、市场、交易、资讯功能

#### v1.1.0
- 新增算法交易功能
- 优化性能和稳定性
- 新增用户登录历史和活动记录API
- 新增新闻时间线、归档、RSS订阅等功能
- 新增交易限制API
- 完善市场情绪、概览、排名等API
- 新增新闻推送设置、订阅管理、通知管理等功能
- 新增新闻搜索历史、收藏、阅读历史等功能
- 新增新闻数据分析、反馈评分、互动统计等功能

---

## 12. 联系支持

### 12.1 技术支持

- **API文档**：https://docs.example.com
- **问题反馈**：support@example.com
- **技术社区**：https://community.example.com

### 12.2 紧急联系

- **紧急故障**：emergency@example.com
- **安全问题**：security@example.com
- **商务合作**：business@example.com

---

## 13. 系统API

### 13.1 健康检查

#### 获取系统健康状态
- **路径**: `/health`
- **方法**: GET
- **响应**:
  ```json
  {
    "status": "ok",
    "timestamp": 1640995200000,
    "service": "trade-app-server",
    "version": "1.0.0",
    "environment": "development"
  }
  ```

### 13.2 就绪检查

#### 获取系统就绪状态
- **路径**: `/ready`
- **方法**: GET
- **响应**:
  ```json
  {
    "status": "ready",
    "timestamp": 1640995200000,
    "checks": {
      "database": "ok",
      "redis": "ok"
    }
  }
  ```

### 13.3 错误处理

#### 404 错误
- **响应**:
  ```json
  {
    "code": 404,
    "message": "API 路由不存在",
    "timestamp": 1640995200000,
    "path": "/api/nonexistent"
  }
  ```

---

## 14. 版本兼容性

### 14.1 API版本

- **v1**: `/api/v1/*` - 当前稳定版本
- **兼容**: `/api/*` - 兼容旧版本路径

### 14.2 版本迁移

- 新功能优先在 v1 版本中提供
- 旧版本API保持向后兼容
- 废弃的API会提前通知并给出迁移指南

---

## 15. 开发环境

### 15.1 环境变量

```
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3000/api
```

### 15.2 本地开发

- 服务端端口：3000
- 前端端口：8080
- 数据库端口：3306
- Redis端口：6379

---

## 16. 部署指南

### 16.1 生产环境配置

- 使用HTTPS
- 配置反向代理
- 设置CORS
- 启用压缩
- 配置日志

### 16.2 监控和告警

- 健康检查监控
- 性能监控
- 错误告警
- 业务指标监控

---

## 17. 常见问题

### 17.1 认证问题

**Q: Token过期怎么办？**
A: 使用refresh-token接口获取新的token

**Q: 如何获取用户权限？**
A: 登录接口会返回用户权限列表

### 17.2 数据问题

**Q: 如何处理分页？**
A: 使用page和pageSize参数，响应包含分页信息

**Q: 如何批量操作？**
A: 使用批量接口，传入数组参数

### 17.3 性能问题

**Q: 如何优化请求？**
A: 使用缓存、批量请求、增量更新

**Q: 如何处理大量数据？**
A: 使用分页、流式传输、压缩

---

## 18. 更新日志

### 18.1 版本历史

#### v1.1.0 (2024-01-15)
- 新增用户登录历史和活动记录API
- 新增新闻时间线、归档、RSS订阅等功能
- 新增交易限制API
- 完善市场情绪、概览、排名等API
- 新增新闻推送设置、订阅管理、通知管理等功能
- 新增新闻搜索历史、收藏、阅读历史等功能
- 新增新闻数据分析、反馈评分、互动统计等功能
- 新增系统健康检查和就绪检查API

#### v1.0.0 (2024-01-01)
- 初始版本发布
- 完整的用户、市场、交易、资讯功能

---

## 19. 联系支持

### 19.1 技术支持

- **API文档**：https://docs.example.com
- **问题反馈**：support@example.com
- **技术社区**：https://community.example.com

### 19.2 紧急联系

- **紧急故障**：emergency@example.com
- **安全问题**：security@example.com
- **商务合作**：business@example.com

---

*最后更新时间：2024-01-15*
*文档版本：v1.1.0*