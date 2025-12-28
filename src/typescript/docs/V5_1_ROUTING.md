# V5.1 Unified Routing System

## Overview

ENOQ v5.1 introduces **Unified Gating**, a single routing point that combines three gating strategies for optimal LLM call reduction while maintaining 100% V_MODE recall.

**Key Results:**
- **31% LLM call rate** on realistic traffic (69% skip)
- **0 missed** V_MODE or emergency cases
- **100% call reduction** on cache replay

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INPUT MESSAGE                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              FAST REGEX DETECTOR (~1-5ms)                   │
│  - DimensionalDetector.detect()                             │
│  - Extracts: v_mode_triggered, emergency_detected           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  UNIFIED GATING (~1ms)                      │
│              unified_gating.ts                              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ STAGE 0: SAFETY INVARIANTS                            │  │
│  │   - emergency_detected → BYPASS (no LLM needed)       │  │
│  │   - v_mode_triggered → BYPASS (regex confident)       │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ STAGE 1: CACHE LOOKUP                                 │  │
│  │   - Hash(message + language) → cached LLM result?     │  │
│  │   - HIT → use cached, skip LLM                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ STAGE 2: HARD SKIP RULES                              │  │
│  │   - Factual questions ("What time is it?")            │  │
│  │   - Operational requests ("Run the tests")            │  │
│  │   - Acknowledgments ("ok", "thanks", "capito")        │  │
│  │   - Greetings ("hello", "ciao", "buongiorno")         │  │
│  │   - ANTI-SKIP: blocks skip if existential markers     │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ STAGE 3: NP GATING (Neyman-Pearson)                   │  │
│  │   - A(x) = lexicon_boost + vertical_score + entropy   │  │
│  │   - A(x) > τ (0.85) → CALL LLM                        │  │
│  │   - A(x) ≤ τ → SKIP LLM                               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  call_llm = false       │     │  call_llm = true        │
│  Use regex result       │     │  Ultimate Detector      │
│  (or cached result)     │     │  (200-500ms)            │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              │                               ▼
              │                 ┌─────────────────────────┐
              │                 │  CACHE RESULT           │
              │                 │  Store for future use   │
              │                 └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
                  ┌─────────────────────────┐
                  │  DIMENSIONAL STATE      │
                  │  + PIPELINE CONTINUES   │
                  └─────────────────────────┘
```

## Key Components

### 1. Unified Gating (`unified_gating.ts`)

Single entry point that combines all gating strategies:

```typescript
interface UnifiedGatingDecision {
  call_llm: boolean;        // Should we call LLM?
  stage: 'safety' | 'cache' | 'hard_skip' | 'np_gating';
  reason: SkipReason;       // Detailed reason code
  np_score: number | null;  // NP score if applicable
  cached_result: RegimeClassification | null;
}
```

**Reason Codes:**
| Code | Stage | Meaning |
|------|-------|---------|
| `EMERGENCY_BYPASS` | safety | Emergency detected, no LLM needed |
| `V_MODE_TRIGGERED` | safety | V_MODE from regex, no LLM needed |
| `CACHE_HIT` | cache | Previously computed result available |
| `HARD_SKIP_FACTUAL` | hard_skip | Factual question (weather, time) |
| `HARD_SKIP_OPERATIONAL` | hard_skip | Operational request (run, config) |
| `HARD_SKIP_ACKNOWLEDGMENT` | hard_skip | Simple ack (ok, thanks) |
| `HARD_SKIP_GREETING` | hard_skip | Greeting (hello, ciao) |
| `NP_SKIP` | np_gating | Low existential score (A(x) ≤ τ) |
| `NP_CALL` | np_gating | High existential score (A(x) > τ) |

### 2. Hard Skip Rules

Very conservative patterns that only skip when certain:

```typescript
// SKIP patterns (high confidence)
/^(what|che)\s*(time|ora)\s*(is it|è)?\??$/i  // Factual: time
/^(hi|hello|ciao|buongiorno)\.?$/i            // Greeting
/^(ok|yes|thanks|grazie|capito)\.?$/i         // Acknowledgment
/^(run|start|build|deploy)\s+/i               // Operational

