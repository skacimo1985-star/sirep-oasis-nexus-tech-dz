'use strict';

/**
 * chargily.service.js
 * Chargily Pay v2 API integration for SIREP OASIS NEXUS TECH DZ
 * Docs: https://dev.chargily.com/pay-v2/introduction
 */

const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../utils/logger');

const BASE_URL = 'https://pay.chargily.net/api/v2';

// Axios instance with auth header
const chargilyClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${config.CHARGILY_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ── Interceptors ───────────────────────────────────────────────
chargilyClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;
    logger.error(`Chargily API error [${status}]: ${message}`);
    return Promise.reject(err);
  }
);

// ── Public API ─────────────────────────────────────────────────

/**
 * createCheckout
 * Creates a new Chargily Pay v2 checkout session.
 * @param {object} opts
 * @param {number}  opts.amount          Amount in smallest currency unit (e.g. centimes)
 * @param {string}  opts.currency        'DZD' | 'USD' | 'EUR'
 * @param {string}  opts.name            Item/order name
 * @param {string}  [opts.description]
 * @param {string}  opts.successUrl
 * @param {string}  opts.failureUrl
 * @param {string}  [opts.webhookEndpoint]
 * @param {object}  [opts.metadata]
 * @returns {Promise<object>} Chargily checkout object
 */
async function createCheckout({
  amount,
  currency = 'DZD',
  name,
  description,
  successUrl,
  failureUrl,
  webhookEndpoint,
  metadata = {},
}) {
  const payload = {
    items: [
      {
        price: amount,
        quantity: 1,
        name,
        description: description || name,
      },
    ],
    currency,
    success_url: successUrl,
    failure_url: failureUrl,
    webhook_endpoint: webhookEndpoint,
    metadata,
    locale: 'ar', // Arabic for Algerian UX
    payment_method: 'edahabia', // default Algerian method
  };

  const { data } = await chargilyClient.post('/checkouts', payload);
  logger.info(`Chargily checkout created: ${data.id}`);
  return data;
}

/**
 * getCheckout
 * Retrieve a checkout session by ID.
 * @param {string} checkoutId
 * @returns {Promise<object>}
 */
async function getCheckout(checkoutId) {
  const { data } = await chargilyClient.get(`/checkouts/${checkoutId}`);
  return data;
}

/**
 * getBalance
 * Retrieve the Chargily merchant account balance.
 * @returns {Promise<object>}
 */
async function getBalance() {
  const { data } = await chargilyClient.get('/balance');
  return data;
}

/**
 * verifyWebhookSignature
 * Validates an incoming Chargily webhook using HMAC-SHA256.
 * @param {Buffer} rawBody  Raw request body buffer
 * @param {string} signature Header value from 'signature'
 * @returns {boolean}
 */
function verifyWebhookSignature(rawBody, signature) {
  if (!config.CHARGILY_SECRET_KEY) {
    logger.error('CHARGILY_SECRET_KEY not configured');
    return false;
  }

  const expected = crypto
    .createHmac('sha256', config.CHARGILY_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * handleCheckoutPaid
 * Business logic executed when a checkout is confirmed as paid.
 * Extend this function with DB writes, order fulfilment, notifications, etc.
 * @param {object} checkoutData
 */
async function handleCheckoutPaid(checkoutData) {
  logger.info(`Payment confirmed for checkout: ${checkoutData.id}`, {
    amount: checkoutData.amount,
    currency: checkoutData.currency,
    metadata: checkoutData.metadata,
  });
  // TODO: update order/subscription status in DB
  // await Order.updateOne({ chargilyId: checkoutData.id }, { status: 'paid' });
}

/**
 * handleCheckoutFailed
 * Business logic executed when a checkout payment fails.
 * @param {object} checkoutData
 */
async function handleCheckoutFailed(checkoutData) {
  logger.warn(`Payment failed for checkout: ${checkoutData.id}`, {
    metadata: checkoutData.metadata,
  });
  // TODO: notify user, revert reserved stock, etc.
}

module.exports = {
  createCheckout,
  getCheckout,
  getBalance,
  verifyWebhookSignature,
  handleCheckoutPaid,
  handleCheckoutFailed,
};
