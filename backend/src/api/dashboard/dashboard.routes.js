'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const { getOverview, getAlertsSummary, getRecentActivity, getSensorSummary, getSystemStatus } = require('./dashboard.controller');

router.use(authenticate);

router.get('/overview', getOverview);
router.get('/alerts-summary', getAlertsSummary);
router.get('/recent-activity', authorize(ROLES.ADMIN, ROLES.MANAGER), getRecentActivity);
router.get('/sensor-summary', getSensorSummary);
router.get('/system-status', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR), getSystemStatus);

module.exports = router;
