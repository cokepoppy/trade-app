require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trade_app',
  charset: 'utf8mb4',
  timezone: '+08:00',
  multipleStatements: true
};

async function initializeDatabase() {
  let connection;
  
  try {
    console.log('开始初始化数据库...');
    console.log('数据库配置:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database
    });
    
    // 先尝试连接到MySQL服务器（不指定数据库）
    const connectionConfig = { ...dbConfig };
    delete connectionConfig.database;
    connection = await mysql.createConnection(connectionConfig);
    
    console.log('MySQL服务器连接成功');
    
    // 检查数据库是否存在，不存在则创建
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', [dbConfig.database]);
    if (databases.length === 0) {
      console.log(`数据库 ${dbConfig.database} 不存在，正在创建...`);
      await connection.query(`CREATE DATABASE \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`数据库 ${dbConfig.database} 创建成功`);
    } else {
      console.log(`数据库 ${dbConfig.database} 已存在`);
    }
    
    // 关闭连接并重新连接到指定数据库
    await connection.end();
    connection = await mysql.createConnection(dbConfig);
    
    console.log('数据库连接成功');
    
    // 读取迁移文件
    const migrationPath = path.join(__dirname, 'migration', '001_initial_schema.sql');
    const schema = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('开始执行数据库迁移...');
    
    // 执行迁移
    await connection.query(schema);
    
    console.log('数据库迁移完成！');
    
    // 验证表是否创建成功
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`成功创建 ${tables.length} 个数据表:`);
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 运行初始化
initializeDatabase()
  .then(() => {
    console.log('数据库初始化成功完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  });