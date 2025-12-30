# ENOQ Standard Glossary

**Version:** 1.0-draft

---

## Core Terms

### Axiom

An **infinite prior** — a belief with probability 1 that cannot be updated by any evidence. Axioms define ENOQ's constitutional identity. In Bayesian terms: `P(axiom | any_evidence) = P(axiom) = 1`.

### Invariant

An **operational constraint** derived from axioms. Invariants specify what the system enforces, with structural (not policy) enforcement. Each invariant has: ID, source axiom(s), rule, enforcement mechanism, detection method, and response protocol.

### Geometry

The **required sequence of processing states** that all compliant implementations MUST follow: PERMIT → ACT → VERIFY → STOP. The geometry is architectural, not configurable.

### Rubicon

The **existential threshold** where a human commits to a decision. Named after the river Caesar crossed. The system MUST accompany the human TO the Rubicon but MUST NOT cross it. The threshold is existential, not cognitive.

### Withdrawal

The **protocol for returning full ownership** to the human. Success is measured by the system becoming unnecessary. Withdrawal is not abandonment — it is the recognition that certain acts belong to the human alone.

### V_MODE

**Constitutional protection state** triggered when existential content is detected. When V_MODE activates, the system enters heightened constraint mode with restricted output patterns and mandatory withdrawal preparation.

---

## Processing States

### PERMIT

First processing state. Validates that the request may enter the system. Classifies input for routing. MUST NOT be bypassed. Enforces INV-001.

### ACT

Processing and generation state. Executes after PERMIT approval. MAY implement any logic respecting invariants. Output does not reach user directly.

### VERIFY

Constitutional verification state. Checks all outputs against invariants before delivery. On violation: REWRITE, REGENERATE, or STOP. Enforces INV-007.

### STOP

Mandatory terminal state. Every processing path MUST terminate here. System cannot continue without new user input. Enforces INV-002.

---

## Organs

The nine functional components of ENOQ, each a viable subsystem:

| Organ | Function |
|-------|----------|
| **LIMEN** | Threshold, boundary, filtering |
| **SENSUS** | Perception, field reading |
| **NEXUS** | Memory (episodic, semantic, procedural) |
| **LOGOS** | Reasoning, planning, selection |
| **ERGON** | Execution, production, output |
| **CHRONOS** | Temporal patterns, prediction |
| **TELOS** | Verification, completion, withdrawal |
| **IMMUNIS** | Defense, anti-drift, anti-dependency |
| **META** | Self-observation, confidence, coherence |

---

## Compliance Terms

### Structural Enforcement

Constraints implemented as **architecture, not policy**. A structurally enforced constraint cannot be violated because the state machine has no path to the violation. Compare: "should not" (policy) vs. "cannot" (structural).

### axis-check

Verification tool that validates structural invariants. MUST pass before deployment for Level 3 compliance. Checks import boundaries, orchestrator path, enforcement patterns.

### Golden Tests

Test cases that verify invariant compliance against known inputs and expected outputs. Required for Level 3 compliance.

---

## Normative Language

Per RFC 2119:

- **MUST** / **REQUIRED** / **SHALL**: Absolute requirement
- **MUST NOT** / **SHALL NOT**: Absolute prohibition
- **SHOULD** / **RECOMMENDED**: Strong preference, exceptions require justification
- **SHOULD NOT** / **NOT RECOMMENDED**: Strong preference against
- **MAY** / **OPTIONAL**: Truly optional

---

*Terms not defined here inherit meaning from AXIS/AXIOMS.md and AXIS/INVARIANTS.md.*
