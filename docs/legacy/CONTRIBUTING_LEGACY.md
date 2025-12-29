# Contributing to LIMEN

Three rules to follow when contributing.

---

## Rule 1: Import Boundaries

Dependencies flow in one direction only:

```
interface/ ← gate/ ← operational/ ← mediator/ ← runtime/
```

| Layer | Can Import From |
|-------|-----------------|
| `interface/` | Nothing (pure types) |
| `gate/` | `interface/` only |
| `operational/` | `interface/`, `gate/` |
| `mediator/` | `interface/`, `gate/`, `operational/` |
| `runtime/` | All of the above |

Run `./scripts/check-imports.sh` to verify boundaries before committing.

---

## Rule 2: Research Isolation

`research/` is for experiments. Production code (`gate/`, `operational/`, `mediator/`, `runtime/`) must NEVER import from `research/`.

| Allowed | Forbidden |
|---------|-----------|
| `research/` → `operational/` | `mediator/` → `research/` |
| `research/` → `gate/` | `runtime/` → `research/` |

To promote research code to production:
1. Copy file to appropriate production layer
2. Update imports in research code to point to production
3. Delete research copy
4. Document in ADR if architectural decision

---

## Rule 3: Test Before Commit

```bash
# All commands must pass before pushing
npx tsc --noEmit           # TypeScript compiles
npx jest                   # All tests pass
./scripts/check-imports.sh # Import boundaries respected
```

---

## Quick Reference

```
src/
├── interface/     # Pure types, no logic
├── gate/          # Normative constraints (HARD limits)
├── operational/   # Detection, gating, signals
├── mediator/      # Pure transformations
├── runtime/       # Pipeline orchestration, IO
│   └── quarantine/  # Bridge to research (excluded from build)
├── research/      # Experiments (never in production build)
└── benchmarks/    # Performance tests
```

### Quarantine Rule

`runtime/quarantine/` is the ONLY place that may import from `research/`.
It is **excluded from production build** (see tsconfig.json).
Use for experimental integrations that need research code.

See `docs/ARCHITECTURE.md` for full system documentation.
