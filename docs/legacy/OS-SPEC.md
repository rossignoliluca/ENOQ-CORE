# ENOQ OPERATING SYSTEM SPECIFICATION v1.0

**Document ID:** ENOQ-OS-SPEC  
**Status:** Core Architecture  
**Date:** 2025-12-25  
**Depends On:** AXIS/INVARIANTS.md  

---

## EXECUTIVE SUMMARY

ENOQ OS is a state machine that governs all system behavior.

It is not a chatbot. It is not an assistant. It is an **operating system** that:
- Perceives the field
- Selects a mode of operation
- Operates until completion
- Verifies
- Stops
- Without drift. Without autonomous continuation.

---

## PART I: THE 7 STATES

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    S0 PERMIT ──→ S1 SENSE ──→ S2 CLARIFY                   │
│         │            │              │                       │
│         │            │              │                       │
│         ▼            ▼              ▼                       │
│       [deny]     [enough]      [answered]                   │
│         │            │              │                       │
│         │            └──────┬───────┘                       │
│         │                   │                               │
│         │                   ▼                               │
│         │              S3 PLAN                              │
│         │                   │                               │
│         │                   ▼                               │
│         │              S4 ACT ←──┐                          │
│         │                   │     │                         │
│         │                   ▼     │                         │
│         │             S5 VERIFY ──┘ (if fixable)            │
│         │                   │                               │
│         │                   ▼                               │
│         └────────────→ S6 STOP                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### S0 — PERMIT

**Function:** Legitimacy control (hard gate)

```yaml
state: S0
name: PERMIT
function: |
  Determines if the request can be processed.
  This is the constitutional gate.
  
input:
  - raw_user_message
  - session_context (minimal)
  
output:
  permit: boolean
  reason_code: string
  
checks:
  - crisis_detection (→ emergency protocol)
  - injection_detection (→ reject)
  - constitutional_violation (→ reject)
  - scope_check (→ can ENOQ help with this?)
  
transitions:
  permit_true: → S1 SENSE
  permit_false: → S6 STOP (with explanation)
```

**S0 is not optional. S0 cannot be bypassed.**

---

### S1 — SENSE

**Function:** Build Field Model

```yaml
state: S1
name: SENSE
function: |
  Perceives the field: domains, constraints, state, uncertainty.
  Does NOT generate output.
  
input:
  - permitted_request
  - session_context
  
output:
  field_model:
    primary_domain: DomainID
    secondary_domains: DomainID[]
    arousal: high | medium | low
    depth_accessible: surface | medium | deep
    constraints: Constraint[]
    uncertainty: UncertaintyReport
    
  runtime_hint: RuntimeID | null
  needs_clarification: boolean
  
processing:
  - domain_detection (16 human + modulators)
  - arousal_assessment
  - depth_calibration  
  - constraint_identification
  - uncertainty_quantification
  
transitions:
  needs_clarification: → S2 CLARIFY
  enough_info: → S3 PLAN
```

**S1 perceives. S1 does not act.**

---

### S2 — CLARIFY

**Function:** Resolve critical information gaps

```yaml
state: S2
name: CLARIFY
function: |
  If critical information is missing, ask ONE question (max two).
  Bounded clarification. No fishing expeditions.
  
input:
  - field_model (incomplete)
  - specific_gaps identified
  
output:
  clarifying_question: string
  what_it_resolves: string
  
constraints:
  max_questions: 2
  must_be_critical: true  # nice-to-know doesn't trigger CLARIFY
  must_be_specific: true  # no vague "tell me more"
  
transitions:
  user_answers: → S1 SENSE (re-process with new info)
  user_declines: → S6 STOP (insufficient data)
  no_answer_needed: → S3 PLAN
```

**S2 asks only what is necessary. S2 does not explore.**

---

### S3 — PLAN

**Function:** Transform Field Model into operational plan

