'use strict';

const winston = require('winston');
const path = require('path');
const config = require('../config/env');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, service, stack }) => {
  return `[${ts}] [${level.toUpperCase()}] [${service}]: ${stack || message}`;
});

const transports = [
  new winston.transports.File({
    filename: path.join(config.LOG_DIR, 'error.log'),
    level: 'error',
    format: combine(timestamp(), errors({ stack: true }), logFormat),
  }),
  new winston.transports.File({
    filename: path.join(config.LOG_DIR, 'combined.log'),
    level: config.LOG_LEVEL,
    format: combine(timestamp(), errors({ stack: true }), logFormat),
  }),
];

if (config.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), errors({ stack: true }), logFormat),
    })
  );
}

const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  defaultMeta: { service: 'sirep-nexus' },
  transports,
});

module.exports = logger;
