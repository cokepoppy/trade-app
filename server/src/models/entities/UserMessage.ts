import { UserMessage } from '../../types/index';
import { database } from '../../utils/database';
import { redisClient } from '../../utils/redis';
import logger from '../../utils/logger';

/**
 * 用户消息数据访问层
 */
export class UserMessageModel {
  private tableName = 'user_messages';

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
      const countResult = await database.query(countSql, queryParams);
      const total = countResult[0].total;

      // 获取消息列表
      const sql = `
        SELECT 
          id, user_id, type, title, content, summary,
          priority, is_read, is_deleted,
          expire_time, created_at, read_time, delete_time,
          related_id, related_type
        FROM ${this.tableName}
        WHERE ${whereClause} AND is_deleted = false
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      queryParams.push(pageSize, offset);
      const rows = await database.query(sql, queryParams);

      const messages = rows.map(row => ({
        ...row,
        createdAt: new Date(row.created_at).getTime(),
        readTime: row.read_time ? new Date(row.read_time).getTime() : null,
        deleteTime: row.delete_time ? new Date(row.delete_time).getTime() : null,
        expireTime: row.expire_time ? new Date(row.expire_time).getTime() : null
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
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return cached;
      }

      const sql = `
        SELECT 
          id, user_id, type, title, content, summary,
          priority, is_read, is_deleted,
          expire_time, created_at, read_time, delete_time,
          related_id, related_type
        FROM ${this.tableName}
        WHERE user_id = ? AND is_read = false AND is_deleted = false
        ORDER BY created_at DESC
      `;
      const rows = await database.query(sql, [userId]);

      const messages = rows.map(row => ({
        ...row,
        createdAt: new Date(row.created_at).getTime(),
        readTime: row.read_time ? new Date(row.read_time).getTime() : null,
        deleteTime: row.delete_time ? new Date(row.delete_time).getTime() : null,
        expireTime: row.expire_time ? new Date(row.expire_time).getTime() : null
      }));

      await redisClient.set(cacheKey, messages, 300); // 缓存5分钟

      return messages;
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
          id, user_id, type, title, content, summary,
          priority, is_read, is_deleted,
          expire_time, created_at, read_time, delete_time,
          related_id, related_type
        FROM ${this.tableName}
        WHERE id = ? AND is_deleted = false
      `;
      const rows = await database.query(sql, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        ...row,
        createdAt: new Date(row.created_at).getTime(),
        readTime: row.read_time ? new Date(row.read_time).getTime() : null,
        deleteTime: row.delete_time ? new Date(row.delete_time).getTime() : null,
        expireTime: row.expire_time ? new Date(row.expire_time).getTime() : null
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
    try {
      const message = {
        id: require('uuid').v4(),
        type: messageData.type || 'system',
        title: messageData.title || '',
        content: messageData.content || '',
        summary: messageData.summary || '',
        priority: messageData.priority || 'medium',
        is_read: false,
        is_deleted: false,
        expire_time: messageData.expireTime || null,
        created_at: messageData.created_at || new Date(),
        read_time: null,
        delete_time: null,
        related_id: messageData.relatedId || null,
        related_type: messageData.relatedType || null,
        ...messageData,
      };

      const sql = `
        INSERT INTO ${this.tableName} (
          id, user_id, type, title, content, summary,
          priority, is_read, is_deleted,
          expire_time, created_at, read_time, delete_time,
          related_id, related_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        message.id, message.user_id, message.type, message.title, message.content, message.summary,
        message.priority, message.is_read, message.is_deleted,
        message.expire_time, message.created_at, message.read_time, message.delete_time,
        message.related_id, message.related_type
      ];

      await database.query(sql, params);

      // 清除用户未读消息缓存
      if (message.user_id) {
        await redisClient.del(`user:${message.user_id}:unread_messages`);
      }

      logger.info('消息创建成功', { messageId: message.id, userId: message.user_id });
      return message as UserMessage;
    } catch (error) {
      logger.error('创建消息失败', { messageData, error });
      throw error;
    }
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
      await database.query(sql, [new Date(), id, userId]);

      // 清除缓存
      await redisClient.del(`user:${userId}:unread_messages`);
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
      await database.query(sql, [new Date(), userId]);

      // 清除缓存
      await redisClient.del(`user:${userId}:unread_messages`);
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
      await database.query(sql, [new Date(), id, userId]);

      // 清除缓存
      await redisClient.del(`user:${userId}:unread_messages`);
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
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return cached;
      }

      const sql = `
        SELECT COUNT(*) as count 
        FROM ${this.tableName} 
        WHERE user_id = ? AND is_read = false AND is_deleted = false
      `;
      const result = await database.query(sql, [userId]);
      const count = result[0].count;

      await redisClient.set(cacheKey, count, 300); // 缓存5分钟

      return count;
    } catch (error) {
      logger.error('获取未读消息数量失败', { userId, error });
      throw error;
    }
  }
}

// 导出模型实例
export const userMessageModel = new UserMessageModel();