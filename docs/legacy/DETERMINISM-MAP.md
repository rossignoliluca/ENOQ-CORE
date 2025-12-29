# ENOQ DETERMINISM MAP v1.0

**Document ID:** ENOQ-DETERMINISM-MAP  
**Status:** Core Technical Reference  
**Date:** 2025-12-25  
**Purpose:** Define what is deterministic vs probabilistic in ENOQ  

---

## The Problem

LLMs are stochastic. The OS assumes deterministic state transitions.

**Resolution:** Separate deterministic components from probabilistic ones. Use deterministic gates to bound probabilistic behavior.

---

## The Classification

| Component | Nature | Implementation | Rationale |
|-----------|--------|----------------|-----------|
| S0 PERMIT | **DETERMINISTIC** | Rule-based + classifier | Gate must be reliable |
| S1 SENSE | **PROBABILISTIC** | LLM with confidence | Perception is inherently fuzzy |
| S2 CLARIFY | **HYBRID** | Rules trigger, LLM generates | Bounded uncertainty |
| S3 PLAN (select) | **DETERMINISTIC** | Matrix lookup | Given FieldModel, runtime is determined |
| S3 PLAN (generate) | **PROBABILISTIC** | LLM generates | New runtimes need validation |
| S4 ACT | **PROBABILISTIC** | LLM executes | Output generation is stochastic |
| S5 VERIFY | **HYBRID** | Rules + classifier | Must catch violations reliably |
| S6 STOP | **DETERMINISTIC** | Pure logic | Termination must be certain |

---

## Deterministic Components (Must Be Reliable)

### S0 PERMIT — The Gate

```yaml
s0_implementation:
  crisis_detection:
    method: "Keyword + regex + fine-tuned classifier"
    determinism: "Classifier has fixed weights; same input → same output"
    fallback: "If uncertain, escalate to human review"
    
  injection_detection:
    method: "Pattern matching + embedding similarity"
    determinism: "Fixed patterns; same input → same match"
    
  intent_classification:
    method: "Fine-tuned classifier (not base LLM)"
    classes: [operational, normative, mixed, crisis]
    determinism: "Fixed model; temperature=0"
    confidence_threshold: 0.8
    below_threshold: "Default to CLARIFY"
    
  constitutional_check:
    method: "Rule-based pattern matching"
    patterns: [explicit_harm, illegal_request, ...]
    determinism: "Pure regex/rules"
```

### S3 PLAN (Selection) — The Router

```yaml
s3_selection:
  method: "Lookup matrix"
  input: "FieldModel (even if probabilistically generated)"
  output: "RuntimeID + parameters"
  determinism: |
    Given the SAME FieldModel, ALWAYS returns SAME runtime.
    The FieldModel may vary (S1 is probabilistic).
    But S3 selection is deterministic given its input.
    
  matrix: "See FIELD-TO-RUNTIME.md"
```

### S6 STOP — The Terminator

```yaml
s6_implementation:
  trigger: "S5 returns PASS"
  actions:
    - deliver_output()      # Pure function
    - update_memory()       # Deterministic rules
    - release_control()     # Set state to IDLE
  determinism: "Pure logic, no LLM"
```

---

## Probabilistic Components (Bounded By Gates)

### S1 SENSE — The Perceiver

```yaml
s1_implementation:
  method: "LLM call with structured output"
  temperature: 0  # Reduces but doesn't eliminate variance
  
  output_structure:
    primary_domain: DomainID
    primary_domain_confidence: float  # 0-1
    secondary_domains: DomainID[]
    arousal: high | medium | low
    arousal_confidence: float
    depth_accessible: surface | medium | deep
    threshold_proximity: float  # 0-1
    threshold_confidence: float
    
  handling_uncertainty:
    - All fields have confidence scores
    - Low confidence → triggers S2 CLARIFY
    - Very low confidence → fallback to safe defaults
    
  variance_mitigation:
    - temperature: 0
    - structured output schema
    - retry with same input if output malformed (max 2)
    - cache recent identical inputs
```

### S4 ACT — The Executor

```yaml
s4_implementation:
  method: "LLM call with runtime-specific prompt"
  temperature: 0.3-0.7  # Varies by runtime
  
  variance_is_acceptable:
    reason: |
      Output variance in S4 is EXPECTED and OK.
      Two runs may produce different emails, different analyses.
      This is fine because S5 VERIFY checks compliance.
      
  bounds:
    - Must stay within runtime's allowed_tools
    - Must not violate Constitution
    - Must meet completion criteria
```

