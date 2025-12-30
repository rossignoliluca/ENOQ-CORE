/**
 * ENOQ API - Types (P4)
 *
 * Request/response schemas for API endpoints.
 */

import {
  MailInput,
  MailOutput,
  RelationInput,
  RelationOutput,
  DecisionInput,
  DecisionOutput,
  PipelineSignal,
  ComplianceFlags,
} from '../sdk';

// ============================================
// COMMON TYPES
// ============================================

export interface APIError {
  error: string;
  code: string;
  request_id: string;
}

export interface APIMetadata {
  request_id: string;
  timestamp: string;
  duration_ms: number;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface APIResponse<T> {
  output: T;
  rationale: string;
  signals: PipelineSignal[];
  stop: true;
  compliance: ComplianceFlags;
  meta: APIMetadata;
}

export type MailResponse = APIResponse<MailOutput>;
export type RelationResponse = APIResponse<RelationOutput>;
export type DecisionResponse = APIResponse<DecisionOutput>;

// ============================================
// REQUEST SCHEMAS (for Fastify validation)
// ============================================

export const MailRequestSchema = {
  type: 'object',
  required: ['recipient', 'context', 'intent'],
  properties: {
    recipient: { type: 'string', minLength: 1 },
    context: { type: 'string', minLength: 1 },
    intent: { type: 'string', minLength: 1 },
    constraints: { type: 'array', items: { type: 'string' } },
    language: { type: 'string', enum: ['en', 'it', 'es', 'fr', 'de'] },
  },
} as const;

export const RelationRequestSchema = {
  type: 'object',
  required: ['personA', 'personB', 'context', 'tension', 'boundary'],
  properties: {
    personA: { type: 'string', minLength: 1 },
    personB: { type: 'string', minLength: 1 },
    context: { type: 'string', minLength: 1 },
    tension: { type: 'string', minLength: 1 },
    boundary: { type: 'string', minLength: 1 },
    language: { type: 'string', enum: ['en', 'it', 'es', 'fr', 'de'] },
  },
} as const;

export const DecisionRequestSchema = {
  type: 'object',
  required: ['statement', 'context'],
  properties: {
    statement: { type: 'string', minLength: 1 },
    context: { type: 'string', minLength: 1 },
    constraints: { type: 'array', items: { type: 'string' } },
    timeHorizon: { type: 'string' },
    riskTolerance: { type: 'string' },
    language: { type: 'string', enum: ['en', 'it', 'es', 'fr', 'de'] },
  },
} as const;

// ============================================
// HEALTH/VERSION TYPES
// ============================================

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime_ms: number;
}

export interface VersionResponse {
  version: string;
  core_version: string;
  api_version: string;
}
