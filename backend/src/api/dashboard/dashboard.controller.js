'use strict';

const SensorData = require('../../models/SensorData');
const monitoringService = require('../../services/monitoring.service');
const auditService = require('../../services/audit.service');

const getOverview = async (req, res, next) => {
  try {
    const [activeAlerts, sensorStats, systemHealth] = await Promise.all([
      monitoringService.getActiveAlertsCount(),
      monitoringService.getSensorDataStats('24h'),
      monitoringService.getSystemHealth(),
    ]);
    res.json({ success: true, data: { activeAlerts, sensorStats, systemHealth } });
  } catch (err) {
    next(err);
  }
};

const getAlertsSummary = async (req, res, next) => {
  try {
    const stats = await monitoringService.getAlertStats();
    res.json({ success: true, data: { stats } });
  } catch (err) {
    next(err);
  }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const { logs, total } = await auditService.getAuditLogs({}, { page: 1, limit: 20 });
    res.json({ success: true, data: { logs, total } });
  } catch (err) {
    next(err);
  }
};

const getSensorSummary = async (req, res, next) => {
  try {
    const summary = await SensorData.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: { deviceId: '$deviceId', sensorType: '$sensorType' },
          latestValue: { $first: '$value' },
          unit: { $first: '$unit' },
          latestTimestamp: { $first: '$timestamp' },
          location: { $first: '$location' },
        },
      },
      {
        $project: {
          _id: 0,
          deviceId: '$_id.deviceId',
          sensorType: '$_id.sensorType',
          latestValue: 1,
          unit: 1,
          latestTimestamp: 1,
          location: 1,
        },
      },
    ]);
    res.json({ success: true, data: { summary } });
  } catch (err) {
    next(err);
  }
};

const getSystemStatus = async (req, res, next) => {
  try {
    const health = await monitoringService.getSystemHealth();
    res.json({ success: true, data: { health } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getOverview, getAlertsSummary, getRecentActivity, getSensorSummary, getSystemStatus };
