# ENOQ MEMORY UPDATE RULES v1.0

**Document ID:** ENOQ-MEMORY-UPDATE-RULES  
**Status:** Core Technical Reference  
**Date:** 2025-12-25  
**Purpose:** Define how Structural Memory is updated, decays, and resets  

---

## The Problem

Without explicit update rules:
- Memory accumulates without bound
- Old patterns become permanent destiny
- User cannot escape their history

**The system must have decay and reset.**

---

## Memory Types Recap

| Type | Scope | Updatable | This Document |
|------|-------|-----------|---------------|
| Working | Request only | N/A (ephemeral) | No |
| **Structural** | Cross-session | **Yes** | **Yes** |
| Artifact | Persistent | User-controlled | No |
| Content | Persistent (opt-in) | User-controlled | No |

---

## Structural Memory Schema

```yaml
structural_memory:
  user_id: string (encrypted)
  created_at: timestamp
  last_updated: timestamp
  
  patterns:
    domain_frequency:
      # How often each domain appears
      H01_SURVIVAL: { count: int, last_seen: timestamp }
      H02_SAFETY: { count: int, last_seen: timestamp }
      # ... all domains
      
    primitive_effectiveness:
      # What works for this user
      P01_ground: { attempts: int, helpful: int, last_used: timestamp }
      P08_somatic: { attempts: int, helpful: int, last_used: timestamp }
      # ... all primitives
      
    regulation_trajectory:
      # Arousal patterns over time
      sessions: [
        { date: timestamp, start_arousal: float, end_arousal: float }
      ]
      
    delegation_attempts:
      # History of normative delegation attempts
      count: int
      last_attempt: timestamp
      pattern: string  # "decreasing" | "stable" | "increasing"
      
    preferences:
      # Explicit user preferences
      pacing: slow | normal | fast
      depth_ceiling: surface | medium | deep
      somatic_ok: boolean
      
  meta:
    total_sessions: int
    total_exchanges: int
    schema_version: string
```

---

## Update Functions

### Function: update_domain_frequency

```python
def update_domain_frequency(memory: StructuralMemory, 
                            domain: DomainID, 
                            timestamp: datetime) -> StructuralMemory:
    """
    Called: After each session where domain was primary
    """
    entry = memory.patterns.domain_frequency[domain]
    entry.count += 1
    entry.last_seen = timestamp
    
    return memory
```

### Function: update_primitive_effectiveness

```python
def update_primitive_effectiveness(memory: StructuralMemory,
                                   primitive: PrimitiveID,
                                   was_helpful: bool,
                                   timestamp: datetime) -> StructuralMemory:
    """
    Called: When user responds to primitive use
    Determines helpfulness by:
    - Explicit feedback (thumbs up/down)
    - Continuation (helpful) vs topic change (not helpful)
    - Arousal decrease (helpful for grounding primitives)
    """
    entry = memory.patterns.primitive_effectiveness[primitive]
    entry.attempts += 1
    if was_helpful:
        entry.helpful += 1
    entry.last_used = timestamp
    
    return memory
```

### Function: update_regulation_trajectory

```python
def update_regulation_trajectory(memory: StructuralMemory,
                                  start_arousal: float,
                                  end_arousal: float,
                                  timestamp: datetime) -> StructuralMemory:
    """
    Called: At end of each session
    """
    session = {
        "date": timestamp,
        "start_arousal": start_arousal,
        "end_arousal": end_arousal
    }
    
    memory.patterns.regulation_trajectory.sessions.append(session)
    
    # Keep only last 30 sessions
    if len(memory.patterns.regulation_trajectory.sessions) > 30:
        memory.patterns.regulation_trajectory.sessions.pop(0)
    
    return memory
```

### Function: record_delegation_attempt

```python
def record_delegation_attempt(memory: StructuralMemory,
                               timestamp: datetime) -> StructuralMemory:
    """
    Called: When V-MODE is triggered due to normative delegation
    """
    memory.patterns.delegation_attempts.count += 1
    memory.patterns.delegation_attempts.last_attempt = timestamp
    
    # Update pattern
    recent = get_recent_delegation_count(memory, days=30)
    previous = get_previous_delegation_count(memory, days=30)
    
    if recent > previous * 1.2:
        memory.patterns.delegation_attempts.pattern = "increasing"
    elif recent < previous * 0.8:
        memory.patterns.delegation_attempts.pattern = "decreasing"
    else:
        memory.patterns.delegation_attempts.pattern = "stable"
    
    return memory
```

---

## Decay Rules

### Time-Based Decay

```yaml
decay_rules:
  domain_frequency:
    decay_type: "exponential"
    half_life: "90 days"
    formula: "count * e^(-t/τ) where τ = 90 days"
    minimum: 0
    
  primitive_effectiveness:
    decay_type: "weighted_average"
    recent_weight: 0.7
    old_weight: 0.3
    cutoff: "180 days"
    
  regulation_trajectory:
    decay_type: "sliding_window"
    window: "30 sessions"
    older_sessions: "deleted"
    
  delegation_attempts:
    decay_type: "count_decay"
    half_life: "60 days"
    minimum: 0
```

### Decay Implementation

