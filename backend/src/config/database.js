'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./env');

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

const connectDB = async () => {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(config.MONGODB_URI);
      logger.info('MongoDB connected successfully');
      return;
    } catch (err) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      logger.error(`MongoDB connection attempt ${attempt + 1} failed: ${err.message}. Retrying in ${delay}ms...`);
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('Failed to connect to MongoDB after maximum retries');
};

mongoose.connection.on('connected', () => {
  logger.info('Mongoose connection established');
});

mongoose.connection.on('error', (err) => {
  logger.error(`Mongoose connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose connection disconnected');
});

module.exports = connectDB;
