/**
 * ENOQ Email Connector (P6)
 *
 * Simple email ingress/egress.
 * Ingest: receive email payload (webhook)
 * Process: call SDK mail()
 * Egress: return draft options
 *
 * No SMTP. No Gmail API integration. Just the bridge logic.
 * Actual email transport is external responsibility.
 */

import { randomUUID } from 'crypto';
import { mail, MailInput } from '../../surfaces/sdk';
import {
  Connector,
  ConnectorRequest,
  ConnectorResponse,
  EmailIngestPayload,
  EmailEgressPayload,
} from './types';

// ============================================
// CONFIGURATION
// ============================================

export interface EmailConnectorConfig {
  /** Default language if not specified */
  defaultLanguage: string;
  /** Max body length to process */
  maxBodyLength: number;
}

const DEFAULT_CONFIG: EmailConnectorConfig = {
  defaultLanguage: process.env.ENOQ_EMAIL_DEFAULT_LANG || 'en',
  maxBodyLength: parseInt(process.env.ENOQ_EMAIL_MAX_BODY || '10000', 10),
};

// ============================================
// EMAIL CONNECTOR
// ============================================

export class EmailConnector implements Connector {
  readonly name = 'email';
  private config: EmailConnectorConfig;

  constructor(config: Partial<EmailConnectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Process email ingest payload and return drafts.
   */
  async process(request: ConnectorRequest): Promise<ConnectorResponse> {
    const startMs = Date.now();

    try {
      // Validate runtime
      if (request.runtime !== 'mail') {
        return this.errorResponse(request, 'INVALID_RUNTIME', 'Email connector only supports mail runtime', startMs);
      }

      // Parse payload
      const payload = request.payload as unknown as EmailIngestPayload;

      // Validate required fields
      if (!payload.from || !payload.subject || !payload.body) {
        return this.errorResponse(request, 'INVALID_PAYLOAD', 'Missing required fields: from, subject, body', startMs);
      }

      // Truncate body if too long
      const body = payload.body.length > this.config.maxBodyLength
        ? payload.body.slice(0, this.config.maxBodyLength) + '...'
        : payload.body;

      // Build SDK input
      const mailInput: MailInput = {
        recipient: payload.to || 'recipient',
        context: payload.subject,
        intent: body,
        constraints: payload.constraints,
        language: (payload.language || this.config.defaultLanguage) as MailInput['language'],
      };

      // Call SDK
      const result = await mail(mailInput);

      return {
        request_id: request.request_id,
        success: true,
        runtime: 'mail',
        result,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startMs,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return this.errorResponse(request, 'PROCESSING_ERROR', message, startMs);
    }
  }

  /**
   * Transform connector response to email egress payload.
   */
  toEgressPayload(response: ConnectorResponse, originalFrom: string): EmailEgressPayload | null {
    if (!response.success || !response.result) {
      return null;
    }

    const mailResult = response.result as import('../../surfaces/sdk').MailResult;

    return {
      request_id: response.request_id,
      original_from: originalFrom,
      drafts: mailResult.output.drafts.map(d => ({
        id: d.id,
        subject: d.subject,
        body: d.body,
      })),
      rationale: mailResult.rationale,
      timestamp: response.timestamp,
    };
  }

  isHealthy(): boolean {
    return true; // Stateless connector, always healthy
  }

  private errorResponse(
    request: ConnectorRequest,
    code: string,
    message: string,
    startMs: number
  ): ConnectorResponse {
    return {
      request_id: request.request_id,
      success: false,
      runtime: request.runtime,
      error: `${code}: ${message}`,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startMs,
    };
  }
}

// ============================================
// FACTORY
// ============================================

/**
 * Create an email ingest request from raw payload.
 */
export function createEmailRequest(
  payload: EmailIngestPayload,
  requestId?: string
): ConnectorRequest {
  return {
    request_id: requestId || randomUUID(),
    runtime: 'mail',
    payload: payload as unknown as Record<string, unknown>,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Process email in one call.
 */
export async function processEmail(
  payload: EmailIngestPayload,
  config?: Partial<EmailConnectorConfig>
): Promise<ConnectorResponse> {
  const connector = new EmailConnector(config);
  const request = createEmailRequest(payload);
  return connector.process(request);
}
