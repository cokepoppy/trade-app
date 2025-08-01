import winston from 'winston';
import path from 'path';
import config from '../config';

// 创建日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  })
);

// 创建控制台传输
const consoleTransport = new winston.transports.Console({
  level: config.logger.level,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
      }`;
    })
  ),
});

// 创建文件传输
const fileTransport = new winston.transports.File({
  filename: path.join(process.cwd(), config.logger.filePath),
  level: config.logger.level,
  maxsize: parseInt(config.logger.maxSize) || 20971520, // 20MB in bytes
  maxFiles: parseInt(config.logger.maxFiles) || 14,
  tailable: true,
});

// 创建错误日志传输
const errorFileTransport = new winston.transports.File({
  filename: path.join(process.cwd(), 'logs', 'error.log'),
  level: 'error',
  maxsize: parseInt(config.logger.maxSize) || 20971520, // 20MB in bytes
  maxFiles: parseInt(config.logger.maxFiles) || 14,
  tailable: true,
});

// 创建 logger 实例
const logger = winston.createLogger({
  level: config.logger.level,
  format: logFormat,
  defaultMeta: { service: 'trade-app-server' },
  transports: [
    consoleTransport,
    fileTransport,
    errorFileTransport,
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
    }),
  ],
});

// 开发环境下使用更简单的格式
if (config.app.env === 'development') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;