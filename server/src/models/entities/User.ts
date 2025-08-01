import { User, UserProfile, UserSettings, AppError } from '../../types/index';
import { database } from '../../utils/database';
import { redisClient } from '../../utils/redis';
import logger from '../../utils/logger';

/**
 * 用户数据访问层
 */
export class UserModel {
  private tableName = 'users';

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      const sql = `
        SELECT 
          id, username, nickname, email, phone, avatar, gender, birthday,
          id_card as idCard, address, occupation, education, income,
          risk_level as riskLevel, investment_experience as investmentExperience, investment_goal as investmentGoal, investment_period as investmentPeriod,
          status, is_verified as isVerified, is_certified as isCertified, last_login_time as lastLoginTime, login_count as loginCount,
          register_time as registerTime, update_time as updateTime
        FROM ${this.tableName}
        WHERE username = ? AND status != 'deleted'
      `;
      const rows = await database.query(sql, [username]);
      return rows.length > 0 ? rows[0] as User : null;
    } catch (error) {
      logger.error('根据用户名查找用户失败', { username, error });
      throw new AppError(500, '查找用户失败');
    }
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const sql = `
        SELECT 
          id, username, nickname, email, phone, avatar, gender, birthday,
          id_card, address, occupation, education, income,
          risk_level, investment_experience, investment_goal, investment_period,
          status, is_verified, is_certified, last_login_time, login_count,
          register_time, update_time
        FROM ${this.tableName}
        WHERE email = ? AND status != 'deleted'
      `;
      const rows = await database.query(sql, [email]);
      return rows.length > 0 ? rows[0] as User : null;
    } catch (error) {
      logger.error('根据邮箱查找用户失败', { email, error });
      throw new AppError(500, '查找用户失败');
    }
  }

  /**
   * 根据手机号查找用户
   */
  async findByPhone(phone: string): Promise<User | null> {
    try {
      const sql = `
        SELECT 
          id, username, nickname, email, phone, avatar, gender, birthday,
          id_card, address, occupation, education, income,
          risk_level, investment_experience, investment_goal, investment_period,
          status, is_verified, is_certified, last_login_time, login_count,
          register_time, update_time
        FROM ${this.tableName}
        WHERE phone = ? AND status != 'deleted'
      `;
      const rows = await database.query(sql, [phone]);
      return rows.length > 0 ? rows[0] as User : null;
    } catch (error) {
      logger.error('根据手机号查找用户失败', { phone, error });
      throw new AppError(500, '查找用户失败');
    }
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: string): Promise<User | null> {
    try {
      // 先检查缓存
      const cacheKey = `user:${id}`;
      const cachedUser = await redisClient.get(cacheKey);
      if (cachedUser) {
        return cachedUser;
      }

      const sql = `
        SELECT 
          id, username, nickname, email, phone, avatar, gender, birthday,
          id_card, address, occupation, education, income,
          risk_level, investment_experience, investment_goal, investment_period,
          status, is_verified, is_certified, last_login_time, login_count,
          register_time, update_time
        FROM ${this.tableName}
        WHERE id = ? AND status != 'deleted'
      `;
      const rows = await database.query(sql, [id]);
      const user = rows.length > 0 ? rows[0] : null;

      // 缓存用户信息
      if (user) {
        await redisClient.set(cacheKey, user, 3600); // 缓存1小时
      }

      return user as User;
    } catch (error) {
      logger.error('根据ID查找用户失败', { id, error });
      throw new AppError(500, '查找用户失败');
    }
  }

  /**
   * 创建用户
   */
  async create(userData: Partial<User>): Promise<User> {
    try {
      const user = {
        id: require('uuid').v4(),
        username: userData.username,
        nickname: userData.nickname || userData.username,
        email: userData.email,
        phone: userData.phone,
        gender: userData.gender || 'other',
        idCard: userData.idCard || '',
        address: userData.address || '',
        occupation: userData.occupation || '',
        education: userData.education || '',
        income: userData.income || '',
        riskLevel: userData.riskLevel || 'moderate',
        investmentExperience: userData.investmentExperience || 'beginner',
        investmentGoal: userData.investmentGoal || '',
        investmentPeriod: userData.investmentPeriod || 'medium',
        status: 'pending' as const,
        isVerified: false,
        isCertified: false,
        lastLoginTime: 0,
        loginCount: 0,
        registerTime: Date.now(),
        updateTime: Date.now(),
        ...userData,
      };

      const sql = `
        INSERT INTO ${this.tableName} (
          id, username, nickname, email, phone, avatar, gender, birthday,
          id_card, address, occupation, education, income,
          risk_level, investment_experience, investment_goal, investment_period,
          status, is_verified, is_certified, last_login_time, login_count,
          register_time, update_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        user.id, user.username, user.nickname, user.email, user.phone, user.avatar, user.gender, user.birthday,
        user.idCard, user.address, user.occupation, user.education, user.income,
        user.riskLevel, user.investmentExperience, user.investmentGoal, user.investmentPeriod,
        user.status, user.isVerified, user.isCertified, user.lastLoginTime, user.loginCount,
        user.registerTime, user.updateTime,
      ];

      await database.query(sql, params);

      logger.info('用户创建成功', { userId: user.id, username: user.username });
      return user;
    } catch (error) {
      logger.error('创建用户失败', { userData, error });
      throw new AppError(500, '创建用户失败');
    }
  }

  /**
   * 更新用户
   */
  async update(id: string, updateData: Partial<User>): Promise<User> {
    try {
      const allowedFields = [
        'nickname', 'avatar', 'gender', 'birthday', 'address',
        'occupation', 'education', 'income', 'risk_level',
        'investment_experience', 'investment_goal', 'investment_period',
        'status', 'is_verified', 'is_certified', 'update_time'
      ];

      const updates = [];
      const params = [];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(updateData[field]);
        }
      }

      if (updates.length === 0) {
        throw new AppError(400, '没有提供有效的更新字段');
      }

      updates.push('update_time = ?');
      params.push(Date.now());
      params.push(id);

      const sql = `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`;
      await database.query(sql, params);

      // 清除缓存
      await redisClient.del(`user:${id}`);

      // 返回更新后的用户信息
      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw new AppError(404, '用户不存在');
      }

      logger.info('用户更新成功', { userId: id, updates });
      return updatedUser;
    } catch (error) {
      logger.error('更新用户失败', { id, updateData, error });
      throw error;
    }
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET last_login_time = ?, login_count = login_count + 1, update_time = ?
        WHERE id = ?
      `;
      await database.query(sql, [Date.now(), Date.now(), id]);

      // 清除缓存
      await redisClient.del(`user:${id}`);
    } catch (error) {
      logger.error('更新最后登录时间失败', { id, error });
      throw new AppError(500, '更新登录信息失败');
    }
  }

  /**
   * 删除用户（软删除）
   */
  async delete(id: string): Promise<void> {
    try {
      const sql = `UPDATE ${this.tableName} SET status = 'deleted', update_time = ? WHERE id = ?`;
      await database.query(sql, [Date.now(), id]);

      // 清除缓存
      await redisClient.del(`user:${id}`);

      logger.info('用户删除成功', { userId: id });
    } catch (error) {
      logger.error('删除用户失败', { id, error });
      throw new AppError(500, '删除用户失败');
    }
  }

  /**
   * 分页查询用户
   */
  async findAll(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    keyword?: string;
  } = {}): Promise<{ users: User[]; total: number }> {
    try {
      const { page = 1, pageSize = 20, status, keyword } = params;
      const offset = (page - 1) * pageSize;

      let whereClause = 'status != "deleted"';
      const queryParams = [];

      if (status) {
        whereClause += ' AND status = ?';
        queryParams.push(status);
      }

      if (keyword) {
        whereClause += ' AND (username LIKE ? OR nickname LIKE ? OR email LIKE ? OR phone LIKE ?)';
        const keywordPattern = `%${keyword}%`;
        queryParams.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern);
      }

      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE ${whereClause}`;
      const countResult = await database.query(countSql, queryParams);
      const total = countResult[0].total;

      // 查询数据
      const dataSql = `
        SELECT 
          id, username, nickname, email, phone, avatar, gender, birthday,
          id_card, address, occupation, education, income,
          risk_level, investment_experience, investment_goal, investment_period,
          status, is_verified, is_certified, last_login_time, login_count,
          register_time, update_time
        FROM ${this.tableName}
        WHERE ${whereClause}
        ORDER BY register_time DESC
        LIMIT ? OFFSET ?
      `;
      const users = await database.query(dataSql, [...queryParams, pageSize, offset]) as User[];

      return { users, total };
    } catch (error) {
      logger.error('分页查询用户失败', { params, error });
      throw new AppError(500, '查询用户失败');
    }
  }

  /**
   * 检查用户名是否已存在
   */
  async isUsernameExists(username: string, excludeId?: string): Promise<boolean> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE username = ? AND status != 'deleted'`;
      const params = [username];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const result = await database.query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error('检查用户名是否存在失败', { username, excludeId, error });
      throw new AppError(500, '检查用户名失败');
    }
  }

  /**
   * 检查邮箱是否已存在
   */
  async isEmailExists(email: string, excludeId?: string): Promise<boolean> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE email = ? AND status != 'deleted'`;
      const params = [email];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const result = await database.query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error('检查邮箱是否存在失败', { email, excludeId, error });
      throw new AppError(500, '检查邮箱失败');
    }
  }

  /**
   * 检查手机号是否已存在
   */
  async isPhoneExists(phone: string, excludeId?: string): Promise<boolean> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE phone = ? AND status != 'deleted'`;
      const params = [phone];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const result = await database.query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error('检查手机号是否存在失败', { phone, excludeId, error });
      throw new AppError(500, '检查手机号失败');
    }
  }
}

