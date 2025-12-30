/**
 * ENOQ Storage - P5
 *
 * Minimal storage for session tracking and audit trail.
 * Write-only from SDK/API perspective.
 */

export {
  Session,
  AuditEvent,
  AuditRuntime,
  AuditOutcome,
  AuditEventType,
  AuditStorage,
  StorageConfig,
  DEFAULT_STORAGE_CONFIG,
} from './types';

export {
  SQLiteStorage,
  getStorage,
  resetStorage,
} from './sqlite';
