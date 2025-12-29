# AXIS Runtime Contract

**Status:** Enforced by `npm run axis-check`
**Semantics:** PASS/FAIL binary

---

## Contract Definition

For ENOQ to be considered "AXIS enforced", ALL conditions must be met:

### 1. Structural Invariants (State Machine)

| Check | Requirement | FAIL Condition |
|-------|-------------|----------------|
| **PERMIT_FIRST** | `permit()` called before runtime delegation | Orchestrator path missing permit() |
| **VERIFY_LAST** | `verifyOutput()` called before STOP | Orchestrator path missing verifyOutput() |
| **STOP_REACHED** | All paths emit STOP signal | Orchestrator return without STOP signal |

### 2. Import Boundaries

| Check | Requirement | FAIL Condition |
|-------|-------------|----------------|
| **NO_SURFACE_CORE** | surfaces/ cannot import from core/modules/ | Any import found |
| **NO_EXTERNAL_CORE** | external/ cannot import from core/modules/ | Any import found |
| **NO_CORE_EXPERIMENTAL** | core/ cannot import from experimental/ | Any import found |

### 3. Enforcement Presence

| Check | Requirement | FAIL Condition |
|-------|-------------|----------------|
| **INV_003_PRESENT** | S5_verify.ts contains INV-003 patterns | Pattern section missing |
| **INV_009_PRESENT** | S5_verify.ts contains INV-009 patterns | Pattern section missing |
| **INV_011_PRESENT** | S5_verify.ts contains INV-011 patterns | Pattern section missing |

---

## PASS Semantics

```
AXIS Contract: PASS
- All structural invariants verified
- All import boundaries clean
- All enforcement patterns present
```

The system is AXIS-compliant. Geometry cannot be bypassed.

---

## FAIL Semantics

```
AXIS Contract: FAIL
- Violation: [specific check that failed]
- Location: [file:line if applicable]
```

The system is NOT AXIS-compliant. **Do not deploy.**

---

## Verification Command

```bash
npm run axis-check
```

Exit codes:
- `0`: PASS
- `1`: FAIL (with violation details)

---

## Enforcement Points

```
                    ┌─────────────────────────┐
                    │     axis-check          │
                    │   (npm run axis-check)  │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Import Check  │    │ Orchestrator     │    │ Enforcement      │
│               │    │ Path Check       │    │ Presence Check   │
├───────────────┤    ├──────────────────┤    ├──────────────────┤
│ surfaces →    │    │ permit() exists  │    │ INV-003 patterns │
│ external →    │    │ verifyOutput()   │    │ INV-009 patterns │
│ core →        │    │ STOP signal      │    │ INV-011 patterns │
└───────────────┘    └──────────────────┘    └──────────────────┘
```

---

## Adding New Checks

New contract checks require:

1. Definition in this file
2. Implementation in `scripts/axis-check.sh`
3. Test coverage
4. Documentation update

Contract checks are additive. Once added, a check cannot be removed without Architecture Board review.

---

*"The contract that can be disabled is not a contract."*
