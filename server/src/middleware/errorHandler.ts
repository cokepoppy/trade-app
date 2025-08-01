import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import logger from '../utils/logger';
import config from '../config';

/**
 * 错误处理中间件
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 记录错误日志
  logger.error('请求处理错误', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: (req as any).requestId,
  });

  // 处理应用错误
  if (error instanceof AppError) {
    return res.status(error.code).json({
      code: error.code,
      message: error.message,
      timestamp: Date.now(),
      traceId: (req as any).requestId,
      ...(error.details && { details: error.details }),
    });
  }

  // 处理 JWT 错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: '无效的访问令牌',
      timestamp: Date.now(),
      traceId: (req as any).requestId,
    });
  }

  // 处理 JWT 过期错误
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: '访问令牌已过期',
      timestamp: Date.now(),
      traceId: (req as any).requestId,
    });
  }

  // 处理验证错误
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: '请求参数验证失败',
      timestamp: Date.now(),
      traceId: (req as any).requestId,
      details: error.message,
    });
  }

  // 处理数据库错误
  if (error.name === 'DatabaseError') {
    return res.status(500).json({
      code: 500,
      message: '数据库操作失败',
      timestamp: Date.now(),
      traceId: (req as any).requestId,
    });
  }

  // 处理 Redis 错误
  if (error.name === 'RedisError') {
    return res.status(500).json({
      code: 500,
      message: '缓存服务异常',
      timestamp: Date.now(),
      traceId: (req as any).requestId,
    });
  }

  // 处理文件上传错误
  if (error.name === 'MulterError') {
    return res.status(400).json({
      code: 400,
      message: '文件上传失败',
      timestamp: Date.now(),
      traceId: (req as any).requestId,
      details: error.message,
    });
  }

  // 处理网络错误
  if (error.name === 'NetworkError') {
    return res.status(503).json({
      code: 503,
      message: '网络连接异常',
      timestamp: Date.now(),
      traceId: (req as any).requestId,
    });
  }

  // 处理未知错误
  if (config.app.env === 'development') {
    // 开发环境返回详细错误信息
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      timestamp: Date.now(),
      traceId: (req as any).requestId,
      stack: error.stack,
      error: error.message,
    });
  } else {
    // 生产环境返回简化错误信息
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      timestamp: Date.now(),
      traceId: (req as any).requestId,
    });
  }
};

/**
 * 404 错误处理
 */
export const notFoundHandler = (req: Request, res: Response) => {
  const error = {
    code: 404,
    message: 'API 路由不存在',
    timestamp: Date.now(),
    traceId: req['requestId'],
    path: req.originalUrl,
    method: req.method,
  };

  logger.warn('404 Not Found', error);
  res.status(404).json(error);
};

/**
 * 异步错误包装器
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 创建应用错误
 */
export const createAppError = (
  code: number,
  message: string,
  details?: any
): AppError => {
  return new AppError(code, message, details);
};

/**
 * 抛出应用错误
 */
export const throwError = (
  code: number,
  message: string,
  details?: any
): never => {
  throw new AppError(code, message, details);
};

/**
 * 包装异步函数错误处理
 */
export const wrapAsync = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return (...args: T): Promise<R> => {
    return fn(...args).catch((error) => {
      logger.error('异步函数错误', { error, args });
      throw error;
    });
  };
};