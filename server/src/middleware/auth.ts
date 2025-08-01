import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userRepository } from '../models';
import { redisClient } from '../utils/redis';
import logger from '../utils/logger';
import config from '../config';
import { AppError } from '../types';

/**
 * JWT 认证中间件
 */
export const authMiddleware = async (
  req: Request & { user?: any; token?: string },
  res: Response,
  next: NextFunction
) => {
  try {
    // 获取 Authorization 头
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, '缺少访问令牌');
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 检查 Token 是否在黑名单中
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AppError(401, '访问令牌已失效');
    }

    // 验证 Token
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // 获取用户信息
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new AppError(401, '用户不存在');
    }

    // 检查用户状态
    if (user.status !== 'active') {
      throw new AppError(401, '用户账号已被禁用');
    }

    // 将用户信息添加到请求对象
    req.user = user;
    req.token = token;

    // 记录认证日志
    logger.debug('用户认证成功', { 
      userId: user.id, 
      username: user.username,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('JWT Token 验证失败', { 
        error: error.message,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({
        code: 401,
        message: '无效的访问令牌',
        timestamp: Date.now()
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('JWT Token 已过期', { 
        path: req.path,
        method: req.method
      });
      return res.status(401).json({
        code: 401,
        message: '访问令牌已过期',
        timestamp: Date.now()
      });
    }

    if (error instanceof AppError) {
      return res.status(error.code).json({
        code: error.code,
        message: error.message,
        timestamp: Date.now()
      });
    }

    logger.error('认证中间件错误', { 
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
      method: req.method
    });

    return res.status(500).json({
      code: 500,
      message: '认证服务异常',
      timestamp: Date.now()
    });
  }
};

/**
 * 可选认证中间件
 */
export const optionalAuthMiddleware = async (
  req: Request & { user?: any; token?: string },
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // 检查 Token 是否在黑名单中
      const isBlacklisted = await redisClient.get(`blacklist:${token}`);
      if (!isBlacklisted) {
        try {
          const decoded = jwt.verify(token, config.jwt.secret) as any;
          const user = await userRepository.findById(decoded.userId);
          
          if (user && user.status === 'active') {
            req.user = user;
            req.token = token;
          }
        } catch (tokenError) {
          // Token 验证失败，继续执行但不设置用户信息
          logger.debug('可选认证失败', { 
            error: tokenError instanceof Error ? tokenError.message : String(tokenError),
            path: req.path
          });
        }
      }
    }

    next();
  } catch (error) {
    logger.error('可选认证中间件错误', { 
      error: error instanceof Error ? error.message : String(error),
      path: req.path
    });
    next();
  }
};

/**
 * 权限检查中间件
 */
export const requirePermissions = (permissions: string | string[]) => {
  return (req: Request & { user?: any }, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未授权访问',
        timestamp: Date.now()
      });
    }

    const userPermissions = req.user.permissions || [];
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      logger.warn('权限检查失败', { 
        userId: req.user.id,
        requiredPermissions,
        userPermissions,
        path: req.path
      });

      return res.status(403).json({
        code: 403,
        message: '权限不足',
        timestamp: Date.now()
      });
    }

    next();
  };
};

/**
 * 角色检查中间件
 */
export const requireRoles = (roles: string | string[]) => {
  return (req: Request & { user?: any }, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未授权访问',
        timestamp: Date.now()
      });
    }

    const userRole = req.user.role;
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    if (!requiredRoles.includes(userRole)) {
      logger.warn('角色检查失败', { 
        userId: req.user.id,
        userRole,
        requiredRoles,
        path: req.path
      });

      return res.status(403).json({
        code: 403,
        message: '权限不足',
        timestamp: Date.now()
      });
    }

    next();
  };
};

/**
 * 用户状态检查中间件
 */
export const requireUserStatus = (statuses: string | string[]) => {
  return (req: Request & { user?: any }, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未授权访问',
        timestamp: Date.now()
      });
    }

    const userStatus = req.user.status;
    const requiredStatuses = Array.isArray(statuses) ? statuses : [statuses];

    if (!requiredStatuses.includes(userStatus)) {
      logger.warn('用户状态检查失败', { 
        userId: req.user.id,
        userStatus,
        requiredStatuses,
        path: req.path
      });

      return res.status(403).json({
        code: 403,
        message: '用户账号状态异常',
        timestamp: Date.now()
      });
    }

    next();
  };
};

/**
 * 已验证用户中间件
 */
export const requireVerifiedUser = (req: Request & { user?: any }, res: Response, next: NextFunction): void | Response => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '未授权访问',
      timestamp: Date.now()
    });
  }

  if (!req.user.is_verified) {
    return res.status(403).json({
      code: 403,
      message: '需要验证用户身份',
      timestamp: Date.now()
    });
  }

  next();
};

/**
 * 已认证用户中间件
 */
export const requireCertifiedUser = (req: Request & { user?: any }, res: Response, next: NextFunction): void | Response => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '未授权访问',
      timestamp: Date.now()
    });
  }

  if (!req.user.is_certified) {
    return res.status(403).json({
      code: 403,
      message: '需要认证用户身份',
      timestamp: Date.now()
    });
  }

  next();
};

/**
 * 管理员中间件
 */
export const requireAdmin = (req: Request & { user?: any }, res: Response, next: NextFunction): void | Response => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '未授权访问',
      timestamp: Date.now()
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 403,
      message: '需要管理员权限',
      timestamp: Date.now()
    });
  }

  next();
};

