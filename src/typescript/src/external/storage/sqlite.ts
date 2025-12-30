/**
 * ENOQ SQLite Storage - P5
 *
 * Minimal SQLite storage for session/audit.
 * Write-only from SDK/API. Read for admin/debug only.
 */

import Database from 'better-sqlite3';
import {
  AuditStorage,
  AuditEvent,
  Session,
  StorageConfig,
  DEFAULT_STORAGE_CONFIG,
} from './types';

// ============================================
// SCHEMA
// ============================================

const CREATE_SESSIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    last_activity INTEGER NOT NULL
  )
`;

const CREATE_EVENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    request_id TEXT NOT NULL,
    runtime TEXT NOT NULL,
    event_type TEXT NOT NULL,
    outcome TEXT NOT NULL,
    metadata TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
  )
`;

const CREATE_EVENTS_SESSION_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id)
`;

const CREATE_EVENTS_REQUEST_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_events_request_id ON events(request_id)
`;

const CREATE_EVENTS_TIMESTAMP_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)
`;

// ============================================
// IMPLEMENTATION
// ============================================

export class SQLiteStorage implements AuditStorage {
  private db: Database.Database | null = null;
  private config: StorageConfig;
  private initialized = false;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_STORAGE_CONFIG, ...config };
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    this.db = new Database(this.config.dbPath);

    // Enable WAL mode for better concurrency
    if (this.config.walMode && this.config.dbPath !== ':memory:') {
      this.db.pragma('journal_mode = WAL');
    }

    // Create tables
    this.db.exec(CREATE_SESSIONS_TABLE);
    this.db.exec(CREATE_EVENTS_TABLE);
    this.db.exec(CREATE_EVENTS_SESSION_INDEX);
    this.db.exec(CREATE_EVENTS_REQUEST_INDEX);
    this.db.exec(CREATE_EVENTS_TIMESTAMP_INDEX);

    this.initialized = true;
  }

  async upsertSession(sessionId: string): Promise<Session> {
    this.ensureInitialized();

    const now = Date.now();
    const stmt = this.db!.prepare(`
      INSERT INTO sessions (session_id, created_at, last_activity)
      VALUES (?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET last_activity = excluded.last_activity
    `);

    stmt.run(sessionId, now, now);

    const session = this.db!.prepare(
      'SELECT session_id, created_at, last_activity FROM sessions WHERE session_id = ?'
    ).get(sessionId) as { session_id: string; created_at: number; last_activity: number };

    return {
      session_id: session.session_id,
      created_at: session.created_at,
      last_activity: session.last_activity,
    };
  }

  async getSession(sessionId: string): Promise<Session | null> {
    this.ensureInitialized();

    const row = this.db!.prepare(
      'SELECT session_id, created_at, last_activity FROM sessions WHERE session_id = ?'
    ).get(sessionId) as { session_id: string; created_at: number; last_activity: number } | undefined;

    if (!row) return null;

    return {
      session_id: row.session_id,
      created_at: row.created_at,
      last_activity: row.last_activity,
    };
  }

  async writeEvent(event: Omit<AuditEvent, 'id'>): Promise<number> {
    this.ensureInitialized();

    const stmt = this.db!.prepare(`
      INSERT INTO events (session_id, request_id, runtime, event_type, outcome, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      event.session_id,
      event.request_id,
      event.runtime,
      event.event_type,
      event.outcome,
      JSON.stringify(event.metadata),
      event.timestamp
    );

    return Number(result.lastInsertRowid);
  }

  async getEventsForSession(sessionId: string, limit: number = 100): Promise<AuditEvent[]> {
    this.ensureInitialized();

    const rows = this.db!.prepare(`
      SELECT id, session_id, request_id, runtime, event_type, outcome, metadata, timestamp
      FROM events
      WHERE session_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(sessionId, limit) as Array<{
      id: number;
      session_id: string | null;
      request_id: string;
      runtime: string;
      event_type: string;
      outcome: string;
      metadata: string;
      timestamp: number;
    }>;

    return rows.map(row => ({
      id: row.id,
      session_id: row.session_id,
      request_id: row.request_id,
      runtime: row.runtime as AuditEvent['runtime'],
      event_type: row.event_type as AuditEvent['event_type'],
      outcome: row.outcome as AuditEvent['outcome'],
      metadata: JSON.parse(row.metadata),
      timestamp: row.timestamp,
    }));
  }

  async getEventsByRequestId(requestId: string): Promise<AuditEvent[]> {
    this.ensureInitialized();

    const rows = this.db!.prepare(`
      SELECT id, session_id, request_id, runtime, event_type, outcome, metadata, timestamp
      FROM events
      WHERE request_id = ?
      ORDER BY timestamp ASC
    `).all(requestId) as Array<{
      id: number;
      session_id: string | null;
      request_id: string;
      runtime: string;
      event_type: string;
      outcome: string;
      metadata: string;
      timestamp: number;
    }>;

    return rows.map(row => ({
      id: row.id,
      session_id: row.session_id,
      request_id: row.request_id,
      runtime: row.runtime as AuditEvent['runtime'],
      event_type: row.event_type as AuditEvent['event_type'],
      outcome: row.outcome as AuditEvent['outcome'],
      metadata: JSON.parse(row.metadata),
      timestamp: row.timestamp,
    }));
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  isHealthy(): boolean {
    if (!this.db || !this.initialized) return false;

    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.db) {
      throw new Error('Storage not initialized. Call init() first.');
    }
  }
}

// ============================================
// FACTORY
// ============================================

let globalStorage: AuditStorage | null = null;

/**
 * Get or create the global storage instance.
 */
export async function getStorage(config?: Partial<StorageConfig>): Promise<AuditStorage> {
  if (!globalStorage) {
    const dbPath = process.env.ENOQ_DB_PATH || config?.dbPath || './enoq_audit.db';
    globalStorage = new SQLiteStorage({ ...config, dbPath });
    await globalStorage.init();
  }
  return globalStorage;
}

/**
 * Close and reset global storage (for testing).
 */
export async function resetStorage(): Promise<void> {
  if (globalStorage) {
    await globalStorage.close();
    globalStorage = null;
  }
}
