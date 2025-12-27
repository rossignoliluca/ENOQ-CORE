/**
 * SOTA DETECTOR TEST SUITE
 *
 * Tests the state-of-the-art detector against benchmark cases.
 * Run with: OPENAI_API_KEY=... npx jest sota_detector --testTimeout=120000
 */

import { SOTADetector, getSOTADetector, resetSOTADetector } from '../sota_detector';
import { BENCHMARK_CASES, computeMetrics } from './detector_benchmark.test';
import { dimensionalDetector, DimensionalState } from '../dimensional_system';
import { SupportedLanguage } from '../types';

// ============================================
// SETUP
// ============================================

const HAS_API_KEY = Boolean(process.env.OPENAI_API_KEY);

beforeAll(() => {
  resetSOTADetector();
});

// ============================================
// BASIC FUNCTIONALITY TESTS
// ============================================

describe('SOTA Detector - Basic', () => {
  it('creates detector instance', () => {
    const detector = new SOTADetector();
    expect(detector).toBeDefined();
    expect(detector.isInitialized()).toBe(false);
  });

  it('returns valid DimensionalState from sync detection', () => {
    const detector = new SOTADetector();
    const result = detector.detectSync('Test message', 'en');

    expect(result).toHaveProperty('vertical');
    expect(result).toHaveProperty('horizontal');
    expect(result).toHaveProperty('v_mode_triggered');
    expect(result).toHaveProperty('emergency_detected');
    expect(result).toHaveProperty('primary_vertical');
  });

  (HAS_API_KEY ? it : it.skip)('initializes with embeddings when API key present', async () => {
    const detector = new SOTADetector({ debug: true });
    await detector.initialize();

    expect(detector.isInitialized()).toBe(true);
  });
});

// ============================================
// CRITICAL CASE TESTS
// ============================================

describe('SOTA Detector - Critical Cases', () => {
  const criticalCases = [
    // V_MODE should trigger
    { input: "Non so cosa voglio dalla vita", lang: 'it' as SupportedLanguage, expected_vmode: true, expected_emergency: false },
    { input: "What is the meaning of my existence?", lang: 'en' as SupportedLanguage, expected_vmode: true, expected_emergency: false },
    { input: "Qual è il punto?", lang: 'it' as SupportedLanguage, expected_vmode: true, expected_emergency: false },

    // V_MODE should NOT trigger (work context)
    { input: "What's the point of this meeting?", lang: 'en' as SupportedLanguage, expected_vmode: false, expected_emergency: false },

    // EMERGENCY should trigger
    { input: "Non riesco a respirare, ho il cuore che batte fortissimo", lang: 'it' as SupportedLanguage, expected_vmode: false, expected_emergency: true },

    // EMERGENCY should NOT trigger (romantic)
    { input: "Mi batte forte il cuore quando ti vedo", lang: 'it' as SupportedLanguage, expected_vmode: false, expected_emergency: false },

    // EMERGENCY should NOT trigger (colloquial)
    { input: "Sto morendo dal ridere!", lang: 'it' as SupportedLanguage, expected_vmode: false, expected_emergency: false },

    // EMERGENCY should NOT trigger (existential fear)
    { input: "Ho paura di fare la scelta sbagliata", lang: 'it' as SupportedLanguage, expected_vmode: true, expected_emergency: false },
  ];

  (HAS_API_KEY ? describe : describe.skip)('with embeddings', () => {
    let detector: SOTADetector;

    beforeAll(async () => {
      detector = await getSOTADetector({ debug: true });
    });

    for (const testCase of criticalCases) {
      it(`correctly classifies: "${testCase.input.substring(0, 40)}..."`, async () => {
        const result = await detector.detect(testCase.input, testCase.lang);

        console.log(`\nInput: "${testCase.input}"`);
        console.log(`Expected: v_mode=${testCase.expected_vmode}, emergency=${testCase.expected_emergency}`);
        console.log(`Actual: v_mode=${result.v_mode_triggered}, emergency=${result.emergency_detected}`);
        console.log(`Primary vertical: ${result.primary_vertical}`);

        if (testCase.expected_vmode !== undefined) {
          expect(result.v_mode_triggered).toBe(testCase.expected_vmode);
        }
        if (testCase.expected_emergency !== undefined) {
          expect(result.emergency_detected).toBe(testCase.expected_emergency);
        }
      });
    }
  });
});

// ============================================
// BENCHMARK COMPARISON
// ============================================

