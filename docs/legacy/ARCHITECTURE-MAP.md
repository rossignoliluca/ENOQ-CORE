# ENOQ ARCHITECTURE MAP v1.0

**Document ID:** ENOQ-ARCHITECTURE-MAP  
**Status:** Core Reference  
**Date:** 2025-12-25  
**Resolves:** Gap #7 (L0/L1/L2 vs S0-S6 Alignment)  

---

## Purpose

Two naming systems exist in ENOQ:
- **L-Levels**: Conceptual layers (L0, L1, L2)
- **S-States**: Operational states (S0-S6)

This document defines their **exact relationship**.

---

## The Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                           AXIS                                  │
│                    (Pre-system invariant)                       │
│                                                                 │
│         Not a level. Not a state. The ground itself.           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    L0 — CONSTITUTIONAL GATE                                     │
│    ─────────────────────────                                    │
│                                                                 │
│    Implemented by: S0 PERMIT                                    │
│                                                                 │
│    Function:                                                    │
│    • Crisis detection                                           │
│    • Injection detection                                        │
│    • Constitutional violation check                             │
│    • Intent classification (NEW)                                │
│                                                                 │
│    Output: RequestIntent + PERMIT/DENY                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    L1 — PERCEPTION & PLANNING                                   │
│    ───────────────────────────                                  │
│                                                                 │
│    Implemented by: S1 SENSE + S2 CLARIFY + S3 PLAN             │
│                                                                 │
│    S1 SENSE:                                                    │
│    • Build FieldModel                                           │
│    • Detect domains                                             │
│    • Assess arousal, depth, Kegan stage                        │
│                                                                 │
│    S2 CLARIFY:                                                  │
│    • Resolve critical gaps                                      │
│    • Ask clarifying questions                                   │
│                                                                 │
│    S3 PLAN:                                                     │
│    • Select or generate runtime                                 │
│    • Configure parameters                                       │
│    • Set completion criteria                                    │
│                                                                 │
│    Output: RuntimeSelection + Plan                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    L2 — EXECUTION                                               │
│    ───────────────                                              │
│                                                                 │
│    Implemented by: S4 ACT                                       │
│                                                                 │
│    Function:                                                    │
│    • Execute selected runtime                                   │
│    • Generate output                                            │
│    • Produce artifacts                                          │
│                                                                 │
│    Output: Artifact / Response / Draft                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    VERIFICATION & TERMINATION                                   │
│    ───────────────────────────                                  │
│    (Not a separate L-level; system-wide function)               │
│                                                                 │
│    Implemented by: S5 VERIFY + S6 STOP                         │
│                                                                 │
│    S5 VERIFY:                                                   │
│    • Check completion criteria                                  │
│    • Constitutional compliance                                  │
│    • Quality standards                                          │
│    • Loop back to S4 if fixable                                │
│                                                                 │
│    S6 STOP:                                                     │
│    • Mandatory termination                                      │
│    • Release control                                            │
│    • Update structural memory                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Table

| L-Level | S-State(s) | Function | Primary Question |
|---------|------------|----------|------------------|
| — | — | AXIS | "What is legitimate?" |
| L0 | S0 PERMIT | Gate | "Can we proceed?" |
| L1 | S1 SENSE | Perceive | "What is the field?" |
| L1 | S2 CLARIFY | Resolve gaps | "What do we need to know?" |
| L1 | S3 PLAN | Select/Generate | "How do we approach this?" |
| L2 | S4 ACT | Execute | "What do we produce?" |
| — | S5 VERIFY | Check | "Is this correct?" |
| — | S6 STOP | Terminate | "Are we done?" |

---

## Why Two Systems?

### L-Levels (Conceptual)

Used for:
- Architectural discussion
- Constitutional alignment
- Explaining the system to humans

**L-levels answer: "What kind of thing is happening?"**

### S-States (Operational)

Used for:
- Implementation
- State machine transitions
- Logging and debugging

**S-states answer: "Where are we in the process?"**

---

## Mapping Rules

### Rule 1: AXIS Is Above Both

```yaml
axis_position:
  l_system: "Not a level. Pre-level."
  s_system: "Not a state. Pre-state."
  relationship: "AXIS constrains all levels and all states."
```

### Rule 2: L0 = S0

```yaml
l0_s0:
  equivalence: "Direct 1:1"
  l0: "Constitutional gate"
  s0: "PERMIT state"
  note: "The first check. Hard gate. No bypass."
```

### Rule 3: L1 = S1 + S2 + S3

```yaml
l1_states:
  equivalence: "L1 spans three states"
  reason: |
    L1 is "perception and planning" - a conceptual category.
    Operationally, this unfolds as:
    - S1: Build the field model
    - S2: Clarify if needed
    - S3: Select/generate runtime
  note: "L1 is where the system 'understands' the request."
```

