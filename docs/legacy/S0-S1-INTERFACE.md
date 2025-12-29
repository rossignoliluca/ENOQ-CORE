# ENOQ S0-S1 INTERFACE v1.0

**Document ID:** ENOQ-S0-S1-INTERFACE  
**Status:** Core Contract  
**Date:** 2025-12-25  
**Purpose:** Define integration between Gate-Runtime (S0) and ENOQ-CORE (S1+)  

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   GATE-RUNTIME (S0)                                             │
│   External service, pre-LLM classification                      │
│                                                                 │
│   Repository: github.com/rossignoliluca/gate-runtime            │
│   Spec: github.com/rossignoliluca/boundary-marker               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ GateOutput
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ENOQ-CORE (S1-S6)                                             │
│   This system                                                   │
│                                                                 │
│   Repository: github.com/rossignoliluca/ENOQ-CORE               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## S0 Output Contract

Gate-runtime produces:

```typescript
interface GateOutput {
  // Request identification
  request_id: string;
  timestamp: string;  // ISO8601
  input_hash: string;
  
  // Classification result
  signal: "D1_ACTIVE" | "D2_ACTIVE" | "D3_ACTIVE" | "D4_ACTIVE" | "NULL";
  halt: boolean;
  reason_code: string;
  
  // Original input (passed through)
  input_text: string;
  
  // Metadata
  marker_version: string;
  context_scope_id: string;
}
```

---

## S0 Domain Semantics

| Signal | Domain | Perturbation Type | Examples |
|--------|--------|-------------------|----------|
| `D1_ACTIVE` | Operational Continuity | Physical need, danger, resource lack | "I'm hungry", "I need help now", "Emergency" |
| `D2_ACTIVE` | Coordination | Agent coordination disruption | "Team conflict", "Miscommunication", "Alignment issue" |
| `D3_ACTIVE` | Operative Selection | Decision blockage, choice paralysis | "Should I X or Y?", "I can't decide", "Which is better?" |
| `D4_ACTIVE` | Boundary | Self/other confusion, intrusion | "I don't know who I am", "They're controlling me", "Lost myself" |
| `NULL` | None detected | No perturbation | Normal operational requests |

---

## S1 Input Contract

ENOQ-CORE S1 (SENSE) receives:

```typescript
interface S1Input {
  // From Gate-Runtime
  gate_output: GateOutput;
  
  // Computed by ENOQ entry point
  domain_prior: DomainPrior;
  intent_hint: IntentHint;
}

interface DomainPrior {
  primary_domains: DomainID[];    // Search these first
  secondary_domains: DomainID[];  // Search if primary inconclusive
  confidence: number;             // Trust level of S0 prior as routing bias, not truth (0.0-1.0)
}

interface IntentHint {
  likely_category: "operational" | "normative" | "mixed" | "crisis";
  delegation_risk: "low" | "medium" | "high";
  
  // CRITICAL: intent_hint is advisory only
  semantics: "warning_only";  // Raises caution level, does not determine routing
  binding: false;             // S1 can override based on deeper analysis
}
```

---

## The Mapping: D-Signal → Domain Prior

### D1_ACTIVE → Survival/Safety Prior

```yaml
D1_ACTIVE:
  name: "Operational Continuity"
  perturbation: "Physical need, danger, resource lack"
  
  domain_prior:
    primary_domains:
      - H01_SURVIVAL      # Immediate physical needs
      - H02_SAFETY        # Threat detection, protection
    secondary_domains:
      - H10_COORDINATION  # May need help from others
      - H04_EMOTION       # Fear, urgency
    confidence: 0.8
    
  intent_hint:
    likely_category: "operational"
    delegation_risk: "low"
    
  rationale: |
    D1 signals immediate physical/resource needs.
    Usually operational - person needs help, not reflection.
    Low delegation risk - they know what they need.
```

### D2_ACTIVE → Coordination Prior

```yaml
D2_ACTIVE:
  name: "Coordination"
  perturbation: "Agent coordination disruption"
  
  domain_prior:
    primary_domains:
      - H10_COORDINATION  # Multi-agent alignment
      - H11_COLLECTIVE    # Group dynamics
    secondary_domains:
      - H12_POWER         # Authority, influence
      - H08_RELATIONAL    # Interpersonal dynamics
    confidence: 0.75
    
  intent_hint:
    likely_category: "operational"
    delegation_risk: "low"
    
  rationale: |
    D2 signals coordination problems.
    Usually operational - needs strategy/communication help.
    May escalate to normative if values conflict detected.
```

