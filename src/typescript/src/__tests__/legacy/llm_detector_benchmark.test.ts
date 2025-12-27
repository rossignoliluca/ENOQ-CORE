/**
 * LLM DETECTOR BENCHMARK TEST
 *
 * Compares LLM-powered detector against regex baseline using the same 50 cases.
 *
 * Run with: LLM_TEST=true npx jest llm_detector_benchmark --testTimeout=120000
 *
 * Environment variables required:
 * - ANTHROPIC_API_KEY: For Haiku/Sonnet
 * - OPENAI_API_KEY: For GPT-4o-mini
 */

import { LLMDetector, isLLMAvailable, getAvailableModels, LLMDetectorModel } from '../llm_detector';
import { dimensionalDetector, DimensionalState } from '../dimensional_system';
import { BENCHMARK_CASES, BenchmarkCase, computeMetrics, BenchmarkMetrics } from './detector_benchmark.test';
import { SupportedLanguage } from '../types';

// ============================================
// SKIP IF NO API KEYS OR NOT LLM_TEST
// ============================================

const RUN_LLM_TESTS = process.env.LLM_TEST === 'true';

// ============================================
// ASYNC BENCHMARK RUNNER FOR LLM
// ============================================

interface LLMBenchmarkResult {
  case_: BenchmarkCase;
  actual: DimensionalState;
  latency_ms: number;
  correct: boolean;
  v_mode_correct: boolean;
  emergency_correct: boolean;
  vertical_correct: boolean;
  source: 'llm' | 'regex';
  reasoning?: string;
}

async function runLLMBenchmark(
  detector: LLMDetector,
  detectorName: string,
  sessionContext?: string[]
): Promise<BenchmarkMetrics & { llm_results: LLMBenchmarkResult[] }> {
  const results: LLMBenchmarkResult[] = [];
  let llmCallCount = 0;
  let regexFallbackCount = 0;

  console.log(`\nRunning ${detectorName} on ${BENCHMARK_CASES.length} cases...`);

  for (const case_ of BENCHMARK_CASES) {
    try {
      const result = await detector.detect(case_.input, case_.lang, sessionContext);
      const actual = result.state;

      const v_mode_correct = case_.expected.v_mode === actual.v_mode_triggered;
      const emergency_correct = case_.expected.emergency === actual.emergency_detected;
      const vertical_correct = case_.expected.primary_vertical === actual.primary_vertical;
      const correct = v_mode_correct && emergency_correct && vertical_correct;

      if (result.source === 'llm') {
        llmCallCount++;
      } else {
        regexFallbackCount++;
      }

      results.push({
        case_,
        actual,
        latency_ms: result.latency_ms,
        correct,
        v_mode_correct,
        emergency_correct,
        vertical_correct,
        source: result.source
      });

      // Progress indicator
      if (results.length % 10 === 0) {
        console.log(`  Processed ${results.length}/${BENCHMARK_CASES.length} cases...`);
      }
    } catch (error) {
      console.error(`Error on case ${case_.id}: ${error}`);
      // Fallback to regex on error
      const actual = dimensionalDetector.detect(case_.input, case_.lang);
      results.push({
        case_,
        actual,
        latency_ms: 0,
        correct: false,
        v_mode_correct: case_.expected.v_mode === actual.v_mode_triggered,
        emergency_correct: case_.expected.emergency === actual.emergency_detected,
        vertical_correct: case_.expected.primary_vertical === actual.primary_vertical,
        source: 'regex'
      });
      regexFallbackCount++;
    }
  }

  console.log(`  LLM calls: ${llmCallCount}, Regex fallbacks: ${regexFallbackCount}`);

  // Convert to format expected by computeMetrics
  const metricsInput = results.map(r => ({
    case_: r.case_,
    actual: r.actual,
    latency_ms: r.latency_ms,
    correct: r.correct,
    v_mode_correct: r.v_mode_correct,
    emergency_correct: r.emergency_correct,
    vertical_correct: r.vertical_correct
  }));

  const metrics = computeMetrics(metricsInput);
  printLLMMetricsReport(metrics, detectorName, llmCallCount, regexFallbackCount);

  return { ...metrics, llm_results: results };
}

