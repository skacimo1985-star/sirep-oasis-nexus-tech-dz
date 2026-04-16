'use strict';

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { setupSecurity } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const config = require('./config/env');
const logger = require('./utils/logger');

// ── Routers ───────────────────────────────────────────────────
const authRouter = require('./auth/auth.controller');
const usersRouter = require('./api/users/users.routes');
const dashboardRouter = require('./api/dashboard/dashboard.routes');
const iotRouter = require('./api/iot/iot.routes');
const monitoringRouter = require('./api/monitoring/monitoring.routes');
const paymentsRouter = require('./api/payments.routes');

const app = express();
const server = http.createServer(app);

setupSecurity(app);

// ── Chargily Webhook: raw body BEFORE express.json() ─────────
// Must be registered first so rawBody Buffer is available
app.use(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' })
);

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'sirep-nexus-backend',
    version: '1.0.0',
  });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/iot', iotRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/payments', paymentsRouter);

// ── Error handlers ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Socket.io ─────────────────────────────────────────────────
const corsOrigins = Array.isArray(config.CORS_ORIGINS)
  ? config.CORS_ORIGINS
  : [config.CORS_ORIGINS];

const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on('subscribe:alerts', () => {
    socket.join('alerts');
  });
  socket.on('subscribe:sensorData', (deviceId) => {
    socket.join(`sensor:${deviceId}`);
  });
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

app.set('io', io);

module.exports = { app, server, io };