describe('SOTA Detector - Benchmark', () => {
  (HAS_API_KEY ? it : it.skip)('outperforms regex baseline', async () => {
    const detector = await getSOTADetector();

    console.log('\n=== SOTA DETECTOR BENCHMARK ===\n');

    // Run SOTA detector on all benchmark cases
    const sotaResults: Array<{
      case_: typeof BENCHMARK_CASES[0];
      actual: DimensionalState;
      latency_ms: number;
      correct: boolean;
      v_mode_correct: boolean;
      emergency_correct: boolean;
      vertical_correct: boolean;
    }> = [];

    const regexResults: typeof sotaResults = [];

    for (const case_ of BENCHMARK_CASES) {
      // SOTA
      const sotaStart = performance.now();
      const sotaActual = await detector.detect(case_.input, case_.lang);
      const sotaLatency = performance.now() - sotaStart;

      const sotaVModeCorrect = case_.expected.v_mode === sotaActual.v_mode_triggered;
      const sotaEmergencyCorrect = case_.expected.emergency === sotaActual.emergency_detected;
      const sotaVerticalCorrect = case_.expected.primary_vertical === sotaActual.primary_vertical;
      const sotaCorrect = sotaVModeCorrect && sotaEmergencyCorrect && sotaVerticalCorrect;

      sotaResults.push({
        case_,
        actual: sotaActual,
        latency_ms: sotaLatency,
        correct: sotaCorrect,
        v_mode_correct: sotaVModeCorrect,
        emergency_correct: sotaEmergencyCorrect,
        vertical_correct: sotaVerticalCorrect,
      });

      // Regex baseline
      const regexStart = performance.now();
      const regexActual = dimensionalDetector.detect(case_.input, case_.lang);
      const regexLatency = performance.now() - regexStart;

      const regexVModeCorrect = case_.expected.v_mode === regexActual.v_mode_triggered;
      const regexEmergencyCorrect = case_.expected.emergency === regexActual.emergency_detected;
      const regexVerticalCorrect = case_.expected.primary_vertical === regexActual.primary_vertical;
      const regexCorrect = regexVModeCorrect && regexEmergencyCorrect && regexVerticalCorrect;

      regexResults.push({
        case_,
        actual: regexActual,
        latency_ms: regexLatency,
        correct: regexCorrect,
        v_mode_correct: regexVModeCorrect,
        emergency_correct: regexEmergencyCorrect,
        vertical_correct: regexVerticalCorrect,
      });
    }

    const sotaMetrics = computeMetrics(sotaResults);
    const regexMetrics = computeMetrics(regexResults);

    // Print comparison
    console.log('╔═══════════════════════════════════════════════════════════════════════╗');
    console.log('║                    BENCHMARK COMPARISON                               ║');
    console.log('╠═══════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Metric           │   REGEX      │   SOTA        │   Δ               ║`);
    console.log('╠═══════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Accuracy         │   ${(regexMetrics.accuracy * 100).toFixed(0).padStart(4)}%      │   ${(sotaMetrics.accuracy * 100).toFixed(0).padStart(4)}%       │   ${((sotaMetrics.accuracy - regexMetrics.accuracy) * 100).toFixed(0).padStart(4)}%           ║`);
    console.log(`║  V_MODE F1        │   ${(regexMetrics.v_mode_f1 * 100).toFixed(0).padStart(4)}%      │   ${(sotaMetrics.v_mode_f1 * 100).toFixed(0).padStart(4)}%       │   ${((sotaMetrics.v_mode_f1 - regexMetrics.v_mode_f1) * 100).toFixed(0).padStart(4)}%           ║`);
    console.log(`║  Emergency F1     │   ${(regexMetrics.emergency_f1 * 100).toFixed(0).padStart(4)}%      │   ${(sotaMetrics.emergency_f1 * 100).toFixed(0).padStart(4)}%       │   ${((sotaMetrics.emergency_f1 - regexMetrics.emergency_f1) * 100).toFixed(0).padStart(4)}%           ║`);
    console.log(`║  Latency P95      │   ${regexMetrics.p95_latency_ms.toFixed(0).padStart(5)}ms    │   ${sotaMetrics.p95_latency_ms.toFixed(0).padStart(5)}ms     │   ${(sotaMetrics.p95_latency_ms - regexMetrics.p95_latency_ms).toFixed(0).padStart(5)}ms        ║`);
    console.log('╚═══════════════════════════════════════════════════════════════════════╝');

    console.log('\n=== SOTA DETAILED RESULTS ===');
    console.log(`Accuracy: ${(sotaMetrics.accuracy * 100).toFixed(1)}% (${sotaMetrics.correct}/${sotaMetrics.total_cases})`);
    console.log(`V_MODE: P=${(sotaMetrics.v_mode_precision * 100).toFixed(0)}% R=${(sotaMetrics.v_mode_recall * 100).toFixed(0)}% F1=${(sotaMetrics.v_mode_f1 * 100).toFixed(0)}%`);
    console.log(`Emergency: P=${(sotaMetrics.emergency_precision * 100).toFixed(0)}% R=${(sotaMetrics.emergency_recall * 100).toFixed(0)}% F1=${(sotaMetrics.emergency_f1 * 100).toFixed(0)}%`);

    // SOTA should outperform regex
    expect(sotaMetrics.accuracy).toBeGreaterThanOrEqual(regexMetrics.accuracy);
    expect(sotaMetrics.v_mode_f1).toBeGreaterThanOrEqual(regexMetrics.v_mode_f1 * 0.9); // Allow 10% margin

  }, 300000); // 5 minute timeout
});

// ============================================
// QUICK SANITY CHECK (no API key needed)
// ============================================

describe('SOTA Detector - Sanity Check', () => {
  it('falls back to regex when no API key', async () => {
    // Temporarily unset API key
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    resetSOTADetector();
    const detector = new SOTADetector();

    const result = await detector.detect('Non so cosa voglio dalla vita', 'it');

    // Should still return a valid result (from regex fallback)
    expect(result).toHaveProperty('v_mode_triggered');
    expect(result).toHaveProperty('emergency_detected');

    // Restore
    if (originalKey) {
      process.env.OPENAI_API_KEY = originalKey;
    }
  });
});
