import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 应用配置
export const appConfig = {
  name: process.env['APP_NAME'] || 'Trade App Server',
  version: process.env['APP_VERSION'] || '1.0.0',
  port: parseInt(process.env['PORT'] || '3000'),
  env: process.env['NODE_ENV'] || 'development',
  apiPrefix: process.env['API_PREFIX'] || '/api/v1',
};

// 数据库配置
export const dbConfig = {
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '3306'),
  user: process.env['DB_USER'] || 'root',
  password: process.env['DB_PASSWORD'] || '',
  database: process.env['DB_NAME'] || 'trade_app',
  connectionLimit: parseInt(process.env['DB_CONNECTION_LIMIT'] || '20'),
  acquireTimeout: parseInt(process.env['DB_ACQUIRE_TIMEOUT'] || '60000'),
  timeout: parseInt(process.env['DB_TIMEOUT'] || '60000'),
  reconnect: true,
};

// Redis 配置
export const redisConfig = {
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379'),
  password: process.env['REDIS_PASSWORD'] || '',
  db: parseInt(process.env['REDIS_DB'] || '0'),
  keyPrefix: process.env['REDIS_KEY_PREFIX'] || 'trade_app:',
};

// JWT 配置
export const jwtConfig = {
  secret: process.env['JWT_SECRET'] || 'your-secret-key',
  refreshSecret: process.env['JWT_REFRESH_SECRET'] || 'your-refresh-secret',
  expiresIn: process.env['JWT_EXPIRES_IN'] || '2h',
  refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  issuer: process.env['JWT_ISSUER'] || 'trade-app',
  audience: process.env['JWT_AUDIENCE'] || 'trade-app-users',
};

// 加密配置
export const encryptionConfig = {
  key: process.env['ENCRYPTION_KEY'] || 'your-32-character-encryption-key',
  algorithm: 'aes-256-gcm' as const,
  ivLength: 16,
  tagLength: 16,
};

// 密码加密配置
export const bcryptConfig = {
  rounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12'),
};

// 邮件配置
export const emailConfig = {
  host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
  port: parseInt(process.env['SMTP_PORT'] || '587'),
  secure: false,
  auth: {
    user: process.env['SMTP_USER'] || '',
    pass: process.env['SMTP_PASS'] || '',
  },
};

// 文件上传配置
export const uploadConfig = {
  path: process.env['UPLOAD_PATH'] || 'uploads/',
  maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760'), // 10MB
  allowedTypes: process.env['ALLOWED_FILE_TYPES']?.split(',') || [
    'jpg',
    'jpeg',
    'png',
    'pdf',
    'doc',
    'docx',
  ],
};

// 限流配置
export const rateLimitConfig = {
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15分钟
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// WebSocket 配置
export const wsConfig = {
  port: parseInt(process.env['WS_PORT'] || '3001'),
  cors: {
    origin: process.env['WS_CORS_ORIGIN'] || 'http://localhost:8080',
    methods: ['GET', 'POST'],
  },
};

// 日志配置
export const loggerConfig = {
  level: process.env['LOG_LEVEL'] || 'info',
  filePath: process.env['LOG_FILE_PATH'] || 'logs/app.log',
  maxSize: process.env['LOG_MAX_SIZE'] || '20m',
  maxFiles: process.env['LOG_MAX_FILES'] || '14d',
  datePattern: process.env['LOG_DATE_PATTERN'] || 'YYYY-MM-DD',
};

// 缓存配置
export const cacheConfig = {
  defaultTTL: parseInt(process.env['CACHE_DEFAULT_TTL'] || '3600'), // 1小时
  checkPeriod: parseInt(process.env['CACHE_CHECK_PERIOD'] || '60000'), // 1分钟
};

// 监控配置
export const metricsConfig = {
  enabled: process.env['ENABLE_METRICS'] === 'true',
  port: parseInt(process.env['METRICS_PORT'] || '9090'),
};

// 验证所有必需的环境变量
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`环境变量 ${envVar} 是必需的`);
  }
});

export default {
  app: appConfig,
  db: dbConfig,
  redis: redisConfig,
  jwt: jwtConfig,
  encryption: encryptionConfig,
  bcrypt: bcryptConfig,
  email: emailConfig,
  upload: uploadConfig,
  rateLimit: rateLimitConfig,
  ws: wsConfig,
  logger: loggerConfig,
  cache: cacheConfig,
  metrics: metricsConfig,
};