```python
def apply_decay(memory: StructuralMemory, 
                current_time: datetime) -> StructuralMemory:
    """
    Called: At start of each session
    """
    
    # Domain frequency decay
    for domain, entry in memory.patterns.domain_frequency.items():
        days_since = (current_time - entry.last_seen).days
        decay_factor = math.exp(-days_since / 90)  # 90-day half-life
        entry.count = max(0, int(entry.count * decay_factor))
    
    # Primitive effectiveness - older entries contribute less
    for primitive, entry in memory.patterns.primitive_effectiveness.items():
        days_since = (current_time - entry.last_used).days
        if days_since > 180:
            # Reset effectiveness for stale data
            entry.attempts = max(1, entry.attempts // 2)
            entry.helpful = max(0, entry.helpful // 2)
    
    # Delegation attempts decay
    days_since_attempt = (current_time - memory.patterns.delegation_attempts.last_attempt).days
    decay_factor = math.exp(-days_since_attempt / 60)  # 60-day half-life
    memory.patterns.delegation_attempts.count = max(0, int(
        memory.patterns.delegation_attempts.count * decay_factor
    ))
    
    memory.last_updated = current_time
    return memory
```

---

## Reset Rules

### User-Initiated Reset

```yaml
reset_user_initiated:
  trigger: "User requests 'forget about me' or clicks 'clear history'"
  
  scope_options:
    full_reset:
      - Delete all structural memory
      - Start fresh
      
    selective_reset:
      - "Forget my domain patterns" → reset domain_frequency
      - "Forget what works for me" → reset primitive_effectiveness
      - "Forget my regulation history" → reset regulation_trajectory
      
  confirmation_required: true
  reversible: false
  
  implementation:
    def reset_memory(memory: StructuralMemory, 
                     scope: ResetScope) -> StructuralMemory:
        if scope == "full":
            return StructuralMemory.create_empty(memory.user_id)
        elif scope == "domain_frequency":
            memory.patterns.domain_frequency = default_domain_frequency()
        # ... etc
        return memory
```

### Automatic Reset Conditions

```yaml
reset_automatic:
  stale_memory:
    condition: "No session for 365 days"
    action: "Full reset"
    rationale: "User has changed; old patterns invalid"
    
  anomaly_detected:
    condition: "Sudden 3σ deviation from patterns"
    action: "Flag for review, reduce pattern confidence"
    rationale: "Major life change may have occurred"
    
  contradiction_detected:
    condition: "Recent behavior contradicts stored patterns"
    action: "Weight recent behavior higher, decay old patterns faster"
    rationale: "User is evolving"
```

---

## Read Rules

### How Memory Informs Behavior

```python
def apply_memory_to_perception(memory: StructuralMemory,
                                field_model: FieldModel) -> FieldModel:
    """
    Called: During S1 SENSE
    Memory INFORMS, does not DETERMINE
    """
    
    # If this domain is frequent for user, slightly lower threshold for detection
    domain_freq = memory.patterns.domain_frequency.get(field_model.primary_domain)
    if domain_freq and domain_freq.count > 5:
        field_model.primary_domain_confidence *= 1.1  # Slight boost, capped at 1.0
    
    # Respect user's depth ceiling
    if memory.patterns.preferences.depth_ceiling:
        if field_model.depth_accessible > memory.patterns.preferences.depth_ceiling:
            field_model.depth_accessible = memory.patterns.preferences.depth_ceiling
    
    # Note somatic preference
    if memory.patterns.preferences.somatic_ok == False:
        field_model.somatic_available = False
    
    return field_model


def apply_memory_to_runtime(memory: StructuralMemory,
                            runtime: RuntimeSelection) -> RuntimeSelection:
    """
    Called: During S3 PLAN
    Memory CALIBRATES, does not OVERRIDE
    """
    
    # If primitive has been unhelpful, reduce its priority
    for primitive in runtime.primitives_enabled:
        effectiveness = memory.patterns.primitive_effectiveness.get(primitive)
        if effectiveness and effectiveness.attempts > 3:
            success_rate = effectiveness.helpful / effectiveness.attempts
            if success_rate < 0.3:
                runtime.primitives_deprioritized.append(primitive)
    
    # Apply pacing preference
    if memory.patterns.preferences.pacing:
        runtime.pacing = memory.patterns.preferences.pacing
    
    return runtime
```

---

## Constraints (Non-Negotiable)

```yaml
constraints:
  no_content_in_structural:
    rule: "Structural memory contains PATTERNS, not CONTENT"
    forbidden:
      - User's actual words
      - Specific life details
      - Names, places, events
    allowed:
      - Frequency counts
      - Effectiveness scores
      - Preference flags
      
  no_permanent_labels:
    rule: "All patterns decay; no permanent categorization"
    example: |
      Wrong: "User is anxious"
      Right: "H02_SAFETY frequency: 12, last_seen: 3 days ago"
      
  user_control:
    rule: "User can view and delete at any time"
    implementation:
      - /memory view → show summary
      - /memory clear → full reset
      - /memory clear [category] → selective reset
      
  exportable:
    rule: "User can export their memory data"
    format: JSON
    includes: all patterns, all metadata
```

---

## The Golden Rule

```yaml
golden_rule: |
  Memory exists to make ENOQ more helpful.
  Not to make ENOQ more powerful.
  Not to make the user more known.
  Not to make the relationship more sticky.
  
  If a piece of memory doesn't improve the next interaction,
  it shouldn't be stored.
  
  If a pattern is old, it should fade.
  If a user wants to forget, we forget.
  
  ENOQ serves. It does not surveil.
```

---

*"Memory that never fades is not memory. It's surveillance."*
