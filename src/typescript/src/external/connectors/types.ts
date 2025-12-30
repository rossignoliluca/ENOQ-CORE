/**
 * ENOQ Connectors - Types (P6)
 *
 * Common types for ingress/egress connectors.
 * Connectors don't think. They transport.
 */

import { MailResult, RelationResult, DecisionResult } from '../../surfaces/sdk';

// ============================================
// COMMON TYPES
// ============================================

export type ConnectorRuntime = 'mail' | 'relation' | 'decision';

export interface ConnectorRequest {
  /** Unique request ID (for idempotency) */
  request_id: string;
  /** Runtime to invoke */
  runtime: ConnectorRuntime;
  /** Payload for the runtime */
  payload: Record<string, unknown>;
  /** Optional session ID */
  session_id?: string;
  /** Request timestamp */
  timestamp: string;
}

export interface ConnectorResponse {
  /** Request ID (echoed back) */
  request_id: string;
  /** Success flag */
  success: boolean;
  /** Runtime that was invoked */
  runtime: ConnectorRuntime;
  /** Result from SDK (if success) */
  result?: MailResult | RelationResult | DecisionResult;
  /** Error message (if failure) */
  error?: string;
  /** Response timestamp */
  timestamp: string;
  /** Processing duration (ms) */
  duration_ms: number;
}

// ============================================
// EMAIL CONNECTOR TYPES
// ============================================

export interface EmailIngestPayload {
  /** Sender email */
  from: string;
  /** Recipient context */
  to: string;
  /** Email subject (used as context) */
  subject: string;
  /** Email body (used as intent) */
  body: string;
  /** Optional constraints */
  constraints?: string[];
  /** Language */
  language?: string;
}

export interface EmailEgressPayload {
  /** Request ID */
  request_id: string;
  /** Original sender */
  original_from: string;
  /** Draft options */
  drafts: Array<{
    id: string;
    subject: string;
    body: string;
  }>;
  /** Rationale */
  rationale: string;
  /** Processing timestamp */
  timestamp: string;
}

// ============================================
// WEBHOOK CONNECTOR TYPES
// ============================================

export interface WebhookPayload {
  /** Runtime to invoke */
  runtime: ConnectorRuntime;
  /** Runtime-specific input */
  input: Record<string, unknown>;
  /** Optional idempotency key */
  idempotency_key?: string;
  /** Optional callback URL */
  callback_url?: string;
}

export interface WebhookResponse {
  /** Idempotency key (echoed) */
  idempotency_key?: string;
  /** Success flag */
  success: boolean;
  /** Result data */
  data?: unknown;
  /** Error details */
  error?: {
    code: string;
    message: string;
  };
  /** Metadata */
  meta: {
    request_id: string;
    runtime: ConnectorRuntime;
    timestamp: string;
    duration_ms: number;
  };
}

// ============================================
// CONNECTOR INTERFACE
// ============================================

export interface Connector {
  /** Connector name */
  name: string;
  /** Process incoming request */
  process(request: ConnectorRequest): Promise<ConnectorResponse>;
  /** Check if connector is healthy */
  isHealthy(): boolean;
}
