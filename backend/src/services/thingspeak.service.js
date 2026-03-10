'use strict';

const axios = require('axios');
const config = require('../config/env');
const { AppError } = require('../middleware/errorHandler');

const client = axios.create({
  baseURL: config.THINGSPEAK_BASE_URL,
  timeout: 10000,
});

const getChannelFeeds = async (channelId, options = {}) => {
  try {
    const params = { api_key: config.THINGSPEAK_API_KEY, ...options };
    const res = await client.get(`/channels/${channelId}/feeds.json`, { params });
    return res.data;
  } catch (err) {
    if (err.response) {
      throw new AppError(`ThingSpeak error: ${err.response.statusText}`, err.response.status);
    }
    throw new AppError('ThingSpeak service unavailable', 503);
  }
};

const getFieldFeed = async (channelId, fieldNumber, options = {}) => {
  try {
    const params = { api_key: config.THINGSPEAK_API_KEY, ...options };
    const res = await client.get(`/channels/${channelId}/fields/${fieldNumber}.json`, { params });
    return res.data;
  } catch (err) {
    if (err.response) {
      throw new AppError(`ThingSpeak error: ${err.response.statusText}`, err.response.status);
    }
    throw new AppError('ThingSpeak service unavailable', 503);
  }
};

const getLastEntry = async (channelId) => {
  try {
    const res = await client.get(`/channels/${channelId}/feeds/last.json`, {
      params: { api_key: config.THINGSPEAK_API_KEY },
    });
    return res.data;
  } catch (err) {
    if (err.response) {
      throw new AppError(`ThingSpeak error: ${err.response.statusText}`, err.response.status);
    }
    throw new AppError('ThingSpeak service unavailable', 503);
  }
};

const writeData = async (channelId, fields) => {
  try {
    const payload = { api_key: config.THINGSPEAK_API_KEY };
    Object.keys(fields).forEach((key, index) => {
      payload[`field${index + 1}`] = fields[key];
    });
    const res = await client.post('/update.json', payload);
    return res.data;
  } catch (err) {
    if (err.response) {
      throw new AppError(`ThingSpeak error: ${err.response.statusText}`, err.response.status);
    }
    throw new AppError('ThingSpeak service unavailable', 503);
  }
};

const transformFeedToSensorData = (feed, deviceId, sensorType, unit) => {
  return {
    deviceId,
    sensorType,
    value: parseFloat(feed.field1 || 0),
    unit,
    timestamp: new Date(feed.created_at),
    metadata: { entryId: feed.entry_id },
  };
};

module.exports = { getChannelFeeds, getFieldFeed, getLastEntry, writeData, transformFeedToSensorData };
