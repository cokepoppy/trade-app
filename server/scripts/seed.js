const { database } = require('../src/utils/database');
const { userModel, userProfileModel, userSettingsModel } = require('../src/models/entities/User');
const logger = require('../src/utils/logger');

/**
 * 数据库初始化脚本
 */
class Seeder {
  constructor() {
    this.users = [];
    this.profiles = [];
    this.settings = [];
  }

  /**
   * 运行种子数据
   */
  async run() {
    try {
      logger.info('开始运行数据库种子数据');

      // 确保数据库连接
      await database.connect();

      // 清理现有数据（开发环境）
      if (process.env.NODE_ENV === 'development') {
        await this.clearData();
      }

      // 生成测试用户
      await this.generateTestUsers();

      // 生成用户资料
      await this.generateUserProfiles();

      // 生成用户设置
      await this.generateUserSettings();

      logger.info('数据库种子数据生成完成');
      logger.info(`生成用户: ${this.users.length} 个`);
      logger.info(`生成用户资料: ${this.profiles.length} 个`);
      logger.info(`生成用户设置: ${this.settings.length} 个`);

    } catch (error) {
      logger.error('数据库种子数据生成失败', error);
      throw error;
    } finally {
      await database.disconnect();
    }
  }

  /**
   * 清理现有数据
   */
  async clearData() {
    logger.info('清理现有数据');

    const tables = [
      'user_feedbacks',
      'user_messages',
      'user_activities',
      'user_login_history',
      'user_devices',
      'user_settings',
      'user_profiles',
      'users',
      'verification_codes'
    ];

    for (const table of tables) {
      try {
        await database.query(`TRUNCATE TABLE ${table}`);
        logger.info(`清空表: ${table}`);
      } catch (error) {
        logger.warn(`清空表失败: ${table}`, error);
      }
    }
  }

  /**
   * 生成测试用户
   */
  async generateTestUsers() {
    const testUsers = [
      {
        username: 'admin',
        nickname: '管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        password: 'admin123',
        risk_level: 'moderate',
        investment_experience: 'advanced',
        status: 'active',
        is_verified: true,
        is_certified: true
      },
      {
        username: 'testuser1',
        nickname: '测试用户1',
        email: 'test1@example.com',
        phone: '13800138001',
        password: 'test123',
        risk_level: 'conservative',
        investment_experience: 'beginner',
        status: 'active',
        is_verified: true,
        is_certified: false
      },
      {
        username: 'testuser2',
        nickname: '测试用户2',
        email: 'test2@example.com',
        phone: '13800138002',
        password: 'test123',
        risk_level: 'aggressive',
        investment_experience: 'intermediate',
        status: 'active',
        is_verified: false,
        is_certified: false
      },
      {
        username: 'demo',
        nickname: '演示用户',
        email: 'demo@example.com',
        phone: '13800138003',
        password: 'demo123',
        risk_level: 'moderate',
        investment_experience: 'beginner',
        status: 'active',
        is_verified: true,
        is_certified: false
      }
    ];

    const bcrypt = require('bcrypt');

    for (const userData of testUsers) {
      try {
        // 加密密码
        const passwordHash = await bcrypt.hash(userData.password, 12);
        
        const user = await userModel.create({
          ...userData,
          password_hash: passwordHash,
          register_time: Date.now(),
          update_time: Date.now()
        });

        this.users.push(user);
        logger.info(`创建用户: ${userData.username}`);
      } catch (error) {
        logger.error(`创建用户失败: ${userData.username}`, error);
      }
    }
  }

  /**
   * 生成用户资料
   */
  async generateUserProfiles() {
    const profileData = [
      {
        user_id: this.users[0].id,
        real_name: '系统管理员',
        id_card: '110101199001011234',
        bank_card: '6225880212345678',
        bank_name: '中国工商银行',
        bank_account: '6225880212345678',
        phone: '13800138000',
        email: 'admin@example.com',
        address: '北京市朝阳区',
        emergency_contact: '紧急联系人',
        emergency_phone: '13900139000',
        occupation: 'IT工程师',
        income: '10000-20000',
        investment_experience: '5年以上股票投资经验，熟悉技术分析和基本面分析',
        verification_status: 'approved',
        verification_time: Date.now(),
        has_trade_password: true
      },
      {
        user_id: this.users[1].id,
        real_name: '张三',
        id_card: '110101199002021234',
        bank_card: '6225880212345679',
        bank_name: '中国建设银行',
        bank_account: '6225880212345679',
        phone: '13800138001',
        email: 'test1@example.com',
        address: '上海市浦东新区',
        emergency_contact: '李四',
        emergency_phone: '13900139001',
        occupation: '软件工程师',
        income: '8000-15000',
        investment_experience: '1-3年投资经验，主要投资指数基金',
        verification_status: 'pending',
        has_trade_password: false
      },
      {
        user_id: this.users[2].id,
        real_name: '王五',
        id_card: '110101199003031234',
        bank_card: '6225880212345680',
        bank_name: '中国农业银行',
        bank_account: '6225880212345680',
        phone: '13800138002',
        email: 'test2@example.com',
        address: '广州市天河区',
        emergency_contact: '赵六',
        emergency_phone: '13900139002',
        occupation: '金融分析师',
        income: '15000-25000',
        investment_experience: '3-5年投资经验，偏好高风险高收益投资',
        verification_status: 'pending',
        has_trade_password: false
      },
      {
        user_id: this.users[3].id,
        real_name: '演示用户',
        id_card: '110101199004041234',
        bank_card: '6225880212345681',
        bank_name: '中国银行',
        bank_account: '6225880212345681',
        phone: '13800138003',
        email: 'demo@example.com',
        address: '深圳市南山区',
        emergency_contact: '演示联系人',
        emergency_phone: '13900139003',
        occupation: '产品经理',
        income: '12000-20000',
        investment_experience: '新手投资者，正在学习投资知识',
        verification_status: 'approved',
        verification_time: Date.now(),
        has_trade_password: false
      }
    ];

    for (const data of profileData) {
      try {
        const profile = await userProfileModel.create(data);
        this.profiles.push(profile);
        logger.info(`创建用户资料: ${data.real_name}`);
      } catch (error) {
        logger.error(`创建用户资料失败: ${data.real_name}`, error);
      }
    }
  }

  /**
   * 生成用户设置
   */
  async generateUserSettings() {
    const defaultSettings = {
      theme: 'light',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      currency: 'CNY',
      date_format: 'YYYY-MM-DD',
      time_format: '24h',
      notification_settings: {
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
      privacy_settings: {
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
      security_settings: {
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
      trading_settings: {
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
      display_settings: {
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
      }
    };

    for (const user of this.users) {
      try {
        const settings = await userSettingsModel.create({
          user_id: user.id,
          ...defaultSettings,
          updated_at: Date.now()
        });
        this.settings.push(settings);
        logger.info(`创建用户设置: ${user.username}`);
      } catch (error) {
        logger.error(`创建用户设置失败: ${user.username}`, error);
      }
    }
  }
}

// 运行种子数据
const seeder = new Seeder();

if (require.main === module) {
  seeder.run()
    .then(() => {
      console.log('种子数据生成完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('种子数据生成失败:', error);
      process.exit(1);
    });
}

module.exports = Seeder;