// ANTI-SKIP patterns (block skip if matched)
/meaning|senso|purpose|scopo|point|punto/i    // Existential
/\bi\s*can'?t\b/i                             // Crisis indicator
/\bbasta\b/i                                  // Ambiguous IT
/non\s+(posso|riesco)/i                       // IT crisis
```

**Principle:** "When in doubt, don't skip"

### 3. NP Gating (`np_gating.ts`)

Neyman-Pearson constrained classification for V_MODE detection:

```
A(x) = lexicon_boost(x) + vertical_score(x) + entropy_term(x)
```

| Component | Source | Weight |
|-----------|--------|--------|
| `lexicon_boost` | existential_lexicon.ts | 0-0.5 |
| `vertical_score` | DimensionalState.vertical.EXISTENTIAL | 0-1 |
| `entropy_term` | Uncertainty from dimensional detection | 0-0.3 |

**Threshold:** τ = 0.85 (calibrated for 100% V_MODE recall)

### 4. LLM Detector Cache (`llm_cache.ts`)

Hash-based caching with semantic awareness:

```typescript
interface CacheConfig {
  max_size: number;      // LRU eviction (default: 1000)
  ttl_ms: number;        // Time-to-live (default: 24h)
  enabled: boolean;
}
```

**Cache Key:** `SHA256(normalize(message) + language)`

## Invariants

These are **NEVER violated**:

1. **Emergency Safety**
   - `emergency_detected` → BYPASS (never calls LLM)
   - Reason: Grounding response needed immediately

2. **V_MODE Safety**
   - `v_mode_triggered` (by regex) → BYPASS (never calls LLM)
   - Reason: Regex is confident, LLM would agree

3. **Anti-Skip Safety**
   - If message matches `ANTI_SKIP_PATTERNS` → never hard skip
   - Reason: Short phrases like "basta", "I can't" are dangerous

4. **Cache Integrity**
   - Cached results preserve V_MODE/emergency flags
   - Reason: Safety-critical flags must persist

## Benchmark Results

### Benchmark 1: Original 50 Cases (Safety-Heavy)

| Metric | Value |
|--------|-------|
| Total cases | 50 |
| LLM calls | 36 (72%) |
| Emergency bypasses | 5 |
| V_MODE bypasses | 4 |
| Hard skips | 1 |
| NP skips | 4 |
| **V_MODE missed** | **0** |
| **Emergency missed** | **0** |

*Note: 72% call rate expected on existential-heavy dataset*

### Benchmark 2: Realistic 100 Cases

Distribution: 30% greeting/ack, 30% factual/operational, 20% delegation, 10% existential, 10% emergency

| Metric | Value |
|--------|-------|
| Total cases | 100 |
| LLM calls | 31 (31%) |
| **Skip rate** | **69%** |
| Emergency bypasses | 4 |
| V_MODE bypasses | 3 |
| Cache hits | 0 (cold) |
| Hard skips | 52 |
| NP skips | 10 |

**By Category:**
| Category | Skip Rate |
|----------|-----------|
| greeting | 90% |
| acknowledgment | 100% |
| short | 80% |
| factual | 67% |
| operational | 100% |
| delegation | 35% |
| existential | 30% |
| emergency | 70% |

### Benchmark 3: Cache Replay

| Metric | Pass 1 | Pass 2 |
|--------|--------|--------|
| Test cases | 30 | 30 |
| LLM calls | 3 | 0 |
| Cache hits | 0 | 3 |
| **Call reduction** | - | **100%** |

## Telemetry

Every turn includes gating telemetry in the trace:

```typescript
trace.s1_unified_gating = {
  call_llm: boolean;      // Did we call LLM?
  stage: string;          // Which stage decided
  reason: SkipReason;     // Detailed reason code
  np_score: number|null;  // NP gating score
  latency_ms: number;     // Gating decision time
};
```

**Debug Output Example:**
```
[UNIFIED_GATING] HARD_SKIP_GREETING → call_llm=false (1ms)
[UNIFIED_GATING] NP_CALL → call_llm=true (2ms)
[UNIFIED_GATING]   NP score: 92%
```

## Configuration

```typescript
const config: PipelineConfig = {
  use_unified_gating: true,      // Enable v5.1 routing
  unified_gating_debug: false,   // Log gating decisions
  // ... other config
};
```

To disable unified gating (fall back to always-LLM):
```typescript
{ use_unified_gating: false }
```

## Files

| File | Purpose |
|------|---------|
| `unified_gating.ts` | Main gating router |
| `np_gating.ts` | Neyman-Pearson classifier |
| `existential_lexicon.ts` | Meaning-collapse markers |
| `llm_cache.ts` | Result caching |
| `benchmark_cases_realistic.ts` | 100 realistic test cases |
| `__tests__/unified_gating.test.ts` | 40 unit tests |
| `__tests__/unified_gating_v51.test.ts` | 15 validation tests |

## Migration from v4.0

v5.1 is backward compatible. Key changes:

1. **ScientificGating → UnifiedGating**
   - `UnifiedGating` wraps `NPGating` (which replaced Chow's Rule)
   - Adds hard skip layer before NP gating
   - Same safety invariants

2. **Pipeline Integration**
   - Now integrated at `pipeline.ts` line ~946
   - Single decision point before `ultimateDetector.detect()`

3. **Trace Field**
   - New: `trace.s1_unified_gating`
   - Replaces implicit gating info
