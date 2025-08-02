import { createClient, RedisClientType } from 'redis';
import config from '../config';
import logger from '../utils/logger';

class RedisClient {
  private client: RedisClientType;
  private isConnected = false;
  private isConnecting = false;

  constructor() {
    // 使用URL格式包含密码
    const password = config.redis.password || '';
    const authPart = password ? `:${password}@` : '';
    const redisUrl = `redis://${authPart}${config.redis.host}:${config.redis.port}`;
    
    logger.info('Redis连接URL:', { service: 'trade-app-server' });
    
    this.client = createClient({
      url: redisUrl,
      database: config.redis.db,
      socket: {
        reconnectStrategy: (retries: number) => {
          logger.warn(`Redis 重连尝试 ${retries}`, { service: 'trade-app-server' });
          return Math.min(retries * 100, 3000);
        },
      },
    });

    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis 连接成功');
      this.isConnected = true;
    });

    this.client.on('ready', () => {


      
      logger.info('Redis 准备就绪');
    });

    this.client.on('error', (error: Error) => {
      logger.error('Redis 连接错误', error);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.warn('Redis 连接已断开');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis 正在重连');
    });
  }

  /**
   * 连接 Redis
   */
  async connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      await this.client.connect();
      this.isConnected = true;
      logger.info('Redis 连接成功', {
        host: config.redis.host,
        port: config.redis.port,
        database: config.redis.db,
      });
    } catch (error) {
      logger.error('Redis 连接失败', error);
      this.isConnected = false;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * 断开 Redis 连接
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis 连接已断开');
      } catch (error) {
        logger.error('断开 Redis 连接失败', error);
      }
    }
  }

  /**
   * 设置键值对
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.ensureConnected();
    
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    const fullKey = config.redis.keyPrefix + key;

    if (ttl) {
      await this.client.setEx(fullKey, ttl, serializedValue);
    } else {
      await this.client.set(fullKey, serializedValue);
    }
  }

  /**
   * 获取键值
   */
  async get(key: string): Promise<any> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    const value = await this.client.get(fullKey);
    
    if (!value) {
      return null;
    }

    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  }

  /**
   * 删除键
   */
  async del(key: string): Promise<number> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    return await this.client.del(fullKey);
  }

  /**
   * 删除多个键
   */
  async delMultiple(...keys: string[]): Promise<number> {
    await this.ensureConnected();
    
    const fullKeys = keys.map(key => config.redis.keyPrefix + key);
    return await this.client.del(fullKeys);
  }

  /**
   * 查找键
   */
  async keys(pattern: string): Promise<string[]> {
    await this.ensureConnected();
    
    const fullPattern = config.redis.keyPrefix + pattern;
    return await this.client.keys(fullPattern);
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    const result = await this.client.exists(fullKey);
    return result === 1;
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, ttl: number): Promise<void> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    await this.client.expire(fullKey, ttl);
  }

  /**
   * 获取过期时间
   */
  async ttl(key: string): Promise<number> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    return await this.client.ttl(fullKey);
  }

  /**
   * 哈希操作
   */
  async hset(key: string, field: string, value: any): Promise<void> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.hSet(fullKey, field, serializedValue);
  }

  async hget(key: string, field: string): Promise<any> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    const value = await this.client.hGet(fullKey, field);
    
    if (!value) {
      return null;
    }

    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  }

  async hdel(key: string, field: string): Promise<number> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    return await this.client.hDel(fullKey, field);
  }

  /**
   * 列表操作
   */
  async lpush(key: string, ...values: any[]): Promise<number> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    const serializedValues = values.map((v) =>
      typeof v === 'string' ? v : JSON.stringify(v)
    );
    return await this.client.lPush(fullKey, serializedValues);
  }

  async rpush(key: string, ...values: any[]): Promise<number> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    const serializedValues = values.map((v) =>
      typeof v === 'string' ? v : JSON.stringify(v)
    );
    return await this.client.rPush(fullKey, serializedValues);
  }

  async lpop(key: string): Promise<any> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    const value = await this.client.lPop(fullKey);
    
    if (!value) {
      return null;
    }

    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  }

  async rpop(key: string): Promise<any> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    const value = await this.client.rPop(fullKey);
    
    if (!value) {
      return null;
    }

    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  }

  /**
   * 集合操作
   */
  async sadd(key: string, ...members: any[]): Promise<number> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    const serializedMembers = members.map((m) =>
      typeof m === 'string' ? m : JSON.stringify(m)
    );
    return await this.client.sAdd(fullKey, serializedMembers);
  }

  async srem(key: string, ...members: any[]): Promise<number> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    const serializedMembers = members.map((m) =>
      typeof m === 'string' ? m : JSON.stringify(m)
    );
    return await this.client.sRem(fullKey, serializedMembers);
  }

  async smembers(key: string): Promise<any[]> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    const members = await this.client.sMembers(fullKey);
    
    return members.map((member) => {
      try {
        return JSON.parse(member);
      } catch {
        return member;
      }
    });
  }

  /**
   * 有序集合操作
   */
  async zadd(key: string, score: number, member: any): Promise<number> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    const serializedMember = typeof member === 'string' ? member : JSON.stringify(member);
    return await this.client.zAdd(fullKey, { score, value: serializedMember });
  }

  async zrange(key: string, start: number, stop: number): Promise<any[]> {
    await this.ensureConnected();
    
    const fullKey = config.redis.keyPrefix + key;
    const members = await this.client.zRange(fullKey, start, stop);
    
    return members.map((member) => {
      try {
        return JSON.parse(member);
      } catch {
        return member;
      }
    });
  }

  /**
   * 发布订阅
   */
  async publish(channel: string, message: any): Promise<number> {
    await this.ensureConnected();
    
    const serializedMessage = typeof message === 'string' ? message : JSON.stringify(message);
    return await this.client.publish(channel, serializedMessage);
  }

  /**
   * 确保连接
   */
  private async ensureConnected(): Promise<void> {
    if (!this.isConnected && !this.isConnecting) {
      await this.connect();
    }
    
    // 等待连接完成
    while (this.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    
    if (!this.isConnected) {
      throw new Error('Redis 连接失败');
    }
  }

  /**
   * 获取客户端实例
   */
  getClient(): RedisClientType {
    return this.client;
  }

  /**
   * 检查连接状态
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }
}

// 创建 Redis 客户端实例
export const redisClient = new RedisClient();

// 导出便捷函数
export const setCache = (key: string, value: any, ttl?: number) => redisClient.set(key, value, ttl);
export const getCache = (key: string) => redisClient.get(key);
export const delCache = (key: string) => redisClient.del(key);
export const existsCache = (key: string) => redisClient.exists(key);
export const expireCache = (key: string, ttl: number) => redisClient.expire(key, ttl);

export default redisClient;