# surfaces/

> **Interaction Surfaces** - Entry points for users/systems.

## Purpose

Surfaces are thin wrappers around the runtime. They adapt ENOQ to different interaction modes: CLI, API, SDK.

## Structure

```
surfaces/
├── cli/              # Command-line interface
├── api/              # REST/HTTP API (placeholder)
└── sdk/              # Programmatic SDK (placeholder)
```

## CLI

The primary surface is the command-line interface:

```bash
npm run enoq
```

This starts an interactive REPL session.

## API (Future)

REST endpoints for external integration:

```
POST /v1/converse
POST /v1/session
GET  /v1/health
```

## SDK (Future)

Programmatic integration:

```typescript
import { ENOQ } from 'enoq-sdk';

const enoq = new ENOQ({ apiKey: '...' });
const response = await enoq.converse("Your message");
```

## Import Rules

```
runtime/ ← surfaces/
```

- **surfaces/** imports: `runtime/`
- **surfaces/** is imported by: nothing (top layer)

## Key Principle

Surfaces are **thin**. All logic lives in `runtime/`, `mediator/`, etc. Surfaces only handle:
- Input parsing
- Output formatting
- Transport protocols
