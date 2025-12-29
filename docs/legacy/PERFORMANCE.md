# ENOQ PERFORMANCE ARCHITECTURE v1.0

**Document ID:** ENOQ-PERFORMANCE  
**Status:** Core Architecture  
**Date:** 2025-12-25  
**Depends On:** OS-SPEC.md, RUNTIME-GENERATOR.md  

---

## EXECUTIVE SUMMARY

ENOQ generates runtimes dynamically. This could be slow.

It isn't.

Because runtime generation is the exception, not the rule. And when it happens, it's fast enough.

This document defines the performance architecture that makes infinite capability feel instant.

---

## PART I: THE CORE INSIGHT

### The Problem (If Done Wrong)

```
Naive implementation:

Input
  ↓
LLM: understand field         [500ms]
  ↓
LLM: generate runtime         [800ms]
  ↓
LLM: execute runtime          [600ms]
  ↓
LLM: verify output            [400ms]
  ↓
Output

Total: 2.3 seconds minimum
Every. Single. Request.

→ Unacceptable.
```

### The Solution

```
ENOQ is not LLM-driven end-to-end.
ENOQ is LLM-assisted, OS-driven.

The OS is deterministic.
The LLM is called only when needed.
Runtimes are generated rarely.
Everything else is fast.
```

---

## PART II: TWO PATHS

### Fast Path (90-95% of Requests)

```yaml
fast_path:
  description: "No runtime generation. Cached/core runtime used."
  
  flow:
    S0_PERMIT:
      method: deterministic rules
      latency: < 5ms
      
    S1_SENSE:
      method: lightweight LLM OR classifier
      latency: 100-200ms
      
    S3_PLAN:
      method: rule-based selection
      latency: < 10ms
      
    S4_ACT:
      method: execute cached/core runtime
      latency: 200-400ms
      
    S5_VERIFY:
      method: deterministic checks
      latency: < 20ms
      
    S6_STOP:
      method: format output
      latency: < 10ms
      
  total_latency: 300-650ms
  user_experience: instant
```

### Slow Path (5-10% of Requests)

```yaml
slow_path:
  description: "Runtime generation required."
  
  triggers:
    - task type never seen before
    - domain combination not in core runtimes
    - user explicitly requests novel capability
    - no cached runtime matches
    
  flow:
    S0_PERMIT:
      method: deterministic
      latency: < 5ms
      
    S1_SENSE:
      method: LLM
      latency: 150-250ms
      
    S3_PLAN:
      method: LLM generates runtime
      latency: 500-1000ms  # the expensive part
      
    VALIDATE:
      method: deterministic
      latency: < 20ms
      
    CACHE:
      method: store if valid
      latency: < 10ms
      
    S4_ACT:
      method: execute new runtime
      latency: 200-400ms
      
    S5_VERIFY:
      method: deterministic + LLM check
      latency: 100-200ms
      
    S6_STOP:
      method: format output
      latency: < 10ms
      
  total_latency: 1.0-2.0s
  user_experience: noticeable but acceptable
```

---

## PART III: WHY SLOW PATH IS RARE

### Runtime ≠ Code

A runtime is not:
- executable code
- complex workflow
- autonomous agent

A runtime is:
```yaml
runtime:
  id: HASH
  domain: [HUMAN_FIELD, CREATION]
  tools: [explore, structure, draft]
  constraints: [no_decide, require_confirmation]
  completion: [user_confirms]
```

**This is 200 bytes. Generating it is fast.**

### Most Requests Match Existing Runtimes

```yaml
runtime_coverage:
  core_runtimes:
    HUMAN_FIELD: "Most emotional/psychological work"
    DECISION: "Most decision support"
    EMAIL: "Most communication tasks"
    CODE: "Most technical tasks"
    DOCUMENT: "Most writing tasks"
    
  coverage: "90%+ of requests match a core runtime"
  
  remaining:
    - novel combinations
    - unusual tasks
    - explicit user request for new capability
```

### Caching Makes Slow Path One-Time

