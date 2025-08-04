# 股票交易应用 (Trade App)

一个基于 Vue 3 + Uni-app 的跨平台股票交易应用，包含完整的后端 API 服务。

## 项目结构

```
my-vue3-project/
├── server/                 # 后端服务 (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── controllers/   # 控制器层
│   │   ├── services/      # 业务逻辑层
│   │   ├── models/        # 数据模型层
│   │   ├── routes/        # 路由定义
│   │   ├── middleware/    # 中间件
│   │   ├── utils/         # 工具函数
│   │   └── types/         # TypeScript 类型定义
│   └── scripts/           # 脚本文件
└── src/                   # 前端应用 (Vue 3 + Uni-app)
    ├── components/        # 组件
    ├── pages/            # 页面
    ├── stores/           # Pinia 状态管理
    ├── services/         # API 服务
    └── types/            # TypeScript 类型定义
```

## 功能特性

### 后端功能
- ✅ 用户认证与授权 (JWT)
- ✅ 市场数据 API
- ✅ 股票信息 API
- ✅ 交易功能 API
- ✅ 新闻资讯 API
- ✅ 数据库集成 (MySQL + Redis)
- ✅ 中间件系统 (认证、限流、错误处理)
- ✅ 日志系统
- ✅ TypeScript 支持

### 前端功能
- ✅ 跨平台支持 (H5、小程序、App)
- ✅ 市场行情展示
- ✅ 股票搜索与详情
- ✅ 交易功能界面
- ✅ 新闻资讯
- ✅ 个人中心
- ✅ 状态管理 (Pinia)
- ✅ TypeScript 支持

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 6.0
- npm >= 8.0.0

### 1. 克隆项目

```bash
git clone <repository-url>
cd my-vue3-project
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ..
npm install
```

### 3. 配置环境变量

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

### 4. 初始化数据库

```bash
cd server
npm run migrate
npm run seed
```

### 5. 启动服务

#### 启动后端服务

```bash
cd server

# 开发模式
npm run dev

# 或者使用启动脚本
node scripts/start-dev.js
```

#### 启动前端服务

```bash
# 开发模式 (H5)
npm run dev:h5

# 开发模式 (微信小程序)
npm run dev:mp-weixin

# 开发模式 (App)
npm run dev:app
```

### 6. 访问应用

- 后端 API: http://localhost:3000
- 前端 H5: http://localhost:8080
- API 文档: http://localhost:3000/api/v1/docs

## API 文档

### 认证相关

```bash
# 用户登录
POST /api/v1/user/login
{
  "username": "test",
  "password": "password123"
}

# 用户注册
POST /api/v1/user/register
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "phone": "13800138000"
}
```

### 市场数据

```bash
# 获取市场状态
GET /api/v1/market/status

# 获取指数数据
GET /api/v1/market/indices

# 获取热门股票
GET /api/v1/market/hot-stocks

# 获取资金流向
GET /api/v1/market/capital-flow
```

### 股票数据

```bash
# 获取股票行情
GET /api/v1/stock/{code}/quote

# 获取股票详情
GET /api/v1/stock/{code}/detail

# 搜索股票
GET /api/v1/stock/search?keyword=平安
```

## 开发指南

### 后端开发

1. **添加新的 API 路由**

```typescript
// server/src/routes/api/example.ts
import { Router } from 'express';
import { ExampleController } from '../../controllers/api/ExampleController';

const router = Router();
const controller = new ExampleController();

router.get('/example', controller.getExample);
router.post('/example', controller.createExample);

export default router;
```

2. **创建新的控制器**

```typescript
// server/src/controllers/api/ExampleController.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';

export class ExampleController {
  getExample = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      code: 0,
      message: '成功',
      data: { example: 'data' }
    });
  });
}
```

3. **添加新的服务**

```typescript
// server/src/services/exampleService.ts
export class ExampleService {
  async getExample() {
    // 业务逻辑
    return { example: 'data' };
  }
}
```

### 前端开发

1. **添加新的页面**

```vue
<!-- src/pages/example/index.vue -->
<template>
  <view class="example-page">
    <text>示例页面</text>
  </view>
</template>

<script setup lang="ts">
// 页面逻辑
</script>
```

2. **创建新的组件**

```vue
<!-- src/components/example/ExampleComponent.vue -->
<template>
  <view class="example-component">
    <text>{{ title }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>
```

3. **添加新的 Store**

```typescript
// src/stores/useExampleStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useExampleStore = defineStore('example', () => {
  const data = ref([])
  
  const fetchData = async () => {
    // 获取数据逻辑
  }
  
  return {
    data,
    fetchData
  }
})
```

## 部署

### 后端部署

```bash
cd server

# 构建项目
npm run build

# 生产环境启动
npm start
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

## 测试

```bash
# 后端测试
cd server
npm test

# 前端测试
npm run test
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目维护者: [sgch]
- 邮箱: [sgch2023@gmail.com]

- 项目链接: [https://github.com/yourusername/trade-app] 
