import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { User, LoginRequest, PhoneLoginRequest, RegisterRequest, ChangePasswordRequest, ResetPasswordRequest, LoginApiResponse, RegisterApiResponse, AuthenticatedRequest } from '../../types';
import { userService } from '../../services/userService';
import { asyncHandler } from '../../middleware/errorHandler';
import { createAppError } from '../../types';
import logger from '../../utils/logger';

/**
 * 用户控制器
 */
export class UserController {
  /**
   * 用户登录
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { username, password, captcha, deviceInfo } = req.body as LoginRequest;

    // 验证请求参数
    const schema = Joi.object({
      username: Joi.string().required().messages({
        'string.empty': '用户名不能为空',
        'any.required': '用户名是必需的'
      }),
      password: Joi.string().min(6).required().messages({
        'string.min': '密码长度至少6位',
        'string.empty': '密码不能为空',
        'any.required': '密码是必需的'
      }),
      captcha: Joi.string().optional(),
      deviceInfo: Joi.object().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      throw createAppError(400, '请求参数验证失败', error.details);
    }

    // 调用用户服务登录
    const result = await userService.login(username, password, {
      captcha,
      deviceInfo,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }) as LoginApiResponse;

    logger.info('用户登录成功', { username, userId: result.data?.userInfo?.id });

    res.json({
      code: 0,
      message: '登录成功',
      data: result,
      timestamp: Date.now()
    });
  });

  /**
   * 手机号登录
   */
  loginByPhone = asyncHandler(async (req: Request, res: Response) => {
    const { phone, smsCode, deviceInfo } = req.body as PhoneLoginRequest;

    // 验证请求参数
    const schema = Joi.object({
      phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({
        'string.pattern.base': '手机号格式不正确',
        'string.empty': '手机号不能为空',
        'any.required': '手机号是必需的'
      }),
      smsCode: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
        'string.length': '验证码长度必须为6位',
        'string.pattern.base': '验证码必须为数字',
        'string.empty': '验证码不能为空',
        'any.required': '验证码是必需的'
      }),
      deviceInfo: Joi.object().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      throw createAppError(400, '请求参数验证失败', error.details);
    }

    // 调用用户服务手机登录
    const result = await userService.loginByPhone(phone, smsCode, {
      deviceInfo,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }) as LoginApiResponse;

    logger.info('手机号登录成功', { phone, userId: result.data?.userInfo?.id });

    res.json({
      code: 0,
      message: '登录成功',
      data: result,
      timestamp: Date.now()
    });
  });

  /**
   * 发送短信验证码
   */
  sendSmsCode = asyncHandler(async (req: Request, res: Response) => {
    const { phone, type = 'login' } = req.body;

    // 验证请求参数
    const schema = Joi.object({
      phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({
        'string.pattern.base': '手机号格式不正确',
        'string.empty': '手机号不能为空',
        'any.required': '手机号是必需的'
      }),
      type: Joi.string().valid('login', 'register', 'reset').optional().messages({
        'any.only': '验证码类型不正确'
      })
    });

    const { error } = schema.validate(req.body);
    if (error) {
      throw createAppError(400, '请求参数验证失败', error.details);
    }

    // 调用用户服务发送短信验证码
    const result = await userService.sendSmsCode(phone, type as 'login' | 'register' | 'reset', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info('短信验证码发送成功', { phone, type });

    res.json({
      code: 0,
      message: '验证码发送成功',
      data: result,
      timestamp: Date.now()
    });
  });

  /**
   * 获取图形验证码
   */
  getCaptcha = asyncHandler(async (req: Request, res: Response) => {
    // 调用用户服务获取验证码
    const result = await userService.getCaptcha();

    res.json({
      code: 0,
      message: '验证码获取成功',
      data: result,
      timestamp: Date.now()
    });
  });

  /**
   * 用户注册
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const registerData = req.body as RegisterRequest;

    // 验证请求参数
    const schema = Joi.object({
      username: Joi.string().alphanum().min(3).max(20).required().messages({
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名长度至少3位',
        'string.max': '用户名长度最多20位',
        'string.empty': '用户名不能为空',
        'any.required': '用户名是必需的'
      }),
      password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
        'string.min': '密码长度至少8位',
        'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
        'string.empty': '密码不能为空',
        'any.required': '密码是必需的'
      }),
      email: Joi.string().email().required().messages({
        'string.email': '邮箱格式不正确',
        'string.empty': '邮箱不能为空',
        'any.required': '邮箱是必需的'
      }),
      phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({
        'string.pattern.base': '手机号格式不正确',
        'string.empty': '手机号不能为空',
        'any.required': '手机号是必需的'
      }),
      captcha: Joi.string().required().messages({
        'string.empty': '验证码不能为空',
        'any.required': '验证码是必需的'
      }),
      deviceInfo: Joi.object().optional()
    });

    const { error } = schema.validate(registerData);
    if (error) {
      throw createAppError(400, '请求参数验证失败', error.details);
    }

    // 调用用户服务注册
    const result = await userService.register(registerData, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }) as RegisterApiResponse;

    logger.info('用户注册成功', { username: registerData.username, userId: result.data?.userId });

    res.status(201).json({
      code: 0,
      message: '注册成功',
      data: result,
      timestamp: Date.now()
    });
  });

  /**
   * 用户登出
   */
  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const token = req.token;

    if (userId && token) {
      await userService.logout(userId, token);
      logger.info('用户登出成功', { userId });
    }

    res.json({
      code: 0,
      message: '登出成功',
      data: null,
      timestamp: Date.now()
    });
  });

  /**
   * 刷新Token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createAppError(400, '刷新令牌不能为空');
    }

    const result = await userService.refreshToken(refreshToken);

    res.json({
      code: 0,
      message: 'Token刷新成功',
      data: result,
      timestamp: Date.now()
    });
  });

  /**
   * 获取当前用户信息
   */
  getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    const user = await userService.getUserById(userId);

    res.json({
      code: 0,
      message: '获取用户信息成功',
      data: user,
      timestamp: Date.now()
    });
  });

  /**
   * 更新用户资料
   */
  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    // 验证更新数据
    const schema = Joi.object({
      nickname: Joi.string().min(1).max(50).optional(),
      avatar: Joi.string().uri().optional(),
      gender: Joi.string().valid('male', 'female', 'other').optional(),
      birthday: Joi.date().optional(),
      address: Joi.string().max(500).optional(),
      occupation: Joi.string().max(100).optional(),
      education: Joi.string().max(100).optional(),
      income: Joi.string().max(50).optional(),
      risk_level: Joi.string().valid('conservative', 'moderate', 'aggressive').optional(),
      investment_experience: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
      investment_goal: Joi.string().max(500).optional(),
      investment_period: Joi.string().valid('short', 'medium', 'long').optional()
    });

    const { error } = schema.validate(updateData);
    if (error) {
      throw createAppError(400, '请求参数验证失败', error.details);
    }

    const user = await userService.updateUser(userId, updateData);

    logger.info('用户资料更新成功', { userId, updates: Object.keys(updateData) });

    res.json({
      code: 0,
      message: '用户资料更新成功',
      data: user,
      timestamp: Date.now()
    });
  });

  /**
   * 修改密码
   */
  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { oldPassword, newPassword, confirmPassword, captcha } = req.body as ChangePasswordRequest;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    // 验证请求参数
    const schema = Joi.object({
      oldPassword: Joi.string().required().messages({
        'string.empty': '原密码不能为空',
        'any.required': '原密码是必需的'
      }),
      newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
        'string.min': '新密码长度至少8位',
        'string.pattern.base': '新密码必须包含大小写字母、数字和特殊字符',
        'string.empty': '新密码不能为空',
        'any.required': '新密码是必需的'
      }),
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': '两次输入的密码不一致',
        'string.empty': '确认密码不能为空',
        'any.required': '确认密码是必需的'
      }),
      captcha: Joi.string().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      throw createAppError(400, '请求参数验证失败', error.details);
    }

    await userService.changePassword(userId, oldPassword, newPassword, {
      captcha,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info('用户密码修改成功', { userId });

    res.json({
      code: 0,
      message: '密码修改成功',
      data: null,
      timestamp: Date.now()
    });
  });

  /**
   * 重置密码
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, phone, captcha, newPassword, confirmPassword } = req.body as ResetPasswordRequest;

    // 验证请求参数
    const schema = Joi.object({
      email: Joi.string().email().when('phone', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required()
      }),
      phone: Joi.string().pattern(/^1[3-9]\d{9}$/).when('email', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required()
      }),
      captcha: Joi.string().required().messages({
        'string.empty': '验证码不能为空',
        'any.required': '验证码是必需的'
      }),
      newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
        'string.min': '新密码长度至少8位',
        'string.pattern.base': '新密码必须包含大小写字母、数字和特殊字符',
        'string.empty': '新密码不能为空',
        'any.required': '新密码是必需的'
      }),
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': '两次输入的密码不一致',
        'string.empty': '确认密码不能为空',
        'any.required': '确认密码是必需的'
      })
    });

    const { error } = schema.validate(req.body);
    if (error) {
      throw createAppError(400, '请求参数验证失败', error.details);
    }

    await userService.resetPassword({
      email,
      phone,
      captcha,
      newPassword
    }, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info('用户密码重置成功', { email, phone });

    res.json({
      code: 0,
      message: '密码重置成功',
      data: null,
      timestamp: Date.now()
    });
  });

  /**
   * 获取用户详细资料
   */
  getUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    const profile = await userService.getUserProfile(userId);

    res.json({
      code: 0,
      message: '获取用户资料成功',
      data: profile,
      timestamp: Date.now()
    });
  });

  /**
   * 获取用户设置
   */
  getUserSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    const settings = await userService.getUserSettings(userId);

    res.json({
      code: 0,
      message: '获取用户设置成功',
      data: settings,
      timestamp: Date.now()
    });
  });

  /**
   * 更新用户设置
   */
  updateUserSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const settingsData = req.body;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    const settings = await userService.updateUserSettings(userId, settingsData);

    logger.info('用户设置更新成功', { userId });

    res.json({
      code: 0,
      message: '用户设置更新成功',
      data: settings,
      timestamp: Date.now()
    });
  });

  /**
   * 获取用户设备列表
   */
  getUserDevices = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    const devices = await userService.getUserDevices(userId);

    res.json({
      code: 0,
      message: '获取用户设备列表成功',
      data: devices,
      timestamp: Date.now()
    });
  });

  /**
   * 获取用户登录历史
   */
  getLoginHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, pageSize = 20 } = req.query;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    const history = await userService.getLoginHistory(userId, {
      page: Number(page),
      pageSize: Number(pageSize)
    });

    res.json({
      code: 0,
      message: '获取登录历史成功',
      data: history,
      timestamp: Date.now()
    });
  });

  /**
   * 获取用户活动记录
   */
  getUserActivities = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, pageSize = 20, type } = req.query;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    const activities = await userService.getUserActivities(userId, {
      page: Number(page),
      pageSize: Number(pageSize),
      type: type as string
    });

    res.json({
      code: 0,
      message: '获取用户活动记录成功',
      data: activities,
      timestamp: Date.now()
    });
  });

  /**
   * 获取用户消息
   */
  getUserMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, pageSize = 20, type, isRead, priority } = req.query;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    const messages = await userService.getUserMessages(userId, {
      page: Number(page),
      pageSize: Number(pageSize),
      type: type as string,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      priority: priority as string
    });

    res.json({
      code: 0,
      message: '获取用户消息成功',
      data: messages,
      timestamp: Date.now()
    });
  });

  /**
   * 获取消息详情
   */
  getMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { messageId } = req.params;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    const message = await userService.getMessage(userId, messageId);

    res.json({
      code: 0,
      message: '获取消息详情成功',
      data: message,
      timestamp: Date.now()
    });
  });

  /**
   * 标记消息为已读
   */
  markMessageAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { messageId } = req.params;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    await userService.markMessageAsRead(userId, messageId);

    res.json({
      code: 0,
      message: '标记消息为已读成功',
      data: null,
      timestamp: Date.now()
    });
  });

  /**
   * 标记所有消息为已读
   */
  markAllMessagesAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    await userService.markAllMessagesAsRead(userId);

    res.json({
      code: 0,
      message: '标记所有消息为已读成功',
      data: null,
      timestamp: Date.now()
    });
  });

  /**
   * 删除消息
   */
  deleteMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { messageId } = req.params;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    await userService.deleteMessage(userId, messageId);

    res.json({
      code: 0,
      message: '删除消息成功',
      data: null,
      timestamp: Date.now()
    });
  });

  /**
   * 获取未读消息
   */
  getUnreadMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw createAppError(401, '未授权访问');
    }

    const messages = await userService.getUnreadMessages(userId);

    res.json({
      code: 0,
      message: '获取未读消息成功',
      data: messages,
      timestamp: Date.now()
    });
  });
}

// 导出控制器实例
export const userController = new UserController();