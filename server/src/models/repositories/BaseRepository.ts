import { query, transaction } from '../../utils/database';
import { redisClient } from '../../utils/redis';
import logger from '../../utils/logger';
import { AppError } from '../../types';

/**
 * 通用仓库基类
 */
export abstract class BaseRepository {
  protected tableName: string;
  protected cachePrefix: string;
  protected cacheTTL: number = 3600; // 默认缓存1小时

  constructor(tableName: string, cachePrefix: string) {
    this.tableName = tableName;
    this.cachePrefix = cachePrefix;
  }

  /**
   * 生成缓存键
   */
  protected generateCacheKey(...parts: string[]): string {
    return `${this.cachePrefix}:${parts.join(':')}`;
  }

  /**
   * 清除缓存
   */
  protected async clearCache(...keys: string[]): Promise<void> {
    try {
      const cacheKeys = keys.map(key => this.generateCacheKey(key));
      await Promise.all(cacheKeys.map(key => redisClient.del(key)));
    } catch (error) {
      logger.warn('清除缓存失败', { keys, error });
    }
  }

  /**
   * 查找单条记录
   */
  async findById(id: string): Promise<any> {
    try {
      const cacheKey = this.generateCacheKey(id);
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return cached;
      }

      const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const rows = await query(sql, [id]);
      const result = rows.length > 0 ? rows[0] : null;

      if (result) {
        await redisClient.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      logger.error('查找记录失败', { table: this.tableName, id, error });
      throw new AppError(500, '查找记录失败');
    }
  }

  /**
   * 条件查找单条记录
   */
  async findOne(where: Record<string, any>): Promise<any> {
    try {
      const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      const params = Object.values(where);
      const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
      const rows = await query(sql, params);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('条件查找记录失败', { table: this.tableName, where, error });
      throw new AppError(500, '查找记录失败');
    }
  }