### D3_ACTIVE → Decision/Meaning Prior

```yaml
D3_ACTIVE:
  name: "Operative Selection"
  perturbation: "Decision blockage, choice paralysis"
  
  domain_prior:
    primary_domains:
      - H05_COGNITION     # Thinking, analysis
      - H06_MEANING       # Purpose, significance
    secondary_domains:
      - H07_IDENTITY      # Who am I to make this choice?
      - H12_POWER         # Agency, control
      - H04_EMOTION       # Fear of wrong choice
    confidence: 0.7
    
  intent_hint:
    likely_category: "normative"  # HIGH ALERT
    delegation_risk: "high"       # HIGH ALERT
    
  rationale: |
    D3 is the critical signal for ENOQ.
    Decision paralysis often leads to delegation attempts.
    S1 must carefully assess: exploration vs delegation.
    V-MODE likely needed.
```

### D4_ACTIVE → Boundary/Identity Prior

```yaml
D4_ACTIVE:
  name: "Boundary"
  perturbation: "Self/other confusion, intrusion"
  
  domain_prior:
    primary_domains:
      - H07_IDENTITY      # Self-definition
      - H08_RELATIONAL    # Self-other boundary
    secondary_domains:
      - H04_EMOTION       # Distress, confusion
      - H02_SAFETY        # Psychological safety
    confidence: 0.85
    
  intent_hint:
    likely_category: "crisis"     # POTENTIAL CRISIS
    delegation_risk: "medium"
    
  rationale: |
    D4 signals identity/boundary disturbance.
    May indicate psychological crisis.
    S1 must assess severity immediately.
    Emergency protocol may be needed.
```

### NULL → No Prior (Full Scan)

```yaml
"NULL":
  name: "No Perturbation Detected"
  perturbation: "None"
  
  domain_prior:
    primary_domains: []           # No prior - scan all
    secondary_domains: []
    confidence: 0.0               # No guidance from S0
    
  intent_hint:
    likely_category: "operational"
    delegation_risk: "low"
    
  rationale: |
    No perturbation detected by S0.
    Likely straightforward operational request.
    S1 does full scan without prior bias.
```

---

## S1 Behavior Based on Prior

### With Strong Prior (D1, D2, D4)

```python
def s1_sense_with_prior(input: S1Input) -> FieldModel:
    prior = input.domain_prior
    
    # Search primary domains first
    primary_signals = detect_domains(
        input.gate_output.input_text, 
        prior.primary_domains
    )
    
    if primary_signals.confidence > 0.7:
        # Primary domains explain the input
        return build_field_model(primary_signals)
    
    # Expand to secondary
    secondary_signals = detect_domains(
        input.gate_output.input_text,
        prior.secondary_domains
    )
    
    return build_field_model(primary_signals + secondary_signals)
```

### With D3 (Decision Paralysis) — Special Handling

```python
def s1_sense_d3(input: S1Input) -> FieldModel:
    """
    D3 requires extra care.
    Must distinguish:
    - Exploration ("help me think through this")
    - Delegation ("tell me what to do")
    """
    
    text = input.gate_output.input_text
    
    # Check for delegation markers
    delegation_score = detect_delegation_attempt(text)
    
    # Check for exploration markers
    exploration_score = detect_exploration_intent(text)
    
    if delegation_score > 0.7:
        # User trying to delegate
        return FieldModel(
            intent_category="normative",
            delegation_attempt=True,
            route_to="V_MODE"
        )
    
    elif exploration_score > 0.7:
        # User wants to explore, not delegate
        return FieldModel(
            intent_category="mixed",
            delegation_attempt=False,
            route_to="DECISION_RUNTIME"
        )
    
    else:
        # Unclear - need clarification
        return FieldModel(
            intent_category="mixed",
            needs_clarification=True,
            route_to="S2_CLARIFY"
        )
```

### With D4 (Boundary) — Crisis Check

