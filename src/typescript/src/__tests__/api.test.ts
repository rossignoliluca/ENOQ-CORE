/**
 * API Tests (P4.4)
 *
 * Tests for the Fastify HTTP API.
 */

import { createServer } from '../surfaces/api';
import { FastifyInstance } from 'fastify';

describe('ENOQ API', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createServer({ port: 0 }); // Random port for testing
  });

  afterAll(async () => {
    await server.close();
  });

  // ============================================
  // HEALTH ENDPOINT
  // ============================================

  describe('GET /health', () => {
    test('returns ok status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
      expect(body.uptime_ms).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================
  // VERSION ENDPOINT
  // ============================================

  describe('GET /version', () => {
    test('returns version info', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/version',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.version).toBeDefined();
      expect(body.core_version).toBeDefined();
      expect(body.api_version).toBeDefined();
    });
  });

  // ============================================
  // REQUEST ID HEADERS
  // ============================================

  describe('Request ID', () => {
    test('health endpoint returns x-request-id header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-trace-id']).toBeDefined();
    });

    test('uses provided x-request-id', async () => {
      const customId = 'custom-request-id-123';
      const response = await server.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-request-id': customId,
        },
      });

      expect(response.headers['x-request-id']).toBe(customId);
    });
  });

  // ============================================
  // VALIDATION TESTS
  // ============================================

  describe('POST /mail validation', () => {
    test('rejects empty body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/mail',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    test('rejects missing required fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/mail',
        payload: {
          recipient: 'Test',
          // missing context and intent
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('accepts valid mail input', async () => {
      // This will fail without LLM, but should pass validation
      const response = await server.inject({
        method: 'POST',
        url: '/mail',
        payload: {
          recipient: 'Manager',
          context: 'Work',
          intent: 'Request time off',
        },
      });

      // Either 200 (if LLM available) or 500 (if no LLM)
      // But NOT 400 (validation passed)
      expect(response.statusCode).not.toBe(400);
    });
  });

  describe('POST /relation validation', () => {
    test('rejects empty body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/relation',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    test('rejects missing required fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/relation',
        payload: {
          personA: 'Me',
          personB: 'Partner',
          // missing context, tension, boundary
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('accepts valid relation input', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/relation',
        payload: {
          personA: 'Me',
          personB: 'Partner',
          context: 'Family',
          tension: 'Communication',
          boundary: 'No blame',
        },
      });

      expect(response.statusCode).not.toBe(400);
    });
  });

  describe('POST /decision validation', () => {
    test('rejects empty body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/decision',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    test('rejects missing required fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/decision',
        payload: {
          statement: 'What to do',
          // missing context
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('accepts valid decision input', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/decision',
        payload: {
          statement: 'Whether to change jobs',
          context: 'Career',
        },
      });

      expect(response.statusCode).not.toBe(400);
    });
  });

  // ============================================
  // LANGUAGE VALIDATION
  // ============================================

  describe('Language validation', () => {
    test('accepts valid language codes', async () => {
      for (const lang of ['en', 'it', 'es', 'fr', 'de']) {
        const response = await server.inject({
          method: 'POST',
          url: '/mail',
          payload: {
            recipient: 'Test',
            context: 'Test',
            intent: 'Test',
            language: lang,
          },
        });

        // Should not be a validation error
        expect(response.statusCode).not.toBe(400);
      }
    });

    test('rejects invalid language code', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/mail',
        payload: {
          recipient: 'Test',
          context: 'Test',
          intent: 'Test',
          language: 'invalid',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ============================================
  // ERROR RESPONSE FORMAT
  // ============================================

  describe('Error response format', () => {
    test('validation error includes request_id', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/mail',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.request_id).toBeDefined();
    });
  });
});

// ============================================
// INTEGRATION TESTS (require LLM)
// ============================================

const hasLLM = Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
const describeIf = hasLLM ? describe : describe.skip;

describeIf('ENOQ API Integration', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createServer({ port: 0 });
  });

  afterAll(async () => {
    await server.close();
  });

  test('POST /mail returns SDKResult structure', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/mail',
      payload: {
        recipient: 'Manager',
        context: 'Work',
        intent: 'Request meeting',
      },
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.output).toBeDefined();
    expect(body.output.drafts).toBeDefined();
    expect(body.rationale).toBeDefined();
    expect(body.signals).toContain('STOP');
    expect(body.stop).toBe(true);
    expect(body.compliance).toBeDefined();
    expect(body.meta).toBeDefined();
    expect(body.meta.request_id).toBeDefined();
    expect(body.meta.duration_ms).toBeGreaterThanOrEqual(0);
  }, 60000);

  test('POST /relation returns SDKResult structure', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/relation',
      payload: {
        personA: 'Employee',
        personB: 'Manager',
        context: 'Work',
        tension: 'Workload',
        boundary: 'No personal criticism',
      },
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.output).toBeDefined();
    expect(body.output.roleMap).toBeDefined();
    expect(body.signals).toContain('STOP');
    expect(body.stop).toBe(true);
  }, 60000);

  test('POST /decision returns SDKResult structure', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/decision',
      payload: {
        statement: 'Which vendor to choose',
        context: 'Business',
      },
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.output).toBeDefined();
    expect(body.output.frame).toBeDefined();
    expect(body.signals).toContain('STOP');
    expect(body.stop).toBe(true);
  }, 60000);
});
