// =============================================================
// payments.routes.ts — SIREP OASIS NEXUS TECH DZ
// Chargily Pay V2 — Express Router
// Routes: POST /api/payments/checkout
//         GET  /api/payments/checkout/:id
//         POST /api/payments/webhook
//         GET  /api/payments/balance
// Compliance: Law 18-07 (DZ) | GDPR-compatible
// =============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { getChargilyService, ChargilyWebhookPayload } from '../services/chargily.service';

const router = Router();

// ── Validation middleware ───────────────────────────────────

const handleValidation = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, errors: errors.array() });
    return;
  }
  next();
};

// ── POST /api/payments/checkout ────────────────────────────
// Create a new Chargily checkout session

router.post(
  '/checkout',
  [
    body('amount').isFloat({ min: 75 }).withMessage('Minimum amount is 75 DZD'),
    body('payment_method')
      .isIn(['edahabia', 'cib'])
      .withMessage('payment_method must be edahabia or cib'),
    body('success_url').isURL().withMessage('success_url must be a valid URL'),
    body('failure_url').isURL().withMessage('failure_url must be a valid URL'),
    body('description').optional().isString().isLength({ max: 255 }),
    body('locale').optional().isIn(['ar', 'en', 'fr']),
    body('customer.name').optional().isString(),
    body('customer.email').optional().isEmail(),
  ],
  handleValidation,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const chargily = getChargilyService();
      const checkout = await chargily.createCheckout({
        ...req.body,
        currency: 'dzd' as const,
      });
      res.status(201).json({
        success: true,
        checkout_url: checkout.checkout_url,
        checkout_id: checkout.id,
        status: checkout.status,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment gateway error';
      res.status(502).json({ success: false, message });
    }
  }
);

// ── GET /api/payments/checkout/:id ─────────────────────────
// Get checkout status by ID

router.get(
  '/checkout/:id',
  [param('id').isString().notEmpty()],
  handleValidation,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const chargily = getChargilyService();
      const checkout = await chargily.getCheckout(req.params.id);
      res.json({
        success: true,
        id: checkout.id,
        status: checkout.status,
        amount: checkout.amount,
        currency: checkout.currency,
        checkout_url: checkout.checkout_url,
        created_at: checkout.created_at,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checkout not found';
      res.status(404).json({ success: false, message });
    }
  }
);

// ── POST /api/payments/webhook ─────────────────────────────
// Chargily webhook — MUST use raw body (express.raw)
// Register BEFORE express.json() for this route

router.post(
  '/webhook',
  (req: Request, res: Response): void => {
    const signature = req.headers['signature'] as string | undefined;

    if (!signature) {
      res.status(400).json({ success: false, message: 'Missing signature header' });
      return;
    }

    try {
      const chargily = getChargilyService();
      const rawBody = req.body as Buffer;
      const isValid = chargily.verifyWebhookSignature(rawBody, signature);

      if (!isValid) {
        res.status(401).json({ success: false, message: 'Invalid webhook signature' });
        return;
      }

      const payload: ChargilyWebhookPayload = JSON.parse(rawBody.toString('utf-8')) as ChargilyWebhookPayload;

      // ── Handle payment events ────────────────────────────
      // TODO: update your DB based on payload.status
      // Example:
      //   if (payload.status === 'paid') { ... markOrderAsPaid(payload.metadata) }
      //   if (payload.status === 'failed') { ... handlePaymentFailed(payload.id) }

      console.log(`[Chargily Webhook] ${payload.entity} | status: ${payload.status} | id: ${payload.id}`);

      res.status(200).json({ success: true, received: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Webhook processing error';
      res.status(500).json({ success: false, message });
    }
  }
);

// ── GET /api/payments/balance ─────────────────────────────
// Get Chargily account balance (protected — internal use)

router.get(
  '/balance',
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const chargily = getChargilyService();
      const balance = await chargily.getBalance();
      res.json({ success: true, balance });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Balance fetch error';
      res.status(502).json({ success: false, message });
    }
  }
);

export default router;
