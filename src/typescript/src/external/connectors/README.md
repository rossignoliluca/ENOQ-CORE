# ENOQ Connectors (P6)

Ingress/egress bridges to the world. Connectors don't think. They transport.

## Email Connector

Receive email payload → call SDK mail() → return drafts.

```typescript
import { processEmail } from './external/connectors';

const response = await processEmail({
  from: 'employee@company.com',
  to: 'manager@company.com',
  subject: 'Vacation request',
  body: 'I would like to request time off.',
});

if (response.success) {
  console.log(response.result.output.drafts);
}
```

### Email Payload

```typescript
interface EmailIngestPayload {
  from: string;      // Sender email
  to: string;        // Recipient context
  subject: string;   // Used as context
  body: string;      // Used as intent
  constraints?: string[];
  language?: string;
}
```

## Webhook Connector

Generic webhook for all runtimes.

```typescript
import { processWebhook } from './external/connectors';

const response = await processWebhook({
  runtime: 'mail',  // 'mail' | 'relation' | 'decision'
  input: {
    recipient: 'Manager',
    context: 'Work',
    intent: 'Request meeting',
  },
  idempotency_key: 'unique-key-123',  // Optional
});
```

### Webhook Payload

```typescript
interface WebhookPayload {
  runtime: 'mail' | 'relation' | 'decision';
  input: Record<string, unknown>;
  idempotency_key?: string;
  callback_url?: string;  // Reserved for future
}
```

### Webhook Response

```typescript
interface WebhookResponse {
  idempotency_key?: string;
  success: boolean;
  data?: unknown;
  error?: { code: string; message: string };
  meta: {
    request_id: string;
    runtime: string;
    timestamp: string;
    duration_ms: number;
  };
}
```

## Idempotency

Webhook connector supports idempotency via `idempotency_key`:
- Same key within 5 minutes returns cached response
- Cache is in-memory (resets on restart)
- No persistence (by design)

## Configuration

| Env Variable | Default | Description |
|-------------|---------|-------------|
| ENOQ_EMAIL_DEFAULT_LANG | en | Default language |
| ENOQ_EMAIL_MAX_BODY | 10000 | Max body length |

## What Connectors Do NOT Do

- No SMTP/email transport (external responsibility)
- No chat/streaming
- No memory or state
- No UI
- No authentication (handled by API layer)

## Architecture

```
External World
     │
     ▼
┌─────────────┐
│  Connector  │  ← Ingress (validate, transform)
└─────────────┘
     │
     ▼
┌─────────────┐
│    SDK      │  ← mail() / relation() / decision()
└─────────────┘
     │
     ▼
┌─────────────┐
│  Connector  │  ← Egress (format response)
└─────────────┘
     │
     ▼
External World
```