```python
def s1_sense_d4(input: S1Input) -> FieldModel:
    """
    D4 may indicate crisis.
    Must assess severity before proceeding.
    """
    
    text = input.gate_output.input_text
    
    # Crisis indicators
    crisis_score = detect_crisis_indicators(text)
    
    if crisis_score > 0.6:
        return FieldModel(
            intent_category="crisis",
            route_to="EMERGENCY_RUNTIME",
            priority="IMMEDIATE"
        )
    
    # Not crisis, but boundary work needed
    return FieldModel(
        intent_category="normative",  # Identity work is normative
        primary_domain="H07_IDENTITY",
        route_to="HUMAN_FIELD",
        mode="processual",
        depth="medium"
    )
```

---

## Delegation Detection

S0 detects D3 (decision paralysis).
S1 must determine if it's delegation.

```yaml
detection_policy:
  nature: "Heuristic and conservative"
  false_positives: "Acceptable - user gets V-MODE, still helped"
  false_negatives: "Not acceptable - normative delegation may occur"
  bias: "Err toward detecting delegation"
  
  legal_note: |
    Delegation detection is not ground truth.
    It is a safety mechanism designed to prevent normative delegation.
    Conservative false positives are a feature, not a bug.
```

### Delegation Markers

```yaml
delegation_markers:
  explicit_high_confidence:
    patterns:
      - "dimmi tu cosa (devo )?fare"
      - "decidi tu"
      - "cosa dovrei fare"
      - "qual è la scelta giusta"
      - "tell me what to do"
      - "you decide"
      - "what should I do"
      - "which (one )?should I (choose|pick|take)"
    weight: 0.9
    
  implicit_medium_confidence:
    patterns:
      - "è meglio X o Y"  # Without criteria
      - "quale (scelgo|prendo)"
      - "non so cosa fare"
      - "which is better"
      - "I can't decide"
    weight: 0.6
    
  context_amplifiers:
    - Second person + imperative on life choice
    - Absence of own criteria/values in question
    - Repeated asking same question
    weight_boost: +0.2
```

### Exploration Markers

```yaml
exploration_markers:
  explicit_high_confidence:
    patterns:
      - "aiutami a pensare"
      - "help me think through"
      - "voglio capire"
      - "I want to understand"
      - "let me explore"
      - "what are the considerations"
    weight: 0.85
    
  implicit_medium_confidence:
    patterns:
      - "quali sono le opzioni"
      - "what are my options"
      - "cosa c'è da considerare"
      - "pro e contro"
      - "pros and cons"
    weight: 0.6
    
  context_indicators:
    - User provides own criteria
    - User shows awareness of complexity
    - User asks for information, not verdict
    weight_boost: +0.15
```

---

## Performance Optimization

### Without S0 Prior

```
S1 must scan: 30 domains
Estimated time: 800-1200ms
LLM tokens: ~2000 input
```

### With S0 Prior

```
S1 scans: 4-6 prioritized domains
Estimated time: 200-400ms
LLM tokens: ~600 input
Speedup: 3-5x
```

---

## Error Handling

### S0 Unavailable

```yaml
s0_unavailable:
  detection: "Connection timeout or error response"
  
  fallback:
    - Log error
    - Proceed with NULL signal (no prior)
    - S1 does full scan
    - Slightly slower but functional
    
  alert: "Notify ops if S0 down > 5 minutes"
```

### S0 Disagrees with S1

```yaml
s0_s1_mismatch:
  example: "S0 says D1 (survival), S1 sees H06 (meaning)"
  
  resolution:
    - S1 wins (deeper analysis)
    - Log mismatch for review
    - May indicate S0 classifier needs tuning
    
  principle: |
    S0 is fast triage.
    S1 is accurate diagnosis.
    When in conflict, trust the diagnosis.
```

---

## Data Flow Summary

```
USER INPUT
    │
    ▼
┌─────────────────────────────────────────┐
│ Gate-Runtime (S0)                       │
│                                         │
│ - Keyword/pattern matching              │
│ - Pre-trained classifier                │
│ - NO LLM call                           │
│                                         │
│ Output: D1|D2|D3|D4|NULL                │
│ Latency: 10-50ms                        │
└─────────────────────────────────────────┘
    │
    │ GateOutput
    ▼
┌─────────────────────────────────────────┐
│ ENOQ Entry Point                        │
│                                         │
│ - Map D-signal to DomainPrior           │
│ - Compute IntentHint                    │
│                                         │
│ Output: S1Input                         │
│ Latency: <5ms (pure logic)              │
└─────────────────────────────────────────┘
    │
    │ S1Input
    ▼
┌─────────────────────────────────────────┐
│ S1 SENSE                                │
│                                         │
│ - Use prior to focus search             │
│ - LLM-assisted perception               │
│ - Build FieldModel                      │
│                                         │
│ Output: FieldModel                      │
│ Latency: 200-400ms (with prior)         │
│          800-1200ms (without prior)     │
└─────────────────────────────────────────┘
    │
    ▼
  S2-S6...
```

