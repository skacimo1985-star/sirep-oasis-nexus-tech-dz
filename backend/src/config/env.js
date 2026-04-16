'use strict';

require('dotenv').config();
const Joi = require('joi');

const envSchema = Joi.object({
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().default(12),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().default(900000),
  RATE_LIMIT_MAX: Joi.number().integer().default(100),
  AUTH_RATE_LIMIT_MAX: Joi.number().integer().default(10),
  THINGSPEAK_API_KEY: Joi.string().optional().allow(''),
  THINGSPEAK_BASE_URL: Joi.string().default('https://api.thingspeak.com'),
  ENCRYPTION_KEY: Joi.string().required(),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly').default('info'),
  LOG_DIR: Joi.string().default('logs'),
  // ── Chargily Pay v2 ────────────────────────────────────────────
  CHARGILY_SECRET_KEY: Joi.string().optional().allow(''),
  CHARGILY_SUCCESS_URL: Joi.string().uri().default('http://localhost:3000/payment/success'),
  CHARGILY_FAILURE_URL: Joi.string().uri().default('http://localhost:3000/payment/failure'),
  BASE_URL: Joi.string().uri().default('http://localhost:5000'),
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  PORT: envVars.PORT,
  NODE_ENV: envVars.NODE_ENV,
  MONGODB_URI: envVars.MONGODB_URI,
  JWT_SECRET: envVars.JWT_SECRET,
  JWT_EXPIRES_IN: envVars.JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET: envVars.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: envVars.JWT_REFRESH_EXPIRES_IN,
  BCRYPT_SALT_ROUNDS: envVars.BCRYPT_SALT_ROUNDS,
  CORS_ORIGINS: envVars.CORS_ORIGINS.split(',').map((o) => o.trim()),
  RATE_LIMIT_WINDOW_MS: envVars.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: envVars.RATE_LIMIT_MAX,
  AUTH_RATE_LIMIT_MAX: envVars.AUTH_RATE_LIMIT_MAX,
  THINGSPEAK_API_KEY: envVars.THINGSPEAK_API_KEY,
  THINGSPEAK_BASE_URL: envVars.THINGSPEAK_BASE_URL,
  ENCRYPTION_KEY: envVars.ENCRYPTION_KEY,
  LOG_LEVEL: envVars.LOG_LEVEL,
  LOG_DIR: envVars.LOG_DIR,
  // Chargily Pay
  CHARGILY_SECRET_KEY: envVars.CHARGILY_SECRET_KEY,
  CHARGILY_SUCCESS_URL: envVars.CHARGILY_SUCCESS_URL,
  CHARGILY_FAILURE_URL: envVars.CHARGILY_FAILURE_URL,
  BASE_URL: envVars.BASE_URL,
};

module.exports = config;
