'use strict';

const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const log = async ({ userId, action, resource, resourceId, details, req, statusCode }) => {
  try {
    const ip = req && (req.headers['x-forwarded-for'] || req.ip);
    const userAgent = req && req.headers['user-agent'];
    await AuditLog.create({ userId, action, resource, resourceId, details, ip, userAgent, statusCode });
  } catch (err) {
    logger.error('Audit log failed:', err);
  }
};

const getAuditLogs = async (filters = {}, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(filters).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filters),
  ]);
  return { logs, total, page, limit, pages: Math.ceil(total / limit) };
};

const getUserActivity = async (userId, limit = 10) => {
  return AuditLog.find({ userId }).sort({ timestamp: -1 }).limit(limit).lean();
};

module.exports = { log, getAuditLogs, getUserActivity };