function printLLMMetricsReport(
  metrics: BenchmarkMetrics,
  detectorName: string,
  llmCallCount: number,
  regexFallbackCount: number
): void {
  console.log('\n' + '═'.repeat(75));
  console.log(`LLM BENCHMARK RESULTS: ${detectorName}`);
  console.log('═'.repeat(75));

  console.log(`\nOVERALL ACCURACY: ${(metrics.accuracy * 100).toFixed(1)}% (${metrics.correct}/${metrics.total_cases})`);
  console.log(`Vertical Dimension Accuracy: ${(metrics.vertical_accuracy * 100).toFixed(1)}%`);
  console.log(`LLM Calls: ${llmCallCount}, Regex Fallbacks: ${regexFallbackCount}`);

  console.log('\n┌─ V_MODE DETECTION ─────────────────────────────────────────────────────┐');
  console.log(`│  Precision: ${(metrics.v_mode_precision * 100).toFixed(1)}%`);
  console.log(`│  Recall:    ${(metrics.v_mode_recall * 100).toFixed(1)}%`);
  console.log(`│  F1 Score:  ${(metrics.v_mode_f1 * 100).toFixed(1)}%`);
  console.log(`│  TP: ${metrics.v_mode_true_positives}, FP: ${metrics.v_mode_false_positives}, FN: ${metrics.v_mode_false_negatives}`);
  console.log('└─────────────────────────────────────────────────────────────────────────┘');

  console.log('\n┌─ EMERGENCY DETECTION ──────────────────────────────────────────────────┐');
  console.log(`│  Precision: ${(metrics.emergency_precision * 100).toFixed(1)}%`);
  console.log(`│  Recall:    ${(metrics.emergency_recall * 100).toFixed(1)}%`);
  console.log(`│  F1 Score:  ${(metrics.emergency_f1 * 100).toFixed(1)}%`);
  console.log(`│  TP: ${metrics.emergency_true_positives}, FP: ${metrics.emergency_false_positives}, FN: ${metrics.emergency_false_negatives}`);
  console.log('└─────────────────────────────────────────────────────────────────────────┘');

  console.log('\n┌─ LATENCY ──────────────────────────────────────────────────────────────┐');
  console.log(`│  Average: ${metrics.avg_latency_ms.toFixed(0)}ms`);
  console.log(`│  P50:     ${metrics.p50_latency_ms.toFixed(0)}ms`);
  console.log(`│  P95:     ${metrics.p95_latency_ms.toFixed(0)}ms`);
  console.log(`│  Max:     ${metrics.max_latency_ms.toFixed(0)}ms`);
  console.log('└─────────────────────────────────────────────────────────────────────────┘');

  console.log('\n┌─ BY CATEGORY ──────────────────────────────────────────────────────────┐');
  for (const [cat, data] of Object.entries(metrics.by_category)) {
    console.log(`│  ${cat.padEnd(25)} ${(data.accuracy * 100).toFixed(0)}% (${data.correct}/${data.total})`);
  }
  console.log('└─────────────────────────────────────────────────────────────────────────┘');

  console.log('\n┌─ BY DIFFICULTY ────────────────────────────────────────────────────────┐');
  for (const [diff, data] of Object.entries(metrics.by_difficulty)) {
    console.log(`│  ${diff.padEnd(10)} ${(data.accuracy * 100).toFixed(0)}% (${data.correct}/${data.total})`);
  }
  console.log('└─────────────────────────────────────────────────────────────────────────┘');

  if (metrics.failed_cases.length > 0 && metrics.failed_cases.length <= 15) {
    console.log('\n┌─ FAILED CASES ─────────────────────────────────────────────────────────┐');
    for (const f of metrics.failed_cases) {
      console.log(`│  ${f.id}: "${f.input.substring(0, 40)}..."`);
      console.log(`│    Expected: v_mode=${f.expected.v_mode}, emergency=${f.expected.emergency}, vertical=${f.expected.primary_vertical}`);
      console.log(`│    Actual:   v_mode=${f.actual.v_mode}, emergency=${f.actual.emergency}, vertical=${f.actual.primary_vertical}`);
      console.log(`│    Reason: ${f.reason}`);
    }
    console.log('└─────────────────────────────────────────────────────────────────────────┘');
  }

  console.log('═'.repeat(75) + '\n');
}

// ============================================
// COST ESTIMATION
// ============================================

interface CostEstimate {
  input_tokens: number;
  output_tokens: number;
  cost_per_1k_sessions: number;  // Assuming 10 turns per session
}

function estimateCosts(
  model: LLMDetectorModel,
  avgInputTokens: number = 650,
  avgOutputTokens: number = 150
): CostEstimate {
  // Pricing per million tokens (Dec 2024)
  const pricing: Record<LLMDetectorModel, { input: number; output: number }> = {
    'haiku': { input: 0.25, output: 1.25 },       // Claude Haiku 3.5
    'sonnet': { input: 3.00, output: 15.00 },     // Claude Sonnet 4
    'gpt-4o-mini': { input: 0.15, output: 0.60 }  // GPT-4o-mini
  };

  const p = pricing[model];
  const inputCost = (avgInputTokens / 1_000_000) * p.input;
  const outputCost = (avgOutputTokens / 1_000_000) * p.output;
  const costPerCall = inputCost + outputCost;

  // 1000 sessions × 10 turns = 10,000 calls
  const costPer1kSessions = costPerCall * 10_000;

  return {
    input_tokens: avgInputTokens,
    output_tokens: avgOutputTokens,
    cost_per_1k_sessions: costPer1kSessions
  };
}

