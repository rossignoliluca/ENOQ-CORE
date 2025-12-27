/**
 * Tests for RegulatoryStore
 *
 * Covers:
 * - SQLite store CRUD
 * - In-memory fallback
 * - TTL expiration
 * - Migration system
 * - WAL mode
 * - GDPR delete
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  SQLiteStore,
  InMemoryStore,
  FallbackStore,
  RegulatoryState,
  createDefaultState,
  resetRegulatoryStore
} from '../regulatory_store';

// Test directory
const TEST_DB_DIR = path.join(__dirname, '../../test-data');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'test_regulatory.sqlite');

// Cleanup helper
function cleanup(): void {
  resetRegulatoryStore();
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
  if (fs.existsSync(TEST_DB_PATH + '-wal')) {
    fs.unlinkSync(TEST_DB_PATH + '-wal');
  }
  if (fs.existsSync(TEST_DB_PATH + '-shm')) {
    fs.unlinkSync(TEST_DB_PATH + '-shm');
  }
}

describe('RegulatoryStore', () => {
  beforeEach(() => {
    cleanup();
  });

  afterAll(() => {
    cleanup();
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmdirSync(TEST_DB_DIR, { recursive: true });
    }
  });

  describe('InMemoryStore', () => {
    it('stores and retrieves state', () => {
      const store = new InMemoryStore();
      const state = createDefaultState('user_1');

      store.save(state);
      const retrieved = store.get('user_1');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.potency).toBe(1.0);
      expect(retrieved?.withdrawal_bias).toBe(0.0);
    });

    it('returns null for non-existent subject', () => {
      const store = new InMemoryStore();
      expect(store.get('unknown')).toBeNull();
    });

    it('updates existing state', () => {
      const store = new InMemoryStore();
      store.save(createDefaultState('user_1'));

      store.update('user_1', { potency: 0.5, loop_count: 3 });

      const retrieved = store.get('user_1');
      expect(retrieved?.potency).toBe(0.5);
      expect(retrieved?.loop_count).toBe(3);
    });

    it('deletes state', () => {
      const store = new InMemoryStore();
      store.save(createDefaultState('user_1'));

      store.delete('user_1');

      expect(store.get('user_1')).toBeNull();
    });

    it('expires state after TTL', () => {
      const store = new InMemoryStore();
      const state = createDefaultState('user_1', 100); // 100ms TTL

      store.save(state);
      expect(store.get('user_1')).not.toBeNull();

      // Wait for expiration
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(store.get('user_1')).toBeNull();
          resolve();
        }, 150);
      });
    });

    it('purges expired entries', () => {
      const store = new InMemoryStore();

      // Add expired state
      const expired: RegulatoryState = {
        ...createDefaultState('user_expired'),
        expires_at: Date.now() - 1000
      };
      store.save(expired);

      // Add valid state
      store.save(createDefaultState('user_valid'));

      const purged = store.purgeExpired();
      expect(purged).toBe(1);
      expect(store.getStats().subjects).toBe(1);
    });
  });

  describe('SQLiteStore', () => {
    it('creates database and schema', () => {
      const store = new SQLiteStore({ dbPath: TEST_DB_PATH });

      expect(fs.existsSync(TEST_DB_PATH)).toBe(true);

      store.close();
    });

    it('stores and retrieves state', () => {
      const store = new SQLiteStore({ dbPath: TEST_DB_PATH });
      const state = createDefaultState('user_1');

      store.save(state);
      const retrieved = store.get('user_1');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.potency).toBe(1.0);
      expect(retrieved?.subject_id).toBe('user_1');

      store.close();
    });

    it('updates state', () => {
      const store = new SQLiteStore({ dbPath: TEST_DB_PATH });
      store.save(createDefaultState('user_1'));

      store.update('user_1', {
        potency: 0.7,
        withdrawal_bias: 0.2,
        autonomy_slope: 0.1
      });

      const retrieved = store.get('user_1');
      expect(retrieved?.potency).toBe(0.7);
      expect(retrieved?.withdrawal_bias).toBe(0.2);
      expect(retrieved?.autonomy_slope).toBe(0.1);

      store.close();
    });

    it('deletes state (GDPR)', () => {
      const store = new SQLiteStore({ dbPath: TEST_DB_PATH });
      store.save(createDefaultState('user_1'));

      store.delete('user_1');

      expect(store.get('user_1')).toBeNull();
      store.close();
    });

    it('does not return expired state', () => {
      const store = new SQLiteStore({ dbPath: TEST_DB_PATH });

      const expired: RegulatoryState = {
        ...createDefaultState('user_expired'),
        expires_at: Date.now() - 1000
      };
      store.save(expired);

      expect(store.get('user_expired')).toBeNull();
      store.close();
    });

    it('purges expired entries', () => {
      const store = new SQLiteStore({ dbPath: TEST_DB_PATH });

      // Add expired
      store.save({
        ...createDefaultState('user_1'),
        expires_at: Date.now() - 1000
      });
      store.save({
        ...createDefaultState('user_2'),
        expires_at: Date.now() - 1000
      });

      // Add valid
      store.save(createDefaultState('user_3'));

      const purged = store.purgeExpired();
      expect(purged).toBe(2);
      expect(store.getStats().subjects).toBe(1);

      store.close();
    });

    it('returns correct stats', () => {
      const store = new SQLiteStore({ dbPath: TEST_DB_PATH });

      store.save(createDefaultState('user_1'));
      store.save(createDefaultState('user_2'));

      const stats = store.getStats();
      expect(stats.subjects).toBe(2);
      expect(stats.dbSizeBytes).toBeGreaterThan(0);

      store.close();
    });

    it('persists across restarts', () => {
      // First instance
      const store1 = new SQLiteStore({ dbPath: TEST_DB_PATH });
      store1.save(createDefaultState('persistent_user'));
      store1.update('persistent_user', { potency: 0.42 });
      store1.close();

      // Second instance
      const store2 = new SQLiteStore({ dbPath: TEST_DB_PATH });
      const retrieved = store2.get('persistent_user');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.potency).toBe(0.42);

      store2.close();
    });

    it('uses WAL mode', () => {
      const store = new SQLiteStore({ dbPath: TEST_DB_PATH });
      store.save(createDefaultState('user_1'));

      // WAL file should exist after write
      expect(fs.existsSync(TEST_DB_PATH + '-wal')).toBe(true);

      store.close();
    });
  });

  describe('FallbackStore', () => {
    it('uses SQLite when available', () => {
      const store = new FallbackStore({ dbPath: TEST_DB_PATH });

      expect(store.isUsingFallback()).toBe(false);

      store.save(createDefaultState('user_1'));
      expect(fs.existsSync(TEST_DB_PATH)).toBe(true);

      store.close();
    });

    it('falls back to memory on SQLite error', () => {
      // Use invalid path to force fallback
      const store = new FallbackStore({ dbPath: '/nonexistent/path/db.sqlite' });

      expect(store.isUsingFallback()).toBe(true);

      // Should still work
      store.save(createDefaultState('user_1'));
      expect(store.get('user_1')).not.toBeNull();

      store.close();
    });
  });

  describe('Migration System', () => {
    it('applies migrations on first run', () => {
      const store = new SQLiteStore({ dbPath: TEST_DB_PATH });

      // Table should exist
      store.save(createDefaultState('test'));
      expect(store.get('test')).not.toBeNull();

      store.close();
    });

    it('preserves data across schema versions', () => {
      // Create with v1
      const store1 = new SQLiteStore({ dbPath: TEST_DB_PATH });
      store1.save(createDefaultState('preserved_user'));
      store1.close();

      // Reopen (simulates upgrade)
      const store2 = new SQLiteStore({ dbPath: TEST_DB_PATH });
      expect(store2.get('preserved_user')).not.toBeNull();
      store2.close();
    });
  });

  describe('Concurrency (WAL)', () => {
    it('handles concurrent reads and writes', async () => {
      const store = new SQLiteStore({ dbPath: TEST_DB_PATH });

      // Concurrent writes
      const writes = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(store.save(createDefaultState(`user_${i}`)))
      );
      await Promise.all(writes);

      // Concurrent reads
      const reads = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(store.get(`user_${i}`))
      );
      const results = await Promise.all(reads);

      expect(results.every(r => r !== null)).toBe(true);

      store.close();
    });
  });
});

describe('createDefaultState', () => {
  it('creates state with correct defaults', () => {
    const state = createDefaultState('test_user');

    expect(state.subject_id).toBe('test_user');
    expect(state.potency).toBe(1.0);
    expect(state.withdrawal_bias).toBe(0.0);
    expect(state.loop_count).toBe(0);
    expect(state.autonomy_slope).toBe(0.0);
    expect(state.expires_at).toBeGreaterThan(Date.now());
  });

  it('respects custom TTL', () => {
    const ttl = 1000; // 1 second
    const state = createDefaultState('test_user', ttl);

    const expectedExpiry = Date.now() + ttl;
    expect(state.expires_at).toBeGreaterThanOrEqual(expectedExpiry - 100);
    expect(state.expires_at).toBeLessThanOrEqual(expectedExpiry + 100);
  });
});
