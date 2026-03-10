'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const { validate, validateObjectId, validateSensorDataBody } = require('../../middleware/validation');
const {
  getSensorData,
  getSensorDataById,
  createSensorData,
  bulkCreateSensorData,
  deleteSensorData,
  fetchFromThingSpeak,
  getDevices,
  getDeviceHistory,
} = require('./iot.controller');

router.use(authenticate);

router.get('/', getSensorData);
router.get('/devices', getDevices);
router.get('/thingspeak', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR), fetchFromThingSpeak);
router.get('/devices/:deviceId/history', getDeviceHistory);
router.get('/:id', validateObjectId, validate, getSensorDataById);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR), validateSensorDataBody, validate, createSensorData);
router.post('/bulk', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR), bulkCreateSensorData);
router.delete('/:id', authorize(ROLES.ADMIN), validateObjectId, validate, deleteSensorData);

module.exports = router;
