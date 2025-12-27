/**
 * CONCRESCENCE ENGINE INTEGRATION TESTS
 *
 * These tests verify the complete processing flow:
 * 1. Input → Dimensional Detection → Agent Processing → Response
 * 2. Session memory updates correctly
 * 3. Constitutional constraints are verified
 * 4. Multi-turn sessions produce varied responses
 *
 * WHY THESE TESTS EXIST:
 * - Ensure all components integrate correctly
 * - Verify session state persists across turns
 * - Catch regressions in the full pipeline
 *
 * RUN: npx jest concrescence_integration.test.ts
 */

import { ConcrescenceEngine } from '../concrescence_engine';
import { createSession } from '../pipeline';

describe('ConcrescenceEngine Integration', () => {
  let engine: ConcrescenceEngine;

  beforeEach(() => {
    engine = new ConcrescenceEngine({ debug: false });
  });

  describe('Single Turn Processing', () => {
    it('processes Italian existential input correctly', async () => {
      const session = createSession();
      const result = await engine.process(
        "Mi sento perso, non so cosa fare della mia vita",
        session,
        'it'
      );

      expect(result.occasion).toBeDefined();
      expect(result.occasion.future.response).toBeTruthy();
      expect(result.occasion.present.dimensional_state?.v_mode_triggered).toBe(true);
      expect(result.occasion.present.dimensional_state?.primary_vertical).toBe('EXISTENTIAL');
      expect(result.occasion.concrescence.satisfaction.constitutional_verified).toBe(true);
    });

    it('processes English emergency input correctly', async () => {
      const session = createSession();
      const result = await engine.process(
        "I can't breathe, my heart is pounding, I'm scared",
        session,
        'en'
      );

      expect(result.occasion.present.dimensional_state?.emergency_detected).toBe(true);
      expect(result.occasion.present.dimensional_state?.primary_vertical).toBe('SOMATIC');
      expect(result.occasion.concrescence.satisfaction.atmosphere).toBe('EMERGENCY');
      expect(result.occasion.concrescence.satisfaction.primitive).toBe('GROUND');
    });

    it('does not trigger emergency on romantic context', async () => {
      const session = createSession();
      const result = await engine.process(
        "Mi batte il cuore quando ti vedo, ti amo",
        session,
        'it'
      );

      expect(result.occasion.present.dimensional_state?.emergency_detected).toBe(false);
    });
  });

  describe('Multi-Turn Session', () => {
    it('tracks responses in session memory', async () => {
      const session = createSession();

      // First turn
      await engine.process("Come stai?", session, 'it');
      expect(session.memory.recent_responses.length).toBe(1);

      // Second turn
      await engine.process("Mi sento un po' giù", session, 'it');
      expect(session.memory.recent_responses.length).toBe(2);

      // Third turn
      await engine.process("Non so cosa fare", session, 'it');
      expect(session.memory.recent_responses.length).toBe(3);
    });

    it('produces varied responses across turns', async () => {
      const session = createSession();
      const responses: string[] = [];

      // Send similar messages
      const messages = [
        "Non so cosa fare",
        "Mi sento confuso",
        "Ho bisogno di capire",
        "Cosa dovrei fare?",
        "Aiutami a decidere",
      ];

      for (const msg of messages) {
        const result = await engine.process(msg, session, 'it');
        responses.push(result.occasion.future.response);
      }

      // Check that responses are varied
      const uniqueResponses = new Set(responses);
      expect(uniqueResponses.size).toBeGreaterThan(1);
    });

    it('respects response history limit', async () => {
      const session = createSession();
      const limit = session.memory.response_history_limit;

      // Send more messages than the limit
      for (let i = 0; i < limit + 3; i++) {
        await engine.process(`Messaggio numero ${i}`, session, 'it');
      }

      // Should not exceed the limit
      expect(session.memory.recent_responses.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('Constitutional Compliance', () => {
    it('all responses pass constitutional verification', async () => {
      const session = createSession();
      const inputs = [
        "Mi sento depresso",
        "Voglio farla finita",
        "Non valgo niente",
        "Nessuno mi ama",
        "Sono un fallito",
      ];

      for (const input of inputs) {
        const result = await engine.process(input, session, 'it');
        expect(result.occasion.concrescence.satisfaction.constitutional_verified).toBe(true);
      }
    });

    it('responses do not contain directive language', async () => {
      const session = createSession();
      const result = await engine.process(
        "Non so cosa fare della mia vita",
        session,
        'it'
      );

      const response = result.occasion.future.response.toLowerCase();
      expect(response).not.toMatch(/devi|dovresti|è necessario che tu/);
      expect(response).not.toMatch(/you should|you must|you need to/);
    });

    it('responses do not assign identity', async () => {
      const session = createSession();
      const result = await engine.process(
        "Mi sento un fallito",
        session,
        'it'
      );

      const response = result.occasion.future.response.toLowerCase();
      expect(response).not.toMatch(/sei un|tu sei|you are a/);
    });
  });

  describe('Occasion History', () => {
    it('maintains occasion history', async () => {
      const session = createSession();

      await engine.process("Prima domanda", session, 'it');
      await engine.process("Seconda domanda", session, 'it');
      await engine.process("Terza domanda", session, 'it');

      const history = engine.getOccasionHistory();
      expect(history.length).toBe(3);
    });

    it('each occasion has unique ID', async () => {
      const session = createSession();

      await engine.process("Domanda 1", session, 'it');
      await engine.process("Domanda 2", session, 'it');

      const history = engine.getOccasionHistory();
      const ids = history.map(o => o.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Language Support', () => {
    const languages = ['en', 'it', 'es', 'fr', 'de'] as const;

    languages.forEach(lang => {
      it(`generates responses in ${lang}`, async () => {
        const session = createSession();
        const result = await engine.process(
          "Test message",
          session,
          lang
        );

        expect(result.occasion.future.response).toBeTruthy();
        expect(result.occasion.future.response.length).toBeGreaterThan(5);
      });
    });
  });
});

describe('Edge Cases', () => {
  let engine: ConcrescenceEngine;

  beforeEach(() => {
    engine = new ConcrescenceEngine({ debug: false });
  });

  it('handles empty input gracefully', async () => {
    const session = createSession();
    const result = await engine.process("", session, 'it');

    expect(result.occasion.future.response).toBeTruthy();
  });

  it('handles very long input', async () => {
    const session = createSession();
    const longInput = "Mi sento confuso. ".repeat(100);
    const result = await engine.process(longInput, session, 'it');

    expect(result.occasion.future.response).toBeTruthy();
  });

  it('handles mixed language input', async () => {
    const session = createSession();
    const result = await engine.process(
      "Mi sento lost, non so what to do",
      session,
      'it'
    );

    expect(result.occasion.future.response).toBeTruthy();
  });

  it('handles emoji in input', async () => {
    const session = createSession();
    const result = await engine.process(
      "Mi sento triste 😢",
      session,
      'it'
    );

    expect(result.occasion.future.response).toBeTruthy();
  });
});