---

## Complete End-to-End Example

### Scenario: User asks for career decision help

**Step 1: User Input**

```
"I've been offered a job in Singapore but my family is here. 
I don't know what to do. What should I choose?"
```

---

**Step 2: Gate-Runtime (S0) Output**

```json
{
  "request_id": "req-2025-12-25-001",
  "timestamp": "2025-12-25T19:30:00Z",
  "input_hash": "a3f2b1c9...",
  "signal": "D3_ACTIVE",
  "halt": true,
  "reason_code": "DOMAIN_SIGNAL",
  "input_text": "I've been offered a job in Singapore but my family is here. I don't know what to do. What should I choose?",
  "marker_version": "v1.0",
  "context_scope_id": "user-123"
}
```

**S0 Analysis:** D3_ACTIVE because:
- Decision language ("don't know what to do")
- Choice framing ("job... but family")
- Explicit decision request ("What should I choose?")

---

**Step 3: ENOQ Entry Point — Build S1Input**

```python
# Map D3 signal to DomainPrior
domain_prior = DomainPrior(
    primary_domains=["H05_COGNITION", "H06_MEANING"],
    secondary_domains=["H07_IDENTITY", "H12_POWER", "H04_EMOTION"],
    confidence=0.7  # D3 has moderate confidence
)

# Compute IntentHint
intent_hint = IntentHint(
    likely_category="normative",  # D3 + "What should I choose?"
    delegation_risk="high",       # Explicit "What should I choose?"
    semantics="warning_only",
    binding=False
)

# Build S1Input
s1_input = S1Input(
    gate_output=gate_output,
    domain_prior=domain_prior,
    intent_hint=intent_hint
)
```

---

**Step 4: S1 SENSE — Build FieldModel**

```python
def s1_sense(s1_input: S1Input) -> FieldModel:
    text = s1_input.gate_output.input_text
    prior = s1_input.domain_prior
    
    # Check for delegation attempt (high priority given D3 + hint)
    delegation_score = detect_delegation_attempt(text)
    # Result: 0.85 (high) — "What should I choose?" is explicit delegation
    
    # Scan primary domains using prior
    domain_signals = detect_domains(text, prior.primary_domains)
    # H05_COGNITION: 0.7 (decision framing)
    # H06_MEANING: 0.8 (life meaning at stake — career vs family)
    
    # Scan secondary domains
    secondary_signals = detect_domains(text, prior.secondary_domains)
    # H07_IDENTITY: 0.6 (who do I want to be?)
    # H08_RELATIONAL: 0.7 (family mentioned)
    # H04_EMOTION: 0.5 (implicit distress)
    
    return FieldModel(
        # Intent
        intent_category="normative",
        delegation_attempt=True,  # delegation_score > 0.7
        
        # Domains
        primary_domain="H06_MEANING",
        primary_domain_confidence=0.8,
        secondary_domains=["H05_COGNITION", "H08_RELATIONAL", "H07_IDENTITY"],
        
        # Field state
        arousal="medium",
        depth_accessible="medium",
        threshold_proximity=0.6,  # Approaching but not at threshold
        
        # S0 reference
        s0_signal="D3_ACTIVE",
        
        # Routing hint
        route_to="V_MODE"  # delegation_attempt = true
    )
```

---

**Step 5: S3 PLAN — Route to V-MODE**

```python
def s3_plan(field_model: FieldModel) -> RuntimeSelection:
    # delegation_attempt = true → V-MODE (mandatory per Constitution)
    
    return RuntimeSelection(
        runtime_id="V_MODE",
        mode="singular",
        depth="medium",
        pacing="slow",
        primitives_enabled=["P03_validate", "P04_name", "P16_visualize_threshold", 
                           "P17_name_weight", "P15_return_agency"]
    )
```

---

**Step 6: S4 ACT — Execute V-MODE**

Output generated following V-MODE-SPEC:

