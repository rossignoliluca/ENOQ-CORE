/**
 * ENOQ Error System
 *
 * Typed errors with error codes for consistent error handling
 * across the entire ENOQ system.
 *
 * Error Code Format: ENOQ_[CATEGORY]_[SPECIFIC]
 *
 * Categories:
 * - API: External API errors (LLM providers, gate service)
 * - CONFIG: Configuration/initialization errors
 * - VALIDATION: Input/output validation errors
 * - PIPELINE: Pipeline execution errors
 * - INVARIANT: Constitutional invariant violations
 */

// ============================================
// ERROR CODES
// ============================================

export const ENOQ_ERROR_CODES = {
  // API Errors (1xx)
  API_KEY_MISSING: 'ENOQ_API_101',
  API_REQUEST_FAILED: 'ENOQ_API_102',
  API_RESPONSE_INVALID: 'ENOQ_API_103',
  API_TIMEOUT: 'ENOQ_API_104',
  API_RATE_LIMITED: 'ENOQ_API_105',

  // Config Errors (2xx)
  CONFIG_INVALID: 'ENOQ_CONFIG_201',
  CONFIG_MISSING: 'ENOQ_CONFIG_202',
  PROVIDER_NOT_INITIALIZED: 'ENOQ_CONFIG_203',

  // Validation Errors (3xx)
  VALIDATION_INPUT: 'ENOQ_VALIDATION_301',
  VALIDATION_OUTPUT: 'ENOQ_VALIDATION_302',
  VALIDATION_SCHEMA: 'ENOQ_VALIDATION_303',
  VALIDATION_LANGUAGE: 'ENOQ_VALIDATION_304',

  // Pipeline Errors (4xx)
  PIPELINE_STATE: 'ENOQ_PIPELINE_401',
  PIPELINE_TIMEOUT: 'ENOQ_PIPELINE_402',
  PIPELINE_EXECUTION: 'ENOQ_PIPELINE_403',

  // Invariant Errors (5xx) - Constitutional violations
  INVARIANT_VIOLATION: 'ENOQ_INVARIANT_501',
  INVARIANT_RUBICON: 'ENOQ_INVARIANT_502',
  INVARIANT_DELEGATION: 'ENOQ_INVARIANT_503',
  INVARIANT_DIAGNOSIS: 'ENOQ_INVARIANT_504',
  INVARIANT_BLINDNESS: 'ENOQ_INVARIANT_505',
} as const;

export type EnoqErrorCode = typeof ENOQ_ERROR_CODES[keyof typeof ENOQ_ERROR_CODES];

// ============================================
// BASE ERROR CLASS
// ============================================

export interface EnoqErrorOptions {
  /** Original error that caused this error */
  cause?: Error;
  /** Additional context for debugging */
  context?: Record<string, unknown>;
  /** Whether this error is recoverable */
  recoverable?: boolean;
}

/**
 * Base error class for all ENOQ errors
 *
 * @example
 * throw new EnoqError(
 *   'API key not configured',
 *   ENOQ_ERROR_CODES.API_KEY_MISSING,
 *   { context: { provider: 'anthropic' } }
 * );
 */
export class EnoqError extends Error {
  readonly code: EnoqErrorCode;
  readonly context?: Record<string, unknown>;
  readonly recoverable: boolean;
  readonly timestamp: number;

  constructor(
    message: string,
    code: EnoqErrorCode,
    options: EnoqErrorOptions = {}
  ) {
    super(message);
    this.name = 'EnoqError';
    this.code = code;
    this.context = options.context;
    this.recoverable = options.recoverable ?? false;
    this.timestamp = Date.now();

    // Maintain stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set cause if provided (ES2022+ property)
    if (options.cause) {
      (this as any).cause = options.cause;
    }
  }

  /**
   * Serialize error for logging/telemetry
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// ============================================
// SPECIFIC ERROR CLASSES
// ============================================

/**
 * API-related errors (LLM providers, gate service)
 */
export class EnoqAPIError extends EnoqError {
  readonly provider?: string;
  readonly statusCode?: number;

  constructor(
    message: string,
    code: EnoqErrorCode,
    options: EnoqErrorOptions & { provider?: string; statusCode?: number } = {}
  ) {
    super(message, code, options);
    this.name = 'EnoqAPIError';
    this.provider = options.provider;
    this.statusCode = options.statusCode;
  }
}

/**
 * Configuration/initialization errors
 */
export class EnoqConfigError extends EnoqError {
  readonly configKey?: string;

