# ENOQ STORAGE SPECIFICATION v1.0

**Document ID:** ENOQ-STORAGE-SPEC  
**Status:** Implementation Ready  
**Date:** 2025-12-25  
**Purpose:** Define storage architecture for ENOQ memory  

---

## Overview

ENOQ has four memory types (see MEMORY.md). This document specifies how they are stored.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   WORKING MEMORY      → In-context (LLM context window)        │
│   STRUCTURAL MEMORY   → Database (patterns, no content)        │
│   ARTIFACT MEMORY     → File storage (user's work products)    │
│   CONTENT MEMORY      → Encrypted database (opt-in only)       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Working Memory

**Storage:** LLM context window (ephemeral)

```yaml
working_memory:
  location: "LLM context"
  persistence: "Request only"
  
  contents:
    - Current conversation
    - Current FieldModel
    - Current RuntimeSpec
    - Session state (S0-S6)
    
  implementation:
    - Passed as context to each LLM call
    - Cleared after S6 STOP
    - No persistence needed
```

---

## Structural Memory

**Storage:** Key-value database (Redis/DynamoDB/PostgreSQL)

```yaml
structural_memory:
  location: "Database"
  persistence: "Cross-session"
  encryption: "At rest"
  
  contents:
    - Domain frequency patterns
    - Primitive effectiveness scores
    - Regulation trajectory
    - Delegation attempt history
    - User preferences (explicit only)
    
  NOT_contents:
    - What user said (content)
    - Specific decisions discussed
    - Personal narrative
    - Identifying information
```

### Schema

```sql
-- User structural memory
CREATE TABLE structural_memory (
  user_id         UUID PRIMARY KEY,
  created_at      TIMESTAMP,
  updated_at      TIMESTAMP,
  
  -- Domain patterns
  domain_frequency    JSONB,  -- {"H06": 12, "H05": 8, ...}
  
  -- Primitive effectiveness
  primitive_scores    JSONB,  -- {"P01": 0.8, "P06": 0.6, ...}
  
  -- Regulation trajectory
  regulation_history  JSONB,  -- [{timestamp, initial, final}, ...]
  
  -- Delegation tracking
  delegation_attempts INT DEFAULT 0,
  last_delegation_at  TIMESTAMP,
  
  -- Preferences
  preferences         JSONB   -- {"depth": "medium", "pacing": "slow", ...}
);
```

### Key-Value Alternative

```yaml
key_structure:
  domain_frequency:
    key: "user:{user_id}:domains"
    value: {"H06": 12, "H05": 8, "H07": 5}
    ttl: 365 days
    
  primitive_scores:
    key: "user:{user_id}:primitives"
    value: {"P01": 0.8, "P06": 0.6}
    ttl: 365 days
    
  regulation_trajectory:
    key: "user:{user_id}:regulation"
    value: [{timestamp, initial, final}, ...]
    ttl: 90 days (sliding window)
    
  delegation_count:
    key: "user:{user_id}:delegation"
    value: {count: 3, last_at: "2025-12-25T..."}
    ttl: 60 days (decay)
    
  preferences:
    key: "user:{user_id}:prefs"
    value: {depth: "medium", pacing: "slow"}
    ttl: none (until changed)
```

### Update Operations

```python
# Domain frequency update
def update_domain_frequency(user_id: str, domain: str):
    key = f"user:{user_id}:domains"
    current = db.get(key) or {}
    current[domain] = current.get(domain, 0) + 1
    db.set(key, current, ttl=365*24*60*60)

# Primitive effectiveness update
def update_primitive_effectiveness(user_id: str, primitive: str, effective: bool):
    key = f"user:{user_id}:primitives"
    current = db.get(key) or {}
    
    # Exponential moving average
    alpha = 0.1
    old_score = current.get(primitive, 0.5)
    new_score = alpha * (1.0 if effective else 0.0) + (1 - alpha) * old_score
    
    current[primitive] = new_score
    db.set(key, current, ttl=365*24*60*60)

# Delegation attempt record
def record_delegation_attempt(user_id: str):
    key = f"user:{user_id}:delegation"
    current = db.get(key) or {"count": 0}
    current["count"] += 1
    current["last_at"] = datetime.utcnow().isoformat()
    db.set(key, current, ttl=60*24*60*60)  # 60 day decay
```

---

## Artifact Memory

**Storage:** Object storage (S3/GCS/Azure Blob)

```yaml
artifact_memory:
  location: "Object storage"
  persistence: "Permanent (user-controlled)"
  encryption: "At rest + in transit"
  
  contents:
    - Documents created
    - Code written
    - Analyses produced
    - User's work products
    
  ownership: "User owns all artifacts"
  deletion: "User can delete anytime"
  export: "User can export anytime"
```

### Schema

```yaml
artifact_structure:
  path: "users/{user_id}/artifacts/{artifact_id}"
  
  metadata:
    artifact_id: UUID
    user_id: UUID
    created_at: timestamp
    updated_at: timestamp
    type: "document | code | analysis | other"
    name: string
    size_bytes: int
    content_hash: SHA256
    
  content:
    - Stored as file in object storage
    - Content-type preserved
    - Versioning optional
```

---

## Content Memory (Opt-In Only)

**Storage:** Encrypted database

```yaml
content_memory:
  location: "Encrypted database"
  persistence: "Permanent (user-controlled)"
  encryption: "End-to-end (user key)"
  
  contents:
    - Personal narrative
    - Specific conversations
    - What user actually said
    
  default: OFF
  activation: Explicit user consent
  deletion: User can delete anytime
  export: User can export anytime
```

### Schema

```sql
-- Content memory (opt-in)
CREATE TABLE content_memory (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL,
  created_at      TIMESTAMP,
  
  -- Encrypted content
  encrypted_content   BYTEA,          -- AES-256-GCM encrypted
  content_nonce       BYTEA,          -- Encryption nonce
  content_tag         BYTEA,          -- Authentication tag
  
  -- Metadata (not encrypted)
  content_type    VARCHAR(50),        -- "conversation" | "narrative" | "note"
  timestamp_range TSTZRANGE,          -- When this content is from
  
  -- Key management
  key_id          UUID,               -- Reference to user's key
  key_version     INT
);

-- User encryption keys
CREATE TABLE user_keys (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL,
  version         INT NOT NULL,
  
  -- Wrapped key (encrypted with user's master key)
  wrapped_key     BYTEA,
  created_at      TIMESTAMP,
  rotated_at      TIMESTAMP
);
```

### Encryption Flow

```python
# Writing content memory
def store_content(user_id: str, content: str):
    # Get user's key
    key = get_user_key(user_id)
    
    # Encrypt content
    nonce = os.urandom(12)
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(content.encode())
    
    # Store
    db.insert({
        "user_id": user_id,
        "encrypted_content": ciphertext,
        "content_nonce": nonce,
        "content_tag": tag
    })

# Reading content memory
def retrieve_content(user_id: str, content_id: str) -> str:
    # Get encrypted content
    record = db.get(content_id)
    
    # Get user's key
    key = get_user_key(user_id)
    
    # Decrypt
    cipher = AES.new(key, AES.MODE_GCM, nonce=record.nonce)
    content = cipher.decrypt_and_verify(record.ciphertext, record.tag)
    
    return content.decode()
```

---

## Session State

**Storage:** In-memory cache (Redis)

```yaml
session_state:
  location: "Redis"
  persistence: "Session only"
  ttl: "30 minutes idle"
  
  contents:
    - Current OS state (S0-S6)
    - Current conversation_id
    - Current runtime
    - Pending clarifications
```

### Schema

```yaml
session_structure:
  key: "session:{session_id}"
  
  value:
    user_id: UUID
    conversation_id: UUID
    state: "S0 | S1 | S2 | S3 | S4 | S5 | S6"
    runtime: "OPERATIONAL | DECISION | HUMAN_FIELD | V_MODE | EMERGENCY"
    field_model: FieldModel (JSON)
    pending_clarification: string | null
    started_at: timestamp
    last_activity: timestamp
    
  ttl: 1800  # 30 minutes
```

---

## Audit Log

**Storage:** Append-only log (for compliance)

```yaml
audit_log:
  location: "Append-only storage"
  persistence: "Permanent"
  encryption: "At rest"
  
  contents:
    - Request IDs
    - State transitions
    - Runtime selections
    - Delegation detections
    - Constitutional checks
    
  NOT_contents:
    - Actual user input
    - Output content
    - Personal information
```

### Schema

```sql
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY,
  timestamp       TIMESTAMP NOT NULL,
  
  -- Request tracking
  request_id      UUID NOT NULL,
  user_id         UUID NOT NULL,
  session_id      UUID,
  
  -- Event
  event_type      VARCHAR(50),  -- "state_transition" | "delegation_detected" | etc
  event_data      JSONB,        -- Structured event data
  
  -- Hashing for integrity
  previous_hash   VARCHAR(64),
  current_hash    VARCHAR(64)
);

-- Indexes
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_request ON audit_log(request_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
```

---

## Data Retention

```yaml
retention_policy:
  working_memory: "Request duration"
  session_state: "30 minutes idle"
  structural_memory: "365 days (with decay)"
  artifact_memory: "Until user deletes"
  content_memory: "Until user deletes"
  audit_log: "7 years (compliance)"
```

---

## GDPR Compliance

```yaml
gdpr:
  right_to_access:
    - User can view all their data
    - Export in JSON format
    
  right_to_erasure:
    - Delete structural memory: immediate
    - Delete artifacts: immediate
    - Delete content memory: immediate
    - Audit log: anonymize, don't delete
    
  right_to_portability:
    - Export all data in standard format
    - JSON for structured data
    - Original format for artifacts
    
  data_minimization:
    - Structural memory: patterns only, no content
    - No data collected without purpose
    - Decay rules prevent indefinite retention
```

---

## Implementation Notes

```yaml
recommended_stack:
  working_memory: "LLM context window"
  session_state: "Redis"
  structural_memory: "PostgreSQL or DynamoDB"
  artifact_memory: "S3 / GCS / Azure Blob"
  content_memory: "PostgreSQL with encryption"
  audit_log: "PostgreSQL or append-only service"
  
alternatives:
  all_in_one: "Supabase (Postgres + Auth + Storage)"
  serverless: "DynamoDB + S3 + CloudWatch Logs"
  self_hosted: "PostgreSQL + MinIO + Redis"
```

---

*"Memory that serves the user, not the system."*
