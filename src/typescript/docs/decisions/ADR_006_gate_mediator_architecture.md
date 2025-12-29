# ADR-006: GATE-MEDIATOR-OPERATIONAL Architecture

## Status
Accepted (Updated 2024-12-28)

> **Note (v6.0):** Per [ADR-007](./ADR_007_enoq_canonical_architecture.md), ENOQ is the total system.
> LIMEN is now understood as one of nine organs (the boundary/threshold organ).
> The architecture described here remains valid - the subsystems map to ENOQ's organs.

## Date
2024-12-28

## Context

ENOQ (the total system) required a cleaner separation of operational and normative concerns. The architecture described here defines the code organization within the `gate/`, `operational/`, `mediator/`, and `runtime/` directories.

## Decision

ENOQ's codebase is organized into four primary subsystems:

```
ENOQ (the total system)
├── INTERFACE    - Shared contracts and types
├── GATE         - Normative gating (LIMEN, TELOS, IMMUNIS organs)
├── OPERATIONAL  - Routing, detection (SENSUS organ)
├── MEDIATOR     - Cognitive mediation (LOGOS, ERGON, NEXUS, CHRONOS, META organs)
└── RUNTIME      - Execution layer (pipeline, IO)
```

### INTERFACE (Contracts)
- `interface/types.ts` - All shared type definitions
  - DimensionalState, VerticalDimension, IntegrationMetrics
  - RiskFlags, ADSScore, MotiveDistribution
  - PolicyAdjustments, DelegationPrediction
  - RegimeClassification, ExistentialSpecificity

### GATE (Normative Control)
The gate provides inhibitory and regulatory control:
- `gate/invariants/` - Constitutional constraints (axis.ts)
- `gate/thresholds/` - LLM cache
- `gate/emergency/` - Crisis detection
- `gate/withdrawal/` - Lifecycle control, regulatory store
- `gate/verification/` - S5 verification, plan-act verifier
- `gate/enforcement/` - Domain governor, ADS detector, second-order observer

### OPERATIONAL (Routing & Detection)
Operational geometry for routing decisions:
- `operational/detectors/` - Dimensional detection, LLM detectors, ultimate detector
- `operational/gating/` - Unified gating, NP gating, scientific gating
- `operational/providers/` - LLM providers, gate client
- `operational/signals/` - Early signals processing

### MEDIATOR (Cognitive Processing)
The mediator processes information through L1-L5 layers:
- `mediator/l1_clarify/` - Perception
- `mediator/l2_reflect/` - Selection, stochastic field
- `mediator/l3_integrate/` - Meta-kernel, disciplines synthesis
- `mediator/l4_agency/` - Total system, agent swarm
- `mediator/l5_transform/` - Generation, plan rendering, response planning
- `mediator/concrescence/` - Whiteheadian process integration

### RUNTIME (Execution Layer)
The execution layer:
- `runtime/pipeline/` - enoq() main entry point, L2 execution
- `runtime/io/` - CLI, interactive session, agent responses

### RESEARCH (Experimental - Isolated)
- `research/genesis/` - GENESIS experiments
- `research/enoq_cli.ts` - Standalone CLI
- `research/server.ts` - HTTP server

## Dependency Rules

```
interface/ <── gate/ <── operational/ <── mediator/ <── runtime/
                                                          │
                                                          ↓
                                                      research/
```

**CRITICAL RULES**:
- `interface/` MUST NOT import anything
- `gate/` imports ONLY from `interface/`
- `operational/` imports from `interface/`, `gate/`
- `mediator/` imports from `interface/`, `gate/`, `operational/`
- `runtime/` imports from `interface/`, `gate/`, `operational/`, `mediator/`
- `research/` is ISOLATED (cannot be imported by production code)

### Known Architectural Coupling (Documented)

| From | To | Reason |
|------|----|--------|
| gate/verification/ | mediator/l5_transform/response_plan | ResponsePlan types |
| gate/withdrawal/ | mediator/l5_transform/response_plan | ResponsePlan types |
| operational/signals/ | mediator/l5_transform/response_plan | ResponsePlan types |
| mediator/concrescence/ | runtime/pipeline | enoq() function |
| runtime/pipeline/ | research/genesis | field_integration |

## Enforcement

Import boundaries are enforced by:
1. `scripts/check-imports.sh` - Shell script for CI
2. TypeScript compilation (fails on broken imports)

## Canonical Sentence

> ENOQ is an autopoietic viable system composed of nine organs, with code organized into interface, gate, operational, mediator, and runtime subsystems.

## Consequences

- Clear four-layer separation: interface → gate → operational → mediator → runtime
- Normative concerns in gate/, operational concerns in operational/
- Shared types in interface/ prevent circular dependencies
- Research code is isolated from production
- Import boundaries are enforced by scripts
