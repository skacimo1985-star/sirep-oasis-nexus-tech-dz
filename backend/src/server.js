'use strict';

require('dotenv').config();

const { server } = require('./app');
const connectDB = require('./config/database');
const config = require('./config/env');
const logger = require('./utils/logger');

const PORT = config.PORT || 5000;

let httpServer;

const startServer = async () => {
  try {
    await connectDB();
    httpServer = server.listen(PORT, () => {
      logger.info(`SIREP OASIS NEXUS TECH DZ server running on port ${PORT} in ${config.NODE_ENV} mode`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  if (httpServer) {
    httpServer.close(async () => {
      logger.info('HTTP server closed.');
      const mongoose = require('mongoose');
      await mongoose.disconnect();
      logger.info('MongoDB disconnected.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
