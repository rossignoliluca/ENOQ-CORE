/**
 * CORE ORCHESTRATOR - Canonical Entry Point
 *
 * Slice 2 of wiring migration: uses core/modules for boundary + verification.
 *
 * STATES (per README):
 * PERMIT → SENSE → CLARIFY → PLAN → ACT → VERIFY → STOP
 *
 * CURRENT: Core boundary + verification, runtime for middle processing
 * FUTURE: Will orchestrate all core/modules directly
 */

import {
  enoq as runtimeEnoq,
  createSession as runtimeCreateSession,
  Session,
  PipelineResult,
  PipelineConfig,
} from '../../runtime/pipeline/pipeline';

import {
  permit,
  BoundaryDecision,
} from '../modules/boundary';

import {
  verifyOutput,
  VerificationDecision,
} from '../modules/verification';

import {
  emitPipelineStart,
  emitPipelineEnd,
  emitStateTransition,
  emitBoundaryBlocked,
  emitVerifyFailed,
} from '../signals/observability';

// ============================================
// SIGNALS (stubs for now)
// ============================================

export type PipelineState =
  | 'PERMIT'
  | 'SENSE'
  | 'CLARIFY'
  | 'PLAN'
  | 'ACT'
  | 'VERIFY'
  | 'STOP';

