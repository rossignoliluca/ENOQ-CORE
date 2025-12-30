/**
 * ENOQ Storage Types - P5
 *
 * Minimal storage for session tracking and audit trail.
 * NO semantic memory. NO cognitive state. Just operational audit.
 */

// ============================================
// SESSION TYPES
// ============================================

export interface Session {
  /** Unique session ID (UUID) */
  session_id: string;
  /** Creation timestamp (Unix ms) */
  created_at: number;
  /** Last activity timestamp (Unix ms) */
  last_activity: number;
}

// ============================================
// AUDIT EVENT TYPES
// ============================================

export type AuditRuntime = 'MAIL' | 'RELATION' | 'DECISION' | 'CORE';

export type AuditOutcome = 'PASS' | 'BLOCKED' | 'WITHDRAW' | 'ERROR';

export type AuditEventType =
  | 'PIPELINE_START'
  | 'PIPELINE_END'
  | 'BOUNDARY_BLOCKED'
  | 'VERIFY_FAILED'
  | 'RUBICON_WITHDRAW'
  | 'PROVIDER_FAILOVER';

export interface AuditEvent {
  /** Auto-increment ID */
  id?: number;
  /** Session ID (nullable for untracked calls) */
  session_id: string | null;
  /** Request ID (for correlation) */
  request_id: string;
  /** Runtime that produced this event */
  runtime: AuditRuntime;
  /** Event type */
  event_type: AuditEventType;
  /** Outcome of the operation */
  outcome: AuditOutcome;
  /** Additional event data (JSON) - NO content, just metadata */
  metadata: Record<string, unknown>;
  /** Event timestamp (Unix ms) */
  timestamp: number;
}

// ============================================
// STORAGE INTERFACE
// ============================================

export interface AuditStorage {
  /**
   * Initialize storage (create tables if needed).
   */
  init(): Promise<void>;

  /**
   * Create or update a session.
   */
  upsertSession(sessionId: string): Promise<Session>;

  /**
   * Get a session by ID.
   */
  getSession(sessionId: string): Promise<Session | null>;

  /**
   * Write an audit event.
   * This is WRITE-ONLY from SDK/API perspective.
   */
  writeEvent(event: Omit<AuditEvent, 'id'>): Promise<number>;

  /**
   * Get events for a session (admin/debug only).
   */
  getEventsForSession(sessionId: string, limit?: number): Promise<AuditEvent[]>;

  /**
   * Get events by request ID (admin/debug only).
   */
  getEventsByRequestId(requestId: string): Promise<AuditEvent[]>;

  /**
   * Close the storage connection.
   */
  close(): Promise<void>;

  /**
   * Check if storage is healthy.
   */
  isHealthy(): boolean;
}

// ============================================
// CONFIGURATION
// ============================================

export interface StorageConfig {
  /** Database file path (default: :memory: for testing) */
  dbPath: string;
  /** Enable WAL mode for better concurrency (default: true) */
  walMode: boolean;
}

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  dbPath: ':memory:',
  walMode: true,
};
