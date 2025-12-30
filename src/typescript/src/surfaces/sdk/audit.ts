/**
 * ENOQ SDK - Audit Helper (P5)
 *
 * Writes audit events to storage. Fire-and-forget.
 * Never blocks SDK operations. Never throws to caller.
 */

import { randomUUID } from 'crypto';
import {
  getStorage,
  AuditRuntime,
  AuditOutcome,
  AuditEventType,
} from '../../external/storage';

// ============================================
// CONFIGURATION
// ============================================

let auditEnabled = true;

/**
 * Enable or disable audit writes.
 * Default: enabled.
 */
export function setAuditEnabled(enabled: boolean): void {
  auditEnabled = enabled;
}

/**
 * Check if audit is enabled.
 */
export function isAuditEnabled(): boolean {
  return auditEnabled;
}

// ============================================
// AUDIT WRITER
// ============================================

export interface AuditContext {
  session_id?: string;
  request_id: string;
  runtime: AuditRuntime;
}

/**
 * Create an audit context for a request.
 */
export function createAuditContext(
  runtime: AuditRuntime,
  sessionId?: string,
  requestId?: string
): AuditContext {
  return {
    session_id: sessionId,
    request_id: requestId ?? randomUUID(),
    runtime,
  };
}

/**
 * Write an audit event. Fire-and-forget. Never throws.
 */
export async function writeAuditEvent(
  ctx: AuditContext,
  eventType: AuditEventType,
  outcome: AuditOutcome,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!auditEnabled) return;

  try {
    const storage = await getStorage();

    // Upsert session if provided
    if (ctx.session_id) {
      await storage.upsertSession(ctx.session_id);
    }

    // Write event
    await storage.writeEvent({
      session_id: ctx.session_id ?? null,
      request_id: ctx.request_id,
      runtime: ctx.runtime,
      event_type: eventType,
      outcome,
      metadata,
      timestamp: Date.now(),
    });
  } catch (err) {
    // Never throw to caller - audit is non-blocking
    if (process.env.ENOQ_DEBUG) {
      console.error('[AUDIT] Write failed:', err);
    }
  }
}

/**
 * Write PIPELINE_START event.
 */
export async function auditPipelineStart(
  ctx: AuditContext,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await writeAuditEvent(ctx, 'PIPELINE_START', 'PASS', metadata);
}

/**
 * Write PIPELINE_END event with outcome.
 */
export async function auditPipelineEnd(
  ctx: AuditContext,
  outcome: AuditOutcome,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await writeAuditEvent(ctx, 'PIPELINE_END', outcome, metadata);
}

/**
 * Write BOUNDARY_BLOCKED event.
 */
export async function auditBoundaryBlocked(
  ctx: AuditContext,
  reason: string
): Promise<void> {
  await writeAuditEvent(ctx, 'BOUNDARY_BLOCKED', 'BLOCKED', { reason });
}

/**
 * Write VERIFY_FAILED event.
 */
export async function auditVerifyFailed(
  ctx: AuditContext,
  violationCount: number
): Promise<void> {
  await writeAuditEvent(ctx, 'VERIFY_FAILED', 'BLOCKED', { violation_count: violationCount });
}

/**
 * Write RUBICON_WITHDRAW event.
 */
export async function auditRubiconWithdraw(
  ctx: AuditContext,
  domain: string
): Promise<void> {
  await writeAuditEvent(ctx, 'RUBICON_WITHDRAW', 'WITHDRAW', { domain });
}