```yaml
state: S3
name: PLAN
function: |
  Creates or selects a runtime.
  Defines execution parameters.
  Sets completion criteria.
  
input:
  - field_model (complete)
  
output:
  plan:
    runtime_id: string
    runtime_type: core | generated
    
    execution:
      tools_allowed: ToolID[]
      tools_forbidden: ToolID[]
      depth: surface | medium | deep
      tone: ToneSpec
      pacing: slow | normal | responsive
      
    completion_criteria: CompletionCriterion[]
    verify_rules: VerifyRule[]
    max_iterations: number
    
processing:
  - runtime_selection (existing core runtime?)
  - runtime_generation (if no match, generate within Constitution)
  - runtime_validation (check against Constitution)
  - parameter_setting
  
transitions:
  plan_valid: → S4 ACT
  plan_invalid: → regenerate or → S6 STOP
```

**S3 plans. S3 does not execute.**

---

### S4 — ACT

**Function:** Execute the plan

```yaml
state: S4
name: ACT
function: |
  Generates output according to plan.
  Writes emails, code, analysis, responses.
  Produces artifacts.
  
input:
  - plan
  - field_model
  - (user message for reference)
  
output:
  artifact: Artifact | Draft | Response
  execution_trace: string
  
constraints:
  - follows plan exactly
  - does not decide objectives (plan decides)
  - does not exceed scope
  - respects all forbidden tools/patterns
  
transitions:
  artifact_produced: → S5 VERIFY
```

**S4 executes. S4 does not decide.**

---

### S5 — VERIFY

**Function:** Validate output against criteria

```yaml
state: S5
name: VERIFY
function: |
  Checks output for:
  - Completion criteria met
  - Constitutional compliance
  - Constraint adherence
  - Quality standards
  
input:
  - artifact from S4
  - plan (with criteria)
  - Constitution
  
output:
  result: pass | fail
  issues: Issue[]
  suggested_fix: string | null
  fixable: boolean
  
checks:
  - completion_criteria_met?
  - no_normative_delegation?
  - no_dependency_creation?
  - no_forbidden_patterns?
  - rubicon_respected?
  - constraints_honored?
  
transitions:
  pass: → S6 STOP
  fail_but_fixable: → S4 ACT (apply fix, max 3 iterations)
  fail_not_fixable: → S6 STOP (explain limitations)
```

**S5 verifies. S5 is never skipped.**

---

### S6 — STOP

**Function:** Terminate and return control to user

```yaml
state: S6
name: STOP
function: |
  Mandatory termination.
  Returns output to user.
  Offers next options (not agenda).
  Releases control.
  
input:
  - final_artifact (if any)
  - termination_reason
  
output:
  final_output: string | Artifact
  next_options: string[] | null  # what user CAN do, not what they SHOULD
  state_summary: string | null   # available on request
  
invariants:
  - STOP is always reached
  - STOP releases control completely
  - STOP does not create hooks for return
  - STOP is honest about what was/wasn't accomplished
  
transitions:
  none: STOP is terminal
  new_user_input: → S0 PERMIT (new cycle)
```

**S6 stops. S6 does not continue.**

---

## PART II: TRANSITIONS

All transitions are **deterministic**, not creative.

```
S0 PERMIT
  → deny → S6 STOP
  → permit → S1 SENSE

S1 SENSE
  → missing_critical_info → S2 CLARIFY
  → enough_info → S3 PLAN

S2 CLARIFY
  → user_answers → S1 SENSE
  → no_answer / decline → S6 STOP

S3 PLAN
  → plan_valid → S4 ACT
  → plan_invalid_fixable → retry S3
  → plan_invalid_unfixable → S6 STOP

S4 ACT
  → artifact_produced → S5 VERIFY

S5 VERIFY
  → pass → S6 STOP
  → fail_fixable (iterations < max) → S4 ACT
  → fail_fixable (iterations >= max) → S6 STOP
  → fail_unfixable → S6 STOP

S6 STOP
  → (terminal)
  → new_user_input → S0 PERMIT
```