### Rule 4: L2 = S4

```yaml
l2_s4:
  equivalence: "Direct 1:1"
  l2: "Execution"
  s4: "ACT state"
  note: "Where work happens. Artifacts produced."
```

### Rule 5: Verify/Stop Are Cross-Cutting

```yaml
verify_stop:
  l_system: "Not a separate level"
  reason: |
    Verification and termination are system-wide functions.
    They ensure L0, L1, L2 outputs are correct.
    They enforce Constitution across all levels.
  s_system: "S5 VERIFY and S6 STOP"
```

---

## The Complete Flow

```
USER INPUT
    │
    ▼
┌───────────────────────────────────────────────┐
│ L0 / S0 PERMIT                                │
│ • Is this request legitimate?                 │
│ • Crisis? Injection? Constitutional issue?   │
│ • Output: RequestIntent + PERMIT/DENY        │
└───────────────────────────────────────────────┘
    │
    │ If PERMIT
    ▼
┌───────────────────────────────────────────────┐
│ L1 / S1 SENSE                                 │
│ • What is the field?                          │
│ • Domains, arousal, depth, Kegan             │
│ • Output: FieldModel                          │
└───────────────────────────────────────────────┘
    │
    │ If needs clarification
    ▼
┌───────────────────────────────────────────────┐
│ L1 / S2 CLARIFY                               │
│ • What's missing?                             │
│ • Ask 1-2 questions max                       │
│ • Return to S1 with answer                    │
└───────────────────────────────────────────────┘
    │
    │ If enough info
    ▼
┌───────────────────────────────────────────────┐
│ L1 / S3 PLAN                                  │
│ • Which runtime?                              │
│ • What parameters?                            │
│ • What completion criteria?                   │
│ • Output: Plan + RuntimeSelection            │
└───────────────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────────────┐
│ L2 / S4 ACT                                   │
│ • Execute the plan                            │
│ • Generate output                             │
│ • Produce artifact                            │
└───────────────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────────────┐
│ S5 VERIFY                                     │
│ • Completion criteria met?                    │
│ • Constitutional compliance?                  │
│ • Quality acceptable?                         │
│ • If fixable → return to S4                  │
└───────────────────────────────────────────────┘
    │
    │ If pass
    ▼
┌───────────────────────────────────────────────┐
│ S6 STOP                                       │
│ • Deliver output                              │
│ • Update structural memory                    │
│ • Release control                             │
│ • Wait for new input                          │
└───────────────────────────────────────────────┘
    │
    ▼
USER RECEIVES OUTPUT
```

---

## When to Use Which

| Context | Use L-Levels | Use S-States |
|---------|--------------|--------------|
| Explaining architecture | ✓ | |
| Writing documentation | ✓ | |
| Constitutional discussion | ✓ | |
| Implementation | | ✓ |
| Debugging | | ✓ |
| Logging | | ✓ |
| State machine code | | ✓ |
| Transition logic | | ✓ |

---

## Terminology Guide

When writing documents:

```yaml
terminology:
  philosophical:
    - "L0 gate" ✓
    - "L1 perception" ✓
    - "L2 execution" ✓
    
  operational:
    - "S0 PERMIT" ✓
    - "S1 SENSE" ✓
    - "S3 PLAN" ✓
    - "S4 ACT" ✓
    
  avoid:
    - "L3" (doesn't exist)
    - "S7" (doesn't exist)
    - Mixing in same sentence without clarity
    
  correct_mixing:
    - "L0, implemented as S0 PERMIT, checks..."
    - "During L1 (states S1-S3), the system..."
```

---

## Summary Table

```
┌──────────────────────────────────────────────────────────────────────┐
│                         ENOQ ARCHITECTURE                            │
├──────────────┬────────────────┬───────────────────────────────────────┤
│   L-Level    │    S-State     │              Function                 │
├──────────────┼────────────────┼───────────────────────────────────────┤
│   (AXIS)     │     (—)        │  Orienting invariants                 │
├──────────────┼────────────────┼───────────────────────────────────────┤
│     L0       │   S0 PERMIT    │  Constitutional gate                  │
├──────────────┼────────────────┼───────────────────────────────────────┤
│              │   S1 SENSE     │  Build field model                    │
│     L1       │   S2 CLARIFY   │  Resolve gaps                         │
│              │   S3 PLAN      │  Select/generate runtime              │
├──────────────┼────────────────┼───────────────────────────────────────┤
│     L2       │   S4 ACT       │  Execute, produce output              │
├──────────────┼────────────────┼───────────────────────────────────────┤
│     (—)      │   S5 VERIFY    │  Check compliance & quality           │
│     (—)      │   S6 STOP      │  Terminate & release                  │
└──────────────┴────────────────┴───────────────────────────────────────┘
```

---

*"Two names for the same territory. Use the right one for the right purpose."*
