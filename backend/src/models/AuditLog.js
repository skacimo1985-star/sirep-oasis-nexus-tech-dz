'use strict';

const mongoose = require('mongoose');
const { AUDIT_ACTIONS } = require('../utils/constants');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: Object.values(AUDIT_ACTIONS),
  },
  resource: {
    type: String,
    required: true,
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  ip: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  statusCode: {
    type: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
