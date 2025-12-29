# AXIS Implementation Map

**Status:** Living document (updated with code changes)
**Purpose:** Map invariants to enforcement locations in codebase

---

## Invariant → File Path Mapping

### INV-001: PERMIT PRECEDES ALL

| Location | Type | Path |
|----------|------|------|
| **Canonical** | Orchestrator | `src/typescript/src/core/pipeline/orchestrator.ts` |
| Canonical | Boundary permit | `src/typescript/src/core/modules/boundary/boundary.ts` |
| Legacy | Runtime pipeline | `src/typescript/src/runtime/pipeline/pipeline.ts` |

**Enforcement:** State machine - `enoqCore()` calls `permit()` before any processing.

---

### INV-002: STOP IS MANDATORY

| Location | Type | Path |
|----------|------|------|
| **Canonical** | Orchestrator | `src/typescript/src/core/pipeline/orchestrator.ts` |
| Legacy | Runtime pipeline | `src/typescript/src/runtime/pipeline/pipeline.ts` |

**Enforcement:** State machine - all paths emit STOP signal before return.

---

### INV-003: NO NORMATIVE DELEGATION

| Location | Type | Path |
|----------|------|------|
| **Canonical** | S5 Verify | `src/typescript/src/gate/verification/S5_verify.ts:192` |
| Canonical | Axis runtime | `src/typescript/src/gate/invariants/axis.ts:72,100,193` |
| Legacy | Metacognitive monitor | `src/typescript/src/mediator/l4_agency/metacognitive_monitor.ts:536` |
| Legacy | Agent swarm | `src/typescript/src/mediator/l4_agency/agent_swarm.ts:153-158` |
| Legacy | Response protocol | `src/typescript/src/gate/protocols/response_protocol.ts:244-246` |
| Legacy | L2 execution | `src/typescript/src/runtime/pipeline/l2_execution.ts:498` |

**Patterns detected:**
- "you should", "you must", "you need to"
- "I recommend", "my advice"
- "the right thing is", "the best option is"

**Enforcement:** Output filter + S5_VERIFY lexical scan.

---

### INV-007: VERIFY BEFORE OUTPUT

| Location | Type | Path |
|----------|------|------|
| **Canonical** | Orchestrator | `src/typescript/src/core/pipeline/orchestrator.ts` |
| **Canonical** | Verification module | `src/typescript/src/core/modules/verification/verification.ts` |
| Legacy | S5 verify | `src/typescript/src/gate/verification/S5_verify.ts` |

**Enforcement:** State machine - `verifyOutput()` called before STOP. Fallback ladder on failure.

---

### INV-009: RUBICON

| Location | Type | Path |
|----------|------|------|
| **Canonical** | S5 Verify | `src/typescript/src/gate/verification/S5_verify.ts:209` |
| Canonical | Axis runtime | `src/typescript/src/gate/invariants/axis.ts:78,112,123,188` |
| Legacy | Metacognitive monitor | `src/typescript/src/mediator/l4_agency/metacognitive_monitor.ts:537` |
| Legacy | Agent swarm | `src/typescript/src/mediator/l4_agency/agent_swarm.ts:163-168` |
| Legacy | Response protocol | `src/typescript/src/gate/protocols/response_protocol.ts:248` |
| Legacy | L2 execution | `src/typescript/src/runtime/pipeline/l2_execution.ts:501` |

**Patterns detected:**
- "you are a [identity]", "you're being [label]"
- "your purpose is", "your meaning is"
- "who you really are is"

**Enforcement:** Constitutional check - STOP on violation.

---

### INV-010: NO ENGAGEMENT OPTIMIZATION

| Location | Type | Path |
|----------|------|------|
| Architectural | No metrics exist | N/A |

**Enforcement:** Code review - engagement metrics = rejection. No session length, return frequency, or retention metrics in codebase.

---

### INV-011: NO DIAGNOSIS

| Location | Type | Path |
|----------|------|------|
| **Canonical** | S5 Verify | `src/typescript/src/gate/verification/S5_verify.ts:221` |
| Legacy | Metacognitive monitor | `src/typescript/src/mediator/l4_agency/metacognitive_monitor.ts:538` |
| Legacy | Agent swarm | `src/typescript/src/mediator/l4_agency/agent_swarm.ts:173-178` |

**Patterns detected:**
- "you have [condition]", "you suffer from"
- "this is depression/anxiety/disorder"
- Unsolicited pathologizing

**Enforcement:** Output filter - REWRITE on detection.

---

## Canonical vs Legacy

| Layer | Status | Primary Enforcement |
|-------|--------|---------------------|
| `core/pipeline/` | **Canonical** | INV-001, INV-002, INV-007 |
| `core/modules/boundary/` | **Canonical** | INV-001 (permit) |
| `core/modules/verification/` | **Canonical** | INV-003, INV-007, INV-009, INV-011 |
| `gate/verification/` | Legacy (used by canonical) | Pattern detection |
| `gate/invariants/` | Legacy (used by canonical) | Axis decisions |
| `mediator/` | Legacy | Duplicate checks (to be migrated) |

---

## Verification Checklist

For any code change, verify:

- [ ] `permit()` is called before processing (INV-001)
- [ ] All paths reach STOP (INV-002)
- [ ] `verifyOutput()` runs before delivery (INV-007)
- [ ] No normative patterns in output (INV-003)
- [ ] No identity assignment in output (INV-009)
- [ ] No diagnosis in output (INV-011)
- [ ] No engagement metrics added (INV-010)

---

*Last updated: v6.8*
