import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { 
  User, 
  UserProfile, 
  UserSettings, 
  LoginRequest, 
  RegisterRequest, 
  ApiResponse,
  PaginationParams,
  PaginationResult
} from '../types';
import { 
  userRepository, 
  userProfileRepository, 
  userSettingsRepository 
} from '../models';
import { redisClient } from '../utils/redis';
import logger from '../utils/logger';
import { AppError } from '../types';

/**
 * 用户服务
 */
export class UserService {
  /**
   * 用户登录
   */
  async login(
    username: string, 
    password: string, 
    options: {
      captcha?: string;
      deviceInfo?: any;
      ip?: string;
      userAgent?: string;
    } = {}
  ): Promise<ApiResponse<any>> {
    try {
      // 查找用户
      const user = await userRepository.findByUsername(username);
      if (!user) {
        throw new AppError(401, '用户名或密码错误');
      }

      // 检查用户状态
      if (user.status !== 'active') {
        throw new AppError(401, '用户账号已被禁用或未激活');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
      if (!isPasswordValid) {
        // 记录登录失败
        await this.recordLoginAttempt(user.id, false, options.ip, options.userAgent);
        throw new AppError(401, '用户名或密码错误');
      }

      // 检查是否需要验证码
      if (options.captcha) {
        const isValidCaptcha = await this.validateCaptcha(username, options.captcha);
        if (!isValidCaptcha) {
          throw new AppError(401, '验证码错误');
        }
      }

      // 生成 JWT Token
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // 更新用户登录信息
      await userRepository.updateLastLogin(user.id);

      // 记录登录成功
      await this.recordLoginSuccess(user.id, options.ip, options.userAgent, options.deviceInfo);

      // 记录用户设备
      if (options.deviceInfo) {
        await this.recordUserDevice(user.id, options.deviceInfo, options.ip);
      }

      // 获取用户设置
      const settings = await userSettingsRepository.findByUserId(user.id);

      // 记录用户活动
      await this.recordUserActivity(user.id, 'login', 'user_login', {
        ip: options.ip,
        userAgent: options.userAgent,
        deviceInfo: options.deviceInfo
      });

      return {
        code: 200,
        message: '登录成功',
        data: {
          token,
          refreshToken,
          expiresIn: config.jwt.expiresIn,
          userInfo: this.sanitizeUser(user),
          permissions: this.getUserPermissions(user),
          settings: settings || this.getDefaultSettings()
        },
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('用户登录失败', { username, error });
      throw error;
    }
  }

  /**
   * 用户注册
   */
  async register(
    registerData: RegisterRequest, 
    options: {
      ip?: string;
      userAgent?: string;
    } = {}
  ): Promise<ApiResponse<any>> {
    try {
      const { username, password, email, phone, captcha, deviceInfo } = registerData;

      // 验证用户名是否已存在
      const usernameExists = await userRepository.isUsernameExists(username);
      if (usernameExists) {
        throw new AppError(409, '用户名已存在');
      }

      // 验证邮箱是否已存在
      const emailExists = await userRepository.isEmailExists(email);
      if (emailExists) {
        throw new AppError(409, '邮箱已被使用');
      }

      // 验证手机号是否已存在
      const phoneExists = await userRepository.isPhoneExists(phone);
      if (phoneExists) {
        throw new AppError(409, '手机号已被使用');
      }

      // 验证验证码
      const isValidCaptcha = await this.validateCaptcha(email, captcha);
      if (!isValidCaptcha) {
        throw new AppError(401, '验证码错误');
      }

      // 加密密码
      const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);

      // 创建用户
      const user = await userRepository.create({
        username,
        passwordHash,
        email,
        phone,
        nickname: username,
        registerTime: Date.now(),
        updateTime: Date.now()
      });

      // 生成初始 Token
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // 记录用户活动
      await this.recordUserActivity(user.id, 'register', 'user_register', {
        ip: options.ip,
        userAgent: options.userAgent,
        deviceInfo: deviceInfo
      });

      // 记录用户设备
      if (deviceInfo) {
        await this.recordUserDevice(user.id, deviceInfo, options.ip);
      }

      logger.info('用户注册成功', { username, userId: user.id });

      return {
        code: 200,
        message: '注册成功',
        data: {
          userId: user.id,
          token,
          refreshToken,
          expiresIn: config.jwt.expiresIn,
          userInfo: this.sanitizeUser(user)
        },
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('用户注册失败', { username: registerData.username, error });
      throw error;
    }
  }

  /**
   * 用户登出
   */
  async logout(userId: string, token: string): Promise<void> {
    try {
      // 将 Token 加入黑名单
      await this.blacklistToken(token);

      // 清除用户会话缓存
      await redisClient.del(`session:${userId}:${token}`);

      // 记录用户活动
      await this.recordUserActivity(userId, 'logout', 'user_logout');

      logger.info('用户登出成功', { userId });
    } catch (error) {
      logger.error('用户登出失败', { userId, error });
      throw error;
    }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<any>> {
    try {
      // 验证刷新 Token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      
      // 检查用户是否存在
      const user = await userRepository.findById(decoded.userId);
      if (!user || user.status !== 'active') {
        throw new AppError(401, '无效的刷新令牌');
      }

      // 检查刷新令牌是否被撤销
      const isBlacklisted = await redisClient.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        throw new AppError(401, '刷新令牌已失效');
      }

      // 生成新的 Token
      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // 将旧的刷新令牌加入黑名单
      await this.blacklistToken(refreshToken);

      return {
        code: 200,
        message: 'Token刷新成功',
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
          expiresIn: config.jwt.expiresIn
        },
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Token刷新失败', { error });
      throw new AppError(401, '刷新令牌失效');
    }
  }

  /**
   * 获取用户信息
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError(404, '用户不存在');
      }
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('获取用户信息失败', { userId, error });
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId: string, updateData: Partial<User>): Promise<User> {
    try {
      // 检查用户是否存在
      const existingUser = await userRepository.findById(userId);
      if (!existingUser) {
        throw new AppError(404, '用户不存在');
      }

      // 如果更新用户名，检查是否已存在
      if (updateData.username && updateData.username !== existingUser.username) {
        const usernameExists = await userRepository.isUsernameExists(updateData.username, userId);
        if (usernameExists) {
          throw new AppError(409, '用户名已存在');
        }
      }

      // 如果更新邮箱，检查是否已存在
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await userRepository.isEmailExists(updateData.email, userId);
        if (emailExists) {
          throw new AppError(409, '邮箱已被使用');
        }
      }

      // 如果更新手机号，检查是否已存在
      if (updateData.phone && updateData.phone !== existingUser.phone) {
        const phoneExists = await userRepository.isPhoneExists(updateData.phone, userId);
        if (phoneExists) {
          throw new AppError(409, '手机号已被使用');
        }
      }

      // 更新用户信息
      const updatedUser = await userRepository.update(userId, updateData);

      // 记录用户活动
      await this.recordUserActivity(userId, 'update', 'user_profile_update', {
        updates: Object.keys(updateData)
      });

      logger.info('用户信息更新成功', { userId, updates: Object.keys(updateData) });

      return this.sanitizeUser(updatedUser);
    } catch (error) {
      logger.error('更新用户信息失败', { userId, updateData, error });
      throw error;
    }
  }

  /**
   * 修改密码
   */
  async changePassword(
    userId: string, 
    oldPassword: string, 
    newPassword: string,
    options: {
      captcha?: string;
      ip?: string;
      userAgent?: string;
    } = {}
  ): Promise<void> {
    try {
      // 获取用户信息
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError(404, '用户不存在');
      }

      // 验证原密码
      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash || '');
      if (!isOldPasswordValid) {
        throw new AppError(401, '原密码错误');
      }

      // 验证新密码格式
      if (newPassword === oldPassword) {
        throw new AppError(400, '新密码不能与原密码相同');
      }

      // 加密新密码
      const newPasswordHash = await bcrypt.hash(newPassword, config.bcrypt.rounds);

      // 更新密码
      await userRepository.update(userId, {
        passwordHash: newPasswordHash,
        updateTime: Date.now()
      });

      // 清除所有相关的 Token
      await this.clearUserTokens(userId);

      // 记录用户活动
      await this.recordUserActivity(userId, 'update', 'user_password_change', {
        ip: options.ip,
        userAgent: options.userAgent
      });

      logger.info('用户密码修改成功', { userId });
    } catch (error) {
      logger.error('修改密码失败', { userId, error });
      throw error;
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(
    resetData: {
      email?: string;
      phone?: string;
      captcha: string;
      newPassword: string;
    },
    options: {
      ip?: string;
      userAgent?: string;
    } = {}
  ): Promise<void> {
    try {
      const { email, phone, captcha, newPassword } = resetData;

      // 查找用户
      let user: User | null = null;
      if (email) {
        user = await userRepository.findByEmail(email);
      } else if (phone) {
        user = await userRepository.findByPhone(phone);
      }

      if (!user) {
        throw new AppError(404, '用户不存在');
      }

      // 验证验证码
      const isValidCaptcha = await this.validateCaptcha(email || phone || '', captcha);
      if (!isValidCaptcha) {
        throw new AppError(401, '验证码错误');
      }

      // 加密新密码
      const newPasswordHash = await bcrypt.hash(newPassword, config.bcrypt.rounds);

      // 更新密码
      await userRepository.update(user.id, {
        passwordHash: newPasswordHash,
        updateTime: Date.now()
      });

      // 清除所有相关的 Token
      await this.clearUserTokens(user.id);

      // 记录用户活动
      await this.recordUserActivity(user.id, 'update', 'user_password_reset', {
        ip: options.ip,
        resetMethod: email ? 'email' : 'phone'
      });

      logger.info('用户密码重置成功', { userId: user.id, resetMethod: email ? 'email' : 'phone' });
    } catch (error) {
      logger.error('重置密码失败', { resetData, error });
      throw error;
    }
  }

  /**
   * 获取用户详细资料
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profile = await userProfileRepository.findByUserId(userId);
      return profile;
    } catch (error) {
      logger.error('获取用户资料失败', { userId, error });
      throw error;
    }
  }

  /**
   * 获取用户设置
   */
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const settings = await userSettingsRepository.findByUserId(userId);
      return settings;
    } catch (error) {
      logger.error('获取用户设置失败', { userId, error });
      throw error;
    }
  }