function printCostComparison(): void {
  console.log('\n' + '═'.repeat(75));
  console.log('COST COMPARISON (per 1000 sessions, 10 turns each)');
  console.log('═'.repeat(75));

  const models: LLMDetectorModel[] = ['haiku', 'sonnet', 'gpt-4o-mini'];

  console.log('\n┌─────────────────────────────────────────────────────────────────────────┐');
  console.log('│  Model          │ Input Tokens │ Output Tokens │ Cost/1K Sessions       │');
  console.log('├─────────────────────────────────────────────────────────────────────────┤');

  for (const model of models) {
    const cost = estimateCosts(model);
    console.log(`│  ${model.padEnd(13)} │     ${cost.input_tokens.toString().padStart(5)}    │      ${cost.output_tokens.toString().padStart(5)}     │     $${cost.cost_per_1k_sessions.toFixed(2).padStart(6)}           │`);
  }

  // Hybrid scenario (30% LLM, 70% regex)
  const hybridCost30 = estimateCosts('haiku').cost_per_1k_sessions * 0.3;
  console.log(`│  Hybrid (30%)   │       N/A    │        N/A    │     $${hybridCost30.toFixed(2).padStart(6)}           │`);

  console.log('└─────────────────────────────────────────────────────────────────────────┘');
  console.log('═'.repeat(75) + '\n');
}

// ============================================
// COMPARISON TABLE
// ============================================

function printComparisonTable(
  results: Array<{ name: string; metrics: BenchmarkMetrics; cost?: CostEstimate }>
): void {
  console.log('\n' + '═'.repeat(90));
  console.log('DETECTOR COMPARISON SUMMARY');
  console.log('═'.repeat(90));

  console.log('\n┌───────────────────────────────────────────────────────────────────────────────────────┐');
  console.log('│  Detector       │ Accuracy │ V_MODE F1 │ EMER F1 │ P95 Latency │ Cost/1K Sessions   │');
  console.log('├───────────────────────────────────────────────────────────────────────────────────────┤');

  for (const r of results) {
    const costStr = r.cost ? `$${r.cost.cost_per_1k_sessions.toFixed(2)}` : '$0.00';
    console.log(`│  ${r.name.padEnd(14)} │  ${(r.metrics.accuracy * 100).toFixed(0).padStart(4)}%   │   ${(r.metrics.v_mode_f1 * 100).toFixed(0).padStart(4)}%   │  ${(r.metrics.emergency_f1 * 100).toFixed(0).padStart(4)}%  │    ${r.metrics.p95_latency_ms.toFixed(0).padStart(5)}ms   │      ${costStr.padStart(7)}        │`);
  }

  console.log('└───────────────────────────────────────────────────────────────────────────────────────┘');
  console.log('═'.repeat(90) + '\n');
}

// ============================================
// TESTS
// ============================================

