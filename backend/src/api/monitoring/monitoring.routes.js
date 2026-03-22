'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const { validate, validateObjectId, validateAlertBody } = require('../../middleware/validation');
const {
  getSystemHealth,
  getAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  acknowledgeAlert,
  resolveAlert,
  deleteAlert,
  getAlertStats,
} = require('./monitoring.controller');

router.use(authenticate);

router.get('/health', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR), getSystemHealth);
router.get('/alerts', getAlerts);
router.get('/alerts/stats', getAlertStats);
router.get('/alerts/:id', validateObjectId, validate, getAlertById);
router.post('/alerts', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR), validateAlertBody, validate, createAlert);
router.put('/alerts/:id', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR), validateObjectId, validate, updateAlert);
router.patch('/alerts/:id/acknowledge', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR), validateObjectId, validate, acknowledgeAlert);
router.patch('/alerts/:id/resolve', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR), validateObjectId, validate, resolveAlert);
router.delete('/alerts/:id', authorize(ROLES.ADMIN), validateObjectId, validate, deleteAlert);

module.exports = router;
