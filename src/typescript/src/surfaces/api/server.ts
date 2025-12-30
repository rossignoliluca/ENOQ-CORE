/**
 * ENOQ API - Fastify Server (P4)
 *
 * Thin HTTP wrapper over SDK. No logic, just exposure.
 *
 * Endpoints:
 * - POST /mail
 * - POST /relation
 * - POST /decision
 * - GET /health
 * - GET /version
 *
 * Usage:
 *   npm run api        # Start server
 *   npm run api:dev    # Start with watch
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { randomUUID } from 'crypto';

import { mail, relation, decision, MailInput, RelationInput, DecisionInput } from '../sdk';

import {
  MailRequestSchema,
  RelationRequestSchema,
  DecisionRequestSchema,
  MailResponse,
  RelationResponse,
  DecisionResponse,
  HealthResponse,
  VersionResponse,
  APIError,
  APIMetadata,
} from './types';

// ============================================
// CONFIGURATION
// ============================================

export interface ServerConfig {
  port: number;
  host: string;
  rateLimit: {
    max: number;
    timeWindow: string;
  };
}

const DEFAULT_CONFIG: ServerConfig = {
  port: parseInt(process.env.ENOQ_API_PORT || '3000', 10),
  host: process.env.ENOQ_API_HOST || '0.0.0.0',
  rateLimit: {
    max: parseInt(process.env.ENOQ_RATE_LIMIT_MAX || '100', 10),
    timeWindow: process.env.ENOQ_RATE_LIMIT_WINDOW || '1 minute',
  },
};

// ============================================
// SERVER CREATION
// ============================================

const startTime = Date.now();

export async function createServer(config: Partial<ServerConfig> = {}): Promise<FastifyInstance> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const server = Fastify({
    logger: process.env.NODE_ENV !== 'test',
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
  });

  // ========================================
  // RATE LIMITING
  // ========================================
  await server.register(rateLimit, {
    max: cfg.rateLimit.max,
    timeWindow: cfg.rateLimit.timeWindow,
    errorResponseBuilder: (request, context) => ({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      request_id: request.id,
    }),
  });

  // ========================================
  // REQUEST ID HOOK
  // ========================================
  server.addHook('onRequest', async (request, reply) => {
    // Ensure request ID is set
    if (!request.id) {
      request.id = randomUUID();
    }
    // Add trace headers
    reply.header('x-request-id', request.id);
    reply.header('x-trace-id', request.id);
  });

  // ========================================
  // HEALTH ENDPOINT
  // ========================================
  server.get('/health', async (_request, reply): Promise<HealthResponse> => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime_ms: Date.now() - startTime,
    };
  });

  // ========================================
  // VERSION ENDPOINT
  // ========================================
  server.get('/version', async (_request, reply): Promise<VersionResponse> => {
    return {
      version: '7.5.0',
      core_version: '7.5.0',
      api_version: '1.0.0',
    };
  });

  // ========================================
  // MAIL ENDPOINT
  // ========================================
  server.post<{ Body: MailInput }>('/mail', {
    schema: { body: MailRequestSchema },
  }, async (request, reply): Promise<MailResponse | APIError> => {
    const startMs = Date.now();

    try {
      const result = await mail(request.body);

      const meta: APIMetadata = {
        request_id: request.id,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startMs,
      };

      return {
        output: result.output,
        rationale: result.rationale,
        signals: result.signals,
        stop: result.stop,
        compliance: result.compliance,
        meta,
      };
    } catch (error) {
      reply.status(500);
      return {
        error: error instanceof Error ? error.message : 'Internal error',
        code: 'MAIL_ERROR',
        request_id: request.id,
      };
    }
  });

  // ========================================
  // RELATION ENDPOINT
  // ========================================
  server.post<{ Body: RelationInput }>('/relation', {
    schema: { body: RelationRequestSchema },
  }, async (request, reply): Promise<RelationResponse | APIError> => {
    const startMs = Date.now();

    try {
      const result = await relation(request.body);

      const meta: APIMetadata = {
        request_id: request.id,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startMs,
      };

      return {
        output: result.output,
        rationale: result.rationale,
        signals: result.signals,
        stop: result.stop,
        compliance: result.compliance,
        meta,
      };
    } catch (error) {
      reply.status(500);
      return {
        error: error instanceof Error ? error.message : 'Internal error',
        code: 'RELATION_ERROR',
        request_id: request.id,
      };
    }
  });

  // ========================================
  // DECISION ENDPOINT
  // ========================================
  server.post<{ Body: DecisionInput }>('/decision', {
    schema: { body: DecisionRequestSchema },
  }, async (request, reply): Promise<DecisionResponse | APIError> => {
    const startMs = Date.now();

    try {
      const result = await decision(request.body);

      const meta: APIMetadata = {
        request_id: request.id,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startMs,
      };

      return {
        output: result.output,
        rationale: result.rationale,
        signals: result.signals,
        stop: result.stop,
        compliance: result.compliance,
        meta,
      };
    } catch (error) {
      reply.status(500);
      return {
        error: error instanceof Error ? error.message : 'Internal error',
        code: 'DECISION_ERROR',
        request_id: request.id,
      };
    }
  });

  // ========================================
  // ERROR HANDLER
  // ========================================
  server.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.validation) {
      reply.status(400).send({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        request_id: request.id,
        details: error.validation,
      });
      return;
    }

    reply.status(500).send({
      error: error.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
      request_id: request.id,
    });
  });

  return server;
}

// ============================================
// START SERVER
// ============================================

export async function startServer(config: Partial<ServerConfig> = {}): Promise<FastifyInstance> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const server = await createServer(cfg);

  try {
    await server.listen({ port: cfg.port, host: cfg.host });
    console.log(`ENOQ API listening on ${cfg.host}:${cfg.port}`);
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================
// CLI ENTRY POINT
// ============================================

if (require.main === module) {
  startServer();
}
