'use strict';

const SensorData = require('../../models/SensorData');
const monitoringService = require('../../services/monitoring.service');
const auditService = require('../../services/audit.service');
const thingSpeakService = require('../../services/thingspeak.service');
const { AppError } = require('../../middleware/errorHandler');
const { AUDIT_ACTIONS } = require('../../utils/constants');

const getSensorData = async (req, res, next) => {
  try {
    const { deviceId, sensorType, startDate, endDate, page = 1, limit = 20 } = req.query;
    const p = Number(page);
    const l = Number(limit);
    const filter = {};
    if (deviceId) {
      filter.deviceId = deviceId;
    }
    if (sensorType) {
      filter.sensorType = sensorType;
    }
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }
    const skip = (p - 1) * l;
    const [data, total] = await Promise.all([
      SensorData.find(filter).sort({ timestamp: -1 }).skip(skip).limit(l).lean(),
      SensorData.countDocuments(filter),
    ]);
    res.json({ success: true, data: { sensorData: data, total, page: p, limit: l } });
  } catch (err) {
    next(err);
  }
};

const getSensorDataById = async (req, res, next) => {
  try {
    const doc = await SensorData.findById(req.params.id);
    if (!doc) {
      throw new AppError('Sensor data not found', 404);
    }
    res.json({ success: true, data: { sensorData: doc } });
  } catch (err) {
    next(err);
  }
};

const createSensorData = async (req, res, next) => {
  try {
    const doc = await SensorData.create(req.body);
    monitoringService.checkThresholds(doc).catch(() => {});
    res.status(201).json({ success: true, data: { sensorData: doc } });
  } catch (err) {
    next(err);
  }
};

const bulkCreateSensorData = async (req, res, next) => {
  try {
    const docs = await SensorData.insertMany(req.body.data);
    docs.forEach((d) => monitoringService.checkThresholds(d).catch(() => {}));
    res.status(201).json({ success: true, data: { count: docs.length, sensorData: docs } });
  } catch (err) {
    next(err);
  }
};

const deleteSensorData = async (req, res, next) => {
  try {
    await SensorData.findByIdAndDelete(req.params.id);
    await auditService.log({
      userId: req.user._id,
      action: AUDIT_ACTIONS.DELETE,
      resource: 'sensorData',
      resourceId: req.params.id,
    });
    res.json({ success: true, message: 'Sensor data deleted' });
  } catch (err) {
    next(err);
  }
};

const fetchFromThingSpeak = async (req, res, next) => {
  try {
    const { channelId, sensorType = 'temperature', unit = 'C', deviceId = 'thingspeak' } = req.query;
    if (!channelId) {
      throw new AppError('channelId is required', 400);
    }
    const feeds = await thingSpeakService.getChannelFeeds(channelId);
    const transformed = feeds.feeds.map((f) =>
      thingSpeakService.transformFeedToSensorData(f, deviceId, sensorType, unit)
    );
    const saved = await SensorData.insertMany(transformed);
    res.json({ success: true, data: { count: saved.length, sensorData: saved } });
  } catch (err) {
    next(err);
  }
};

const getDevices = async (req, res, next) => {
  try {
    const devices = await SensorData.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$deviceId',
          latestTimestamp: { $first: '$timestamp' },
          sensorTypes: { $addToSet: '$sensorType' },
          readingCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          deviceId: '$_id',
          latestTimestamp: 1,
          sensorTypes: 1,
          readingCount: 1,
        },
      },
    ]);
    res.json({ success: true, data: { devices } });
  } catch (err) {
    next(err);
  }
};

const getDeviceHistory = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50 } = req.query;
    const history = await SensorData.find({ deviceId }).sort({ timestamp: -1 }).limit(Number(limit)).lean();
    res.json({ success: true, data: { deviceId, history } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSensorData,
  getSensorDataById,
  createSensorData,
  bulkCreateSensorData,
  deleteSensorData,
  fetchFromThingSpeak,
  getDevices,
  getDeviceHistory,
};
