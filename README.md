# 股票交易应用系统

一个基于 Vue 3 + uni-app + Express.js 的现代化股票交易应用系统。

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
```

### 启动开发服务

```bash
# 启动后端服务 (终端1)
cd server
npm run dev

# 启动前端服务 (终端2)
npm run dev:h5
```

### 访问应用
- 前端地址: http://localhost:5173
- 后端API: http://localhost:3000
- 委托页面: http://localhost:5173/pages/trade/orders

## 📋 主要功能

### 交易功能
- 📈 股票买卖下单
- 📊 委托订单管理
- 💰 持仓查询
- 📋 成交记录查看
- 💳 资金管理

### 账户功能
- 👤 账户信息查询
- 💸 资金流水记录
- ⚙️ 交易设置配置
- 🛡️ 风控管理

### 实时数据
- 📡 WebSocket实时行情
- 📈 市场深度数据
- 📅 交易日历

## 🛠️ 技术栈

### 前端
- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript
- **uni-app** - 跨平台应用开发框架
- **Pinia** - Vue状态管理库
- **Axios** - HTTP客户端
- **Vite** - 现代化构建工具

### 后端
- **Express.js** - Node.js Web框架
- **TypeScript** - 类型安全的JavaScript
- **Socket.io** - 实时通信库
- **Winston** - 日志管理
- **CORS** - 跨域资源共享
- **Helmet** - 安全中间件

## 📁 项目结构

```
trade-app/
├── src/                    # 前端源码
│   ├── components/         # Vue组件
│   ├── pages/             # 页面文件
│   ├── stores/            # Pinia状态管理
│   ├── services/          # API服务
│   └── types/             # TypeScript类型定义
├── server/                # 后端源码
│   ├── src/
│   │   ├── routes/        # API路由
│   │   ├── middleware/    # 中间件
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑
│   │   ├── utils/         # 工具函数
│   │   └── websocket/     # WebSocket服务
│   └── package.json
├── vite.config.ts         # Vite配置
├── package.json           # 前端依赖
└── .env                   # 环境变量
```

## 🔧 配置说明

### 环境变量配置

**前端 (.env)**
```env
VITE_WS_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000/api
```

**后端 (server/.env)**
```env
RATE_LIMIT_MAX_REQUESTS=100000
```

### API代理配置

Vite开发服务器配置了API代理，将 `/api` 请求转发到后端服务器:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false
    }
  }
}
```

## 📡 API接口

### 交易相关
- `GET /api/trade/orders` - 获取订单列表
- `POST /api/trade/orders` - 提交新订单
- `POST /api/trade/orders/:id/cancel` - 撤销订单
- `GET /api/trade/positions` - 获取持仓信息
- `GET /api/trade/accounts` - 获取账户信息
- `GET /api/trade/deals` - 获取成交记录

### 系统相关
- `GET /health` - 健康检查
- `GET /ready` - 就绪检查

## 🧪 测试

### API测试示例

```bash
# 获取订单列表
curl -X GET http://localhost:3000/api/trade/orders

# 提交买入订单
curl -X POST http://localhost:3000/api/trade/orders \
  -H "Content-Type: application/json" \
  -d '{
    "code": "000002",
    "name": "万科A",
    "type": "buy",
    "priceType": "limit",
    "price": 25.50,
    "volume": 500
  }'
```

## 📝 开发脚本

### 前端脚本
```bash
npm run dev:h5          # 启动H5开发服务器
npm run build:h5        # 构建H5版本
npm run type-check      # TypeScript类型检查
```

### 后端脚本
```bash
npm run dev             # 启动开发服务器
npm run build           # 构建生产版本
npm run start           # 启动生产服务器
npm run test            # 运行测试
npm run lint            # 代码检查
```

## 🔒 安全特性

- CORS跨域保护
- Helmet安全头设置
- 请求频率限制
- 输入验证和清理
- 错误处理和日志记录

## 📊 性能优化

- Gzip压缩
- 静态资源缓存
- API响应缓存
- WebSocket连接池
- 数据库连接池

## 🚀 部署

### Docker部署
```bash
# 构建Docker镜像
cd server
npm run docker:build

# 运行Docker容器
npm run docker:run
```

### 生产环境配置
1. 设置环境变量
2. 配置数据库连接
3. 设置Redis缓存
4. 配置HTTPS证书
5. 设置反向代理

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目链接: [https://github.com/yourusername/trade-app](https://github.com/yourusername/trade-app)
- 问题反馈: [Issues](https://github.com/yourusername/trade-app/issues)

---

**项目状态**: ✅ 开发完成，功能正常运行  
**最后更新**: 2025年8月6日