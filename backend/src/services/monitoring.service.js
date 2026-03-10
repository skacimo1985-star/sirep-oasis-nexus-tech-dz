'use strict';

const os = require('os');
const Alert = require('../models/Alert');
const SensorData = require('../models/SensorData');
const { ALERT_STATUS, ALERT_SEVERITY } = require('../utils/constants');
const logger = require('../utils/logger');

const THRESHOLDS = {
  temperature: { max: 80 },
  humidity: { max: 95 },
  pressure: { max: 1100 },
  voltage: { max: 250 },
  current: { max: 100 },
  flow: { max: 500 },
  level: { max: 100 },
  vibration: { max: 50 },
};

const getSystemHealth = async () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  return {
    uptime: process.uptime(),
    memoryUsage: {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usedPercent: ((usedMem / totalMem) * 100).toFixed(2),
    },
    cpuUsage: process.cpuUsage(),
    platform: os.platform(),
    nodeVersion: process.version,
    timestamp: new Date(),
    status: 'healthy',
  };
};

const getAlertStats = async () => {
  return Alert.aggregate([
    {
      $group: {
        _id: { status: '$status', severity: '$severity' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.status',
        total: { $sum: '$count' },
        bySeverity: { $push: { severity: '$_id.severity', count: '$count' } },
      },
    },
    {
      $project: {
        status: '$_id',
        _id: 0,
        total: 1,
        bySeverity: 1,
      },
    },
  ]);
};

const getSensorDataStats = async (timeRange = '24h') => {
  const rangeMap = { '1h': 1, '24h': 24, '7d': 168, '30d': 720 };
  const hours = rangeMap[timeRange] || 24;
  const startTime = new Date(Date.now() - hours * 3600000);

  return SensorData.aggregate([
    { $match: { timestamp: { $gte: startTime } } },
    {
      $group: {
        _id: '$sensorType',
        count: { $sum: 1 },
        avgValue: { $avg: '$value' },
        minValue: { $min: '$value' },
        maxValue: { $max: '$value' },
      },
    },
    {
      $project: {
        sensorType: '$_id',
        _id: 0,
        count: 1,
        avgValue: { $round: ['$avgValue', 2] },
        minValue: 1,
        maxValue: 1,
      },
    },
  ]);
};

const getActiveAlertsCount = async () => {
  return Alert.countDocuments({
    status: { $in: [ALERT_STATUS.OPEN, ALERT_STATUS.ACKNOWLEDGED] },
  });
};

const checkThresholds = async (sensorDataDoc) => {
  try {
    const threshold = THRESHOLDS[sensorDataDoc.sensorType];
    if (!threshold) {
      return;
    }

    const { value, sensorType, deviceId } = sensorDataDoc;
    let severity = null;

    if (value > threshold.max * 1.2) {
      severity = ALERT_SEVERITY.CRITICAL;
    } else if (value > threshold.max * 1.1) {
      severity = ALERT_SEVERITY.HIGH;
    } else if (value > threshold.max) {
      severity = ALERT_SEVERITY.MEDIUM;
    }

    if (severity) {
      await Alert.create({
        type: 'sensor_threshold_exceeded',
        severity,
        message: `${sensorType} value ${value} exceeded threshold ${threshold.max} on device ${deviceId}`,
        source: 'monitoring-service',
        deviceId,
        sensorType,
        value,
        threshold: threshold.max,
      });
    }
  } catch (err) {
    logger.error('checkThresholds error:', err);
  }
};

module.exports = { getSystemHealth, getAlertStats, getSensorDataStats, getActiveAlertsCount, checkThresholds };
