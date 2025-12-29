# LIMEN

**Cognitive Control System for Human Flourishing**

> *LIMEN is a cognitive control system composed of a normative gate and a cognitive mediator, with optional runtimes such as ENOQ.*

[![Release](https://img.shields.io/badge/release-v5.2-blue)](https://github.com/rossignoliluca/LIMEN-CORE/releases)
[![Tests](https://img.shields.io/badge/tests-618%20passing-green)](https://github.com/rossignoliluca/LIMEN-CORE)
[![Architecture](https://img.shields.io/badge/architecture-GATE%20%2B%20MEDIATOR-purple)](https://github.com/rossignoliluca/LIMEN-CORE)

---

## What is LIMEN?

LIMEN (Latin: "threshold") is a cognitive architecture that integrates 215 disciplines to facilitate human flourishing without creating dependency.

**LIMEN can:**
- Do everything operationally (write, analyze, structure, execute)
- See everything about the field (emotions, domains, patterns)

**LIMEN cannot:**
- Decide what matters for you
- Define your identity
- Assign your purpose
- Recommend what you should do

This is not a limitation. It is the architecture.

---

## The Paradox (Conservation Law)

```
forall DP_operativa -> L_normativa = 0 (invariant)
```

Every time operational power increases, normative sovereignty remains **structurally zero**.

**Three Acts:**

| Act | Level | Nature |
|-----|-------|--------|
| **SEE** | L1 | Always (perceive field) |
| **DO** | L2 | Delegable (execute tasks) |
| **DECIDE** | Human | Never delegable |

---

## Architecture (v5.2)

```
src/
├── interface/                       # Pure types (no imports)
│   └── types.ts
│
├── gate/                            # Normative constraints (HARD limits)
│   ├── invariants/                  # Constitutional constraints (axis.ts)
│   ├── thresholds/                  # LLM cache
│   ├── enforcement/                 # domain_governor, ads_detector, second_order
│   ├── withdrawal/                  # Regulatory store, lifecycle
│   └── verification/                # S5_verify, plan_act_verifier
│
├── operational/                     # Detection, gating, signals
│   ├── detectors/                   # dimensional_system, llm_detector, ultimate
│   ├── gating/                      # unified_gating, np_gating, scientific
│   ├── signals/                     # early_signals
│   └── providers/                   # gate_client, gate_embedded, llm_provider
│
├── mediator/                        # Pure transformations (no IO)
│   ├── l1_clarify/                  # Perception
│   ├── l2_reflect/                  # Selection, stochastic field
│   ├── l3_integrate/                # Meta-kernel, disciplines synthesis
│   ├── l4_agency/                   # Total system, agent swarm
│   ├── l5_transform/                # Response plan, agent responses
│   └── concrescence/                # Whiteheadian process integration
│
├── runtime/                         # Pipeline orchestration, IO
│   ├── pipeline/                    # Main pipeline, l2_execution
│   ├── io/                          # CLI, interactive session
│   └── experimental/                # Field integration bridge
│
├── research/                        # Isolated experiments (never imported)
│   ├── genesis/                     # Field theory, attractors
│   └── cognitive_router/            # Advanced routing research
│
└── benchmarks/                      # Test cases
```

### Import Boundaries

```
interface/ <-- gate/ <-- operational/ <-- mediator/ <-- runtime/
```

| Layer | Can Import From |
|-------|-----------------|
| `interface/` | Nothing |
| `gate/` | `interface/` only |
| `operational/` | `interface/`, `gate/` |
| `mediator/` | `interface/`, `gate/`, `operational/` |
| `runtime/` | All of the above |
| `research/` | Anything (but never imported by production) |

---

## Core Components

### GATE (Normative Control)
- **AXIS**: Constitutional invariants (INV-003, INV-009, INV-011)
- **S5 Verify**: Constitutional enforcement
- **ADS Detector**: Delegation detection -> HARD constraints
- **Second Order Observer**: Enchantment cooling -> SOFT constraints

### OPERATIONAL (Detection & Routing)
- **Dimensional System**: V_MODE, emergency, vertical/horizontal detection
- **Unified Gating**: Single routing point (69% LLM call reduction)
- **LLM Providers**: Abstraction over Claude/GPT APIs

### MEDIATOR (Cognitive Processing)
- **L1 Clarify**: Perception of the field
- **L2 Reflect**: Selection, stochastic field dynamics
- **L3 Integrate**: Meta-kernel, 215 disciplines synthesis
- **L4 Agency**: Total system orchestration
- **L5 Transform**: Response generation
- **Concrescence**: Whiteheadian process philosophy

### RUNTIME
- **Pipeline**: Main ENOQ processing flow
- **IO**: CLI and interactive sessions

---

## Key Invariants

| ID | Invariant | Enforcement |
|----|-----------|-------------|
| INV-003 | No normative delegation | S5 pattern check |
| INV-009 | Rubicon (identity/meaning) | S5 + V_MODE |
| INV-011 | No diagnosis | S5 pattern check |

---

## Unified Gating (v5.1)

```
INPUT -> Fast Regex (1-5ms) -> Unified Gating (1ms)
                                    |
        +---------------------------+---------------------------+
        |                           |                           |
   SAFETY BYPASS              CACHE HIT                 HARD SKIP
   (emergency/v_mode)         (repeat query)            (factual/ack)
        |                           |                           |
        +---------------------------+---------------------------+
                                    |
                              NP GATING
                           A(x) > tau -> LLM
                           A(x) <= tau -> SKIP
```

**Results:**
- 69% skip rate on realistic traffic
- 0 missed V_MODE or emergency cases
- 100% cache hit on replay

---

## Quick Start

```bash
cd src/typescript
npm install
npm test                    # Run all tests
npm run build               # Build TypeScript
```

### Run Demos

```bash
# Interactive session
npx ts-node src/runtime/io/interactive_session.ts

# CLI
npx ts-node src/runtime/io/cli.ts
```

---

## Architecture Decision Records (ADR)

| ADR | Title |
|-----|-------|
| ADR-000 | Two Geometries + Threshold |
| ADR-001 | Plan-First Decision + Pre-Render Enforcement |
| ADR-002 | Monotonic Tightening + Canonical Fallbacks |
| ADR-003 | Research Isolation + Promotion Gate |
| ADR-004 | Unified Gating (v5.1 Routing) |
| ADR-005 | Rename to LIMEN |
| ADR-006 | GATE-MEDIATOR Architecture |

---

## Scientific Foundations

| Theory | Author | Implementation |
|--------|--------|----------------|
| Process Philosophy | Whitehead | `concrescence_engine.ts` |
| Autopoiesis | Maturana/Varela | Reciprocal constraints |
| Free Energy Principle | Friston | Langevin dynamics |
| Global Workspace | Baars | Pipeline architecture |
| Integrated Information | Tononi | Phi calculation |
| Complementary Learning | McClelland | Memory system |

---

## Status

| Component | Status | Coverage |
|-----------|--------|----------|
| GATE | Production | Invariants, Enforcement, Verification |
| OPERATIONAL | Production | Detectors, Gating, Providers |
| MEDIATOR | Production | L1-L5, Concrescence |
| RUNTIME | Production | Pipeline, IO |
| Research | Experimental | Genesis, Cognitive Router |
| Benchmarks | Complete | 100+ test cases |

---

## Philosophy

From the META_KERNEL:

> **Pattern 6: THE GUIDE WITHDRAWS**
>
> The true guide creates independence, not dependence.
> The goal is always the person's own capacity.
> Attachment to the guide is a failure of guidance.
>
> **Success = the person doesn't need LIMEN.**

---

## License

Private. Contact for licensing.

---

## Contributors

**Creator & Architect:** Luca Rossignoli

**AI Collaborators:**
- Claude (Anthropic) - Primary architecture partner
- GPT-4 (OpenAI) - Research and ideation
- Other LLMs - Various contributions

This project was developed through extensive human-AI collaboration.

---

*"LIMEN ti porta fino al punto in cui vorresti delegare. E li ti restituisce a te stesso."*
