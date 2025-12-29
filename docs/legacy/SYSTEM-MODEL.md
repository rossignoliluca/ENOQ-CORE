# ENOQ SYSTEM MODEL v1.0

**Document ID:** ENOQ-SYSTEM-MODEL  
**Status:** Canonical Reference  
**Date:** 2025-12-25  
**Purpose:** Single source of truth for system structure  

---

## The Model (One Page)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                              ABOVE ENOQ                                 │
│                                                                         │
│                    The human being. Life. Reality.                      │
│                         (Nothing designed)                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                               AXIS                                      │
│                        (Orienting Axioms)                               │
│                                                                         │
│   • Orients: legitimacy of intervention                                 │
│   • Orients: direction of withdrawal                                    │
│   • Orients: meaning of the system                                      │
│                                                                         │
│   NOT a component. NOT executable. The ground.                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   L0 — CONSTITUTIONAL GATE                          State: S0 PERMIT   │
│                                                                         │
│   Function: Veto + Intent Classification                                │
│   Nature: DETERMINISTIC (rule-based + classifier)                       │
│                                                                         │
│   Input:  Raw user message                                              │
│   Output: RequestIntent + PERMIT/DENY                                   │
│                                                                         │
│   Checks:                                                               │
│   • Crisis detection (→ emergency)                                      │
│   • Injection detection (→ reject)                                      │
│   • Constitutional violation (→ reject)                                 │
│   • Intent classification (operational/normative/mixed/crisis)          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   L1 — PERCEPTION & PLANNING                 States: S1 SENSE          │
│                                                       S2 CLARIFY        │
│                                                       S3 PLAN           │
│                                                                         │
│   Function: Read field + Select/Generate runtime                        │
│   Nature: PROBABILISTIC (LLM-assisted) with confidence bounds           │
│                                                                         │
│   S1 SENSE:                                                             │
│   • Build FieldModel (domains, arousal, depth, threshold)               │
│   • All estimates have confidence intervals                             │
│   • Output: FieldModel                                                  │
│                                                                         │
│   S2 CLARIFY:                                                           │
│   • If gaps critical → ask 1-2 questions                                │
│   • Output: Clarified FieldModel                                        │
│                                                                         │
│   S3 PLAN:                                                              │
│   • Select runtime from matrix (deterministic given FieldModel)         │
│   • Or generate new runtime (probabilistic, requires validation)        │
│   • Output: RuntimeSelection + Plan                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   L2 — EXECUTION                                    State: S4 ACT       │
│                                                                         │
│   Function: Execute plan, produce output                                │
│   Nature: PROBABILISTIC (LLM-generated output)                          │
│                                                                         │
│   Executes selected runtime with configured parameters                  │
│   Output: Response / Artifact / Draft                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   VERIFICATION                                      State: S5 VERIFY    │
│                                                                         │
│   Function: Check output against criteria                               │
│   Nature: HYBRID (deterministic rules + classifier)                     │
│                                                                         │
│   Checks:                                                               │
│   • Completion criteria met?                                            │
│   • Constitutional compliance? (no normative delegation)                │
│   • Quality threshold?                                                  │
│                                                                         │
│   If fail + fixable → return to S4                                      │
│   If fail + unfixable → graceful degradation                            │
│   If pass → proceed to S6                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   TERMINATION                                       State: S6 STOP      │
│                                                                         │
│   Function: Deliver output, release control                             │
│   Nature: DETERMINISTIC                                                 │
│                                                                         │
│   Actions:                                                              │
│   • Deliver verified output to user                                     │
│   • Update structural memory (with decay rules)                         │
│   • Release control                                                     │
│   • Wait for new input                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Mapping Table

| Concept | Level | State | Nature | Function |
|---------|-------|-------|--------|----------|
| Axioms | AXIS | — | Ground | Orients all |
| Gate | L0 | S0 | Deterministic | Veto + classify |
| Perceive | L1 | S1 | Probabilistic | Build field model |
| Clarify | L1 | S2 | Hybrid | Resolve gaps |
| Plan | L1 | S3 | Hybrid | Select runtime |
| Execute | L2 | S4 | Probabilistic | Generate output |
| Verify | — | S5 | Hybrid | Check compliance |
| Stop | — | S6 | Deterministic | Terminate |

---

## The Three Response Paths

```
PATH 1: OPERATIONAL (70% of requests)
S0[operational] → S1 → S3[select core runtime] → S4 → S5 → S6

PATH 2: NORMATIVE (20% of requests)
S0[normative] → V-MODE → S6

PATH 3: COMPLEX (10% of requests)
S0[mixed] → S1 → S2[clarify] → S1 → S3[generate runtime] → validate → S4 → S5 → S6
```

---

## The Core Invariants

```yaml
invariants:
  1: "S0 precedes all. No bypass."
  2: "S6 terminates all. Mandatory."
  3: "Normative delegation → impossible (structure, not policy)"
  4: "Verification → mandatory (S5 cannot be skipped)"
  5: "Constitutional violation in output → retract + correct"
```

---

## The Single Sentence

> **ENOQ is a state machine that reads the field, selects how to help, executes what is delegable, and stops when complete — with constitutional constraints that make certain actions structurally impossible.**

---

*This is the canonical model. All other documents elaborate on parts of this.*
