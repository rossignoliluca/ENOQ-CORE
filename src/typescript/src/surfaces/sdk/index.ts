/**
 * ENOQ SDK - Public API
 *
 * Thin wrapper over enoqCore. Three traversals:
 * - mail: Draft difficult emails (2-3 options)
 * - relation: Map human relationships
 * - decision: Clarify decisions
 *
 * No recommendations. No rankings. STOP after output.
 *
 * Usage:
 *   import { mail, relation, decision } from '@enoq/sdk';
 *
 *   const result = await mail({
 *     recipient: 'Manager',
 *     context: 'Requesting time off',
 *     intent: 'Get approval for vacation'
 *   });
 *
 *   console.log(result.output.drafts);
 *   console.log(result.signals); // ['PERMIT', 'ACT', 'VERIFY', 'STOP']
 *   console.log(result.stop); // true (always)
 */

// Client functions
export { mail, relation, decision } from './client';

// Audit helpers (for testing/admin)
export {
  setAuditEnabled,
  isAuditEnabled,
  createAuditContext,
} from './audit';

// Types
export type {
  // Common
  Language,
  PipelineSignal,
  ComplianceFlags,
  AxisEvent,
  SDKOptions,
  SDKResult,
  // Mail
  MailInput,
  MailOutput,
  MailDraft,
  MailResult,
  // Relation
  RelationInput,
  RelationOutput,
  RelationResult,
  // Decision
  DecisionInput,
  DecisionOutput,
  DecisionOption,
  DecisionResult,
} from './types';
