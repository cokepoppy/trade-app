import express from 'express';
console.log('express 导入成功');
import cors from 'cors';
console.log('cors 导入成功');
import helmet from 'helmet';
console.log('helmet 导入成功');
import compression from 'compression';
console.log('compression 导入成功');
import rateLimit from 'express-rate-limit';
console.log('express-rate-limit 导入成功');
import { createServer } from 'http';
console.log('http server 导入成功');
import config from './config';
console.log('config 导入成功');
import logger from './utils/logger';
console.log('logger 导入成功');
import { setupRoutes } from './routes';
console.log('setupRoutes 导入成功');
import { setupMiddleware } from './middleware';
console.log('setupMiddleware 导入成功');
import { errorHandler } from './middleware/errorHandler';
console.log('errorHandler 导入成功');
import { requestLogger } from './middleware/requestLogger';
console.log('requestLogger 导入成功');
import { MarketDataWebSocketServer } from './websocket/marketDataServer';
console.log('MarketDataWebSocketServer 导入成功');
console.log('🔧 Starting server initialization...');

class App {
  public app: express.Application;
  public port: number;
  public server: any;
  public wsServer: MarketDataWebSocketServer;

  constructor() {
    console.log('🏗️  Creating Express app...');
    this.app = express();
    this.port = config.app.port;
    console.log(`📡 Configured port: ${this.port}`);
    this.server = createServer(this.app);
    this.wsServer = new MarketDataWebSocketServer(this.server);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    console.log('✅ Server initialization completed');
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    console.log('🔧 Setting up middleware...');
    
    try {
      // 安全中间件
      console.log('🛡️  Setting up helmet...');
      this.app.use(helmet());
      
      // CORS 中间件
      console.log('🌐 Setting up CORS...');
      this.app.use(cors({
        origin: config.app.env === 'production' 
          ? process.env.CORS_ORIGIN?.split(',') || ['https://yourdomain.com']
          : ['http://localhost:8080', 'http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      }));

      // 压缩中间件
      console.log('🗜️  Setting up compression...');
      this.app.use(compression());

      // 请求解析中间件
      console.log('📝 Setting up body parser...');
      this.app.use(express.json({ limit: '10mb' }));
      this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

      // 限流中间件
      console.log('🚦 Setting up rate limit...');
      this.app.use(rateLimit(config.rateLimit));

      // 自定义中间件
      console.log('📊 Setting up request logger...');
      this.app.use(requestLogger);
      
      // 应用设置好的中间件
      console.log('⚙️  Setting up custom middleware...');
      const middleware = setupMiddleware();
      middleware.forEach(m => this.app.use(m));
      
      console.log('✅ Middleware setup completed');
    } catch (error) {
      console.error('❌ Middleware setup failed:', error);
      throw error;
    }
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    console.log('🛣️  Setting up routes...');
    
    try {
      // 健康检查路由
      console.log('❤️  Setting up health check route...');
      this.app.get('/health', (req, res) => {
        res.json({
          status: 'ok',
          timestamp: Date.now(),
          service: config.app.name,
          version: config.app.version,
          environment: config.app.env,
        });
      });

      // 就绪检查路由
      console.log('✅ Setting up readiness check route...');
      this.app.get('/ready', async (req, res) => {
        try {
          // 检查数据库连接
          // await database.getConnection();
          
          // 检查 Redis 连接
          // await redisClient.connect();
          
          res.json({
            status: 'ready',
            timestamp: Date.now(),
            checks: {
              database: 'ok',
              redis: 'ok',
            },
          });
        } catch (error) {
          res.status(503).json({
            status: 'not ready',
            timestamp: Date.now(),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      // 设置 API 路由
      console.log('🔗 Setting up API routes...');
      setupRoutes(this.app);
      
      console.log('✅ Routes setup completed');
    } catch (error) {
      console.error('❌ Routes setup failed:', error);
      throw error;
    }
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    console.log('🚨 Setting up error handling...');
    
    try {
      // 404 处理
      console.log('🔍 Setting up 404 handler...');
      this.app.use('*', (req, res) => {
        res.status(404).json({
          code: 404,
          message: 'API 路由不存在',
          timestamp: Date.now(),
          path: req.originalUrl,
        });
      });

      // 错误处理中间件
      console.log('⚠️  Setting up error handler...');
      this.app.use(errorHandler);
      
      console.log('✅ Error handling setup completed');
    } catch (error) {
      console.error('❌ Error handling setup failed:', error);
      throw error;
    }
  }

  /**
   * 启动服务器
   */
  public async start(): Promise<void> {
    try {
      // Initialize WebSocket server
      console.log('🔌 Initializing WebSocket server...');
      await this.wsServer.initialize();
      
      return new Promise((resolve, reject) => {
        this.server.listen(this.port, () => {
          logger.info(`服务器启动成功`, {
            port: this.port,
            environment: config.app.env,
            apiPrefix: config.app.apiPrefix,
            webSocket: 'enabled'
          });

          console.log('🚀 Starting server...');
          // 打印路由信息
          this.printRoutes();
          
          // Print WebSocket stats
          console.log('📊 WebSocket Server Stats:', this.wsServer.getStats());
          
          resolve();
        });
        
        this.server.on('error', (error) => {
          console.error('❌ Server error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      throw error;
    }
  }

  /**
   * 打印路由信息
   */
  private printRoutes(): void {
    const routes = this.app._router.stack
      .filter((route: any) => route.route)
      .map((route: any) => {
        const methods = Object.keys(route.route.methods)
          .map((method) => method.toUpperCase())
          .join(', ');
        return `${methods} ${route.route.path}`;
      });

    logger.info('可用路由:', routes);
  }

  /**
   * 获取 Express 应用实例
   */
  public getApp(): express.Application {
    return this.app;
  }
}

// 创建应用实例
const app = new App();

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  console.log('🚀 Starting server...');
  
  // 添加未处理的 Promise 拒绝处理
  process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的 Promise 拒绝:', reason);
    console.error('Promise:', promise);
    process.exit(1);
  });
  
  // 添加未捕获的异常处理
  process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    process.exit(1);
  });
  
  app.start().catch(error => {
    console.error('服务器启动失败:', error);
    process.exit(1);
  });
}

export default app;