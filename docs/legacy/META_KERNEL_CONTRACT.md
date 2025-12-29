# META KERNEL CONTRACT

**Document ID:** ENOQ-META-KERNEL-CONTRACT  
**Status:** Constitutional Enforcement  
**Version:** 1.0  
**Date:** 2025-12-26

---

## Purpose

MetaKernel (L0.5) is the **power governor**.

It does not read content.
It reads **telemetry**.

It does not decide outcomes.
It **permits or constrains** the space in which outcomes happen.

---

## Position in Architecture

```
AXIS (immutable principles)
    ↓
CONSTITUTION (declared constraints)
    ↓
L0 GATE (4 guardrails, pre-LLM)
    ↓
[L0.5 META-KERNEL] ← You are here
    ↓
DOMAIN GOVERNOR (coexistence rules)
    ↓
L1 FIELD COMPILER (perception → constraints)
    ↓
L2 EXECUTION (multi-domain doing)
```

MetaKernel sits between Gate and Domain Governor.
It **governs power**, not content.

---

## Core Principle

> **Power is permissioned, not automatic.**

MetaKernel ensures that ENOQ's operational power scales only when:
- Agency remains high
- Normative delegation does not increase
- Coherence does not collapse

---

## What MetaKernel Reads (Telemetry)

MetaKernel is **content-blind**. It reads only operational signals.

### Telemetry Signals

| Signal | Type | Formula | Range |
|--------|------|---------|-------|
| depth_velocity | float | `(current_depth - prev_depth) / turns` | -1.0 to +1.0 |
| domain_spread | int | `count(active_domains where salience > 0.3)` | 1-17 |
| continuity_pressure | float | `1 - (time_since_last_message / timeout)` | 0.0 to 1.0 |
| delegation_attempts_rate | float | `delegation_attempts / total_turns` | 0.0 to 1.0 |
| loop_tendency | float | `repeated_themes / total_themes` | 0.0 to 1.0 |
| turns_budget | int | `max_turns - current_turn` | 0 to max |
| time_budget | float | `max_time - elapsed_time` (seconds) | 0 to max |
| agency_signal | float | see formula below | 0.0 to 1.0 |

### Agency Signal Formula

```typescript
function calculateAgencySignal(session: SessionTelemetry): number {
  const factors = {
    // Positive signals (user taking ownership)
    user_decisions: session.user_made_decision ? 0.2 : 0,
    user_questions: session.user_asked_clarifying ? 0.1 : 0,
    user_pushback: session.user_disagreed ? 0.15 : 0,
    
    // Negative signals (user delegating)
    delegation_attempts: -0.3 * session.delegation_rate,
    seeking_reassurance: -0.2 * session.reassurance_rate,
    passivity: -0.25 * session.passive_turns_rate,
  };
  
  const raw = Object.values(factors).reduce((a, b) => a + b, 0) + 0.5; // baseline 0.5
  return Math.max(0, Math.min(1, raw));
}
```

### Depth Mapping

| Depth Level | Numeric Value |
|-------------|---------------|
| surface | 0 |
| medium | 1 |
| deep | 2 |

---

## What MetaKernel Controls (Knobs)

MetaKernel adjusts **operational parameters**, not content.

### Control Knobs

| Knob | Type | Range | Default | Effect |
|------|------|-------|---------|--------|
| max_depth_allowed | Depth | surface/medium/deep | deep | Ceiling on exploration depth |
| dimensions_enabled | string[] | subset of dimensions | all | Which dimensions can activate |
| continuation_policy | enum | atomic/checkpointed/processual | atomic | How sessions can extend |
| field_narrowing | float | 0.0-1.0 | 0.0 | How much to narrow focus |
| deep_mode_handshake | boolean | true/false | false | Requires explicit opt-in |
| max_turns_remaining | int | 1-∞ | ∞ | Turn budget |
| power_level | float | 0.0-1.0 | 0.5 | Overall operational envelope |

### Dimensions

```typescript
type Dimension = 
  | 'somatic'      // Body awareness
  | 'emotional'    // Feeling exploration
  | 'relational'   // Attachment/connection
  | 'existential'  // Meaning/identity
  | 'systemic';    // Context/environment
```

