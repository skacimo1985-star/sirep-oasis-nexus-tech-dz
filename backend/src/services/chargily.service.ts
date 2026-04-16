// =============================================================
// chargily.service.ts — SIREP OASIS NEXUS TECH DZ
// Chargily Pay V2 Integration | Payment Gateway DZ
// Compliance: Law 18-07 (DZ) | Chargily Pay API v2
// Docs: https://dev.chargily.com/pay-v2/introduction
// =============================================================

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

// ── Types ────────────────────────────────────────────────────

export type ChargilyMode = 'test' | 'live';

export interface ChargilyConfig {
  apiKey: string;
  mode: ChargilyMode;
}

export interface CreateCheckoutPayload {
  amount: number;                   // Amount in DZD (smallest unit)
  currency: 'dzd';                  // Only DZD supported
  payment_method: 'edahabia' | 'cib'; // Algerian payment methods
  success_url: string;
  failure_url: string;
  webhook_endpoint?: string;
  description?: string;
  locale?: 'ar' | 'en' | 'fr';
  pass_fees_to_customer?: boolean;
  metadata?: Record<string, string | number>;
  customer?: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      country: 'DZ';
      state?: string;
    };
  };
}

export interface ChargilyCheckout {
  id: string;
  entity: 'checkout';
  livemode: boolean;
  amount: number;
  currency: string;
  fees: number;
  fees_on_merchant: number;
  fees_on_customer: number;
  pass_fees_to_customer: boolean;
  chargily_pay_fees_allocation: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'canceled';
  locale: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  success_url: string;
  failure_url: string;
  webhook_endpoint: string | null;
  checkout_url: string;
  customer_id: string | null;
  payment_link_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface ChargilyWebhookPayload {
  id: string;
  entity: string;
  livemode: boolean;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, unknown> | null;
  checkout_url?: string;
}

// ── Chargily Service Class ────────────────────────────────────

export class ChargilyService {
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  private static readonly BASE_URLS: Record<ChargilyMode, string> = {
    test: 'https://pay.chargily.net/test/api/v2',
    live: 'https://pay.chargily.net/api/v2',
  };

  constructor(config: ChargilyConfig) {
    this.apiKey = config.apiKey;
    this.client = axios.create({
      baseURL: ChargilyService.BASE_URLS[config.mode],
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15_000,
    });
  }

  // Create a new checkout session
  async createCheckout(payload: CreateCheckoutPayload): Promise<ChargilyCheckout> {
    const { data } = await this.client.post<ChargilyCheckout>('/checkouts', payload);
    return data;
  }

  // Retrieve a checkout by ID
  async getCheckout(checkoutId: string): Promise<ChargilyCheckout> {
    const { data } = await this.client.get<ChargilyCheckout>(`/checkouts/${checkoutId}`);
    return data;
  }

  // Verify Chargily webhook signature
  // Must be called with the raw request body (Buffer)
  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string): boolean {
    try {
      const computedSig = crypto
        .createHmac('sha256', this.apiKey)
        .update(rawBody)
        .digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(computedSig, 'hex'),
        Buffer.from(signatureHeader, 'hex')
      );
    } catch {
      return false;
    }
  }

  // Get account balance
  async getBalance(): Promise<{ currency: string; ready_for_transfer: number; on_hold: number }> {
    const { data } = await this.client.get('/balance');
    return data as { currency: string; ready_for_transfer: number; on_hold: number };
  }
}

// ── Singleton factory ────────────────────────────────────────────

let _chargilyInstance: ChargilyService | null = null;

export function getChargilyService(): ChargilyService {
  if (!_chargilyInstance) {
    const apiKey = process.env.CHARGILY_API_KEY;
    const mode = (process.env.CHARGILY_MODE ?? 'test') as ChargilyMode;
    if (!apiKey) {
      throw new Error('CHARGILY_API_KEY environment variable is not set');
    }
    _chargilyInstance = new ChargilyService({ apiKey, mode });
  }
  return _chargilyInstance;
}
