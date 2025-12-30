# ENOQ API

Thin HTTP wrapper over SDK. No logic, just exposure.

## Run

```bash
npx ts-node src/surfaces/api/server.ts
# or
npm run api
```

## Endpoints

### POST /mail

```bash
curl -X POST http://localhost:3000/mail \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "Manager",
    "context": "Requesting time off",
    "intent": "Get approval"
  }'
```

### POST /relation

```bash
curl -X POST http://localhost:3000/relation \
  -H "Content-Type: application/json" \
  -d '{
    "personA": "Me",
    "personB": "Partner",
    "context": "Family",
    "tension": "Work-life balance",
    "boundary": "No blame"
  }'
```

### POST /decision

```bash
curl -X POST http://localhost:3000/decision \
  -H "Content-Type: application/json" \
  -d '{
    "statement": "Whether to change jobs",
    "context": "Career"
  }'
```

### GET /health

```bash
curl http://localhost:3000/health
```

### GET /version

```bash
curl http://localhost:3000/version
```

## Response Format

```json
{
  "output": { ... },
  "rationale": "...",
  "signals": ["PERMIT", "ACT", "VERIFY", "STOP"],
  "stop": true,
  "compliance": { "passed": true, ... },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601",
    "duration_ms": 1234
  }
}
```

## Configuration

| Env Variable | Default | Description |
|-------------|---------|-------------|
| ENOQ_API_PORT | 3000 | Server port |
| ENOQ_API_HOST | 0.0.0.0 | Server host |
| ENOQ_RATE_LIMIT_MAX | 100 | Requests per window |
| ENOQ_RATE_LIMIT_WINDOW | 1 minute | Rate limit window |

## Requirements

Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`.
