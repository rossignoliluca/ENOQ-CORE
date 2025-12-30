/**
 * Observability Tests (P2.3)
 *
 * Tests for event emission, JSON logging, and metrics collection.
 */

import {
  getObserver,
  resetObserver,
  emitBoundaryBlocked,
  emitVerifyFailed,
  emitRubiconWithdraw,
  emitProviderFailover,
  emitPipelineStart,
  emitPipelineEnd,
  emitStateTransition,
  createJsonLogger,
  EnoqEvent,
  MetricsSnapshot,
} from '../core/signals/observability';

describe('Observability', () => {
  beforeEach(() => {
    resetObserver();
  });

  describe('Event Emission', () => {
    test('emitPipelineStart creates event with correlation ID', () => {
      const correlationId = emitPipelineStart(100, 'en', {
        session_id: 'test-session',
        turn_number: 1,
      });

      expect(correlationId).toMatch(/^enoq-\d+-\d+$/);

      const events = getObserver().getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('PIPELINE_START');
      expect(events[0].correlation_id).toBe(correlationId);
      expect(events[0].session_id).toBe('test-session');
    });

    test('emitPipelineEnd creates complete event', () => {
      emitPipelineEnd(true, 500, 150, ['PERMIT', 'SENSE', 'ACT', 'VERIFY', 'STOP'], {
        session_id: 'test-session',
        turn_number: 1,
      });

      const events = getObserver().getRecentEvents();
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.type).toBe('PIPELINE_END');
      if (event.type === 'PIPELINE_END') {
        expect(event.data.success).toBe(true);
        expect(event.data.output_length).toBe(500);
        expect(event.data.duration_ms).toBe(150);
        expect(event.data.states_traversed).toEqual(['PERMIT', 'SENSE', 'ACT', 'VERIFY', 'STOP']);
      }
    });

    test('emitBoundaryBlocked creates event with preview', () => {
      const longMessage = 'This is a very long message that should be truncated in the preview';
      emitBoundaryBlocked('EMERGENCY', 'Crisis detected', 0.95, longMessage);

      const events = getObserver().getRecentEvents();
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.type).toBe('BOUNDARY_BLOCKED');
      if (event.type === 'BOUNDARY_BLOCKED') {
        expect(event.data.signal).toBe('EMERGENCY');
        expect(event.data.reason).toBe('Crisis detected');
        expect(event.data.confidence).toBe(0.95);
        expect(event.data.message_preview.length).toBeLessThanOrEqual(50);
      }
    });

    test('emitVerifyFailed creates event with violations', () => {
      const violations = [
        { invariant: 'INV-003', category: 'NORMATIVE', matched_text: 'you should' },
        { invariant: 'INV-004', category: 'RANKING' },
      ];
      emitVerifyFailed(violations, 'STOP', 'Output text that you should change');

      const events = getObserver().getRecentEvents();
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.type).toBe('VERIFY_FAILED');
      if (event.type === 'VERIFY_FAILED') {
        expect(event.data.violations).toHaveLength(2);
        expect(event.data.action).toBe('STOP');
        expect(event.data.output_preview.length).toBeLessThanOrEqual(100);
      }
    });

    test('emitRubiconWithdraw creates event with rubicon data', () => {
      emitRubiconWithdraw('identity_decision', 'H07_IDENTITY', 'EXISTENTIAL', 0.85);

      const events = getObserver().getRecentEvents();
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.type).toBe('RUBICON_WITHDRAW');
      if (event.type === 'RUBICON_WITHDRAW') {
        expect(event.data.trigger).toBe('identity_decision');
        expect(event.data.domain).toBe('H07_IDENTITY');
        expect(event.data.vertical_level).toBe('EXISTENTIAL');
        expect(event.data.rubicon_score).toBe(0.85);
      }
    });

    test('emitProviderFailover creates event with provider info', () => {
      emitProviderFailover('anthropic', 'openai', 'RATE_LIMIT', 'Too many requests', 2);

      const events = getObserver().getRecentEvents();
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.type).toBe('PROVIDER_FAILOVER');
      if (event.type === 'PROVIDER_FAILOVER') {
        expect(event.data.failed_provider).toBe('anthropic');
        expect(event.data.fallback_provider).toBe('openai');
        expect(event.data.error_type).toBe('RATE_LIMIT');
        expect(event.data.retry_count).toBe(2);
      }
    });

    test('emitStateTransition creates event with timing', () => {
      emitStateTransition('PERMIT', 'SENSE', 15);

      const events = getObserver().getRecentEvents();
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.type).toBe('STATE_TRANSITION');
      if (event.type === 'STATE_TRANSITION') {
        expect(event.data.from_state).toBe('PERMIT');
        expect(event.data.to_state).toBe('SENSE');
        expect(event.data.duration_ms).toBe(15);
      }
    });
  });

  describe('Event Subscription', () => {
    test('subscribe receives events', () => {
      const received: EnoqEvent[] = [];
      const unsubscribe = getObserver().subscribe((event) => {
        received.push(event);
      });

      emitPipelineStart(100);
      emitPipelineEnd(true, 200, 50, ['STOP']);

      expect(received).toHaveLength(2);
      expect(received[0].type).toBe('PIPELINE_START');
      expect(received[1].type).toBe('PIPELINE_END');

      unsubscribe();
    });

    test('unsubscribe stops receiving events', () => {
      const received: EnoqEvent[] = [];
      const unsubscribe = getObserver().subscribe((event) => {
        received.push(event);
      });

      emitPipelineStart(100);
      unsubscribe();
      emitPipelineEnd(true, 200, 50, ['STOP']);

      expect(received).toHaveLength(1);
    });

    test('multiple subscribers receive events', () => {
      const received1: EnoqEvent[] = [];
      const received2: EnoqEvent[] = [];

      getObserver().subscribe((event) => received1.push(event));
      getObserver().subscribe((event) => received2.push(event));

      emitPipelineStart(100);

      expect(received1).toHaveLength(1);
      expect(received2).toHaveLength(1);
    });

    test('handler errors do not break other handlers', () => {
      const received: EnoqEvent[] = [];

      getObserver().subscribe(() => {
        throw new Error('Handler error');
      });
      getObserver().subscribe((event) => received.push(event));

      // Should not throw
      emitPipelineStart(100);

      expect(received).toHaveLength(1);
    });
  });

  describe('Metrics Collection', () => {
    test('initial metrics are zero', () => {
      const metrics = getObserver().getMetrics();

      expect(metrics.boundary_blocks).toBe(0);
      expect(metrics.verify_failures).toBe(0);
      expect(metrics.rubicon_withdrawals).toBe(0);
      expect(metrics.provider_failovers).toBe(0);
      expect(metrics.total_pipelines).toBe(0);
      expect(metrics.success_rate).toBe(1);
    });

    test('metrics count events', () => {
      emitBoundaryBlocked('TEST', 'test', 0.5, 'test');
      emitBoundaryBlocked('TEST', 'test', 0.5, 'test');
      emitVerifyFailed([], 'STOP', 'test');
      emitRubiconWithdraw('test', 'H01', 'SOMATIC', 0.5);
      emitProviderFailover('a', 'b', 'err', 'msg', 1);

      const metrics = getObserver().getMetrics();

      expect(metrics.boundary_blocks).toBe(2);
      expect(metrics.verify_failures).toBe(1);
      expect(metrics.rubicon_withdrawals).toBe(1);
      expect(metrics.provider_failovers).toBe(1);
    });

    test('metrics track pipeline success/failure', () => {
      emitPipelineEnd(true, 100, 50, ['STOP']);
      emitPipelineEnd(true, 100, 50, ['STOP']);
      emitPipelineEnd(false, 100, 50, ['STOP']);

      const metrics = getObserver().getMetrics();

      expect(metrics.total_pipelines).toBe(3);
      expect(metrics.success_rate).toBeCloseTo(2 / 3);
    });

    test('metrics calculate average duration', () => {
      emitPipelineEnd(true, 100, 100, ['STOP']);
      emitPipelineEnd(true, 100, 200, ['STOP']);
      emitPipelineEnd(true, 100, 300, ['STOP']);

      const metrics = getObserver().getMetrics();

      expect(metrics.avg_pipeline_duration_ms).toBe(200);
    });

    test('metrics calculate p95 duration', () => {
      // Emit 100 events with durations 1-100
      for (let i = 1; i <= 100; i++) {
        emitPipelineEnd(true, 100, i, ['STOP']);
      }

      const metrics = getObserver().getMetrics();

      // P95 should be around 95
      expect(metrics.p95_pipeline_duration_ms).toBeGreaterThanOrEqual(94);
      expect(metrics.p95_pipeline_duration_ms).toBeLessThanOrEqual(96);
    });

    test('metrics include uptime', () => {
      const metrics = getObserver().getMetrics();
      expect(metrics.uptime_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Recent Events', () => {
    test('getRecentEvents returns last N events', () => {
      for (let i = 0; i < 10; i++) {
        emitPipelineStart(i);
      }

      const recent = getObserver().getRecentEvents(5);
      expect(recent).toHaveLength(5);

      // Should be the last 5
      if (recent[0].type === 'PIPELINE_START') {
        expect(recent[0].data.input_length).toBe(5);
      }
    });

    test('getRecentEvents default is 100', () => {
      for (let i = 0; i < 150; i++) {
        emitStateTransition('A', 'B', 1);
      }

      const recent = getObserver().getRecentEvents();
      expect(recent).toHaveLength(100);
    });
  });

  describe('JSON Logger', () => {
    test('createJsonLogger logs events as JSON', () => {
      const logged: string[] = [];
      const unsubscribe = createJsonLogger({
        output: (json) => logged.push(json),
      });

      emitPipelineStart(100);

      expect(logged).toHaveLength(1);
      const parsed = JSON.parse(logged[0]);
      expect(parsed.type).toBe('PIPELINE_START');

      unsubscribe();
    });

    test('createJsonLogger filters by event type', () => {
      const logged: string[] = [];
      const unsubscribe = createJsonLogger({
        output: (json) => logged.push(json),
        filter: ['BOUNDARY_BLOCKED'],
      });

      emitPipelineStart(100);
      emitBoundaryBlocked('TEST', 'test', 0.5, 'test');
      emitPipelineEnd(true, 100, 50, ['STOP']);

      expect(logged).toHaveLength(1);
      const parsed = JSON.parse(logged[0]);
      expect(parsed.type).toBe('BOUNDARY_BLOCKED');

      unsubscribe();
    });

    test('createJsonLogger pretty prints when enabled', () => {
      const logged: string[] = [];
      const unsubscribe = createJsonLogger({
        output: (json) => logged.push(json),
        pretty: true,
      });

      emitPipelineStart(100);

      expect(logged[0]).toContain('\n');
      expect(logged[0]).toContain('  ');

      unsubscribe();
    });
  });

  describe('Event Schema', () => {
    test('all events have required base fields', () => {
      emitPipelineStart(100, 'en', { session_id: 'sess', turn_number: 1 });
      emitBoundaryBlocked('TEST', 'reason', 0.5, 'msg');
      emitVerifyFailed([], 'STOP', 'output');
      emitRubiconWithdraw('trigger', 'domain', 'level', 0.5);
      emitProviderFailover('a', 'b', 'err', 'msg', 1);
      emitStateTransition('A', 'B', 10);
      emitPipelineEnd(true, 100, 50, ['STOP']);

      const events = getObserver().getRecentEvents();

      for (const event of events) {
        expect(event.type).toBeDefined();
        expect(event.timestamp).toBeGreaterThan(0);
        expect(event.timestamp_iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(event.correlation_id).toBeDefined();
      }
    });

    test('timestamps are ISO 8601 format', () => {
      emitPipelineStart(100);

      const events = getObserver().getRecentEvents();
      const iso = events[0].timestamp_iso;

      // Should be parseable as date
      const parsed = new Date(iso);
      expect(parsed.getTime()).toBeGreaterThan(0);
    });
  });

  describe('Observer Reset', () => {
    test('reset clears events and metrics', () => {
      emitBoundaryBlocked('TEST', 'test', 0.5, 'test');
      emitPipelineEnd(true, 100, 50, ['STOP']);

      resetObserver();

      const events = getObserver().getRecentEvents();
      const metrics = getObserver().getMetrics();

      expect(events).toHaveLength(0);
      expect(metrics.boundary_blocks).toBe(0);
      expect(metrics.total_pipelines).toBe(0);
    });
  });
});
