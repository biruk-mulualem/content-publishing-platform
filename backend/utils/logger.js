// backend/utils/logger.js
const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    // If the message is an object, stringify it
    if (typeof info.message === 'object') {
      return `${info.timestamp} ${info.level}: ${JSON.stringify(info.message, null, 2)}`;
    }
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

// JSON format for file logs
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: jsonFormat, // Default format for files
  transports: [
    // Console transport with pretty printing
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          const { timestamp, level, message, ...meta } = info;
          
          // Format the message
          let logMessage = `${timestamp} ${level}:`;
          
          if (typeof message === 'object') {
            logMessage += `\n${JSON.stringify(message, null, 2)}`;
          } else {
            logMessage += ` ${message}`;
          }
          
          // Add any additional metadata
          if (Object.keys(meta).length > 0) {
            logMessage += `\n${JSON.stringify(meta, null, 2)}`;
          }
          
          return logMessage;
        })
      )
    }),
    
    // File transport for all logs (JSON format)
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: jsonFormat
    }),
    
    // File transport for error logs (JSON format)
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: jsonFormat
    })
  ]
});

// Create a stream for Morgan (HTTP logging)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;