  /**
   * 更新用户设置
   */
  async updateUserSettings(userId: string, settingsData: Partial<UserSettings>): Promise<UserSettings> {
    try {
      let settings = await userSettingsRepository.findByUserId(userId);

      if (settings) {
        // 更新现有设置
        settings = await userSettingsRepository.updateByUserId(userId, settingsData);
      } else {
        // 创建新设置
        settings = await userSettingsRepository.create({
          userId,
          ...settingsData,
          updatedAt: Date.now()
        });
      }

      // 记录用户活动
      await this.recordUserActivity(userId, 'update', 'user_settings_update', {
        updates: Object.keys(settingsData)
      });

      logger.info('用户设置更新成功', { userId });

      return settings;
    } catch (error) {
      logger.error('更新用户设置失败', { userId, settingsData, error });
      throw error;
    }
  }

  /**
   * 获取用户设备列表
   */
  async getUserDevices(userId: string): Promise<any[]> {
    try {
      // 这里可以实现用户设备查询逻辑
      return [];
    } catch (error) {
      logger.error('获取用户设备列表失败', { userId, error });
      throw error;
    }
  }

  /**
   * 获取用户登录历史
   */
  async getLoginHistory(userId: string, params: PaginationParams): Promise<PaginationResult<any>> {
    try {
      // 这里可以实现登录历史查询逻辑
      return {
        list: [],
        total: 0,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      };
    } catch (error) {
      logger.error('获取用户登录历史失败', { userId, params, error });
      throw error;
    }
  }

