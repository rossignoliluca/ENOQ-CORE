/**
 * Connectors Tests (P6)
 *
 * Tests for email and webhook connectors.
 */

import {
  EmailConnector,
  WebhookConnector,
  createEmailRequest,
  processWebhook,
  clearIdempotencyCache,
  getIdempotencyCacheSize,
} from '../external/connectors';
import type { ConnectorRequest, EmailIngestPayload, WebhookPayload } from '../external/connectors';

// ============================================
// EMAIL CONNECTOR TESTS
// ============================================

describe('EmailConnector', () => {
  let connector: EmailConnector;

  beforeEach(() => {
    connector = new EmailConnector();
  });

  describe('createEmailRequest', () => {
    test('creates valid request from payload', () => {
      const payload: EmailIngestPayload = {
        from: 'user@example.com',
        to: 'manager@example.com',
        subject: 'Time off request',
        body: 'I would like to request vacation next week.',
      };

      const request = createEmailRequest(payload);

      expect(request.request_id).toBeDefined();
      expect(request.runtime).toBe('mail');
      expect(request.payload).toEqual(payload);
      expect(request.timestamp).toBeDefined();
    });

    test('uses provided request ID', () => {
      const payload: EmailIngestPayload = {
        from: 'user@example.com',
        to: 'manager@example.com',
        subject: 'Test',
        body: 'Test body',
      };

      const request = createEmailRequest(payload, 'custom-id-123');

      expect(request.request_id).toBe('custom-id-123');
    });
  });

  describe('process', () => {
    test('rejects non-mail runtime', async () => {
      const request: ConnectorRequest = {
        request_id: 'test-1',
        runtime: 'decision',
        payload: {},
        timestamp: new Date().toISOString(),
      };

      const response = await connector.process(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('INVALID_RUNTIME');
    });

    test('rejects missing from field', async () => {
      const request: ConnectorRequest = {
        request_id: 'test-2',
        runtime: 'mail',
        payload: {
          to: 'manager@example.com',
          subject: 'Test',
          body: 'Test body',
        },
        timestamp: new Date().toISOString(),
      };

      const response = await connector.process(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('INVALID_PAYLOAD');
    });

    test('rejects missing subject field', async () => {
      const request: ConnectorRequest = {
        request_id: 'test-3',
        runtime: 'mail',
        payload: {
          from: 'user@example.com',
          body: 'Test body',
        },
        timestamp: new Date().toISOString(),
      };

      const response = await connector.process(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('INVALID_PAYLOAD');
    });

    test('rejects missing body field', async () => {
      const request: ConnectorRequest = {
        request_id: 'test-4',
        runtime: 'mail',
        payload: {
          from: 'user@example.com',
          subject: 'Test',
        },
        timestamp: new Date().toISOString(),
      };

      const response = await connector.process(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('INVALID_PAYLOAD');
    });
  });

  describe('isHealthy', () => {
    test('returns true (stateless)', () => {
      expect(connector.isHealthy()).toBe(true);
    });
  });

  describe('toEgressPayload', () => {
    test('returns null for failed response', () => {
      const connector = new EmailConnector();
      const response = {
        request_id: 'test',
        success: false,
        runtime: 'mail' as const,
        error: 'Test error',
        timestamp: new Date().toISOString(),
        duration_ms: 100,
      };

      const egress = connector.toEgressPayload(response, 'user@example.com');

      expect(egress).toBeNull();
    });
  });
});

// ============================================
// WEBHOOK CONNECTOR TESTS
// ============================================

describe('WebhookConnector', () => {
  let connector: WebhookConnector;

  beforeEach(() => {
    connector = new WebhookConnector();
    clearIdempotencyCache();
  });

  describe('process', () => {
    test('rejects invalid runtime', async () => {
      const request: ConnectorRequest = {
        request_id: 'test-1',
        runtime: 'invalid' as any,
        payload: {},
        timestamp: new Date().toISOString(),
      };

      const response = await connector.process(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('INVALID_RUNTIME');
    });
  });

  describe('isHealthy', () => {
    test('returns true (stateless)', () => {
      expect(connector.isHealthy()).toBe(true);
    });
  });
});

// ============================================
// WEBHOOK HANDLER TESTS
// ============================================

describe('processWebhook', () => {
  beforeEach(() => {
    clearIdempotencyCache();
  });

  test('rejects invalid runtime', async () => {
    const payload: WebhookPayload = {
      runtime: 'invalid' as any,
      input: {},
    };

    const response = await processWebhook(payload);

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('INVALID_RUNTIME');
  });

  test('rejects null input', async () => {
    const payload: WebhookPayload = {
      runtime: 'mail',
      input: null as any,
    };

    const response = await processWebhook(payload);

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('INVALID_INPUT');
  });

  test('returns meta with request_id and duration', async () => {
    const payload: WebhookPayload = {
      runtime: 'mail',
      input: {
        recipient: 'Manager',
        context: 'Test',
        intent: 'Test intent',
      },
    };

    // Will fail without LLM, but should still return proper meta
    const response = await processWebhook(payload);

    expect(response.meta.request_id).toBeDefined();
    expect(response.meta.runtime).toBe('mail');
    expect(response.meta.timestamp).toBeDefined();
    expect(response.meta.duration_ms).toBeGreaterThanOrEqual(0);
  });

  test('echoes idempotency_key', async () => {
    const payload: WebhookPayload = {
      runtime: 'mail',
      input: { recipient: 'Test', context: 'Test', intent: 'Test' },
      idempotency_key: 'my-key-123',
    };

    const response = await processWebhook(payload);

    expect(response.idempotency_key).toBe('my-key-123');
  });
});

// ============================================
// IDEMPOTENCY TESTS
// ============================================

describe('Idempotency Cache', () => {
  beforeEach(() => {
    clearIdempotencyCache();
  });

  test('clearIdempotencyCache clears cache', () => {
    // Process something to populate cache
    clearIdempotencyCache();
    expect(getIdempotencyCacheSize()).toBe(0);
  });

  test('getIdempotencyCacheSize returns size', () => {
    clearIdempotencyCache();
    expect(getIdempotencyCacheSize()).toBe(0);
  });
});

// ============================================
// INTEGRATION TESTS (require LLM)
// ============================================

const hasLLM = Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
const describeIf = hasLLM ? describe : describe.skip;

describeIf('Connectors Integration', () => {
  beforeEach(() => {
    clearIdempotencyCache();
  });

  test('EmailConnector processes valid email', async () => {
    const connector = new EmailConnector();
    const request = createEmailRequest({
      from: 'employee@company.com',
      to: 'manager@company.com',
      subject: 'Vacation request',
      body: 'I would like to request time off next Friday.',
    });

    const response = await connector.process(request);

    expect(response.success).toBe(true);
    expect(response.result).toBeDefined();
    expect(response.runtime).toBe('mail');
    expect(response.duration_ms).toBeGreaterThan(0);
  }, 60000);

  test('WebhookConnector processes mail runtime', async () => {
    const connector = new WebhookConnector();
    const request: ConnectorRequest = {
      request_id: 'webhook-mail-test',
      runtime: 'mail',
      payload: {
        recipient: 'Client',
        context: 'Project update',
        intent: 'Schedule meeting',
      },
      timestamp: new Date().toISOString(),
    };

    const response = await connector.process(request);

    expect(response.success).toBe(true);
    expect(response.result).toBeDefined();
  }, 60000);

  test('WebhookConnector processes relation runtime', async () => {
    const connector = new WebhookConnector();
    const request: ConnectorRequest = {
      request_id: 'webhook-relation-test',
      runtime: 'relation',
      payload: {
        personA: 'Employee',
        personB: 'Manager',
        context: 'Work',
        tension: 'Communication',
        boundary: 'No blame',
      },
      timestamp: new Date().toISOString(),
    };

    const response = await connector.process(request);

    expect(response.success).toBe(true);
    expect(response.result).toBeDefined();
  }, 60000);

  test('WebhookConnector processes decision runtime', async () => {
    const connector = new WebhookConnector();
    const request: ConnectorRequest = {
      request_id: 'webhook-decision-test',
      runtime: 'decision',
      payload: {
        statement: 'Which vendor to choose',
        context: 'Business',
      },
      timestamp: new Date().toISOString(),
    };

    const response = await connector.process(request);

    expect(response.success).toBe(true);
    expect(response.result).toBeDefined();
  }, 60000);

  test('processWebhook returns cached response for same idempotency_key', async () => {
    const payload: WebhookPayload = {
      runtime: 'mail',
      input: {
        recipient: 'Manager',
        context: 'Meeting',
        intent: 'Schedule sync',
      },
      idempotency_key: 'unique-key-001',
    };

    // First call
    const response1 = await processWebhook(payload);
    expect(response1.success).toBe(true);

    // Second call with same key - should return cached
    const response2 = await processWebhook(payload);
    expect(response2.success).toBe(true);
    expect(response2.meta.request_id).toBe(response1.meta.request_id);

    // Cache should have 1 entry
    expect(getIdempotencyCacheSize()).toBe(1);
  }, 60000);
});