---

## Telemetry → Knob Mapping Rules

### Rule MK-001: High Delegation Rate → Constrain Depth

```yaml
rule_id: MK-001
condition: "delegation_attempts_rate > 0.3"
action:
  max_depth_allowed: medium
  deep_mode_handshake: true
rationale: "User is trying to delegate. Don't go deeper."
```

### Rule MK-002: Low Agency → Narrow Focus

```yaml
rule_id: MK-002
condition: "agency_signal < 0.4"
action:
  field_narrowing: 0.5
  dimensions_enabled: [somatic, emotional]  # Remove existential
rationale: "User isn't taking ownership. Simplify."
```

### Rule MK-003: Fast Depth Velocity → Slow Down

```yaml
rule_id: MK-003
condition: "depth_velocity > 0.5"
action:
  max_depth_allowed: current_depth  # Don't go deeper
  continuation_policy: checkpointed
rationale: "Moving too fast. Create checkpoint."
```

### Rule MK-004: High Domain Spread → Focus

```yaml
rule_id: MK-004
condition: "domain_spread > 4"
action:
  field_narrowing: 0.7
  max_depth_allowed: medium
rationale: "Too many domains active. Focus before depth."
```

### Rule MK-005: Loop Detected → Contract

```yaml
rule_id: MK-005
condition: "loop_tendency > 0.5"
action:
  field_narrowing: 0.8
  dimensions_enabled: [emotional]  # Just one dimension
  max_depth_allowed: surface
rationale: "User is looping. Contract to break cycle."
```

### Rule MK-006: Budget Low → Prepare Closure

```yaml
rule_id: MK-006
condition: "turns_budget < 3 OR time_budget < 60"
action:
  continuation_policy: atomic
  max_depth_allowed: surface
  field_narrowing: 0.9
rationale: "Running out of time. Prepare for handoff."
```

### Rule MK-007: Deep Mode Requested → Require Handshake

```yaml
rule_id: MK-007
condition: "requested_depth == deep AND deep_mode_handshake == false"
action:
  prompt_handshake: true
  pending_depth: deep
rationale: "Deep work requires explicit consent."
```

### Rule MK-008: Agency High + Coherence High → Allow Full Power

```yaml
rule_id: MK-008
condition: "agency_signal > 0.7 AND coherence == high"
action:
  max_depth_allowed: deep
  dimensions_enabled: all
  power_level: 1.0
rationale: "User is engaged and coherent. Full capability."
```

### Rule MK-009: Continuity Pressure High → Don't Open New Material

```yaml
rule_id: MK-009
condition: "continuity_pressure > 0.8"
action:
  dimensions_enabled: current_dimensions  # No new dimensions
  field_narrowing: +0.2  # Increase narrowing
rationale: "User needs to stay with current material."
```

### Rule MK-010: Recovery After Crisis

```yaml
rule_id: MK-010
condition: "previous_state == EMERGENCY AND current_state != EMERGENCY"
action:
  max_depth_allowed: surface
  continuation_policy: checkpointed
  turns_until_depth: 3
rationale: "After crisis, stay surface before going deep."
```

---

## State Machine

MetaKernel maintains state across turns.

```typescript
interface MetaKernelState {
  // Telemetry history
  telemetry_history: TelemetrySnapshot[];
  
  // Current knob values
  knobs: KnobSettings;
  
  // Session metadata
  session_start: Date;
  turns_elapsed: number;
  
  // Flags
  deep_mode_active: boolean;
  handshake_pending: boolean;
  recovery_mode: boolean;
  
  // Computed
  power_envelope: PowerEnvelope;
}

interface PowerEnvelope {
  depth_ceiling: Depth;
  dimensions_allowed: Dimension[];
  operations_allowed: Operation[];
  time_remaining: number;
  turns_remaining: number;
}
```

### State Transitions

```
INITIAL → ACTIVE → [CONSTRAINED | EXPANDED | CLOSING]
                         ↓
                    RECOVERY (after crisis)
```

---

## Integration with Domain Governor

MetaKernel runs **before** Domain Governor.

