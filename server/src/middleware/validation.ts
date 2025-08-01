import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../types';

/**
 * 请求验证中间件
 */
export const validateRequest = (schema: {
  body?: Joi.Schema;
  query?: Joi.Schema;
  params?: Joi.Schema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        const { error } = schema.body.validate(req.body, {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: true,
        });

        if (error) {
          throw new AppError(400, '请求体验证失败', {
            type: 'body',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
            })),
          });
        }

        req.body = schema.body.validate(req.body).value;
      }

      if (schema.query) {
        const { error } = schema.query.validate(req.query, {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: true,
        });

        if (error) {
          throw new AppError(400, '查询参数验证失败', {
            type: 'query',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
            })),
          });
        }

        req.query = schema.query.validate(req.query).value;
      }

      if (schema.params) {
        const { error } = schema.params.validate(req.params, {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: true,
        });

        if (error) {
          throw new AppError(400, '路径参数验证失败', {
            type: 'params',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
            })),
          });
        }

        req.params = schema.params.validate(req.params).value;
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.code).json({
          code: error.code,
          message: error.message,
          timestamp: Date.now(),
          ...(error.details && { details: error.details }),
        });
      }

      return res.status(500).json({
        code: 500,
        message: '验证服务异常',
        timestamp: Date.now(),
      });
    }
  };
};

/**
 * 用户注册验证
 */
export const registerValidation = {
  body: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(20)
      .required()
      .messages({
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名长度至少3位',
        'string.max': '用户名长度最多20位',
        'string.empty': '用户名不能为空',
        'any.required': '用户名是必需的',
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': '密码长度至少8位',
        'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
        'string.empty': '密码不能为空',
        'any.required': '密码是必需的',
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '邮箱格式不正确',
        'string.empty': '邮箱不能为空',
        'any.required': '邮箱是必需的',
      }),
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .required()
      .messages({
        'string.pattern.base': '手机号格式不正确',
        'string.empty': '手机号不能为空',
        'any.required': '手机号是必需的',
      }),
    captcha: Joi.string()
      .required()
      .messages({
        'string.empty': '验证码不能为空',
        'any.required': '验证码是必需的',
      }),
    deviceInfo: Joi.object({
      deviceId: Joi.string().required(),
      deviceType: Joi.string().valid('mobile', 'tablet', 'desktop').required(),
      deviceName: Joi.string().required(),
      platform: Joi.string().required(),
      osVersion: Joi.string(),
      appVersion: Joi.string(),
      ip: Joi.string(),
      location: Joi.string(),
    }).optional(),
  }),
};

/**
 * 用户登录验证
 */
export const loginValidation = {
  body: Joi.object({
    username: Joi.string()
      .required()
      .messages({
        'string.empty': '用户名不能为空',
        'any.required': '用户名是必需的',
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': '密码长度至少6位',
        'string.empty': '密码不能为空',
        'any.required': '密码是必需的',
      }),
    captcha: Joi.string().optional(),
    deviceInfo: Joi.object({
      deviceId: Joi.string().required(),
      deviceType: Joi.string().valid('mobile', 'tablet', 'desktop').required(),
      deviceName: Joi.string().required(),
      platform: Joi.string().required(),
      osVersion: Joi.string(),
      appVersion: Joi.string(),
      ip: Joi.string(),
      location: Joi.string(),
    }).optional(),
  }),
};

/**
 * 修改密码验证
 */
export const changePasswordValidation = {
  body: Joi.object({
    oldPassword: Joi.string()
      .required()
      .messages({
        'string.empty': '原密码不能为空',
        'any.required': '原密码是必需的',
      }),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': '新密码长度至少8位',
        'string.pattern.base': '新密码必须包含大小写字母、数字和特殊字符',
        'string.empty': '新密码不能为空',
        'any.required': '新密码是必需的',
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': '两次输入的密码不一致',
        'string.empty': '确认密码不能为空',
        'any.required': '确认密码是必需的',
      }),
    captcha: Joi.string().optional(),
  }),
};

/**
 * 重置密码验证
 */
export const resetPasswordValidation = {
  body: Joi.object({
    email: Joi.string()
      .email()
      .when('phone', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        'string.email': '邮箱格式不正确',
        'any.required': '邮箱或手机号必须提供一个',
      }),
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .when('email', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        'string.pattern.base': '手机号格式不正确',
        'any.required': '邮箱或手机号必须提供一个',
      }),
    captcha: Joi.string()
      .required()
      .messages({
        'string.empty': '验证码不能为空',
        'any.required': '验证码是必需的',
      }),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': '新密码长度至少8位',
        'string.pattern.base': '新密码必须包含大小写字母、数字和特殊字符',
        'string.empty': '新密码不能为空',
        'any.required': '新密码是必需的',
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': '两次输入的密码不一致',
        'string.empty': '确认密码不能为空',
        'any.required': '确认密码是必需的',
      }),
  }),
};

/**
 * 更新用户资料验证
 */
export const updateUserProfileValidation = {
  body: Joi.object({
    nickname: Joi.string()
      .min(1)
      .max(50)
      .optional()
      .messages({
        'string.min': '昵称长度至少1位',
        'string.max': '昵称长度最多50位',
      }),
    avatar: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': '头像必须是有效的URL',
      }),
    gender: Joi.string()
      .valid('male', 'female', 'other')
      .optional(),
    birthday: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.max': '生日不能是未来日期',
      }),
    address: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': '地址长度不能超过500位',
      }),
    occupation: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': '职业长度不能超过100位',
      }),
    education: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': '教育程度长度不能超过100位',
      }),
    income: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': '收入范围长度不能超过50位',
      }),
    riskLevel: Joi.string()
      .valid('conservative', 'moderate', 'aggressive')
      .optional(),
    investmentExperience: Joi.string()
      .valid('beginner', 'intermediate', 'advanced')
      .optional(),
    investmentGoal: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': '投资目标长度不能超过500位',
      }),
    investmentPeriod: Joi.string()
      .valid('short', 'medium', 'long')
      .optional(),
  }),
};

/**
 * 分页参数验证
 */
export const paginationValidation = {
  query: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': '页码必须是数字',
        'number.integer': '页码必须是整数',
        'number.min': '页码必须大于0',
      }),
    pageSize: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.base': '每页数量必须是数字',
        'number.integer': '每页数量必须是整数',
        'number.min': '每页数量必须大于0',
        'number.max': '每页数量不能超过100',
      }),
    sortBy: Joi.string()
      .optional(),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': '排序方式只能是 asc 或 desc',
      }),
  }),
};

/**
 * 用户ID验证
 */
export const userIdValidation = {
  params: Joi.object({
    id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': '用户ID格式不正确',
        'string.empty': '用户ID不能为空',
        'any.required': '用户ID是必需的',
      }),
  }),
};

