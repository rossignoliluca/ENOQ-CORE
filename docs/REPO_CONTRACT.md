# REPO CONTRACT

**Frozen rules. Do not violate.**

---

## Canonical Rules (v6.8+)

1. **`enoqCore()` is the canonical entry point**
   - Located: `core/pipeline/orchestrator.ts`
   - All surfaces must use `enoqCore()`, not `enoq()`
   - Pipeline: PERMIT → SENSE → ... → VERIFY → STOP

2. **`experimental/` must NOT be imported from core**
   - `core/` cannot have any import from `experimental/`
   - Enforced by `npm run axis-check`

3. **`surfaces/` and `external/` cannot import from `core/modules/`**
   - Boundary protection: external code cannot bypass geometry
   - Enforced by `npm run axis-check`

4. **`npm run axis-check` must PASS before deployment**
   - Verifies import boundaries
   - Verifies orchestrator path (permit, verify, stop)
   - Verifies enforcement presence (INV-003, INV-009, INV-011)
   - Exit 0 = PASS, Exit 1 = DO NOT DEPLOY

5. **`external/cache/` is the only location for caching**
   - No caching logic elsewhere in codebase

6. **Empty canonical directories are intentional scaffolds**
   - `external/connectors/` - ingress adapters
   - `external/storage/` - persistence adapters
   - `surfaces/api/` - HTTP API surface
   - `surfaces/sdk/` - SDK surface
   - See README.md in each directory

---

## Enforcement

```
npm run axis-check
```

**Violation = drift. Fix immediately or revert.**
