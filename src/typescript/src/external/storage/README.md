# ENOQ Storage (P5)

Minimal SQLite storage for session tracking and audit trail.

## Purpose

- Session ID correlation across requests
- Audit trail for operational events
- Retry-safe (idempotent upserts)

## What It Stores

| Table | Contents |
|-------|----------|
| `sessions` | session_id, created_at, last_activity |
| `events` | request_id, runtime, event_type, outcome, metadata, timestamp |

## What It Does NOT Store

- No message content
- No semantic memory
- No decision history
- No user preferences
- No engagement analytics

## Event Types

| Event | When |
|-------|------|
| PIPELINE_START | Request begins processing |
| PIPELINE_END | Request completes (with outcome) |
| BOUNDARY_BLOCKED | Input blocked by boundary classifier |
| VERIFY_FAILED | Output failed S5 verification |
| RUBICON_WITHDRAW | Rubicon threshold triggered |
| PROVIDER_FAILOVER | LLM provider switch |

## Outcomes

| Outcome | Meaning |
|---------|---------|
| PASS | Completed successfully |
| BLOCKED | Blocked by boundary/verification |
| WITHDRAW | Rubicon triggered withdrawal |
| ERROR | System error |

## Usage

```typescript
import { getStorage } from './external/storage';

// SDK/API write automatically via audit helpers
// Manual access (admin only):
const storage = await getStorage();
const events = await storage.getEventsByRequestId('request-id');
```

## Configuration

| Env Variable | Default | Description |
|-------------|---------|-------------|
| ENOQ_DB_PATH | ./enoq_audit.db | SQLite file path |

## Schema

```sql
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  last_activity INTEGER NOT NULL
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  request_id TEXT NOT NULL,
  runtime TEXT NOT NULL,
  event_type TEXT NOT NULL,
  outcome TEXT NOT NULL,
  metadata TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);
```
