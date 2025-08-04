const { database } = require('./utils/database');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

/**
 * 数据库迁移脚本
 */
class Migration {
  constructor() {
    this.migrationsDir = path.join(__dirname, 'migration');
  }

  /**
   * 运行迁移
   */
  async run() {
    try {
      logger.info('开始运行数据库迁移');

      // 确保数据库连接
      await database.connect();

      // 获取所有迁移文件
      const migrationFiles = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      // 创建迁移表（如果不存在）
      await this.createMigrationsTable();

      // 获取已执行的迁移
      const executedMigrations = await this.getExecutedMigrations();

      // 执行未执行的迁移
      for (const file of migrationFiles) {
        const migrationName = path.basename(file, '.sql');
        
        if (!executedMigrations.includes(migrationName)) {
          logger.info(`执行迁移: ${migrationName}`);
          await this.executeMigration(file, migrationName);
        } else {
          logger.info(`跳过已执行的迁移: ${migrationName}`);
        }
      }

      logger.info('数据库迁移完成');
    } catch (error) {
      logger.error('数据库迁移失败', error);
      throw error;
    } finally {
      await database.disconnect();
    }
  }

  /**
   * 创建迁移表
   */
  async createMigrationsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(36) PRIMARY KEY,
        migration VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_migration (migration)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据库迁移记录表'
    `;
    await database.query(sql);
  }

  /**
   * 获取已执行的迁移
   */
  async getExecutedMigrations() {
    const sql = 'SELECT migration FROM schema_migrations ORDER BY executed_at';
    const rows = await database.query(sql);
    return rows.map(row => row.migration);
  }

  /**
   * 执行迁移文件
   */
  async executeMigration(file, migrationName) {
    const filePath = path.join(this.migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      // 开始事务
      await database.beginTransaction();

      // 分割SQL语句
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      // 执行每个SQL语句
      for (const statement of statements) {
        if (statement.trim()) {
          await database.query(statement + ';');
        }
      }

      // 记录迁移
      const { v4: uuidv4 } = require('uuid');
      const migrationId = uuidv4();
      await database.query(
        'INSERT INTO schema_migrations (id, migration) VALUES (?, ?)',
        [migrationId, migrationName]
      );

      // 提交事务
      await database.commit();

      logger.info(`迁移执行成功: ${migrationName}`);
    } catch (error) {
      // 回滚事务
      await database.rollback();
      logger.error(`迁移执行失败: ${migrationName}`, error);
      throw error;
    }
  }

  /**
   * 回滚迁移
   */
  async rollback(steps = 1) {
    try {
      logger.info(`开始回滚 ${steps} 个迁移`);

      // 确保数据库连接
      await database.connect();

      // 获取已执行的迁移（按时间倒序）
      const executedMigrations = await this.getExecutedMigrations();
      const migrationsToRollback = executedMigrations.slice(-steps);

      for (const migration of migrationsToRollback) {
        logger.info(`回滚迁移: ${migration}`);
        await this.rollbackMigration(migration);
      }

      logger.info('数据库迁移回滚完成');
    } catch (error) {
      logger.error('数据库迁移回滚失败', error);
      throw error;
    } finally {
      await database.disconnect();
    }
  }

  /**
   * 回滚单个迁移
   */
  async rollbackMigration(migrationName) {
    try {
      // 开始事务
      await database.beginTransaction();

      // 删除迁移记录
      await database.query(
        'DELETE FROM schema_migrations WHERE migration = ?',
        [migrationName]
      );

      // 这里可以添加具体的回滚SQL逻辑
      // 通常需要为每个迁移编写对应的回滚脚本

      // 提交事务
      await database.commit();

      logger.info(`迁移回滚成功: ${migrationName}`);
    } catch (error) {
      // 回滚事务
      await database.rollback();
      logger.error(`迁移回滚失败: ${migrationName}`, error);
      throw error;
    }
  }

  /**
   * 显示迁移状态
   */
  async status() {
    try {
      // 确保数据库连接
      await database.connect();

      // 获取所有迁移文件
      const migrationFiles = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      // 获取已执行的迁移
      const executedMigrations = await this.getExecutedMigrations();

      console.log('\n数据库迁移状态:');
      console.log('='.repeat(50));

      for (const file of migrationFiles) {
        const migrationName = path.basename(file, '.sql');
        const status = executedMigrations.includes(migrationName) ? '✓ 已执行' : '✗ 未执行';
        console.log(`${migrationName.padEnd(30)} ${status}`);
      }

      console.log('='.repeat(50));
      console.log(`总计: ${migrationFiles.length} 个迁移文件`);
      console.log(`已执行: ${executedMigrations.length} 个`);
      console.log(`未执行: ${migrationFiles.length - executedMigrations.length} 个`);
    } catch (error) {
      logger.error('获取迁移状态失败', error);
      throw error;
    } finally {
      await database.disconnect();
    }
  }
}

// 命令行处理
const command = process.argv[2];

const migration = new Migration();

switch (command) {
  case 'up':
    migration.run()
      .then(() => {
        console.log('迁移执行完成');
        process.exit(0);
      })
      .catch((error) => {
        console.error('迁移执行失败:', error);
        process.exit(1);
      });
    break;

  case 'down':
    const steps = parseInt(process.argv[3]) || 1;
    migration.rollback(steps)
      .then(() => {
        console.log('迁移回滚完成');
        process.exit(0);
      })
      .catch((error) => {
        console.error('迁移回滚失败:', error);
        process.exit(1);
      });
    break;

  case 'status':
    migration.status()
      .then(() => {
        process.exit(0);
      })
      .catch((error) => {
        console.error('获取迁移状态失败:', error);
        process.exit(1);
      });
    break;

  default:
    console.log('使用方法:');
    console.log('  node migrate.js up          # 运行所有未执行的迁移');
    console.log('  node migrate.js down [n]    # 回滚n个迁移（默认1个）');
    console.log('  node migrate.js status      # 显示迁移状态');
    process.exit(1);
}

module.exports = Migration;