```
You're asking me to tell you whether to take this job.

I can't make this decision for you—not because I'm unwilling, 
but because the weight of it belongs to you. What I can do is 
help you see what you're facing.

You're weighing two paths:
- Take the job in Singapore
- Stay where you are with your family

What's at stake spans several dimensions:

Practically: career trajectory, income, daily logistics of distance

For your sense of self: who you want to become, what kind of life 
you're building, what you'll look back on

For your relationships: what presence means to your family, what 
distance would mean, how relationships evolve across geography

For what matters to you: adventure vs. stability, growth vs. rootedness, 
your own path vs. shared life

What you seem to know:
- The opportunity is real and significant
- Your family matters to you
- This isn't a simple either/or

What you can't know yet:
- How you'll feel a year into either choice
- What opportunities might emerge from either path
- How your family relationships will actually evolve

This is a real decision with real weight. No wonder it's hard.

When you imagine yourself in Singapore, what happens in your body?
When you imagine staying, what do you feel?

Given all of this—what are you actually leaning toward?
```

---

**Step 7: S5 VERIFY — Check Output**

```python
def s5_verify(output: str, runtime: RuntimeSelection) -> VerificationResult:
    # Layer 1: Structural checks (deterministic)
    assert len(output) > 0  # ✓
    assert len(output) < 10000  # ✓
    
    # Layer 2: Constitutional checks (classifier)
    delegation_score = detect_normative_delegation(output)
    # Result: 0.12 — No recommendation given ✓
    
    recommendation_patterns = check_recommendation_patterns(output)
    # Result: None found ✓
    # No "you should", "I recommend", "the best choice is"
    
    agency_return = check_agency_return(output)
    # Result: True — ends with "what are you actually leaning toward?" ✓
    
    return VerificationResult(
        status="PASS",
        delegation_score=0.12,
        agency_returned=True,
        constitutional_compliance=True
    )
```

---

**Step 8: S6 STOP — Deliver and Update**

```python
def s6_stop(output: str, field_model: FieldModel):
    # Deliver output to user
    deliver(output)
    
    # Update structural memory
    memory.update_domain_frequency("H06_MEANING", timestamp=now())
    memory.record_delegation_attempt(timestamp=now())
    
    # Log for audit
    log_interaction(
        request_id=request_id,
        s0_signal="D3_ACTIVE",
        intent="normative",
        runtime="V_MODE",
        delegation_detected=True,
        delegation_prevented=True,
        verification="PASS"
    )
    
    # Release control
    state = "IDLE"
```

---

**Complete Flow Summary**

```
User: "What should I choose?"
  │
  ▼
S0: D3_ACTIVE (decision paralysis detected)
  │
  ▼
Entry: DomainPrior [H05, H06], IntentHint [normative, high risk]
  │
  ▼
S1: FieldModel {delegation_attempt: true, primary: H06_MEANING}
  │
  ▼
S3: RuntimeSelection {V_MODE}
  │
  ▼
S4: V-MODE output (visualize, don't decide)
  │
  ▼
S5: PASS (no delegation in output, agency returned)
  │
  ▼
S6: Deliver, log, release

RESULT: User asked for decision → Got visualization instead
        Delegation prevented structurally ✓
```

---

## Integration Checklist

For ENOQ-CORE to integrate with gate-runtime:

```yaml
checklist:
  - [ ] Parse GateOutput JSON
  - [ ] Map signal to DomainPrior
  - [ ] Compute IntentHint
  - [ ] Pass S1Input to SENSE
  - [ ] Handle S0 unavailable gracefully
  - [ ] Log all S0-S1 interactions
  - [ ] Track S0-S1 mismatches for tuning
```

---

## Extension Points

### For S0 (gate-runtime)

If S0 wants to provide richer output:

```typescript
interface GateOutputExtended extends GateOutput {
  // Optional enrichments
  confidence?: number;           // How confident in signal
  secondary_signal?: string;     // Second-strongest signal
  linguistic_markers?: string[]; // What triggered the signal
}
```

### For S1 (ENOQ-CORE)

S1 can request S0 re-evaluation:

```typescript
interface S0ReevaluationRequest {
  request_id: string;
  additional_context: string;  // From conversation
  reason: "mismatch" | "escalation" | "clarification";
}
```

---

*"S0 triages. S1 diagnoses. Together, they see clearly."*