  /**
   * 获取用户活动记录
   */
  async getUserActivities(userId: string, params: PaginationParams & { type?: string }): Promise<PaginationResult<any>> {
    try {
      // 这里可以实现用户活动查询逻辑
      return {
        list: [],
        total: 0,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      };
    } catch (error) {
      logger.error('获取用户活动记录失败', { userId, params, error });
      throw error;
    }
  }

  // 私有方法

  /**
   * 生成 JWT Token
   */
  private generateToken(user: User): string {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: this.getUserPermissions(user)
    };

    return jwt.sign(payload, config.jwt.secret as any, {
      expiresIn: config.jwt.expiresIn as any,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });
  }

  /**
   * 生成刷新 Token
   */
  private generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, config.jwt.refreshSecret as any, {
      expiresIn: config.jwt.refreshExpiresIn as any,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });
  }

  /**
   * 获取用户权限
   */
  private getUserPermissions(user: User): string[] {
    const permissions = ['user:read', 'user:write'];
    
    if (user.isVerified) {
      permissions.push('user:verified');
    }
    
    if (user.isCertified) {
      permissions.push('user:certified');
    }
    
    if (user.status === 'active') {
      permissions.push('user:active');
    }

    return permissions;
  }

  /**
   * 获取默认用户设置
   */
  private getDefaultSettings(): UserSettings {
    return {
      id: '',
      userId: '',
      theme: 'light',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      currency: 'CNY',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      notification: {
        email: true,
        sms: true,
        push: true,
        orderNotification: true,
        dealNotification: true,
        positionNotification: true,
        fundNotification: true,
        newsNotification: true,
        marketNotification: true,
        marketingNotification: false,
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        }
      },
      privacy: {
        profileVisibility: 'private',
        tradingVisibility: 'private',
        allowSearch: false,
        allowMessage: true,
        allowRecommendation: false,
        dataCollection: true,
        personalizedAds: false,
        privacyMode: true,
        locationEnabled: false,
        analyticsEnabled: true
      },
      security: {
        twoFactorAuth: false,
        loginAlert: true,
        tradePassword: false,
        deviceBinding: true,
        autoLock: true,
        lockTimeout: 300,
        biometricAuth: false,
        lastPasswordChange: Date.now(),
        lastSecurityCheck: Date.now()
      },
      trading: {
        defaultAccount: '',
        defaultPriceType: 'limit',
        defaultVolume: 100,
        quickTrade: false,
        confirmTrade: true,
        showAdvancedOptions: false,
        autoSaveOrder: true,
        riskWarning: true,
        commissionDisplay: true,
        fingerprintTrade: false
      },
      display: {
        defaultPage: 'home',
        watchlistDisplay: 'list',
        chartStyle: 'candlestick',
        chartIndicators: ['MA', 'MACD', 'KDJ'],
        priceDisplay: 'change',
        volumeDisplay: true,
        marketDepth: false,
        customColumns: ['code', 'name', 'price', 'change', 'changePercent'],
        hideAsset: false,
        noImageMode: false
      },
      updatedAt: Date.now()
    };
  }

  /**
   * 清理用户数据
   */
  private sanitizeUser(user: User): User {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser as User;
  }

  /**
   * 将 Token 加入黑名单
   */
  private async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      
      if (ttl > 0) {
        await redisClient.set(`blacklist:${token}`, '1', ttl);
      }
    } catch (error) {
      logger.warn('加入 Token 黑名单失败', { token, error });
    }
  }

  /**
   * 清除用户所有 Token
   */
  private async clearUserTokens(userId: string): Promise<void> {
    try {
      // 清除用户会话缓存
      const sessionKeys = await redisClient.keys(`session:${userId}:*`);
      if (sessionKeys.length > 0) {
        await redisClient.delMultiple(...sessionKeys);
      }
    } catch (error) {
      logger.warn('清除用户 Token 失败', { userId, error });
    }
  }

  /**
   * 验证验证码
   */
  private async validateCaptcha(target: string, captcha: string): Promise<boolean> {
    try {
      const cacheKey = `captcha:${target}`;
      const storedCaptcha = await redisClient.get(cacheKey);
      
      if (!storedCaptcha || storedCaptcha !== captcha) {
        return false;
      }

      // 删除已使用的验证码
      await redisClient.del(cacheKey);
      return true;
    } catch (error) {
      logger.warn('验证验证码失败', { target, captcha, error });
      return false;
    }
  }

  /**
   * 记录登录尝试
   */
  private async recordLoginAttempt(userId: string, success: boolean, ip?: string, userAgent?: string): Promise<void> {
    try {
      // 这里可以实现登录失败次数限制等逻辑
      logger.info('登录尝试记录', { userId, success, ip });
    } catch (error) {
      logger.warn('记录登录尝试失败', { userId, success, ip, error });
    }
  }

  /**
   * 记录登录成功
   */
  private async recordLoginSuccess(
    userId: string, 
    ip?: string, 
    userAgent?: string, 
    deviceInfo?: any
  ): Promise<void> {
    try {
      // 记录登录历史
      const loginData = {
        userId,
        loginTime: Date.now(),
        loginIp: ip,
        loginLocation: '', // 可以通过 IP 获取地理位置
        deviceType: deviceInfo?.deviceType || 'unknown',
        deviceName: deviceInfo?.deviceName || 'unknown',
        platform: deviceInfo?.platform || 'unknown',
        status: 'success'
      };

      // 这里可以将登录历史保存到数据库
      logger.info('登录成功记录', loginData);
    } catch (error) {
      logger.warn('记录登录成功失败', { userId, error });
    }
  }

  /**
   * 记录用户设备
   */
  private async recordUserDevice(userId: string, deviceInfo: any, ip?: string): Promise<void> {
    try {
      const deviceData = {
        userId,
        deviceType: deviceInfo.deviceType || 'unknown',
        deviceName: deviceInfo.deviceName || 'unknown',
        deviceId: deviceInfo.deviceId || uuidv4(),
        platform: deviceInfo.platform || 'unknown',
        osVersion: deviceInfo.osVersion || 'unknown',
        appVersion: deviceInfo.appVersion || 'unknown',
        ip: ip || 'unknown',
        location: '', // 可以通过 IP 获取地理位置
        isActive: true,
        isBound: true,
        lastLoginTime: Date.now(),
        bindTime: Date.now()
      };

      // 这里可以将设备信息保存到数据库
      logger.info('用户设备记录', deviceData);
    } catch (error) {
      logger.warn('记录用户设备失败', { userId, error });
    }
  }

  /**
   * 记录用户活动
   */
  private async recordUserActivity(
    userId: string, 
    type: string, 
    action: string, 
    details?: any
  ): Promise<void> {
    try {
      const activityData = {
        userId,
        type,
        action,
        target: '',
        details: details || {},
        ip: details?.ip || '',
        location: '',
        device: details?.deviceInfo?.deviceName || 'unknown',
        timestamp: Date.now()
      };

      // 这里可以将活动记录保存到数据库
      logger.info('用户活动记录', activityData);
    } catch (error) {
      logger.warn('记录用户活动失败', { userId, type, action, error });
    }
  }
}

// 导出服务实例
export const userService = new UserService();