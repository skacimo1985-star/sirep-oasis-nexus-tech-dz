'use strict';

const mongoose = require('mongoose');
const { SENSOR_TYPES } = require('../utils/constants');

const sensorDataSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  sensorType: {
    type: String,
    required: true,
    enum: Object.values(SENSOR_TYPES),
    index: true,
  },
  value: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  isAnomaly: {
    type: Boolean,
    default: false,
  },
});

sensorDataSchema.index({ deviceId: 1, timestamp: -1 });
sensorDataSchema.index({ sensorType: 1, timestamp: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
