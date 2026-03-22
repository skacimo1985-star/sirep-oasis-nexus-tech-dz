'use strict';

const Alert = require('../../models/Alert');
const monitoringService = require('../../services/monitoring.service');
const auditService = require('../../services/audit.service');
const { AppError } = require('../../middleware/errorHandler');
const { AUDIT_ACTIONS } = require('../../utils/constants');

const getSystemHealth = async (req, res, next) => {
  try {
    const health = await monitoringService.getSystemHealth();
    res.json({ success: true, data: { health } });
  } catch (err) {
    next(err);
  }
};

const getAlerts = async (req, res, next) => {
  try {
    const { status, severity, deviceId, page = 1, limit = 20 } = req.query;
    const p = Number(page);
    const l = Number(limit);
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (severity) {
      filter.severity = severity;
    }
    if (deviceId) {
      filter.deviceId = deviceId;
    }
    const skip = (p - 1) * l;
    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l)
        .populate('assignedTo', 'firstName lastName email')
        .lean(),
      Alert.countDocuments(filter),
    ]);
    res.json({ success: true, data: { alerts, total, page: p, limit: l } });
  } catch (err) {
    next(err);
  }
};

const getAlertById = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id).populate(
      'assignedTo acknowledgedBy resolvedBy',
      'firstName lastName email'
    );
    if (!alert) {
      throw new AppError('Alert not found', 404);
    }
    res.json({ success: true, data: { alert } });
  } catch (err) {
    next(err);
  }
};

const createAlert = async (req, res, next) => {
  try {
    const alert = await Alert.create(req.body);
    await auditService.log({
      userId: req.user._id,
      action: AUDIT_ACTIONS.CREATE,
      resource: 'alert',
      resourceId: alert._id,
    });
    res.status(201).json({ success: true, data: { alert } });
  } catch (err) {
    next(err);
  }
};

const updateAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!alert) {
      throw new AppError('Alert not found', 404);
    }
    await auditService.log({
      userId: req.user._id,
      action: AUDIT_ACTIONS.UPDATE,
      resource: 'alert',
      resourceId: alert._id,
    });
    res.json({ success: true, data: { alert } });
  } catch (err) {
    next(err);
  }
};

const acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'acknowledged', acknowledgedAt: new Date(), acknowledgedBy: req.user._id } },
      { new: true }
    );
    if (!alert) {
      throw new AppError('Alert not found', 404);
    }
    res.json({ success: true, data: { alert } });
  } catch (err) {
    next(err);
  }
};

const resolveAlert = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: req.user._id,
          ...(notes && { notes }),
        },
      },
      { new: true }
    );
    if (!alert) {
      throw new AppError('Alert not found', 404);
    }
    res.json({ success: true, data: { alert } });
  } catch (err) {
    next(err);
  }
};

const deleteAlert = async (req, res, next) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    await auditService.log({
      userId: req.user._id,
      action: AUDIT_ACTIONS.DELETE,
      resource: 'alert',
      resourceId: req.params.id,
    });
    res.json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    next(err);
  }
};

const getAlertStats = async (req, res, next) => {
  try {
    const stats = await monitoringService.getAlertStats();
    res.json({ success: true, data: { stats } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSystemHealth,
  getAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  acknowledgeAlert,
  resolveAlert,
  deleteAlert,
  getAlertStats,
};
