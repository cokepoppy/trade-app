/**
 * 内存存储工具类
 * 当 Redis 不可用时，作为回退存储方案
 */

export class MemoryStorage {
  private storage: Map<string, { value: any; expires?: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 每5分钟清理一次过期数据
    this.startCleanup();
  }

  /**
   * 设置键值对
   * @param key 键
   * @param value 值
   * @param ttl 过期时间（秒），可选
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const expires = ttl ? Date.now() + ttl * 1000 : undefined;
    this.storage.set(key, { value, expires });
  }

  /**
   * 获取值
   * @param key 键
   * @returns 值或null
   */
  async get(key: string): Promise<any> {
    const item = this.storage.get(key);
    
    if (!item) {
      return null;
    }
    
    // 检查是否过期
    if (item.expires && Date.now() > item.expires) {
      this.storage.delete(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * 删除键
   * @param key 键
   */
  async del(key: string): Promise<void> {
    this.storage.delete(key);
  }

  /**
   * 删除多个键
   * @param keys 键数组
   */
  async delMultiple(...keys: string[]): Promise<void> {
    keys.forEach(key => this.storage.delete(key));
  }

  /**
   * 检查键是否存在
   * @param key 键
   * @returns 是否存在
   */
  async exists(key: string): Promise<boolean> {
    const item = this.storage.get(key);
    
    if (!item) {
      return false;
    }
    
    // 检查是否过期
    if (item.expires && Date.now() > item.expires) {
      this.storage.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 获取所有匹配的键
   * @param pattern 键模式（支持简单的通配符）
   * @returns 匹配的键数组
   */
  async keys(pattern: string): Promise<string[]> {
    const allKeys = Array.from(this.storage.keys());
    
    if (pattern === '*') {
      return allKeys;
    }
    
    // 简单的通配符匹配
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return allKeys.filter(key => regex.test(key));
  }

  /**
   * 设置过期时间
   * @param key 键
   * @param ttl 过期时间（秒）
   */
  async expire(key: string, ttl: number): Promise<void> {
    const item = this.storage.get(key);
    
    if (item) {
      item.expires = Date.now() + ttl * 1000;
      this.storage.set(key, item);
    }
  }

  /**
   * 获取剩余时间（秒）
   * @param key 键
   * @returns 剩余时间或-1（不存在或无过期时间）
   */
  async ttl(key: string): Promise<number> {
    const item = this.storage.get(key);
    
    if (!item) {
      return -1;
    }
    
    if (!item.expires) {
      return -1;
    }
    
    const remaining = Math.ceil((item.expires - Date.now()) / 1000);
    return remaining > 0 ? remaining : -1;
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    this.storage.clear();
  }

  /**
   * 获取存储大小
   * @returns 键值对数量
   */
  async size(): Promise<number> {
    return this.storage.size;
  }

  /**
   * 开始定期清理过期数据
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000); // 5分钟
  }

  /**
   * 清理过期数据
   */
  private cleanupExpired(): void {
    const now = Date.now();
    
    for (const [key, item] of this.storage.entries()) {
      if (item.expires && now > item.expires) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * 停止清理定时器
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// 导出单例实例
export const memoryStorage = new MemoryStorage();