/**
 * 用户资料数据访问层
 */
export class UserProfileModel {
  private tableName = 'user_profiles';

  /**
   * 根据用户ID查找用户资料
   */
  async findByUserId(userId: string): Promise<UserProfile | null> {
    try {
      const cacheKey = `user_profile:${userId}`;
      const cachedProfile = await redisClient.get(cacheKey);
      if (cachedProfile) {
        return cachedProfile;
      }

      const sql = `
        SELECT 
          id, user_id, real_name, id_card, id_card_front, id_card_back,
          bank_card, bank_name, bank_account, phone, email, address,
          emergency_contact, emergency_phone, occupation, income,
          investment_experience, verification_status, verification_time,
          reject_reason, has_trade_password
        FROM ${this.tableName}
        WHERE user_id = ?
      `;
      const rows = await database.query(sql, [userId]);
      const profile = rows.length > 0 ? rows[0] : null;

      if (profile) {
        await redisClient.set(cacheKey, profile, 3600); // 缓存1小时
      }

      return profile as UserProfile;
    } catch (error) {
      logger.error('根据用户ID查找用户资料失败', { userId, error });
      throw new AppError(500, '查找用户资料失败');
    }
  }

  /**
   * 创建用户资料
   */
  async create(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const profile = {
        id: require('uuid').v4(),
        verification_status: 'pending' as const,
        ...profileData,
      };

      const sql = `
        INSERT INTO ${this.tableName} (
          id, user_id, real_name, id_card, id_card_front, id_card_back,
          bank_card, bank_name, bank_account, phone, email, address,
          emergency_contact, emergency_phone, occupation, income,
          investment_experience, verification_status, verification_time,
          reject_reason, has_trade_password
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        profile.id, profile.userId, profile.realName, profile.idCard, profile.idCardFront, profile.idCardBack,
        profile.bankCard, profile.bankName, profile.bankAccount, profile.phone, profile.email, profile.address,
        profile.emergencyContact, profile.emergencyPhone, profile.occupation, profile.income,
        profile.investmentExperience, profile.verification_status, profile.verificationTime,
        profile.rejectReason, profile.hasTradePassword,
      ];

      await database.query(sql, params);

      logger.info('用户资料创建成功', { profileId: profile.id, userId: profile.userId });
      return profile as UserProfile;
    } catch (error) {
      logger.error('创建用户资料失败', { profileData, error });
      throw new AppError(500, '创建用户资料失败');
    }
  }

  /**
   * 更新用户资料
   */
  async update(userId: string, updateData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const allowedFields = [
        'real_name', 'id_card', 'id_card_front', 'id_card_back',
        'bank_card', 'bank_name', 'bank_account', 'phone', 'email', 'address',
        'emergency_contact', 'emergency_phone', 'occupation', 'income',
        'investment_experience', 'verification_status', 'verification_time',
        'reject_reason', 'has_trade_password'
      ];

      const updates = [];
      const params = [];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(updateData[field]);
        }
      }

      if (updates.length === 0) {
        throw new AppError(400, '没有提供有效的更新字段');
      }

      params.push(userId);

      const sql = `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE user_id = ?`;
      await database.query(sql, params);

      // 清除缓存
      await redisClient.del(`user_profile:${userId}`);

      // 返回更新后的用户资料
      const updatedProfile = await this.findByUserId(userId);
      if (!updatedProfile) {
        throw new AppError(404, '用户资料不存在');
      }

      logger.info('用户资料更新成功', { userId, updates });
      return updatedProfile;
    } catch (error) {
      logger.error('更新用户资料失败', { userId, updateData, error });
      throw error;
    }
  }
}

/**
 * 用户设置数据访问层
 */
export class UserSettingsModel {
  private tableName = 'user_settings';

  /**
   * 根据用户ID查找用户设置
   */
  async findByUserId(userId: string): Promise<UserSettings | null> {
    try {
      const cacheKey = `user_settings:${userId}`;
      const cachedSettings = await redisClient.get(cacheKey);
      if (cachedSettings) {
        return cachedSettings;
      }

      const sql = `
        SELECT 
          id, user_id, theme, language, timezone, currency, date_format, time_format,
          notification_settings, privacy_settings, security_settings,
          trading_settings, display_settings, updated_at
        FROM ${this.tableName}
        WHERE user_id = ?
      `;
      const rows = await database.query(sql, [userId]);
      const settings = rows.length > 0 ? rows[0] : null;

      if (settings) {
        // 解析 JSON 字段
        settings.notification_settings = JSON.parse(settings.notification_settings || '{}');
        settings.privacy_settings = JSON.parse(settings.privacy_settings || '{}');
        settings.security_settings = JSON.parse(settings.security_settings || '{}');
        settings.trading_settings = JSON.parse(settings.trading_settings || '{}');
        settings.display_settings = JSON.parse(settings.display_settings || '{}');

        await redisClient.set(cacheKey, settings, 3600); // 缓存1小时
      }

      return settings as UserSettings;
    } catch (error) {
      logger.error('根据用户ID查找用户设置失败', { userId, error });
      throw new AppError(500, '查找用户设置失败');
    }
  }

  /**
   * 创建用户设置
   */
  async create(settingsData: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const settings = {
        id: require('uuid').v4(),
        theme: settingsData.theme || 'light',
        language: settingsData.language || 'zh-CN',
        timezone: settingsData.timezone || 'Asia/Shanghai',
        currency: settingsData.currency || 'CNY',
        dateFormat: settingsData.dateFormat || 'YYYY-MM-DD',
        timeFormat: settingsData.timeFormat || '24h',
        notification: JSON.stringify(settingsData.notification || {}),
        privacy: JSON.stringify(settingsData.privacy || {}),
        security: JSON.stringify(settingsData.security || {}),
        trading: JSON.stringify(settingsData.trading || {}),
        display: JSON.stringify(settingsData.display || {}),
        updated_at: Date.now(),
        ...settingsData,
      };

      const sql = `
        INSERT INTO ${this.tableName} (
          id, user_id, theme, language, timezone, currency, date_format, time_format,
          notification_settings, privacy_settings, security_settings,
          trading_settings, display_settings, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        settings.id, settings.userId, settings.theme, settings.language, settings.timezone, settings.currency,
        settings.dateFormat, settings.timeFormat, settings.notification, settings.privacy,
        settings.security, settings.trading, settings.display, settings.updated_at,
      ];

      await database.query(sql, params);

      logger.info('用户设置创建成功', { settingsId: settings.id, userId: settings.userId });
      return settings as UserSettings;
    } catch (error) {
      logger.error('创建用户设置失败', { settingsData, error });
      throw new AppError(500, '创建用户设置失败');
    }
  }

  /**
   * 更新用户设置
   */
  async update(userId: string, updateData: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const allowedFields = [
        'theme', 'language', 'timezone', 'currency', 'date_format', 'time_format',
        'notification_settings', 'privacy_settings', 'security_settings',
        'trading_settings', 'display_settings', 'updated_at'
      ];

      const updates = [];
      const params = [];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          // JSON 字段需要序列化
          if (field.includes('_settings')) {
            updates.push(`${field} = ?`);
            params.push(JSON.stringify(updateData[field]));
          } else {
            updates.push(`${field} = ?`);
            params.push(updateData[field]);
          }
        }
      }

      if (updates.length === 0) {
        throw new AppError(400, '没有提供有效的更新字段');
      }

      updates.push('updated_at = ?');
      params.push(Date.now());
      params.push(userId);

      const sql = `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE user_id = ?`;
      await database.query(sql, params);

      // 清除缓存
      await redisClient.del(`user_settings:${userId}`);

      // 返回更新后的用户设置
      const updatedSettings = await this.findByUserId(userId);
      if (!updatedSettings) {
        throw new AppError(404, '用户设置不存在');
      }

      logger.info('用户设置更新成功', { userId, updates });
      return updatedSettings;
    } catch (error) {
      logger.error('更新用户设置失败', { userId, updateData, error });
      throw error;
    }
  }
}

// 导出模型实例
export const userModel = new UserModel();
export const userProfileModel = new UserProfileModel();
export const userSettingsModel = new UserSettingsModel();