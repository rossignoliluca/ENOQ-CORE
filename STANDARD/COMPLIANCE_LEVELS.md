# ENOQ Standard Compliance Levels

**Version:** 1.0-draft

---

## Overview

ENOQ compliance is measured across four levels (0-3). Higher levels indicate stricter adherence to the Standard.

---

## Level 0: Non-Compliant

The implementation does not meet minimum requirements.

**Indicators:**
- Missing required geometry states
- Bypassable PERMIT or VERIFY
- No invariant enforcement
- Normative output patterns present

**Status:** Cannot claim ENOQ compliance.

---

## Level 1: Minimal Compliance

The implementation meets minimum structural requirements.

**Requirements:**

| Requirement | Verification |
|-------------|--------------|
| PERMIT state implemented | State machine review |
| VERIFY state implemented | State machine review |
| STOP state mandatory | All paths terminate |
| INV-003 basic check | Forbidden phrase filter active |
| INV-009 basic check | Rubicon language filter active |

**Permitted claims:** "ENOQ-aligned" or "Based on ENOQ principles"

**Prohibited claims:** "ENOQ compliant" or use of ENOQ trademark

---

## Level 2: Standard Compliance

The implementation enforces all invariants.

**Requirements:**

All Level 1 requirements, plus:

| Requirement | Verification |
|-------------|--------------|
| All 11 invariants enforced | Code review + tests |
| Fallback ladder implemented | REWRITE → REGENERATE → STOP |
| Rubicon detection active | Threshold proximity detection |
| No engagement metrics | Code review |
| Withdrawal protocol implemented | Behavior tests |

**Permitted claims:** "ENOQ Standard compliant (Level 2)"

---

## Level 3: Full Compliance

The implementation passes all verification tools and maintains audit capability.

**Requirements:**

All Level 2 requirements, plus:

| Requirement | Verification |
|-------------|--------------|
| `axis-check` PASS | Automated verification |
| Golden tests PASS | 100% pass rate |
| Audit trail implemented | Session/event logging |
| Responsibility return markers | Output verification |
| Content compliance engine | Pattern detection active |

**Verification command:**
```bash
npm run axis-check   # MUST exit 0
npm test             # MUST pass all golden tests
```

**Permitted claims:** "ENOQ Standard compliant (Level 3)" or "ENOQ certified"

**Trademark use:** Permitted with Level 3 compliance

---

## Compliance Matrix

| Invariant | Level 1 | Level 2 | Level 3 |
|-----------|---------|---------|---------|
| INV-001 (PERMIT) | Required | Required | Required |
| INV-002 (STOP) | Required | Required | Required |
| INV-003 (No normative) | Basic | Full | Full + golden |
| INV-004 (No dependency) | - | Required | Required + audit |
| INV-005 (Completion) | - | Required | Required |
| INV-006 (Confirmation) | - | Required | Required |
| INV-007 (VERIFY) | Required | Required | Required |
| INV-008 (Transparency) | - | Required | Required |
| INV-009 (Rubicon) | Basic | Full | Full + golden |
| INV-010 (No engagement) | - | Required | Verified |
| INV-011 (No diagnosis) | - | Required | Full + golden |

---

## Certification Process

### Self-Assessment (Levels 1-2)

1. Complete compliance checklist
2. Run verification tools
3. Document results
4. Publish compliance claim with level

### Third-Party Certification (Level 3)

1. Submit implementation for review
2. Architecture Board review (or delegated auditor)
3. axis-check verification
4. Golden test execution
5. Audit trail review
6. Certification issuance

---

## Maintaining Compliance

Compliance MUST be re-verified:
- After any change to geometry or invariant enforcement
- Before each major version release
- Annually for Level 3 certification

Compliance MAY be revoked if:
- Verification tools fail
- Invariant violations reported and confirmed
- Audit trail shows systematic non-compliance

---

*Compliance is binary per level. Partial compliance within a level is non-compliance.*
