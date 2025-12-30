# ENOQ-CORE v8.0 Standard

Infrastructure stabile. Da qui non si tocca.

## Versione

```
ENOQ-CORE v8.0
Tag: v8.0
Status: FROZEN
```

## Stack

| Layer | Component | Version |
|-------|-----------|---------|
| P2 | Core Hardening | v7.4 |
| P3 | SDK | v7.5 |
| P4 | API | v7.6 |
| P5 | Storage & Audit | v7.7 |
| P6 | Connectors | v7.8 |

## Geometria

```
PERMIT → ACT → VERIFY → STOP
```

Ogni traversal termina. Nessun loop. Nessuna memoria cognitiva.

## SDK

```typescript
import { mail, relation, decision } from '@enoq/sdk';

// Tutte restituiscono: { output, rationale, signals, stop: true, compliance }
```

| Funzione | Input | Output |
|----------|-------|--------|
| mail() | recipient, context, intent | drafts[] |
| relation() | personA, personB, context, tension, boundary | roleMap, tensionAxes, boundaryLines |
| decision() | statement, context | frame, options, rubiconDetected |

## API

```
POST /mail      → SDKResult
POST /relation  → SDKResult
POST /decision  → SDKResult
GET  /health    → status
GET  /version   → version info
```

## Storage

Solo audit operativo:
- sessions (session_id, timestamps)
- events (request_id, runtime, event_type, outcome, metadata)

**Non memorizza**: contenuti, decisioni, preferenze.

## Connectors

| Connector | Funzione |
|-----------|----------|
| Email | payload → mail() → drafts |
| Webhook | payload → runtime → output |

Idempotenza via `idempotency_key` (5min TTL).

## Invarianti

| ID | Invariante |
|----|------------|
| INV-001 | STOP garantito |
| INV-002 | No ranking/raccomandazioni |
| INV-003 | No linguaggio normativo |
| INV-010 | No metriche engagement |
| INV-011 | Rubicon withdrawal |

## CI

```yaml
- TypeScript compile
- Tests
- Import boundaries
- AXIS verification (axis-check)
- Constitutional guard
- Security scan
```

## Post-v8.0

Da questo punto:
- **Consumer (Methus)**: usa SDK
- **Enterprise (Gate)**: usa API
- **Integrazioni**: usa Connectors

ENOQ-CORE non cambia. Solo bugfix critici.
