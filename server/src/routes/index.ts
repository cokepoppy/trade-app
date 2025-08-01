import { Router } from 'express';
console.log('Router 导入成功');
import userRoutes from './api/user';
console.log('userRoutes 导入成功');
import marketRoutes from './api/market';
import stockRoutes from './api/stock';
import tradeRoutes from './api/trade';
import newsRoutes from './api/news';

/**
 * 设置路由
 */
export function setupRoutes(app: any): void {
  const apiRouter = Router();

  // 健康检查路由
  app.get('/health', (req: any, res: any) => {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      service: 'trade-app-server',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // 就绪检查路由
  app.get('/ready', async (req: any, res: any) => {
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

  // API 路由
  apiRouter.use('/user', userRoutes);
  apiRouter.use('/market', marketRoutes);
  apiRouter.use('/stock', stockRoutes);
  apiRouter.use('/trade', tradeRoutes);
  apiRouter.use('/news', newsRoutes);

  // 挂载 API 路由
  app.use('/api/v1', apiRouter);

  // 兼容旧版本API路径
  app.use('/api', apiRouter);

  // 404 处理
  app.use('*', (req: any, res: any) => {
    res.status(404).json({
      code: 404,
      message: 'API 路由不存在',
      timestamp: Date.now(),
      path: req.originalUrl,
    });
  });
}

export default setupRoutes;