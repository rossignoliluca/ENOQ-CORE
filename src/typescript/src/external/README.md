# external/

> **External Integrations** - Third-party services and storage.

## Purpose

External adapters for services outside ENOQ's core. Isolated to prevent vendor lock-in.

## Structure

```
external/
├── cache/            # LLM result caching (LRU)
├── connectors/       # External service adapters (placeholder)
├── providers/        # LLM providers (OpenAI, Anthropic)
└── storage/          # Persistence adapters (placeholder)
```

## LLM Providers

| Provider | File | Status |
|----------|------|--------|
| OpenAI | `providers/openai.ts` | Active |
| Anthropic | (planned) | Placeholder |

## Cache

```typescript
import { LLMDetectorCache } from './cache/llm_cache';

const cache = new LLMDetectorCache({
  max_size: 1000,
  ttl_ms: 3600000  // 1 hour
});
```

Features:
- SHA-256 hash keys (normalized input)
- LRU eviction
- TTL expiration
- Priority for short messages

## Import Rules

External is a **utility layer** - it can be imported by any layer that needs external services, but should not import from domain layers.

- **external/** imports: `interface/` (types only)
- **external/** is imported by: `operational/`, `runtime/`

## Adding New Providers

1. Create adapter in `providers/`
2. Implement common interface
3. Export from `index.ts`
4. Configure via environment variables
