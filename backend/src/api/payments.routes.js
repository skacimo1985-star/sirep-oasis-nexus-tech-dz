'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const chargilyService = require('../services/chargily.service');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * POST /api/payments/checkout
 * Create a Chargily Pay checkout session
 * @auth required
 */
router.post('/checkout', authenticate, async (req, res, next) => {
  try {
    const { amount, currency = 'DZD', name, description, successUrl, failureUrl, metadata = {} } = req.body;

    if (!amount || !name) {
      return res.status(400).json({ success: false, message: 'amount and name are required' });
    }

    const checkout = await chargilyService.createCheckout({
      amount,
      currency,
      name,
      description,
      successUrl: successUrl || config.CHARGILY_SUCCESS_URL,
      failureUrl: failureUrl || config.CHARGILY_FAILURE_URL,
      webhookEndpoint: `${config.BASE_URL}/api/payments/webhook`,
      metadata: { ...metadata, userId: req.user.id },
    });

    res.status(201).json({ success: true, data: checkout });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/payments/checkout/:id
 * Get checkout session status
 * @auth required
 */
router.get('/checkout/:id', authenticate, async (req, res, next) => {
  try {
    const checkout = await chargilyService.getCheckout(req.params.id);
    res.json({ success: true, data: checkout });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payments/webhook
 * Chargily Pay signed webhook - raw body required (registered in app.js before express.json)
 */
router.post('/webhook', async (req, res) => {
  const signature = req.headers['signature'];
  const rawBody = req.body; // Buffer because of express.raw()

  if (!signature || !rawBody) {
    logger.warn('Chargily webhook: missing signature or body');
    return res.status(400).json({ error: 'Bad Request' });
  }

  const isValid = chargilyService.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    logger.warn('Chargily webhook: invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (parseErr) {
    logger.error('Chargily webhook: invalid JSON', parseErr);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  logger.info(`Chargily webhook event: ${event.type}`, { id: event.id });

  switch (event.type) {
    case 'checkout.paid':
      await chargilyService.handleCheckoutPaid(event.data);
      break;
    case 'checkout.failed':
      await chargilyService.handleCheckoutFailed(event.data);
      break;
    default:
      logger.info(`Chargily webhook: unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

/**
 * GET /api/payments/balance
 * Retrieve Chargily account balance
 * @auth required
 */
router.get('/balance', authenticate, async (req, res, next) => {
  try {
    const balance = await chargilyService.getBalance();
    res.json({ success: true, data: balance });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
