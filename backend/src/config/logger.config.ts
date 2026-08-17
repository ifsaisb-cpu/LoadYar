import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

const logsDir = path.join(process.cwd(), 'logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({
    key: 'meta',
    fillExcept: ['message', 'level', 'timestamp', 'label'],
  }),
  nestWinstonModuleUtilities.format.nestLike('LoadYar', {
    colors: true,
    prettyPrint: true,
  }),
);

const logLevel = process.env.LOG_LEVEL || 'info';
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = WinstonModule.createLogger({
  format: logFormat,
  defaultMeta: {
    service: 'loadyar-api',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
  },
  transports: [
    // Console output
    new winston.transports.Console({
      level: isDevelopment ? 'debug' : logLevel,
      format: logFormat,
    }),

    // All logs to combined file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    // Error logs to separate file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),

    // Performance logs
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
  ],
});

// Daily rotation logs
if (!isDevelopment) {
  const DailyRotateFile = require('winston-daily-rotate-file');

  logger.add(
    new DailyRotateFile({
      filename: path.join(logsDir, 'daily', '%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxDays: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  );
}

export const loggerConfig = {
  level: logLevel,
  isDevelopment,
  logsDir,
};
