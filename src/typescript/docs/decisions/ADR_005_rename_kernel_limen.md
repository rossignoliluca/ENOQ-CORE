# ADR-005: Rename ENOQ-CORE to LIMEN

## Status
**SUPERSEDED BY [ADR-007](./ADR_007_enoq_canonical_architecture.md)**

> **Note:** This ADR incorrectly established LIMEN as the total system name.
> ADR-007 corrects this: ENOQ is the total system, LIMEN is one of nine organs.
> The naming hierarchy is now: ENOQ (system) > LIMEN (organ).

## Original Status
Accepted (November 2024) - Now superseded

## Context
The project needed a clear identity separation:
- LIMEN: This complete cognitive operating system
- ENOQ: A separate future project (not part of this repository)

The previous name "ENOQ-CORE" caused confusion about whether ENOQ was the core or a separate runtime.

## Decision
Rename the entire project from "ENOQ" to "LIMEN":

### What Changed
| Component | Old Name | New Name |
|-----------|----------|----------|
| Repository | ENOQ-CORE | LIMEN-CORE |
| System Name | ENOQ | LIMEN |
| All Documentation | ENOQ references | LIMEN references |

### Etymology
**LIMEN** (Latin): "threshold" - the point of transition between states.

This name reflects the system's core function: detecting and responding to human existential thresholds, the liminal spaces where transformation occurs.

### What Did NOT Change
- Code logic (no behavior changes)
- API exports
- Test behavior
- File structure
- Package name (if published)

## Consequences
- Clear project identity
- No confusion with future ENOQ project
- Academic publications can cite "LIMEN"
- Git history preserved

## Migration Steps Taken
1. ✅ Renamed GitHub repository: `ENOQ-CORE` → `LIMEN-CORE`
2. ✅ Updated README.md
3. ✅ Updated documentation references
4. ✅ Updated code comments where ENOQ referenced the system
5. ✅ Preserved all existing git history and tags

## Tests
- All existing tests pass unchanged
- No import changes required
- Build succeeds
