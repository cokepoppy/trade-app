import { BaseRepository, CachedRepository } from './repositories/BaseRepository';
import { User, UserProfile, UserSettings } from '../types';
import logger from '../utils/logger';

/**
 * 用户仓库
 */
export class UserRepository extends BaseRepository {
  constructor() {
    super('users', 'user');
  }

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
          register_time as registerTime, update_time as updateTime, password_hash as passwordHash
        FROM ${this.tableName}
        WHERE username = ? AND status != 'deleted'
      `;
      const rows = await this.query(sql, [username]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('根据用户名查找用户失败', { username, error });
      throw error;
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
          id_card as idCard, address, occupation, education, income,
          risk_level as riskLevel, investment_experience as investmentExperience, investment_goal as investmentGoal, investment_period as investmentPeriod,
          status, is_verified as isVerified, is_certified as isCertified, last_login_time as lastLoginTime, login_count as loginCount,
          register_time as registerTime, update_time as updateTime, password_hash as passwordHash
        FROM ${this.tableName}
        WHERE email = ? AND status != 'deleted'
      `;
      const rows = await this.query(sql, [email]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('根据邮箱查找用户失败', { email, error });
      throw error;
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
          id_card as idCard, address, occupation, education, income,
          risk_level as riskLevel, investment_experience as investmentExperience, investment_goal as investmentGoal, investment_period as investmentPeriod,
          status, is_verified as isVerified, is_certified as isCertified, last_login_time as lastLoginTime, login_count as loginCount,
          register_time as registerTime, update_time as updateTime, password_hash as passwordHash
        FROM ${this.tableName}
        WHERE phone = ? AND status != 'deleted'
      `;
      const rows = await this.query(sql, [phone]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('根据手机号查找用户失败', { phone, error });
      throw error;
    }
  }

  /**
   * 创建用户
   */
  async create(userData: Partial<User>): Promise<User> {
    const user = {
      username: userData.username,
      nickname: userData.nickname || userData.username,
      email: userData.email,
      phone: userData.phone,
      gender: userData.gender || 'other',
      riskLevel: userData.riskLevel || 'moderate',
      investmentExperience: userData.investmentExperience || 'beginner',
      investmentPeriod: userData.investmentPeriod || 'medium',
      status: 'pending',
      is_verified: false,
      is_certified: false,
      login_count: 0,
      register_time: Date.now(),
      update_time: Date.now(),
      ...userData,
    };

    return await super.create(user);
  }

  /**
   * 更新用户
   */
  async update(id: string, updateData: Partial<User>): Promise<User> {
    const allowedFields = [
      'nickname', 'avatar', 'gender', 'birthday', 'address',
      'occupation', 'education', 'income', 'riskLevel',
      'investmentExperience', 'investmentGoal', 'investmentPeriod',
      'status', 'isVerified', 'isCertified'
    ];

    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    return await super.update(id, filteredData);
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
      await this.query(sql, [Date.now(), Date.now(), id]);
      await this.clearCache(id);
    } catch (error) {
      logger.error('更新最后登录时间失败', { id, error });
      throw error;
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

      const result = await this.query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error('检查用户名是否存在失败', { username, excludeId, error });
      throw error;
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

      const result = await this.query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error('检查邮箱是否存在失败', { email, excludeId, error });
      throw error;
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

      const result = await this.query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error('检查手机号是否存在失败', { phone, excludeId, error });
      throw error;
    }
  }
}

/**
 * 用户资料仓库
 */
export class UserProfileRepository extends CachedRepository {
  constructor() {
    super('user_profiles', 'user_profile');
  }

  /**
   * 根据用户ID查找用户资料
   */
  async findByUserId(userId: string): Promise<UserProfile | null> {
    try {
      const cacheKey = `user:${userId}:profile`;
      const cached = await this.getCachedData(cacheKey, async () => {
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
        const rows = await this.query(sql, [userId]);
        return rows.length > 0 ? rows[0] : null;
      });

      return cached;
    } catch (error) {
      logger.error('根据用户ID查找用户资料失败', { userId, error });
      throw error;
    }
  }

  /**
   * 创建用户资料
   */
  async create(profileData: Partial<UserProfile>): Promise<UserProfile> {
    const profile = {
      verification_status: 'pending' as const,
      ...profileData,
    };

    return await super.create(profile);
  }

  /**
   * 更新用户资料
   */
  async updateByUserId(userId: string, updateData: Partial<UserProfile>): Promise<UserProfile> {
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
        throw new Error('没有提供有效的更新字段');
      }

      params.push(userId);

      const sql = `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE user_id = ?`;
      await this.query(sql, params);

      // 清除缓存
      await this.clearCache(`user:${userId}:profile`);

      // 返回更新后的用户资料
      return await this.findByUserId(userId);
    } catch (error) {
      logger.error('更新用户资料失败', { userId, updateData, error });
      throw error;
    }
  }
}

/**
 * 用户设置仓库
 */
export class UserSettingsRepository extends CachedRepository {
  tableName: string;
  cachePrefix: string;
  
  constructor() {
    super('user_settings', 'user_settings');
    this.tableName = 'user_settings';
    this.cachePrefix = 'user_settings';
  }

  /**
   * 根据用户ID查找用户设置
   */
  async findByUserId(userId: string): Promise<UserSettings | null> {
    try {
      const cacheKey = `user:${userId}:settings`;
      const cached = await this.getCachedData(cacheKey, async () => {
        const sql = `
          SELECT 
            id, user_id as userId, theme, language, timezone, currency, date_format as dateFormat, time_format as timeFormat,
            notification_settings as notification, privacy_settings as privacy, security_settings as security,
            trading_settings as trading, display_settings as display, updated_at as updatedAt
          FROM ${this.tableName}
          WHERE user_id = ?
        `;
        const rows = await this.query(sql, [userId]);
        const settings = rows.length > 0 ? rows[0] : null;

        if (settings) {
          // 解析 JSON 字段
          const parsedSettings = settings as any;
          parsedSettings.notification = JSON.parse(parsedSettings.notification || '{}');
          parsedSettings.privacy = JSON.parse(parsedSettings.privacy || '{}');
          parsedSettings.security = JSON.parse(parsedSettings.security || '{}');
          parsedSettings.trading = JSON.parse(parsedSettings.trading || '{}');
          parsedSettings.display = JSON.parse(parsedSettings.display || '{}');
        }

        return settings;
      });

      return cached;
    } catch (error) {
      logger.error('根据用户ID查找用户设置失败', { userId, error });
      throw error;
    }
  }

  /**
   * 创建用户设置
   */
  async create(settingsData: Partial<UserSettings>): Promise<UserSettings> {
    const settings = {
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
      updatedAt: Date.now(),
      ...settingsData,
    };

    return await super.create(settings);
  }

  /**
   * 更新用户设置
   */
  async updateByUserId(userId: string, updateData: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const allowedFields = [
        'theme', 'language', 'timezone', 'currency', 'dateFormat', 'timeFormat',
        'notification', 'privacy', 'security', 'trading', 'display', 'updatedAt'
      ];

      const updates = [];
      const params = [];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
                          // JSON 字段需要序列化
        if (['notification', 'privacy', 'security', 'trading', 'display'].includes(field)) {
          updates.push(`${field}_settings = ?`);
          params.push(JSON.stringify(updateData[field]));
        } else if (field === 'dateFormat') {
          updates.push(`date_format = ?`);
          params.push(updateData[field]);
        } else if (field === 'timeFormat') {
          updates.push(`time_format = ?`);
          params.push(updateData[field]);
        } else if (field === 'updatedAt') {
          updates.push(`updated_at = ?`);
          params.push(updateData[field]);
        } else {
          updates.push(`${field} = ?`);
          params.push(updateData[field]);
        }
        }
      }

      if (updates.length === 0) {
        throw new Error('没有提供有效的更新字段');
      }

      updates.push('updated_at = ?');
      params.push(Date.now());
      params.push(userId);

      const sql = `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE user_id = ?`;
      await this.query(sql, params);

      // 清除缓存
      await this.clearCache(`user:${userId}:settings`);

      // 返回更新后的用户设置
      const result = await this.findByUserId(userId);
      if (!result) {
        throw new Error('用户设置不存在');
      }
      return result;
    } catch (error) {
      logger.error('更新用户设置失败', { userId, updateData, error });
      throw error;
    }
  }
}

// 导出仓库实例
export const userRepository = new UserRepository();
export const userProfileRepository = new UserProfileRepository();
export const userSettingsRepository = new UserSettingsRepository();