  /**
   * 查找多条记录
   */
  async find(where: Record<string, any> = {}, options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: 'ASC' | 'DESC';
  } = {}): Promise<any[]> {
    try {
      let whereClause = '';
      const params: any[] = [];

      if (Object.keys(where).length > 0) {
        whereClause = 'WHERE ' + Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        params.push(...Object.values(where));
      }

      let orderClause = '';
      if (options.orderBy) {
        orderClause = `ORDER BY ${options.orderBy} ${options.order || 'ASC'}`;
      }

      let limitClause = '';
      if (options.limit !== undefined) {
        limitClause = `LIMIT ${options.limit}`;
        if (options.offset !== undefined) {
          limitClause += ` OFFSET ${options.offset}`;
        }
      }

      const sql = `SELECT * FROM ${this.tableName} ${whereClause} ${orderClause} ${limitClause}`;
      return await query(sql, params);
    } catch (error) {
      logger.error('查找记录失败', { table: this.tableName, where, options, error });
      throw new AppError(500, '查找记录失败');
    }
  }

  /**
   * 分页查询
   */
  async paginate(params: {
    page?: number;
    pageSize?: number;
    where?: Record<string, any>;
    orderBy?: string;
    order?: 'ASC' | 'DESC';
  } = {}): Promise<{
    list: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, pageSize = 20, where = {}, orderBy, order = 'DESC' } = params;
      const offset = (page - 1) * pageSize;

      // 构建查询条件
      let whereClause = '';
      const queryParams: any[] = [];

      if (Object.keys(where).length > 0) {
        whereClause = 'WHERE ' + Object.keys(where).map(key => {
          if (typeof where[key] === 'string' && where[key].includes('%')) {
            queryParams.push(where[key]);
            return `${key} LIKE ?`;
          } else {
            queryParams.push(where[key]);
            return `${key} = ?`;
          }
        }).join(' AND ');
      }

      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
      const countResult = await query(countSql, queryParams);
      const total = countResult[0].total;

      // 查询数据
      let orderClause = '';
      if (orderBy) {
        orderClause = `ORDER BY ${orderBy} ${order}`;
      }

      const dataSql = `
        SELECT * FROM ${this.tableName} ${whereClause} ${orderClause}
        LIMIT ? OFFSET ?
      `;
      const list = await query(dataSql, [...queryParams, pageSize, offset]);

      return {
        list,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      logger.error('分页查询失败', { table: this.tableName, params, error });
      throw new AppError(500, '分页查询失败');
    }
  }

  /**
   * 创建记录
   */
  async create(data: Record<string, any>): Promise<any> {
    try {
      const id = require('uuid').v4();
      const now = Date.now();
      
      const record = {
        id,
        created_at: now,
        updated_at: now,
        ...data,
      };

      const fields = Object.keys(record);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(record);

      const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
      await query(sql, values);

      logger.info('记录创建成功', { table: this.tableName, id });
      return record;
    } catch (error) {
      logger.error('创建记录失败', { table: this.tableName, data, error });
      throw new AppError(500, '创建记录失败');
    }
  }

  /**
   * 批量创建记录
   */
  async createMany(dataList: Record<string, any>[]): Promise<any[]> {
    return await transaction(async () => {
      const results = [];
      for (const data of dataList) {
        const result = await this.create(data);
        results.push(result);
      }
      return results;
    });
  }

  /**
   * 更新记录
   */
  async update(id: string, data: Record<string, any>): Promise<any> {
    try {
      const allowedFields = Object.keys(data).filter(key => 
        !['id', 'created_at'].includes(key)
      );

      if (allowedFields.length === 0) {
        throw new AppError(400, '没有提供有效的更新字段');
      }

      const updates = allowedFields.map(field => `${field} = ?`);
      const values = [...allowedFields.map(field => data[field]), id];

      // 添加更新时间
      updates.push('updated_at = ?');
      values.push(Date.now());

      const sql = `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`;
      await query(sql, values);

      // 清除缓存
      await this.clearCache(id);

      // 返回更新后的记录
      const updated = await this.findById(id);
      return updated;
    } catch (error) {
      logger.error('更新记录失败', { table: this.tableName, id, data, error });
      throw error;
    }
  }

  /**
   * 删除记录
   */
  async delete(id: string): Promise<void> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
      await query(sql, [id]);

      // 清除缓存
      await this.clearCache(id);

      logger.info('记录删除成功', { table: this.tableName, id });
    } catch (error) {
      logger.error('删除记录失败', { table: this.tableName, id, error });
      throw new AppError(500, '删除记录失败');
    }
  }

  /**
   * 软删除记录
   */
  async softDelete(id: string): Promise<void> {
    try {
      const sql = `UPDATE ${this.tableName} SET deleted_at = ?, updated_at = ? WHERE id = ?`;
      await query(sql, [Date.now(), Date.now(), id]);

      // 清除缓存
      await this.clearCache(id);

      logger.info('记录软删除成功', { table: this.tableName, id });
    } catch (error) {
      logger.error('记录软删除失败', { table: this.tableName, id, error });
      throw new AppError(500, '删除记录失败');
    }
  }

  /**
   * 批量删除记录
   */
  async deleteMany(ids: string[]): Promise<void> {
    try {
      const placeholders = ids.map(() => '?').join(', ');
      const sql = `DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`;
      await query(sql, ids);

      // 清除缓存
      await this.clearCache(...ids);

      logger.info('批量删除记录成功', { table: this.tableName, ids });
    } catch (error) {
      logger.error('批量删除记录失败', { table: this.tableName, ids, error });
      throw new AppError(500, '批量删除记录失败');
    }
  }

  /**
   * 统计记录数量
   */
  async count(where: Record<string, any> = {}): Promise<number> {
    try {
      let whereClause = '';
      const params: any[] = [];

      if (Object.keys(where).length > 0) {
        whereClause = 'WHERE ' + Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        params.push(...Object.values(where));
      }

      const sql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
      const result = await query(sql, params);
      return result[0].total;
    } catch (error) {
      logger.error('统计记录数量失败', { table: this.tableName, where, error });
      throw new AppError(500, '统计记录数量失败');
    }
  }

  /**
   * 检查记录是否存在
   */
  async exists(id: string): Promise<boolean> {
    try {
      const sql = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
      const rows = await query(sql, [id]);
      return rows.length > 0;
    } catch (error) {
      logger.error('检查记录是否存在失败', { table: this.tableName, id, error });
      throw new AppError(500, '检查记录失败');
    }
  }

  /**
   * 执行原生查询
   */
  async query(sql: string, params: any[] = []): Promise<any> {
    try {
      return await query(sql, params);
    } catch (error) {
      logger.error('执行原生查询失败', { table: this.tableName, sql, params, error });
      throw new AppError(500, '查询执行失败');
    }
  }

  /**
   * 执行事务
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    return await transaction(callback);
  }
}

/**
 * 通用缓存仓库
 */
export abstract class CachedRepository extends BaseRepository {
  protected cacheTTL: number = 1800; // 默认缓存30分钟

  /**
   * 获取缓存数据
   */
  protected async getCachedData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    try {
      const cacheKey = this.generateCacheKey(key);
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return cached;
      }

      const data = await fetchFn();
      await redisClient.set(cacheKey, data, this.cacheTTL);
      return data;
    } catch (error) {
      logger.error('获取缓存数据失败', { key, error });
      throw error;
    }
  }

  /**
   * 设置缓存数据
   */
  protected async setCachedData(key: string, data: any, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(key);
      await redisClient.set(cacheKey, data, ttl || this.cacheTTL);
    } catch (error) {
      logger.warn('设置缓存数据失败', { key, error });
    }
  }

  /**
   * 删除缓存数据
   */
  protected async deleteCachedData(key: string): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(key);
      await redisClient.del(cacheKey);
    } catch (error) {
      logger.warn('删除缓存数据失败', { key, error });
    }
  }
}