```typescript
async function processRequest(input: UserInput, session: Session): Promise<Response> {
  // 1. L0 Gate (pre-LLM classification)
  const gateResult = await L0_gate(input);
  if (gateResult.blocked) return handleBlock(gateResult);
  
  // 2. L0.5 MetaKernel (power governance)
  const telemetry = collectTelemetry(session);
  const metaKernelResult = applyMetaKernel(telemetry, session.metaKernelState);
  
  // 3. L1 Perception (field reading)
  const field = await perceive(input, metaKernelResult.powerEnvelope);
  
  // 4. Domain Governor (coexistence constraints)
  const governorResult = applyDomainGovernor(field);
  
  // 5. Merge constraints
  const constraints = mergeConstraints(metaKernelResult, governorResult);
  
  // 6. L1 Selection
  const selection = select(field, constraints);
  
  // 7. L2 Execution
  const output = await execute(selection, constraints);
  
  // 8. S5 Verify
  const verified = verify(output, constraints, field);
  
  // 9. Update MetaKernel state
  session.metaKernelState = metaKernelResult.newState;
  
  return verified.output;
}
```

### Constraint Merging

```typescript
function mergeConstraints(
  mk: MetaKernelResult,
  dg: GovernorResult
): MergedConstraints {
  return {
    // Most restrictive depth
    depth_ceiling: mostRestrictive(mk.powerEnvelope.depth_ceiling, dg.effect.depth_ceiling),
    
    // Union of forbidden
    forbidden: [...mk.forbidden, ...dg.effect.forbidden],
    
    // Union of required
    required: [...mk.required, ...dg.effect.required],
    
    // MetaKernel dimension filtering
    dimensions_enabled: mk.powerEnvelope.dimensions_allowed,
    
    // Slowest pacing
    pacing: slowest(mk.pacing, dg.effect.pacing),
    
    // Override atmosphere from DG (MetaKernel doesn't set atmosphere)
    atmosphere: dg.effect.atmosphere,
  };
}
```

---

## Deep Mode Handshake Protocol

When deep work is requested but not yet authorized:

```yaml
handshake_protocol:
  trigger: "User moves toward deep territory AND deep_mode_handshake == false"
  
  prompt:
    en: |
      You're moving into deeper territory—exploring meaning, identity, 
      or core patterns. This kind of work can be valuable but also intense.
      
      Would you like to continue into this space?
      
    it: |
      Stai entrando in territorio più profondo—esplorando significato, 
      identità, o pattern fondamentali. Questo tipo di lavoro può essere 
      prezioso ma anche intenso.
      
      Vuoi continuare in questo spazio?
      
  responses:
    affirmative: ["yes", "sì", "continue", "continua", "go ahead", "vai avanti"]
    negative: ["no", "not now", "non ora", "stay here", "restiamo qui"]
    
  on_affirmative:
    deep_mode_handshake: true
    max_depth_allowed: deep
    dimensions_enabled: all
    
  on_negative:
    max_depth_allowed: medium
    dimensions_enabled: [somatic, emotional]  # Exclude existential
```

---

## Telemetry Collection

### Per-Turn Telemetry

```typescript
interface TurnTelemetry {
  timestamp: Date;
  turn_number: number;
  
  // Input analysis (content-blind)
  input_length: number;
  input_question_count: number;
  input_has_delegation_markers: boolean;
  
  // Output analysis
  output_depth: Depth;
  output_domains: string[];
  
  // Session state
  elapsed_time: number;
  
  // Computed signals
  depth_delta: number;
  domain_delta: number;
}
```

### Session Telemetry

```typescript
interface SessionTelemetry {
  // Aggregates
  total_turns: number;
  avg_depth: number;
  max_depth_reached: Depth;
  
  // Rates
  delegation_rate: number;
  reassurance_rate: number;
  passive_turns_rate: number;
  
  // Patterns
  loop_count: number;
  theme_repetition_rate: number;
  
  // User behavior
  user_made_decision: boolean;
  user_asked_clarifying: boolean;
  user_disagreed: boolean;
}
```

---

## Power Level Calculation

