import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

/**
 * 开发环境认证绕过中间件
 * 仅用于开发环境，在生产环境中不应该使用
 */
export const devAuthMiddleware = async (
  req: Request & { user?: any; token?: string },
  res: Response,
  next: NextFunction
) => {
  // 只在开发环境中使用
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      code: 403,
      message: '开发模式认证绕过仅允许在开发环境中使用',
      timestamp: Date.now()
    });
  }

  try {
    // 创建一个模拟用户
    const mockUser = {
      id: 'dev-user-123',
      username: 'dev_user',
      email: 'dev@example.com',
      phone: '13800138000',
      role: 'user',
      status: 'active',
      is_verified: true,
      is_certified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 将模拟用户信息添加到请求对象
    req.user = mockUser;
    req.token = 'dev-token-123';

    console.log('开发模式认证绕过已启用', { 
      userId: mockUser.id, 
      username: mockUser.username,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    console.error('开发认证中间件错误', { 
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
      method: req.method
    });

    return res.status(500).json({
      code: 500,
      message: '开发认证服务异常',
      timestamp: Date.now()
    });
  }
};