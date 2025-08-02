import { Express } from 'express';
console.log('Express 导入成功');
import cors from 'cors';
console.log('cors 导入成功');
import helmet from 'helmet';
console.log('helmet 导入成功');
import compression from 'compression';
console.log('compression 导入成功');
import rateLimit from 'express-rate-limit';
console.log('express-rate-limit 导入成功');
import config from '../config';
console.log('config 导入成功');

/**
 * 设置中间件
 */
export const setupMiddleware = () => {
  const middleware = [];

  // 1. 安全中间件
  middleware.push(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    })
  );

  // 2. CORS 中间件
  middleware.push(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = config.app.env === 'production'
          ? process.env.CORS_ORIGIN?.split(',') || ['https://yourdomain.com']
          : ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'];

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log('CORS blocked origin:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-ID',
        'X-API-Key',
      ],
      exposedHeaders: ['X-Request-ID', 'X-Response-Time'],
      maxAge: 86400, // 24小时
    })
  );

  // 3. 压缩中间件
  middleware.push(
    compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    })
  );

  // 4. 限流中间件
  middleware.push(
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: config.rateLimit.message,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // 跳过健康检查和就绪检查
        return ['/health', '/ready'].includes(req.path);
      },
    })
  );

  // 返回中间件数组
  return middleware;
};

/**
 * 组合中间件
 */
export const combineMiddleware = (...middlewares: any[]) => {
  return (req: any, res: any, next: any) => {
    const dispatch = (i: number) => {
      if (i >= middlewares.length) {
        return next();
      }
      return middlewares[i](req, res, () => dispatch(i + 1));
    };
    return dispatch(0);
  };
};

/**
 * 条件中间件
 */
export const conditionalMiddleware = (
  condition: (req: any) => boolean,
  middleware: any
) => {
  return (req: any, res: any, next: any) => {
    if (condition(req)) {
      middleware(req, res, next);
    } else {
      next();
    }
  };
};

/**
 * 路由级别中间件
 */
export const routeMiddleware = {
  // 认证中间件
  auth: (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未授权访问',
        timestamp: Date.now(),
      });
    }
    next();
  },

  // 管理员中间件
  admin: (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足',
        timestamp: Date.now(),
      });
    }
    next();
  },

  // 已验证用户中间件
  verified: (req: any, res: any, next: any) => {
    if (!req.user || !req.user.isVerified) {
      return res.status(403).json({
        code: 403,
        message: '需要验证用户身份',
        timestamp: Date.now(),
      });
    }
    next();
  },

  // 已认证用户中间件
  certified: (req: any, res: any, next: any) => {
    if (!req.user || !req.user.isCertified) {
      return res.status(403).json({
        code: 403,
        message: '需要认证用户身份',
        timestamp: Date.now(),
      });
    }
    next();
  },
};