```yaml
caching:
  principle: "Generate once, use forever"
  
  levels:
    structural_cache:
      description: "Same domain + tools + constraints = same runtime"
      key: hash(domain, tools, constraints)
      hit_rate: high
      
    session_cache:
      description: "Runtime generated once per session, reused"
      lifetime: session
      hit_rate: very high for repeated tasks
      
    global_cache:
      description: "Good runtimes become de facto standards"
      promotion: runtimes used >N times
      effect: slow path becomes fast path
```

---

## PART IV: S1 SENSE OPTIMIZATION

### The Expensive Part of Fast Path

S1 SENSE is where the field model is built. This requires understanding.

### Optimization Strategy

```yaml
sense_optimization:
  tier_1_classifier:
    description: "Fast ML classifier for common patterns"
    latency: 10-30ms
    accuracy: 85%
    coverage: 70% of inputs
    
  tier_2_light_llm:
    description: "Small/fast LLM for remaining"
    latency: 100-150ms
    accuracy: 95%
    coverage: 25% of inputs
    
  tier_3_full_llm:
    description: "Full LLM for complex/ambiguous"
    latency: 200-300ms
    accuracy: 99%
    coverage: 5% of inputs
    
  routing:
    if classifier_confidence > 0.9: use tier_1
    elif classifier_confidence > 0.7: use tier_2
    else: use tier_3
```

### Refiners: Activate Only When Needed

```yaml
refiners:
  principle: "Activate only if changes action selection"
  
  base_perception:
    always_run: true
    output: coarse field model
    
  refiners:
    kegan_stage:
      cost: 50-100ms
      trigger: "only if response would differ by stage"
      
    somatic_detail:
      cost: 30-50ms
      trigger: "only if body work is candidate"
      
    systemic_frame:
      cost: 40-80ms
      trigger: "only if systemic intervention is candidate"
      
  savings: "Skip 70% of refiners on average request"
```

---

## PART V: CACHING ARCHITECTURE

### Three-Level Cache

```yaml
cache_architecture:
  L1_session:
    location: in-memory
    lifetime: session
    content: 
      - active runtime
      - field model updates
      - structural memory reads
    latency: < 1ms
    
  L2_user:
    location: distributed cache (Redis/etc)
    lifetime: persistent
    content:
      - generated runtimes for this user
      - structural memory
      - artifact index
    latency: 5-20ms
    
  L3_global:
    location: persistent store
    lifetime: indefinite
    content:
      - promoted runtimes (used globally)
      - core runtimes
    latency: 10-50ms
```

### Cache Key Strategy

```yaml
cache_keys:
  runtime_cache:
    key: hash(domain_set, tool_set, constraint_set)
    example: "HUMAN_FIELD+CREATION:explore,structure,draft:no_decide"
    
  field_model_cache:
    key: NOT CACHED
    reason: "Field model is request-specific"
    
  structural_memory:
    key: user_id
    format: compact counters/enums
```

### Cache Warming

```yaml
cache_warming:
  on_session_start:
    - load structural memory (L2 → L1)
    - load recent runtime hashes (L2 → L1)
    
  on_first_request:
    - no cold start penalty (already warmed)
```

---

## PART VI: RUNTIME VALIDATION PERFORMANCE

### Validation is O(1)

```yaml
validation_performance:
  constitutional_checks:
    no_normative_delegation: "Check tool list against blacklist"
    no_dependency_creation: "Check completion criteria"
    explicit_completion: "Check field exists"
    rubicon_respected: "Check tool list against Rubicon list"
    
  implementation:
    - all checks are set membership or field presence
    - no LLM involved
    - no parsing
    
  latency: < 20ms total
```

### Validation Failure Recovery

```yaml
validation_failure:
  if_correctable:
    - auto-correct (e.g., add user_confirmation)
    - re-validate
    - max 2 attempts
    - latency: +50-100ms
    
  if_not_correctable:
    - return helpful error
    - suggest alternative
    - latency: 0 (fail fast)
```

---

## PART VII: WORST CASE ANALYSIS