export interface PipelineSignal {
  state: PipelineState;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface SignalEmitter {
  emit(signal: PipelineSignal): void;
  getHistory(): PipelineSignal[];
}

/**
 * Default no-op signal emitter (stub)
 * Will be replaced with real event system in Slice 2+
 */
function createSignalEmitter(): SignalEmitter {
  const history: PipelineSignal[] = [];
  return {
    emit(signal: PipelineSignal) {
      history.push(signal);
      if (process.env.ENOQ_DEBUG) {
        console.log(`[SIGNAL] ${signal.state} @ ${signal.timestamp}`);
      }
    },
    getHistory() {
      return [...history];
    },
  };
}

// ============================================
// CORE ENTRY POINT
// ============================================

export interface CoreConfig extends Partial<PipelineConfig> {
  /** Enable signal emission (default: true) */
  signals_enabled?: boolean;
  /** Enable core boundary classification (default: true) */
  boundary_enabled?: boolean;
  /** Enable core verification (default: true) */
  verification_enabled?: boolean;
}

export interface CoreResult extends PipelineResult {
  /** Signal history for this invocation */
  signals: PipelineSignal[];
  /** Boundary classification decision (Slice 2) */
  boundary?: BoundaryDecision;
  /** Verification decision (Slice 2) */
  verification?: VerificationDecision;
}

/**
 * enoqCore - Canonical entry point for ENOQ processing
 *
 * Slice 2: Uses core/modules for boundary classification.
 * Delegates middle processing to runtime/enoq().
 * Verification runs post-runtime if field/selection available.
 *
 * @param message - User input
 * @param session - Session context (use createCoreSession())
 * @param config - Pipeline configuration
 * @returns CoreResult with response, trace, signals, and boundary decision
 */
export async function enoqCore(
  message: string,
  session: Session,
  config: CoreConfig = {}
): Promise<CoreResult> {
  const startTime = Date.now();
  const emitter = createSignalEmitter();
  const signalsEnabled = config.signals_enabled !== false;
  const boundaryEnabled = config.boundary_enabled !== false;
  const verificationEnabled = config.verification_enabled !== false;
  const statesTraversed: PipelineState[] = [];
  let lastStateTime = startTime;

  // Context for observability events
  const eventContext = {
    session_id: session.session_id,
    turn_number: session.turns.length,
  };

  // Start pipeline observability
  const correlationId = emitPipelineStart(
    message.length,
    undefined, // Language detected later
    eventContext
  );

  // ========================================
  // PERMIT - Core boundary classification
  // ========================================
  let boundaryDecision: BoundaryDecision | undefined;

  if (boundaryEnabled) {
    boundaryDecision = permit(message, {
      session_id: session.session_id,
      turn_number: session.turns.length,
    });

    // Emit BOUNDARY_BLOCKED if not permitted (future: adversarial patterns)
    // Currently all inputs are permitted; boundary determines *how* not *if*
    if (!boundaryDecision.permitted) {
      emitBoundaryBlocked(
        boundaryDecision.classification.signal,
        'Boundary check blocked input',
        boundaryDecision.classification.confidence,
        message,
        { ...eventContext, correlation_id: correlationId }
      );
    }
  }

  if (signalsEnabled) {
    const now = Date.now();
    emitStateTransition('START', 'PERMIT', now - lastStateTime, { ...eventContext, correlation_id: correlationId });
    lastStateTime = now;
    statesTraversed.push('PERMIT');
    emitter.emit({
      state: 'PERMIT',
      timestamp: now,
      metadata: boundaryDecision ? {
        signal: boundaryDecision.classification.signal,
        confidence: boundaryDecision.classification.confidence,
      } : undefined,
    });
  }

  // ========================================
  // SENSE through ACT - Delegate to runtime
  // ========================================
  if (signalsEnabled) {
    const now = Date.now();
    emitStateTransition('PERMIT', 'SENSE', now - lastStateTime, { ...eventContext, correlation_id: correlationId });
    lastStateTime = now;
    statesTraversed.push('SENSE');
    emitter.emit({ state: 'SENSE', timestamp: now });
  }

  // Merge with defaults for runtime compatibility
  const runtimeConfig: PipelineConfig = {
    gate_enabled: config.gate_enabled ?? true,
    ...config,
  };

  const result = await runtimeEnoq(message, session, runtimeConfig);

  // Track ACT state
  if (signalsEnabled) {
    const now = Date.now();
    emitStateTransition('SENSE', 'ACT', now - lastStateTime, { ...eventContext, correlation_id: correlationId });
    lastStateTime = now;
    statesTraversed.push('ACT');
  }

  // ========================================
  // VERIFY - Core verification (if data available)
  // ========================================
  let verificationDecision: VerificationDecision | undefined;

  if (verificationEnabled && result.trace?.s3_selection && result.trace?.s1_field) {
    if (signalsEnabled) {
      const now = Date.now();
      emitStateTransition('ACT', 'VERIFY', now - lastStateTime, { ...eventContext, correlation_id: correlationId });
      lastStateTime = now;
      statesTraversed.push('VERIFY');
      emitter.emit({ state: 'VERIFY', timestamp: now });
    }

    // Extract language from field (LanguageDetectionResult is the language itself)
    const fieldLang = result.trace.s1_field.language;
    const detectedLang = (fieldLang === 'mixed' || fieldLang === 'unknown' || !fieldLang) ? 'en' : fieldLang;

    verificationDecision = verifyOutput(
      {
        text: result.output,
        field: result.trace.s1_field,
        selection: result.trace.s3_selection,
        language: detectedLang,
      },
      {
        session_id: session.session_id,
        turn_number: session.turns.length,
        previous_hash: 'genesis',
      }
    );

    // Emit VERIFY_FAILED if violations found
    if (!verificationDecision.passed && verificationDecision.result.violations.length > 0) {
      emitVerifyFailed(
        verificationDecision.result.violations.map((v) => ({
          invariant: v.check,
          category: v.category,
          matched_text: v.pattern,
        })),
        verificationDecision.result.fallback_required ? 'FALLBACK' : 'STOP',
        result.output,
        { ...eventContext, correlation_id: correlationId }
      );
    }
  }

  // ========================================
  // STOP - Always reached
  // ========================================
  const endTime = Date.now();
  if (signalsEnabled) {
    emitStateTransition(statesTraversed[statesTraversed.length - 1] || 'START', 'STOP', endTime - lastStateTime, { ...eventContext, correlation_id: correlationId });
    statesTraversed.push('STOP');
    emitter.emit({ state: 'STOP', timestamp: endTime });
  }

  // End pipeline observability
  const success = !verificationDecision || verificationDecision.passed;
  emitPipelineEnd(
    success,
    result.output.length,
    endTime - startTime,
    statesTraversed,
    { ...eventContext, correlation_id: correlationId }
  );

  return {
    ...result,
    signals: emitter.getHistory(),
    boundary: boundaryDecision,
    verification: verificationDecision,
  };
}

/**
 * createCoreSession - Create session for core pipeline
 *
 * Wrapper over runtime createSession for API consistency.
 */
export function createCoreSession(userId?: string): Session {
  return runtimeCreateSession(userId);
}

// ============================================
// RE-EXPORTS for convenience
// ============================================

export type { Session, PipelineResult, PipelineConfig };

// FAST PATH exports: surfaces can use these for task execution
// while respecting geometry (permit → act → verify → stop)
export { permit, BoundaryDecision };
export { verifyOutput, VerificationDecision };
