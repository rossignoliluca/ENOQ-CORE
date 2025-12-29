# ENOQ-CORE

Constitutional cognitive core. AXIS + Pipeline + 9 Modules.

> ENOQ is the system. LIMEN is one of nine modules.

---

## Structure

```
ENOQ-CORE/
├── AXIS/                        # FROZEN constitutional ground
│   ├── AXIOMS.md                # 12 axioms
│   ├── INVARIANTS.md            # INV-001 to INV-011
│   └── RUBICON.md               # Decision threshold
│
├── src/typescript/src/
│   ├── core/modules/            # 9 modules with READMEs
│   │   ├── boundary (LIMEN)
│   │   ├── perception (SENSUS)
│   │   ├── memory (NEXUS)
│   │   ├── reasoning (LOGOS)
│   │   ├── execution (ERGON)
│   │   ├── temporal (CHRONOS)
│   │   ├── verification (TELOS)
│   │   ├── defense (IMMUNIS)
│   │   └── metacognition (META)
│   ├── runtime/pipeline/        # State machine S0→S6
│   ├── operational/gating/      # unified_gating.ts (canonical)
│   └── external/cache/          # Caching
│
├── docs/REPO_CONTRACT.md        # FROZEN architecture rules
└── experimental/                # Not production code
```

---

## Frozen Rules

See [docs/REPO_CONTRACT.md](./docs/REPO_CONTRACT.md):

1. `unified_gating.ts` is the only canonical gating export
2. `experimental/legacy/` must NOT be imported from core
3. `external/cache/` is the only location for caching
4. `enoq()` is the sole entry point surfaces → core
5. `np_gating.ts` is internal, not exported
6. `research/` does not exist

---

## Run

```bash
cd src/typescript
npm install
npm test              # 618 tests
npm run build
```

Interactive:
```bash
npx ts-node src/runtime/io/interactive_session.ts
```

---

## Start Reading

| What | Where |
|------|-------|
| Constitutional ground | [AXIS/AXIOMS.md](./AXIS/AXIOMS.md) |
| Pipeline flow | [src/typescript/src/core/pipeline/README.md](./src/typescript/src/core/pipeline/README.md) |
| Module docs | [src/typescript/src/core/modules/](./src/typescript/src/core/modules/) |
| Architecture rules | [docs/REPO_CONTRACT.md](./docs/REPO_CONTRACT.md) |

---

## What is NOT Here

- No product UI (this is core only)
- `experimental/` is quarantined research, not production
- No external integrations beyond LLM providers

---

## Tags

| Tag | Meaning |
|-----|---------|
| `v0.1-geometry-clean` | Structure frozen, invariants defined |

---

## License

Private. Contact for licensing.

---

**Creator:** Luca Rossignoli
