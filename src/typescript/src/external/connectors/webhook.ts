/**
 * ENOQ Webhook Connector (P6)
 *
 * Generic webhook ingress.
 * POST payload → runtime → output
 *
 * Supports all three runtimes: mail, relation, decision.
 * Idempotency via idempotency_key.
 */

import { randomUUID } from 'crypto';
import {
  mail,
  relation,
  decision,
  MailInput,
  RelationInput,
  DecisionInput,
  MailResult,
  RelationResult,
  DecisionResult,
} from '../../surfaces/sdk';
import {
  Connector,
  ConnectorRequest,
  ConnectorResponse,
  ConnectorRuntime,
  WebhookPayload,
  WebhookResponse,
} from './types';

// ============================================
// IDEMPOTENCY CACHE (in-memory, simple)
// ============================================

interface CachedResponse {
  response: ConnectorResponse;
  timestamp: number;
}

const idempotencyCache = new Map<string, CachedResponse>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedResponse(key: string): ConnectorResponse | null {
  const cached = idempotencyCache.get(key);
  if (!cached) return null;

  // Check TTL
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    idempotencyCache.delete(key);
    return null;
  }

  return cached.response;
}

function setCachedResponse(key: string, response: ConnectorResponse): void {
  // Clean old entries periodically
  if (idempotencyCache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of idempotencyCache.entries()) {
      if (now - v.timestamp > CACHE_TTL_MS) {
        idempotencyCache.delete(k);
      }
    }
  }

  idempotencyCache.set(key, { response, timestamp: Date.now() });
}

// ============================================
// WEBHOOK CONNECTOR
// ============================================

export class WebhookConnector implements Connector {
  readonly name = 'webhook';

  /**
   * Process webhook request.
   */
  async process(request: ConnectorRequest): Promise<ConnectorResponse> {
    const startMs = Date.now();

    try {
      // Route to appropriate runtime
      let result: MailResult | RelationResult | DecisionResult;

      switch (request.runtime) {
        case 'mail':
          result = await mail(request.payload as unknown as MailInput);
          break;
        case 'relation':
          result = await relation(request.payload as unknown as RelationInput);
          break;
        case 'decision':
          result = await decision(request.payload as unknown as DecisionInput);
          break;
        default:
          return this.errorResponse(
            request,
            'INVALID_RUNTIME',
            `Unknown runtime: ${request.runtime}`,
            startMs
          );
      }

      return {
        request_id: request.request_id,
        success: true,
        runtime: request.runtime,
        result,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startMs,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return this.errorResponse(request, 'PROCESSING_ERROR', message, startMs);
    }
  }

  isHealthy(): boolean {
    return true; // Stateless connector
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
// WEBHOOK HANDLER
// ============================================

/**
 * Process webhook payload with idempotency support.
 */
export async function processWebhook(payload: WebhookPayload): Promise<WebhookResponse> {
  const startMs = Date.now();
  const requestId = randomUUID();

  // Check idempotency cache
  if (payload.idempotency_key) {
    const cached = getCachedResponse(payload.idempotency_key);
    if (cached) {
      return toWebhookResponse(cached, payload.idempotency_key);
    }
  }

  // Validate runtime
  const validRuntimes: ConnectorRuntime[] = ['mail', 'relation', 'decision'];
  if (!validRuntimes.includes(payload.runtime)) {
    return {
      idempotency_key: payload.idempotency_key,
      success: false,
      error: {
        code: 'INVALID_RUNTIME',
        message: `Runtime must be one of: ${validRuntimes.join(', ')}`,
      },
      meta: {
        request_id: requestId,
        runtime: payload.runtime,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startMs,
      },
    };
  }

  // Validate input
  if (!payload.input || typeof payload.input !== 'object') {
    return {
      idempotency_key: payload.idempotency_key,
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Input must be a non-null object',
      },
      meta: {
        request_id: requestId,
        runtime: payload.runtime,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startMs,
      },
    };
  }

  // Create connector request
  const request: ConnectorRequest = {
    request_id: requestId,
    runtime: payload.runtime,
    payload: payload.input,
    timestamp: new Date().toISOString(),
  };

  // Process
  const connector = new WebhookConnector();
  const response = await connector.process(request);

  // Cache if idempotency key provided
  if (payload.idempotency_key) {
    setCachedResponse(payload.idempotency_key, response);
  }

  return toWebhookResponse(response, payload.idempotency_key);
}

/**
 * Convert connector response to webhook response format.
 */
function toWebhookResponse(response: ConnectorResponse, idempotencyKey?: string): WebhookResponse {
  if (response.success) {
    return {
      idempotency_key: idempotencyKey,
      success: true,
      data: response.result,
      meta: {
        request_id: response.request_id,
        runtime: response.runtime,
        timestamp: response.timestamp,
        duration_ms: response.duration_ms,
      },
    };
  }

  return {
    idempotency_key: idempotencyKey,
    success: false,
    error: {
      code: 'PROCESSING_ERROR',
      message: response.error || 'Unknown error',
    },
    meta: {
      request_id: response.request_id,
      runtime: response.runtime,
      timestamp: response.timestamp,
      duration_ms: response.duration_ms,
    },
  };
}

// ============================================
// CACHE MANAGEMENT (for testing)
// ============================================

export function clearIdempotencyCache(): void {
  idempotencyCache.clear();
}

export function getIdempotencyCacheSize(): number {
  return idempotencyCache.size;
}