```typescript
function calculatePowerLevel(
  telemetry: SessionTelemetry,
  state: MetaKernelState
): number {
  // Base level
  let power = 0.5;
  
  // Agency boosts power
  power += 0.3 * telemetry.agency_signal;
  
  // Delegation reduces power
  power -= 0.4 * telemetry.delegation_rate;
  
  // High coherence boosts power
  if (state.coherence === 'high') power += 0.15;
  if (state.coherence === 'low') power -= 0.25;
  
  // Recovery mode reduces power
  if (state.recovery_mode) power -= 0.3;
  
  // Deep mode consent boosts power
  if (state.deep_mode_active) power += 0.2;
  
  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, power));
}
```

### Power Level → Capability Mapping

| Power Level | Max Depth | Dimensions | L2 Mode |
|-------------|-----------|------------|---------|
| 0.0 - 0.2 | surface | somatic only | SURFACE |
| 0.2 - 0.4 | surface | somatic, emotional | SURFACE |
| 0.4 - 0.6 | medium | somatic, emotional, relational | MEDIUM |
| 0.6 - 0.8 | medium | all except existential | MEDIUM/DEEP |
| 0.8 - 1.0 | deep | all | DEEP |

---

## Invariants

These must always hold:

1. **Agency < 0.3 → Power ≤ 0.4**: Low agency means constrained power
2. **Delegation > 0.5 → No Deep**: High delegation rate blocks deep mode
3. **Recovery → Surface Only**: After crisis, stay surface for N turns
4. **No Handshake → No Existential**: Deep existential work requires consent
5. **Loop > 0.5 → Contract**: Looping requires narrowing, not expanding

---

## Audit Trail

MetaKernel decisions are logged:

```typescript
interface MetaKernelAuditEntry {
  timestamp: string;
  session_id: string;
  turn_number: number;
  
  // Telemetry snapshot (no content)
  telemetry: {
    depth_velocity: number;
    domain_spread: number;
    agency_signal: number;
    delegation_rate: number;
    loop_tendency: number;
  };
  
  // Rules triggered
  rules_applied: string[];
  
  // Knob changes
  knob_changes: {
    knob: string;
    from: any;
    to: any;
  }[];
  
  // Power envelope
  power_envelope: {
    power_level: number;
    depth_ceiling: string;
    dimensions_enabled: string[];
  };
}
```

---

## Test Cases

### TC-MK-001: High Delegation Constrains Depth

```yaml
test: "Delegation rate > 0.3 constrains depth"
input:
  telemetry:
    delegation_attempts_rate: 0.4
    agency_signal: 0.3
expected:
  rules_applied: [MK-001, MK-002]
  knobs:
    max_depth_allowed: medium
    deep_mode_handshake: true
```

### TC-MK-002: High Agency Allows Full Power

```yaml
test: "Agency > 0.7 with coherence allows full power"
input:
  telemetry:
    agency_signal: 0.8
    delegation_rate: 0.1
  state:
    coherence: high
expected:
  rules_applied: [MK-008]
  power_level: > 0.8
  max_depth_allowed: deep
```

### TC-MK-003: Loop Triggers Contraction

```yaml
test: "Loop tendency > 0.5 narrows field"
input:
  telemetry:
    loop_tendency: 0.6
expected:
  rules_applied: [MK-005]
  field_narrowing: 0.8
  max_depth_allowed: surface
```

### TC-MK-004: Handshake Required for Deep

```yaml
test: "Deep mode requires handshake"
input:
  requested_depth: deep
  state:
    deep_mode_handshake: false
expected:
  rules_applied: [MK-007]
  prompt_handshake: true
  pending_depth: deep
```

---

## Summary

MetaKernel is the **conservation law enforcer**.

| What it reads | What it controls | What it guarantees |
|---------------|------------------|-------------------|
| Telemetry | Power knobs | Agency preserved |
| Signals | Depth ceiling | No runaway depth |
| Rates | Dimensions | No unconsented exploration |
| Patterns | Continuation | Coherent sessions |

**MetaKernel ensures:**
- Power scales with agency
- Depth requires consent
- Crisis triggers recovery
- Loops trigger contraction
- Delegation triggers constraint

---

*"Power is permissioned, not automatic."*