  constructor(
    message: string,
    code: EnoqErrorCode,
    options: EnoqErrorOptions & { configKey?: string } = {}
  ) {
    super(message, code, options);
    this.name = 'EnoqConfigError';
    this.configKey = options.configKey;
  }
}

/**
 * Validation errors (input/output)
 */
export class EnoqValidationError extends EnoqError {
  readonly field?: string;
  readonly value?: unknown;

  constructor(
    message: string,
    code: EnoqErrorCode,
    options: EnoqErrorOptions & { field?: string; value?: unknown } = {}
  ) {
    super(message, code, options);
    this.name = 'EnoqValidationError';
    this.field = options.field;
    this.value = options.value;
  }
}

/**
 * Pipeline execution errors
 */
export class EnoqPipelineError extends EnoqError {
  readonly stage?: string;
  readonly sessionId?: string;

  constructor(
    message: string,
    code: EnoqErrorCode,
    options: EnoqErrorOptions & { stage?: string; sessionId?: string } = {}
  ) {
    super(message, code, options);
    this.name = 'EnoqPipelineError';
    this.stage = options.stage;
    this.sessionId = options.sessionId;
  }
}

/**
 * Constitutional invariant violations
 *
 * These are CRITICAL errors that indicate the system attempted
 * to violate core constitutional constraints.
 */
export class EnoqInvariantError extends EnoqError {
  readonly invariant: string;

  constructor(
    message: string,
    code: EnoqErrorCode,
    invariant: string,
    options: EnoqErrorOptions = {}
  ) {
    super(message, code, { ...options, recoverable: false });
    this.name = 'EnoqInvariantError';
    this.invariant = invariant;
  }
}

// ============================================
// ERROR HELPERS
// ============================================

/**
 * Check if an error is an EnoqError
 */
export function isEnoqError(error: unknown): error is EnoqError {
  return error instanceof EnoqError;
}

/**
 * Check if an error has a specific error code
 */
export function hasErrorCode(error: unknown, code: EnoqErrorCode): boolean {
  return isEnoqError(error) && error.code === code;
}

/**
 * Wrap an unknown error as an EnoqError
 */
export function wrapError(
  error: unknown,
  defaultCode: EnoqErrorCode = ENOQ_ERROR_CODES.PIPELINE_EXECUTION,
  context?: Record<string, unknown>
): EnoqError {
  if (isEnoqError(error)) {
    return error;
  }

  const originalError = error instanceof Error ? error : new Error(String(error));

  return new EnoqError(originalError.message, defaultCode, {
    cause: originalError,
    context,
    recoverable: false,
  });
}

/**
 * Create an API error for missing API key
 */
export function apiKeyMissingError(provider: string, envVar: string): EnoqAPIError {
  return new EnoqAPIError(
    `Missing API key for ${provider}. Set ${envVar} environment variable.`,
    ENOQ_ERROR_CODES.API_KEY_MISSING,
    { provider, recoverable: true, context: { envVar } }
  );
}

/**
 * Create an API error for request failures
 */
export function apiRequestError(
  provider: string,
  statusCode: number,
  message: string,
  cause?: Error
): EnoqAPIError {
  return new EnoqAPIError(
    `${provider} API error (${statusCode}): ${message}`,
    ENOQ_ERROR_CODES.API_REQUEST_FAILED,
    { provider, statusCode, cause, recoverable: statusCode >= 500 }
  );
}

/**
 * Create an invariant violation error
 */
export function invariantViolation(
  invariant: string,
  message: string,
  context?: Record<string, unknown>
): EnoqInvariantError {
  const codeMap: Record<string, EnoqErrorCode> = {
    'INV-009': ENOQ_ERROR_CODES.INVARIANT_RUBICON,
    'INV-003': ENOQ_ERROR_CODES.INVARIANT_DELEGATION,
    'INV-011': ENOQ_ERROR_CODES.INVARIANT_DIAGNOSIS,
    'L2-BLINDNESS': ENOQ_ERROR_CODES.INVARIANT_BLINDNESS,
  };

  const code = codeMap[invariant] || ENOQ_ERROR_CODES.INVARIANT_VIOLATION;

  return new EnoqInvariantError(
    `${invariant}: ${message}`,
    code,
    invariant,
    { context, recoverable: false }
  );
}
