const { createConnection } = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.development' });

class Database {
  constructor() {
    this.connection = null;
    this.isConnecting = false;
  }

  /**
   * 获取数据库连接配置
   */
  getConnectionConfig() {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'trade_app',
      charset: 'utf8mb4',
      timezone: '+08:00',
      connectTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
      // 连接池配置
      pool: {
        min: 2,
        max: parseInt(process.env.DB_CONNECTION_LIMIT) || 20,
        acquire: 30000,
        idle: 10000,
      },
    };
  }

  /**
   * 创建数据库连接
   */
  async connect() {
    if (this.connection) {
      try {
        await this.connection.ping();
        return this.connection;
      } catch {
        // Connection is dead, will create new one
      }
    }

    if (this.isConnecting) {
      // 等待连接完成
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.connect();
    }

    this.isConnecting = true;

    try {
      const connectionConfig = this.getConnectionConfig();
      this.connection = await createConnection(connectionConfig);

      // 测试连接
      await this.connection.ping();

      console.log('数据库连接成功', {
        host: connectionConfig.host,
        port: connectionConfig.port,
        database: connectionConfig.database,
      });

      return this.connection;
    } catch (error) {
      console.error('数据库连接失败', error);
      this.connection = null;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * 关闭数据库连接
   */
  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.end();
        this.connection = null;
        console.log('数据库连接已关闭');
      } catch (error) {
        console.error('关闭数据库连接失败', error);
      }
    }
  }

  /**
   * 执行查询
   */
  async query(sql, params) {
    const connection = await this.connect();
    try {
      const [rows] = await connection.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('数据库查询失败', { sql, params, error });
      throw error;
    }
  }

  /**
   * 开始事务
   */
  async beginTransaction() {
    const connection = await this.connect();
    await connection.beginTransaction();
  }

  /**
   * 提交事务
   */
  async commit() {
    if (this.connection) {
      await this.connection.commit();
    }
  }

  /**
   * 回滚事务
   */
  async rollback() {
    if (this.connection) {
      await this.connection.rollback();
    }
  }
}

// 创建数据库实例
const database = new Database();

module.exports = { database };