### Absolute Worst Case

```yaml
worst_case:
  scenario: |
    - New task never seen
    - Runtime generation fails first attempt
    - Correction needed
    - Full verification with LLM
    
  breakdown:
    S0_PERMIT: 5ms
    S1_SENSE_full: 300ms
    S3_PLAN_generate: 1000ms
    VALIDATE_fail: 20ms
    S3_PLAN_regenerate: 800ms
    VALIDATE_pass: 20ms
    S4_ACT: 400ms
    S5_VERIFY_with_llm: 300ms
    S6_STOP: 10ms
    
  total: ~2.9s
  
  frequency: < 1% of requests
  acceptability: acceptable for complex/novel tasks
```

### Comparison to Current Systems

```yaml
comparison:
  chatgpt_typical: 2-5s
  claude_typical: 2-4s
  
  enoq_fast_path: 300-650ms
  enoq_slow_path: 1.0-2.0s
  enoq_worst_case: ~3s
  
  conclusion: |
    ENOQ is faster on average.
    ENOQ is comparable on worst case.
    ENOQ provides guarantees they don't.
```

---

## PART VIII: UX FOR SLOW PATH

### Transparency, Not Silence

When slow path triggers, ENOQ communicates:

```yaml
slow_path_ux:
  principle: "Transparency increases trust"
  
  messages:
    novel_task: "This is new. Let me think about the right way to help."
    generating: "Building something specific for this..."
    validating: "Making sure this is right..."
    
  timing:
    show_message_after: 500ms
    update_message_every: 1s (if still running)
    
  effect: |
    User understands the delay.
    Delay feels purposeful, not broken.
    Trust increases.
```

### Progress Indication

```yaml
progress_ux:
  show:
    - "Understanding what you need..." (S1)
    - "Preparing the right approach..." (S3)
    - "Working on it..." (S4)
    - "Checking everything..." (S5)
    
  don't_show:
    - technical details
    - internal state names
    - error counts
```

---

## PART IX: SCALING CONSIDERATIONS

### Per-User Load

```yaml
per_user:
  expected_requests: 10-50 per session
  expected_sessions: 1-3 per day
  peak_concurrent: low (single user = single thread)
  
  memory_per_user:
    structural: < 1KB
    session_cache: < 100KB
    
  compute_per_request:
    fast_path: ~0.1 LLM calls equivalent
    slow_path: ~2.0 LLM calls equivalent
```

### System Load

```yaml
system_scaling:
  stateless_os: scales horizontally
  cache_layer: Redis cluster or equivalent
  llm_calls: managed via API rate limits
  
  bottleneck: LLM API (external)
  mitigation: caching + fast path + smart routing
```

---

## PART X: PERFORMANCE INVARIANTS

```yaml
invariants:
  - id: PERF-001
    rule: "Fast path must complete in < 700ms p95"
    enforcement: monitoring + alerting
    
  - id: PERF-002
    rule: "Slow path must complete in < 2.5s p95"
    enforcement: monitoring + alerting
    
  - id: PERF-003
    rule: "No request may take > 5s without user communication"
    enforcement: timeout + progress message
    
  - id: PERF-004
    rule: "Validation must complete in < 50ms"
    enforcement: O(1) algorithms only
    
  - id: PERF-005
    rule: "Cache hit must add < 5ms latency"
    enforcement: in-memory L1 for hot path
```

---

## SUMMARY

```yaml
summary:
  principle: "LLM-assisted, OS-driven"
  
  fast_path:
    frequency: 90-95%
    latency: 300-650ms
    experience: instant
    
  slow_path:
    frequency: 5-10%
    latency: 1.0-2.0s
    experience: noticeable but acceptable
    
  key_insights:
    - runtime generation is rare
    - runtime validation is O(1)
    - caching makes slow path one-time
    - transparency makes delay acceptable
    
  result: |
    Infinite capability.
    Instant feel.
    No compromise.
```

---

*"Fast is not about doing less. Fast is about knowing when not to do."*
