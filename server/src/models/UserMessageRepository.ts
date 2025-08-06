import { CachedRepository } from './repositories/BaseRepository';
import { UserMessage } from '../types';
import logger from '../utils/logger';

/**
 * 用户消息仓库
 */
export class UserMessageRepository extends CachedRepository {
  constructor() {
    super('user_messages', 'user_message');
  }

  /**
   * 根据用户ID查找消息
   */
  async findByUserId(userId: string, params: {
    page?: number;
    pageSize?: number;
    type?: string;
    isRead?: boolean;
    priority?: string;
  } = {}): Promise<{
    list: UserMessage[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      const { page = 1, pageSize = 20, type, isRead, priority } = params;
      const offset = (page - 1) * pageSize;

      let whereConditions = ['user_id = ?'];
      const queryParams: any[] = [userId];

      if (type) {
        whereConditions.push('type = ?');
        queryParams.push(type);
      }

      if (isRead !== undefined) {
        whereConditions.push('is_read = ?');
        queryParams.push(isRead);
      }

      if (priority) {
        whereConditions.push('priority = ?');
        queryParams.push(priority);
      }

      const whereClause = whereConditions.join(' AND ');

      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE ${whereClause} AND is_deleted = false`;
      const countResult = await this.query(countSql, queryParams);
      const total = countResult[0].total;

      // 获取消息列表
      const sql = `
        SELECT 
          id, user_id as userId, type, title, content, summary,
          priority, is_read as isRead, is_deleted as isDeleted,
          expire_time as expireTime, created_at as createdAt, 
          read_time as readTime, delete_time as deleteTime,
          related_id as relatedId, related_type as relatedType
        FROM ${this.tableName}
        WHERE ${whereClause} AND is_deleted = false
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      queryParams.push(pageSize, offset);
      const rows = await this.query(sql, queryParams);

      const messages = rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt).getTime(),
        readTime: row.readTime ? new Date(row.readTime).getTime() : null,
        deleteTime: row.deleteTime ? new Date(row.deleteTime).getTime() : null,
        expireTime: row.expireTime ? new Date(row.expireTime).getTime() : null
      }));

      const totalPages = Math.ceil(total / pageSize);

      return {
        list: messages,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
    } catch (error) {
      logger.error('根据用户ID查找消息失败', { userId, params, error });
      throw error;
    }
  }

  /**
   * 获取用户未读消息
   */
  async findUnreadByUserId(userId: string): Promise<UserMessage[]> {
    try {
      const cacheKey = `user:${userId}:unread_messages`;
      const cached = await this.getCachedData(cacheKey, async () => {
        const sql = `
          SELECT 
            id, user_id as userId, type, title, content, summary,
            priority, is_read as isRead, is_deleted as isDeleted,
            expire_time as expireTime, created_at as createdAt, 
            read_time as readTime, delete_time as deleteTime,
            related_id as relatedId, related_type as relatedType
          FROM ${this.tableName}
          WHERE user_id = ? AND is_read = false AND is_deleted = false
          ORDER BY created_at DESC
        `;
        const rows = await this.query(sql, [userId]);

        return rows.map(row => ({
          ...row,
          createdAt: new Date(row.createdAt).getTime(),
          readTime: row.readTime ? new Date(row.readTime).getTime() : null,
          deleteTime: row.deleteTime ? new Date(row.deleteTime).getTime() : null,
          expireTime: row.expireTime ? new Date(row.expireTime).getTime() : null
        }));
      });

      return cached;
    } catch (error) {
      logger.error('获取用户未读消息失败', { userId, error });
      throw error;
    }
  }

  /**
   * 根据ID查找消息
   */
  async findById(id: string): Promise<UserMessage | null> {
    try {
      const sql = `
        SELECT 
          id, user_id as userId, type, title, content, summary,
          priority, is_read as isRead, is_deleted as isDeleted,
          expire_time as expireTime, created_at as createdAt, 
          read_time as readTime, delete_time as deleteTime,
          related_id as relatedId, related_type as relatedType
        FROM ${this.tableName}
        WHERE id = ? AND is_deleted = false
      `;
      const rows = await this.query(sql, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        ...row,
        createdAt: new Date(row.createdAt).getTime(),
        readTime: row.readTime ? new Date(row.readTime).getTime() : null,
        deleteTime: row.deleteTime ? new Date(row.deleteTime).getTime() : null,
        expireTime: row.expireTime ? new Date(row.expireTime).getTime() : null
      };
    } catch (error) {
      logger.error('根据ID查找消息失败', { id, error });
      throw error;
    }
  }

  /**
   * 创建消息
   */
  async create(messageData: Partial<UserMessage>): Promise<UserMessage> {
    const message = {
      type: messageData.type || 'system',
      title: messageData.title || '',
      content: messageData.content || '',
      summary: messageData.summary || '',
      priority: messageData.priority || 'medium',
      is_read: false,
      is_deleted: false,
      created_at: new Date(),
      ...messageData,
    };

    const result = await super.create(message);
    
    // 清除用户未读消息缓存
    if (messageData.userId) {
      await this.clearCache(`user:${messageData.userId}:unread_messages`);
    }
    
    return result;
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(id: string, userId: string): Promise<void> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET is_read = true, read_time = ?
        WHERE id = ? AND user_id = ? AND is_deleted = false
      `;
      await this.query(sql, [new Date(), id, userId]);

      // 清除缓存
      await this.clearCache(`user:${userId}:unread_messages`);
    } catch (error) {
      logger.error('标记消息为已读失败', { id, userId, error });
      throw error;
    }
  }

  /**
   * 标记所有消息为已读
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET is_read = true, read_time = ?
        WHERE user_id = ? AND is_read = false AND is_deleted = false
      `;
      await this.query(sql, [new Date(), userId]);

      // 清除缓存
      await this.clearCache(`user:${userId}:unread_messages`);
    } catch (error) {
      logger.error('标记所有消息为已读失败', { userId, error });
      throw error;
    }
  }

  /**
   * 删除消息
   */
  async delete(id: string, userId: string): Promise<void> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET is_deleted = true, delete_time = ?
        WHERE id = ? AND user_id = ? AND is_deleted = false
      `;
      await this.query(sql, [new Date(), id, userId]);

      // 清除缓存
      await this.clearCache(`user:${userId}:unread_messages`);
    } catch (error) {
      logger.error('删除消息失败', { id, userId, error });
      throw error;
    }
  }

  /**
   * 获取未读消息数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const cacheKey = `user:${userId}:unread_count`;
      const cached = await this.getCachedData(cacheKey, async () => {
        const sql = `
          SELECT COUNT(*) as count 
          FROM ${this.tableName} 
          WHERE user_id = ? AND is_read = false AND is_deleted = false
        `;
        const result = await this.query(sql, [userId]);
        return result[0].count;
      });

      return cached;
    } catch (error) {
      logger.error('获取未读消息数量失败', { userId, error });
      throw error;
    }
  }
}

// 导出仓库实例
export const userMessageRepository = new UserMessageRepository();