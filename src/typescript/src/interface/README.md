# interface/

> **Layer 0** - Types and contracts only. No logic.

## Purpose

This is the innermost layer. Every other module imports from here. It contains:
- Type definitions
- Interfaces
- Constants
- Enums

## Files

| File | Description |
|------|-------------|
| `types.ts` | All ENOQ types (DimensionalState, Session, etc.) |

## Import Rules

```
interface/ ← gate/ ← operational/ ← mediator/ ← runtime/
```

- **interface/** can import: nothing (leaf layer)
- **interface/** is imported by: everything

## Key Types

```typescript
// Dimensional detection
interface DimensionalState {
  vertical_scores: Record<VerticalDimension, number>;
  horizontal_scores: Record<HumanDomain, number>;
  v_mode_triggered: boolean;
  emergency_detected: boolean;
}

// Session management
interface Session {
  id: string;
  memory: SessionMemory;
  field_state: FieldState;
}

// Pipeline response
interface ENOQResponse {
  response: string;
  trace: PipelineTrace;
  session: Session;
}
```

## Adding New Types

1. Add to `types.ts`
2. Export from `types.ts`
3. Never add logic - types only