describe('LLM Detector Benchmark', () => {
  const skipMessage = 'Set LLM_TEST=true and provide API keys to run LLM benchmarks';

  describe('Environment Check', () => {
    it('reports available models', () => {
      const available = getAvailableModels();
      console.log('\n=== AVAILABLE MODELS ===');
      console.log(`Haiku: ${isLLMAvailable('haiku') ? '✓ Available' : '✗ Missing ANTHROPIC_API_KEY'}`);
      console.log(`Sonnet: ${isLLMAvailable('sonnet') ? '✓ Available' : '✗ Missing ANTHROPIC_API_KEY'}`);
      console.log(`GPT-4o-mini: ${isLLMAvailable('gpt-4o-mini') ? '✓ Available' : '✗ Missing OPENAI_API_KEY'}`);
      console.log(`LLM_TEST=${process.env.LLM_TEST || 'not set'}`);
      console.log(`Available for testing: [${available.join(', ')}]`);

      // Always pass - this is just informational
      expect(true).toBe(true);
    });

    it('prints cost comparison', () => {
      printCostComparison();
      expect(true).toBe(true);
    });
  });

  describe('Haiku Benchmark', () => {
    (RUN_LLM_TESTS && isLLMAvailable('haiku') ? it : it.skip)(
      'runs full benchmark on Claude Haiku',
      async () => {
        const detector = new LLMDetector({
          model: 'haiku',
          temperature: 0.1,
          timeout_ms: 10000,
          debug: false
        });

        const metrics = await runLLMBenchmark(detector, 'Claude Haiku');

        // Basic assertions
        expect(metrics.total_cases).toBe(50);
        expect(metrics.accuracy).toBeGreaterThan(0.5);  // Should be better than random

        // Log for CI
        console.log('\nSUMMARY FOR CI (Haiku):');
        console.log(`haiku_accuracy=${(metrics.accuracy * 100).toFixed(1)}`);
        console.log(`haiku_v_mode_f1=${(metrics.v_mode_f1 * 100).toFixed(1)}`);
        console.log(`haiku_emergency_f1=${(metrics.emergency_f1 * 100).toFixed(1)}`);
        console.log(`haiku_latency_p95=${metrics.p95_latency_ms.toFixed(0)}`);
      },
      180000  // 3 minute timeout
    );
  });

  describe('GPT-4o-mini Benchmark', () => {
    (RUN_LLM_TESTS && isLLMAvailable('gpt-4o-mini') ? it : it.skip)(
      'runs full benchmark on GPT-4o-mini',
      async () => {
        const detector = new LLMDetector({
          model: 'gpt-4o-mini',
          temperature: 0.1,
          timeout_ms: 10000,
          debug: false
        });

        const metrics = await runLLMBenchmark(detector, 'GPT-4o-mini');

        expect(metrics.total_cases).toBe(50);
        expect(metrics.accuracy).toBeGreaterThan(0.5);

        console.log('\nSUMMARY FOR CI (GPT-4o-mini):');
        console.log(`gpt4omini_accuracy=${(metrics.accuracy * 100).toFixed(1)}`);
        console.log(`gpt4omini_v_mode_f1=${(metrics.v_mode_f1 * 100).toFixed(1)}`);
        console.log(`gpt4omini_emergency_f1=${(metrics.emergency_f1 * 100).toFixed(1)}`);
        console.log(`gpt4omini_latency_p95=${metrics.p95_latency_ms.toFixed(0)}`);
      },
      180000
    );
  });

  describe('Sonnet Benchmark', () => {
    (RUN_LLM_TESTS && isLLMAvailable('sonnet') ? it : it.skip)(
      'runs full benchmark on Claude Sonnet',
      async () => {
        const detector = new LLMDetector({
          model: 'sonnet',
          temperature: 0.1,
          timeout_ms: 15000,  // Sonnet is slower
          debug: false
        });

        const metrics = await runLLMBenchmark(detector, 'Claude Sonnet');

        expect(metrics.total_cases).toBe(50);
        expect(metrics.accuracy).toBeGreaterThan(0.6);  // Sonnet should be best

        console.log('\nSUMMARY FOR CI (Sonnet):');
        console.log(`sonnet_accuracy=${(metrics.accuracy * 100).toFixed(1)}`);
        console.log(`sonnet_v_mode_f1=${(metrics.v_mode_f1 * 100).toFixed(1)}`);
        console.log(`sonnet_emergency_f1=${(metrics.emergency_f1 * 100).toFixed(1)}`);
        console.log(`sonnet_latency_p95=${metrics.p95_latency_ms.toFixed(0)}`);
      },
      300000  // 5 minute timeout for Sonnet
    );
  });

  describe('Session Context Comparison', () => {
    (RUN_LLM_TESTS && isLLMAvailable('haiku') ? it : it.skip)(
      'compares stateless vs session context accuracy',
      async () => {
        // Run a subset with session context
        const detectorStateless = new LLMDetector({
          model: 'haiku',
          include_session_context: false
        });

        const detectorWithContext = new LLMDetector({
          model: 'haiku',
          include_session_context: true
        });

        // Simulated session context
        const sessionContext = [
          "Mi sento strano ultimamente",
          "Non riesco a concentrarmi",
          "Tutto sembra grigio"
        ];

        console.log('\n=== SESSION CONTEXT COMPARISON ===');
        console.log('Testing 10 cases with and without session context...\n');

        const statelessResults: boolean[] = [];
        const contextResults: boolean[] = [];

        // Test subset of existential cases (they benefit most from context)
        const testCases = BENCHMARK_CASES.filter(c =>
          c.category.startsWith('existential')
        ).slice(0, 10);

        for (const case_ of testCases) {
          const stateless = await detectorStateless.detect(case_.input, case_.lang);
          const withContext = await detectorWithContext.detect(case_.input, case_.lang, sessionContext);

          const statelessCorrect =
            case_.expected.v_mode === stateless.state.v_mode_triggered &&
            case_.expected.emergency === stateless.state.emergency_detected;

          const contextCorrect =
            case_.expected.v_mode === withContext.state.v_mode_triggered &&
            case_.expected.emergency === withContext.state.emergency_detected;

          statelessResults.push(statelessCorrect);
          contextResults.push(contextCorrect);

          console.log(`${case_.id}: Stateless=${statelessCorrect ? '✓' : '✗'}, WithContext=${contextCorrect ? '✓' : '✗'}`);
        }

        const statelessAcc = statelessResults.filter(x => x).length / statelessResults.length;
        const contextAcc = contextResults.filter(x => x).length / contextResults.length;

        console.log(`\nStateless accuracy: ${(statelessAcc * 100).toFixed(0)}%`);
        console.log(`With context accuracy: ${(contextAcc * 100).toFixed(0)}%`);
        console.log(`Delta: ${((contextAcc - statelessAcc) * 100).toFixed(0)}%`);

        expect(statelessResults.length).toBe(10);
        expect(contextResults.length).toBe(10);
      },
      120000
    );
  });

  describe('Full Comparison Report', () => {
    (RUN_LLM_TESTS ? it : it.skip)(
      'generates comprehensive comparison report',
      async () => {
        const results: Array<{ name: string; metrics: BenchmarkMetrics; cost?: CostEstimate }> = [];

        // Always run regex baseline
        console.log('\n=== RUNNING REGEX BASELINE ===');
        const regexResults: Array<{
          case_: BenchmarkCase;
          actual: DimensionalState;
          latency_ms: number;
          correct: boolean;
          v_mode_correct: boolean;
          emergency_correct: boolean;
          vertical_correct: boolean;
        }> = [];

        for (const case_ of BENCHMARK_CASES) {
          const start = performance.now();
          const actual = dimensionalDetector.detect(case_.input, case_.lang);
          const latency_ms = performance.now() - start;

          regexResults.push({
            case_,
            actual,
            latency_ms,
            correct: case_.expected.v_mode === actual.v_mode_triggered &&
                     case_.expected.emergency === actual.emergency_detected &&
                     case_.expected.primary_vertical === actual.primary_vertical,
            v_mode_correct: case_.expected.v_mode === actual.v_mode_triggered,
            emergency_correct: case_.expected.emergency === actual.emergency_detected,
            vertical_correct: case_.expected.primary_vertical === actual.primary_vertical
          });
        }

        const regexMetrics = computeMetrics(regexResults);
        results.push({ name: 'Regex', metrics: regexMetrics });

        // Run available LLM models
        const models: LLMDetectorModel[] = ['haiku', 'gpt-4o-mini', 'sonnet'];

        for (const model of models) {
          if (isLLMAvailable(model)) {
            console.log(`\n=== RUNNING ${model.toUpperCase()} ===`);
            const detector = new LLMDetector({
              model,
              temperature: 0.1,
              timeout_ms: model === 'sonnet' ? 15000 : 10000
            });

            const metrics = await runLLMBenchmark(detector, model);
            results.push({
              name: model,
              metrics,
              cost: estimateCosts(model)
            });
          }
        }

        // Print comparison table
        printComparisonTable(results);

        expect(results.length).toBeGreaterThanOrEqual(1);
      },
      600000  // 10 minute timeout for full comparison
    );
  });
});

// ============================================
// QUICK SINGLE-CASE TEST (for debugging)
// ============================================

describe('Quick LLM Test', () => {
  (RUN_LLM_TESTS && isLLMAvailable('haiku') ? it : it.skip)(
    'tests single case with Haiku',
    async () => {
      const detector = new LLMDetector({
        model: 'haiku',
        debug: true
      });

      const testCase = BENCHMARK_CASES.find(c => c.id === 'EX_SUBTLE_01');
      if (!testCase) {
        throw new Error('Test case not found');
      }

      console.log(`\nTesting: "${testCase.input}"`);
      console.log(`Expected: v_mode=${testCase.expected.v_mode}, emergency=${testCase.expected.emergency}`);

      const result = await detector.detect(testCase.input, testCase.lang);

      console.log(`\nResult:`);
      console.log(`  v_mode: ${result.state.v_mode_triggered}`);
      console.log(`  emergency: ${result.state.emergency_detected}`);
      console.log(`  primary_vertical: ${result.state.primary_vertical}`);
      console.log(`  latency: ${result.latency_ms.toFixed(0)}ms`);
      console.log(`  source: ${result.source}`);

      expect(result.source).toBe('llm');
    },
    30000
  );
});