---

## PART III: THE ORGANISM PRINCIPLE

This is not "one response per turn."

This is "completion-driven operation."

```yaml
organism_behavior:
  principle: |
    ENOQ cycles internally (ACT ↔ VERIFY) until completion.
    ENOQ does not stop after one sentence.
    ENOQ stops when CompletionCriteria are satisfied.
    
  but:
    - Cannot continue beyond STOP without new user input
    - Cannot exceed max_iterations
    - Cannot violate Constitution even to "complete"
    
  examples:
    email:
      completion: draft_complete + tone_correct + no_placeholders + CTA_present
      iterations: as many as needed (up to max)
      
    code:
      completion: compiles + tests_pass + documented
      iterations: as many as needed (up to max)
      
    decision_support:
      completion: options_mapped + dimensions_clear + user_confirmed_understanding
      iterations: as many as needed (up to max)
```

---

## PART IV: RUNTIME INTERFACE

The OS loads runtimes. Runtimes define domain-specific behavior.

```typescript
interface Runtime {
  id: string;
  type: "core" | "generated";
  
  // What this runtime does
  domain: string;
  description: string;
  
  // Capabilities
  tools_allowed: ToolID[];
  tools_forbidden: ToolID[];
  
  // Completion
  completion_criteria: CompletionCriterion[];
  verify_rules: VerifyRule[];
  
  // Limits
  max_iterations: number;
  max_duration_minutes: number;
  
  // Constitutional compliance (validated)
  constitutional_compliance: {
    validated: boolean;
    validation_timestamp: string;
    violations: [];  // must be empty
  };
}

interface CompletionCriterion {
  id: string;
  description: string;
  check: (artifact: Artifact) => boolean;
  required: boolean;
}

interface VerifyRule {
  id: string;
  description: string;
  check: (artifact: Artifact) => VerifyResult;
  severity: "error" | "warning";
}
```

---

## PART V: STATE OBJECT

The OS maintains a single state object per session:

```typescript
interface OSState {
  // Current position
  current_state: "S0" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
  
  // Session info
  session_id: string;
  turn_count: number;
  
  // Field model (from S1)
  field_model: FieldModel | null;
  
  // Plan (from S3)
  active_plan: Plan | null;
  active_runtime: Runtime | null;
  
  // Execution (from S4/S5)
  current_artifact: Artifact | null;
  iteration_count: number;
  
  // Audit
  state_history: StateTransition[];
  
  // Invariant: state is never mutated, only replaced
}

interface StateTransition {
  from: State;
  to: State;
  reason: string;
  timestamp: string;
  hash: string;  // for audit
}
```

---

## PART VI: INVARIANTS

These are enforced at the OS level, regardless of runtime:

| ID | Invariant | Enforcement |
|----|-----------|-------------|
| OS-INV-01 | PERMIT precedes all | State machine |
| OS-INV-02 | SENSE does not generate output | State machine |
| OS-INV-03 | ACT does not decide objectives | Plan validation |
| OS-INV-04 | VERIFY is never skipped | State machine |
| OS-INV-05 | STOP is mandatory after completion or failure | State machine |
| OS-INV-06 | No continuation beyond STOP without new input | State machine |
| OS-INV-07 | Max iterations enforced | Counter check |
| OS-INV-08 | Constitutional compliance checked | Verify rules |

---

## PART VII: WHY THIS IS THE "TRUE BRAIN"

A healthy brain:
- Perceives
- Plans
- Acts
- Verifies
- Repeats if needed
- Stops when done

It does not:
- Give "one response"
- Continue indefinitely
- Act without planning
- Skip verification

ENOQ OS encodes this pattern structurally.

The brain metaphor is not decoration. It is architecture.

---

*"The system that knows when to stop is the system that knows what it's for."*
