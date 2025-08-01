# 开发指南

## 项目概述

这是一个基于 Vue 3 + Uni-app 的跨平台股票交易应用，包含完整的后端 API 服务。

## 技术栈

### 后端
- **Node.js** - 运行时环境
- **Express.js** - Web 框架
- **TypeScript** - 类型安全的 JavaScript
- **MySQL** - 主数据库
- **Redis** - 缓存和会话存储
- **JWT** - 用户认证
- **Joi** - 数据验证
- **Winston** - 日志记录

### 前端
- **Vue 3** - 前端框架
- **Uni-app** - 跨平台开发框架
- **Pinia** - 状态管理
- **TypeScript** - 类型安全
- **Axios** - HTTP 客户端

## 开发环境设置

### 1. 环境要求

- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 6.0
- npm >= 8.0.0

### 2. 克隆项目

```bash
git clone <repository-url>
cd my-vue3-project
```

### 3. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ..
npm install
```

### 4. 配置环境变量

在 `server/` 目录下创建 `.env` 文件：

```bash
# 复制示例文件
cp server/.env.example server/.env

# 编辑环境变量
vim server/.env
```

必需的环境变量：
- `DB_HOST` - 数据库主机
- `DB_USER` - 数据库用户名
- `DB_PASSWORD` - 数据库密码
- `DB_NAME` - 数据库名称
- `JWT_SECRET` - JWT 密钥
- `JWT_REFRESH_SECRET` - JWT 刷新密钥
- `ENCRYPTION_KEY` - 加密密钥

### 5. 启动开发环境

#### 使用 Docker Compose (推荐)

```bash
cd server
docker-compose up -d
```

#### 手动启动

```bash
# 启动 MySQL 和 Redis
# ... 根据你的环境启动数据库服务

# 启动后端服务
cd server
npm run dev

# 启动前端服务
cd ..
npm run dev:h5
```

## 项目结构

### 后端结构

```
server/
├── src/
│   ├── controllers/     # 控制器层 - 处理 HTTP 请求
│   ├── services/        # 业务逻辑层 - 核心业务逻辑
│   ├── models/          # 数据模型层 - 数据库操作
│   ├── routes/          # 路由定义 - API 路由
│   ├── middleware/      # 中间件 - 认证、限流等
│   ├── utils/           # 工具函数 - 通用工具
│   ├── types/           # TypeScript 类型定义
│   └── config/          # 配置文件
├── scripts/             # 脚本文件
├── tests/               # 测试文件
└── docs/                # 文档
```

### 前端结构

```
src/
├── components/          # 组件
│   ├── common/         # 通用组件
│   ├── layout/         # 布局组件
│   ├── market/         # 市场相关组件
│   └── trade/          # 交易相关组件
├── pages/              # 页面
│   ├── index/          # 首页
│   ├── market/         # 行情页面
│   ├── trade/          # 交易页面
│   ├── news/           # 新闻页面
│   └── profile/        # 个人中心
├── stores/             # Pinia 状态管理
├── services/           # API 服务
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
└── static/             # 静态资源
```

## 开发流程

### 1. 后端开发

#### 添加新的 API 路由

1. 在 `src/routes/api/` 目录下创建新的路由文件
2. 在 `src/controllers/api/` 目录下创建对应的控制器
3. 在 `src/services/` 目录下创建业务逻辑
4. 在 `src/models/` 目录下创建数据模型
5. 在 `src/types/` 目录下添加类型定义

示例：

```typescript
// src/routes/api/example.ts
import { Router } from 'express';
import { ExampleController } from '../../controllers/api/ExampleController';

const router = Router();
const controller = new ExampleController();

router.get('/example', controller.getExample);
router.post('/example', controller.createExample);

export default router;
```

```typescript
// src/controllers/api/ExampleController.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { exampleService } from '../../services/exampleService';

export class ExampleController {
  getExample = asyncHandler(async (req: Request, res: Response) => {
    const data = await exampleService.getExample();
    res.json({
      code: 0,
      message: '成功',
      data
    });
  });
}
```

#### 添加新的中间件

在 `src/middleware/` 目录下创建新的中间件文件：

```typescript
// src/middleware/example.ts
import { Request, Response, NextFunction } from 'express';

export const exampleMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 中间件逻辑
  next();
};
```

### 2. 前端开发

#### 添加新的页面

1. 在 `src/pages/` 目录下创建新的页面目录
2. 创建 `index.vue` 文件
3. 在 `src/pages.json` 中注册页面

示例：

```vue
<!-- src/pages/example/index.vue -->
<template>
  <view class="example-page">
    <text>{{ title }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const title = ref('示例页面')
</script>

<style scoped>
.example-page {
  padding: 20px;
}
</style>
```

#### 添加新的组件

在 `src/components/` 目录下创建新的组件：

```vue
<!-- src/components/example/ExampleComponent.vue -->
<template>
  <view class="example-component">
    <text>{{ title }}</text>
    <button @tap="handleClick">点击</button>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()

const emit = defineEmits<{
  click: []
}>()

const handleClick = () => {
  emit('click')
}
</script>
```

#### 添加新的 Store

在 `src/stores/` 目录下创建新的 Store：

```typescript
// src/stores/useExampleStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useExampleStore = defineStore('example', () => {
  const data = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isEmpty = computed(() => data.value.length === 0)

  const fetchData = async () => {
    try {
      loading.value = true
      error.value = null
      // 获取数据逻辑
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取数据失败'
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    isEmpty,
    fetchData
  }
})
```

## 测试

### 后端测试

```bash
cd server

# 运行所有测试
npm test

# 运行测试并监听文件变化
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage

# 测试 API
npm run test:api
```

### 前端测试

```bash
# 运行类型检查
npm run type-check

# 运行代码检查
npm run lint
npm run lint:fix
```

## 部署

### 后端部署

```bash
cd server

# 构建项目
npm run build

# 生产环境启动
npm start

# 使用 Docker 部署
docker build -t trade-app-server .
docker run -p 3000:3000 trade-app-server
```

### 前端部署

```bash
# 构建 H5 版本
npm run build:h5

# 构建微信小程序
npm run build:mp-weixin

# 构建 App
npm run build:app
```

## 代码规范

### TypeScript 规范

- 使用严格的 TypeScript 配置
- 为所有函数和变量添加类型注解
- 使用接口定义数据结构
- 避免使用 `any` 类型

### Vue 组件规范

- 使用 Composition API
- 使用 `<script setup>` 语法
- 为 props 和 emits 定义类型
- 使用 scoped 样式

### API 规范

- 使用 RESTful API 设计
- 统一的响应格式
- 适当的错误处理
- 请求参数验证

## 常见问题

### 1. 数据库连接失败

检查环境变量配置：
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

### 2. Redis 连接失败

检查环境变量配置：
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`

### 3. JWT 认证失败

检查环境变量配置：
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

### 4. 前端 API 请求失败

检查 API 基础 URL 配置：
- 开发环境：`http://localhost:3000/api/v1`
- 生产环境：根据实际部署情况配置

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 联系方式

- 项目维护者: [Your Name]
- 邮箱: [your.email@example.com]
- 项目链接: [https://github.com/yourusername/trade-app] 