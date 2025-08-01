import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * 请求日志中间件
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // 响应完成时记录日志
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip, headers } = req;
    const { statusCode } = res;

    // 提取用户代理
    const userAgent = headers['user-agent'] || 'Unknown';

    // 提取真实IP（考虑代理）
    const realIp = headers['x-forwarded-for'] || headers['x-real-ip'] || ip;

    // 记录请求日志
    logger.info('HTTP Request', {
      method,
      url: originalUrl,
      statusCode,
      duration,
      ip: realIp,
      userAgent,
      contentLength: res.get('content-length'),
    });

    // 记录慢请求
    if (duration > 1000) {
      logger.warn('Slow Request', {
        method,
        url: originalUrl,
        duration,
        ip: realIp,
      });
    }

    // 记录错误请求
    if (statusCode >= 400) {
      const logLevel = statusCode >= 500 ? 'error' : 'warn';
      logger[logLevel]('HTTP Error Response', {
        method,
        url: originalUrl,
        statusCode,
        duration,
        ip: realIp,
      });
    }
  });

  next();
};

/**
 * 请求追踪中间件
 */
export const requestTracer = (req: Request, res: Response, next: NextFunction) => {
  // 生成请求ID
  const requestId = generateRequestId();
  
  // 添加到请求对象
  req['requestId'] = requestId;
  req['startTime'] = Date.now();

  // 添加到响应头
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Response-Time', '0');

  // 响应完成时更新响应时间
  res.on('finish', () => {
    const responseTime = Date.now() - req['startTime'];
    res.setHeader('X-Response-Time', responseTime.toString());
  });

  next();
};

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * 请求验证中间件
 */
export const requestValidator = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const validationError = {
        code: 400,
        message: '请求参数验证失败',
        details: error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.value,
        })),
        timestamp: Date.now(),
      };

      logger.warn('请求验证失败', validationError);
      return res.status(400).json(validationError);
    }

    // 使用验证后的数据
    req.body = value;
    next();
  };
};

/**
 * 查询参数验证中间件
 */
export const queryValidator = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const validationError = {
        code: 400,
        message: '查询参数验证失败',
        details: error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.value,
        })),
        timestamp: Date.now(),
      };

      logger.warn('查询参数验证失败', validationError);
      return res.status(400).json(validationError);
    }

    // 使用验证后的数据
    req.query = value;
    next();
  };
};

/**
 * 路径参数验证中间件
 */
export const paramsValidator = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const validationError = {
        code: 400,
        message: '路径参数验证失败',
        details: error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.value,
        })),
        timestamp: Date.now(),
      };

      logger.warn('路径参数验证失败', validationError);
      return res.status(400).json(validationError);
    }

    // 使用验证后的数据
    req.params = value;
    next();
  };
};