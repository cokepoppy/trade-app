import { createConnection, Connection, ConnectionOptions, RowDataPacket } from 'mysql2/promise';
import config from '../config';
import logger from '../utils/logger';

class Database {
  private connection: Connection | null = null;
  private isConnecting = false;

  /**
   * 获取数据库连接配置
   */
  private getConnectionConfig(): ConnectionOptions {
    return {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      charset: 'utf8mb4',
      timezone: '+08:00',
      connectTimeout: config.db.acquireTimeout,
      // 连接池配置
      pool: {
        min: 2,
        max: config.db.connectionLimit,
        acquire: 30000,
        idle: 10000,
      },
      // SSL配置（生产环境）
      ssl: config.app.env === 'production' ? {
        rejectUnauthorized: true,
      } : undefined,
    };
  }

  /**
   * 创建数据库连接
   */
  async connect(): Promise<Connection> {
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

      logger.info('数据库连接成功', {
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
      });

      // 设置连接事件监听
      this.connection.on('error', (error) => {
        logger.error('数据库连接错误', error);
        this.connection = null;
      });

      this.connection.on('end', () => {
        logger.warn('数据库连接已断开');
        this.connection = null;
      });

      return this.connection;
    } catch (error) {
      logger.error('数据库连接失败', error);
      this.connection = null;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * 关闭数据库连接
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.end();
        this.connection = null;
        logger.info('数据库连接已关闭');
      } catch (error) {
        logger.error('关闭数据库连接失败', error);
      }
    }
  }

  /**
   * 执行查询
   */
  async query(sql: string, params?: any[]): Promise<RowDataPacket[]> {
    const connection = await this.connect();
    try {
      const [rows] = await connection.execute(sql, params);
      return rows as RowDataPacket[];
    } catch (error) {
      logger.error('数据库查询失败', { sql, params, error });
      throw error;
    }
  }

  /**
   * 执行插入操作
   */
  async insert(table: string, data: Record<string, any>): Promise<any> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(',');

    const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    return result;
  }

  /**
   * 执行更新操作
   */
  async update(
    table: string,
    data: Record<string, any>,
    where: Record<string, any>
  ): Promise<any> {
    const setClause = Object.keys(data).map((key) => `${key} = ?`).join(',');
    const whereClause = Object.keys(where).map((key) => `${key} = ?`).join(' AND ');

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const params = [...Object.values(data), ...Object.values(where)];
    const result = await this.query(sql, params);
    return result;
  }

  /**
   * 执行删除操作
   */
  async delete(table: string, where: Record<string, any>): Promise<any> {
    const whereClause = Object.keys(where).map((key) => `${key} = ?`).join(' AND ');
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const params = Object.values(where);
    const result = await this.query(sql, params);
    return result;
  }

  /**
   * 开始事务
   */
  async beginTransaction(): Promise<void> {
    const connection = await this.connect();
    await connection.beginTransaction();
  }

  /**
   * 提交事务
   */
  async commit(): Promise<void> {
    if (this.connection) {
      await this.connection.commit();
    }
  }

  /**
   * 回滚事务
   */
  async rollback(): Promise<void> {
    if (this.connection) {
      await this.connection.rollback();
    }
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.connection !== null;
  }
}

// 创建数据库实例
export const database = new Database();

// 导出数据库连接函数
export const getConnection = () => database.connect();

// 导出查询函数
export const query = (sql: string, params?: any[]) => database.query(sql, params);

// 导出事务函数
export const transaction = async <T>(callback: () => Promise<T>): Promise<T> => {
  try {
    await database.beginTransaction();
    const result = await callback();
    await database.commit();
    return result;
  } catch (error) {
    await database.rollback();
    throw error;
  }
};

export default database;