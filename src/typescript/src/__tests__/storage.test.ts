/**
 * Storage Tests (P5)
 *
 * Tests for SQLite audit storage.
 */

import { SQLiteStorage, resetStorage } from '../external/storage';

describe('SQLiteStorage', () => {
  let storage: SQLiteStorage;

  beforeEach(async () => {
    // Use in-memory database for testing
    storage = new SQLiteStorage({ dbPath: ':memory:' });
    await storage.init();
  });

  afterEach(async () => {
    await storage.close();
    await resetStorage();
  });

  // ============================================
  // INITIALIZATION
  // ============================================

  describe('init', () => {
    test('creates tables successfully', async () => {
      expect(storage.isHealthy()).toBe(true);
    });

    test('is idempotent', async () => {
      await storage.init();
      await storage.init();
      expect(storage.isHealthy()).toBe(true);
    });
  });

  // ============================================
  // SESSIONS
  // ============================================

  describe('sessions', () => {
    test('upsertSession creates new session', async () => {
      const session = await storage.upsertSession('test-session-1');

      expect(session.session_id).toBe('test-session-1');
      expect(session.created_at).toBeGreaterThan(0);
      expect(session.last_activity).toBeGreaterThan(0);
    });

    test('upsertSession updates last_activity on repeat', async () => {
      const session1 = await storage.upsertSession('test-session-2');

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const session2 = await storage.upsertSession('test-session-2');

      expect(session2.session_id).toBe(session1.session_id);
      expect(session2.created_at).toBe(session1.created_at);
      expect(session2.last_activity).toBeGreaterThanOrEqual(session1.last_activity);
    });

    test('getSession returns null for non-existent', async () => {
      const session = await storage.getSession('non-existent');
      expect(session).toBeNull();
    });

    test('getSession returns existing session', async () => {
      await storage.upsertSession('test-session-3');
      const session = await storage.getSession('test-session-3');

      expect(session).not.toBeNull();
      expect(session!.session_id).toBe('test-session-3');
    });
  });

  // ============================================
  // EVENTS
  // ============================================

  describe('events', () => {
    test('writeEvent stores event', async () => {
      const eventId = await storage.writeEvent({
        session_id: null,
        request_id: 'req-1',
        runtime: 'MAIL',
        event_type: 'PIPELINE_START',
        outcome: 'PASS',
        metadata: { input_length: 100 },
        timestamp: Date.now(),
      });

      expect(eventId).toBeGreaterThan(0);
    });

    test('writeEvent with session_id', async () => {
      await storage.upsertSession('session-for-events');

      const eventId = await storage.writeEvent({
        session_id: 'session-for-events',
        request_id: 'req-2',
        runtime: 'DECISION',
        event_type: 'PIPELINE_END',
        outcome: 'PASS',
        metadata: { output_length: 500 },
        timestamp: Date.now(),
      });

      expect(eventId).toBeGreaterThan(0);
    });

    test('getEventsForSession returns events', async () => {
      await storage.upsertSession('session-with-events');

      await storage.writeEvent({
        session_id: 'session-with-events',
        request_id: 'req-3',
        runtime: 'MAIL',
        event_type: 'PIPELINE_START',
        outcome: 'PASS',
        metadata: {},
        timestamp: Date.now(),
      });

      await storage.writeEvent({
        session_id: 'session-with-events',
        request_id: 'req-3',
        runtime: 'MAIL',
        event_type: 'PIPELINE_END',
        outcome: 'PASS',
        metadata: {},
        timestamp: Date.now() + 1,
      });

      const events = await storage.getEventsForSession('session-with-events');

      expect(events.length).toBe(2);
      expect(events[0].event_type).toBe('PIPELINE_END'); // DESC order
      expect(events[1].event_type).toBe('PIPELINE_START');
    });

    test('getEventsByRequestId returns correlated events', async () => {
      const requestId = 'correlated-request';

      await storage.writeEvent({
        session_id: null,
        request_id: requestId,
        runtime: 'RELATION',
        event_type: 'PIPELINE_START',
        outcome: 'PASS',
        metadata: {},
        timestamp: Date.now(),
      });

      await storage.writeEvent({
        session_id: null,
        request_id: requestId,
        runtime: 'RELATION',
        event_type: 'BOUNDARY_BLOCKED',
        outcome: 'BLOCKED',
        metadata: { reason: 'test' },
        timestamp: Date.now() + 1,
      });

      const events = await storage.getEventsByRequestId(requestId);

      expect(events.length).toBe(2);
      expect(events[0].event_type).toBe('PIPELINE_START'); // ASC order
      expect(events[1].event_type).toBe('BOUNDARY_BLOCKED');
    });

    test('metadata is preserved as JSON', async () => {
      const metadata = {
        input_length: 150,
        language: 'en',
        nested: { key: 'value' },
      };

      await storage.writeEvent({
        session_id: null,
        request_id: 'req-metadata',
        runtime: 'CORE',
        event_type: 'PIPELINE_START',
        outcome: 'PASS',
        metadata,
        timestamp: Date.now(),
      });

      const events = await storage.getEventsByRequestId('req-metadata');

      expect(events[0].metadata).toEqual(metadata);
    });
  });

  // ============================================
  // AUDIT EVENT TYPES
  // ============================================

  describe('audit event types', () => {
    const eventTypes = [
      'PIPELINE_START',
      'PIPELINE_END',
      'BOUNDARY_BLOCKED',
      'VERIFY_FAILED',
      'RUBICON_WITHDRAW',
      'PROVIDER_FAILOVER',
    ] as const;

    for (const eventType of eventTypes) {
      test(`stores ${eventType} event`, async () => {
        const eventId = await storage.writeEvent({
          session_id: null,
          request_id: `req-${eventType}`,
          runtime: 'MAIL',
          event_type: eventType,
          outcome: 'PASS',
          metadata: {},
          timestamp: Date.now(),
        });

        expect(eventId).toBeGreaterThan(0);

        const events = await storage.getEventsByRequestId(`req-${eventType}`);
        expect(events[0].event_type).toBe(eventType);
      });
    }
  });

  // ============================================
  // OUTCOME TYPES
  // ============================================

  describe('outcome types', () => {
    const outcomes = ['PASS', 'BLOCKED', 'WITHDRAW', 'ERROR'] as const;

    for (const outcome of outcomes) {
      test(`stores ${outcome} outcome`, async () => {
        await storage.writeEvent({
          session_id: null,
          request_id: `req-${outcome}`,
          runtime: 'DECISION',
          event_type: 'PIPELINE_END',
          outcome,
          metadata: {},
          timestamp: Date.now(),
        });

        const events = await storage.getEventsByRequestId(`req-${outcome}`);
        expect(events[0].outcome).toBe(outcome);
      });
    }
  });

  // ============================================
  // HEALTH CHECK
  // ============================================

  describe('health', () => {
    test('isHealthy returns true when connected', () => {
      expect(storage.isHealthy()).toBe(true);
    });

    test('isHealthy returns false after close', async () => {
      await storage.close();
      expect(storage.isHealthy()).toBe(false);
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  describe('error handling', () => {
    test('throws when not initialized', async () => {
      const uninitStorage = new SQLiteStorage({ dbPath: ':memory:' });

      await expect(uninitStorage.upsertSession('test')).rejects.toThrow('not initialized');
    });
  });
});

// ============================================
// LIMIT TESTS
// ============================================

describe('getEventsForSession limit', () => {
  let storage: SQLiteStorage;

  beforeEach(async () => {
    storage = new SQLiteStorage({ dbPath: ':memory:' });
    await storage.init();
  });

  afterEach(async () => {
    await storage.close();
  });

  test('respects limit parameter', async () => {
    await storage.upsertSession('limit-test');

    // Write 10 events
    for (let i = 0; i < 10; i++) {
      await storage.writeEvent({
        session_id: 'limit-test',
        request_id: `req-limit-${i}`,
        runtime: 'MAIL',
        event_type: 'PIPELINE_START',
        outcome: 'PASS',
        metadata: {},
        timestamp: Date.now() + i,
      });
    }

    const events = await storage.getEventsForSession('limit-test', 5);
    expect(events.length).toBe(5);
  });
});