---

## Hybrid Components (Rules + Probabilistic)

### S5 VERIFY — The Checker

```yaml
s5_implementation:
  layer_1_deterministic:
    method: "Rule-based checks"
    checks:
      - output_not_empty
      - output_format_valid
      - no_forbidden_patterns (regex)
      - length_within_bounds
    determinism: "Pure rules"
    
  layer_2_probabilistic:
    method: "Fine-tuned classifier"
    checks:
      - normative_delegation_score < 0.3
      - constitutional_compliance_score > 0.7
    determinism: "Fixed model, temperature=0"
    
  layer_3_optional:
    method: "LLM semantic check"
    when: "High-stakes output flagged"
    determinism: "Probabilistic but bounded by L1+L2"
    
  decision_logic:
    if layer_1_fails: REJECT (deterministic)
    if layer_2_fails: REJECT (high confidence)
    if layer_2_uncertain AND layer_3_fails: REJECT
    else: PASS
```

---

## The Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   DETERMINISTIC GATES bound PROBABILISTIC COMPONENTS            │
│                                                                 │
│   ┌─────────────┐                           ┌─────────────┐    │
│   │   S0 GATE   │ ────────────────────────► │   S6 STOP   │    │
│   │(deterministic)                          │(deterministic)   │
│   └──────┬──────┘                           └──────▲──────┘    │
│          │                                         │           │
│          ▼                                         │           │
│   ┌──────────────────────────────────────────────┐ │           │
│   │                                              │ │           │
│   │   S1 ──► S2 ──► S3 ──► S4 ──► S5 ───────────┼─┘           │
│   │   (probabilistic zone, bounded)              │             │
│   │                                              │             │
│   └──────────────────────────────────────────────┘             │
│                                                                 │
│   Nothing enters without passing S0.                            │
│   Nothing exits without passing S5.                             │
│   Variance in the middle is acceptable and expected.           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Handling Same-Input Variance

### The Reality

Same input through S1 may produce slightly different FieldModels.
This is **acceptable** because:

1. The variance is bounded (confidence intervals)
2. S3 selection is robust to small variance (thresholds, not exact matches)
3. S5 catches outputs that violate invariants regardless of path

### The Guarantee

```yaml
guarantee:
  strong: |
    Constitutional violations will be caught with P > 0.99
    (deterministic rules + classifier ensemble)
    
  medium: |
    Similar inputs produce similar routing P > 0.90
    (bounded FieldModel variance)
    
  weak: |
    Exact same output for exact same input
    (NOT guaranteed, NOT required)
```

---

## Variables Reclassified

Per CTO critique, reclassify "strong variables" as hypotheses:

| Variable | Old Status | New Status | Confidence |
|----------|------------|------------|------------|
| primary_domain | Fact | Hypothesis | Medium-High |
| arousal | Fact | Signal | Low-Medium |
| kegan_stage | Fact | **Removed** | N/A |
| depth_accessible | Fact | Hypothesis | Medium |
| threshold_proximity | Fact | Heuristic | Low-Medium |

### Kegan Stage Removal

```yaml
kegan_removal:
  reason: |
    Kegan stage requires 1-2 hour structured interview.
    Cannot be estimated from conversation.
    Even experts have 70% inter-rater reliability.
    
  replacement: |
    Use observable proxies:
    - complexity_of_framing (simple/compound/paradox)
    - perspective_taking (self/other/system/meta)
    - ambiguity_tolerance (binary/spectrum/paradox)
    
  these_are_signals_not_stages: true
```

---

## Summary

| Component | Nature | Reliability | Variance OK? |
|-----------|--------|-------------|--------------|
| S0 | Deterministic | 99.9% | No |
| S1 | Probabilistic | 80-90% | Yes, bounded |
| S2 | Hybrid | 90% | Yes |
| S3 select | Deterministic | 99% | No |
| S3 generate | Probabilistic | 80% | Yes, validated |
| S4 | Probabilistic | N/A | Yes, expected |
| S5 | Hybrid | 95-99% | No |
| S6 | Deterministic | 100% | No |

**The system is probabilistic inside, deterministic at boundaries.**

---

*"You don't need determinism everywhere. You need it at the gates."*
